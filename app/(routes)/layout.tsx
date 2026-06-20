import type { Metadata } from "next";
import DashboardLayout from "@/components/layout/DashboardLayout"

export const metadata: Metadata = {
    title: "Mentorix",
    description: "Review and manage your past AI interactions, generated documents, roadmaps, and history.",
};
export default function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    return <DashboardLayout>{children}</DashboardLayout>
}
