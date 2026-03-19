import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db/db";
import { mockInterviewsTable, interviewQuestionsTable } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const interviewId = parseInt(id);

        const interviews = await db.select().from(mockInterviewsTable).where(eq(mockInterviewsTable.id, interviewId));

        if (interviews.length === 0) {
            return new NextResponse("Interview not found", { status: 404 });
        }

        const interview = interviews[0];

        // Ensure user owns this interview
        if (interview.userEmail !== userEmail) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const questions = await db.select()
            .from(interviewQuestionsTable)
            .where(eq(interviewQuestionsTable.interviewId, interviewId))
            .orderBy(asc(interviewQuestionsTable.sequenceOrder));

        return NextResponse.json({
            interview,
            questions,
        });

    } catch (error) {
        console.error("[MOCK_INTERVIEW_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
