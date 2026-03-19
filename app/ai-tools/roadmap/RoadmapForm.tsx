"use client"

import { Target, Clock, BarChart, Calendar, Send, CheckCircle2, BookOpen, Lightbulb } from "lucide-react"

interface RoadmapFormProps {
    targetField: string;
    setTargetField: (val: string) => void;
    timeline: string;
    setTimeline: (val: string) => void;
    currentLevel: string;
    setCurrentLevel: (val: string) => void;
    weeklyCommitment: string;
    setWeeklyCommitment: (val: string) => void;
    onGenerate: () => void;
}

export default function RoadmapForm({
    targetField,
    setTargetField,
    timeline,
    setTimeline,
    currentLevel,
    setCurrentLevel,
    weeklyCommitment,
    setWeeklyCommitment,
    onGenerate
}: RoadmapFormProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left Side: Form */}
            <div className="bg-white/5 rounded-[2.5rem] p-10 shadow-2xl border border-white/10 backdrop-blur-3xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10 space-y-6">
                    {/* Field */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Target className="w-3 h-3" /> What do you want to learn?
                        </label>
                        <input
                            type="text"
                            value={targetField}
                            onChange={(e) => setTargetField(e.target.value)}
                            placeholder="e.g. FullBase Development with Next.js"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder:text-white/20 shadow-inner"
                        />
                    </div>

                    {/* Timeline & Commitment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Timeline
                            </label>
                            <input
                                type="text"
                                value={timeline}
                                onChange={(e) => setTimeline(e.target.value)}
                                placeholder="e.g. 3 Months"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder:text-white/20 shadow-inner"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Weekly Commitment
                            </label>
                            <input
                                type="text"
                                value={weeklyCommitment}
                                onChange={(e) => setWeeklyCommitment(e.target.value)}
                                placeholder="e.g. 15 Hours"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder:text-white/20 shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Level */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <BarChart className="w-3 h-3" /> Current Skill Level
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {["Beginner", "Intermediate", "Advanced"].map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setCurrentLevel(level)}
                                    className={`py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${currentLevel === level
                                        ? "bg-white text-black border-white shadow-lg shadow-white/10"
                                        : "bg-white/5 text-slate-500 border-white/10 hover:border-white/20 hover:text-white"
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onGenerate}
                    className="relative z-10 w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-2xl group"
                >
                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span>Generate Roadmap</span>
                </button>
            </div>

            {/* Right Side: Visual decoration / Info */}
            <div className="hidden lg:flex flex-col justify-center space-y-8 p-12 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 blur-[120px] -mr-32 -mt-32 rounded-full" />
                <div className="relative z-10 space-y-4">
                    <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tight">
                        Master any skill with <br /> <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500 italic">Precision Execution.</span>
                    </h3>
                    <p className="text-slate-400 leading-relaxed font-medium">
                        Our AI analyzes the required concepts and dependencies to build a path that maximizes your learning efficiency.
                    </p>
                </div>

                <div className="relative z-10 space-y-4 pt-8">
                    {[
                        { icon: CheckCircle2, text: "Curated learning resources", color: "text-green-400" },
                        { icon: BookOpen, text: "Sequential topic mastering", color: "text-blue-400" },
                        { icon: Lightbulb, text: "Expert study tips included", color: "text-yellow-400" }
                    ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div key={idx} className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-xl transition-all hover:bg-white/10">
                                <Icon className={`w-5 h-5 ${item.color}`} />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.text}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
