"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Milestone } from "@/types"
import { Loader2, Sparkles } from "lucide-react"

interface MilestoneDialogProps {
    milestone: Milestone | null;
    onClose: () => void;
    onBuildCourse: (topic: string, milestone?: Milestone) => void;
    generatingCourse: boolean;
}

export default function MilestoneDialog({ milestone, onClose, onBuildCourse, generatingCourse }: MilestoneDialogProps) {
    if (!milestone) return null;

    return (
        <Dialog open={!!milestone} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-10 border border-white/10 shadow-2xl overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -mr-32 -mt-32 rounded-full" />

                <div className="relative z-10 space-y-10">
                    <DialogHeader>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 w-fit">
                            {milestone.week}
                        </div>
                        <DialogTitle className="text-3xl font-black text-white leading-tight uppercase tracking-tight">
                            {milestone.goal}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Deep dive and actionable steps for this milestone.
                        </DialogDescription>
                        <button
                            onClick={() => onBuildCourse(milestone.goal, milestone)}
                            disabled={generatingCourse}
                            className="mt-4 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                        >
                            {generatingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Build Detailed Course
                        </button>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Actionable Steps</h5>
                            <div className="space-y-4">
                                {milestone.detailedSteps.map((step, idx) => (
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
                                    {milestone.topics.map((topic, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Study Resources</h5>
                                <ul className="space-y-3">
                                    {milestone.resources.map((resource, idx) => (
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
