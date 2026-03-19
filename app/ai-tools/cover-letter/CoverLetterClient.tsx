"use client"

import { useState, useEffect, useCallback } from "react"
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
import { motion, AnimatePresence } from "framer-motion"
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
import { CoverLetterSkeleton } from "@/components/ToolSkeletons"
import { CoverLetterItem } from "@/types"

export default function CoverLetterClient() {
    const [jobDescription, setJobDescription] = useState("")
    const [userDetails, setUserDetails] = useState("")
    const [loading, setLoading] = useState(false)
    const [coverLetter, setCoverLetter] = useState("")
    const [copied, setCopied] = useState(false)
    const [history, setHistory] = useState<CoverLetterItem[]>([])
    const [fetchingHistory, setFetchingHistory] = useState(false)
    const [view, setView] = useState<"generator" | "history">("generator")

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
        e.stopPropagation();
        try {
            await axios.delete(`/api/cover-letter/history?id=${id}`);
            toast.success("Cover letter deleted successfully");
            fetchHistory();
        } catch (err) {
            console.error("Failed to delete cover letter:", err);
            toast.error("Failed to delete cover letter");
        }
    };

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
            fetchHistory()
        } catch (err) {
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

    const downloadAsWord = () => {
        const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Cover Letter</title></head><body>";
        const postHtml = "</body></html>";
        const html = preHtml + coverLetter.replace(/\n/g, '<br>') + postHtml;

        const blob = new Blob(['\ufeff', html], {
            type: 'application/msword'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Cover_Letter.doc';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="max-w-7xl mx-auto px-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                        <Sparkles className="w-3 h-3 fill-current" /> AI Writing Suite
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                        Cover Letter <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Architect</span>
                    </h1>
                </div>

                <div className="flex gap-4 bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl self-start md:self-end">
                    <button
                        onClick={() => { setView("generator"); setCoverLetter(""); }}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${view === "generator" && !coverLetter ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"}`}
                    >
                        New Letter
                    </button>
                    <button
                        onClick={() => { setView("history"); setCoverLetter(""); }}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${view === "history" && !coverLetter ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {loading ? (
                <CoverLetterSkeleton />
            ) : coverLetter ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setCoverLetter("")}
                            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">Back to Generator</span>
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Copied" : "Copy Content"}
                            </button>
                            <button
                                onClick={downloadAsWord}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Download className="w-4 h-4" />
                                Download Word
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-12 md:p-16 shadow-3xl text-slate-300 leading-relaxed font-medium whitespace-pre-wrap selection:bg-blue-500/30">
                        {coverLetter}
                    </div>
                </motion.div>
            ) : view === "generator" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-2xl space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Briefcase className="w-3 h-3 text-blue-400" /> Job Description
                                </label>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the job description here..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 h-64 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium placeholder:text-white/10"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <User className="w-3 h-3 text-purple-400" /> Your Context
                                </label>
                                <textarea
                                    value={userDetails}
                                    onChange={(e) => setUserDetails(e.target.value)}
                                    placeholder="Paste your key experiences, unique skills, or profile link..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 h-64 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium placeholder:text-white/10"
                                />
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(37,99,235,0.2)] group"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                )}
                                {loading ? "Generating..." : "Forging Cover Letter"}
                            </button>
                        </div>
                    </motion.div>

                    <div className="hidden lg:flex flex-col justify-center space-y-12 pl-10 border-l border-white/5">
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Structured Persuasion</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Our AI analyzes the Job Description and maps your experiences specifically to the role's requirements, creating a balance of professional formality and unique personality.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                                <Send className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Rapid Deployment</h3>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Generated letters are formatted for immediate copy-pasting or Word download, ensuring you never miss a deadline.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {fetchingHistory ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-48 bg-white/5 animate-pulse rounded-[2rem]" />
                        ))
                    ) : history.length > 0 ? (
                        history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setCoverLetter(item.coverLetter)
                                    setJobDescription(item.jobDescription)
                                    setUserDetails(item.userDetails)
                                }}
                                className="group bg-white/5 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 rounded-[2rem] p-8 transition-all duration-500 cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between mb-6 relative z-10">
                                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                        <FileText className="w-5 h-5" />
                                    </div>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-slate-900 border-white/10 rounded-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-white font-black text-xl uppercase tracking-tighter">Delete Cover Letter?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-400 font-medium pt-2">
                                                    This action is permanent and cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="mt-6">
                                                <AlertDialogCancel className="rounded-xl font-bold border-white/10 hover:bg-white/5">Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={(e) => handleDeleteHistory(e, item.id)}
                                                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                                                >
                                                    Delete Letter
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <h3 className="text-white font-black text-lg line-clamp-1 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                        {item.jobDescription.slice(0, 50)}...
                                    </h3>
                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5">
                                            <History className="w-3 h-3" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center space-y-6 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                            <History className="w-12 h-12 text-slate-600 mx-auto" />
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">No History Found</h3>
                                <p className="text-slate-500 font-medium mt-2">Start generating to see your letters here</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
