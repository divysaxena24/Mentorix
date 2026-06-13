import { NextRequest, NextResponse } from "next/server";
import { analyzeWithGroqLPU } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import { db } from "@/lib/db/db";
import { roadmapsTable, resumeAnalysisTable, careerGoalsTable, userSkillsTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";
import { eq, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const ip = getRequestIP(req);
        const { limited, resetIn } = checkRateLimit(`roadmap:${ip}`, AI_RATE_LIMIT);
        if (limited) {
            return NextResponse.json(
                { error: `Too many requests. Please try again in ${resetIn} seconds.` },
                { status: 429 }
            );
        }

        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            targetRole,
            careerGoal,
            currentLevel,
            weeklyHours,
            duration,
            startDate,
            targetCompany,
        } = body;

        if (!targetRole || !duration || !currentLevel) {
            return NextResponse.json({ error: "Target role, duration, and skill level are required" }, { status: 400 });
        }

        // ---- Fetch user's latest resume analysis for personalized gaps ----
        let resumeContext = "";
        let analysisMissingSkills: string[] = [];
        let analysisCriticalGaps: string[] = [];
        let analysisProjectWeaknesses: string[] = [];
        let analysisScore = 0;

        try {
            const [latestAnalysis] = await db.select()
                .from(resumeAnalysisTable)
                .where(eq(resumeAnalysisTable.userEmail, userEmail))
                .orderBy(desc(resumeAnalysisTable.createdAt))
                .limit(1);

            if (latestAnalysis?.analysisData) {
                const parsed = JSON.parse(latestAnalysis.analysisData);
                analysisScore = parsed.score || 0;
                analysisMissingSkills = parsed.missingKeywords || parsed.atsKeywordAnalysis?.missingKeywords || [];
                analysisCriticalGaps = parsed.criticalGaps || [];
                analysisProjectWeaknesses = (parsed.projectAnalysis || [])
                     .filter((p: any) => (p.technicalComplexity || 0) < 40)
                     .map((p: any) => p.projectName || "Untitled");

                resumeContext = `
--- RESUME INTELLIGENCE DATA ---
Overall Resume Score: ${analysisScore}/100
Missing Keywords/Skills: ${analysisMissingSkills.join(", ") || "None detected"}
Critical Gaps: ${analysisCriticalGaps.join(", ") || "None detected"}
Weak Projects (score < 40): ${analysisProjectWeaknesses.join(", ") || "None detected"}
--------------------------------`;
            }
        } catch (e) {
            console.warn("[Roadmap] Could not fetch resume analysis:", e);
        }

        // ---- Fetch career goals for additional context ----
        let careerRole = targetRole;
        let careerCompanies = targetCompany || "";
        try {
            const [goals] = await db.select()
                .from(careerGoalsTable)
                .where(eq(careerGoalsTable.userEmail, userEmail))
                .limit(1);

            if (goals) {
                if (!targetRole && goals.targetRole) careerRole = goals.targetRole;
                if (!targetCompany && goals.targetCompanies) careerCompanies = goals.targetCompanies;
            }
        } catch (e) {
            console.warn("[Roadmap] Could not fetch career goals:", e);
        }

        // ---- Fetch existing skills from profile ----
        let profileExistingSkills: string[] = [];
        try {
            const skills = await db.select()
                .from(userSkillsTable)
                .where(eq(userSkillsTable.userEmail, userEmail));

            profileExistingSkills = skills.map(s => s.skillName);
        } catch (e) {
            console.warn("[Roadmap] Could not fetch skills:", e);
        }

        // Combine user-provided existing skills with profile skills
        const combinedExistingSkills = profileExistingSkills;

        // ---- Parse duration to weeks ----
        const durationMatch = duration.match(/(\d+)\s*(Week|Month|Year)/i);
        let totalWeeks = 12;
        if (durationMatch) {
            const num = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();
            if (unit.startsWith("month")) totalWeeks = num * 4;
            else if (unit.startsWith("year")) totalWeeks = num * 48;
            else totalWeeks = num;
        }
        totalWeeks = Math.min(Math.max(totalWeeks, 4), 52); // Clamp between 4-52 weeks

        // ---- Calculate date ranges ----
        let startDateStr = startDate || "today";
        let formattedStartDate = "TBD";
        let formattedEndDate = "TBD";
        try {
            const start = startDate ? new Date(startDate) : new Date();
            formattedStartDate = start.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
            const end = new Date(start);
            end.setDate(end.getDate() + totalWeeks * 7);
            formattedEndDate = end.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
            startDateStr = formattedStartDate;
        } catch (e) {
            console.warn("[Roadmap] Could not parse start date:", e);
        }

        const estimatedHours = parseInt(weeklyHours) || 10;

        // ---- Build role-specific focus areas ----
        const roleFocusMap: Record<string, string> = {
            "frontend": "React, Next.js, Performance, System Design, Projects",
            "backend": "APIs, Databases, Scalability, Caching, Projects",
            "ai": "Machine Learning, Deep Learning, LLMs, RAG, MLOps, Projects",
            "devops": "Docker, Kubernetes, AWS, CI/CD, Infrastructure, Projects",
            "full stack": "Frontend, Backend, Databases, DevOps, Projects",
            "data science": "Python, Statistics, ML, Data Engineering, Visualisation, Projects",
            "mobile": "React Native, iOS, Android, Performance, Projects",
        };
        const roleLower = targetRole.toLowerCase();
        const roleFocus = Object.entries(roleFocusMap).find(([key]) => roleLower.includes(key))?.[1] || "Core Skills, Projects, System Design, Interview Prep";

        // ---- Company-specific customization ----
        const companyGuideMap: Record<string, string> = {
            "google": "Strong emphasis on DSA, System Design, Distributed Systems, and building high-impact projects that showcase scalability.",
            "amazon": "Focus on Leadership Principles, Scalable Systems, Backend Engineering, and metrics-driven project outcomes.",
            "meta": "Emphasis on Full-Stack, Frontend Architecture, React/React Native, and building products at scale.",
            "microsoft": "Focus on System Design, Cloud (Azure), Enterprise Software, and collaborative project architecture.",
            "netflix": "Emphasis on Microservices, Cloud-Native Architecture, Resilience Patterns, and high-traffic system design.",
            "uber": "Focus on Distributed Systems, Real-Time Data Processing, GeoSpatial Systems, and high-scale backend design.",
            "atlassian": "Emphasis on Developer Tools, API Design, Microservices, and collaborative project workflows.",
        };
        const companyLower = targetCompany?.toLowerCase() || "";
        const companyGuide = Object.entries(companyGuideMap).find(([key]) => companyLower.includes(key))?.[1] || "";

        // ===================================================================
        // PREMIUM SYSTEM PROMPT
        // ===================================================================
        const systemPrompt = `You are Mentorix, an elite Senior Career Strategist, FAANG Hiring Manager, and Technical Curriculum Designer.

Your job is to generate a premium, personalized Career Roadmap that feels like it was crafted by an experienced mentor who deeply understands the user's target role, skill gaps, and career aspirations.

## CAREER GOAL
${careerGoal || `Get hired as a ${targetRole}${targetCompany ? " at " + targetCompany : ""} and build a strong portfolio.`}

## ROADMAP PHILOSOPHY
- Every week must produce something TANGIBLE. No "Learn X" — instead "Build Y while learning X".
- The roadmap must be PROJECT-DRIVEN: every major skill connects to a specific project.
- Complexity must increase week over week. No repetitive content.
- Be DATE-AWARE: every milestone has a proper date range based on the start date.

## ROLE-SPECIFIC CUSTOMIZATION
Target Role: ${targetRole}
Focus Areas: ${roleFocus}

${companyGuide ? `## TARGET COMPANY CUSTOMIZATION\nTarget Company: ${targetCompany}\nCompany Guide: ${companyGuide}` : ""}

## RESUME INTELLIGENCE INTEGRATION
${resumeContext || "No resume data available — generate a well-rounded roadmap."}
${
    combinedExistingSkills.length > 0
        ? `\nUser's existing profile skills (build upon these): ${combinedExistingSkills.join(", ")}`
        : ""
}
${
    analysisProjectWeaknesses.length > 0
        ? `\nThese projects were scored as weak — include improvements or rebuilds of similar projects: ${analysisProjectWeaknesses.join(", ")}`
        : ""
}

## OUTPUT STRUCTURE
Return ONLY valid JSON. No markdown, no code fences, no commentary.

{
  "header": {
    "roadmapTitle": "Compelling title e.g. 'Master ${targetRole} Engineering at ${targetCompany || "Top Tech"} in ${duration}'",
    "professionalOverview": "2-3 sentence overview of what this roadmap achieves and why it's structured this way",
    "targetRole": "${targetRole}",
    "targetCompany": "${targetCompany || ""}",
    "currentLevel": "${currentLevel}",
    "weeklyCommitment": "${weeklyHours || "10"} hours/week",
    "startDate": "${formattedStartDate}",
    "expectedCompletionDate": "${formattedEndDate}",
    "totalDuration": "${duration} (${totalWeeks} Weeks)",
    "estimatedOutcome": "What the user will be capable of after completing this roadmap"
  },
  "milestones": [
    {
      "weekNumber": 1,
      "dateRange": "Calculated date range for this week",
      "milestoneTitle": "Unique milestone title for this week",
      "objective": "What this week aims to achieve",
      "difficulty": "Beginner | Intermediate | Advanced",
      "estimatedHours": ${estimatedHours},
      "learningFocus": ["Topic 1", "Topic 2", "Topic 3"],
      "actionableTasks": [
        "Complete Kaggle Python Course",
        "Build Data Cleaning Pipeline",
        "Practice 10 Pandas Exercises"
      ],
      "buildThisWeek": "A specific, tangible project for this week",
      "resources": {
        "courses": ["Specific course name + platform"],
        "docs": ["Specific documentation link or name"],
        "videos": ["Specific video title + channel"],
        "articles": ["Specific article title + publication"]
      },
      "expectedOutcome": ["Understand X", "Be able to build Y", "Master concept Z"],
      "resumeImpact": "Low | Medium | High",
      "interviewTopicsCovered": ["Topic 1", "Topic 2"]
    }
  ],
  "checkpoints": [
    {
      "weekNumber": 4,
      "title": "Week 4 Assessment: [Topic] Checkpoint",
      "quiz": ["Question 1", "Question 2", "Question 3"],
      "miniProject": "Mini project that validates skills learned so far",
      "skillValidation": ["Skill 1", "Skill 2"],
      "progressReview": "2-3 sentence review of what should have been achieved and what to focus on next"
    }
  ],
  "tips": [
    "Elite career tip 1",
    "Elite career tip 2",
    "Elite career tip 3"
  ],
  "finalSummary": {
    "skillsGained": ["Skill 1", "Skill 2", "Skill 3"],
    "projectsBuilt": ["Project 1", "Project 2", "Project 3"],
    "interviewAreasCovered": ["DSA", "System Design", "Behavioral"],
    "resumeImprovements": ["Bullet point rewrite guidance", "New project additions", "Keyword optimization"],
    "expectedReadinessScore": 82,
    "readinessTarget": "${targetRole}${targetCompany ? " at " + targetCompany : ""}"
  }
}

## STRICT GENERATION RULES
1. Generate EXACTLY ${totalWeeks} milestones (one per week).
2. Generate a checkpoint EVERY 4 weeks (weeks 4, 8, 12, etc.).
3. Each milestone must have UNIQUE content — no two weeks should cover the same topics.
4. The "buildThisWeek" field must be a real, specific project (not "Build a Project").
5. Resources must be HYPER-SPECIFIC (e.g., "Andrew Ng's Machine Learning Specialization on Coursera" not "Online Course").
6. Difficulty must progress naturally from ${currentLevel === "Beginner" ? "Beginner → Intermediate → Advanced" : currentLevel === "Intermediate" ? "Intermediate → Advanced" : "Advanced → Expert"}.
7. ${combinedExistingSkills.length > 0 ? `Build upon existing profile skills rather than repeating them: ${combinedExistingSkills.slice(0, 10).join(", ")}` : ""}
8. Date ranges must be accurate based on start date ${formattedStartDate} and weekly increments.
9. Interview topics must be role-specific and increase in complexity.`;

        const userPrompt = `Generate a premium career roadmap for a ${currentLevel} level ${targetRole} engineer.

Timeline: ${duration} (${totalWeeks} weeks)
Weekly Commitment: ${weeklyHours || "10"} hours/week
Start Date: ${formattedStartDate}
${targetCompany ? `Target Company: ${targetCompany}` : ""}
${combinedExistingSkills.length > 0 ? `Existing profile skills: ${combinedExistingSkills.join(", ")}` : ""}

The roadmap must be project-driven, date-aware, and outcome-focused. Every week must include a specific project to build. Generate exactly ${totalWeeks} weekly milestones.`;

        const responseData = await analyzeWithGroqLPU([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], {
            model: MODELS.GROQ_PRIMARY,
            response_format: { type: "json_object" },
            max_tokens: 8192,
            temperature: 0.4
        });

        if (!responseData?.choices?.[0]?.message?.content) {
            throw new Error("Invalid response from AI provider");
        }

        const aiOutput = JSON.parse(responseData.choices[0].message.content);

        // Save to Database
        const inserted = await db.insert(roadmapsTable).values({
            userEmail: userEmail,
            targetField: targetRole,
            roadmapData: JSON.stringify(aiOutput)
        }).returning();

        return NextResponse.json({
            ...aiOutput,
            id: inserted[0].id
        });

    } catch (error: unknown) {
        console.error("Roadmap Generation Error:", error);
        const err = error as { status?: number; message?: string; error?: { message?: string } };
        const statusCode = err.status || 500;
        const groqErrorMessage = err.error?.message || err.message;
        return NextResponse.json({
            error: groqErrorMessage || "Failed to generate roadmap",
            details: err.message
        }, { status: statusCode });
    }
}
