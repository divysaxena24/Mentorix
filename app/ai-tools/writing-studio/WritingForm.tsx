"use client"

import { FileSearch, User, ArrowUp, ChevronDown, Sparkles, Loader2 } from "lucide-react"

interface WritingFormProps {
    context: string;
    setContext: (val: string) => void;
    userDetails: string;
    setUserDetails: (val: string) => void;
    tone: string;
    setTone: (val: string) => void;
    length: string;
    setLength: (val: string) => void;
    loading: boolean;
    onGenerate: () => void;
    onAutoFetch: () => void;
    hasProfileResume: boolean;
    tones: string[];
    lengths: string[];
}

export default function WritingForm({
    context,
    setContext,
    userDetails,
    setUserDetails,
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
}: WritingFormProps) {
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
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Job Specs or Company Details</p>
                        </div>
                    </div>
                    <textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="Paste the job description or business context here..."
                        className="w-full min-h-[98px] bg-white/3 border border-white/10 rounded-4xl p-6 text-white placeholder:text-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none text-[13px] leading-relaxed font-medium shadow-inner"
                    />
                </div>

                <div className="space-y-5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 shadow-2xl text-white">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black uppercase tracking-tighter">Personal Synthesis</h3>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Key Experience or Achievements</p>
                        </div>
                        {hasProfileResume && (
                            <button
                                onClick={onAutoFetch}
                                className="ml-auto flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-black text-[8px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg group/fetch-btn"
                            >
                                <ArrowUp className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
                                Auto Fetch From Resume
                            </button>
                        )}
                    </div>
                    <textarea
                        value={userDetails}
                        onChange={(e) => setUserDetails(e.target.value)}
                        placeholder="Specify the achievements you want to highlight..."
                        className="w-full min-h-[98px] bg-white/3 border border-white/10 rounded-4xl p-6 text-white placeholder:text-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none text-[13px] leading-relaxed font-medium shadow-inner"
                    />
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
