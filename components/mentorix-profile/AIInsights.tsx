"use client"

import { BarChart3, Lightbulb, Map, BookOpen, FileText, PenTool, ArrowUpRight, CheckCircle2, Sparkles, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"

interface AIInsightsProps {
    insights: {
        jobReadinessScore: number
        suggestions: string // JSON string
        breakdown?: string // JSON string
    } | null
    metrics: {
        roadmapsGenerated: number
        coursesGenerated: number
        docsGenerated: number
        resumesAnalysed: number
        resumesBuilt: number
        mentorshipConversations: number
    } | null
}

export default function AIInsights({ insights, metrics }: AIInsightsProps) {
    if (!insights || !metrics) return null;

    const suggestions = JSON.parse(insights.suggestions || "[]")
    const scoreBreakdown = JSON.parse(insights.breakdown || "{}")

    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Career Analytics Column */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-3xl shadow-2xl space-y-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Career Analytics</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mentorix usage & job readiness</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                </div>

                <div className="space-y-12">
                    {/* Top Row: Circle + Compact Metrics */}
                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        {/* Readiness Circular Score */}
                        <div className="relative shrink-0 scale-110 md:scale-125 py-4">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="50%" cy="50%" r="48" className="stroke-white/5 fill-none" strokeWidth="8" />
                                <motion.circle
                                    cx="50%" cy="50%" r="48"
                                    className="stroke-blue-500 fill-none"
                                    strokeWidth="10"
                                    strokeDasharray="301.6"
                                    initial={{ strokeDashoffset: 301.6 }}
                                    animate={{ strokeDashoffset: 301.6 - (301.6 * insights.jobReadinessScore) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white">{insights.jobReadinessScore}</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Readiness</span>
                            </div>
                        </div>

                        {/* Platform Metrics Grid - Compact 3-Column */}
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                            {[
                                { label: "Roadmaps", value: metrics.roadmapsGenerated, icon: Map, color: "text-blue-400" },
                                { label: "Courses", value: metrics.coursesGenerated, icon: BookOpen, color: "text-purple-400" },
                                { label: "AI Docs", value: metrics.docsGenerated, icon: PenTool, color: "text-green-400" },
                                { label: "Analysed", value: metrics.resumesAnalysed, icon: FileText, color: "text-yellow-400" },
                                { label: "Built", value: metrics.resumesBuilt, icon: FileText, color: "text-rose-400" },
                                { label: "Chat", value: metrics.mentorshipConversations, icon: MessageCircle, color: "text-cyan-400" }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white/5 p-3 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors text-center">
                                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-400 transition-colors truncate">{stat.label}</p>
                                    <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Row: Full Width Breakdown Bars */}
                    {Object.keys(scoreBreakdown).length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-8 border-t border-white/5">
                            {Object.entries(scoreBreakdown).map(([key, val]: [string, any], i) => (
                                <div key={i} className="space-y-2 w-full">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                        <p className="text-xs font-black text-white">{val}%</p>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden w-full">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${val}%` }}
                                            className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* AI Recommendations Column */}
            <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-3xl shadow-2xl flex flex-col gap-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">AI Suggestions</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">personalized career advice</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                    </div>
                </div>

                <div className="space-y-4 flex-1">
                    {suggestions.map((s: string, i: number) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all group"
                        >
                            <div className="shrink-0 mt-1">
                                <CheckCircle2 className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                            </div>
                            <p className="text-sm font-medium text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                                {s}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
