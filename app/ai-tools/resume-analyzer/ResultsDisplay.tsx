"use client"

import {
    Download, Sparkles, Target, Briefcase, Search,
    Medal, Star, Flag, Building2
} from "lucide-react"
import { motion } from "framer-motion"
import { AnalysisResult } from "@/types"

interface ResultsDisplayProps {
    result: AnalysisResult;
    onReset: () => void;
    onDownload: () => void;
}

function ScoreRing({ score, size = 36, stroke = 6, label }: { score: number; size?: number; stroke?: number; label?: string }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - Math.min(score, 100) / 100);
    const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#ef4444";
    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} fill="transparent" className="text-white/10" />
                <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="transparent"
                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <span className="absolute text-xs font-black" style={{ color }}>{score}</span>
            {label && <span className="absolute -bottom-4 text-[7px] font-bold text-white/40 uppercase tracking-wider whitespace-nowrap">{label}</span>}
        </div>
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
        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${colors[color] || colors.blue}`}>
            {children}
        </span>
    );
}

function SectionCard({ title, icon: Icon, iconColor, children }: {
    title: string; icon: any; iconColor: string; children: React.ReactNode;
}) {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-2.5 mb-4">
                <div className="p-1.5 rounded-lg" style={{ background: `${iconColor}15` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-tight">{title}</h3>
            </div>
            {children}
        </motion.div>
    );
}

export default function ResultsDisplay({ result, onReset, onDownload }: ResultsDisplayProps) {
    const s = {
        overallScore: result.overallScore ?? result.score ?? 0,
        skillsScore: result.skillsScore ?? 0,
        strongSkills: result.strongSkills ?? [],
        missingSkills: result.missingSkills ?? [],
        criticalMissingSkills: result.criticalMissingSkills ?? [],
        skillsRecruiterVerdict: result.skillsRecruiterVerdict || "",
        projects: result.projects ?? [],
        experiences: result.experiences ?? [],
        atsScore: result.atsScore ?? 0,
        matchedKeywords: result.matchedKeywords ?? [],
        missingKeywords: result.missingKeywords ?? [],
        criticalMissingKeywords: result.criticalMissingKeywords ?? [],
        expectedATSImprovement: result.expectedATSImprovement || "",
        companyReadinessScore: result.companyReadinessScore ?? 0,
        companyReadinessAreas: result.companyReadinessAreas ?? [],
        companyReadinessStrengths: result.companyReadinessStrengths ?? [],
        companyReadinessWeaknesses: result.companyReadinessWeaknesses ?? [],
        companyReadinessMissingSkills: result.companyReadinessMissingSkills ?? [],
        interviewProbability: result.interviewProbability || "",
        companyReadinessVerdict: result.companyReadinessVerdict || "",
    };

    return (
        <div className="space-y-4 max-w-4xl mx-auto">

            {/* ===== HERO ===== */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-2xl rounded-2xl p-6 text-white border border-white/10">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <ScoreRing score={s.overallScore} size={72} stroke={8} />
                            <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mt-1">Overall</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-3 h-3 text-blue-400" />
                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Resume Intelligence</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {s.overallScore >= 80 ? <Medal className="w-4 h-4 text-yellow-400" /> : s.overallScore >= 60 ? <Star className="w-4 h-4 text-blue-400" /> : <Flag className="w-4 h-4 text-red-400" />}
                                <span className="text-lg font-black tracking-tight">
                                    {s.overallScore >= 80 ? "Exceptional" : s.overallScore >= 60 ? "Strong" : s.overallScore >= 40 ? "Needs Work" : "Requires Focus"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={onDownload}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-lg shadow-blue-500/20">
                            <Download className="w-3 h-3" /> PDF
                        </button>
                        <button onClick={onReset}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-white transition-all">
                            New
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* ===== SECTION 1: SKILLS SCORE ===== */}
            <SectionCard title="Skills Score" icon={Target} iconColor="#22c55e">
                <div className="flex items-center gap-4 mb-3">
                    <ScoreRing score={s.skillsScore} size={40} stroke={5} />
                    <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs font-black text-green-400">{s.strongSkills.length}</p>
                            <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Strong</p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-yellow-400">{s.missingSkills.length}</p>
                            <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Missing</p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-red-400">{s.criticalMissingSkills.length}</p>
                            <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Critical</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    {s.strongSkills.length > 0 && (
                        <div>
                            <p className="text-[7px] font-bold text-green-400 uppercase tracking-wider mb-1">Strong</p>
                            <div className="flex flex-wrap gap-1">{s.strongSkills.map((sk, i) => <Tag key={i} color="green">{sk}</Tag>)}</div>
                        </div>
                    )}
                    {s.missingSkills.length > 0 && (
                        <div>
                            <p className="text-[7px] font-bold text-yellow-400 uppercase tracking-wider mb-1">Missing</p>
                            <div className="flex flex-wrap gap-1">{s.missingSkills.map((sk, i) => <Tag key={i} color="yellow">{sk}</Tag>)}</div>
                        </div>
                    )}
                    {s.criticalMissingSkills.length > 0 && (
                        <div>
                            <p className="text-[7px] font-bold text-red-400 uppercase tracking-wider mb-1">Critical</p>
                            <div className="flex flex-wrap gap-1">{s.criticalMissingSkills.map((sk, i) => <Tag key={i} color="red">{sk}</Tag>)}</div>
                        </div>
                    )}
                </div>
                {s.skillsRecruiterVerdict && (
                    <p className="mt-3 text-[10px] text-slate-400 italic border-t border-white/5 pt-2">{s.skillsRecruiterVerdict}</p>
                )}
            </SectionCard>

            {/* ===== SECTION 2: PROJECT ANALYSIS ===== */}
            {s.projects.length > 0 && (
                <SectionCard title="Project Analysis" icon={Briefcase} iconColor="#8b5cf6">
                    <div className="space-y-3">
                        {s.projects.map((proj, idx) => (
                            <div key={idx} className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase">{proj.projectName}</h4>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(proj.technologies || []).slice(0, 4).map((t, i) => (
                                                <span key={i} className="text-[6px] px-1 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <ScoreRing score={proj.projectScore || 0} size={28} stroke={4} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-5 gap-1.5 mb-2">
                                    <div className="text-center p-1 bg-white/[0.02] rounded-lg">
                                        <p className="text-[8px] font-black text-purple-400">{proj.technicalDepth || 0}</p>
                                        <p className="text-[6px] font-bold text-white/30 uppercase">Tech 30%</p>
                                    </div>
                                    <div className="text-center p-1 bg-white/[0.02] rounded-lg">
                                        <p className="text-[8px] font-black text-blue-400">{proj.industryRelevance || 0}</p>
                                        <p className="text-[6px] font-bold text-white/30 uppercase">Industry 25%</p>
                                    </div>
                                    <div className="text-center p-1 bg-white/[0.02] rounded-lg">
                                        <p className="text-[8px] font-black text-cyan-400">{proj.scalability || 0}</p>
                                        <p className="text-[6px] font-bold text-white/30 uppercase">Scale 20%</p>
                                    </div>
                                    <div className="text-center p-1 bg-white/[0.02] rounded-lg">
                                        <p className="text-[8px] font-black text-orange-400">{proj.innovation || 0}</p>
                                        <p className="text-[6px] font-bold text-white/30 uppercase">Innovate 15%</p>
                                    </div>
                                    <div className="text-center p-1 bg-white/[0.02] rounded-lg">
                                        <p className="text-[8px] font-black text-green-400">{proj.resumeValue || 0}</p>
                                        <p className="text-[6px] font-bold text-white/30 uppercase">Resume 10%</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[9px]">
                                    <div>
                                        <span className="text-green-400 font-bold">✓ </span>
                                        <span className="text-slate-400">{proj.strength}</span>
                                    </div>
                                    <div>
                                        <span className="text-red-400 font-bold">! </span>
                                        <span className="text-slate-400">{proj.improvement}</span>
                                    </div>
                                </div>
                                {proj.recruiterVerdict && (
                                    <p className="mt-1.5 text-[8px] text-slate-500 italic">{proj.recruiterVerdict}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* ===== SECTION 3: EXPERIENCE ANALYSIS ===== */}
            {s.experiences.length > 0 && (
                <SectionCard title="Experience Analysis" icon={UserCheck} iconColor="#06b6d4">
                    <div className="space-y-3">
                        {s.experiences.map((exp, idx) => (
                            <div key={idx} className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="text-xs font-black text-white">{exp.role}</h4>
                                        <p className="text-[8px] text-slate-500 font-bold">{exp.company}{exp.duration ? ` • ${exp.duration}` : ""}</p>
                                    </div>
                                    <ScoreRing score={exp.experienceScore || 0} size={28} stroke={4} />
                                </div>
                                <div className="grid grid-cols-4 gap-1.5 mb-2">
                                    <div className="text-center p-1 bg-white/[0.02] rounded-lg">
                                        <p className="text-[8px] font-black text-cyan-400">{exp.technicalDepth || 0}</p>
                                        <p className="text-[6px] font-bold text-white/30 uppercase">Depth 40%</p>
                                    </div>
                                    <div className="text-center p-1 bg-white/[0.02] rounded-lg">
                                        <p className="text-[8px] font-black text-green-400">{exp.roleRelevance || 0}</p>
                                        <p className="text-[6px] font-bold text-white/30 uppercase">Relevance 25%</p>
                                    </div>
                                    <div className="text-center p-1 bg-white/[0.02] rounded-lg">
                                        <p className="text-[8px] font-black text-blue-400">{exp.businessImpact || 0}</p>
                                        <p className="text-[6px] font-bold text-white/30 uppercase">Impact 20%</p>
                                    </div>
                                    <div className="text-center p-1 bg-white/[0.02] rounded-lg">
                                        <p className="text-[8px] font-black text-purple-400">{exp.industryExposure || 0}</p>
                                        <p className="text-[6px] font-bold text-white/30 uppercase">Exposure 15%</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[9px]">
                                    <div>
                                        <span className="text-green-400 font-bold">✓ </span>
                                        <span className="text-slate-400">{exp.strength}</span>
                                    </div>
                                    <div>
                                        <span className="text-red-400 font-bold">! </span>
                                        <span className="text-slate-400">{exp.improvement}</span>
                                    </div>
                                </div>
                                {exp.recruiterVerdict && (
                                    <p className="mt-1.5 text-[8px] text-slate-500 italic">{exp.recruiterVerdict}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* ===== SECTION 4: ATS SCORE ===== */}
            <SectionCard title="ATS Score" icon={Search} iconColor="#f59e0b">
                <div className="flex items-center gap-4 mb-3">
                    <ScoreRing score={s.atsScore} size={40} stroke={5} />
                    <div className="flex-1 grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs font-black text-green-400">{s.matchedKeywords.length}</p>
                            <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Matched</p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-red-400">{s.missingKeywords.length}</p>
                            <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Missing</p>
                        </div>
                        <div>
                            <p className="text-xs font-black text-orange-400">{s.criticalMissingKeywords.length}</p>
                            <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Critical</p>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    {s.matchedKeywords.length > 0 && (
                        <div>
                            <p className="text-[7px] font-bold text-green-400 uppercase tracking-wider mb-1">Matched</p>
                            <div className="flex flex-wrap gap-1">{s.matchedKeywords.slice(0, 10).map((kw, i) => <Tag key={i} color="green">{kw}</Tag>)}</div>
                        </div>
                    )}
                    {s.missingKeywords.length > 0 && (
                        <div>
                            <p className="text-[7px] font-bold text-red-400 uppercase tracking-wider mb-1">Missing</p>
                            <div className="flex flex-wrap gap-1">{s.missingKeywords.slice(0, 10).map((kw, i) => <Tag key={i} color="red">{kw}</Tag>)}</div>
                        </div>
                    )}
                    {s.criticalMissingKeywords.length > 0 && (
                        <div>
                            <p className="text-[7px] font-bold text-orange-400 uppercase tracking-wider mb-1">Critical</p>
                            <div className="flex flex-wrap gap-1">{s.criticalMissingKeywords.map((kw, i) => <Tag key={i} color="orange">{kw}</Tag>)}</div>
                        </div>
                    )}
                </div>
                {s.expectedATSImprovement && (
                    <p className="mt-3 text-[9px] text-yellow-400 border-t border-white/5 pt-2">{s.expectedATSImprovement}</p>
                )}
            </SectionCard>

            {/* ===== SECTION 5: COMPANY READINESS ===== */}
            <SectionCard title="Company Readiness" icon={Building2} iconColor="#3b82f6">
                <div className="flex items-center gap-4 mb-3">
                    <ScoreRing score={s.companyReadinessScore} size={40} stroke={5} />
                    <div className="flex-1">
                        {s.companyReadinessAreas.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {s.companyReadinessAreas.slice(0, 6).map((area, i) => (
                                    <div key={i} className="text-center p-1 bg-white/[0.02] rounded-lg">
                                        <p className="text-[9px] font-black text-blue-400">{area.score}</p>
                                        <p className="text-[6px] font-bold text-white/30 uppercase truncate">{area.area}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                    {s.companyReadinessStrengths.length > 0 && (
                        <div>
                            <p className="text-[7px] font-bold text-green-400 uppercase tracking-wider mb-1">Strengths</p>
                            <div className="flex flex-wrap gap-1">{s.companyReadinessStrengths.map((str, i) => <Tag key={i} color="green">{str}</Tag>)}</div>
                        </div>
                    )}
                    {s.companyReadinessWeaknesses.length > 0 && (
                        <div>
                            <p className="text-[7px] font-bold text-red-400 uppercase tracking-wider mb-1">Weaknesses</p>
                            <div className="flex flex-wrap gap-1">{s.companyReadinessWeaknesses.map((w, i) => <Tag key={i} color="red">{w}</Tag>)}</div>
                        </div>
                    )}
                    {s.companyReadinessMissingSkills.length > 0 && (
                        <div>
                            <p className="text-[7px] font-bold text-orange-400 uppercase tracking-wider mb-1">Missing</p>
                            <div className="flex flex-wrap gap-1">{s.companyReadinessMissingSkills.map((ms, i) => <Tag key={i} color="orange">{ms}</Tag>)}</div>
                        </div>
                    )}
                </div>
                {s.interviewProbability && (
                    <p className="text-[9px] text-blue-400 font-bold mb-1">{s.interviewProbability}</p>
                )}
                {s.companyReadinessVerdict && (
                    <p className="text-[10px] text-slate-400 italic border-t border-white/5 pt-2">{s.companyReadinessVerdict}</p>
                )}
            </SectionCard>

        </div>
    );
}
