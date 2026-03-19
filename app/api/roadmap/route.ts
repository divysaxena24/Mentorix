import { NextRequest, NextResponse } from "next/server";
import { chatWithGroq } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import { db } from "@/lib/db/db";
import { roadmapsTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";

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

        const { targetField, timeline, currentLevel, weeklyCommitment } = await req.json();

        if (!targetField || !timeline || !currentLevel) {
            return NextResponse.json({ error: "Required fields are missing" }, { status: 400 });
        }

        const systemPrompt = `
        You are an expert Career Strategist and Senior Curriculum Designer at a top university.
        Create a detailed, non-linear learning roadmap that spans exactly the user's requested timeline.
        
        STRICT RULES:
        - NO REPETITION CLAUSE: Every single week/milestone MUST have a distinct, unique, and evolving goal. Do not repeat "Review documentation" or generic placeholders.
        - RESOURCE SPECIFICITY: Provide exact, hyper-specific resource names (e.g., "Read Eloquent JavaScript Chapter 4: Data Structures", "MDN Docs on CSS Grid Layout", or "Harvard CS50 Lecture on Memory"). 
        - GROWTH TRAJECTORY: Ensure the complexity increases significantly every week. A 12-week roadmap should cover 12 weeks of UNIQUE content, not 3 weeks of content repeated 4 times.
        - ACTIONABLE STEPS: Every "detailedStep" must be a concrete, builder-focused task.

        Output ONLY valid JSON:
        {
          "title": "Roadmap Title",
          "description": "Concise 2-sentence overview",
          "milestones": [
            {
              "week": "Date Range",
              "goal": "Unique, Specific Milestone Goal",
              "topics": ["Specific Technical Topic 1", "Specific Technical Topic 2"],
              "resources": ["Hyper-specific Resource 1", "Hyper-specific Resource 2"],
              "detailedSteps": ["Concrete Task 1", "Concrete Task 2"]
            }
          ],
          "tips": ["Elite Career Tip 1", "Elite Career Tip 2"]
        }
        `;

        const userPrompt = `
TARGET FIELD: ${targetField}
TIMELINE: ${timeline}
CURRENT LEVEL: ${currentLevel}
WEEKLY COMMITMENT: ${weeklyCommitment || "Not specified"} hours/week

Generate a comprehensive roadmap for mastering ${targetField} that STRICTLY spans the entire ${timeline} duration. 
Ensure the milestones are distributed logically across the whole period.
`;

        const responseData = await chatWithGroq([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], {
            model: MODELS.PRIMARY,
            response_format: { type: "json_object" },
            max_tokens: 4096
        });

        if (!responseData?.choices?.[0]?.message?.content) {
            throw new Error("Invalid response from AI provider");
        }

        const aiOutput = JSON.parse(responseData.choices[0].message.content);

        // Save to Database
        const inserted = await db.insert(roadmapsTable).values({
            userEmail: userEmail,
            targetField: targetField,
            roadmapData: JSON.stringify(aiOutput)
        }).returning();

        return NextResponse.json({
            ...aiOutput,
            id: inserted[0].id
        });

    } catch (error: unknown) {
        console.error("Roadmap Generation Error:", error);
        const err = error as { message?: string; response?: { data?: any } };
        return NextResponse.json({
            error: err.message || "Failed to generate roadmap",
            details: err.response?.data || err.message
        }, { status: 500 });
    }
}
