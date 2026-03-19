"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    Map,
    Sparkles,
    Loader2,
    BookOpen,
    Send,
    History,
    Target,
    Clock,
    BarChart,
    Calendar,
    Lightbulb
} from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { toast } from "sonner"
import { createCourseAction } from "@/app/actions/courseActions"
import { deleteRoadmapAction, getRoadmapHistoryAction } from "@/app/actions/roadmapActions"
import { RoadmapSkeleton } from "@/components/ToolSkeletons"
import { Milestone, RoadmapResult } from "@/types"
import MilestoneDialog from "./MilestoneDialog"
import RoadmapForm from "./RoadmapForm"
import RoadmapView from "./RoadmapView"
import RoadmapHistory from "./RoadmapHistory"

interface RoadmapClientProps {
    initialHistory: RoadmapResult[];
}

export default function RoadmapClient({ initialHistory }: RoadmapClientProps) {
    const [targetField, setTargetField] = useState("")
    const [timeline, setTimeline] = useState("")
    const [currentLevel, setCurrentLevel] = useState("Beginner")
    const [weeklyCommitment, setWeeklyCommitment] = useState("")

    const [loading, setLoading] = useState(false)
    const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null)
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)

    const [view, setView] = useState<"generator" | "history">("generator")
    const [history, setHistory] = useState<RoadmapResult[]>(initialHistory)
    const [fetchingHistory, setFetchingHistory] = useState(false)
    const [generatingCourse, setGeneratingCourse] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()
    const selectedId = searchParams.get("id")

    // Sync URL ID with selection
    useEffect(() => {
        if (selectedId && history.length > 0) {
            const found = history.find(h => String(h.id) === selectedId)
            if (found) {
                setRoadmap(found)
                setView("history")
            }
        }
    }, [selectedId, history])

    const fetchHistory = useCallback(async () => {
        setFetchingHistory(true)
        try {
            const result = await getRoadmapHistoryAction();
            if (result.success && result.data) {
                const formattedHistory = result.data.map((item) => ({
                    ...item.roadmapData,
                    id: item.id,
                    createdAt: item.createdAt,
                    targetField: item.targetField
                })) as RoadmapResult[];
                setHistory(formattedHistory)
            }
        } catch (err) {
            console.error("Failed to fetch history:", err)
        } finally {
            setFetchingHistory(false)
        }
    }, [])

    const handleDeleteRoadmap = async (id: string | number) => {
        try {
            const numericId = typeof id === "string" ? parseInt(id) : id;
            const result = await deleteRoadmapAction(numericId);
            if (result.success) {
                toast.success("Roadmap deleted successfully");
                fetchHistory();
            } else {
                toast.error(result.error || "Failed to delete roadmap");
            }
        } catch (err) {
            console.error("Failed to delete roadmap:", err);
            toast.error("Failed to delete roadmap");
        }
    };

    const handleGenerate = async () => {
        if (!targetField || !timeline) {
            toast.error("Please fill in the target field and timeline")
            return
        }

        setLoading(true)
        setRoadmap(null)
        try {
            const response = await axios.post("/api/roadmap", {
                targetField,
                timeline,
                currentLevel,
                weeklyCommitment
            })
            setRoadmap(response.data)
            toast.success("Roadmap generated successfully!")
            fetchHistory()
        } catch (err: unknown) {
            console.error(err)
            toast.error("Failed to generate roadmap")
        } finally {
            setLoading(false)
        }
    }

    const handleBuildCourse = async (topic: string, milestone?: Milestone, index?: number) => {
        setGeneratingCourse(true)
        const loadingToast = toast.loading("Generating your personalized course content...")
        try {
            const result = await createCourseAction(
                topic,
                currentLevel || "Intermediate",
                timeline || "4 Weeks",
                "Mastery",
                roadmap?.id ? Number(roadmap.id) : undefined,
                index
            )

            if (result.success) {
                toast.success("Course generated successfully!", { id: loadingToast })
                router.push(`/ai-tools/course?id=${result.courseId}`)
            } else {
                throw new Error(result.error)
            }
        } catch (err: any) {
            console.error("COURSE GENERATION ERROR:", err)
            toast.error(err.message || "Failed to generate course", { id: loadingToast })
        } finally {
            setGeneratingCourse(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-6 pb-20">
            <MilestoneDialog
                milestone={selectedMilestone}
                onClose={() => setSelectedMilestone(null)}
                onBuildCourse={handleBuildCourse}
                generatingCourse={generatingCourse}
            />

            <div className="flex gap-4 mb-10 bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl w-fit border border-white/10 shadow-2xl self-start md:self-end">
                <button
                    onClick={() => { setView("generator"); setRoadmap(null); }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${view === "generator" ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                    New Roadmap
                </button>
                <button
                    onClick={() => { setView("history"); setRoadmap(null); }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${view === "history" ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                    History
                </button>
            </div>

            {loading ? (
                <RoadmapSkeleton />
            ) : roadmap ? (
                <RoadmapView
                    roadmap={roadmap}
                    onReset={() => setRoadmap(null)}
                    onSelectMilestone={setSelectedMilestone}
                    onBuildCourse={handleBuildCourse}
                    generatingCourse={generatingCourse}
                    view={view}
                />
            ) : view === "generator" ? (
                <RoadmapForm
                    targetField={targetField}
                    setTargetField={setTargetField}
                    timeline={timeline}
                    setTimeline={setTimeline}
                    currentLevel={currentLevel}
                    setCurrentLevel={setCurrentLevel}
                    weeklyCommitment={weeklyCommitment}
                    setWeeklyCommitment={setWeeklyCommitment}
                    onGenerate={handleGenerate}
                />
            ) : (
                <RoadmapHistory
                    history={history}
                    fetching={fetchingHistory}
                    onSelect={setRoadmap}
                    onDelete={handleDeleteRoadmap}
                />
            )}
        </div>
    )
}
