"use client"

import {
    Download, Sparkles, Target, Briefcase, Search,
    CheckCircle2, XCircle, AlertTriangle, ArrowUpRight,
    Award, TrendingUp, Star, Medal, Flag,
    Building2, Code2, Brain, Layers, BookOpen
} from "lucide-react"
import { motion } from "framer-motion"
import { AnalysisResult } from "@/types"

interface ResultsDisplayProps {
    result: AnalysisResult;
    onReset: () => void;
    onDownload: () => void;
}

function ScoreRing({ score, size = 48, strokeWidth = 6, color: colorProp }: { score: number; size?: number; strokeWidth?: number; color?: string }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const autoColor = score > 70 ? "#22c55e" : score > 40 ? "#eab308" : "#ef4444";
    const color = colorProp || autoColor;
    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-white/10" />
                <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent"
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    className="transition-all duration-1000 ease-out" />
            </svg>
            <span className="absolute text-xs font-black" style={{ color }}>{score}%</span>
        </div>
    );
}

function SectionCard({ title, icon: Icon, iconColor, children, id }: {
    title: string; icon: any; iconColor: string; children: React.ReactNode; id?: string;
}) {
    return (
        <motion.div id={id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 opacity-20 blur-3xl -mr-24 -mt-24 rounded-full" style={{ background: iconColor }} />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 rounded-xl" style={{ background: `${iconColor}15` }}>
                        <Icon className="w-4 h-4" style={{ color: iconColor }} />
                    </div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">{title}</h3>
                </div>
                {children}
            </div>
        </motion.div>
    );
}

function Tag({ children, color = "blue" }: { children: React.ReactNode; color?: string }) {
    const colors: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
        cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    };
    return (
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${colors[color] || colors.blue}`}>
            {children}
        </span>
    );
}

function StatPill({ label, value, color = "blue" }: { label: string; value: string | number; color?: string }) {
    const colors: Record<string, string> = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        green: "text-green-400 bg-green-500/10 border-green-500/20",
        red: "text-red-400 bg-red-500/10 border-red-500/20",
        yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    };
    return (
        <div className={`p-3 rounded-xl border ${colors[color] || colors.blue} text-center`}>
            <p className="text-lg font-black">{value}</p>
            <p className="text-[8px] font-bold uppercase tracking-wider opacity-80">{label}</p>
        </div>
    );
}

export default function ResultsDisplay({ result, onReset, onDownload }: ResultsDisplayProps) {
    const hasEnhanced = !!result.executiveSummary;
    const es = result.executiveSummary;

    return (
        <div className="animate-in fade-in zoom-in-95 duration-700 space-y-6 max-w-6xl mx-auto">

            {/* ===== HERO ===== */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest mb-6">
                        <Sparkles className="w-3 h-3" />
                        Resume Intelligence Report
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        <div className="text-center shrink-0">
                            <div className="relative">
                                <svg className="w-36 h-36 md:w-40 md:h-40 transform -rotate-90 drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                    <circle cx="50%" cy="50%" r="44%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                    <circle cx="50%" cy="50%" r="44%" stroke="currentColor" strokeWidth="8" fill="transparent"
                                        strokeDasharray={276} strokeDashoffset={276 * (1 - result.score / 100)}
                                        className={`${result.score > 70 ? 'text-green-400' : result.score > 40 ? 'text-yellow-400' : 'text-red-400'} transition-all duration-1000 ease-out`}
                                        strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl md:text-5xl font-black tracking-tighter">{result.score}</span>
                                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-0.5">Overall</span>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-1.5">
                                {result.score > 80 ? <Medal className="w-3.5 h-3.5 text-yellow-400" /> : result.score > 60 ? <Star className="w-3.5 h-3.5 text-blue-400" /> : <Flag className="w-3.5 h-3.5 text-red-400" />}
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                    {result.score > 80 ? "Exceptional Profile" : result.score > 60 ? "Strong Candidate" : result.score > 40 ? "Needs Improvement" : "Requires Significant Work"}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 w-full space-y-5">
                            <div className="bg-white/[0.03] p-5 md:p-6 rounded-2xl border border-white/[0.06]">
                                <p className="text-sm leading-relaxed text-slate-300 font-medium">{result.summary}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                {Object.entries(result.scoreBreakdown).map(([key, val]) => (
                                    <div key={key} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">{key}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${val > 70 ? 'bg-green-500' : val > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${val}%` }} />
                                            </div>
                                            <span className="text-[10px] font-black text-white">{val}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5">
                                <button onClick={onDownload}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                                    <Download className="w-3.5 h-3.5" />
                                    Download Premium PDF Report
                                </button>
                                <button onClick={onReset}
                                    className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all">
                                    Analyze Another Resume
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ===== 1. EXECUTIVE SUMMARY ===== */}
            {hasEnhanced && es && (
                <SectionCard title="Executive Summary" icon={Brain} iconColor="#3b82f6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="space-y-4">
                            <p className="text-sm text-slate-300 leading-relaxed">{es.professionalOverview}</p>
                            <div className="flex items-center gap-2.5 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider shrink-0">Stage:</span>
                                <span className="text-sm font-bold text-white">{es.careerStageAssessment}</span>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl border border-blue-500/10">
                                <p className="text-[8px] font-black text-purple-400 uppercase tracking-wider mb-1.5">Hiring Impression</p>
                                <p className="text-sm text-slate-300 leading-relaxed italic">&ldquo;{es.overallHiringImpression}&rdquo;</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/10">
                                <p className="text-[8px] font-black text-green-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3" /> Top Strengths
                                </p>
                                <ul className="space-y-1.5">
                                    {es.top3Strengths.map((s, i) => (
                                        <li key={i} className="text-xs text-slate-300 font-medium flex items-start gap-1.5">
                                            <span className="text-green-500 mt-0.5 shrink-0">•</span>{s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                <p className="text-[8px] font-black text-red-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3" /> Top Improvements
                                </p>
                                <ul className="space-y-1.5">
                                    {es.top3Improvements.map((s, i) => (
                                        <li key={i} className="text-xs text-slate-300 font-medium flex items-start gap-1.5">
                                            <span className="text-red-500 mt-0.5 shrink-0">•</span>{s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ===== 2. SCORE BREAKDOWN ===== */}
            {hasEnhanced && result.extendedScores && (
                <SectionCard title="Score Breakdown" icon={Target} iconColor="#8b5cf6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                            { key: "ats", label: "ATS Score" },
                            { key: "technicalStrength", label: "Technical Skills" },
                            { key: "projectQuality", label: "Projects" },
                            { key: "experience", label: "Experience" },
                            { key: "industryReadiness", label: "Industry Fit" },
                        ].map(({ key, label }) => {
                            const val = (result.extendedScores as any)[key];
                            if (val === undefined) return null;
                            return (
                                <div key={key} className="p-4 bg-white/[0.03] rounded-xl border border-white/5 text-center">
                                    <ScoreRing score={val} size={60} strokeWidth={5} />
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-2.5">{label}</p>
                                    {result.scoreExplanations?.[key] && (
                                        <p className="text-[9px] text-slate-500 mt-1.5 leading-relaxed">{result.scoreExplanations[key]}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </SectionCard>
            )}

            {/* ===== 3. SKILLS ANALYSIS ===== */}
            {hasEnhanced && result.skillsAnalysis && (
                <SectionCard title="Skills Analysis" icon={Code2} iconColor="#22c55e">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/10">
                            <p className="text-[8px] font-black text-green-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Strong Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {result.skillsAnalysis.strongAreas.slice(0, 8).map((s, i) => (
                                    <Tag key={i} color="green">{s}</Tag>
                                ))}
                                {result.skillsAnalysis.strongAreas.length === 0 && (
                                    <p className="text-[10px] text-slate-600">No strong skills detected</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                            <p className="text-[8px] font-black text-yellow-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <XCircle className="w-3 h-3" /> Missing Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {result.skillsAnalysis.missingAreas.slice(0, 8).map((s, i) => (
                                    <Tag key={i} color="yellow">{s}</Tag>
                                ))}
                                {result.skillsAnalysis.missingAreas.length === 0 && (
                                    <p className="text-[10px] text-slate-600">No missing skills</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                            <p className="text-[8px] font-black text-red-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3" /> Critical Missing
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {result.skillsAnalysis.missingAreas.slice(0, 6).map((s, i) => (
                                    <Tag key={i} color="red">{s}</Tag>
                                ))}
                            </div>
                        </div>
                    </div>
                    {result.skillsAnalysis.learningRecommendations.length > 0 && (
                        <div className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/5">
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-wider mb-2">Skill Gap Summary</p>
                            <ul className="space-y-1">
                                {result.skillsAnalysis.learningRecommendations.slice(0, 3).map((r, i) => (
                                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                        <ArrowUpRight className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />{r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </SectionCard>
            )}

            {/* ===== 4. PROJECT ANALYSIS ===== */}
            {hasEnhanced && result.projectAnalysis && result.projectAnalysis.length > 0 && (
                <SectionCard title="Project Analysis" icon={Code2} iconColor="#8b5cf6">
                    <div className="space-y-4">
                        {result.projectAnalysis.map((project, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="p-5 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{project.projectName}</h4>
                                        {project.technologyStack && project.technologyStack.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {project.technologyStack.slice(0, 5).map((t, i) => (
                                                    <span key={i} className="text-[7px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3 shrink-0">
                                        <div className="text-center">
                                            <span className="text-sm font-black text-purple-400">{project.industryRelevance}%</span>
                                            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Role Rel.</p>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm font-black text-green-400">{project.resumeValue}%</span>
                                            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Resume Val.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        {project.strengths.length > 0 && (
                                            <p className="text-xs text-slate-400 mb-1">
                                                <span className="text-green-400 font-bold">Strength: </span>
                                                {project.strengths[0]}
                                            </p>
                                        )}
                                        {project.weaknesses.length > 0 && (
                                            <p className="text-xs text-slate-400">
                                                <span className="text-red-400 font-bold">Improve: </span>
                                                {project.weaknesses[0]}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl border border-blue-500/10">
                                        <p className="text-[8px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Recruiter Impression</p>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">{project.recruiterImpression}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {result.projectComparison && (
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                            {result.projectComparison.strongestProject && (
                                <StatPill label="Best Project" value={result.projectComparison.strongestProject} color="green" />
                            )}
                            {result.projectComparison.projectThatShouldAppearFirst && (
                                <StatPill label="Highlight First" value={result.projectComparison.projectThatShouldAppearFirst} color="purple" />
                            )}
                            {result.projectComparison.projectThatShouldBeImproved && (
                                <StatPill label="Needs Improvement" value={result.projectComparison.projectThatShouldBeImproved} color="red" />
                            )}
                        </div>
                    )}

                    {result.projectComparison && result.projectComparison.rankingTable.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="p-2">Project</th>
                                        <th className="p-2 text-center">Tech</th>
                                        <th className="p-2 text-center">Scalab.</th>
                                        <th className="p-2 text-center">Innov.</th>
                                        <th className="p-2 text-center">Industry</th>
                                        <th className="p-2 text-center">Value</th>
                                        <th className="p-2 text-center">Rank</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...result.projectComparison.rankingTable].sort((a, b) => a.overallRank - b.overallRank).map((row, i) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors text-xs">
                                            <td className="p-2 font-bold text-white">{row.project}</td>
                                            <td className="p-2 text-center text-slate-400">{row.technicalDepth}</td>
                                            <td className="p-2 text-center text-slate-400">{row.scalability}</td>
                                            <td className="p-2 text-center text-slate-400">{row.innovation}</td>
                                            <td className="p-2 text-center text-slate-400">{row.industryRelevance}</td>
                                            <td className="p-2 text-center text-slate-400">{row.resumeValue}</td>
                                            <td className="p-2 text-center">
                                                <span className={`text-xs font-black ${row.overallRank === 1 ? 'text-yellow-400' : row.overallRank === 2 ? 'text-slate-300' : row.overallRank === 3 ? 'text-orange-400' : 'text-slate-500'}`}>
                                                    #{row.overallRank}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SectionCard>
            )}

            {/* ===== 5. EXPERIENCE ANALYSIS ===== */}
            {hasEnhanced && result.experienceAnalysis && result.experienceAnalysis.length > 0 && (
                <SectionCard title="Experience Analysis" icon={Briefcase} iconColor="#06b6d4">
                    <div className="space-y-4">
                        {result.experienceAnalysis.map((exp, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="p-5 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="text-sm font-black text-white">{exp.role}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold">{exp.organization}</p>
                                    </div>
                                    <div className="text-center shrink-0">
                                        <span className="text-sm font-black text-cyan-400">{exp.technicalDepth}%</span>
                                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Role Rel.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        {exp.strengths.length > 0 && (
                                            <p className="text-xs text-slate-400 mb-1">
                                                <span className="text-green-400 font-bold">Strength: </span>
                                                {exp.strengths[0]}
                                            </p>
                                        )}
                                        {exp.weaknesses.length > 0 && (
                                            <p className="text-xs text-slate-400">
                                                <span className="text-red-400 font-bold">Improve: </span>
                                                {exp.weaknesses[0]}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl border border-cyan-500/10">
                                        <p className="text-[8px] font-bold text-cyan-400 uppercase tracking-wider mb-0.5">Recruiter Impression</p>
                                        <p className="text-[11px] text-slate-400 leading-relaxed italic">{exp.recruiterImpression}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {result.experienceComparison && (
                        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                            {result.experienceComparison.mostValuableExperience && (
                                <StatPill label="Most Relevant" value={result.experienceComparison.mostValuableExperience} color="green" />
                            )}
                            {result.experienceComparison.mostTechnicalExperience && (
                                <StatPill label="Strongest Experience" value={result.experienceComparison.mostTechnicalExperience} color="blue" />
                            )}
                            {result.experienceComparison.experienceNeedingRewrite && (
                                <StatPill label="Needs Rewrite" value={result.experienceComparison.experienceNeedingRewrite} color="red" />
                            )}
                        </div>
                    )}
                </SectionCard>
            )}

            {/* ===== 6. ATS KEYWORD ANALYSIS ===== */}
            {hasEnhanced && result.atsKeywordAnalysis && (
                <SectionCard title="ATS Keyword Analysis" icon={Search} iconColor="#f59e0b">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="space-y-5">
                            <div>
                                <p className="text-[8px] font-black text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3" /> Matched ({result.atsKeywordAnalysis.matchedKeywords.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.atsKeywordAnalysis.matchedKeywords.slice(0, 12).map((kw, i) => (
                                        <Tag key={i} color="green">{kw}</Tag>
                                    ))}
                                    {result.atsKeywordAnalysis.matchedKeywords.length === 0 && <p className="text-[10px] text-slate-600">None matched</p>}
                                </div>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <XCircle className="w-3 h-3" /> Missing ({result.atsKeywordAnalysis.missingKeywords.length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.atsKeywordAnalysis.missingKeywords.slice(0, 12).map((kw, i) => (
                                        <Tag key={i} color="red">{kw}</Tag>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <p className="text-[8px] font-black text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3" /> Critical Missing
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.atsKeywordAnalysis.mostImportantMissingKeywords.map((kw, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                            <AlertTriangle className="w-2.5 h-2.5" /> {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl border border-blue-500/10">
                                <div className="flex items-center gap-3">
                                    <div className="relative shrink-0">
                                        <svg className="w-14 h-14 transform -rotate-90">
                                            <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="5" fill="transparent" className="text-white/10" />
                                            <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="5" fill="transparent"
                                                strokeDasharray={138} strokeDashoffset={138 * (1 - result.atsKeywordAnalysis.keywordMatchPercentage / 100)}
                                                strokeLinecap="round" className="text-blue-400 transition-all duration-1000" />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-blue-400">
                                            {result.atsKeywordAnalysis.keywordMatchPercentage}%
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-bold text-blue-400 uppercase tracking-wider mb-1">Expected ATS Improvement</p>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">{result.atsKeywordAnalysis.impactOfMissingKeywords}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ===== 7. TARGET COMPANY READINESS ===== */}
            {hasEnhanced && result.faangReadiness && (
                <SectionCard title="Target Company Readiness" icon={Building2} iconColor="#f97316">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(result.faangReadiness).map(([key, data]) => {
                            const companyName = key.charAt(0).toUpperCase() + key.slice(1);
                            const cData = data as any;
                            return (
                                <motion.div key={key} whileHover={{ scale: 1.01 }}
                                    className="p-5 bg-white/[0.03] rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="text-center">
                                            <ScoreRing score={cData.readiness} size={52} strokeWidth={5} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-base font-black text-white uppercase tracking-tight">{companyName}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {cData.strengths && cData.strengths.length > 0 && (
                                            <div>
                                                <p className="text-[8px] font-bold text-green-400 uppercase tracking-wider mb-1">Strengths</p>
                                                <ul className="space-y-0.5">
                                                    {cData.strengths.slice(0, 2).map((s: string, i: number) => (
                                                        <li key={i} className="text-[10px] text-slate-400">• {s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {cData.missingSkills && cData.missingSkills.length > 0 && (
                                            <div>
                                                <p className="text-[8px] font-bold text-red-400 uppercase tracking-wider mb-1">Missing</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {cData.missingSkills.slice(0, 4).map((s: string, i: number) => (
                                                        <span key={i} className="text-[7px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-bold">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {cData.expectedImprovementIfFixed && (
                                            <div className="p-2.5 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-lg border border-green-500/10">
                                                <p className="text-[9px] text-slate-300"><span className="text-green-400 font-bold">Next Step: </span>{cData.expectedImprovementIfFixed}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </SectionCard>
            )}

            {/* ===== 8. ROLE-SPECIFIC INTERVIEW READINESS ===== */}
            {hasEnhanced && result.interviewReadiness && (
                <SectionCard title="Interview Readiness" icon={Brain} iconColor="#3b82f6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { key: "dsa", label: "DSA", color: "#ef4444" },
                            { key: "frontend", label: "Frontend", color: "#3b82f6" },
                            { key: "backend", label: "Backend", color: "#22c55e" },
                            { key: "systemDesign", label: "System Design", color: "#ec4899" },
                            { key: "fullStack", label: "Full Stack", color: "#8b5cf6" },
                            { key: "behavioral", label: "Behavioral", color: "#f59e0b" },
                        ].map((item) => {
                            const data = result.interviewReadiness?.[item.key as keyof typeof result.interviewReadiness];
                            if (!data) return null;
                            return (
                                <motion.div key={item.key} whileHover={{ scale: 1.03 }}
                                    className="p-4 bg-white/[0.03] rounded-xl border border-white/5 text-center">
                                    <ScoreRing score={data.readiness} size={52} strokeWidth={5} color={item.color} />
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-2">{item.label}</p>
                                    <div className="mt-2.5 space-y-1 text-left">
                                        <p className="text-[9px] text-slate-400">
                                            <span className="text-green-400 font-bold">✓ </span>{data.recommendations[0] || "Solid foundation"}
                                        </p>
                                        {data.recommendations[1] && (
                                            <p className="text-[9px] text-slate-500">
                                                <span className="text-red-400 font-bold">!</span> {data.recommendations[1]}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </SectionCard>
            )}

            {/* ===== Legacy sections for backward compat ===== */}
            {(result.strengths.length > 0 || result.criticalGaps.length > 0) && !hasEnhanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {result.criticalGaps.length > 0 && (
                        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            className="bg-red-500/5 rounded-[2rem] p-6 border border-red-500/10 backdrop-blur-xl">
                            <h3 className="text-sm font-black text-red-400 mb-4 uppercase tracking-tight flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                Critical Gaps
                            </h3>
                            <ul className="space-y-2">
                                {result.criticalGaps.map((gap, i) => (
                                    <li key={i} className="text-sm text-slate-300 font-medium flex items-start gap-2">
                                        <span className="text-red-500 mt-1 shrink-0">•</span>{gap}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                    {result.strengths.length > 0 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="bg-green-500/5 rounded-[2rem] p-6 border border-green-500/10 backdrop-blur-xl">
                            <h3 className="text-sm font-black text-green-400 mb-4 uppercase tracking-tight flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                Key Strengths
                            </h3>
                            <ul className="space-y-2">
                                {result.strengths.map((str, i) => (
                                    <li key={i} className="text-sm text-slate-300 font-medium flex items-start gap-2">
                                        <span className="text-green-500 mt-1 shrink-0">•</span>{str}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </div>
            )}

            {result.sectionwiseAnalysis && Object.keys(result.sectionwiseAnalysis).length > 0 && !hasEnhanced && (
                <SectionCard title="Section Analysis" icon={Layers} iconColor="#6366f1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(result.sectionwiseAnalysis).filter(([_, v]) => v && v !== "").map(([key, content], i) => {
                            const meta: Record<string, { icon: any; color: string }> = {
                                experience: { icon: TrendingUp, color: "text-blue-400" },
                                projects: { icon: Code2, color: "text-purple-400" },
                                skills: { icon: Award, color: "text-green-400" },
                                education: { icon: BookOpen, color: "text-yellow-400" }
                            };
                            const itemMeta = meta[key] || { icon: Search, color: "text-blue-400" };
                            return (
                                <motion.div key={key} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }} className="p-5 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <div className={`p-1.5 bg-white/5 rounded-lg ${itemMeta.color}`}>
                                            <itemMeta.icon className="w-3.5 h-3.5" />
                                        </div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">{key}</h3>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{content}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </SectionCard>
            )}

            {result.improvementPlan && Object.keys(result.improvementPlan).length > 0 && !hasEnhanced && (
                <SectionCard title="Growth Roadmap" icon={TrendingUp} iconColor="#3b82f6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {result.improvementPlan.additionalSkills.length > 0 && (
                            <div>
                                <p className="text-[9px] font-black text-green-400 uppercase tracking-wider mb-3">Target Skills</p>
                                <div className="space-y-2">
                                    {result.improvementPlan.additionalSkills.map((skill, i) => (
                                        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs font-bold text-slate-300">{skill}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {result.improvementPlan.newProjectIdeas.length > 0 && (
                            <div>
                                <p className="text-[9px] font-black text-purple-400 uppercase tracking-wider mb-3">New Projects</p>
                                <div className="space-y-2">
                                    {result.improvementPlan.newProjectIdeas.map((idea, i) => (
                                        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs font-bold text-slate-300">{idea}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {result.improvementPlan.projectEnhancements.length > 0 && (
                            <div>
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider mb-3">Project Enhancements</p>
                                <div className="space-y-2">
                                    {result.improvementPlan.projectEnhancements.map((enh, i) => (
                                        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs font-bold text-slate-300">{enh}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>
            )}

            {result.missingKeywords.length > 0 && !hasEnhanced && (
                <SectionCard title="Missing Keywords" icon={Search} iconColor="#f59e0b">
                    <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.map((kw, i) => (
                            <Tag key={i} color="red">{kw}</Tag>
                        ))}
                    </div>
                </SectionCard>
            )}
        </div>
    );
}
