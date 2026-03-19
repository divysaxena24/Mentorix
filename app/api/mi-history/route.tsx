import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db/db";
import { mockInterviewsTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const history = await db.select()
            .from(mockInterviewsTable)
            .where(eq(mockInterviewsTable.userEmail, userEmail))
            .orderBy(desc(mockInterviewsTable.createdAt));

        return NextResponse.json(history);
    } catch (error) {
        console.error("[MOCK_INTERVIEW_HISTORY_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const clearAll = searchParams.get("clearAll") === "true";

        if (clearAll) {
            await db.delete(mockInterviewsTable)
                .where(eq(mockInterviewsTable.userEmail, userEmail));
            return NextResponse.json({ message: "All history cleared" });
        }

        if (id) {
            const interviewId = parseInt(id);
            // Verify ownership before delete
            const [interview] = await db.select()
                .from(mockInterviewsTable)
                .where(eq(mockInterviewsTable.id, interviewId));

            if (!interview || interview.userEmail !== userEmail) {
                return new NextResponse("Not Found or Unauthorized", { status: 404 });
            }

            await db.delete(mockInterviewsTable)
                .where(eq(mockInterviewsTable.id, interviewId));

            return NextResponse.json({ message: "Interview deleted" });
        }

        return new NextResponse("Missing parameters", { status: 400 });

    } catch (error) {
        console.error("[MOCK_INTERVIEW_HISTORY_DELETE]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
