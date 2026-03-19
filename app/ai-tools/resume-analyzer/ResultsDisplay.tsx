"use client"

import { Download, Sparkles, Rocket, Code2, TrendingUp, Lightbulb, Search, PlusCircle, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { AnalysisResult } from "@/types"

interface ResultsDisplayProps {
    result: AnalysisResult;
    onReset: () => void;
    onDownload: () => void;
}

export default function ResultsDisplay({ result, onReset, onDownload }: ResultsDisplayProps) {
    return (
        <div className="animate-in fade-in zoom-in-95 duration-700">
            {/* Results View */}
            <div className="flex flex-col gap-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Analysis Results</h2>
                {/* Top Section: Score Card */}
                <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden border border-white/10 flex flex-col gap-8 w-full">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -mr-32 -mt-32 rounded-full" />

                    <div className="flex flex-col md:flex-row items-center gap-8 w-full z-10 relative">
                        <div className="text-center shrink-0">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-8">
                                <Sparkles className="w-3 h-3" />
                                Job Ready
                            </div>

                            <div className="flex items-center justify-center">
                                <div className="relative">
                                    <svg className="w-40 h-40 md:w-48 md:h-48 transform -rotate-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                        <circle
                                            cx="50%"
                                            cy="50%"
                                            r="42%"
                                            stroke="currentColor"
                                            strokeWidth="12"
                                            fill="transparent"
                                            className="text-white/5"
                                        />
                                        <circle
                                            cx="50%"
                                            cy="50%"
                                            r="42%"
                                            stroke="currentColor"
                                            strokeWidth="12"
                                            fill="transparent"
                                            strokeDasharray={264}
                                            strokeDashoffset={264 * (1 - result.score / 100)}
                                            className={`${result.score > 70 ? 'text-green-400' : result.score > 40 ? 'text-yellow-400' : 'text-red-400'} transition-all duration-1000 ease-out`}
                                            strokeLinecap="round"
                                            pathLength="100"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl md:text-6xl font-black">{result.score}</span>
                                        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">% Match</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Executive Summary */}
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-inner flex-1 w-full text-left relative z-10 self-stretch flex items-center">
                            <p className="text-sm leading-relaxed text-slate-300 font-medium">
                                {result.summary}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full relative z-10">
                        <button
                            onClick={onDownload}
                            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-[10px] uppercase tracking-widest font-black"
                        >
                            <Download className="w-4 h-4" />
                            Download Detailed PDF Report
                        </button>
                        <button
                            onClick={onReset}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold transition-all text-white text-[10px] uppercase tracking-widest font-black"
                        >
                            Analyze Another Resume
                        </button>
                    </div>
                </div>

                {/* Main Details Section */}
                <div className="space-y-6 w-full text-left">
                    {/* Breakdown */}
                    <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 backdrop-blur-xl shadow-2xl">
                        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Score Breakdown</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {Object.entries(result.scoreBreakdown).map(([key, val]) => (
                                <div key={key} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{key}</p>
                                    <p className="text-2xl font-black text-white">{val}%</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Gaps and Strengths */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-red-500/5 rounded-[2.5rem] p-8 border border-red-500/10 backdrop-blur-xl">
                            <h3 className="text-lg font-black text-red-400 mb-6 uppercase tracking-tight flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                Critical Gaps
                            </h3>
                            <ul className="space-y-3">
                                {result.criticalGaps.map((gap, i) => (
                                    <li key={i} className="text-sm text-slate-300 font-medium flex items-start gap-3">
                                        <span className="text-red-500 mt-1">•</span>
                                        {gap}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-green-500/5 rounded-[2.5rem] p-8 border border-green-500/10 backdrop-blur-xl">
                            <h3 className="text-lg font-black text-green-400 mb-6 uppercase tracking-tight flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                Key Strengths
                            </h3>
                            <ul className="space-y-3">
                                {result.strengths.map((str, i) => (
                                    <li key={i} className="text-sm text-slate-300 font-medium flex items-start gap-3">
                                        <span className="text-green-500 mt-1">•</span>
                                        {str}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Detailed Section Analysis */}
                    {result.sectionwiseAnalysis && (
                        <div className="bg-white/5 rounded-[2.5rem] p-8 md:p-10 border border-white/10 backdrop-blur-3xl shadow-2xl space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">Section-by-Section Review</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">In-depth feedback for each resume category</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.entries(result.sectionwiseAnalysis).map(([key, content], i) => {
                                    const meta: Record<string, { icon: any, color: string }> = {
                                        experience: { icon: Rocket, color: "text-blue-400" },
                                        projects: { icon: Code2, color: "text-purple-400" },
                                        skills: { icon: TrendingUp, color: "text-green-400" },
                                        education: { icon: Lightbulb, color: "text-yellow-400" }
                                    };
                                    const itemMeta = meta[key] || { icon: Search, color: "text-blue-400" };
                                    return (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`p-2 bg-white/5 rounded-xl ${itemMeta.color}`}>
                                                    <itemMeta.icon className="w-4 h-4" />
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
                    )}

                    {/* Improvement Blueprint */}
                    {result.improvementPlan && (
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[100px] -ml-32 -mb-32" />

                            <div className="relative z-10 space-y-12">
                                <div className="text-center max-w-2xl mx-auto">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                                        <Sparkles className="w-3 h-3 text-blue-400" />
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Growth Roadmap</span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Career Improvement <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-400">Blueprint</span></h2>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Specific actions to accelerate your profile strength</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Skills to Learn */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <PlusCircle className="w-5 h-5 text-green-400" />
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Target Skills</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {result.improvementPlan.additionalSkills.map((skill, i) => (
                                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3 group hover:border-green-500/30 transition-colors">
                                                    <div className="w-1 h-1 bg-green-400 rounded-full" />
                                                    <p className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors">{skill}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Project Ideas */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Rocket className="w-5 h-5 text-purple-400" />
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Build Next</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {result.improvementPlan.newProjectIdeas.map((idea, i) => (
                                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3 group hover:border-purple-500/30 transition-colors">
                                                    <div className="w-1 h-1 bg-purple-400 rounded-full mt-1.5" />
                                                    <p className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors leading-relaxed">{idea}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Project Enhancements */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Enhance Current</h4>
                                        </div>
                                        <div className="space-y-3">
                                            {result.improvementPlan.projectEnhancements.map((enh, i) => (
                                                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-start gap-3 group hover:border-blue-500/30 transition-colors">
                                                    <div className="w-1 h-1 bg-blue-400 rounded-full mt-1.5" />
                                                    <p className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors leading-relaxed">{enh}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Keywords Section (Existing) */}
                    {result.missingKeywords.length > 0 && (
                        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 backdrop-blur-xl">
                            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                                <Search className="w-5 h-5 text-blue-400" />
                                Missing Keywords
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {result.missingKeywords.map((kw, i) => (
                                    <span key={i} className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
