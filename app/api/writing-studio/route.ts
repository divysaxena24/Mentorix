import { NextRequest, NextResponse } from "next/server";
import { chatWithGroq } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import { db } from "@/lib/db/db";
import { writingStudioDocsTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const ip = getRequestIP(req);
        const { limited, resetIn } = checkRateLimit(`writing:${ip}`, AI_RATE_LIMIT);
        if (limited) {
            return NextResponse.json(
                { error: `Too many requests. Please try again in ${resetIn} seconds.` },
                { status: 429 }
            );
        }

        const clerkUser = await currentUser();
        if (!clerkUser || !clerkUser.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = clerkUser.primaryEmailAddress.emailAddress;
        const body = await req.json();
        const { docType, context, userDetails, tone, length } = body;

        if (!docType || !context || !userDetails) {
            return NextResponse.json({ error: "Document type, context, and user details are required" }, { status: 400 });
        }

        const docTypeNames: Record<string, string> = {
            cover_letter: "Cover Letter",
            sop: "Statement of Purpose (SOP)",
            motivation_letter: "Motivation Letter",
            proposal: "Proposal"
        };

        const systemPrompt = `
        You are Mentorix, an elite Executive Career Consultant at an top-tier university.
        Generate a premium, high-impact ${docTypeNames[docType] || "Professional Document"}.
        
        FORMATTING RULES (MANDATORY):
        - Use MARKDOWN strictly.
        - **Bold** key technical skills, impact metrics (X%, $Y), and elite role titles.
        - Use asterisk (*) for every single item inside lists.
        - Structure using ### Triple-Hash Headers for main sections (e.g., ### Opening, ### Strategic Fit, ### Key Impact).
        - Ensure sharp spacing by adding clear double-newlines between major sections.

        STRATEGY:
        - Deeply integrate USER DETAILS with the provided CONTEXT.
        - Bridge the gap between past accomplishments and future goals using logic.
        - Tone: ${tone || "Professional"}. 
        - Length: ${length || "Medium"}.

        USER DETAILS: ${userDetails}
        CONTEXT: ${context}
        
        Output ONLY the document content in Markdown. No conversational filler or introductory remarks.
        `;

        const data = await chatWithGroq([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate the ${docTypeNames[docType]} based on the context provided.` }
        ], {
            model: MODELS.PRIMARY,
            temperature: 0.7,
            max_tokens: 2048,
        });

        if (!data?.choices?.[0]?.message?.content) {
            throw new Error("Invalid response from AI provider");
        }

        const generatedContent = data.choices[0].message.content;

        // Auto-save to history
        const [savedDoc] = await db.insert(writingStudioDocsTable).values({
            userEmail: email,
            docType,
            context,
            userDetails,
            generatedContent
        }).returning();

        return NextResponse.json({
            success: true,
            doc: savedDoc
        });

    } catch (error: unknown) {
        console.error("Writing Studio Error:", error);
        const err = error as { message?: string; response?: { data?: any } };
        return NextResponse.json({
            error: err.message || "Failed to generate document",
            details: err.response?.data || err.message
        }, { status: 500 });
    }
}
