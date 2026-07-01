import type { Metadata } from "next";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ResumeProvider } from "@/components/resume/ResumeProvider";

export const metadata: Metadata = {
    description: "Your AI-powered career dashboard. Track resume scores, roadmaps, and job readiness in real-time.",
};

export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ResumeProvider>
            <DashboardLayout>{children}</DashboardLayout>
        </ResumeProvider>
    );
}
