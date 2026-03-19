import type { Metadata } from "next";
import DashboardLayout from "@/components/layout/DashboardLayout"

export const metadata: Metadata = {
    title: "Dashboard | Mentorix",
    description: "Your AI-powered career dashboard. Track resume scores, roadmaps, and job readiness in real-time.",
};
export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return <DashboardLayout>{children}</DashboardLayout>
}
