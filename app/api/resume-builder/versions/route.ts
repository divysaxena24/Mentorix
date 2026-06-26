import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/db"
import { resumesTable } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { currentUser } from "@clerk/nextjs/server"

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userEmail = user.primaryEmailAddress.emailAddress

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (id) {
      const result = await db
        .select()
        .from(resumesTable)
        .where(and(eq(resumesTable.id, parseInt(id)), eq(resumesTable.userEmail, userEmail)))
        .limit(1)

      if (result.length === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      return NextResponse.json({
        id: result[0].id,
        resumeName: result[0].resumeName,
        resumeData: JSON.parse(result[0].resumeData),
        createdAt: result[0].createdAt,
        updatedAt: result[0].updatedAt,
      })
    }

    // List all versions for the user
    const results = await db
      .select({ id: resumesTable.id, resumeName: resumesTable.resumeName, createdAt: resumesTable.createdAt, updatedAt: resumesTable.updatedAt })
      .from(resumesTable)
      .where(eq(resumesTable.userEmail, userEmail))
      .orderBy(desc(resumesTable.updatedAt))

    return NextResponse.json(results)
  } catch (error: any) {
    console.error("Versions fetch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userEmail = user.primaryEmailAddress.emailAddress

    const { resumeId, resumeName, resumeData } = await req.json()

    // Create a new version (save the current state)
    const inserted = await db
      .insert(resumesTable)
      .values({
        userEmail,
        resumeName: resumeName || "Untitled Resume",
        resumeData: JSON.stringify(resumeData),
      })
      .returning()

    return NextResponse.json({
      id: inserted[0].id,
      resumeName: inserted[0].resumeName,
      createdAt: inserted[0].createdAt,
    })
  } catch (error: any) {
    console.error("Version save error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
