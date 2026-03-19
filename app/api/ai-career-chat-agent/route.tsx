import { NextRequest, NextResponse } from "next/server";
// Use pdf-parse-fork which is more stable in Next.js environments
import pdf from "pdf-parse-fork";
import { chatWithGroq } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import { db } from "@/lib/db/db";
import { currentUser } from "@clerk/nextjs/server";
import { resumeAnalysisTable } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const ip = getRequestIP(req);
        const { limited, resetIn } = checkRateLimit(`chat:${ip}`, AI_RATE_LIMIT);
        if (limited) {
            return NextResponse.json(
                { error: `Too many requests. Please try again in ${resetIn} seconds.` },
                { status: 429 }
            );
        }

        const clerkUser = await currentUser();
        const userEmail = clerkUser?.primaryEmailAddress?.emailAddress;

        const body = await req.json();
        const { userInput, fileBase64, fileType, fileName, conversationHistory } = body;

        if (!userInput && !fileBase64 && (!conversationHistory || conversationHistory.length === 0)) {
            return NextResponse.json({ error: "Input or file is required" }, { status: 400 });
        }

        // Fetch User's Latest Analyzed Resume
        let resumeContext = "";
        if (userEmail) {
            const [latestResume] = await db.select()
                .from(resumeAnalysisTable)
                .where(eq(resumeAnalysisTable.userEmail, userEmail))
                .orderBy(desc(resumeAnalysisTable.createdAt))
                .limit(1);

            if (latestResume?.resumeText) {
                resumeContext = `
--- [USER'S PROFILE RESUME CONTEXT] ---
The following is extracted from the user's latest analyzed resume. Use this to personalize your advice and mentorship.
RESUME CONTENT:
${latestResume.resumeText}
---------------------------------------
`;
            }
        }

        const systemPrompt = `
        You are Mentorix, an elite Technical Recruiter and Career Strategist.
        
        TONE & BEHAVIOR:
        - Professional, concise, and analytical.
        - NO conversational filler (e.g., "I understand your point").
        - NO long essays. Max 2 paragraphs per response.
        - Use bolding for key action items.

        INTERVIEW MODE:
        - If the user is practicing, ask exactly ONE sharp technical or behavioral question at a time.
        - Provide feedback only after the user responds.
        - Feedback must be: "Strength: [X], Weakness: [Y], Advice: [Z]".

        ${resumeContext ? "CONTEXT: Use the provided resume data to ask EXPERIENCE-SPECIFIC questions. Do not ask entry-level questions to a senior candidate." : "If resume context is missing, provide broad but practical advice."}
        `;

        let activeModel = MODELS.FAST_REASONING;
        let finalMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
            { role: "system", content: systemPrompt }
        ];

        // Process File If Attached
        let appendedText = "";

        if (fileBase64 && fileType) {
            if (fileType === "application/pdf") {
                try {
                    const buffer = Buffer.from(fileBase64, "base64");
                    // Safety check for pdfParse
                    const pdfParse = typeof pdf === 'function' ? pdf : (pdf as unknown as { default: any }).default || pdf;
                    const data = await pdfParse(buffer);
                    appendedText = `\n\n--- [Attached PDF Document: ${fileName || "Document.pdf"}] ---\n${data.text}\n---`;
                } catch (pdfError: unknown) {
                    console.error("PDF Parsing Error:", pdfError instanceof Error ? pdfError.message : "Unknown error");
                    return NextResponse.json({ error: "Failed to parse PDF document. Please ensure it's not password protected." }, { status: 422 });
                }
            } else if (fileType.startsWith("text/")) {
                const text = Buffer.from(fileBase64, "base64").toString("utf-8");
                appendedText = `\n\n--- [Attached Text Document: ${fileName || "Document.txt"}] ---\n${text}\n---`;
            } else {
                return NextResponse.json({ error: "Unsupported file format. Please upload a PDF or TXT file." }, { status: 400 });
            }
        }

        const userText = (userInput || "Please analyze the attached file.") + appendedText;

        // Append past history to the finalMessages array before adding the latest message
        // [TPM OPTIMIZATION]: Limit history to last 10 messages (approx 5 conversational rounds)
        if (conversationHistory && Array.isArray(conversationHistory)) {
            const historicalWindow = conversationHistory.slice(-10);

            // Take all but the last message (which is the current user input handled below)
            const priorMessages = historicalWindow.slice(0, -1).map((msg: { role: string; content: string | { type: string; text: string }[] }) => {
                let textContent = "";
                if (typeof msg.content === "string") {
                    textContent = msg.content;
                } else if (Array.isArray(msg.content)) {
                    // Extract text parts from multi-modal content for history stability
                    textContent = msg.content
                        .map((part) => {
                            if (typeof part === 'string') return part;
                            if (part && typeof part === 'object' && 'text' in part) return part.text;
                            return '';
                        })
                        .filter(Boolean)
                        .join("\n");
                } else {
                    textContent = String(msg.content || "");
                }

                return {
                    role: (msg.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
                    content: textContent || " " // Ensure non-empty string
                };
            });
            finalMessages.push(...priorMessages);
        }

        finalMessages.push({
            role: "user",
            content: userText
        });

        // Using robust Groq handler with built-in retries and model failover
        const data = await chatWithGroq(finalMessages, {
            model: activeModel,
            temperature: 0.7,
            max_tokens: 1024,
        });

        if (!data?.choices?.[0]?.message?.content) {
            throw new Error("Invalid response structure from AI provider");
        }

        const aiResponse = data.choices[0].message.content;
        return NextResponse.json({ output: aiResponse });

    } catch (error: unknown) {
        // chatWithGroq already logs errors, but we catch them for the HTTP response
        const err = error as {
            response?: {
                status?: number;
                data?: { error?: { message?: string } }
            };
            message?: string
        };
        const status = err.response?.status || 500;
        const groqError = err.response?.data?.error?.message;

        return NextResponse.json({
            error: groqError || err.message || "Internal Server Error"
        }, { status });
    }
}
