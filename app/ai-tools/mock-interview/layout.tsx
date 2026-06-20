import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mentorix",
    description: "Practice real-world technical interviews with AI. Get immediate feedback, scores, and track your progress.",
};

export default function MockInterviewLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
