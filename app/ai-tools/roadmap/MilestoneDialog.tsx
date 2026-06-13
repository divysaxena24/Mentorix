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
    Clock, BookOpen, Rocket, Target, BrainCircuit, FileText,
    Lightbulb, CheckCircle2, ExternalLink, Youtube, ChevronRight,
    Sparkles
} from "lucide-react"

interface MilestoneDialogProps {
    milestone: PremiumMilestone | Milestone | null;
    onClose: () => void;
    isPremium?: boolean;
}

export default function MilestoneDialog({ milestone, onClose, isPremium }: MilestoneDialogProps) {
    if (!milestone) return null;

    // Premium milestone
    if (isPremium && "weekNumber" in milestone) {
        const pm = milestone as PremiumMilestone;
        const hasResources = pm.resources && (
            pm.resources.courses?.length > 0 ||
            pm.resources.docs?.length > 0 ||
            pm.resources.videos?.length > 0 ||
            pm.resources.articles?.length > 0
        );

        return (
            <Dialog open={!!milestone} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-slate-900/95 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -mr-32 -mt-32 rounded-full" />

                    <div className="relative z-10 space-y-8">
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
                            </div>
                            <DialogTitle className="text-3xl font-black text-white leading-tight uppercase tracking-tight">
                                {pm.milestoneTitle}
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium text-base mt-2">
                                {pm.objective}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Build This Week - Highlight */}
                        <div className="p-5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-2xl border border-emerald-500/20">
                            <div className="flex items-center gap-3 mb-2">
                                <Rocket className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Build This Week</span>
                            </div>
                            <p className="text-lg font-bold text-white">{pm.buildThisWeek}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Learning Focus */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <BookOpen className="w-4 h-4 text-blue-400" />
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Learning Focus</h5>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {pm.learningFocus.map((topic, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actionable Tasks */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actionable Tasks</h5>
                                </div>
                                <div className="space-y-2.5">
                                    {pm.actionableTasks.map((task, idx) => (
                                        <div key={idx} className="flex gap-3 items-start">
                                            <div className="shrink-0 w-5 h-5 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                <span className="text-[8px] font-black text-emerald-400">{idx + 1}</span>
                                            </div>
                                            <p className="text-sm text-slate-300 font-medium leading-relaxed">{task}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Resources */}
                        {hasResources && (
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                <div className="flex items-center gap-2 mb-5">
                                    <ExternalLink className="w-4 h-4 text-purple-400" />
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Resources</h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pm.resources.courses?.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Courses</span>
                                            <ul className="space-y-1.5">
                                                {pm.resources.courses.map((r, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {pm.resources.docs?.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Documentation</span>
                                            <ul className="space-y-1.5">
                                                {pm.resources.docs.map((r, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {pm.resources.videos?.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-red-400 uppercase tracking-widest">
                                                <Youtube className="w-3 h-3" /> Videos
                                            </span>
                                            <ul className="space-y-1.5">
                                                {pm.resources.videos.map((r, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400 font-medium">
                                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 shrink-0" />
                                                        {r}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {pm.resources.articles?.length > 0 && (
                                        <div className="space-y-2">
                                            <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Articles</span>
                                            <ul className="space-y-1.5">
                                                {pm.resources.articles.map((r, i) => (
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

                        {/* Expected Outcomes */}
                        {pm.expectedOutcome?.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-yellow-400" />
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Expected Outcomes</h5>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {pm.expectedOutcome.map((outcome, idx) => (
                                        <span key={idx} className="px-3 py-1.5 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 rounded-lg text-[9px] font-bold">
                                            {outcome}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Impact Footer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            {pm.resumeImpact && (
                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Resume Impact</span>
                                        <p className={`text-sm font-bold ${
                                            pm.resumeImpact === "High" ? "text-emerald-400" :
                                            pm.resumeImpact === "Medium" ? "text-amber-400" : "text-slate-400"
                                        }`}>{pm.resumeImpact}</p>
                                    </div>
                                </div>
                            )}
                            {pm.interviewTopicsCovered?.length > 0 && (
                                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                    <BrainCircuit className="w-4 h-4 text-slate-400" />
                                    <div>
                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Interview Topics</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {pm.interviewTopicsCovered.map((t, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[7px] font-bold uppercase tracking-wider">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
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
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Learning Topics</h5>
                                <div className="flex flex-wrap gap-2">
                                    {legacy.topics.map((topic, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>

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
