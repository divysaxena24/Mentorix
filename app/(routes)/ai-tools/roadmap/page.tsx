"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Map,
    Sparkles,
    ArrowLeft,
    Loader2,
    Target,
    Clock,
    BarChart,
    Calendar,
    CheckCircle2,
    BookOpen,
    Lightbulb,
    Send,
    History,
    Trash2
} from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RoadmapSkeleton } from "@/components/ToolSkeletons"
import { Milestone, RoadmapResult } from "@/types"


export default function RoadmapPage() {
    const [targetField, setTargetField] = useState("")
    const [timeline, setTimeline] = useState("")
    const [currentLevel, setCurrentLevel] = useState("Beginner")
    const [weeklyCommitment, setWeeklyCommitment] = useState("")

    const [loading, setLoading] = useState(false)
    const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null)
    const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)

    const [view, setView] = useState<"generator" | "history">("generator")
    const [history, setHistory] = useState<RoadmapResult[]>([])
    const [fetchingHistory, setFetchingHistory] = useState(false)

    const fetchHistory = useCallback(async () => {
        setFetchingHistory(true)
        try {
            const response = await axios.get("/api/roadmap/history")
            // The API returns an array of { id, userEmail, targetField, roadmapData, createdAt }
            // We need to map roadmapData (which is already parsed in the API) to our RoadmapResult
            const formattedHistory = response.data.map((item: any) => ({
                ...item.roadmapData,
                id: item.id,
                createdAt: item.createdAt,
                targetField: item.targetField
            }))
            setHistory(formattedHistory)
        } catch (err) {
            console.error("Failed to fetch history:", err)
        } finally {
            setFetchingHistory(false)
        }
    }, [])

    const handleDeleteRoadmap = async (id: string | number) => {
        try {
            await axios.delete(`/api/roadmap/history?id=${id}`);
            toast.success("Roadmap deleted successfully");
            fetchHistory();
        } catch (err) {
            console.error("Failed to delete roadmap:", err);
            toast.error("Failed to delete roadmap");
        }
    };

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

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
            fetchHistory() // Refresh history after generation
        } catch (err: any) {
            console.error(err)
            toast.error("Failed to generate roadmap")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Detailed Milestone Dialog */}
            <Dialog open={!!selectedMilestone} onOpenChange={(open) => !open && setSelectedMilestone(null)}>
                <DialogContent className="max-w-2xl bg-white rounded-[2rem] p-8 border-none shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 blur-3xl -mr-32 -mt-32 rounded-full" />

                    {selectedMilestone && (
                        <div className="relative z-10 space-y-8">
                            <DialogHeader>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 w-fit">
                                    {selectedMilestone.week}
                                </div>
                                <DialogTitle className="text-3xl font-black text-gray-900 leading-tight">
                                    {selectedMilestone.goal}
                                </DialogTitle>
                                <DialogDescription className="text-gray-500 font-medium">
                                    Deep dive and actionable steps for this milestone.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h5 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Actionable Steps</h5>
                                    <div className="space-y-4">
                                        {selectedMilestone.detailedSteps.map((step, idx) => (
                                            <div key={idx} className="flex gap-4 group">
                                                <div className="shrink-0 w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold shadow-lg group-hover:scale-110 transition-transform">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-sm text-gray-700 font-semibold leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <h5 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Learning Topics</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedMilestone.topics.map((topic, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-lg text-[11px] font-bold">
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h5 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Study Resources</h5>
                                        <ul className="space-y-2">
                                            {selectedMilestone.resources.map((resource, idx) => (
                                                <li key={idx} className="flex items-center gap-3 text-xs text-gray-600 font-bold">
                                                    <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full" />
                                                    {resource}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                </Link>

                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        <Sparkles className="w-3 h-3" />
                        AI Learning Path
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                        Custom Learning Roadmap
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Tell us what you want to master, and we'll create a step-by-step roadmap tailored to your timeline and skill level.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-20">
                <div className="flex gap-4 mb-10 bg-zinc-100 p-1.5 rounded-2xl w-fit">
                    <button
                        onClick={() => { setView("generator"); setRoadmap(null); }}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === "generator" && !roadmap ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        New Roadmap
                    </button>
                    <button
                        onClick={() => { setView("history"); setRoadmap(null); }}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${view === "history" && !roadmap ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        History
                    </button>
                </div>

                {loading ? (
                    <RoadmapSkeleton />
                ) : roadmap ? (
                    /* Roadmap View */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
                        <div className="bg-zinc-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[120px] -mr-48 -mt-48 rounded-full" />
                            <div className="relative z-10 max-w-4xl">
                                <h2 className="text-4xl font-black mb-4">{roadmap.title}</h2>
                                <p className="text-zinc-400 text-lg leading-relaxed mb-10">{roadmap.description}</p>
                                <button
                                    onClick={() => setRoadmap(null)}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold border border-white/10 transition-all"
                                >
                                    {view === "history" ? "Back to History" : "Build Another Path"}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Roadmap Timeline */}
                            <div className="lg:col-span-2 space-y-6">
                                {roadmap.milestones?.map((milestone, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedMilestone(milestone)}
                                        className="w-full text-left group relative pl-12 pb-12 last:pb-0 block"
                                    >
                                        {/* Vertical connector */}
                                        <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-zinc-100 group-last:hidden" />

                                        {/* Milestone Dot */}
                                        <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white z-10 shadow-lg group-hover:scale-110 transition-transform">
                                            <span className="text-xs font-black">M{idx + 1}</span>
                                        </div>

                                        <div className="bg-white rounded-[2rem] p-8 border border-zinc-100 shadow-sm group-hover:shadow-xl group-hover:border-zinc-200 group-hover:-translate-y-1 transition-all duration-300">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                <h4 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{milestone.goal}</h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-4 py-1.5 bg-zinc-50 text-zinc-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-100 italic">
                                                        {milestone.week}
                                                    </span>
                                                    <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Sparkles className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Core Topics</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {milestone.topics?.map((topic, tIdx) => (
                                                            <span key={tIdx} className="px-3 py-1 bg-zinc-50 border border-zinc-100 text-zinc-900 rounded-lg text-[11px] font-bold">
                                                                {topic}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Recommended Resources</p>
                                                    <ul className="space-y-2">
                                                        {milestone.resources?.slice(0, 2).map((resource, rIdx) => (
                                                            <li key={rIdx} className="flex items-center gap-2 text-[11px] text-gray-500 font-bold truncate">
                                                                <div className="w-1 h-1 bg-zinc-300 rounded-full" />
                                                                {resource}
                                                            </li>
                                                        ))}
                                                        {milestone.resources && milestone.resources.length > 2 && (
                                                            <li className="text-[10px] text-blue-500 font-black uppercase tracking-widest pt-1">
                                                                + {milestone.resources.length - 2} more resources
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-zinc-50 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Click for detailed breakdown</span>
                                                <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                                                    View Details
                                                    <div className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                                                        <ArrowLeft className="w-3 h-3 rotate-180" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Expert Tips */}
                            <div className="lg:col-span-1">
                                <div className="bg-zinc-50 rounded-[2.5rem] p-10 border border-zinc-100 sticky top-10">
                                    <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2">
                                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                                        Study Tips
                                    </h3>
                                    <div className="space-y-6">
                                        {roadmap.tips?.map((tip, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className="shrink-0 w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-gray-900 shadow-sm">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-sm text-gray-600 font-medium leading-relaxed">{tip}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : view === "generator" ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Side: Form */}
                        <div className="bg-zinc-900 rounded-[2.5rem] p-10 shadow-2xl border border-white/5 space-y-8">
                            <div className="space-y-6">
                                {/* Field */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                        <Target className="w-3 h-3" /> What do you want to learn?
                                    </label>
                                    <input
                                        type="text"
                                        value={targetField}
                                        onChange={(e) => setTargetField(e.target.value)}
                                        placeholder="e.g. FullStack Development with Next.js"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
                                    />
                                </div>

                                {/* Timeline & Commitment */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> Timeline
                                        </label>
                                        <input
                                            type="text"
                                            value={timeline}
                                            onChange={(e) => setTimeline(e.target.value)}
                                            placeholder="e.g. 3 Months"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Weekly Commitment
                                        </label>
                                        <input
                                            type="text"
                                            value={weeklyCommitment}
                                            onChange={(e) => setWeeklyCommitment(e.target.value)}
                                            placeholder="e.g. 15 Hours"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Level */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                        <BarChart className="w-3 h-3" /> Current Skill Level
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["Beginner", "Intermediate", "Advanced"].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setCurrentLevel(level)}
                                                className={`py-3 rounded-xl text-xs font-bold border transition-all ${currentLevel === level
                                                    ? "bg-white text-black border-white"
                                                    : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-xl group"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Building your Roadmap...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        <span>Generate Roadmap</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Right Side: Visual decoration / Info */}
                        <div className="hidden lg:flex flex-col justify-center space-y-8 p-10 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black text-gray-900 leading-tight">Master any skill with a clear sequence of milestones.</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">
                                    Our AI analyzes the required concepts and dependencies to build a path that maximizes your learning efficiency.
                                </p>
                            </div>

                            <div className="space-y-4 pt-8">
                                {[
                                    { icon: CheckCircle2, text: "Curated learning resources", color: "text-green-500" },
                                    { icon: BookOpen, text: "Sequential topic mastering", color: "text-blue-500" },
                                    { icon: Lightbulb, text: "Expert study tips included", color: "text-yellow-500" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-zinc-100">
                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                        <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* History View */
                    <div className="space-y-6">
                        {fetchingHistory ? (
                            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                <Loader2 className="w-10 h-10 text-zinc-300 animate-spin mb-4" />
                                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Loading history...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-zinc-50 rounded-[3rem] border border-zinc-100">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-zinc-100 mb-6">
                                    <History className="w-8 h-8 text-zinc-300" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">No roadmaps yet</h3>
                                <p className="text-gray-500 font-medium mb-8">Generated roadmaps will appear here for easy access.</p>
                                <button
                                    onClick={() => setView("generator")}
                                    className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-black transition-all hover:bg-black"
                                >
                                    Create your first roadmap
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setRoadmap(item)}
                                        className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm text-left hover:shadow-xl hover:border-zinc-200 transition-all duration-300 group relative overflow-hidden cursor-pointer"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-50 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-blue-50 transition-colors" />

                                        <div className="relative z-10 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                                                    <Map className="w-5 h-5" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                                                    </span>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-2 hover:bg-red-50 text-zinc-300 hover:text-red-500 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently delete your
                                                                    roadmap and remove it from our servers.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteRoadmap(item.id!)}
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                    {item.targetField || item.title}
                                                </h4>
                                                <p className="text-sm text-gray-500 font-medium line-clamp-2 mt-1">
                                                    {item.description}
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-zinc-50 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                    {item.milestones?.length || 0} Milestones
                                                </span>
                                                <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                                                    Open
                                                    <ArrowLeft className="w-3 h-3 rotate-180" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
