import type { Metadata } from "next"
import { Suspense } from "react"
import CoverLetterClient from "./CoverLetterClient"
import { CoverLetterSkeleton } from "@/components/ToolSkeletons"

export const metadata: Metadata = {
    title: "AI Cover Letter Architect | Mentorix Writing Suite",
    description: "Forge highly personalized cover letters that map your unique experiences to specific job requirements. Stand out with AI-optimized professional persuasion.",
    openGraph: {
        title: "AI Cover Letter Generator | Mentorix",
        description: "Map your unique professional context to any job description instantly.",
    }
}

export default function CoverLetterPage() {
    return (
        <Suspense fallback={<CoverLetterSkeleton />}>
            <CoverLetterClient />
        </Suspense>
    )
}
