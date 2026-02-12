"use client"

import { useState } from "react"
import {
    FileText,
    Send,
    Sparkles,
    ArrowLeft,
    Loader2,
    Download,
    User,
    Briefcase,
    Copy,
    Check,
    History,
    Trash2
} from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { toast } from "sonner"
import { Document, Packer, Paragraph, TextRun } from "docx"
import { saveAs } from "file-saver"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useEffect, useCallback } from "react"
import { CoverLetterSkeleton } from "@/components/ToolSkeletons"
import { CoverLetterItem } from "@/types"

export default function CoverLetterPage() {
    const [jobDescription, setJobDescription] = useState("")
    const [userDetails, setUserDetails] = useState("")
    const [loading, setLoading] = useState(false)
    const [coverLetter, setCoverLetter] = useState("")
    const [copied, setCopied] = useState(false)

    const [view, setView] = useState<"generator" | "history">("generator")
    const [history, setHistory] = useState<CoverLetterItem[]>([])
    const [fetchingHistory, setFetchingHistory] = useState(false)

    const fetchHistory = useCallback(async () => {
        setFetchingHistory(true)
        try {
            const response = await axios.get("/api/cover-letter/history")
            setHistory(response.data)
        } catch (err) {
            console.error("Failed to fetch history:", err)
        } finally {
            setFetchingHistory(false)
        }
    }, [])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    const handleDeleteHistory = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation()
        try {
            await axios.delete(`/api/cover-letter/history?id=${id}`)
            toast.success("Cover letter deleted")
            fetchHistory()
        } catch (err) {
            toast.error("Failed to delete")
        }
    }

    const handleGenerate = async () => {
        if (!jobDescription || !userDetails) {
            toast.error("Please fill in both fields")
            return
        }

        setLoading(true)
        try {
            const response = await axios.post("/api/cover-letter", {
                jobDescription,
                userDetails
            })
            setCoverLetter(response.data.coverLetter)
            toast.success("Cover letter generated!")
            fetchHistory() // Refresh history
        } catch (err: any) {
            console.error(err)
            toast.error("Failed to generate cover letter")
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(coverLetter)
        setCopied(true)
        toast.success("Copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadAsWord = async () => {
        if (!coverLetter) return

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: coverLetter.split("\n").map(line => {
                        return new Paragraph({
                            children: [new TextRun(line)],
                            spacing: { after: 200 }
                        })
                    })
                }
            ]
        })

        const blob = await Packer.toBlob(doc)
        saveAs(blob, "Cover_Letter.docx")
        toast.success("Downloading Word file...")
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                </Link>

                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        <Sparkles className="w-3 h-3" />
                        AI Cover Letter Builder
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-4 uppercase">
                        Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Cover Letter Generator</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed max-w-2xl font-medium">
                        Create a tailored, high-impact cover letter in seconds. Paste the job description and your details to get started.
                    </p>
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl self-start md:self-end mt-8 w-fit">
                    <button
                        onClick={() => setView("generator")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${view === "generator"
                            ? "bg-white text-black shadow-lg"
                            : "text-slate-500 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        GENERATOR
                    </button>
                    <button
                        onClick={() => setView("history")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${view === "history"
                            ? "bg-white text-black shadow-lg"
                            : "text-slate-500 hover:text-white hover:bg-white/5"
                            }`}
                    >
                        <History className="w-3.5 h-3.5" />
                        HISTORY
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-20">
                {view === "history" ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {fetchingHistory ? (
                            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                <Loader2 className="w-10 h-10 text-slate-700 animate-spin mb-4" />
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading history...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 backdrop-blur-xl">
                                <History className="w-12 h-12 text-slate-700 mb-6" />
                                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">No cover letters yet</h3>
                                <p className="text-slate-500 max-w-xs text-center font-medium">Your generated cover letters will appear here once you create them.</p>
                                <button
                                    onClick={() => setView("generator")}
                                    className="mt-8 px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black hover:bg-slate-200 transition-all shadow-xl uppercase tracking-widest"
                                >
                                    START GENERATING
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group relative text-left bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-sm hover:shadow-[0_0_50px_rgba(37,99,235,0.1)] hover:border-white/20 transition-all duration-500 overflow-hidden backdrop-blur-xl"
                                    >
                                        {/* Clickable Overlay - Decoupled from Delete Button */}
                                        <div
                                            className="absolute inset-0 z-0 cursor-pointer"
                                            onClick={() => {
                                                setCoverLetter(item.coverLetter)
                                                setJobDescription(item.jobDescription)
                                                setUserDetails(item.userDetails)
                                                setView("generator")
                                            }}
                                        />
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl -mr-12 -mt-12 rounded-full group-hover:bg-blue-500/10 transition-colors" />

                                        <div className="relative z-10 space-y-6 pointer-events-none">
                                            <div className="flex items-center justify-between">
                                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                                    <FileText className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <div className="delete-btn-area pointer-events-auto relative z-20" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <div
                                                                    className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-xl transition-all"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </div>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="rounded-[2.5rem] bg-slate-900 border-white/10 text-white">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete this letter?</AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-slate-400">
                                                                        This action cannot be undone. This will permanently remove the cover letter from your history.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold"
                                                                    >
                                                                        Cancel
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteHistory(e as any, item.id);
                                                                        }}
                                                                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-lg font-black text-white line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors uppercase tracking-tight leading-tight">
                                                    {item.jobDescription}
                                                </h4>
                                                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed font-medium">
                                                    {item.coverLetter}
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    View Letter
                                                </span>
                                                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all">
                                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Side: Inputs */}
                        <div className="space-y-6">
                            <div className="bg-white/5 rounded-[3rem] p-10 shadow-2xl border border-white/10 backdrop-blur-3xl flex flex-col h-full relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl -mr-32 -mt-32 rounded-full" />
                                <div className="flex items-center gap-4 mb-6 relative z-10">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                                        <Briefcase className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight">Job Description</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Paste the role requirements here</p>
                                    </div>
                                </div>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="e.g. We are looking for a Senior Frontend Developer with 5+ years of experience in React and Next.js..."
                                    className="w-full min-h-[180px] bg-white/5 border border-white/10 rounded-[2rem] p-6 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-sm leading-relaxed relative z-10"
                                />

                                <div className="flex items-center gap-4 mt-10 mb-6 relative z-10">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight">Your Details</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mention skills, achievements, or experience</p>
                                    </div>
                                </div>
                                <textarea
                                    value={userDetails}
                                    onChange={(e) => setUserDetails(e.target.value)}
                                    placeholder="e.g. My name is Alex, I have built 10+ scalable web apps using React. Recently led a team of 4 to optimize performance by 40%..."
                                    className="w-full min-h-[180px] bg-white/5 border border-white/10 rounded-[2rem] p-6 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-sm leading-relaxed mb-8 relative z-10"
                                />

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="relative z-10 w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-200 disabled:opacity-50 transition-all shadow-2xl group mt-auto"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Crafting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            <span>Generate Letter</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Preview */}
                        <div className="h-full">
                            {loading ? (
                                <CoverLetterSkeleton />
                            ) : coverLetter ? (
                                <div className="bg-white/5 rounded-[3rem] p-10 border border-white/10 h-full flex flex-col shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-right-4 duration-500 relative overflow-hidden">
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-3xl -ml-32 -mb-32 rounded-full" />
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                                                <FileText className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Your Cover Letter</h3>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Polished & Professional</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={copyToClipboard}
                                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all shadow-xl text-white group"
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-slate-400 group-hover:text-white" />}
                                            </button>
                                            <button
                                                onClick={downloadAsWord}
                                                className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-xl hover:bg-slate-200 transition-all shadow-2xl text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span>Download Word</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto bg-white/5 rounded-3xl p-10 border border-white/5 shadow-inner relative z-10 custom-scrollbar">
                                        <div className="prose prose-invert prose-sm max-w-none text-slate-200 whitespace-pre-wrap leading-relaxed font-serif italic text-lg opacity-90 tracking-wide">
                                            {coverLetter}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 h-full flex flex-col items-center justify-center text-center p-12 order-first lg:order-last min-h-[500px] backdrop-blur-xl relative overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-500/5 opacity-50" />
                                    <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/10 relative z-10">
                                        <FileText className="w-12 h-12 text-slate-700" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight relative z-10">Ready to Generate</h3>
                                    <p className="text-slate-500 max-w-xs font-medium relative z-10 leading-relaxed">
                                        Your professional cover letter will appear here once you fill in the details and click generate.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
