import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import {
    userProfilesTable,
    professionalLinksTable,
    userSkillsTable,
    userProjectsTable,
    careerGoalsTable,
    profileInsightsTable,
    userEducationTable,
    userExperienceTable,
    userAchievementsTable,
    roadmapsTable,
    coursesTable,
    writingStudioDocsTable,
    resumeAnalysisTable,
    resumesTable,
    chatHistoryTable
} from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { count, eq } from "drizzle-orm";
// @ts-ignore - Turbopack cache bust
import { analyzeWithGroqLPU } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import pdf from "pdf-parse-fork";
import { ProfileWithRelations } from "@/types";
import { getFullUserProfile } from "@/lib/db/profile";

export async function GET(req: NextRequest) {
    try {
        const clerkUser = await currentUser();
        const userEmail = clerkUser?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profileData = await getFullUserProfile(userEmail);
        return NextResponse.json(profileData);

    } catch (error: unknown) {
        console.error("Profile Fetch Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("resume") as File;

        if (!file) {
            return NextResponse.json({ error: "No resume provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // --- AWS S3 Integration for Durable Artifact Storage ---
        try {
            const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
            const s3 = new S3Client({
                region: process.env.MY_AWS_REGION || "us-east-1",
                credentials: {
                    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID || "",
                    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY || "",
                }
            });
            const s3Key = `resumes/${userEmail}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            await s3.send(new PutObjectCommand({
                Bucket: process.env.MY_AWS_S3_BUCKET_NAME || "mentorix-resumes-bucket",
                Key: s3Key,
                Body: buffer,
                ContentType: file.type || "application/pdf",
                Metadata: {
                    uploadedBy: userEmail,
                }
            }));
            console.log(`[AWS S3] Successfully archived resume to ${s3Key}`);
        } catch (s3Error) {
            console.error("[AWS S3 Warning] Failed to upload resume to S3, but continuing analysis:", s3Error);
            // We don't want to break the pipeline if S3 isn't cleanly configured yet, 
            // but deploying with S3 increases the AWS native service footprint
        }
        // --------------------------------------------------------

        const pdfData = await pdf(buffer);
        const resumeText = pdfData.text;

        const prompt = `
        You are an elite AI Career Coach and Talent Analyzer. Your goal is to extract structured data from the following resume text and provide a high-stakes "Job Readiness" evaluation.
        
        Resume Text:
        ${resumeText}

        STRICT EVALUATION CRITERIA:
        1. Skills Match (30%): Depth in role-required languages/frameworks.
        2. Projects (20%): Complexity, live links, and business/technical impact.
        3. Experience (15%): Quantifiable achievements (e.g., "Increased X by Y%").
        4. ATS Optimization (15%): Multi-column compatibility, keywords, and structural clarity.
        5. Impact Metrics (10%): Use of numbers and scales.
        6. Industry Fit (10%): Readiness for FAANG/High-Growth startups.

        STRICT JSON SCHEMA MANDATE:
        - ALL SCORES MUST BE OUT OF 100 (e.g. 85, not 8.5). "jobReadinessScore", "atsScore", and ALL "breakdown" values MUST be percentages between 0 and 100.
        - "suggestions": MUST be EXACTLY 4 PUNCHY, ACTIONABLE BULLET POINTS. No more, no less. This is critical for UI symmetry.
        - "experience": "description" field MUST be a single string formatted with clear bullet points if multiple (e.g., "• Achievement 1 • Achievement 2"). DO NOT return a raw JSON array.
        - "links": Extract all professional links found in the text (GitHub, LinkedIn, Portfolio, etc). If none are found, return an empty array.
        - No conversational filler. No "Here is the data...".
        - If a field is missing, use an empty string or 0, do not use "N/A".

        {
          "profile": {
            "name": "string",
            "currentRole": "string",
            "university": "string",
            "location": "string",
            "internshipsCount": number,
            "leetcodeCount": number
          },
          "links": [
            { "platform": "GitHub | LinkedIn | LeetCode | Portfolio | etc", "url": "string" }
          ],
          "skills": [
            { "category": "Languages | Frontend | Backend | Databases | Cloud | Tools", "skillName": "string" }
          ],
          "projects": [
            {
              "title": "string",
              "techStack": "string",
              "description": "Short, impact-focused description",
              "links": { "github": "string", "live": "string" }
            }
          ],
          "experience": [
            { "company": "string", "role": "string", "location": "string", "startDate": "string", "endDate": "string", "description": "Single string with bullet points" }
          ],
          "education": [
            { "institution": "string", "degree": "string", "fieldOfStudy": "string", "cgpa": "string", "startDate": "string", "endDate": "string" }
          ],
          "achievements": [
            { "title": "string", "description": "string" }
          ],
          "insights": {
            "jobReadinessScore": "number (0-100)",
            "atsScore": "number (0-100)",
            "keywordStrength": "Low | Medium | Strong",
            "projectImpact": "Weak | Medium | Strong",
            "breakdown": {
                "resumeQuality": "number (0-100)",
                "projectsStrength": "number (0-100)",
                "skillsCoverage": "number (0-100)",
                "experience": "number (0-100)"
            },
            "suggestions": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4"],
            "sectionAnalysis": {
                "experience": "What is good/bad and how to improve experience impact",
                "projects": "Assessment of project technical depth and relevance",
                "skills": "Skill gap analysis relative to software engineering market",
                "education": "How to leverage academic details for job roles"
            },
            "improvementPlan": {
                "additionalSkills": ["Skill 1", "Skill 2"],
                "newProjectIdeas": ["Project 1 Idea", "Project 2 Idea"],
                "projectEnhancements": ["Enhancement for Project X", "Enhancement for Project Y"]
            }
          }
        }
        `;

        const response = await analyzeWithGroqLPU([
            { role: "system", content: "You are a professional resume parser." },
            { role: "user", content: prompt }
        ], {
            response_format: { type: "json_object" },
            model: MODELS.GROQ_PRIMARY,
            max_tokens: 4096
        });

        const extractedData = JSON.parse(response.choices[0].message.content || "{}");
        console.log("Extracted Data:", JSON.stringify(extractedData, null, 2));

        // Prepare safe data objects with defaults
        const profile = extractedData.profile || {};
        const links = Array.isArray(extractedData.links) ? extractedData.links : [];
        const skills = Array.isArray(extractedData.skills) ? extractedData.skills : [];
        const projects = Array.isArray(extractedData.projects) ? extractedData.projects : [];
        const experience = Array.isArray(extractedData.experience) ? extractedData.experience : [];
        const education = (Array.isArray(extractedData.education) ? extractedData.education : []).map((e: {
            institution?: string;
            school?: string;
            college?: string;
            university?: string;
            degree?: string;
            fieldOfStudy?: string;
            cgpa?: string;
            startDate?: string;
            endDate?: string;
            description?: string;
        }) => ({
            institution: e.institution || e.school || e.college || e.university || "Unknown Institution",
            degree: e.degree || "Degree Not Specified",
            fieldOfStudy: e.fieldOfStudy || "",
            cgpa: e.cgpa || "",
            startDate: e.startDate || "N/A",
            endDate: e.endDate || "Present",
            description: e.description || ""
        }));

        const achievementSource = extractedData.achievements || extractedData.honors || extractedData.certifications || extractedData.awards;
        const mappedAchievements = (Array.isArray(achievementSource) ? achievementSource : []).map((a: { title?: string; name?: string; description?: string; details?: string }) => ({
            title: a.title || a.name || "Achievement",
            description: a.description || a.details || ""
        }));
        const insights = extractedData.insights || {
            jobReadinessScore: 0,
            atsScore: 0,
            keywordStrength: "Low",
            projectImpact: "Weak",
            breakdown: {
                resumeQuality: 0,
                projectsStrength: 0,
                skillsCoverage: 0,
                experience: 0
            },
            suggestions: []
        };

        // Save to Database
        await db.transaction(async (tx) => {
            // UPSERT Profile
            await tx.insert(userProfilesTable)
                .values({
                    userEmail,
                    name: profile.name || "Unknown",
                    currentRole: profile.currentRole || "N/A",
                    university: profile.university || "N/A",
                    location: profile.location || "N/A",
                    internshipsCount: profile.internshipsCount || 0,
                    leetcodeCount: profile.leetcodeCount || 0,
                    completionPercentage: 0, // Will be calculated on GET
                })
                .onConflictDoUpdate({
                    target: [userProfilesTable.userEmail],
                    set: {
                        name: profile.name || null,
                        currentRole: profile.currentRole || null,
                        university: profile.university || null,
                        location: profile.location || null,
                        internshipsCount: profile.internshipsCount || 0,
                        leetcodeCount: profile.leetcodeCount || 0,
                        updatedAt: new Date()
                    }
                });

            // Refresh Links
            await tx.delete(professionalLinksTable).where(eq(professionalLinksTable.userEmail, userEmail));
            if (links.length > 0) {
                await tx.insert(professionalLinksTable).values(
                    links.map((l: { platform: string; url: string }) => ({ userEmail, ...l }))
                );
            }

            // Refresh Skills
            await tx.delete(userSkillsTable).where(eq(userSkillsTable.userEmail, userEmail));
            if (skills.length > 0) {
                await tx.insert(userSkillsTable).values(
                    skills.map((s: { category: string; skillName: string }) => ({ userEmail, ...s }))
                );
            }

            // Refresh Projects
            await tx.delete(userProjectsTable).where(eq(userProjectsTable.userEmail, userEmail));
            if (projects.length > 0) {
                await tx.insert(userProjectsTable).values(
                    projects.map((p: { title: string; techStack: string; description: string; links: any }) => ({
                        userEmail,
                        title: p.title || "Untitled Project",
                        techStack: p.techStack || "",
                        description: p.description || "",
                        links: JSON.stringify(p.links || {})
                    }))
                );
            }

            // Refresh Experience
            await tx.delete(userExperienceTable).where(eq(userExperienceTable.userEmail, userEmail));
            if (experience.length > 0) {
                await tx.insert(userExperienceTable).values(
                    experience.map((e: { company: string; role: string; location?: string; startDate?: string; endDate?: string; description?: string }) => ({ userEmail, ...e }))
                );
            }

            // Refresh Education
            await tx.delete(userEducationTable).where(eq(userEducationTable.userEmail, userEmail));
            if (education.length > 0) {
                await tx.insert(userEducationTable).values(
                    education.map((e: { institution: string; degree: string; fieldOfStudy?: string; cgpa?: string; startDate?: string; endDate?: string; description?: string }) => ({ userEmail, ...e }))
                );
            }

            // Refresh Achievements
            await tx.delete(userAchievementsTable).where(eq(userAchievementsTable.userEmail, userEmail));
            if (mappedAchievements.length > 0) {
                await tx.insert(userAchievementsTable).values(
                    mappedAchievements.map((a) => ({ userEmail, ...a }))
                );
            }

            // UPSERT Insights
            await tx.insert(profileInsightsTable)
                .values({
                    userEmail,
                    jobReadinessScore: insights.jobReadinessScore || 0,
                    atsScore: insights.atsScore || 0,
                    keywordStrength: insights.keywordStrength || "Low",
                    projectImpact: insights.projectImpact || "Weak",
                    breakdown: JSON.stringify(insights.breakdown || {}),
                    suggestions: JSON.stringify(insights.suggestions || []),
                    sectionAnalysis: JSON.stringify(insights.sectionAnalysis || {}),
                    improvementPlan: JSON.stringify(insights.improvementPlan || {}),
                })
                .onConflictDoUpdate({
                    target: [profileInsightsTable.userEmail],
                    set: {
                        jobReadinessScore: insights.jobReadinessScore || 0,
                        atsScore: insights.atsScore || 0,
                        keywordStrength: insights.keywordStrength || "Low",
                        projectImpact: insights.projectImpact || "Weak",
                        breakdown: JSON.stringify(insights.breakdown || {}),
                        suggestions: JSON.stringify(insights.suggestions || []),
                        sectionAnalysis: JSON.stringify(insights.sectionAnalysis || {}),
                        improvementPlan: JSON.stringify(insights.improvementPlan || {}),
                        updatedAt: new Date()
                    }
                });
        });

        // Return the full synthesized profile matching the GET structure
        const finalProfile = {
            ...profile,
            userEmail,
            links,
            skills,
            projects: projects.map((p: { title: string; techStack: string; description: string; links?: any }) => ({
                ...p,
                links: JSON.stringify(p.links || {})
            })),
            experience,
            education,
            achievements: mappedAchievements,
            insights,
            updatedAt: new Date()
        };

        return NextResponse.json({ success: true, data: finalProfile });

    } catch (error: unknown) {
        console.error("Profile Extraction Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { type, data } = body;

        switch (type) {
            case "goals": {
                const { id, ...cleanData } = data;
                await db.insert(careerGoalsTable)
                    .values({ userEmail, ...cleanData })
                    .onConflictDoUpdate({
                        target: [careerGoalsTable.userEmail],
                        set: cleanData
                    });
                break;
            }
            case "profile":
                await db.update(userProfilesTable)
                    .set({ ...data, updatedAt: new Date() })
                    .where(eq(userProfilesTable.userEmail, userEmail));
                break;
            case "links":
                await db.transaction(async (tx) => {
                    await tx.delete(professionalLinksTable).where(eq(professionalLinksTable.userEmail, userEmail));
                    if (data.length > 0) {
                        const cleanData = data.map(({ id, ...rest }: { id?: number; platform: string; url: string }) => ({ userEmail, ...rest }));
                        await tx.insert(professionalLinksTable).values(cleanData);
                    }
                });
                break;
            case "skills":
                await db.transaction(async (tx) => {
                    await tx.delete(userSkillsTable).where(eq(userSkillsTable.userEmail, userEmail));
                    if (data.length > 0) {
                        const cleanData = data.map(({ id, ...rest }: { id?: number; category: string; skillName: string }) => ({ userEmail, ...rest }));
                        await tx.insert(userSkillsTable).values(cleanData);
                    }
                });
                break;
            case "projects":
                await db.transaction(async (tx) => {
                    await tx.delete(userProjectsTable).where(eq(userProjectsTable.userEmail, userEmail));
                    if (data.length > 0) {
                        const cleanData = data.map(({ id, ...p }: { id?: number; title?: string; techStack?: string; description?: string; links?: any }) => ({
                            userEmail,
                            title: p.title || "Untitled Project",
                            techStack: p.techStack || "",
                            description: p.description || "",
                            links: typeof p.links === 'string' ? p.links : JSON.stringify(p.links || {})
                        }));
                        await tx.insert(userProjectsTable).values(cleanData);
                    }
                });
                break;
            case "experience":
                await db.transaction(async (tx) => {
                    await tx.delete(userExperienceTable).where(eq(userExperienceTable.userEmail, userEmail));
                    if (data.length > 0) {
                        const cleanData = data.map(({ id, ...rest }: { id?: number; company: string; role: string; location?: string; startDate?: string; endDate?: string; description?: string }) => ({ userEmail, ...rest }));
                        await tx.insert(userExperienceTable).values(cleanData);
                    }
                });
                break;
            case "education":
                await db.transaction(async (tx) => {
                    await tx.delete(userEducationTable).where(eq(userEducationTable.userEmail, userEmail));
                    if (data.length > 0) {
                        const cleanData = data.map(({ id, ...rest }: { id?: number; institution: string; degree?: string; fieldOfStudy?: string; cgpa?: string; startDate?: string; endDate?: string; description?: string }) => ({ userEmail, ...rest }));
                        await tx.insert(userEducationTable).values(cleanData);
                    }
                });
                break;
            case "achievements":
                await db.transaction(async (tx) => {
                    await tx.delete(userAchievementsTable).where(eq(userAchievementsTable.userEmail, userEmail));
                    if (data.length > 0) {
                        const cleanData = data.map(({ id, ...rest }: { id?: number; title: string; description?: string }) => ({ userEmail, ...rest }));
                        await tx.insert(userAchievementsTable).values(cleanData);
                    }
                });
                break;
            case "stats":
                await db.update(userProfilesTable)
                    .set({
                        internshipsCount: parseInt(data.internshipsCount) || 0,
                        leetcodeCount: parseInt(data.leetcodeCount) || 0,
                        updatedAt: new Date()
                    })
                    .where(eq(userProfilesTable.userEmail, userEmail));
                break;
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
