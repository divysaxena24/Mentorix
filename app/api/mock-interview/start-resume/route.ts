import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db/db";
import { mockInterviewsTable, interviewQuestionsTable, resumeAnalysisTable } from "@/lib/db/schema";
import { generateGroqCompletion } from "@/lib/ai/groq";
import { eq, desc } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch User's Latest Analyzed Resume
        const [latestResume] = await db.select()
            .from(resumeAnalysisTable)
            .where(eq(resumeAnalysisTable.userEmail, userEmail))
            .orderBy(desc(resumeAnalysisTable.createdAt))
            .limit(1);

        if (!latestResume || !latestResume.resumeText) {
            return new NextResponse("No resume found. Please upload one in your profile first.", { status: 400 });
        }

        // Determine the topic from the resume
        const topicPrompt = `
You are an expert technical recruiter analyzing a candidate's resume.
Extract the primary job role they are targeting and their top 2 most prominent skills.
Create a short, concise mock interview topic name (Max 4 words). Examples: "React Frontend Developer", "Backend Node.js Engineer", "Full Stack Web", "Data Science & Python".

Resume Text:
${latestResume.resumeText.substring(0, 3000)}

Return ONLY a JSON object with this shape:
{ "topic": "Calculated Topic Here" }
`;

        const topicResponse = await generateGroqCompletion([
            { role: "system", content: topicPrompt }
        ], {
            response_format: { type: "json_object" },
            max_tokens: 200
        });

        const topicObj = JSON.parse(topicResponse);
        const topic = topicObj.topic || "General Technical Interview";
        const duration = "15 min";
        const difficulty = "Medium";

        // 1. Create the Mock Interview record
        const [interview] = await db.insert(mockInterviewsTable).values({
            userEmail,
            type: "Resume-Based",
            topic,
            duration,
            difficulty,
            status: "In-Progress",
        }).returning();

        // 2. Generate the first question acting as the interviewer, incorporating resume context
        const systemPrompt = `You are a professional technical interviewer named Mentorix Coach. 
You are conducting a ${duration} mock interview for the role of: "${topic}" at a "${difficulty}" difficulty level.
You have access to the candidate's resume context to personalize the interview.

Candidate Resume Excerpt:
${latestResume.resumeText.substring(0, 3000)}

Your goal right now is to briefly welcome the user, reference one specific interesting thing from their resume (a project, past job, or skill), and ask the very FIRST technical or behavioral interview question related to ${topic}.
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
        console.error("[MOCK_INTERVIEW_START_RESUME]", error);
        return new NextResponse(JSON.stringify({ error: error.message || "Unknown error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
