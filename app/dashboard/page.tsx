import type { Metadata } from "next"
import { currentUser } from "@clerk/nextjs/server";
import { getFullUserProfile } from "@/lib/db/profile";
import DashboardContent from "./DashboardContent";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Dashboard | Mentorix AI Workspace",
    description: "Your central hub for career growth. Monitor your job readiness, manage generated resumes, and track your personalized learning progress.",
}

export default async function DashboardPage() {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!userEmail) {
        redirect("/sign-in");
    }

    const profileData = await getFullUserProfile(userEmail);

    const metrics = {
        resumeScore: profileData?.insights?.atsScore || 0,
        roadmapsGenerated: profileData?.metrics?.roadmapsGenerated || 0,
        jobReadinessScore: profileData?.insights?.jobReadinessScore || 0,
        docsGenerated: profileData?.metrics?.docsGenerated || 0
    };

    return <DashboardContent metrics={metrics} />;
}
