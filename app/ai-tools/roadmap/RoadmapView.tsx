"use client"

import { PremiumRoadmap, PremiumMilestone, Checkpoint, FinalSummary, RoadmapResult, Milestone } from "@/types"
import { useState } from "react"
import {
    Clock, Lightbulb, CheckCircle2, Target, BookOpen, BarChart, Calendar,
    ChevronRight, Award, Zap, Sparkles, Building2,
    FileText, Rocket, BrainCircuit, ArrowLeft, Square, CheckSquare
} from "lucide-react"

/** Defensively coerce a value to an array — handles strings, arrays, null/undefined */
function toArray(val: unknown): unknown[] {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return [val];
    return [];
}

/** Safely join array items with a separator — handles when AI returns a string instead of array */
function safeJoin(val: unknown, sep = " "): string {
    if (Array.isArray(val)) return val.join(sep);
    if (typeof val === "string") return val;
    return "";
}

interface RoadmapViewProps {
    roadmap: PremiumRoadmap | RoadmapResult | any;
    onReset: () => void;
    onSelectMilestone: (milestone: PremiumMilestone | any) => void;
    view: "generator" | "history";
    isPremium: boolean;
}

export default function RoadmapView({
    roadmap,
    onReset,
    onSelectMilestone,
    view,
    isPremium
}: RoadmapViewProps) {
    // If it's a legacy roadmap, render the old view
    if (!isPremium) {
        return renderLegacyView(roadmap, onReset, onSelectMilestone, view);
    }

    const prem = roadmap as PremiumRoadmap;
    const h = prem.header;
    const checkpoints = prem.checkpoints || [];
    const totalWeeks = prem.milestones.length;
    const [checkedWeeks, setCheckedWeeks] = useState<Set<number>>(new Set());
    const completedCount = checkedWeeks.size;
    const progressPct = totalWeeks > 0 ? Math.round((completedCount / totalWeeks) * 100) : 0;

    const toggleWeek = (weekNumber: number) => {
        setCheckedWeeks(prev => {
            const next = new Set(prev);
            if (next.has(weekNumber)) {
                next.delete(weekNumber);
            } else {
                next.add(weekNumber);
            }
            return next;
        });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
            {/* ===== HEADER CARD ===== */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-white/10 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] -mr-48 -mt-48 rounded-full" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/5 blur-[100px] -ml-36 -mb-36 rounded-full" />
                <div className="relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                        <Sparkles className="w-3 h-3" />
                        AI-Powered Career Growth Roadmap
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight leading-tight">
                        {h.roadmapTitle}
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed mb-8 font-medium max-w-3xl">
                        {h.professionalOverview}
                    </p>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { icon: Target, label: "Target Role", value: h.targetRole, color: "text-blue-400" },
                            { icon: Building2, label: "Company", value: h.targetCompany || "Open", color: "text-purple-400" },
                            { icon: BarChart, label: "Level", value: h.currentLevel, color: "text-orange-400" },
                            { icon: Clock, label: "Commitment", value: h.weeklyCommitment, color: "text-emerald-400" },
                            { icon: Calendar, label: "Start", value: h.startDate, color: "text-cyan-400" },
                            { icon: Calendar, label: "Completion", value: h.expectedCompletionDate, color: "text-rose-400" },
                            { icon: Zap, label: "Duration", value: h.totalDuration, color: "text-amber-400" },
                            { icon: Award, label: "Outcome", value: h.estimatedOutcome.substring(0, 30) + "...", color: "text-green-400" },
                        ].map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className={`w-3 h-3 ${item.color}`} />
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                                    </div>
                                    <p className="text-sm font-bold text-white">{item.value}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={onReset}
                            className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black hover:bg-slate-200 transition-all uppercase tracking-widest shadow-xl flex items-center gap-2"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            {view === "history" ? "Back to History" : "Build Another Roadmap"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== PROGRESS BAR ===== */}
            <div className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Your Progress</h3>
                    </div>
                    <span className="text-sm font-bold text-white">
                        {completedCount} / {totalWeeks} weeks
                        <span className="text-emerald-400 ml-2">({progressPct}%)</span>
                    </span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPct}%` }}
                    >
                        {/* Gradient fill that changes color as progress increases */}
                        <div className={`h-full rounded-full transition-all duration-500 ${
                            progressPct === 100
                                ? "bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                : progressPct > 50
                                ? "bg-gradient-to-r from-blue-500 to-emerald-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                : "bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                        }`} />
                    </div>
                </div>
                {/* Animated micro-badges */}
                <div className="flex items-center gap-4 mt-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        {progressPct === 0
                            ? "Start checking off weeks as you complete them"
                            : progressPct === 100
                            ? "🎉 All weeks completed!"
                            : `${totalWeeks - completedCount} weeks remaining`}
                    </span>
                </div>
            </div>

            {/* ===== WEEKLY TIMELINE ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Rocket className="w-4 h-4 text-blue-400" />
                        </div>
                        <h2 className="text-lg font-black text-white uppercase tracking-tight">Weekly Breakdown</h2>
                    </div>

                    {prem.milestones.map((milestone, idx) => {
                        const isLast = idx === prem.milestones.length - 1;
                        const isCheckpoint = checkpoints.some(cp => cp.weekNumber === milestone.weekNumber);
                        const isV2 = !!(milestone.theme || milestone.projectToBuild);

                        const isChecked = checkedWeeks.has(milestone.weekNumber);

                        return (
                            <div key={milestone.weekNumber} className="relative pl-16">
                                {/* Timeline line */}
                                <div className={`absolute left-6 top-0 w-px ${isLast ? "h-8" : "h-full"} bg-gradient-to-b from-blue-500/30 to-purple-500/30`} />

                                {/* Timeline dot */}
                                <div className={`absolute left-3 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-black transition-all duration-300 ${isChecked
                                    ? "bg-emerald-500/30 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    : isCheckpoint
                                    ? "bg-amber-500/20 border-amber-500 text-amber-400"
                                    : "bg-slate-900 border-blue-500/50 text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                                }`}>
                                    {isChecked ? <CheckCircle2 className="w-3 h-3" /> : milestone.weekNumber}
                                </div>

                                {/* Card */}
                                <div
                                    onClick={() => onSelectMilestone(milestone)}
                                    className={`cursor-pointer bg-white/5 border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl group ${
                                        isChecked
                                            ? "border-emerald-500/30 bg-emerald-500/5"
                                            : isCheckpoint
                                            ? "border-amber-500/20 hover:border-white/20"
                                            : "border-white/5 hover:border-white/20"
                                    }`}
                                >
                                    {/* Header row */}
                                    <div className="flex items-center justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWeek(milestone.weekNumber);
                                                }}
                                                className={`shrink-0 transition-all duration-200 ${
                                                    isChecked
                                                        ? "text-emerald-400 hover:text-emerald-300"
                                                        : "text-slate-600 hover:text-white"
                                                }`}
                                                title={isChecked ? "Mark as incomplete" : "Mark as complete"}
                                            >
                                                {isChecked ? (
                                                    <CheckSquare className="w-5 h-5" />
                                                ) : (
                                                    <Square className="w-5 h-5" />
                                                )}
                                            </button>
                                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                                                Week {milestone.weekNumber}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                {milestone.dateRange}
                                            </span>
                                            {isCheckpoint && (
                                                <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1">
                                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                                    Checkpoint
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider ${
                                                milestone.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400" :
                                                milestone.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400" :
                                                "bg-red-500/10 text-red-400"
                                            }`}>
                                                {milestone.difficulty}
                                            </span>
                                            <div className="flex items-center gap-1 text-slate-500">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-[9px] font-bold">{milestone.estimatedHours}h</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title — V2 uses theme, V1 uses milestoneTitle */}
                                    <h3 className="text-lg font-black text-white mb-2 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                        {isV2 ? milestone.theme : milestone.milestoneTitle}
                                    </h3>

                                    {/* Learning Goals (V2) or Objective (V1) */}
                                    {isV2 ? (
                                        milestone.learningGoals && (
                                            <p className="text-sm text-slate-400 font-medium mb-4">{safeJoin(milestone.learningGoals, " • ")}</p>
                                        )
                                    ) : (
                                        <p className="text-sm text-slate-400 font-medium mb-4">{milestone.objective}</p>
                                    )}

                                    {/* Project highlight — V2 uses projectToBuild object, V1 uses buildThisWeek string */}
                                    {isV2 && milestone.projectToBuild ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-4">
                                            <Rocket className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                                                Build: {milestone.projectToBuild.name}
                                            </span>
                                        </div>
                                    ) : milestone.buildThisWeek ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg mb-4">
                                            <Rocket className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                                                Build: {milestone.buildThisWeek}
                                            </span>
                                        </div>
                                    ) : null}

                                    {/* Preview chips — V2 uses skillsCovered, V1 uses learningFocus */}
                                    <div className="flex flex-wrap gap-2">
                                        {toArray(isV2 ? milestone.skillsCovered : milestone.learningFocus).slice(0, 4).map((topic, i) => (
                                            <span key={i} className="px-2 py-1 bg-white/5 rounded-md text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                                {String(topic)}
                                            </span>
                                        ))}
                                        {toArray(isV2 ? milestone.skillsCovered : milestone.learningFocus).length > 4 && (
                                            <span className="px-2 py-1 bg-white/5 rounded-md text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                                +{toArray(isV2 ? milestone.skillsCovered : milestone.learningFocus).length - 4}
                                            </span>
                                        )}
                                    </div>

                                    {/* Resume & Interview Impact */}
                                    {(milestone.resumeImpact || ((isV2 ? milestone.interviewTopics : milestone.interviewTopicsCovered)?.length || 0) > 0) && (
                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
                                            {milestone.resumeImpact && (
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="w-3 h-3 text-slate-500" />
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                                        Resume: <span className={`${
                                                            milestone.resumeImpact === "High" ? "text-emerald-400" :
                                                            milestone.resumeImpact === "Medium" ? "text-amber-400" : "text-slate-400"
                                                        }`}>{milestone.resumeImpact}</span>
                                                    </span>
                                                </div>
                                            )}
                                            {toArray(isV2 ? milestone.interviewTopics : milestone.interviewTopicsCovered).length > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <BrainCircuit className="w-3 h-3 text-slate-500" />
                                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                                        Interview: {toArray(isV2 ? milestone.interviewTopics : milestone.interviewTopicsCovered).slice(0, 2).join(", ")}
                                                        {toArray(isV2 ? milestone.interviewTopics : milestone.interviewTopicsCovered).length > 2 && " + more"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ===== RIGHT SIDEBAR ===== */}
                <div className="space-y-8">
                    {/* Checkpoints */}
                    {checkpoints.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                                </div>
                                <h3 className="text-base font-black text-white uppercase tracking-tight">Checkpoints</h3>
                            </div>
                            <div className="space-y-4">
                                {checkpoints.map((cp) => {
                                    const cpIsV2 = !!(cp.assessment || cp.skillReview);
                                    return (
                                        <div key={cp.weekNumber} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl hover:bg-amber-500/10 transition-all">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                                                    <span className="text-[8px] font-black text-amber-400">W{cp.weekNumber}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-amber-300 uppercase tracking-wider">{cpIsV2 ? "Skills Checkpoint" : cp.title}</span>
                                            </div>
                                            {cpIsV2 ? (
                                                <div className="space-y-2">
                                                    {cp.assessment && <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{cp.assessment}</p>}
                                                    {toArray(cp.skillReview).length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {toArray(cp.skillReview).map((skill, i) => (
                                                                <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[7px] font-bold text-slate-500 uppercase tracking-wider">{String(skill)}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {cp.portfolioReview && <p className="text-[9px] text-amber-300/70 font-medium mt-1">Portfolio: {cp.portfolioReview}</p>}
                                                    {cp.resumeReview && <p className="text-[9px] text-blue-300/70 font-medium">Resume: {cp.resumeReview}</p>}
                                                    {cp.mockInterview && <p className="text-[9px] text-purple-300/70 font-medium">Mock: {cp.mockInterview}</p>}
                                                    {toArray(cp.gapAnalysis).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {toArray(cp.gapAnalysis).map((gap, i) => (
                                                                <span key={i} className="px-1 py-0.5 bg-red-500/10 text-red-300 rounded text-[6px] font-bold uppercase tracking-wider">{String(gap)}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {cp.roadmapAdjustment && <p className="text-[9px] text-emerald-300/70 font-medium mt-1">Adjustment: {cp.roadmapAdjustment}</p>}
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{cp.progressReview}</p>
                                                    {toArray(cp.skillValidation).length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {toArray(cp.skillValidation).map((skill, i) => (
                                                                <span key={i} className="px-1.5 py-0.5 bg-white/5 rounded text-[7px] font-bold text-slate-500 uppercase tracking-wider">{String(skill)}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Tips */}
                    {prem.tips?.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                                </div>
                                <h3 className="text-base font-black text-white uppercase tracking-tight">Pro Strategies</h3>
                            </div>
                            <div className="space-y-3">
                                {prem.tips.map((tip, idx) => (
                                    <div key={idx} className="flex gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all group">
                                        <div className="shrink-0 w-5 h-5 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center shadow-lg border border-yellow-500/20 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                                            <CheckCircle2 className="w-3 h-3" />
                                        </div>
                                        <p className="text-xs text-slate-300 font-medium leading-relaxed">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Final Summary — V1 (legacy) and V2 (company readiness) */}
                    {prem.finalSummary && (
                        <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 rounded-[2rem] p-6 backdrop-blur-xl border border-emerald-500/10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <Award className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h3 className="text-base font-black text-white uppercase tracking-tight">{prem.finalSummary.companyReadinessScore !== undefined ? "Company Readiness" : "Expected Outcomes"}</h3>
                            </div>

                            <div className="space-y-5">
                                {/* V2 Company Readiness Scores */}
                                {prem.finalSummary.companyReadinessScore !== undefined && (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="text-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                                <div className="text-2xl font-black text-emerald-400">{prem.finalSummary.companyReadinessScore}%</div>
                                                <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-wider mt-1">Company Readiness</div>
                                            </div>
                                            <div className="text-center p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                                <div className="text-2xl font-black text-blue-400">{prem.finalSummary.roleReadinessScore}%</div>
                                                <div className="text-[8px] font-bold text-blue-600 uppercase tracking-wider mt-1">Role Readiness</div>
                                            </div>
                                            <div className="text-center p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                                <div className="text-2xl font-black text-purple-400">{prem.finalSummary.interviewReadinessScore}%</div>
                                                <div className="text-[8px] font-bold text-purple-600 uppercase tracking-wider mt-1">Interview Readiness</div>
                                            </div>
                                            <div className="text-center p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                                <div className="text-2xl font-black text-amber-400">{prem.finalSummary.atsReadiness}%</div>
                                                <div className="text-[8px] font-bold text-amber-600 uppercase tracking-wider mt-1">ATS Readiness</div>
                                            </div>
                                        </div>
                                        {/* Portfolio Strength */}
                                        {prem.finalSummary.portfolioStrength && (
                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Portfolio Strength</span>
                                                <span className={`text-sm font-bold ${
                                                    prem.finalSummary.portfolioStrength === "Exceptional" ? "text-emerald-400" :
                                                    prem.finalSummary.portfolioStrength === "Strong" ? "text-blue-400" :
                                                    prem.finalSummary.portfolioStrength === "Moderate" ? "text-amber-400" : "text-red-400"
                                                }`}>{prem.finalSummary.portfolioStrength}</span>
                                            </div>
                                        )}
                                        {/* Strengths & Weaknesses */}
                                        {toArray(prem.finalSummary.topStrengths).length > 0 && (
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Top Strengths</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {toArray(prem.finalSummary.topStrengths).map((s, i) => (
                                                        <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-300 rounded-md text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                                            {String(s)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {toArray(prem.finalSummary.topWeaknesses).length > 0 && (
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Top Weaknesses</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {toArray(prem.finalSummary.topWeaknesses).map((w, i) => (
                                                        <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-300 rounded-md text-[8px] font-bold uppercase tracking-wider border border-amber-500/20">
                                                            {String(w)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {toArray(prem.finalSummary.criticalMissingSkills).length > 0 && (
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Critical Missing Skills</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {toArray(prem.finalSummary.criticalMissingSkills).map((s, i) => (
                                                        <span key={i} className="px-2 py-1 bg-red-500/10 text-red-300 rounded-md text-[8px] font-bold uppercase tracking-wider border border-red-500/20">
                                                            {String(s)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {prem.finalSummary.estimatedHiringProbability && (
                                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estimated Hiring Probability</span>
                                                <span className={`text-sm font-bold ${
                                                    prem.finalSummary.estimatedHiringProbability === "Very High" ? "text-emerald-400" :
                                                    prem.finalSummary.estimatedHiringProbability === "High" ? "text-blue-400" :
                                                    prem.finalSummary.estimatedHiringProbability === "Medium" ? "text-amber-400" : "text-red-400"
                                                }`}>{prem.finalSummary.estimatedHiringProbability}</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* V1 Legacy Readiness Score (fallback) */}
                                {prem.finalSummary.companyReadinessScore === undefined && prem.finalSummary.expectedReadinessScore && (
                                    <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                        <div className="text-3xl font-black text-emerald-400">{prem.finalSummary.expectedReadinessScore}%</div>
                                        <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-1">
                                            Readiness for {prem.finalSummary.readinessTarget}
                                        </div>
                                    </div>
                                )}

                                {/* V1 Legacy sections */}
                                {prem.finalSummary.companyReadinessScore === undefined && (
                                    <>
                                        {toArray(prem.finalSummary.skillsGained).length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-3 h-3 text-emerald-400" />
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Skills Gained</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {toArray(prem.finalSummary.skillsGained).map((s, i) => (
                                                        <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-300 rounded-md text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                                            {String(s)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {toArray(prem.finalSummary.projectsBuilt).length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Rocket className="w-3 h-3 text-blue-400" />
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Projects Built</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {toArray(prem.finalSummary.projectsBuilt).map((p, i) => (
                                                        <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-300 rounded-md text-[8px] font-bold uppercase tracking-wider border border-blue-500/20">
                                                            {String(p)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {toArray(prem.finalSummary.interviewAreasCovered).length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <BrainCircuit className="w-3 h-3 text-purple-400" />
                                                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Interview Prep</span>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {toArray(prem.finalSummary.interviewAreasCovered).map((i, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-purple-500/10 text-purple-300 rounded-md text-[8px] font-bold uppercase tracking-wider border border-purple-500/20">
                                                            {String(i)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {toArray(prem.finalSummary.resumeImprovements).length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-3 h-3 text-amber-400" />
                                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Resume Impact</span>
                                                </div>
                                                <ul className="space-y-1.5">
                                                    {toArray(prem.finalSummary.resumeImprovements).map((r, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-[10px] text-slate-300 font-medium">
                                                            <ChevronRight className="w-2.5 h-2.5 text-amber-400 mt-0.5 shrink-0" />
                                                            {String(r)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ===== LEGACY VIEW for backward compatibility =====
function renderLegacyView(
    roadmap: RoadmapResult,
    onReset: () => void,
    onSelectMilestone: (milestone: Milestone) => void,
    view: "generator" | "history"
) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-5xl p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] -mr-48 -mt-48 rounded-full" />
                <div className="relative z-10 max-w-4xl">
                    <h2 className="text-4xl font-black mb-4 uppercase tracking-tight">{roadmap.title}</h2>
                    <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">{roadmap.description}</p>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={onReset}
                            className="px-6 py-3 bg-white text-black rounded-xl text-xs font-black hover:bg-slate-200 transition-all uppercase tracking-widest shadow-xl"
                        >
                            {view === "history" ? "Back to History" : "Build Another Path"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-6">
                    {roadmap.milestones?.map((milestone, idx) => (
                        <button
                            key={idx}
                            onClick={() => onSelectMilestone(milestone)}
                            className="w-full text-left group relative pl-12 pb-12 last:pb-0 block"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10 group-last:bg-transparent">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white/10 group-hover:border-blue-500 group-hover:bg-blue-600 transition-all duration-500 flex items-center justify-center text-[10px] font-black group-hover:text-white">
                                    {idx + 1}
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/5 group-hover:border-white/20 rounded-3xl p-8 transition-all duration-500 group-hover:-translate-y-1 group-hover:bg-white/8 shadow-sm group-hover:shadow-2xl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                        {milestone.week}
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{milestone.goal}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {milestone.topics.slice(0, 3).map((topic, i) => (
                                        <span key={i} className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                            {topic}
                                        </span>
                                    ))}
                                    {milestone.topics.length > 3 && (
                                        <span className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                            +{milestone.topics.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="space-y-8">
                    <div className="bg-white/5 border border-white/10 rounded-4xl p-8 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Pro Strategies</h3>
                        </div>
                        <div className="space-y-4">
                            {roadmap.tips?.map((tip, idx) => (
                                <div key={idx} className="flex gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all group">
                                    <div className="shrink-0 w-6 h-6 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center text-[10px] shadow-lg border border-yellow-500/20 group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                                        <CheckCircle2 className="w-3 h-3" />
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
