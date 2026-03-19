import type { Metadata } from "next"
import { Suspense } from "react"
import CourseClient from "./CourseClient"
import { RoadmapSkeleton } from "@/components/ToolSkeletons"

export const metadata: Metadata = {
    title: "AI Interactive Course | Mentorix Premium Learning",
    description: "Launch your personalized learning mission. High-depth AI-generated courses with industry context, real-world projects, and curated video mentorship.",
    openGraph: {
        title: "Personalized AI Learning Path | Mentorix",
        description: "Deep-dive into any topic with our premium AI course forge.",
    }
}

export default function CoursePage() {
    return (
        <Suspense fallback={<RoadmapSkeleton />}>
            <CourseClient />
        </Suspense>
    )
}
