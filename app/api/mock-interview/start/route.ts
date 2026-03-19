import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db/db";
import { mockInterviewsTable, interviewQuestionsTable } from "@/lib/db/schema";
import { generateGroqCompletion } from "@/lib/ai/groq";

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress || "test@example.com";

        if (!userEmail) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { type, topic, duration, difficulty } = body;

        if (!topic || !duration || !difficulty) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // 1. Create the Mock Interview record in the database
        const [interview] = await db.insert(mockInterviewsTable).values({
            userEmail,
            type: type || "Custom",
            topic,
            duration,
            difficulty,
            status: "In-Progress",
        }).returning();

        // 2. Generate the first question acting as the interviewer
        const systemPrompt = `You are a professional technical interviewer named Mentorix Coach. 
You are conducting a ${duration} mock interview on the topic: "${topic}" at a "${difficulty}" difficulty level.
Your goal right now is to briefly welcome the user, state the topic of the interview, and ask the very FIRST interview question.
Do not ask multiple questions at once. Give a single, clear question to start.

Return the result STRICTLY as a JSON object with this shape:
{
  "greeting": "Hello, welcome to etc...",
  "question": "The actual first question you are asking",
  "idealAnswer": "A brief internal note on what a good answer to this question looks like (for later evaluation)"
}`;

        const llmResponse = await generateGroqCompletion([
            { role: "system", content: systemPrompt },
            { role: "user", content: "Start the interview." }
        ], {
            response_format: { type: "json_object" }
        });

        const parsedResponse = JSON.parse(llmResponse);
        const fullQuestionText = `${parsedResponse.greeting} ${parsedResponse.question}`;

        // 3. Save the first question to the database
        const [questionRecord] = await db.insert(interviewQuestionsTable).values({
            interviewId: interview.id,
            questionText: fullQuestionText,
            idealAnswer: parsedResponse.idealAnswer,
            sequenceOrder: 1,
        }).returning();

        return NextResponse.json({
            interviewId: interview.id,
            question: questionRecord,
        });

    } catch (error: any) {
        console.error("[MOCK_INTERVIEW_START]", error);
        return new NextResponse(JSON.stringify({ error: error.message || "Unknown error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
