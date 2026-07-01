import type { Metadata } from "next"
import { Suspense } from "react"
import CoverLetterClient from "./CoverLetterClient"
import { CoverLetterSkeleton } from "@/components/ToolSkeletons"

export const metadata: Metadata = {
    title: "Cover Letter Generator",
    description: "Forge highly personalized cover letters that map your unique experiences to specific job requirements. Stand out with AI-optimized professional persuasion.",
    openGraph: {
        title: "Cover Letter Generator • Mentorix",
        description: "Map your unique professional context to any job description instantly.",
    },
    twitter: { title: "Cover Letter Generator • Mentorix" },
}

export default function CoverLetterPage() {
    return (
        <Suspense fallback={<CoverLetterSkeleton />}>
            <CoverLetterClient />
        </Suspense>
    )
}
