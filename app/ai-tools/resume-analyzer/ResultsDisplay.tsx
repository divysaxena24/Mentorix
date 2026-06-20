"use client"

import {
    Target, Briefcase, Search, UserCheck,
    Medal, Star, Flag, Building2, TrendingUp, Shield,
    CheckCircle2, AlertTriangle, ArrowRight, Brain,
    BarChart3, Award, Zap
} from "lucide-react"
import { motion } from "framer-motion"
import { AnalysisResult } from "@/types"
import { useIsMobile } from "@/hooks/use-mobile"

interface ResultsDisplayProps {
    result: AnalysisResult;
    onReset: () => void;
    targetRole?: string;
    targetCompany?: string;
}

// ─── Animated Radial Progress with Glow ────────────────────────────────
function AnimatedRadialProgress({
    score,
    size = 72,
    stroke = 6,
    label,
    gradientId = "scoreGradient",
    gradientColors = ["#8b5cf6", "#6366f1", "#3b82f6"],
    glowColor = "rgba(139, 92, 246, 0.3)",
    showGlow = true,
    className = "",
}: {
    score: number;
    size?: number;
    stroke?: number;
    label?: string;
    gradientId?: string;
    gradientColors?: string[];
    glowColor?: string;
    showGlow?: boolean;
    className?: string;
}) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const clampedScore = Math.min(Math.max(score, 0), 100);
    const offset = circ * (1 - clampedScore / 100);

    const getStatusColor = (s: number) => {
        if (s >= 80) return "#22c55e";
        if (s >= 60) return "#eab308";
        if (s >= 40) return "#f97316";
        return "#ef4444";
    };

    const scoreColor = getStatusColor(clampedScore);

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className={`relative inline-flex items-center justify-center ${className}`}
        >
            {/* Glow effect behind the ring */}
            {showGlow && (
                <div
                    className="absolute inset-0 rounded-full blur-xl opacity-40"
                    style={{
                        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
                        transform: "scale(1.3)",
                    }}
                />
            )}

            <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
                {/* Gradient definition */}
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={gradientColors[0]} />
                        <stop offset="50%" stopColor={gradientColors[1]} />
                        <stop offset="100%" stopColor={gradientColors[2]} />
                    </linearGradient>
                </defs>

                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="transparent"
                    className="text-white/[0.06]"
                />

                {/* Progress arc */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={stroke}
                    fill="transparent"
                    strokeDasharray={circ}
                    strokeDashoffset={circ}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    style={{
                        filter: showGlow ? `drop-shadow(0 0 6px ${scoreColor}40)` : undefined,
                    }}
                />
            </svg>

            {/* Center value */}
            <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
            >                    <span
                className="text-sm font-bold leading-none tracking-tight"
                style={{ color: scoreColor, fontSize: size * 0.22 }}
            >
                    {clampedScore}
                </span>
                <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest leading-none mt-0.5">
                    pts
                </span>
            </motion.div>

            {label && (
                <span className="absolute -bottom-5 text-[10px] font-medium text-white/40 uppercase tracking-[0.12em] whitespace-nowrap">
                    {label}
                </span>
            )}
        </motion.div>
    );
}

// ─── Animated Score Bar ────────────────────────────────────────────────
function AnimatedScoreBar({
    value,
    max = 100,
    height = 6,
    color = "#8b5cf6",
    label,
    showValue = true,
    delay = 0,
}: {
    value: number;
    max?: number;
    height?: number;
    color?: string;
    label?: string;
    showValue?: boolean;
    delay?: number;
}) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div className="w-full">
            {(label || showValue) && (
                <div className="flex justify-between items-center mb-1">
                    {label && <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</span>}
                    {showValue && (
                        <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}%</span>
                    )}
                </div>
            )}
            <div
                className="w-full rounded-full overflow-hidden"
                style={{ height, background: "rgba(255,255,255,0.05)" }}
            >
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

// ─── Color-coded Skill Pill Badge ──────────────────────────────────────
const SKILL_CATEGORIES: Record<string, { color: string; bg: string; border: string }> = {
    strong: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.25)" },
    missing: { color: "#eab308", bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.25)" },
    critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
};

function SkillBadge({
    children,
    variant = "strong",
    icon,
    onClick,
}: {
    children: React.ReactNode;
    variant?: keyof typeof SKILL_CATEGORIES;
    icon?: React.ReactNode;
    onClick?: () => void;
}) {
    const v = SKILL_CATEGORIES[variant] || SKILL_CATEGORIES.strong;
    return (
        <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider border transition-all duration-200 cursor-default ${onClick ? "cursor-pointer" : ""}`}
            style={{
                background: v.bg,
                color: v.color,
                borderColor: v.border,
                boxShadow: `0 0 12px ${v.bg}`,
            }}
        >
            {icon && <span className="w-2.5 h-2.5">{icon}</span>}
            {children}
        </motion.span>
    );
}

// ─── Metric Card ───────────────────────────────────────────────────────
function MetricCard({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    color = "#8b5cf6",
    gradient = "from-purple-500/20 to-blue-500/5",
    delay = 0,
    children,
}: {
    icon: any;
    title: string;
    value?: string | number;
    subtitle?: string;
    trend?: "up" | "down" | "neutral";
    color?: string;
    gradient?: string;
    delay?: number;
    children?: React.ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="relative group"
        >
            {/* Hover glow */}
            <div
                className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"
                style={{ background: `radial-gradient(ellipse at top, ${color}15 0%, transparent 70%)` }}
            />

            <div className="relative h-full backdrop-blur-xl rounded-2xl p-3 sm:p-5 border transition-all duration-300 group-hover:border-white/20 group-hover:shadow-2xl"
                style={{
                    background: `linear-gradient(135deg, ${color}08, rgba(255,255,255,0.02))`,
                    borderColor: "rgba(255,255,255,0.08)",
                }}
            >
                {/* Top accent line */}
                <div
                    className="absolute top-0 left-4 right-4 h-[1.5px] rounded-full opacity-60"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                    }}
                />

                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                            style={{ background: `${color}15` }}
                        >
                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                        </div>
                        <h3 className="text-xs font-semibold text-white/60 uppercase tracking-[0.12em]">{title}</h3>
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-[10px] font-medium ${trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-yellow-400"}`}>
                            <TrendingUp className={`w-2.5 h-2.5 ${trend === "down" ? "rotate-180" : trend === "neutral" ? "rotate-90" : ""}`} />
                            {trend === "up" ? "Strong" : trend === "down" ? "Needs Work" : "Stable"}
                        </div>
                    )}
                </div>

                {value !== undefined && (
                    <div className="mb-1">
                        <span className="text-lg font-bold tracking-tight text-white">
                            {value}
                        </span>
                        {subtitle && (
                            <span className="ml-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider">{subtitle}</span>
                        )}
                    </div>
                )}

                {children}
            </div>
        </motion.div>
    );
}

// ─── Section Wrapper ───────────────────────────────────────────────────
function Section({ title, icon: Icon, color = "#8b5cf6", delay = 0, children, className = "" }: {
    title: string;
    icon: any;
    color?: string;
    delay?: number;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay }}
            className={`relative group/section ${className} my-6`}
        >
            {/* Section glow */}
            <div
                className="absolute -inset-2 rounded-3xl opacity-0 group-hover/section:opacity-100 blur-2xl transition-all duration-700"
                style={{ background: `radial-gradient(ellipse at top, ${color}08 0%, transparent 60%)` }}
            />

            <div className="relative backdrop-blur-xl rounded-2xl p-4 sm:p-5 border transition-all duration-300"
                style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                    borderColor: "rgba(255,255,255,0.06)",
                }}
            >
                {/* Section header */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 pb-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <div className="p-2 rounded-xl transition-all duration-300 group-hover/section:scale-110 group-hover/section:shadow-lg"
                        style={{ background: `${color}15` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <h2 className="text-sm font-semibold text-white/80 uppercase tracking-[0.12em]">{title}</h2>
                    <div className="flex-1" />
                    <div
                        className="h-[1px] flex-1 max-w-[60px] opacity-30"
                        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
                    />
                </div>
                {children}
            </div>
        </motion.div>
    );
}

// ─── Recruiter Verdict Card ────────────────────────────────────────────
function RecruiterVerdict({
    text,
    icon: Icon = Brain,
    color = "#8b5cf6",
    variant = "default",
}: {
    text: string;
    icon?: any;
    color?: string;
    variant?: "default" | "compact";
}) {
    if (!text) return null;
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className={`relative overflow-hidden rounded-xl border ${variant === "compact" ? "p-2.5" : "p-3"}`}
            style={{
                background: `linear-gradient(135deg, ${color}08, ${color}03)`,
                borderColor: `${color}20`,
            }}
        >
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-20 h-20 -mr-8 -mt-8 rounded-full opacity-20 blur-xl"
                style={{ background: color }} />

            <div className="relative flex gap-3">
                <div className="shrink-0 mt-0.5">
                    <Icon className={variant === "compact" ? "w-3.5 h-3.5" : "w-4 h-4"} style={{ color }} />
                </div>
                <p className={`leading-relaxed text-white/60 text-xs sm:text-sm`}
                    style={{ fontStyle: "italic" }}>
                    {text}
                </p>
            </div>
        </motion.div>
    );
}

// ─── Enterprise-Grade Progress Bar ────────────────────────────────────
function MiniProgressBar({ value, color = "#8b5cf6", height = 9, label, showValue = true }: {
    value: number;
    color?: string;
    height?: number;
    label?: string;
    showValue?: boolean;
}) {
    const pct = Math.min(value, 100);
    return (
        <div className="w-full">
            {(label || showValue) && (
                <div className="flex justify-between items-center mb-0.5">
                    {label && <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">{label}</span>}
                    {showValue && <span className="text-[10px] font-semibold" style={{ color }}>{value}%</span>}
                </div>
            )}
            <div className="w-full rounded-full overflow-hidden" style={{ height, background: "rgba(255,255,255,0.04)" }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
        </div>
    );
}

// ─── Confidence Meter ──────────────────────────────────────────────────
function ConfidenceMeter({ score }: { score: number }) {
    const clamped = Math.min(Math.max(score, 0), 100);
    const level = clamped >= 80 ? "High" : clamped >= 50 ? "Moderate" : "Low";
    const color = clamped >= 80 ? "#22c55e" : clamped >= 50 ? "#eab308" : "#ef4444";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl rounded-2xl p-3 sm:p-5 border text-center"
            style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                borderColor: "rgba(255,255,255,0.06)",
            }}
        >
            <div className="flex items-center justify-center gap-2 mb-3">
                <Shield className="w-3.5 h-3.5" style={{ color }} />
                <span className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color }}>Analysis Confidence</span>
            </div>
            <div className="relative w-full max-w-[180px] mx-auto h-2 rounded-full overflow-hidden mb-2"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}44, ${color})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${clamped}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
                {/* Glow dot */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                    style={{
                        background: color,
                        boxShadow: `0 0 12px ${color}`,
                        left: `${clamped}%`,
                        marginLeft: -6,
                    }}
                    initial={{ left: "0%" }}
                    animate={{ left: `${clamped}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-white/30 uppercase tracking-wider px-1">
                <span>Low</span>
                <span>Moderate</span>
                <span>High</span>
            </div>
            <p className="mt-2 text-[11px] sm:text-xs font-semibold" style={{ color }}>
                {level} Confidence
            </p>
        </motion.div>
    );
}

// ─── Candidate Benchmark ───────────────────────────────────────────────
function CandidateBenchmark({ scores }: { scores: Record<string, number> }) {
    const benchmarkColors: Record<string, string> = {
        "Skills": "#8b5cf6",
        "Projects": "#3b82f6",
        "Experience": "#06b6d4",
        "ATS": "#eab308",
        "Readiness": "#22c55e",
    };

    const entries = Object.entries(scores).filter(([, v]) => v !== undefined);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="backdrop-blur-xl rounded-2xl p-3 sm:p-5 border"
            style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.03), rgba(59,130,246,0.02))",
                borderColor: "rgba(255,255,255,0.06)",
            }}
        >
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-semibold text-white/60 uppercase tracking-[0.12em]">Candidate Benchmark</h3>
            </div>
            <div className="space-y-2.5">
                {entries.map(([key, value], i) => (
                    <MiniProgressBar
                        key={key}
                        label={key}
                        value={value}
                        color={benchmarkColors[key] || "#8b5cf6"}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────
export default function ResultsDisplay({ result, onReset, targetRole, targetCompany }: ResultsDisplayProps) {
    const isMobile = useIsMobile()
    const s = {
        overallScore: result.overallScore ?? result.score ?? 0,
        skillsScore: result.skillsScore ?? 0,
        strongSkills: result.strongSkills ?? [],
        missingSkills: result.missingSkills ?? [],
        criticalMissingSkills: result.criticalMissingSkills ?? [],
        skillsRecruiterVerdict: result.skillsRecruiterVerdict || "",
        projects: result.projects ?? [],
        experiences: result.experiences ?? [],
        atsScore: result.atsScore ?? 0,
        matchedKeywords: result.matchedKeywords ?? [],
        missingKeywords: result.missingKeywords ?? [],
        criticalMissingKeywords: result.criticalMissingKeywords ?? [],
        expectedATSImprovement: result.expectedATSImprovement || "",
        companyReadinessScore: result.companyReadinessScore ?? 0,
        companyReadinessAreas: result.companyReadinessAreas ?? [],
        companyReadinessStrengths: result.companyReadinessStrengths ?? [],
        companyReadinessWeaknesses: result.companyReadinessWeaknesses ?? [],
        companyReadinessMissingSkills: result.companyReadinessMissingSkills ?? [],
        interviewProbability: result.interviewProbability || "",
        companyReadinessVerdict: result.companyReadinessVerdict || "",
    };

    // Derive more metrics
    const avgProjectScore = s.projects.length > 0
        ? Math.round(s.projects.reduce((a, p) => a + (p.projectScore || 0), 0) / s.projects.length)
        : 0;
    const avgExperienceScore = s.experiences.length > 0
        ? Math.round(s.experiences.reduce((a, e) => a + (e.experienceScore || 0), 0) / s.experiences.length)
        : 0;
    const analysisConfidence = Math.round(
        (s.strongSkills.length + s.matchedKeywords.length > 0 ? 85 : 60) +
        (s.projects.length >= 2 ? 5 : 0) +
        (s.experiences.length >= 2 ? 5 : 0) +
        (s.companyReadinessAreas.length > 0 ? 5 : 0)
    );
    const totalSkillsEvaluated = s.strongSkills.length + s.missingSkills.length + s.criticalMissingSkills.length;

    // Determine candidate tier
    const getTier = (score: number) => {
        if (score >= 85) return { label: "FAANG Ready", icon: Award, color: "#22c55e" };
        if (score >= 70) return { label: "Strong Contender", icon: Medal, color: "#3b82f6" };
        if (score >= 55) return { label: "Emerging Talent", icon: Star, color: "#eab308" };
        if (score >= 40) return { label: "Developing", icon: TrendingUp, color: "#f97316" };
        return { label: "Needs Focus", icon: Flag, color: "#ef4444" };
    };
    const tier = getTier(s.overallScore);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 },
        },
    };

    return (
        <motion.div className="flex flex-col items-center justify-center min-h-screen w-full space-y-4 sm:space-y-5 px-4 sm:px-0 pb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* ===== HERO SECTION: OVERALL SCORE + TARGET ROLE + TIER + ACTIONS ===== */}
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-2xl border p-4 sm:p-5"
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

                <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                    {/* Big score ring */}
                    <div className="shrink-0">
                        <AnimatedRadialProgress
                            score={s.overallScore}
                            size={isMobile ? 80 : 96}
                            stroke={isMobile ? 7 : 8}
                            gradientId="heroGradient"
                            gradientColors={["#8b5cf6", "#6366f1", "#3b82f6"]}
                            glowColor="rgba(139, 92, 246, 0.35)"
                        />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        {/* Target Role Badge */}
                        {(targetRole || result.targetRole) && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-[0.12em] mb-2"
                                style={{
                                    background: "rgba(99,102,241,0.15)",
                                    color: "#818cf8",
                                    border: "1px solid rgba(99,102,241,0.25)",
                                }}
                            >
                                <Briefcase className="w-3 h-3" />
                                {targetRole || result.targetRole}
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-[0.15em] mb-2"
                            style={{
                                background: `${tier.color}15`,
                                color: tier.color,
                                borderColor: `${tier.color}25`,
                                border: `1px solid ${tier.color}25`,
                            }}
                        >
                            <tier.icon className="w-3 h-3" />
                            {tier.label}
                        </motion.div>

                        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-1 uppercase">
                            Resume Intelligence
                            <span className="block text-xs sm:text-sm font-medium text-white/40 mt-0.5">
                                {s.overallScore >= 80 ? "Exceptional candidate profile" :
                                    s.overallScore >= 60 ? "Strong foundation detected" :
                                        s.overallScore >= 40 ? "Opportunities for improvement" :
                                            "Significant work required"}
                            </span>
                        </h1>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3">
                            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/40 font-medium uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                <span>{s.strongSkills.length} strong skills</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium uppercase tracking-wider">
                                <BarChart3 className="w-3 h-3 text-blue-400" />
                                <span>{s.projects.length} projects</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <div className="flex items-center gap-1.5 text-xs text-white/40 font-medium uppercase tracking-wider">
                                <Briefcase className="w-3 h-3 text-cyan-400" />
                                <span>{s.experiences.length} experiences</span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onReset}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all shadow-lg hover:shadow-xl"
                            style={{
                                background: "#ffffff",
                                color: "#0f172a",
                            }}
                        >
                            <ArrowRight className="w-4 h-4" />
                            Analyse Another Resume
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* ===== SCORE METRICS GRID ===== */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <MetricCard
                    icon={Target}
                    title="Skills"
                    value={`${s.skillsScore}%`}
                    subtitle="Score"
                    color="#8b5cf6"
                    delay={0.1}
                    trend={s.skillsScore >= 60 ? "up" : s.skillsScore >= 40 ? "neutral" : "down"}
                />
                <MetricCard
                    icon={Briefcase}
                    title="Projects"
                    value={s.projects.length > 0 ? `${avgProjectScore}%` : "—"}
                    subtitle={s.projects.length > 0 ? `Avg of ${s.projects.length}` : "No data"}
                    color="#3b82f6"
                    delay={0.2}
                    trend={avgProjectScore >= 60 ? "up" : avgProjectScore >= 40 ? "neutral" : "down"}
                />
                <MetricCard
                    icon={UserCheck}
                    title="Experience"
                    value={s.experiences.length > 0 ? `${avgExperienceScore}%` : "—"}
                    subtitle={s.experiences.length > 0 ? `Avg of ${s.experiences.length}` : "No data"}
                    color="#06b6d4"
                    delay={0.3}
                    trend={avgExperienceScore >= 60 ? "up" : avgExperienceScore >= 40 ? "neutral" : "down"}
                />
                <MetricCard
                    icon={Search}
                    title="ATS Match"
                    value={`${s.atsScore}%`}
                    subtitle="Score"
                    color="#eab308"
                    delay={0.4}
                    trend={s.atsScore >= 60 ? "up" : s.atsScore >= 40 ? "neutral" : "down"}
                />
            </div>

            {/* ===== COMPANY READINESS — Hero Section ===== */}
            <Section title="Company Readiness" icon={Building2} color="#3b82f6" delay={0.3}>
                {/* Target badges row */}
                {(targetCompany || targetRole || result.targetRole) && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-wrap items-center gap-2 mb-5"
                    >
                        {targetCompany && (
                            <div
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-[0.12em]"
                                style={{
                                    background: "rgba(59,130,246,0.15)",
                                    color: "#60a5fa",
                                    border: "1px solid rgba(59,130,246,0.25)",
                                }}
                            >
                                <Building2 className="w-2.5 h-2.5" />
                                {targetCompany}
                            </div>
                        )}
                        {(targetRole || result.targetRole) && (
                            <div
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-[0.12em]"
                                style={{
                                    background: "rgba(99,102,241,0.15)",
                                    color: "#818cf8",
                                    border: "1px solid rgba(99,102,241,0.25)",
                                }}
                            >
                                <Briefcase className="w-2.5 h-2.5" />
                                {targetRole || result.targetRole}
                            </div>
                        )}
                    </motion.div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
                    {/* Left: Score + Key Metrics */}
                    <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-5 p-3 sm:p-4 rounded-xl"
                            style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)" }}>
                            <AnimatedRadialProgress
                                score={s.companyReadinessScore}
                                size={isMobile ? 56 : 72}
                                stroke={isMobile ? 6 : 7}
                                gradientId="readinessGradient"
                                gradientColors={["#3b82f6", "#6366f1", "#8b5cf6"]}
                                glowColor="rgba(59,130,246,0.3)"
                            />
                            <div>
                                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-0.5">
                                    Readiness Score
                                </p>
                                <p className="text-xs sm:text-sm font-semibold text-white">
                                    {s.companyReadinessScore >= 80 ? "Highly Prepared" :
                                        s.companyReadinessScore >= 60 ? "Moderately Prepared" :
                                            s.companyReadinessScore >= 40 ? "Partially Prepared" :
                                                "Needs Preparation"}
                                </p>
                                {s.interviewProbability && (
                                    <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md text-xs font-medium"
                                        style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}>
                                        <Zap className="w-2.5 h-2.5" />
                                        {s.interviewProbability}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Area Breakdown */}
                        {s.companyReadinessAreas.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Area Breakdown</p>
                                {s.companyReadinessAreas.slice(0, 6).map((area, i) => (
                                    <MiniProgressBar
                                        key={i}
                                        label={area.area}
                                        value={area.score}
                                        color={area.score >= 70 ? "#22c55e" : area.score >= 45 ? "#eab308" : "#ef4444"}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Strengths, Weaknesses, Missing */}
                    <div className="lg:col-span-3 space-y-2 sm:space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            {/* Strengths */}
                            <div className="p-2.5 sm:p-3 rounded-xl border"
                                style={{
                                    background: "rgba(34,197,94,0.04)",
                                    borderColor: "rgba(34,197,94,0.12)",
                                }}>
                                <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Strengths
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {s.companyReadinessStrengths.length > 0 ? (
                                        s.companyReadinessStrengths.map((str, i) => (
                                            <SkillBadge key={i} variant="strong">{str}</SkillBadge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-white/30 italic">None identified</span>
                                    )}
                                </div>
                            </div>

                            {/* Weaknesses */}
                            <div className="p-3 rounded-xl border"
                                style={{
                                    background: "rgba(239,68,68,0.04)",
                                    borderColor: "rgba(239,68,68,0.12)",
                                }}>
                                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Weaknesses
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {s.companyReadinessWeaknesses.length > 0 ? (
                                        s.companyReadinessWeaknesses.map((w, i) => (
                                            <SkillBadge key={i} variant="critical">{w}</SkillBadge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-white/30 italic">None identified</span>
                                    )}
                                </div>
                            </div>

                            {/* Missing Skills */}
                            <div className="p-3 rounded-xl border"
                                style={{
                                    background: "rgba(234,179,8,0.04)",
                                    borderColor: "rgba(234,179,8,0.12)",
                                }}>
                                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Missing
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {s.companyReadinessMissingSkills.length > 0 ? (
                                        s.companyReadinessMissingSkills.map((ms, i) => (
                                            <SkillBadge key={i} variant="missing">{ms}</SkillBadge>
                                        ))
                                    ) : (
                                        <span className="text-xs text-white/30 italic">None identified</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Verdict */}
                        <RecruiterVerdict
                            text={s.companyReadinessVerdict || "Comprehensive readiness assessment provided based on target role analysis."}
                            color="#3b82f6"
                        />
                    </div>
                </div>
            </Section>

            {/* ===== SKILLS ANALYSIS ===== */}
            <Section title="Skills Analysis" icon={Target} color="#8b5cf6" delay={0.4}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
                    {/* Score + Counts */}
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl"
                            style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}>
                            <AnimatedRadialProgress
                                score={s.skillsScore}
                                size={isMobile ? 48 : 60}
                                stroke={isMobile ? 5 : 6}
                                gradientId="skillsGradient"
                                gradientColors={["#8b5cf6", "#a78bfa", "#c4b5fd"]}
                                glowColor="rgba(139,92,246,0.25)"
                            />
                            <div className="grid grid-cols-3 gap-1 sm:gap-3 flex-1 text-center">
                                <div>
                                    <p className="text-sm font-bold text-green-400">{s.strongSkills.length}</p>
                                    <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Strong</p>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-yellow-400">{s.missingSkills.length}</p>
                                    <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Missing</p>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-red-400">{s.criticalMissingSkills.length}</p>
                                    <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Critical</p>
                                </div>
                            </div>
                        </div>

                        <RecruiterVerdict text={s.skillsRecruiterVerdict} color="#8b5cf6" variant="compact" />
                    </div>

                    {/* Skill Tags */}
                    <div className="lg:col-span-2 space-y-3">
                        {s.strongSkills.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Strong Skills ({s.strongSkills.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {s.strongSkills.map((sk, i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.4 + i * 0.03 }}
                                        >
                                            <SkillBadge variant="strong">{sk}</SkillBadge>
                                        </motion.span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {s.missingSkills.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Missing Skills ({s.missingSkills.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {s.missingSkills.map((sk, i) => (
                                        <SkillBadge key={i} variant="missing">{sk}</SkillBadge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {s.criticalMissingSkills.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    Critical Missing ({s.criticalMissingSkills.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {s.criticalMissingSkills.map((sk, i) => (
                                        <SkillBadge key={i} variant="critical">{sk}</SkillBadge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Section>

            {/* ===== PROJECT ANALYSIS ===== */}
            {s.projects.length > 0 && (
                <Section title="Project Analysis" icon={Briefcase} color="#3b82f6" delay={0.5}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {s.projects.map((proj, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                className="relative group/project rounded-xl p-3 sm:p-4 border transition-all duration-300"
                                style={{
                                    background: "linear-gradient(135deg, rgba(59,130,246,0.04), rgba(139,92,246,0.02))",
                                    borderColor: "rgba(255,255,255,0.06)",
                                }}
                            >
                                {/* Hover glow */}
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover/project:opacity-100 blur-xl transition-all duration-500"
                                    style={{ background: "radial-gradient(ellipse at top, rgba(59,130,246,0.06), transparent)" }} />

                                <div className="relative">
                                    <div className="flex items-start justify-between mb-2 gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs sm:text-sm font-semibold text-white truncate uppercase tracking-tight">
                                                {proj.projectName}
                                            </h4>
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {(proj.technologies || []).slice(0, 3).map((t, i) => (
                                                    <span key={i}
                                                        className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider"
                                                        style={{
                                                            background: "rgba(139,92,246,0.1)",
                                                            color: "#a78bfa",
                                                            border: "1px solid rgba(139,92,246,0.2)",
                                                        }}
                                                    >
                                                        {t}
                                                    </span>
                                                ))}
                                                {(proj.technologies || []).length > 3 && (
                                                    <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-medium text-white/30"
                                                        style={{ background: "rgba(255,255,255,0.04)" }}
                                                    >
                                                        +{proj.technologies.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <AnimatedRadialProgress
                                            score={proj.projectScore || 0}
                                            size={42}
                                            stroke={4.5}
                                            gradientId={`projGradient${idx}`}
                                            gradientColors={["#8b5cf6", "#6366f1", "#3b82f6"]}
                                            glowColor="rgba(139,92,246,0.2)"
                                            showGlow={false}
                                        />
                                    </div>

                                    {/* Dimension progress bars */}
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-1 mb-2">
                                        {[
                                            { label: "Tech", value: proj.technicalDepth || 0, color: "#8b5cf6" },
                                            { label: "Industry", value: proj.industryRelevance || 0, color: "#3b82f6" },
                                            { label: "Scale", value: proj.scalability || 0, color: "#06b6d4" },
                                            { label: "Innovate", value: proj.innovation || 0, color: "#f97316" },
                                            { label: "Resume", value: proj.resumeValue || 0, color: "#22c55e" },
                                        ].map((dim, di) => (
                                            <div key={di} className="text-center">
                                                <MiniProgressBar
                                                    value={dim.value}
                                                    color={dim.color}
                                                    height={3}
                                                    showValue={false}
                                                />
                                                <p className="text-[8px] sm:text-[10px] font-medium text-white/30 mt-0.5 uppercase tracking-wider">{dim.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Strength/Improvement */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t"
                                        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                                        {proj.strength && (
                                            <p className="text-xs text-green-400/70 leading-tight">
                                                <span className="font-bold text-green-400 mr-0.5">✓</span> {proj.strength}
                                            </p>
                                        )}
                                        {proj.improvement && (
                                            <p className="text-xs text-red-400/70 leading-tight">
                                                <span className="font-bold text-red-400 mr-0.5">!</span> {proj.improvement}
                                            </p>
                                        )}
                                    </div>

                                    {/* Recruiter Verdict */}
                                    {proj.recruiterVerdict && (
                                        <div className="mt-2 pt-2 border-t"
                                            style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                                            <RecruiterVerdict text={proj.recruiterVerdict} color="#8b5cf6" variant="compact" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ===== EXPERIENCE ANALYSIS ===== */}
            {s.experiences.length > 0 && (
                <Section title="Experience Analysis" icon={UserCheck} color="#06b6d4" delay={0.6}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {s.experiences.map((exp, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 + idx * 0.1 }}
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                className="relative group/exp rounded-xl p-3 sm:p-4 border transition-all duration-300"
                                style={{
                                    background: "linear-gradient(135deg, rgba(6,182,212,0.04), rgba(59,130,246,0.02))",
                                    borderColor: "rgba(255,255,255,0.06)",
                                }}
                            >
                                <div className="absolute inset-0 rounded-xl opacity-0 group-hover/exp:opacity-100 blur-xl transition-all duration-500"
                                    style={{ background: "radial-gradient(ellipse at top, rgba(6,182,212,0.06), transparent)" }} />

                                <div className="relative">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-white truncate uppercase tracking-tight">
                                                {exp.role}
                                            </h4>
                                            <p className="text-xs font-medium text-white/40 truncate">
                                                {exp.company}{exp.duration ? ` • ${exp.duration}` : ""}
                                            </p>
                                        </div>
                                        <AnimatedRadialProgress
                                            score={exp.experienceScore || 0}
                                            size={42}
                                            stroke={4.5}
                                            gradientId={`expGradient${idx}`}
                                            gradientColors={["#06b6d4", "#0891b2", "#0e7490"]}
                                            glowColor="rgba(6,182,212,0.2)"
                                            showGlow={false}
                                        />
                                    </div>

                                    {/* Dimension bars */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-1.5 mb-2">
                                        {[
                                            { label: "Depth 40%", value: exp.technicalDepth || 0, color: "#06b6d4" },
                                            { label: "Relevance 25%", value: exp.roleRelevance || 0, color: "#22c55e" },
                                            { label: "Impact 20%", value: exp.businessImpact || 0, color: "#3b82f6" },
                                            { label: "Exposure 15%", value: exp.industryExposure || 0, color: "#8b5cf6" },
                                        ].map((dim, di) => (
                                            <div key={di} className="text-center">
                                                <MiniProgressBar
                                                    value={dim.value}
                                                    color={dim.color}
                                                    height={3}
                                                    showValue={false}
                                                />
                                                <p className="text-[8px] sm:text-[10px] font-medium text-white/30 mt-0.5 uppercase tracking-wider">
                                                    {dim.label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Strength/Improvement */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t"
                                        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                                        {exp.strength && (
                                            <p className="text-xs text-green-400/70 leading-tight">
                                                <span className="font-bold text-green-400 mr-0.5">✓</span> {exp.strength}
                                            </p>
                                        )}
                                        {exp.improvement && (
                                            <p className="text-xs text-red-400/70 leading-tight">
                                                <span className="font-bold text-red-400 mr-0.5">!</span> {exp.improvement}
                                            </p>
                                        )}
                                    </div>

                                    {/* Recruiter Verdict */}
                                    {exp.recruiterVerdict && (
                                        <div className="mt-2 pt-2 border-t"
                                            style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                                            <RecruiterVerdict text={exp.recruiterVerdict} color="#06b6d4" variant="compact" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Section>
            )}

            {/* ===== ATS SCORE + BENCHMARK + CONFIDENCE ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ATS Score */}
                <div className="lg:col-span-2">
                    <Section title="ATS Compatibility" icon={Search} color="#eab308" delay={0.7}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {/* Score + Counts */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl"
                                    style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.12)" }}>
                                    <AnimatedRadialProgress
                                        score={s.atsScore}
                                        size={isMobile ? 44 : 54}
                                        stroke={isMobile ? 4.5 : 5.5}
                                        gradientId="atsGradient"
                                        gradientColors={["#eab308", "#f59e0b", "#d97706"]}
                                        glowColor="rgba(234,179,8,0.25)"
                                    />
                                    <div className="grid grid-cols-3 gap-1 sm:gap-2 flex-1 text-center">
                                        <div>
                                            <p className="text-sm font-bold text-green-400">{s.matchedKeywords.length}</p>
                                            <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Matched</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-red-400">{s.missingKeywords.length}</p>
                                            <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Missing</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-orange-400">{s.criticalMissingKeywords.length}</p>
                                            <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Critical</p>
                                        </div>
                                    </div>
                                </div>

                                {s.expectedATSImprovement && (
                                    <div className="p-3 rounded-xl text-xs text-yellow-400/80 font-medium leading-relaxed"
                                        style={{
                                            background: "rgba(234,179,8,0.06)",
                                            border: "1px solid rgba(234,179,8,0.12)",
                                        }}>
                                        <Zap className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                                        {s.expectedATSImprovement}
                                    </div>
                                )}
                            </div>

                            {/* Keywords */}
                            <div className="space-y-2.5">
                                {s.matchedKeywords.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1">
                                            Matched ({s.matchedKeywords.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {s.matchedKeywords.slice(0, 12).map((kw, i) => (
                                                <SkillBadge key={i} variant="strong">{kw}</SkillBadge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {s.missingKeywords.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">
                                            Missing ({s.missingKeywords.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {s.missingKeywords.slice(0, 12).map((kw, i) => (
                                                <SkillBadge key={i} variant="critical">{kw}</SkillBadge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {s.criticalMissingKeywords.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
                                            Critical ({s.criticalMissingKeywords.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {s.criticalMissingKeywords.map((kw, i) => (
                                                <SkillBadge key={i} variant="missing">{kw}</SkillBadge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Right column: Benchmark + Confidence */}
                <div className="space-y-4">
                    <CandidateBenchmark
                        scores={{
                            "Skills": s.skillsScore,
                            "Projects": avgProjectScore,
                            "Experience": avgExperienceScore,
                            "ATS": s.atsScore,
                            "Readiness": s.companyReadinessScore,
                        }}
                    />
                    <ConfidenceMeter score={analysisConfidence} />
                </div>
            </div>

            {/* ===== FOOTER ===== */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="text-center pt-2"
            >
                <p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.2em]">
                    Powered by Mentorix AI · Career Intelligence Suite
                </p>
            </motion.div>

        </motion.div>
    );
}
