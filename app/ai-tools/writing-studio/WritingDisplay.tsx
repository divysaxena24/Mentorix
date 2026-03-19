"use client"

import { useState } from 'react'
import { AlignLeft, Check, Copy, Download, FileText, RefreshCw, Wand2, Loader2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface WritingDisplayProps {
    output: string;
    setOutput: (val: string) => void;
    loading: boolean;
    copied: boolean;
    onCopy: () => void;
    onDownloadWord: () => void;
    onDownloadPdf: () => void;
    onDownloadTxt: () => void;
    onRegenerate: () => void;
}

export default function WritingDisplay({
    output,
    setOutput,
    loading,
    copied,
    onCopy,
    onDownloadWord,
    onDownloadPdf,
    onDownloadTxt,
    onRegenerate
}: WritingDisplayProps) {
    const [mode, setMode] = useState<"preview" | "edit">("preview");

    if (loading) {
        return (
            <div className="h-full min-h-[400px] max-h-[70vh] bg-white/1 border border-white/5 rounded-5xl p-12 flex flex-col gap-8 animate-pulse shadow-inner">
                <div className="w-1/4 h-8 bg-white/5 rounded-xl" />
                <div className="w-full h-4 bg-white/5 rounded-full" />
                <div className="w-full h-4 bg-white/5 rounded-full" />
                <div className="w-3/4 h-4 bg-white/5 rounded-full" />
                <div className="flex-1 w-full bg-white/2 rounded-4xl border border-white/5" />
            </div>
        );
    }

    if (!output) {
        return (
            <div className="h-full min-h-[600px] border-2 border-dashed border-white/5 rounded-5xl bg-white/1 flex flex-col items-center justify-center p-16 text-center group shadow-inner">
                <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-4xl flex items-center justify-center mb-8 shadow-3xl group-hover:scale-110 group-hover:border-blue-500/20 transition-all duration-1000 group-hover:rotate-6">
                    <Wand2 className="w-10 h-10 text-slate-800 group-hover:text-blue-500 transition-all duration-700" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Awaiting Synthesis</h3>
                <p className="text-slate-600 max-w-xs font-bold text-[11px] uppercase tracking-widest leading-loose opacity-60">Input coordinates to generate an opportunity-winning document.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white/2 border border-white/5 rounded-5xl p-7 md:p-9 shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-10 duration-1000 relative overflow-hidden h-fit max-h-[75vh] min-h-[600px]">
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 blur-[100px] -ml-40 -mb-40 rounded-full pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-500 border border-white/10 shadow-2xl font-bold">
                        <AlignLeft className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Integrated Preview</p>
                        <p className="text-[13px] font-black text-white uppercase tracking-tighter">Polished Strategy</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={onCopy}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-slate-500 hover:text-white"
                        title="Copy"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onDownloadTxt}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest"
                    >
                        TXT
                    </button>
                    <button
                        onClick={onDownloadWord}
                        className="flex items-center gap-2 px-4 py-3 bg-white text-black rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>DOCX</span>
                    </button>
                    <button
                        onClick={onDownloadPdf}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>PDF</span>
                    </button>
                </div>
            </div>

            <div className="mb-4 flex bg-white/5 p-1 rounded-xl w-fit self-end">
                <button
                    onClick={() => setMode("preview")}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === "preview" ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white"}`}
                >
                    Preview
                </button>
                <button
                    onClick={() => setMode("edit")}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === "edit" ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white"}`}
                >
                    Edit
                </button>
            </div>

            <div className="flex-1 bg-white/5 rounded-4xl border border-white/5 overflow-hidden flex flex-col shadow-inner relative group min-h-[500px]">
                {mode === "edit" ? (
                    <textarea
                        value={output}
                        onChange={(e) => setOutput(e.target.value)}
                        className="flex-1 w-full h-[500px] bg-slate-900/50 p-12 md:p-16 focus:outline-none text-slate-300 font-mono text-sm leading-relaxed resize-none selection:bg-blue-500/30 overflow-y-auto custom-scrollbar"
                    />
                ) : (
                    <div className="flex-1 p-12 md:p-16 overflow-y-auto custom-scrollbar">
                        <div className="prose prose-invert prose-blue max-w-none text-slate-300 font-serif italic text-lg leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {output}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                        Archived in History
                    </p>
                </div>
                <button
                    onClick={onRegenerate}
                    className="flex items-center gap-2.5 text-[8px] font-black text-slate-500 hover:text-white px-6 py-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 uppercase tracking-[0.3em] transition-all"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                </button>
            </div>
        </div>
    );
}
