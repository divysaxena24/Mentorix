"use server"

import { db } from "@/lib/db/db";
import { roadmapsTable } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getRoadmapHistoryAction() {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            throw new Error("User not authenticated");
        }
        const userEmail = user.primaryEmailAddress.emailAddress;

        const history = await db.select()
            .from(roadmapsTable)
            .where(eq(roadmapsTable.userEmail, userEmail))
            .orderBy(desc(roadmapsTable.createdAt));

        return {
            success: true,
            data: history.map(item => ({
                ...item,
                roadmapData: JSON.parse(item.roadmapData)
            }))
        };
    } catch (error: unknown) {
        console.error("GET_ROADMAP_HISTORY_ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to fetch roadmap history" };
    }
}

export async function deleteRoadmapAction(id: number) {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            throw new Error("User not authenticated");
        }
        const userEmail = user.primaryEmailAddress.emailAddress;

        await db.delete(roadmapsTable)
            .where(
                and(
                    eq(roadmapsTable.id, id),
                    eq(roadmapsTable.userEmail, userEmail)
                )
            );

        revalidatePath("/ai-tools/roadmap");
        revalidatePath("/history");
        return { success: true };
    } catch (error: unknown) {
        console.error("DELETE_ROADMAP_ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete roadmap" };
    }
}
