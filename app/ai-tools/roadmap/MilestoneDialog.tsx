"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PremiumMilestone, Milestone } from "@/types"
import {
    Clock, Rocket, BrainCircuit, FileText,
    CheckCircle2, ExternalLink, Youtube,
    Sparkles, GraduationCap, ListChecks, BarChart3, Timer, Code2
} from "lucide-react"

interface MilestoneDialogProps {
    milestone: PremiumMilestone | Milestone | null;
    onClose: () => void;
    isPremium?: boolean;
}

/** Defensively coerce to array — handles when AI returns a string */
function toArray(val: unknown): unknown[] {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return [val];
    return [];
}

export default function MilestoneDialog({ milestone, onClose, isPremium }: MilestoneDialogProps) {
    if (!milestone) return null;

    // Premium milestone
    if (isPremium && "weekNumber" in milestone) {
        const pm = milestone as PremiumMilestone;
        const isV2 = !!(pm.theme || pm.projectToBuild);
        const hasResources = !!(pm.resources && (
            (pm.resources.courses?.length || 0) > 0 ||
            (pm.resources.docs?.length || 0) > 0 ||
            (pm.resources.videos?.length || 0) > 0 ||
            (pm.resources.articles?.length || 0) > 0
        ));

        // Gather all topics into a unified list for the primary section
        const allTopics = [
            ...toArray(isV2 ? pm.learningGoals : pm.learningFocus),
            ...toArray(isV2 ? pm.skillsCovered : []),
        ]
        // Deduplicate
        const uniqueTopics = Array.from(new Set(allTopics.map(t => String(t))));

        // Actionable tasks (V1) or interview topics as secondary items
        const tasks = isV2 ? [] : (pm.actionableTasks || []);

        return (
            <Dialog open={!!milestone} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -mr-32 -mt-32 rounded-full" />

                    <div className="relative z-10 space-y-8">
                        {/* ===== HEADER ===== */}
                        <DialogHeader>
                            <div className="flex items-center gap-3 flex-wrap mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <Clock className="w-3 h-3" />
                                    Week {pm.weekNumber}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500">{pm.dateRange}</span>
                                <span className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider ${
                                    pm.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400" :
                                    pm.difficulty === "Intermediate" ? "bg-amber-500/10 text-amber-400" :
                                    "bg-red-500/10 text-red-400"
                                }`}>
                                    {pm.difficulty}
                                </span>
                                <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    {pm.estimatedHours}h
                                </span>
                                {pm.estimatedStudyTime && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                                        <Timer className="w-2.5 h-2.5" />
                                        {pm.estimatedStudyTime}
                                    </span>
                                )}
                            </div>
                            <DialogTitle className="text-3xl font-black text-white leading-tight uppercase tracking-tight">
                                {isV2 ? pm.theme : pm.milestoneTitle}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium text-base mt-2">
                                {isV2 ? "Master the key topics and build your weekly project." : (pm.objective || "")}
                            </DialogDescription>
                        </DialogHeader>

                        {/* ===== ===== ===== ===== ===== ===== ===== ===== ===== */}
                        {/* 📚 TOPICS TO COVER — Primary Section */}
                        {/* ===== ===== ===== ===== ===== ===== ===== ===== ===== */}
                        {uniqueTopics.length > 0 && (
                            <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl border border-blue-500/15 p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-blue-500/15 rounded-xl border border-blue-500/20">
                                        <GraduationCap className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Topics to Cover</h4>
                                        <p className="text-[9px] text-slate-500 font-medium mt-0.5">{uniqueTopics.length} key topics for Week {pm.weekNumber}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {uniqueTopics.map((topic, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-blue-500/20 transition-all group"
                                        >
                                            <div className="shrink-0 w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                                <span className="text-[8px] font-black text-blue-400">{String(idx + 1).padStart(2, "0")}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                                                {String(topic)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Skills covered count badge */}
                                {isV2 && toArray(pm.skillsCovered).length > 0 && (
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-blue-500/10">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                                            {toArray(pm.skillsCovered).length} skills covered this week
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===== ===== ===== ===== ===== ===== ===== ===== ===== */}
                        {/* 🚀 PROJECT — Secondary Section */}
                        {/* ===== ===== ===== ===== ===== ===== ===== ===== ===== */}
                        {(isV2 && pm.projectToBuild) ? (
                            <div className="bg-gradient-to-r from-emerald-600/15 to-teal-600/15 rounded-2xl border border-emerald-500/15 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-emerald-500/15 rounded-xl border border-emerald-500/20">
                                        <Rocket className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Weekly Project</h4>
                                        <p className="text-[9px] text-slate-500 font-medium mt-0.5">Build to add to your portfolio</p>
                                    </div>
                                </div>

                                <p className="text-lg font-bold text-white mb-1">{pm.projectToBuild.name}</p>
                                <p className="text-sm text-slate-300 font-medium mb-4">{pm.projectToBuild.objective}</p>

                                {pm.projectToBuild.techStack?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {pm.projectToBuild.techStack.map((tech, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Resume value & outcome for project */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-emerald-500/10">
                                    {pm.projectToBuild.resumeValue && (
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-3 h-3 text-slate-500" />
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                <span className="text-slate-500 uppercase tracking-wider">Resume:</span>{' '}
                                                {pm.projectToBuild.resumeValue}
                                            </span>
                                        </div>
                                    )}
                                    {pm.projectToBuild.expectedOutcome && (
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-yellow-500" />
                                            <span className="text-[9px] text-slate-400 font-medium">
                                                <span className="text-slate-500 uppercase tracking-wider">Outcome:</span>{' '}
                                                {pm.projectToBuild.expectedOutcome}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : pm.buildThisWeek ? (
                            <div className="bg-gradient-to-r from-emerald-600/15 to-teal-600/15 rounded-2xl border border-emerald-500/15 p-6">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-emerald-500/15 rounded-xl border border-emerald-500/20">
                                        <Rocket className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Build This Week</h4>
                                </div>
                                <p className="text-lg font-bold text-white">{pm.buildThisWeek}</p>
                            </div>
                        ) : null}

                        {/* ===== ===== ===== ===== ===== ===== ===== ===== ===== */}
                        {/* DETAILS GRID — Deliverable, Tasks, Study Time, Hands-On */}
                        {/* ===== ===== ===== ===== ===== ===== ===== ===== ===== */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Expected Deliverable (V2) */}
                            {isV2 && pm.expectedDeliverable && (
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-yellow-400" />
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Expected Deliverable</h5>
                                    </div>
                                    <p className="text-sm text-slate-300 font-medium leading-relaxed">{pm.expectedDeliverable}</p>
                                </div>
                            )}

                            {/* Hands-On Tasks (V2) */}
                            {isV2 && pm.handsOnTasks && pm.handsOnTasks.length > 0 && (
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Code2 className="w-4 h-4 text-emerald-400" />
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Hands-On Tasks</h5>
                                    </div>
                                    <div className="space-y-2.5">
                                        {pm.handsOnTasks.map((task, idx) => (
                                            <div key={idx} className="flex gap-3 items-start">
                                                <div className="shrink-0 w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                    <span className="text-[8px] font-black text-emerald-400">{idx + 1}</span>
                                                </div>
                                                <p className="text-sm text-slate-300 font-medium leading-relaxed">{task}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Interview Focus (V2) */}
                            {isV2 && pm.interviewFocus && pm.interviewFocus.length > 0 && (
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <BrainCircuit className="w-4 h-4 text-purple-400" />
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Interview Focus</h5>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {pm.interviewFocus.map((focus, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                                                {focus}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actionable Tasks (V1) */}
                            {!isV2 && tasks.length > 0 && (
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ListChecks className="w-4 h-4 text-emerald-400" />
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actionable Tasks</h5>
                                    </div>
                                    <div className="space-y-2.5">
                                        {tasks.map((task, idx) => (
                                            <div key={idx} className="flex gap-3 items-start">
                                                <div className="shrink-0 w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                    <span className="text-[8px] font-black text-emerald-400">{idx + 1}</span>
                                                </div>
                                                <p className="text-sm text-slate-300 font-medium leading-relaxed">{task}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Expected Outcomes (V1) */}
                            {!isV2 && (pm.expectedOutcome?.length || 0) > 0 && (
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <BarChart3 className="w-4 h-4 text-amber-400" />
                                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Expected Outcomes</h5>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {pm.expectedOutcome?.map((outcome, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 rounded-lg text-[9px] font-bold">
                                                {outcome}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ===== ===== ===== ===== ===== ===== ===== ===== ===== */}
                        {/* FOOTER — Resume Impact + Interview Topics + Resources */}
                        {/* ===== ===== ===== ===== ===== ===== ===== ===== ===== */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            {/* Resume Impact */}
                            {pm.resumeImpact && (
                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Resume Impact</span>
                                        <p className={`text-sm font-bold ${
                                            pm.resumeImpact === "Very High" ? "text-purple-400" :
                                            pm.resumeImpact === "High" ? "text-emerald-400" :
                                            pm.resumeImpact === "Medium" ? "text-amber-400" : "text-slate-400"
                                        }`}>{pm.resumeImpact}</p>
                                    </div>
                                </div>
                            )}

                            {/* Interview Topics */}
                            {toArray(isV2 ? pm.interviewTopics : pm.interviewTopicsCovered).length > 0 && (
                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                    <BrainCircuit className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Interview Topics</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {toArray(isV2 ? pm.interviewTopics : pm.interviewTopicsCovered).map((t, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[7px] font-bold uppercase tracking-wider">
                                                    {String(t)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resources (V1 only) */}
                        {!isV2 && hasResources && (
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                <div className="flex items-center gap-2 mb-5">
                                    <ExternalLink className="w-4 h-4 text-purple-400" />
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Resources</h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pm.resources!.courses?.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Courses</span>
                                            <ul className="space-y-1.5">
                                                {pm.resources!.courses!.map((r, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {pm.resources!.docs?.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Documentation</span>
                                            <ul className="space-y-1.5">
                                                {pm.resources!.docs!.map((r, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {pm.resources!.videos?.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-red-400 uppercase tracking-widest">
                                                <Youtube className="w-3 h-3" /> Videos
                                            </span>
                                            <ul className="space-y-1.5">
                                                {pm.resources!.videos!.map((r, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {pm.resources!.articles?.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Articles</span>
                                            <ul className="space-y-1.5">
                                                {pm.resources!.articles!.map((r, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Legacy milestone
    const legacy = milestone as Milestone;
    return (
        <Dialog open={!!milestone} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -mr-32 -mt-32 rounded-full" />

                <div className="relative z-10 space-y-10">
                    <DialogHeader>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 w-fit">
                            {legacy.week}
                        </div>
                        <DialogTitle className="text-3xl font-black text-white leading-tight uppercase tracking-tight">
                            {legacy.goal}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Deep dive and actionable steps for this milestone.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Topics to Cover — PRIMARY section for legacy too */}
                    {legacy.topics?.length > 0 && (
                        <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl border border-blue-500/15 p-6">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-blue-500/15 rounded-xl border border-blue-500/20">
                                    <GraduationCap className="w-4 h-4 text-blue-400" />
                                </div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">Topics to Cover</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {legacy.topics.map((topic, idx) => (
                                    <div key={idx} className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 hover:border-blue-500/20 transition-all group">
                                        <div className="shrink-0 w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                            <span className="text-[8px] font-black text-blue-400">{String(idx + 1).padStart(2, "0")}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{topic}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actionable Steps</h5>
                            <div className="space-y-4">
                                {legacy.detailedSteps.map((step, idx) => (
                                    <div key={idx} className="flex gap-4 group">
                                        <div className="shrink-0 w-6 h-6 rounded-lg bg-white text-black flex items-center justify-center text-[10px] font-black shadow-lg group-hover:scale-110 transition-transform">
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm text-slate-300 font-semibold leading-relaxed">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Study Resources</h5>
                                <ul className="space-y-3">
                                    {legacy.resources.map((resource, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-xs text-slate-400 font-bold">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                            {resource}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
