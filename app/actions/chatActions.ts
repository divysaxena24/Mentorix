"use server"

import { db } from "@/lib/db/db";
import { chatHistoryTable } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getChatSessionsAction() {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            throw new Error("User not authenticated");
        }
        const email = user.primaryEmailAddress.emailAddress;

        const sessions = await db
            .select({
                chatId: chatHistoryTable.chatId,
                chatTitle: sql<string>`MAX(${chatHistoryTable.chatTitle})`,
                createdAt: sql<string>`MAX(${chatHistoryTable.createdAt})`,
            })
            .from(chatHistoryTable)
            .where(eq(chatHistoryTable.userEmail, email))
            .groupBy(chatHistoryTable.chatId)
            .orderBy(desc(sql`MAX(${chatHistoryTable.createdAt})`));

        return { success: true, data: sessions };
    } catch (error: unknown) {
        console.error("GET_CHAT_SESSIONS_ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to fetch chat sessions" };
    }
}

export async function getChatMessagesAction(chatId: string) {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            throw new Error("User not authenticated");
        }

        const messages = await db
            .select()
            .from(chatHistoryTable)
            .where(eq(chatHistoryTable.chatId, chatId))
            .orderBy(chatHistoryTable.createdAt);

        return { success: true, data: messages };
    } catch (error: unknown) {
        console.error("GET_CHAT_MESSAGES_ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to fetch chat messages" };
    }
}

export async function saveChatMessageAction(role: 'user' | 'assistant', content: string, chatId: string, chatTitle?: string) {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            throw new Error("User not authenticated");
        }
        const email = user.primaryEmailAddress.emailAddress;

        const [savedMessage] = await db
            .insert(chatHistoryTable)
            .values({
                chatId,
                chatTitle: chatTitle || "New Conversation",
                userEmail: email,
                role,
                content,
            })
            .returning();

        return { success: true, data: savedMessage };
    } catch (error: unknown) {
        console.error("SAVE_CHAT_MESSAGE_ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to save message" };
    }
}

export async function deleteChatSessionAction(chatId: string) {
    try {
        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            throw new Error("User not authenticated");
        }
        const email = user.primaryEmailAddress.emailAddress;

        if (chatId === "all") {
            await db.delete(chatHistoryTable).where(eq(chatHistoryTable.userEmail, email));
        } else {
            await db.delete(chatHistoryTable).where(
                and(
                    eq(chatHistoryTable.chatId, chatId),
                    eq(chatHistoryTable.userEmail, email)
                )
            );
        }

        revalidatePath("/ai-tools/ai-chat");
        return { success: true };
    } catch (error: unknown) {
        console.error("DELETE_CHAT_SESSION_ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete chat session" };
    }
}
