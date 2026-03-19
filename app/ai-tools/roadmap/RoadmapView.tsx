"use client"

import { RoadmapResult, Milestone } from "@/types"
import { Loader2, BookOpen, Clock, Lightbulb, CheckCircle2 } from "lucide-react"

interface RoadmapViewProps {
    roadmap: RoadmapResult;
    onReset: () => void;
    onSelectMilestone: (milestone: Milestone) => void;
    onBuildCourse: (topic: string) => void;
    generatingCourse: boolean;
    view: "generator" | "history";
}

export default function RoadmapView({
    roadmap,
    onReset,
    onSelectMilestone,
    onBuildCourse,
    generatingCourse,
    view
}: RoadmapViewProps) {
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
                        <button
                            onClick={() => onBuildCourse(roadmap.title)}
                            disabled={generatingCourse}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-all uppercase tracking-widest shadow-xl flex items-center gap-2"
                        >
                            {generatingCourse ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                            Generate Full Course
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
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <Clock className="w-3 h-3" />
                                        Interactive Lesson Available
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

                    <div className="bg-blue-600 rounded-4xl p-10 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-3xl -mr-24 -mt-24 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                        <h4 className="text-2xl font-black mb-4 uppercase tracking-tighter">Ready to Start?</h4>
                        <p className="text-blue-100 text-sm mb-8 font-medium leading-relaxed">
                            Convert this roadmap into a full interactive course with AI-generated lessons and quizzes.
                        </p>
                        <button
                            onClick={() => onBuildCourse(roadmap.title)}
                            disabled={generatingCourse}
                            className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                            {generatingCourse ? <Loader2 className="w-4 animate-spin" /> : "Kickoff Roadmap"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
