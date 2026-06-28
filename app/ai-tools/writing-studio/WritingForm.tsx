"use client"

import { FileSearch, User, ArrowUp, ChevronDown, Sparkles, Loader2 } from "lucide-react"
import LORForm from "./LORForm"
import ResumePreview from "./ResumePreview"
import type { ResumeData } from "@/types"

type DocType = "cover_letter" | "sop" | "lor" | "proposal"

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

interface WritingFormProps {
    docType: DocType | null;
    // Generic form props
    context: string;
    setContext: (val: string) => void;
    userDetails: string;
    setUserDetails: (val: string) => void;
    tone: string;
    setTone: (val: string) => void;
    length: string;
    setLength: (val: string) => void;
    // LOR form props
    lorData: LORFormData;
    setLORData: (data: LORFormData | ((prev: LORFormData) => LORFormData)) => void;
    lorTone: string;
    setLORTone: (val: string) => void;
    // Shared
    loading: boolean;
    onGenerate: () => void;
    onAutoFetch: () => void;
    hasProfileResume: boolean;
    resumeName?: string;
    tones: string[];
    lengths: string[];
    // Resume Preview props
    resumeData: ResumeData | null;
    showResumePreview: boolean;
    resumeJSONInternal: string;
    onRemoveResume: () => void;
    onRefreshResume: () => void;
}

export default function WritingForm({
    docType,
    // Generic form props
    context,
    setContext,
    userDetails,
    setUserDetails,
    tone,
    setTone,
    length,
    setLength,
    // LOR form props
    lorData,
    setLORData,
    lorTone,
    setLORTone,
    // Shared
    loading,
    onGenerate,
    onAutoFetch,
    hasProfileResume,
    resumeName,
    tones,
    lengths,
    // Resume Preview props
    resumeData,
    showResumePreview,
    resumeJSONInternal,
    onRemoveResume,
    onRefreshResume,
}: WritingFormProps) {
    // Render LOR-specific form
    if (docType === "lor") {
        return (
            <LORForm
                data={lorData}
                onChange={(partial) => setLORData(prev => ({ ...prev, ...partial }))}
                tone={lorTone}
                setTone={setLORTone}
                length={length}
                setLength={setLength}
                loading={loading}
                onGenerate={onGenerate}
                onAutoFetch={onAutoFetch}
                hasProfileResume={hasProfileResume}
                tones={tones}
                lengths={lengths}
            />
        )
    }

    // Render generic form for cover_letter, sop, proposal
    return (
        <div className="bg-white/2 border border-white/5 rounded-5xl p-5 md:p-9 shadow-2xl backdrop-blur-3xl relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[100px] -mr-40 -mt-40 rounded-full pointer-events-none" />

            <div className="space-y-10">
                <div className="space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-2xl text-white">
                            <FileSearch className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-tighter">Strategic Context</h3>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">
                                {docType === "cover_letter" ? "Job Specs or Company Details" :
                                 docType === "sop" ? "Program Details or University Info" :
                                 "Business Context or Problem Statement"}
                            </p>
                        </div>
                    </div>
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder={
                            docType === "cover_letter" ? "Paste the job description or company context here..." :
                            docType === "sop" ? "Describe the program, university, and your motivation..." :
                            "Describe the project, requirements, and context..."
                        }
                        className="w-full min-h-[98px] bg-white/3 border border-white/10 rounded-4xl p-6 text-white placeholder:text-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none text-[13px] leading-relaxed font-medium shadow-inner"
                    />
                </div>

                <div className="space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-2xl text-white">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-tighter">
                                {showResumePreview && resumeData ? "Resume Context" : "Personal Synthesis"}
                            </h3>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">
                                {showResumePreview && resumeData ? "Imported from Resume Builder" : 
                                 docType === "cover_letter" ? "Key Experience or Achievements" :
                                 docType === "sop" ? "Academic Background & Goals" :
                                 "Team Capabilities & Credentials"}
                            </p>
                        </div>
                        {hasProfileResume && !showResumePreview && (
                            <button
                                onClick={onAutoFetch}
                                className="ml-auto flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-black text-[8px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg group/fetch-btn"
                            >
                                <ArrowUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
                                {resumeName ? `Load "${resumeName}"` : "Fetch From Resume"}
                            </button>
                        )}
                    </div>

                    {showResumePreview && resumeData ? (
                        <div className="space-y-4">
                            <ResumePreview
                                resumeData={resumeData}
                                resumeName={resumeName || "Resume"}
                                onRemove={onRemoveResume}
                                onRefresh={onRefreshResume}
                            />
                            <textarea
                                value={userDetails}
                                onChange={(e) => setUserDetails(e.target.value)}
                                placeholder="Optional: Add additional notes, context, or specific points you want the AI to emphasize..."
                                className="w-full min-h-[64px] bg-white/3 border border-white/10 rounded-4xl p-5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none text-[12px] leading-relaxed font-medium shadow-inner"
                            />
                        </div>
                    ) : (
                        <textarea
                            value={userDetails}
                            onChange={(e) => setUserDetails(e.target.value)}
                            placeholder={
                                docType === "cover_letter" ? "Specify the achievements you want to highlight..." :
                                docType === "sop" ? "Describe your academic journey, research, and aspirations..." :
                                "Describe your team's expertise and past successes..."
                            }
                            className="w-full min-h-[98px] bg-white/3 border border-white/10 rounded-4xl p-6 text-white placeholder:text-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none text-[13px] leading-relaxed font-medium shadow-inner"
                        />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 italic">Articulate Tone</label>
                        <div className="relative group">
                            <select
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full h-11 bg-white/3 border border-white/10 rounded-xl px-5 appearance-none text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-inner"
                            >
                                {tones.map(t => <option key={t} value={t} className="bg-[#020617]">{t}</option>)}
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
                            <span className="relative z-10">Generate Document</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
