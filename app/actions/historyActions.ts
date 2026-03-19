"use server"

import { db } from "@/lib/db/db";
import {
    roadmapsTable,
    chatHistoryTable,
    writingStudioDocsTable,
    resumeAnalysisTable,
    resumesTable,
    coursesTable
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getUserHistoryAction() {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            throw new Error("User not authenticated");
        }
        const userEmail = user.primaryEmailAddress.emailAddress;

        const [
            roadmaps,
            chats,
            writingDocs,
            resumesAnalysed,
            resumesBuilt,
            courses
        ] = await Promise.all([
            db.select().from(roadmapsTable).where(eq(roadmapsTable.userEmail, userEmail)).orderBy(desc(roadmapsTable.createdAt)),
            db.select().from(chatHistoryTable).where(eq(chatHistoryTable.userEmail, userEmail)).orderBy(desc(chatHistoryTable.createdAt)),
            db.select().from(writingStudioDocsTable).where(eq(writingStudioDocsTable.userEmail, userEmail)).orderBy(desc(writingStudioDocsTable.createdAt)),
            db.select().from(resumeAnalysisTable).where(eq(resumeAnalysisTable.userEmail, userEmail)).orderBy(desc(resumeAnalysisTable.createdAt)),
            db.select().from(resumesTable).where(eq(resumesTable.userEmail, userEmail)).orderBy(desc(resumesTable.createdAt)),
            db.select().from(coursesTable).where(eq(coursesTable.userEmail, userEmail)).orderBy(desc(coursesTable.createdAt))
        ]);

        return {
            success: true,
            data: {
                roadmaps,
                chats,
                writingDocs,
                resumesAnalysed,
                resumesBuilt,
                courses
            }
        };
    } catch (error: unknown) {
        console.error("HISTORY_ACTION_ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to fetch history" };
    }
}

export async function deleteHistoryItemAction(type: 'roadmap' | 'chat' | 'writing' | 'analysis' | 'resume' | 'course', id: number | string) {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            throw new Error("User not authenticated");
        }
        const userEmail = user.primaryEmailAddress.emailAddress;

        let table;
        let idColumn;

        switch (type) {
            case 'roadmap':
                table = roadmapsTable;
                idColumn = roadmapsTable.id;
                break;
            case 'chat':
                table = chatHistoryTable;
                // Chat ID is usually a string (UUID)
                await db.delete(chatHistoryTable).where(
                    and(
                        eq(chatHistoryTable.userEmail, userEmail),
                        eq(chatHistoryTable.chatId, id as string)
                    )
                );
                revalidatePath("/ai-tools/ai-chat");
                revalidatePath("/history");
                return { success: true };
            case 'writing':
                table = writingStudioDocsTable;
                idColumn = writingStudioDocsTable.id;
                break;
            case 'analysis':
                table = resumeAnalysisTable;
                idColumn = resumeAnalysisTable.id;
                break;
            case 'resume':
                table = resumesTable;
                idColumn = resumesTable.id;
                break;
            case 'course':
                table = coursesTable;
                idColumn = coursesTable.id;
                break;
            default:
                throw new Error("Invalid history type");
        }

        await db.delete(table).where(
            and(
                eq((table as any).userEmail, userEmail),
                eq(idColumn as any, id as number)
            )
        );

        revalidatePath("/history");
        return { success: true };
    } catch (error: unknown) {
        console.error("DELETE_HISTORY_ACTION_ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete history item" };
    }
}
