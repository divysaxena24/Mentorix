import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Tools | Mentorix",
    description: "AI-powered career tools — resume analyzer, roadmap generator, course builder, career chat, and more.",
};

export default function AiToolsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-950">
            {children}
        </div>
    )
}
