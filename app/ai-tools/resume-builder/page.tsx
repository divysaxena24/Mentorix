import { Suspense } from "react"
import { Metadata } from "next"
import { Loader2 } from "lucide-react"
import ResumeClient from "./ResumeClient"

export const metadata: Metadata = {
    title: "Resume Architect | Mentorix Professional Tools",
    description: "Build a professional, high-impact resume with Mentorix's AI Resume Architect. Feature-rich, interactive, and optimized for applicant tracking systems.",
}

export default function ResumeBuilderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Workspace...</p>
                </div>
            </div>
        }>
            <ResumeClient />
        </Suspense>
    )
}
