/**
 * MENTORIX PREMIUM ROADMAP ENGINE V3 — MODERN INDUSTRY STANDARD
 *
 * Generates hiring-focused career roadmaps optimized for:
 * Resume Strength, Portfolio Quality, ATS Score, Interview Readiness, Hiring Probability
 *
 * Key features: AI/AIML track detection, level-specific templates,
 * sequential project evolution, resume impact scoring, portfolio-worthy naming,
 * recruiter quality gate, capstone enforcement, dynamic readiness scoring.
 *
 * @route POST /api/roadmap
 * @body { targetRole, careerGoal, currentLevel, weeklyHours, duration, startDate, targetCompany, focusAreas }
 * @returns {PremiumRoadmap} JSON roadmap
 */

import { NextRequest, NextResponse } from "next/server";
import { analyzeWithGroqLPU } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import { db } from "@/lib/db/db";
import { roadmapsTable, resumeAnalysisTable, careerGoalsTable, userSkillsTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";
import { eq, desc } from "drizzle-orm";

/** AI/AIML role patterns for modern AI track detection */
const AI_ROLES = [
    "ai engineer", "ai/ml", "aiml", "generative ai", "applied ai",
    "llm engineer", "ml engineer", "machine learning engineer",
    "ai developer", "ai architect",
];

export async function POST(req: NextRequest) {
    try {
        const ip = getRequestIP(req);
        const { limited, resetIn } = checkRateLimit(`roadmap:${ip}`, AI_RATE_LIMIT);
        if (limited) {
            return NextResponse.json(
                { error: `Too many requests. Try again in ${resetIn}s.` },
                { status: 429 }
            );
        }

        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;
        if (!userEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { targetRole, careerGoal, currentLevel, weeklyHours, duration, startDate, targetCompany, focusAreas } = body;

        if (!targetRole || !duration || !currentLevel) {
            return NextResponse.json({ error: "Target role, duration, and skill level are required" }, { status: 400 });
        }

        const roleLower = targetRole.toLowerCase();
        const isAiTrack = AI_ROLES.some((r) => roleLower.includes(r));

        // ---- Resume intelligence ----
        let resumeContext = "", analysisMissingSkills: string[] = [], analysisCriticalGaps: string[] = [];
        let analysisProjectWeaknesses: string[] = [], analysisScore = 0;
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
                resumeContext = `Score:${analysisScore}/100 Missing:${analysisMissingSkills.join(",")||"none"} Gaps:${analysisCriticalGaps.join(",")||"none"} WeakProjects:${analysisProjectWeaknesses.join(",")||"none"}`;
            }
        } catch (e) { console.warn("[Roadmap] Resume fetch error:", e); }

        // ---- Career goals ----
        let careerRole = targetRole, careerCompanies = targetCompany || "";
        try {
            const [goals] = await db.select().from(careerGoalsTable).where(eq(careerGoalsTable.userEmail, userEmail)).limit(1);
            if (goals) {
                if (!targetRole && goals.targetRole) careerRole = goals.targetRole;
                if (!targetCompany && goals.targetCompanies) careerCompanies = goals.targetCompanies;
            }
        } catch (e) { console.warn("[Roadmap] Goals fetch error:", e); }

        // ---- Profile skills ----
        let profileExistingSkills: string[] = [];
        try {
            const skills = await db.select().from(userSkillsTable).where(eq(userSkillsTable.userEmail, userEmail));
            profileExistingSkills = skills.map(s => s.skillName);
        } catch (e) { console.warn("[Roadmap] Skills fetch error:", e); }
        const combinedExistingSkills = profileExistingSkills;

        // ---- Duration parsing ----
        const durationMatch = duration.match(/(\d+)\s*(Week|Month|Year)/i);
        let totalWeeks = 12;
        if (durationMatch) {
            const num = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();
            if (unit.startsWith("month")) totalWeeks = num * 4;
            else if (unit.startsWith("year")) totalWeeks = num * 48;
            else totalWeeks = num;
        }
        totalWeeks = Math.min(Math.max(totalWeeks, 4), 52);

        // ---- Date ranges ----
        let formattedStartDate = "TBD", formattedEndDate = "TBD";
        try {
            const start = startDate ? new Date(startDate) : new Date();
            formattedStartDate = start.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
            const end = new Date(start);
            end.setDate(end.getDate() + totalWeeks * 7);
            formattedEndDate = end.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
        } catch (e) { console.warn("[Roadmap] Date error:", e); }

        const estimatedHours = parseInt(weeklyHours) || 10;

        // ---- Focus areas ----
        const roleFocusMap: Record<string, string> = {
            frontend: "React, Next.js, Perf, System Design",
            backend: "APIs, Databases, Scalability, Caching",
            ai: "LLMs, RAG, Agents, LangGraph, MCP, Vector DBs, Embeddings, Prompt Eng, Eval, MLOps, Docker, K8s, CI/CD, Monitoring",
            devops: "Docker, K8s, AWS, CI/CD, Infra",
            "full stack": "Frontend, Backend, DB, DevOps",
            "data science": "Python, Stats, ML, Data Eng, Viz",
            mobile: "React Native, iOS, Android, Perf",
        };
        const defaultFocus = Object.entries(roleFocusMap).find(([k]) => roleLower.includes(k))?.[1] || "Core Skills, Projects, System Design, Interview Prep";
        const focusList = focusAreas ? focusAreas.split(",").map((f: string) => f.trim()).filter(Boolean) : [];
        const roleFocus = focusList.length > 0 ? focusList.join(", ") : defaultFocus;

        // ---- Company guide ----
        const companyGuideMap: Record<string, string> = {
            google: "DSA, System Design, Distributed Systems, scalability.",
            amazon: "Leadership Principles, Scalable Systems, Backend, metrics-driven.",
            meta: "Full-Stack, Frontend Architecture, React, products at scale.",
            microsoft: "System Design, Azure, Enterprise Software.",
            netflix: "Microservices, Cloud-Native, Resilience, high-traffic.",
            uber: "Distributed Systems, Real-Time Data, GeoSpatial.",
            atlassian: "Dev Tools, API Design, Microservices, workflows.",
        };
        const companyGuide = Object.entries(companyGuideMap).find(([k]) => targetCompany?.toLowerCase().includes(k))?.[1] || "";

        // ===================================================================
        // SYSTEM PROMPT — V3 MODERN INDUSTRY STANDARD
        // ===================================================================
        const systemPrompt = `You are a Senior Career Strategist & FAANG Hiring Manager. Generate a HIRING-FOCUSED CAREER STRATEGY — NOT an academic syllabus.

Optimize for: Resume Strength, Portfolio Quality, ATS Score, Interview Readiness, Company Readiness, Hiring Probability.

Be concise. Use bullet points and brief descriptions. Keep each milestone/project description to 1-2 sentences max.

## USER
Role:${targetRole} Goal:${careerGoal||"Hired as "+targetRole}${targetCompany?" at "+targetCompany:""}
Level:${currentLevel} Duration:${duration}(${totalWeeks}wks) Hours:${weeklyHours||10}/wk
Focus:${roleFocus} ${isAiTrack?"AI Track: YES":"AI Track: NO"}
${resumeContext?"Resume: "+resumeContext:""}${combinedExistingSkills.length>0?" Skills:"+combinedExistingSkills.slice(0,10).join(","):""}${analysisProjectWeaknesses.length>0?" WeakProjects:"+analysisProjectWeaknesses.join(","):""}${companyGuide?" CompanyGuide:"+companyGuide:""}

## CORE RULES
1. Priority: Company → Career Goal → Focus Areas → Resume → Topic
2. NEVER generate a generic roadmap from Topic alone
3. Projects MUST build sequentially (each week extends previous)
4. Be CONCISE — no verbose descriptions

## WEEK TOPIC GENERATION RULES
For EVERY week milestone, generate 8-15 DETAILED learning topics under "learningGoals".

FORBIDDEN generic topics:
❌ "X Basics" (e.g., Python Basics, ML Basics, RAG Basics, Docker Basics)
❌ "X Fundamentals" (e.g., Python Fundamentals, ML Fundamentals)
❌ "Introduction to X" (e.g., Intro to Python, Intro to RAG)

REQUIRED format — specific, detailed, numbered topics:
✅ "Variables and Data Types" (not "Python Basics")
✅ "Conditional Statements (if/else/elif)" (not "Control Flow")
✅ "RAG Retrieval Strategies — Sparse vs Dense" (not "RAG Basics")
✅ "Docker Compose for Multi-Container Apps" (not "Docker Basics")
✅ "LangGraph StateGraph and Node Orchestration" (not "LangGraph Intro")

Each topic should be specific enough that a learner knows EXACTLY what they'll study. Include tool/framework names in the topic where applicable.

Estimated study time per week: Calculate dynamically based on topic count and depth. E.g., 10-12 topics = ~8-12 hours, 13-15 topics + deep/difficult topics = ~12-16 hours. More complex/hands-on weeks get more hours. Never hardcode a single value for all weeks.

${isAiTrack?`## AI/AIML CONSTRAINTS
FORBIDDEN (unless Beginner): CNN, RNN, LSTM, MNIST, CartPole, Q-Learning, GANs, Sentiment Analysis, generic NLP tutorials, academic AI
REQUIRED 70%+: LLM Eng, RAG, Agents(LangGraph,CrewAI,MCP), Vector DBs, Embeddings, Eval(RAGAS,DeepEval), Memory, Search, Observability, Prompt Eng, MLOps(DVC,MLflow), Docker, K8s, CI/CD, Production AI, AI System Design
TIERS: Tier1(70%+) LLM,RAG,Agents,LangGraph,MCP,VDB,Embeddings,Prompt,Eval,MLOps,Docker,K8s,CI/CD,Monitoring — Tier2(~30%) DL,NLP,RecSys,CV — Tier3(only if asked) RL,GANs,Ethics,Robotics
`:""}

## LEVEL TEMPLATE (${currentLevel})
${currentLevel==="Beginner"?`Track:Python→ML→DL→Transformers→RAG. Split:60%fundamentals/30%projects/10%interview.
Content:Python(NumPy,Pandas),ML basics,DL basics,Transformers,LLM APIs.
Projects last 40%:guided→simple RAG.
FORBIDDEN early:K8s,MCP,LangGraph,Multi-Agent,Enterprise AI.
Gradually introduce advanced in final 25%.`:currentLevel==="Intermediate"?`Track:ProdML→RAG→Agents→Deployment→MLOps. Split:40%skill/40%projects/20%interview.
Content:ML pipelines,RAG,Agents(tools,memory),Docker deployment.
Projects last 60%:prod RAG→Agents→Containerize→Monitor.
SKIP:Python basics,ML intros,academic theory,CNN/RNN tutorials.`:`Track:Enterprise AI→Multi-Agent→SystemDesign→K8s→Observability→Distributed. Split:20%learning/60%building/20%systemDesign.
Content:Enterprise RAG(hybrid,re-rank),Multi-Agent(LangGraph,MCP),K8s,distributed systems.
Projects last 80%:distributed AI platform→multi-agent→K8s→load testing→enterprise capstone.
SKIP ALL:Python,ML basics,tutorials,simple RAG,basic agents,intro Docker,CNN/RNN/MNIST/CartPole. Every week = Senior AI Engineer prep.`}

## PROJECT RULES
Each project: real problem, portfolio-worthy, improves hiring, has measurable outcomes, increases ATS.
Output per milestone: name(objective,techStack,difficulty,resumeValue,interviewTopics,expectedOutcome).
resumeImpact: Low(tutorial) | Medium(prototype) | High(production) | Very High(enterprise: K8s,multi-agent,RAG+eval,capstone).
NO generic names like "Agent System","Platform","Search Engine","Chat App","Data Pipeline".
USE names like: Enterprise Knowledge Assistant, AI Career Copilot, Multi-Agent Research Assistant, Autonomous Business Analyst, Production RAG Engine, Vector Search Platform, Agentic Workflow Orchestrator, AI Operations Hub.

## EVOLUTION (${currentLevel})
${currentLevel==="Beginner"?`W1-4:Python→Data→ML→Eval. W5-8:DL→Transformer→Embeddings→RAG. W9-12:RAG→LLMs→Prompt→Agent. W13-16:Agent→Memory→Deploy→Capstone. No K8s/MCP/LangGraph until W12+.`:currentLevel==="Intermediate"?`W1-4:MLPipe→FeatureStore→Serving→RAG. W5-8:RAG→Eval→Agent→Multi-Agent. W9-12:Docker→API→CI/CD→Monitor. W13-16:ProdSystem→LoadTest→Optimize→Capstone. Skip Python/ML intros.`:`W1-4:EnterpriseRAG→HybridSearch→Multi-Agent→MCP. W5-8:LangGraph→Distributed→Memory→Platform. W9-12:Docker→K8s→Observability→LoadTest. W13-16:SystemDesign→Security→Optimize→EnterpriseCapstone. Skip ALL fundamentals.`}

## OUTPUT
Return ONLY JSON. No markdown, no code fences, no commentary.

{
  "header": {
    "roadmapTitle": "${targetCompany?targetCompany+" ":""}${targetRole} — Hiring Strategy in ${duration}",
    "professionalOverview": "2-3 sentences emphasizing hiring impact",
    "targetRole": "${targetRole}",
    "targetCompany": "${targetCompany||""}",
    "currentLevel": "${currentLevel}",
    "weeklyCommitment": "${weeklyHours||10} hrs/wk",
    "startDate": "${formattedStartDate}",
    "expectedCompletionDate": "${formattedEndDate}",
    "totalDuration": "${duration} (${totalWeeks}wks)",
    "estimatedOutcome": "Capability after completion"
  },
  "milestones": [{
    "weekNumber": 1,
    "dateRange": "calculated",
    "theme": "short theme",
    "learningGoals": ["g1"],
    "skillsCovered": ["s1"],
    "projectToBuild": {"name":"","objective":"","techStack":[],"difficulty":"","resumeValue":"","interviewTopics":[],"expectedOutcome":""},
    "resumeImpact":"Medium",
    "interviewTopics":[],
    "expectedDeliverable":"",
    "estimatedHours":${estimatedHours},
    "estimatedStudyTime":"10-14 hours (calculated per week)",
    "handsOnTasks":["Build X","Implement Y"],
    "interviewFocus":["Focus 1","Focus 2","Focus 3"]
  }],
  "checkpoints": [{"weekNumber":4,"assessment":"","skillReview":[],"portfolioReview":"","resumeReview":"","mockInterview":"","gapAnalysis":[],"roadmapAdjustment":""}],
  "tips":["tip1","tip2","tip3"],
  "finalCapstone":{"projectName":"","objective":"","techStack":[],"expectedOutcome":"Production-ready deployable project"},
  "finalSummary":{
    "companyReadinessScore":0-100,"roleReadinessScore":0-100,"interviewReadinessScore":0-100,
    "portfolioStrength":"Weak|Moderate|Strong|Exceptional","atsReadiness":0-100,
    "topStrengths":[],"topWeaknesses":[],"criticalMissingSkills":[],
    "estimatedHiringProbability":"Low|Medium|High|Very High"
  }
}

## CAPSTONE
Must: solve real business problem, be production-ready, deployable, use modern AI, include monitoring, include deployment(Docker).
FORBIDDEN: Chatbot, Sentiment Analyzer, Image Classifier, Basic Rec Engine.
ALLOWED: Enterprise Knowledge Assistant, AI Career Copilot, Autonomous Research Agent, AI Ops Platform, Multi-Agent Business Assistant.

## QUALITY GATE
"Would this roadmap impress a recruiter in 2026?" If NO → regenerate.
Feels like: Senior Career Strategist. NOT: University Professor.

## READINESS SCORING
Scores MUST be dynamic based on level+skills+projects+experience. NEVER static.
Beginner: 20-40% | Intermediate: 40-70% | Advanced: 70-90%
Scores = CURRENT readiness (before roadmap). Roadmap IS the improvement path. Do NOT inflate scores.
Hiring probability: Beginner→Low/Med only. Intermediate→Low/Med/High. Advanced→Med/High/VeryHigh(if resume>70).
NEVER: 90%+ for everyone, Very High for beginners, same scores across levels, ignore skill gaps.

## STRICT RULES
1. Generate EXACTLY ${totalWeeks} milestones. 2. Checkpoints every 4 weeks. 3. Unique content per week. 4. Difficulty: ${currentLevel==="Beginner"?"Beginner→Int→Adv":currentLevel==="Intermediate"?"Int→Adv":"Adv→Expert"}. 5. Projects build on previous. 6. Accurate dates from ${formattedStartDate}. 7. Use ${currentLevel} template only. 8. ${combinedExistingSkills.length>0?"Build on existing: "+combinedExistingSkills.slice(0,8).join(","):""} 9. Hiring strategy, NOT curriculum. 10. Every recommendation improves employability.${isAiTrack?" 11. Apply AI/AIML constraints.":""}
`;

        const userPrompt = `Generate a ${totalWeeks}-week ${currentLevel} level ${targetRole} roadmap. ${isAiTrack ? "AI track - no CNN/RNN/MNIST, 70%+ modern topics." : ""}
Timeline: ${duration}. Hours: ${weeklyHours||10}/wk. Start: ${formattedStartDate}.${targetCompany?" Target:"+targetCompany:""}${combinedExistingSkills.length>0?" Skills:"+combinedExistingSkills.join(","):""}
Strictly use the ${currentLevel} template. Be concise. JSON only.`;

        const responseData = await analyzeWithGroqLPU([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], {
            model: MODELS.GROQ_PRIMARY,
            response_format: { type: "json_object" },
            max_tokens: Math.min(6000, totalWeeks * 250 + 1000),
            temperature: 0.3
        });

        if (!responseData?.choices?.[0]?.message?.content) {
            throw new Error("Invalid response from AI provider");
        }

        const aiOutput = JSON.parse(responseData.choices[0].message.content);

        const inserted = await db.insert(roadmapsTable).values({
            userEmail: userEmail,
            targetField: targetRole,
            roadmapData: JSON.stringify(aiOutput)
        }).returning();

        return NextResponse.json({ ...aiOutput, id: inserted[0].id });

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
