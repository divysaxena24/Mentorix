import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db/db";
import { mockInterviewsTable, interviewQuestionsTable } from "@/lib/db/schema";
import { generateGroqCompletion } from "@/lib/ai/groq";
import { eq, asc } from "drizzle-orm";

export async function POST(req: Request) {
    console.log("[DEBUG] /api/mi-evaluate hit");
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { interviewId, questionId, userTranscript } = body;

        if (!interviewId || !questionId || !userTranscript) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // 1. Fetch the interview to get context
        const interviewRecords = await db.select().from(mockInterviewsTable).where(eq(mockInterviewsTable.id, interviewId));
        if (interviewRecords.length === 0) {
            return new NextResponse("Interview not found", { status: 404 });
        }
        const interview = interviewRecords[0];

        // 2. Fetch the current question to evaluate
        const questionRecords = await db.select().from(interviewQuestionsTable).where(eq(interviewQuestionsTable.id, questionId));
        if (questionRecords.length === 0) {
            return new NextResponse("Question not found", { status: 404 });
        }
        const currentQuestion = questionRecords[0];

        // 3. Evaluate the answer and generate the next question using Groq
        const systemPrompt = `You are a ruthless, professional technical interviewer at a FAANG company. 
Conducting a ${interview.duration} interview on "${interview.topic}" at ${interview.difficulty} difficulty.

STRICT INTERVIEWER RULES:
1. BREVITY: Never write more than one paragraph. Do not over-explain your questions.
2. NO EXCESSIVE PRAISE: Do not say "Great answer!" or "That's correct!". Be neutral and move to the next point.
3. FOLLOW-UPS: You must ask exactly ONE specific technical question at a time. If the candidate is vague, drill deeper.
4. TONE: Professional, slightly intimidating, and strictly analytical.

Your task:
1. Briefly evaluate the last answer (1 sentence max). Score 1-10.
2. Generate the NEXT question or conclude if enough depth has been covered (usually 5-8 questions).

Return ONLY JSON:
{
  "evaluationText": "Brief review...",
  "score": 8,
  "nextQuestion": "Exactly one follow-up question...",
  "idealAnswerForNext": "Keywords for next question...",
  "isFinished": false
}`;

        const llmResponse = await generateGroqCompletion([
            { role: "system", content: systemPrompt },
            { role: "user", content: "Evaluate and provide the next question." }
        ], {
            response_format: { type: "json_object" },
            temperature: 0.4,
            max_tokens: 300
        });

        const parsedResponse = JSON.parse(llmResponse);

        // 4. Update the current question record with the evaluation
        await db.update(interviewQuestionsTable).set({
            userTranscript,
            aiEvaluationText: parsedResponse.evaluationText,
            score: parsedResponse.score,
        }).where(eq(interviewQuestionsTable.id, questionId));

        let nextQuestionRecord = null;

        // 5. If not finished, insert the next question into the DB
        if (!parsedResponse.isFinished) {
            const [newQuestion] = await db.insert(interviewQuestionsTable).values({
                interviewId: interview.id,
                questionText: parsedResponse.nextQuestion,
                idealAnswer: parsedResponse.idealAnswerForNext,
                sequenceOrder: currentQuestion.sequenceOrder + 1,
            }).returning();
            nextQuestionRecord = newQuestion;
        } else {
            // Mark interview as completed
            await db.update(mockInterviewsTable).set({
                status: "Completed",
            }).where(eq(mockInterviewsTable.id, interviewId));
        }

        return NextResponse.json({
            evaluation: parsedResponse.evaluationText,
            score: parsedResponse.score,
            nextQuestion: nextQuestionRecord,
            isFinished: parsedResponse.isFinished,
            closingRemarks: parsedResponse.isFinished ? parsedResponse.nextQuestion : null
        });

    } catch (error) {
        console.error("[MOCK_INTERVIEW_EVAL]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
