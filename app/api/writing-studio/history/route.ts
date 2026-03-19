import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { writingStudioDocsTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser || !clerkUser.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = clerkUser.primaryEmailAddress.emailAddress;
        const url = new URL(req.url);
        const docType = url.searchParams.get("docType");
        const id = url.searchParams.get("id");

        if (id) {
            const history = await db.select()
                .from(writingStudioDocsTable)
                .where(
                    and(
                        eq(writingStudioDocsTable.userEmail, email),
                        eq(writingStudioDocsTable.id, parseInt(id))
                    )
                )
                .limit(1);
            return NextResponse.json(history[0]);
        }

        if (!docType) {
            return NextResponse.json({ error: "Document type or ID is required" }, { status: 400 });
        }

        const history = await db.select()
            .from(writingStudioDocsTable)
            .where(
                and(
                    eq(writingStudioDocsTable.userEmail, email),
                    eq(writingStudioDocsTable.docType, docType)
                )
            )
            .orderBy(desc(writingStudioDocsTable.createdAt));

        return NextResponse.json(history);
    } catch (error: any) {
        console.error("Writing Studio History Error:", error);
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

        await db.delete(writingStudioDocsTable)
            .where(
                and(
                    eq(writingStudioDocsTable.id, parseInt(id)),
                    eq(writingStudioDocsTable.userEmail, email)
                )
            );

        return NextResponse.json({ message: "Document deleted successfully" });
    } catch (error: any) {
        console.error("Writing Studio Delete Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
