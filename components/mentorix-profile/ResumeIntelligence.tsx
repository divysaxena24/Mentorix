"use client"

import { Zap, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"

interface ResumeIntelligenceProps {
    insights: {
        atsScore: number
        keywordStrength: string
        projectImpact: string
        breakdown?: string // JSON string
    } | null
    onUpdateResume: () => void
}

// ─── Animated Radial Progress ──────────────────────────────────────────
function AnimatedRadialProgress({
    score,
    size = 96,
    stroke = 8,
    gradientId = "scoreGradient",
    gradientColors = ["#8b5cf6", "#6366f1", "#3b82f6"],
    glowColor = "rgba(139, 92, 246, 0.3)",
}: {
    score: number;
    size?: number;
    stroke?: number;
    gradientId?: string;
    gradientColors?: string[];
    glowColor?: string;
}) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const clampedScore = Math.min(Math.max(score, 0), 100);
    const offset = circ * (1 - clampedScore / 100);

    const scoreColor = clampedScore >= 80 ? "#22c55e" : clampedScore >= 60 ? "#eab308" : clampedScore >= 40 ? "#f97316" : "#ef4444";

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="relative inline-flex items-center justify-center"
        >
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-40"
                style={{
                    background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                    transform: "scale(1.3)",
                }}
            />
            <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={gradientColors[0]} />
                        <stop offset="50%" stopColor={gradientColors[1]} />
                        <stop offset="100%" stopColor={gradientColors[2]} />
                    </linearGradient>
                </defs>
                <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} fill="transparent" className="text-white/[0.06]" />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={r}
                    stroke={`url(#${gradientId})`} strokeWidth={stroke} fill="transparent"
                    strokeDasharray={circ} strokeDashoffset={circ} strokeLinecap="round"
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    style={{ filter: `drop-shadow(0 0 6px ${scoreColor}40)` }}
                />
            </svg>
            <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            >
                <span className="text-2xl font-bold leading-none tracking-tight" style={{ color: scoreColor }}>
                    {clampedScore}
                </span>
                <span className="text-[8px] font-medium text-white/30 uppercase tracking-widest leading-none mt-0.5">pts</span>
            </motion.div>
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
export default function ResumeIntelligence({ insights, onUpdateResume }: ResumeIntelligenceProps) {
    if (!insights) return null;

    const BREAKDOWN_LABELS: Record<string, string> = {
        resumeQuality: "Resume Quality",
        projectsStrength: "Projects Strength",
        skillsCoverage: "Skills Coverage",
        experience: "Experience",
    }

    const BREAKDOWN_COLORS: Record<string, string> = {
        resumeQuality: "#8b5cf6",
        projectsStrength: "#3b82f6",
        skillsCoverage: "#06b6d4",
        experience: "#22c55e",
    }

    const scoreBreakdown = typeof insights.breakdown === 'string' ? JSON.parse(insights.breakdown) : (insights.breakdown || {})

    const getTier = (score: number) => {
        if (score >= 85) return { label: "Excellent", color: "#22c55e" };
        if (score >= 70) return { label: "Strong", color: "#3b82f6" };
        if (score >= 55) return { label: "Good", color: "#eab308" };
        if (score >= 40) return { label: "Fair", color: "#f97316" };
        return { label: "Needs Work", color: "#ef4444" };
    };
    const tier = getTier(insights.atsScore);

    const entries = Object.entries(scoreBreakdown) as [string, number][];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] border p-6 sm:p-8"
            style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.04) 50%, rgba(6,182,212,0.02) 100%)",
                borderColor: "rgba(139,92,246,0.15)",
            }}
        >
            {/* Animated gradient orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl -mr-20 -mt-20"
                style={{ background: "radial-gradient(circle, #8b5cf6, #3b82f6, transparent)" }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5 blur-3xl -ml-16 -mb-16"
                style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />

            <div className="relative z-10 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-1">Resume Intelligence</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI-powered analysis of your current profile</p>
                    </div>
                    <button
                        onClick={onUpdateResume}
                        className="shrink-0 px-5 py-2.5 bg-white rounded-xl text-[10px] font-bold text-slate-900 uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg"
                    >
                        Update Resume
                    </button>
                </div>

                {/* Main content */}
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
                    {/* Left: Radial Score + Tier */}
                    <div className="w-full lg:w-1/4 flex flex-col items-center gap-4">
                        <div className="relative p-4 sm:p-6 rounded-3xl w-full flex flex-col items-center"
                            style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}>
                            <AnimatedRadialProgress
                                score={insights.atsScore}
                                size={100}
                                stroke={9}
                                gradientId="atsGradient"
                                gradientColors={["#8b5cf6", "#6366f1", "#3b82f6"]}
                                glowColor="rgba(139, 92, 246, 0.35)"
                            />
                            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em]"
                                style={{
                                    background: `${tier.color}15`,
                                    color: tier.color,
                                    border: `1px solid ${tier.color}25`,
                                }}
                            >
                                <Zap className="w-2.5 h-2.5" />
                                {tier.label}
                            </div>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-2">ATS Score</p>
                        </div>
                    </div>

                    {/* Right: Breakdown Bars */}
                    <div className="flex-1 space-y-5">
                        <div className="flex items-center gap-2 mb-1">
                            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                            <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em]">Deep Breakdown</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                            {entries.map(([key, value], i) => {
                                const label = BREAKDOWN_LABELS[key] || key.replace(/([A-Z])/g, ' $1').trim()
                                const color = BREAKDOWN_COLORS[key] || "#8b5cf6"
                                return (
                                    <AnimatedScoreBar
                                        key={i}
                                        label={label}
                                        value={value}
                                        color={value >= 70 ? "#22c55e" : value >= 45 ? "#eab308" : color}
                                        delay={i * 0.1}
                                    />
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
