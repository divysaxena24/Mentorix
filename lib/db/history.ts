import { db } from "./db";
import {
    roadmapsTable,
    chatHistoryTable,
    writingStudioDocsTable,
    resumeAnalysisTable,
    resumesTable,
    coursesTable
} from "./schema";
import { eq, desc } from "drizzle-orm";

export async function getUserHistory(userEmail: string) {
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
        roadmaps,
        chats,
        writingDocs,
        resumesAnalysed,
        resumesBuilt,
        courses
    };
}
