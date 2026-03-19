import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { courseModulesTable, coursesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
        }

        const course = await db.select().from(coursesTable).where(eq(coursesTable.id, parseInt(id)));

        if (!course || course.length === 0) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        return NextResponse.json(course[0]);

    } catch (error: any) {
        console.error("Fetch Course Detail Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to fetch course details"
        }, { status: 500 });
    }
}
