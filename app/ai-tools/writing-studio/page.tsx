import { Suspense } from "react"
import { Metadata } from "next"
import WritingClient from "./WritingClient"

export const metadata: Metadata = {
    title: "AI Writing Studio | Mentorix Professional Tools",
    description: "Generate professionally tailored cover letters, statements of purpose, and motivation letters with Mentorix's AI Writing Studio.",
}

export default function WritingStudioPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617]">
                <div className="w-12 h-12 border-4 border-t-blue-500 border-white/5 rounded-full animate-spin mb-6" />
            </div>
        }>
            <WritingClient />
        </Suspense>
    )
}
