"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import {
    Map,
    Sparkles,
    Loader2,
    Target,
    Clock,
    BarChart,
    Calendar,
    Lightbulb,
    ChevronRight,
    BookOpen,
    Building2
} from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { toast } from "sonner"
import { deleteRoadmapAction, getRoadmapHistoryAction } from "@/app/actions/roadmapActions"
import { RoadmapSkeleton } from "@/components/ToolSkeletons"
import { PremiumMilestone, PremiumRoadmap, AnyRoadmap } from "@/types"
import MilestoneDialog from "./MilestoneDialog"
import RoadmapForm from "./RoadmapForm"
import RoadmapView from "./RoadmapView"
import RoadmapHistory from "./RoadmapHistory"

interface ProfileData {
    targetRole?: string | null;
    targetCompanies?: string | null;
    existingSkills?: string[];
}

interface RoadmapClientProps {
    initialHistory: AnyRoadmap[];
    profileData: ProfileData;
}

export default function RoadmapClient({ initialHistory, profileData }: RoadmapClientProps) {
    // Form state
    const [targetRole, setTargetRole] = useState(profileData.targetRole || "")
    const [careerGoal, setCareerGoal] = useState("")
    const [currentLevel, setCurrentLevel] = useState("Intermediate")
    const [weeklyHours, setWeeklyHours] = useState("14")
    const [duration, setDuration] = useState("16 Weeks");
    const [startDate, setStartDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [targetCompany, setTargetCompany] = useState("");
    const [roadmap, setRoadmap] = useState<PremiumRoadmap | AnyRoadmap | null>(null)
    const [selectedMilestone, setSelectedMilestone] = useState<PremiumMilestone | null>(null)

    const [view, setView] = useState<"generator" | "history">("generator")
    const [history, setHistory] = useState<AnyRoadmap[]>(initialHistory)
    const [fetchingHistory, setFetchingHistory] = useState(false)

    const searchParams = useSearchParams()
    const selectedId = searchParams.get("id")

    // Sync URL ID with selection
    useEffect(() => {
        if (selectedId && history.length > 0) {
            const found = history.find(h => String((h as any).id) === selectedId)
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
                })) as AnyRoadmap[];
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
        if (!targetRole || !duration || !currentLevel) {
            toast.error("Please fill in target role, duration, and skill level")
            return
        }

        setLoading(true)
        setRoadmap(null)
        try {
            const response = await axios.post("/api/roadmap", {
                targetRole,
                careerGoal,
                currentLevel,
                weeklyHours,
                duration,
                startDate,
                targetCompany,
            })
            setRoadmap(response.data)
            toast.success("Premium roadmap generated successfully!")
            fetchHistory()
        } catch (err: unknown) {
            console.error(err)
            const errorMsg = axios.isAxiosError(err)
                ? err.response?.data?.error || "Failed to generate roadmap"
                : "Failed to generate roadmap"
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    // Detect if current roadmap is premium or legacy
    const isPremium = roadmap && "header" in roadmap;

    return (
        <div className="max-w-7xl mx-auto px-6 pb-20">
            <MilestoneDialog
                milestone={selectedMilestone}
                onClose={() => setSelectedMilestone(null)}
                isPremium={true}
            />

            <div className="flex gap-3 mb-10 bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl w-fit border border-white/10 shadow-2xl self-start md:self-end">
                <button
                    onClick={() => { setView("generator"); setRoadmap(null); }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${view === "generator" ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        New Roadmap
                    </div>
                </button>
                <button
                    onClick={() => { setView("history"); setRoadmap(null); }}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${view === "history" ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"}`}
                >
                    <div className="flex items-center gap-2">
                        <Map className="w-3.5 h-3.5" />
                        History
                    </div>
                </button>
            </div>

            {loading ? (
                <RoadmapSkeleton />
            ) : roadmap ? (
                <RoadmapView
                    roadmap={roadmap}
                    onReset={() => setRoadmap(null)}
                    onSelectMilestone={setSelectedMilestone}
                    view={view}
                    isPremium={isPremium || false}
                />
            ) : view === "generator" ? (
                <RoadmapForm
                    targetRole={targetRole}
                    setTargetRole={setTargetRole}
                    careerGoal={careerGoal}
                    setCareerGoal={setCareerGoal}
                    currentLevel={currentLevel}
                    setCurrentLevel={setCurrentLevel}
                    weeklyHours={weeklyHours}
                    setWeeklyHours={setWeeklyHours}
                    duration={duration}
                    setDuration={setDuration}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    targetCompany={targetCompany}
                    setTargetCompany={setTargetCompany}
                    onGenerate={handleGenerate}
                    loading={loading}
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
