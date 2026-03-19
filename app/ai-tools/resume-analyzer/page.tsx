import { Suspense } from "react"
import { Metadata } from "next"
import { Loader2 } from "lucide-react"
import ResumeAnalyzerClient from "./ResumeAnalyzerClient"

export const metadata: Metadata = {
    title: "Job Readiness Analyzer | Mentorix Professional Tools",
    description: "Analyze your resume against specific job descriptions or field benchmarks. Get an ATS score, identify critical gaps, and get actionable advice to land your dream job.",
}

export default function ResumeAnalyzerPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Initializing Analyzer...</p>
            </div>
        }>
            <ResumeAnalyzerClient />
        </Suspense>
    )
}
