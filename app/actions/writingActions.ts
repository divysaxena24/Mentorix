"use server"

import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db/db"
import { writingStudioDocsTable } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getWritingHistoryAction(docType: string) {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return { success: false, error: "Unauthorized" };
        }

        const history = await db.select()
            .from(writingStudioDocsTable)
            .where(
                and(
                    eq(writingStudioDocsTable.userEmail, userEmail),
                    eq(writingStudioDocsTable.docType, docType)
                )
            )
            .orderBy(desc(writingStudioDocsTable.createdAt));

        return { success: true, data: history };
    } catch (error: any) {
        console.error("GET WRITING HISTORY ACTION ERROR:", error);
        return { success: false, error: error.message || "Failed to fetch writing history" };
    }
}

export async function getWritingItemAction(id: number) {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return { success: false, error: "Unauthorized" };
        }

        const [item] = await db.select()
            .from(writingStudioDocsTable)
            .where(
                and(
                    eq(writingStudioDocsTable.id, id),
                    eq(writingStudioDocsTable.userEmail, userEmail)
                )
            )
            .limit(1);

        if (!item) {
            return { success: false, error: "Document not found" };
        }

        return { success: true, data: item };
    } catch (error: any) {
        console.error("GET WRITING ITEM ACTION ERROR:", error);
        return { success: false, error: error.message || "Failed to fetch document" };
    }
}

export async function deleteWritingItemAction(id: number) {
    try {
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;

        if (!userEmail) {
            return { success: false, error: "Unauthorized" };
        }

        await db.delete(writingStudioDocsTable)
            .where(
                and(
                    eq(writingStudioDocsTable.id, id),
                    eq(writingStudioDocsTable.userEmail, userEmail)
                )
            );

        revalidatePath("/ai-tools/writing-studio");
        return { success: true };
    } catch (error: any) {
        console.error("DELETE WRITING ITEM ACTION ERROR:", error);
        return { success: false, error: error.message || "Failed to delete document" };
    }
}
