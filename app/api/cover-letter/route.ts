import { NextRequest, NextResponse } from "next/server";
import { chatWithGroq } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import { db } from "@/lib/db/db";
import { coverLettersTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const ip = getRequestIP(req);
        const { limited, resetIn } = checkRateLimit(`cover:${ip}`, AI_RATE_LIMIT);
        if (limited) {
            return NextResponse.json(
                { error: `Too many requests. Please try again in ${resetIn} seconds.` },
                { status: 429 }
            );
        }

        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        const { jobDescription, userDetails } = await req.json();

        if (!jobDescription || !userDetails) {
            return NextResponse.json({ error: "Job description and user details are required" }, { status: 400 });
        }

        const systemPrompt = `
        You are Mentorix, an elite Executive Career Consultant at an top-tier university.
        Generate a premium, high-impact Cover Letter.
        
        FORMATTING RULES (MANDATORY):
        - Use MARKDOWN strictly.
        - **Bold** key technical skills, impact metrics (X%, $Y), and elite role titles.
        - Use asterisk (*) for every single item inside lists.
        - Structure using ### Triple-Hash Headers for main sections.
        - Ensure sharp spacing by adding clear double-newlines between major sections.

        STRATEGY:
        - Deeply integrate USER DETAILS with the provided JOB DESCRIPTION.
        - Focus on quantifiable achievements.
        - Tone: Professional & Persuasive.
        
        Output ONLY the document content in Markdown. No conversational filler or introductory remarks.
        `;

        const userPrompt = `
JOB DESCRIPTION:
${jobDescription}

USER DETAILS (Skills, Experience, achievements, etc.):
${userDetails}

Write a professional cover letter based on these details.
`;

        const responseData = await chatWithGroq([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], {
            model: MODELS.PRIMARY,
            temperature: 0.7,
        });

        if (!responseData?.choices?.[0]?.message?.content) {
            throw new Error("Invalid response from AI provider");
        }

        const coverLetter = responseData.choices[0].message.content;

        // Save to Database if user is authenticated
        if (userEmail) {
            await db.insert(coverLettersTable).values({
                userEmail,
                jobDescription,
                userDetails,
                coverLetter
            });
        }

        return NextResponse.json({ coverLetter });

    } catch (error: any) {
        console.error("Cover Letter Generation Error:", error.response?.data || error.message);
        return NextResponse.json({
            error: error.message || "Failed to generate cover letter",
        }, { status: 500 });
    }
}
