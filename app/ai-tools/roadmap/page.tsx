import { currentUser } from "@clerk/nextjs/server";
import RoadmapClient from "./RoadmapClient";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";
import { getRoadmapHistoryAction } from "@/app/actions/roadmapActions";
import { db } from "@/lib/db/db";
import { careerGoalsTable, userSkillsTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const metadata: Metadata = {
    title: "Career Roadmap Studio",
    description: "Generate a personalized, project-driven, outcome-focused career roadmap tailored to your target role, company, and skill gaps.",
    openGraph: { title: "Career Roadmap Studio • Mentorix" },
    twitter: { title: "Career Roadmap Studio • Mentorix" },
};

export default async function RoadmapPage() {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
        redirect("/sign-in");
    }

    // Fetch all profile data for auto-population
    let profileData = {
        targetRole: null as string | null,
        targetCompanies: null as string | null,
        existingSkills: [] as string[],
    };

    try {
        // Fetch career goals
        const [goals] = await db.select()
            .from(careerGoalsTable)
            .where(eq(careerGoalsTable.userEmail, userEmail))
            .limit(1);

        if (goals) {
            profileData.targetRole = goals.targetRole;
            profileData.targetCompanies = goals.targetCompanies;
        }

        // Fetch existing skills
        const skills = await db.select()
            .from(userSkillsTable)
            .where(eq(userSkillsTable.userEmail, userEmail));

        profileData.existingSkills = skills.map(s => s.skillName);

    } catch (e) {
        console.warn("[RoadmapPage] Could not fetch profile data:", e);
    }

    // Fetch history using the server action
    const historyRes = await getRoadmapHistoryAction();
    const initialHistory = (historyRes.success && historyRes.data) ? historyRes.data.map((item: any) => ({
        ...item.roadmapData,
        id: item.id,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
        targetField: item.targetField
    })) : [];

    if (!historyRes.success) {
        console.error("ROADMAP_PAGE_HISTORY_ERROR:", historyRes.error);
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/ai-tools" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Features</span>
                </Link>

                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        <Sparkles className="w-3 h-3" />
                        Premium AI Engine
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-4 uppercase">
                        Career <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Roadmap Studio</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-2xl font-medium">
                        Personalized, project-driven, and date-aware roadmaps tailored to your target role, company, and skill gaps — crafted by AI career strategists.
                    </p>
                </div>
            </div>

            <RoadmapClient initialHistory={initialHistory as any} profileData={profileData} />
        </div>
    );
}
