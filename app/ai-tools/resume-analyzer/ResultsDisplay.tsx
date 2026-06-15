"use client"

import {
    Download, Sparkles, Target, Briefcase, Search,
    CheckCircle2, XCircle, AlertTriangle,
    Medal, Star, Flag
} from "lucide-react"
import { motion } from "framer-motion"
import { AnalysisResult } from "@/types"

interface ResultsDisplayProps {
    result: AnalysisResult;
    onReset: () => void;
    onDownload: () => void;
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
    };
    return (
        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${colors[color] || colors.blue}`}>
            {children}
        </span>
    );
}

export default function ResultsDisplay({ result, onReset, onDownload }: ResultsDisplayProps) {
    const hasEnhanced = !!result.executiveSummary;
    const es = result.executiveSummary || {};

    // Default values to prevent undefined errors
    const safeResult = {
        score: result.score || 0,
        summary: result.summary || "Resume analysis completed successfully.",
        strengths: result.strengths || [],
        criticalGaps: result.criticalGaps || [],
        improvementPoints: result.improvementPoints || [],
        missingKeywords: result.missingKeywords || [],
        executiveSummary: es,
        skillsAnalysis: result.skillsAnalysis || { strongAreas: [], missingAreas: [], learningRecommendations: [] },
        projectAnalysis: result.projectAnalysis || [],
        experienceAnalysis: result.experienceAnalysis || [],
        atsKeywordAnalysis: result.atsKeywordAnalysis || {
            matchedKeywords: [],
            missingKeywords: [],
            keywordMatchPercentage: 0,
            mostImportantMissingKeywords: [],
            impactOfMissingKeywords: ""
        }
    };

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
                                        strokeDasharray={276} strokeDashoffset={276 * (1 - safeResult.score / 100)}
                                        className={`${safeResult.score > 70 ? 'text-green-400' : safeResult.score > 40 ? 'text-yellow-400' : 'text-red-400'} transition-all duration-1000 ease-out`}
                                        strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl md:text-5xl font-black tracking-tighter">{safeResult.score}</span>
                                    <span className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-0.5">Overall</span>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-center gap-1.5">
                                {safeResult.score > 80 ? <Medal className="w-3.5 h-3.5 text-yellow-400" /> : safeResult.score > 60 ? <Star className="w-3.5 h-3.5 text-blue-400" /> : <Flag className="w-3.5 h-3.5 text-red-400" />}
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                    {safeResult.score > 80 ? "Exceptional Profile" : safeResult.score > 60 ? "Strong Candidate" : safeResult.score > 40 ? "Needs Improvement" : "Requires Significant Work"}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 w-full space-y-5">
                            <div className="bg-white/[0.03] p-5 md:p-6 rounded-2xl border border-white/[0.06]">
                                <p className="text-sm leading-relaxed text-slate-300 font-medium">{safeResult.summary}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5">
                                <button onClick={onDownload}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20">
                                    <Download className="w-3.5 h-3.5" />
                                    Download Detailed Analysis
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
            {hasEnhanced && (
                <SectionCard title="Executive Summary" icon={Target} iconColor="#3b82f6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="space-y-4">
                            <p className="text-sm text-slate-300 leading-relaxed">{es.professionalOverview || "Professional overview will appear here."}</p>
                            <div className="flex items-center gap-2.5 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider shrink-0">Stage:</span>
                                <span className="text-sm font-bold text-white">{es.careerStageAssessment || "Not specified"}</span>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl border border-blue-500/10">
                                <p className="text-[8px] font-black text-purple-400 uppercase tracking-wider mb-1.5">Hiring Impression</p>
                                <p className="text-sm text-slate-300 leading-relaxed italic">&ldquo;{es.overallHiringImpression || "No hiring impression available yet."}&rdquo;</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/10">
                                <p className="text-[8px] font-black text-green-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3" /> Top Strengths
                                </p>
                                <ul className="space-y-1.5">
                                    {(es.top3Strengths || []).length > 0 ? (es.top3Strengths || []).map((s, i) => (
                                        <li key={i} className="text-xs text-slate-300 font-medium flex items-start gap-1.5">
                                            <span className="text-green-500 mt-0.5 shrink-0">•</span>{s}
                                        </li>
                                    )) : (
                                        <li className="text-xs text-slate-500">No strengths identified yet</li>
                                    )}
                                </ul>
                            </div>
                            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                                <p className="text-[8px] font-black text-red-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3" /> Top Improvements
                                </p>
                                <ul className="space-y-1.5">
                                    {(es.top3Improvements || []).length > 0 ? (es.top3Improvements || []).map((s, i) => (
                                        <li key={i} className="text-xs text-slate-300 font-medium flex items-start gap-1.5">
                                            <span className="text-red-500 mt-0.5 shrink-0">•</span>{s}
                                        </li>
                                    )) : (
                                        <li className="text-xs text-slate-500">No improvements identified yet</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ===== 2. SKILLS ANALYSIS ===== */}
            {hasEnhanced && (
                <SectionCard title="Skills Analysis" icon={Target} iconColor="#22c55e">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/10">
                            <p className="text-[8px] font-black text-green-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3" /> Strong Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {(safeResult.skillsAnalysis.strongAreas || []).slice(0, 8).map((s, i) => (
                                    <Tag key={i} color="green">{s}</Tag>
                                ))}
                                {(safeResult.skillsAnalysis.strongAreas || []).length === 0 && (
                                    <p className="text-[10px] text-slate-600">No strong skills detected</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                            <p className="text-[8px] font-black text-yellow-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <XCircle className="w-3 h-3" /> Missing Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {(safeResult.skillsAnalysis.missingAreas || []).slice(0, 8).map((s, i) => (
                                    <Tag key={i} color="yellow">{s}</Tag>
                                ))}
                                {(safeResult.skillsAnalysis.missingAreas || []).length === 0 && (
                                    <p className="text-[10px] text-slate-600">No missing skills</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                            <p className="text-[8px] font-black text-red-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <AlertTriangle className="w-3 h-3" /> Critical Missing
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {(safeResult.skillsAnalysis.missingAreas || []).slice(0, 6).map((s, i) => (
                                    <Tag key={i} color="red">{s}</Tag>
                                ))}
                            </div>
                        </div>
                    </div>

                </SectionCard>
            )}

            {/* ===== 3. PROJECT ANALYSIS ===== */}
            {hasEnhanced && safeResult.projectAnalysis.length > 0 && (
                <SectionCard title="Project Analysis" icon={Briefcase} iconColor="#8b5cf6">
                    <div className="space-y-4">
                        {safeResult.projectAnalysis.map((project, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="p-5 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{project.projectName || "Unnamed Project"}</h4>
                                        {project.technologyStack && project.technologyStack.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {(project.technologyStack || []).slice(0, 5).map((t, i) => (
                                                    <span key={i} className="text-[7px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3 shrink-0">
                                        <div className="text-center">
                                            <span className="text-sm font-black text-purple-400">{project.industryRelevance || 0}%</span>
                                            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Role Rel.</p>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-sm font-black text-green-400">{project.resumeValue || 0}%</span>
                                            <p className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Resume Val.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        {(project.strengths || []).length > 0 && (
                                            <p className="text-xs text-slate-400 mb-1">
                                                <span className="text-green-400 font-bold">Strength: </span>
                                                {project.strengths[0]}
                                            </p>
                                        )}
                                        {(project.weaknesses || []).length > 0 && (
                                            <p className="text-xs text-slate-400">
                                                <span className="text-red-400 font-bold">Improve: </span>
                                                {project.weaknesses[0]}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl border border-blue-500/10">
                                        <p className="text-[8px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">Recruiter Impression</p>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">{project.recruiterImpression || "No recruiter impression available yet."}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* ===== 4. EXPERIENCE ANALYSIS ===== */}
            {hasEnhanced && safeResult.experienceAnalysis.length > 0 && (
                <SectionCard title="Experience Analysis" icon={Briefcase} iconColor="#06b6d4">
                    <div className="space-y-4">
                        {safeResult.experienceAnalysis.map((exp, idx) => (
                            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="p-5 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="text-sm font-black text-white">{exp.role || "Unspecified Role"}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold">{exp.organization || "Unspecified Company"}</p>
                                    </div>
                                    <div className="text-center shrink-0">
                                        <span className="text-sm font-black text-cyan-400">{exp.technicalDepth || 0}%</span>
                                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-wider">Role Rel.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        {(exp.strengths || []).length > 0 && (
                                            <p className="text-xs text-slate-400 mb-1">
                                                <span className="text-green-400 font-bold">Strength: </span>
                                                {exp.strengths[0]}
                                            </p>
                                        )}
                                        {(exp.weaknesses || []).length > 0 && (
                                            <p className="text-xs text-slate-400">
                                                <span className="text-red-400 font-bold">Improve: </span>
                                                {exp.weaknesses[0]}
                                            </p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-xl border border-cyan-500/10">
                                        <p className="text-[8px] font-bold text-cyan-400 uppercase tracking-wider mb-0.5">Recruiter Impression</p>
                                        <p className="text-[11px] text-slate-400 leading-relaxed italic">{exp.recruiterImpression || "No recruiter impression available yet."}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* ===== 5. ATS ANALYSIS ===== */}
            {hasEnhanced && (
                <SectionCard title="ATS Analysis" icon={Search} iconColor="#f59e0b">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="space-y-5">
                            <div>
                                <p className="text-[8px] font-black text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3 h-3" /> Matched ({(safeResult.atsKeywordAnalysis.matchedKeywords || []).length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(safeResult.atsKeywordAnalysis.matchedKeywords || []).slice(0, 12).map((kw, i) => (
                                        <Tag key={i} color="green">{kw}</Tag>
                                    ))}
                                    {(safeResult.atsKeywordAnalysis.matchedKeywords || []).length === 0 && <p className="text-[10px] text-slate-600">None matched</p>}
                                </div>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <XCircle className="w-3 h-3" /> Missing ({(safeResult.atsKeywordAnalysis.missingKeywords || []).length})
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(safeResult.atsKeywordAnalysis.missingKeywords || []).slice(0, 12).map((kw, i) => (
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
                                    {(safeResult.atsKeywordAnalysis.mostImportantMissingKeywords || []).map((kw, i) => (
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
                                                strokeDasharray={138} strokeDashoffset={138 * (1 - (safeResult.atsKeywordAnalysis.keywordMatchPercentage || 0) / 100)}
                                                strokeLinecap="round" className="text-blue-400 transition-all duration-1000" />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-blue-400">
                                            {safeResult.atsKeywordAnalysis.keywordMatchPercentage || 0}%
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-bold text-blue-400 uppercase tracking-wider mb-1">ATS Score Impact</p>
                                        <p className="text-[11px] text-slate-400 leading-relaxed">{safeResult.atsKeywordAnalysis.impactOfMissingKeywords || "No impact information available yet."}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ===== LEGACY FALLBACK (non-enhanced results) ===== */}
            {!hasEnhanced && (
                <>
                    {(safeResult.strengths.length > 0 || safeResult.criticalGaps.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {safeResult.criticalGaps.length > 0 && (
                                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                    className="bg-red-500/5 rounded-[2rem] p-6 border border-red-500/10 backdrop-blur-xl">
                                    <h3 className="text-sm font-black text-red-400 mb-4 uppercase tracking-tight flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        Critical Gaps
                                    </h3>
                                    <ul className="space-y-2">
                                        {safeResult.criticalGaps.map((gap, i) => (
                                            <li key={i} className="text-sm text-slate-300 font-medium flex items-start gap-2">
                                                <span className="text-red-500 mt-1 shrink-0">•</span>{gap}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                            {safeResult.strengths.length > 0 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                    className="bg-green-500/5 rounded-[2rem] p-6 border border-green-500/10 backdrop-blur-xl">
                                    <h3 className="text-sm font-black text-green-400 mb-4 uppercase tracking-tight flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        Key Strengths
                                    </h3>
                                    <ul className="space-y-2">
                                        {safeResult.strengths.map((str, i) => (
                                            <li key={i} className="text-sm text-slate-300 font-medium flex items-start gap-2">
                                                <span className="text-green-500 mt-1 shrink-0">•</span>{str}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {safeResult.missingKeywords.length > 0 && (
                        <SectionCard title="Missing Keywords" icon={Search} iconColor="#f59e0b">
                            <div className="flex flex-wrap gap-2">
                                {safeResult.missingKeywords.map((kw, i) => (
                                    <Tag key={i} color="red">{kw}</Tag>
                                ))}
                            </div>
                        </SectionCard>
                    )}
                </>
            )}
        </div>
    );
}
