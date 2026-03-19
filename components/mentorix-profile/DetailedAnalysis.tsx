"use client"

import { motion } from "framer-motion"
import { TrendingUp, Sparkles, Search, Lightbulb, Code2, PlusCircle, Rocket, ShieldCheck } from "lucide-react"

interface DetailedAnalysisProps {
    insights: {
        sectionAnalysis?: string // JSON string
        improvementPlan?: string // JSON string
    } | null
}

export default function DetailedAnalysis({ insights }: DetailedAnalysisProps) {
    if (!insights) return null;

    const sections = typeof insights.sectionAnalysis === 'string'
        ? JSON.parse(insights.sectionAnalysis || '{}')
        : (insights.sectionAnalysis || {});

    const plan = typeof insights.improvementPlan === 'string'
        ? JSON.parse(insights.improvementPlan || '{}')
        : (insights.improvementPlan || {});

    if (Object.keys(sections).length === 0 && Object.keys(plan).length === 0) return null;

    const analysisMeta: Record<string, { icon: any, color: string }> = {
        experience: { icon: Rocket, color: "text-blue-400" },
        projects: { icon: Code2, color: "text-purple-400" },
        skills: { icon: TrendingUp, color: "text-green-400" },
        education: { icon: Lightbulb, color: "text-yellow-400" }
    };

    return (
        <div className="space-y-8">
            {/* Section Analysis */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                <div className="relative z-10 space-y-8">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Detailed Section Analysis</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">A deep dive into your profile structure</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(sections).map(([key, content]: [string, any], i) => {
                            const meta = (analysisMeta as any)[key] || { icon: Search, color: "text-blue-400" };
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors group"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2 bg-white/5 rounded-xl ${meta.color}`}>
                                            <meta.icon className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-wider">{key}</h3>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                        {content}
                                    </p>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Improvement Plan */}
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] -ml-32 -mb-32" />

                <div className="relative z-10 space-y-12">
                    <div className="text-center max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                            <Sparkles className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Growth Strategy</span>
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Improvement <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-400">Blueprint</span></h2>
                        <p className="text-sm text-slate-500 font-medium">Data-backed recommendations to escalate your engineering career trajectory.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Additional Skills */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <PlusCircle className="w-5 h-5 text-green-400" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Skills to Learn</h3>
                            </div>
                            <div className="space-y-3">
                                {Array.isArray(plan.additionalSkills) && plan.additionalSkills.map((skill: string, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-green-500/30 transition-colors flex items-center gap-3 group"
                                    >
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                                        <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{skill}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* New Project Ideas */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Rocket className="w-5 h-5 text-purple-400" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Build Next</h3>
                            </div>
                            <div className="space-y-3">
                                {Array.isArray(plan.newProjectIdeas) && plan.newProjectIdeas.map((idea: string, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors flex items-start gap-3 group"
                                    >
                                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5 shrink-0" />
                                        <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors leading-relaxed">{idea}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Project Enhancements */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Enhance Current</h3>
                            </div>
                            <div className="space-y-3">
                                {Array.isArray(plan.projectEnhancements) && plan.projectEnhancements.map((enh: string, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors flex items-start gap-3 group"
                                    >
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                                        <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors leading-relaxed">{enh}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
