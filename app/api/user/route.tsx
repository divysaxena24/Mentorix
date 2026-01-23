import { NextRequest, NextResponse } from "next/server";
// import { eq } from "drizzle-orm";
// import { db } from "@/configs/db";
// import { usersTable } from "@/configs/schema";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/configs/supabase";

export async function POST(req: NextRequest) {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser || !clerkUser.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = clerkUser.primaryEmailAddress.emailAddress;
        const name = clerkUser.fullName ?? "";

        // =========================================================
        //  DRIZZLE (NEON) — COMMENTED OUT COMPLETELY
        // =========================================================
        /*
        let dbUser: any = null;
        let dbStatus: 200 | 201 = 200;

        {
            const [user] = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.email, email));

            if (user) {
                dbUser = user;
                dbStatus = 200;
            } else {
                const [createdUser] = await db
                    .insert(usersTable)
                    .values({ email, name })
                    .returning();

                if (!createdUser) {
                    return NextResponse.json(
                        { error: "Failed to create user in Drizzle" },
                        { status: 500 }
                    );
                }

                dbUser = createdUser;
                dbStatus = 201;
            }
        }
        */

        // =========================================================
        // ✅ SUPABASE ONLY — SINGLE SOURCE OF TRUTH
        // =========================================================
        const { data, error } = await supabaseAdmin
            .from("users")
            .upsert(
                {
                    email,
                    name,
                },
                { onConflict: "email" }
            )
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        // =========================================================
        // ✅ SINGLE, CLEAN RESPONSE
        // =========================================================
        return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || "Server error" },
            { status: 500 }
        );
    }
}
