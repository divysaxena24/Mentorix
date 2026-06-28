"use client"

import { User, GraduationCap, BadgeCheck, Building2, Link2, Clock, Target, Sparkles, ArrowUp, ChevronDown, Loader2, Award, BookOpen, FileText, Users } from "lucide-react"

interface LORFormData {
    candidateName: string
    recommenderName: string
    recommenderDesignation: string
    organization: string
    relationship: string
    duration: string
    purpose: string
    programApplyingTo: string
    strengths: string
    achievements: string
    projects: string
    skills: string
    additionalInstructions: string
}

interface LORFormProps {
    data: LORFormData
    onChange: (data: Partial<LORFormData>) => void
    tone: string
    setTone: (val: string) => void
    length: string
    setLength: (val: string) => void
    loading: boolean
    onGenerate: () => void
    onAutoFetch?: () => void
    hasProfileResume?: boolean
    tones: string[]
    lengths: string[]
}

const lorTones = ["Academic", "Professional", "Research", "Internship", "Scholarship"]

export default function LORForm({
    data,
    onChange,
    tone,
    setTone,
    length,
    setLength,
    loading,
    onGenerate,
    onAutoFetch,
    hasProfileResume,
    tones,
    lengths
}: LORFormProps) {
    return (
        <div className="bg-white/2 border border-white/5 rounded-5xl p-5 md:p-9 shadow-2xl backdrop-blur-3xl relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[100px] -mr-40 -mt-40 rounded-full pointer-events-none" />

            <div className="space-y-8">
                {/* Section: Candidate & Recommender Info */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3 mb-1">
                        <Users className="w-4 h-4 text-blue-400" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-blue-400">Candidate & Recommender</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2.5">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                <User className="w-3 h-3 text-blue-400" /> Candidate Name
                            </label>
                            <input
                                value={data.candidateName}
                                onChange={(e) => onChange({ candidateName: e.target.value })}
                                placeholder="e.g. Jane Doe"
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-[13px] font-medium"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                <User className="w-3 h-3 text-purple-400" /> Recommender Name
                            </label>
                            <input
                                value={data.recommenderName}
                                onChange={(e) => onChange({ recommenderName: e.target.value })}
                                placeholder="e.g. Dr. John Smith"
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all text-[13px] font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2.5">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                <BadgeCheck className="w-3 h-3 text-amber-400" /> Recommender Designation
                            </label>
                            <input
                                value={data.recommenderDesignation}
                                onChange={(e) => onChange({ recommenderDesignation: e.target.value })}
                                placeholder="e.g. Professor of Computer Science"
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all text-[13px] font-medium"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                <Building2 className="w-3 h-3 text-emerald-400" /> Organization / University
                            </label>
                            <input
                                value={data.organization}
                                onChange={(e) => onChange({ organization: e.target.value })}
                                placeholder="e.g. Stanford University"
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all text-[13px] font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2.5">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                <Link2 className="w-3 h-3 text-cyan-400" /> Relationship with Candidate
                            </label>
                            <input
                                value={data.relationship}
                                onChange={(e) => onChange({ relationship: e.target.value })}
                                placeholder="e.g. Research Advisor, Thesis Supervisor"
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all text-[13px] font-medium"
                            />
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                <Clock className="w-3 h-3 text-rose-400" /> Duration of Association
                            </label>
                            <input
                                value={data.duration}
                                onChange={(e) => onChange({ duration: e.target.value })}
                                placeholder="e.g. 2 years (2022-2024)"
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all text-[13px] font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Purpose */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3 mb-1">
                        <Target className="w-4 h-4 text-purple-400" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">Purpose & Target</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2.5">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                <BookOpen className="w-3 h-3 text-indigo-400" /> Purpose of Recommendation
                            </label>
                            <select
                                value={data.purpose}
                                onChange={(e) => onChange({ purpose: e.target.value })}
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 appearance-none text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                            >
                                <option value="" className="bg-[#020617]">Select purpose...</option>
                                <option value="graduate_admission" className="bg-[#020617]">Graduate School Admission</option>
                                <option value="job_application" className="bg-[#020617]">Job Application</option>
                                <option value="internship" className="bg-[#020617]">Internship Application</option>
                                <option value="scholarship" className="bg-[#020617]">Scholarship Application</option>
                                <option value="fellowship" className="bg-[#020617]">Fellowship Program</option>
                                <option value="visa" className="bg-[#020617]">Visa / Immigration</option>
                                <option value="other" className="bg-[#020617]">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                                <GraduationCap className="w-3 h-3 text-blue-400" /> Program / Company Applying To
                            </label>
                            <input
                                value={data.programApplyingTo}
                                onChange={(e) => onChange({ programApplyingTo: e.target.value })}
                                placeholder="e.g. MS in CS at MIT, or Google SWE"
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-[13px] font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: Candidate Details */}
                <div className="space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-3 mb-1">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">Candidate Profile</h3>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-3">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 italic">Candidate Strengths</label>
                            <textarea
                                value={data.strengths}
                                onChange={(e) => onChange({ strengths: e.target.value })}
                                placeholder="Describe the candidate's key strengths, qualities, and attributes..."
                                className="w-full min-h-[80px] bg-white/3 border border-white/10 rounded-4xl p-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none text-[13px] leading-relaxed font-medium"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 italic">Major Achievements</label>
                            <textarea
                                value={data.achievements}
                                onChange={(e) => onChange({ achievements: e.target.value })}
                                placeholder="List notable achievements, awards, publications, or recognitions..."
                                className="w-full min-h-[80px] bg-white/3 border border-white/10 rounded-4xl p-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all resize-none text-[13px] leading-relaxed font-medium"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 italic">Projects</label>
                            <textarea
                                value={data.projects}
                                onChange={(e) => onChange({ projects: e.target.value })}
                                placeholder="Describe significant projects the candidate has worked on..."
                                className="w-full min-h-[80px] bg-white/3 border border-white/10 rounded-4xl p-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none text-[13px] leading-relaxed font-medium"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 italic">Skills</label>
                            <textarea
                                value={data.skills}
                                onChange={(e) => onChange({ skills: e.target.value })}
                                placeholder="List technical and soft skills relevant to the application..."
                                className="w-full min-h-[60px] bg-white/3 border border-white/10 rounded-4xl p-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all resize-none text-[13px] leading-relaxed font-medium"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 italic">Additional Instructions</label>
                            <textarea
                                value={data.additionalInstructions}
                                onChange={(e) => onChange({ additionalInstructions: e.target.value })}
                                placeholder="Any specific points to include, formatting preferences, or additional context..."
                                className="w-full min-h-[60px] bg-white/3 border border-white/10 rounded-4xl p-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all resize-none text-[13px] leading-relaxed font-medium"
                            />
                        </div>
                    </div>

                    {hasProfileResume && onAutoFetch && (
                        <button
                            onClick={onAutoFetch}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <ArrowUp className="w-3 h-3" />
                            Auto Fill from Profile
                        </button>
                    )}
                </div>

                {/* Tone & Length */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 italic">Recommendation Tone</label>
                        <div className="relative group">
                            <select
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 appearance-none text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-inner"
                            >
                                {lorTones.map(t => <option key={t} value={t} className="bg-[#020617]">{t}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-hover:text-white pointer-events-none transition-colors" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 italic">Output Length</label>
                        <div className="relative group">
                            <select
                                value={length}
                                onChange={(e) => setLength(e.target.value)}
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 appearance-none text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-inner"
                            >
                                {lengths.map(l => <option key={l} value={l} className="bg-[#020617]">{l}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-hover:text-white pointer-events-none transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Generate */}
                <button
                    onClick={onGenerate}
                    disabled={loading}
                    className="w-full h-[48px] bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl font-black text-[8px] uppercase tracking-[0.35em] flex items-center justify-center gap-3 hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_50px_rgba(37,99,235,0.2)] relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-in-out" />
                    {loading ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="relative z-10">Synthesizing...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3.5 h-3.5 relative z-10 group-hover:scale-110 transition-transform" />
                            <span className="relative z-10">Generate Recommendation Letter</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
