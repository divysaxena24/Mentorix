"use server"

import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db/db"
import { resumesTable } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { ResumeData } from "@/types"

/**
 * Fetch the most recently updated resume for the current user.
 * Returns the full structured ResumeData JSON from the Resume Builder.
 */
export async function getLatestResumeAction(): Promise<{ success: boolean; data?: ResumeData; name?: string; error?: string }> {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return { success: false, error: "User not authenticated" };
        }

        const [resume] = await db
            .select()
            .from(resumesTable)
            .where(eq(resumesTable.userEmail, userEmail))
            .orderBy(desc(resumesTable.updatedAt))
            .limit(1);

        if (!resume) {
            return { success: false, error: "No resume found. Build a resume first in the Resume Builder." };
        }

        let resumeData: ResumeData;
        try {
            resumeData = JSON.parse(resume.resumeData);
        } catch {
            return { success: false, error: "Failed to parse resume data." };
        }

        return {
            success: true,
            data: resumeData,
            name: resume.resumeName
        };
    } catch (error: any) {
        console.error("GET_LATEST_RESUME_ACTION_ERROR:", error);
        return { success: false, error: error.message || "Failed to fetch resume" };
    }
}
