"use client"

import { BarChart3, Map, FileText, PenTool, MessageCircle, Lightbulb, CheckCircle2, Sparkles, TrendingUp, Building2 } from "lucide-react"
import { motion } from "framer-motion"

interface AIInsightsProps {
    insights: {
        jobReadinessScore: number
        industryAlignment: number
        suggestions: string // JSON string
        breakdown?: string // JSON string
    } | null
    metrics: {
        roadmapsGenerated: number
        docsGenerated: number
        resumesAnalysed: number
        resumesBuilt: number
        mentorshipConversations: number
    } | null
}

const BREAKDOWN_LABELS: Record<string, string> = {
    resumeQuality: "Resume Quality",
    projectsStrength: "Projects Strength",
    skillsCoverage: "Skills Coverage",
    experience: "Experience",
}

// ─── Metric Card ───────────────────────────────────────────────────────
function MetricCard({
    icon: Icon,
    title,
    value,
    color = "#8b5cf6",
    delay = 0,
}: {
    icon: any;
    title: string;
    value: string | number;
    color?: string;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="relative group"
        >
            <div
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"
                style={{ background: `radial-gradient(ellipse at top, ${color}15 0%, transparent 70%)` }}
            />
            <div
                className="relative h-full backdrop-blur-xl rounded-2xl p-4 border transition-all duration-300 group-hover:border-white/20 group-hover:shadow-2xl"
                style={{
                    background: `linear-gradient(135deg, ${color}08, rgba(255,255,255,0.02))`,
                    borderColor: "rgba(255,255,255,0.08)",
                }}
            >
                <div
                    className="absolute top-0 left-4 right-4 h-[1.5px] rounded-full opacity-60"
                    style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                />
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-1.5 rounded-lg" style={{ background: `${color}15` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-[0.1em]">{title}</h3>
                </div>
                <p className="text-lg font-bold tracking-tight text-white">{value}</p>
            </div>
        </motion.div>
    );
}

// ─── Animated Score Bar ────────────────────────────────────────────────
function AnimatedScoreBar({ value, label, color = "#8b5cf6", delay = 0 }: { value: number; label: string; color?: string; delay?: number }) {
    const pct = Math.min(value, 100);
    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{label}</span>
                <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 + delay }}
                />
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────
export default function AIInsights({ insights, metrics }: AIInsightsProps) {
    if (!insights || !metrics) return null;

    const suggestions = JSON.parse(insights.suggestions || "[]")
    const scoreBreakdown = JSON.parse(insights.breakdown || "{}")

    const readinessColor = insights.jobReadinessScore >= 80 ? "#22c55e" : insights.jobReadinessScore >= 60 ? "#eab308" : insights.jobReadinessScore >= 40 ? "#f97316" : "#ef4444";

    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Career Analytics Column */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] border p-6 sm:p-8 backdrop-blur-3xl shadow-2xl"
                style={{
                    background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.03) 50%, rgba(6,182,212,0.02) 100%)",
                    borderColor: "rgba(59,130,246,0.12)",
                }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl -mr-20 -mt-20"
                    style={{ background: "radial-gradient(circle, #3b82f6, #6366f1, transparent)" }} />

                <div className="relative z-10 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-1">Career Analytics</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mentorix usage & job readiness</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <BarChart3 className="w-5 h-5 text-blue-400" />
                        </div>
                    </div>

                    {/* Readiness Circle + Key Metrics */}
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                        {/* Readiness */}
                        <div className="relative shrink-0 py-2">
                            {/* Glow behind circle */}
                            <div className="absolute inset-0 rounded-full blur-2xl opacity-30"
                                style={{
                                    background: `radial-gradient(circle, ${readinessColor} 0%, transparent 70%)`,
                                    transform: "scale(1.5)",
                                }}
                            />
                            <svg className="w-28 h-28 sm:w-32 sm:h-32 transform -rotate-90 relative z-10 drop-shadow-lg">
                                <circle cx="50%" cy="50%" r="48" className="stroke-white/5 fill-none" strokeWidth="10" />
                                <motion.circle
                                    cx="50%" cy="50%" r="48"
                                    className="fill-none" stroke={readinessColor}
                                    strokeWidth="10"
                                    strokeDasharray="301.6"
                                    initial={{ strokeDashoffset: 301.6 }}
                                    animate={{ strokeDashoffset: 301.6 - (301.6 * Math.min(insights.jobReadinessScore, 100)) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    strokeLinecap="round"
                                    style={{ filter: `drop-shadow(0 0 6px ${readinessColor}60)` }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl sm:text-3xl font-black text-white">{insights.jobReadinessScore}</span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Readiness</span>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
                            {[
                                { label: "Roadmaps", value: metrics.roadmapsGenerated, icon: Map, color: "#3b82f6" },
                                { label: "AI Docs", value: metrics.docsGenerated, icon: PenTool, color: "#22c55e" },
                                { label: "Analysed", value: metrics.resumesAnalysed, icon: FileText, color: "#eab308" },
                                { label: "Built", value: metrics.resumesBuilt, icon: FileText, color: "#f43f5e" },
                                { label: "Chat", value: metrics.mentorshipConversations, icon: MessageCircle, color: "#06b6d4" },
                                { label: "Industry", value: `${insights.industryAlignment}%`, icon: Building2, color: "#8b5cf6" }
                            ].map((stat, i) => (
                                <MetricCard key={i} icon={stat.icon} title={stat.label} value={stat.value} color={stat.color} delay={i * 0.05} />
                            ))}
                        </div>
                    </div>

                    {/* Breakdown Bars */}
                    {Object.keys(scoreBreakdown).length > 0 && (
                        <div className="pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em]">Breakdown</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                                {Object.entries(scoreBreakdown).map(([key, val]: [string, any], i) => {
                                    const label = BREAKDOWN_LABELS[key] || key.replace(/([A-Z])/g, ' $1').trim()
                                    const color = val >= 70 ? "#22c55e" : val >= 45 ? "#eab308" : "#ef4444"
                                    return (
                                        <AnimatedScoreBar key={i} label={label} value={val} color={color} delay={i * 0.08} />
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* AI Suggestions Column */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative overflow-hidden rounded-[2.5rem] border p-6 sm:p-8 backdrop-blur-3xl shadow-2xl flex flex-col gap-6"
                style={{
                    background: "linear-gradient(135deg, rgba(234,179,8,0.04) 0%, rgba(139,92,246,0.03) 100%)",
                    borderColor: "rgba(234,179,8,0.1)",
                }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl -mr-20 -mt-20"
                    style={{ background: "radial-gradient(circle, #eab308, #f59e0b, transparent)" }} />

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-1">AI Suggestions</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">personalized career advice</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                    </div>
                </div>

                <div className="relative z-10 space-y-3 flex-1">
                    {suggestions.length > 0 ? (
                        suggestions.map((s: string, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all group"
                            >
                                <div className="shrink-0 mt-0.5">
                                    <CheckCircle2 className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="text-sm font-medium text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                                    {s}
                                </p>
                            </motion.div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Lightbulb className="w-10 h-10 text-slate-600 mb-3" />
                            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">No suggestions yet</p>
                            <p className="text-slate-600 text-[10px] mt-1">Run a resume analysis to get personalized career advice</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </section>
    )
}
