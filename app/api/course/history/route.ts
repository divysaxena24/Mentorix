import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { coursesTable, courseModulesTable, courseLessonsTable, courseProgressTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, desc, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser || !clerkUser.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = clerkUser.primaryEmailAddress.emailAddress;

        const history = await db.select()
            .from(coursesTable)
            .where(
                eq(coursesTable.userEmail, email)
            )
            .orderBy(desc(coursesTable.createdAt));

        return NextResponse.json(history);
    } catch (error: any) {
        console.error("Course History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser || !clerkUser.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = clerkUser.primaryEmailAddress.emailAddress;
        const url = new URL(req.url);
        const id = url.searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
        }

        const courseId = parseInt(id);

        // Perform manual cascade delete
        try {
            console.log("Starting manual cascade delete for course:", courseId);

            // 1. Get modules for this course
            const modules = await db.select({ id: courseModulesTable.id })
                .from(courseModulesTable)
                .where(eq(courseModulesTable.courseId, courseId));

            const moduleIds = modules.map(m => m.id);
            console.log("Found modules:", moduleIds);

            if (moduleIds.length > 0) {
                // 2. Get lessons for these modules
                const lessons = await db.select({ id: courseLessonsTable.id })
                    .from(courseLessonsTable)
                    .where(inArray(courseLessonsTable.moduleId, moduleIds));

                const lessonIds = lessons.map(l => l.id);
                console.log("Found lessons:", lessonIds);

                if (lessonIds.length > 0) {
                    // 3. Delete progress records
                    await db.delete(courseProgressTable)
                        .where(inArray(courseProgressTable.lessonId, lessonIds));
                    console.log("Deleted progress records");

                    // 4. Delete lessons
                    await db.delete(courseLessonsTable)
                        .where(inArray(courseLessonsTable.moduleId, moduleIds));
                    console.log("Deleted lessons");
                }

                // 5. Delete modules
                await db.delete(courseModulesTable)
                    .where(eq(courseModulesTable.courseId, courseId));
                console.log("Deleted modules");
            }

            // 6. Delete the course itself
            const result = await db.delete(coursesTable)
                .where(
                    and(
                        eq(coursesTable.id, courseId),
                        eq(coursesTable.userEmail, email)
                    )
                );
            console.log("Deleted course result:", result);

        } catch (cascadeError: any) {
            console.error("Manual Cascade Delete Failed:", cascadeError);
            return NextResponse.json({
                error: "Failed to perform cascading delete",
                details: cascadeError.message
            }, { status: 500 });
        }

        return NextResponse.json({ message: "Course deleted successfully" });
    } catch (error: any) {
        console.error("Course Delete API Error:", error);
        return NextResponse.json({
            error: "Failed to delete course",
            details: error.message
        }, { status: 500 });
    }
}
