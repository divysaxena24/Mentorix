"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Mic, History, Play, Plus, BookOpen, BrainCircuit, ArrowRight, Loader2, Zap, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function MockInterviewDashboard() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showCustomModal, setShowCustomModal] = useState(false)

    // Form state
    const [topic, setTopic] = useState("")
    const [duration, setDuration] = useState("15 min")
    const [difficulty, setDifficulty] = useState("Medium")

    const [history, setHistory] = useState<any[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)

    // Delete Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        isLoading: boolean;
    }>({
        isOpen: false,
        title: "",
        description: "",
        onConfirm: () => { },
        isLoading: false
    })

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/mi-history")
                if (res.ok) {
                    const data = await res.json()
                    setHistory(data)
                }
            } catch (error) {
                console.error("Error fetching history:", error)
            } finally {
                setHistoryLoading(false)
            }
        }
        fetchHistory()
    }, [])

    const handleDelete = (id: number, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        setConfirmModal({
            isOpen: true,
            title: "Delete Interview Report?",
            description: "This will permanently remove this interview session and all its associated data. This action cannot be undone.",
            isLoading: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }))
                try {
                    const res = await fetch(`/api/mi-history?id=${id}`, { method: 'DELETE' })
                    if (res.ok) {
                        setHistory(prev => prev.filter(item => item.id !== id))
                        setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    } else {
                        alert("Failed to delete interview.")
                    }
                } catch (error) {
                    console.error("Delete error:", error)
                    alert("Error deleting interview.")
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }))
                }
            }
        })
    }

    const handleClearAll = () => {
        setConfirmModal({
            isOpen: true,
            title: "Clear All History?",
            description: "Are you sure you want to clear your ENTIRE interview history? Every single report will be permanently deleted.",
            isLoading: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }))
                try {
                    const res = await fetch("/api/mi-history?clearAll=true", { method: 'DELETE' })
                    if (res.ok) {
                        setHistory([])
                        setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    } else {
                        alert("Failed to clear history.")
                    }
                } catch (error) {
                    console.error("Clear all error:", error)
                    alert("Error clearing history.")
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }))
                }
            }
        })
    }

    const handleStartCustom = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!topic) return

        setIsLoading(true)
        try {
            const res = await fetch("/api/mock-interview/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "Custom", topic, duration, difficulty }),
            })

            if (res.ok) {
                const data = await res.json()
                router.push(`/ai-tools/mock-interview/room/${data.interviewId}`)
            } else {
                const text = await res.text()
                console.error("Failed to start:", text)
                alert("Error starting interview: " + text)
                setIsLoading(false)
            }
        } catch (error) {
            console.error("Error starting interview", error)
            setIsLoading(false)
        }
    }

    const [isResumeLoading, setIsResumeLoading] = useState(false)
    const handleStartResume = async () => {
        setIsResumeLoading(true)
        try {
            const res = await fetch("/api/mock-interview/start-resume", {
                method: "POST"
            })

            if (res.ok) {
                const data = await res.json()
                router.push(`/ai-tools/mock-interview/room/${data.interviewId}`)
            } else {
                const text = await res.text()
                console.error("Failed to start from resume:", text)
                alert("Error: " + (JSON.parse(text).error || text))
                setIsResumeLoading(false)
            }
        } catch (error) {
            console.error("Error starting resume interview", error)
            alert("Network error starting interview.")
            setIsResumeLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 px-6 lg:px-12 py-12 relative overflow-hidden text-white">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <Link href="/ai-tools" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group">
                            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                            Back to Features
                        </Link>
                        <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight flex items-center gap-4">
                            AI Mock <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Interview</span>
                        </h1>
                        <p className="text-slate-400 mt-4 text-lg max-w-2xl font-medium">
                            Practice real-world technical interviews with a hyper-realistic voice AI. Get immediate feedback, scores, and track your progress.
                        </p>
                    </div>
                </div>

                {/* Main Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resume Based Card */}
                    <div className="bg-gradient-to-br from-white/5 to-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                            <BrainCircuit className="w-24 h-24 text-purple-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-purple-500/20 flex items-center justify-center rounded-2xl mb-6">
                                <BookOpen className="w-8 h-8 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Resume-Based Interview</h2>
                            <p className="text-slate-400 mb-8 max-w-sm">Automatically generate an interview tailored to your skills, projects, and target role from your Mentorix profile.</p>

                            <button
                                onClick={handleStartResume}
                                disabled={isResumeLoading}
                                className="flex items-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40"
                            >
                                {isResumeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                {isResumeLoading ? "Analyzing Resume..." : "Auto-Generate"}
                            </button>
                        </div>
                    </div>

                    {/* Custom Interview Card */}
                    <div className="bg-gradient-to-br from-white/5 to-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Mic className="w-24 h-24 text-cyan-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-cyan-500/20 flex items-center justify-center rounded-2xl mb-6">
                                <Plus className="w-8 h-8 text-cyan-400" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Custom Interview</h2>
                            <p className="text-slate-400 mb-8 max-w-sm">Choose any topic, set the duration and difficulty, and practice exactly what you need to master.</p>

                            <button
                                onClick={() => setShowCustomModal(true)}
                                className="flex items-center gap-2 px-6 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40"
                            >
                                <Plus className="w-4 h-4" /> Create Custom
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent History Section (Placeholder for now) */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <History className="w-6 h-6 text-blue-400" />
                            <h2 className="text-xl font-black uppercase tracking-tight">Recent Interviews</h2>
                        </div>
                        {history.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-xl border border-red-500/20 transition-all flex items-center gap-2 group"
                            >
                                <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                Clear All
                            </button>
                        )}
                    </div>

                    {historyLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-4 text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-sm font-bold uppercase tracking-widest">Loading History...</p>
                        </div>
                    ) : history.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {history.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/ai-tools/mock-interview/report/${item.id}`}
                                    className="group block bg-slate-900/50 border border-white/5 p-6 rounded-2xl hover:border-blue-500/30 hover:bg-slate-900 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col gap-2">
                                            <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest inline-block w-fit ${item.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                }`}>
                                                {item.status}
                                            </div>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase">
                                                {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(item.id, e)}
                                            className="p-2 bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all border border-transparent hover:border-red-500/30"
                                            title="Delete Interview"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tight mb-1 group-hover:text-blue-400 transition-colors">{item.topic}</h3>
                                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500" /> {item.difficulty}</span>
                                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-purple-500" /> {item.duration}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <p className="font-medium">No previous interviews found.</p>
                            <p className="text-sm mt-2">Complete a mock interview to see your detailed history here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Interview Modal Overlay */}
            {showCustomModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCustomModal(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 relative z-10"
                    >
                        <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Start Custom Interview</h2>
                        <form onSubmit={handleStartCustom} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Topic / Domain</label>
                                <input
                                    type="text"
                                    required
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. React.js, System Design, Behavioral"
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Difficulty</label>
                                    <select
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                                    >
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Duration</label>
                                    <select
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
                                    >
                                        <option>5 min</option>
                                        <option>15 min</option>
                                        <option>30 min</option>
                                        <option>45 min</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCustomModal(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Session"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Premium Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => !confirmModal.isLoading && setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[2rem] p-8 relative z-10 overflow-hidden shadow-2xl shadow-red-500/10"
                    >
                        {/* Decorative background for danger */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full -mr-16 -mt-16" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-500/20 flex items-center justify-center rounded-2xl mb-6 border border-red-500/20">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight mb-3">{confirmModal.title}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                {confirmModal.description}
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                    disabled={confirmModal.isLoading}
                                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5"
                                >
                                    No, Keep it
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    disabled={confirmModal.isLoading}
                                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                >
                                    {confirmModal.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
