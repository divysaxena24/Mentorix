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
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                </Link>

                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        <Sparkles className="w-3 h-3" />
                        AI Cover Letter Builder
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                        Professional Cover Letter Generator
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Create a tailored, high-impact cover letter in seconds. Paste the job description and your details to get started.
                    </p>
                </div>

                <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-sm self-start md:self-end mt-8">
                    <button
                        onClick={() => setView("generator")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === "generator"
                            ? "bg-white text-black shadow-lg"
                            : "text-zinc-400 hover:text-black hover:bg-white/50"
                            }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        GENERATOR
                    </button>
                    <button
                        onClick={() => setView("history")}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === "history"
                            ? "bg-white text-black shadow-lg"
                            : "text-zinc-400 hover:text-black hover:bg-white/50"
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
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="w-10 h-10 text-zinc-300 animate-spin mb-4" />
                                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Loading history...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-100">
                                <History className="w-12 h-12 text-zinc-200 mb-6" />
                                <h3 className="text-xl font-black text-gray-900 mb-2">No cover letters yet</h3>
                                <p className="text-zinc-500 max-w-xs text-center font-medium">Your generated cover letters will appear here once you create them.</p>
                                <button
                                    onClick={() => setView("generator")}
                                    className="mt-8 px-8 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-xl"
                                >
                                    START GENERATING
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            setCoverLetter(item.coverLetter)
                                            setJobDescription(item.jobDescription)
                                            setUserDetails(item.userDetails)
                                            setView("generator")
                                        }}
                                        className="group relative text-left bg-white border border-zinc-100 rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:border-zinc-200 transition-all duration-500 overflow-hidden cursor-pointer"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-50 blur-2xl -mr-12 -mt-12 rounded-full group-hover:bg-zinc-100 transition-colors" />

                                        <div className="relative z-10 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                                    <FileText className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-1 rounded-full">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <div
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-2 hover:bg-red-50 text-zinc-200 hover:text-red-500 rounded-xl transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </div>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="rounded-[2rem]">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete this letter?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently remove the cover letter from your history.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={(e) => handleDeleteHistory(e as any, item.id)}
                                                                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-xl font-black text-gray-900 line-clamp-2 mb-2 group-hover:text-zinc-600 transition-colors">
                                                    {item.jobDescription}
                                                </h4>
                                                <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                                                    {item.coverLetter}
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-zinc-50 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                    View Letter
                                                </span>
                                                <div className="w-8 h-8 rounded-full border border-zinc-100 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all">
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
                            <div className="bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/5 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <Briefcase className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-none mb-1">Job Description</h3>
                                        <p className="text-xs text-white/50">Paste the role requirements here</p>
                                    </div>
                                </div>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="e.g. We are looking for a Senior Frontend Developer with 5+ years of experience in React and Next.js..."
                                    className="w-full min-h-[200px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none text-sm leading-relaxed"
                                />

                                <div className="flex items-center gap-3 mt-8 mb-6">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-none mb-1">Your Details</h3>
                                        <p className="text-xs text-white/50">Mention skills, achievements, or experience</p>
                                    </div>
                                </div>
                                <textarea
                                    value={userDetails}
                                    onChange={(e) => setUserDetails(e.target.value)}
                                    placeholder="e.g. My name is Alex, I have built 10+ scalable web apps using React. Recently led a team of 4 to optimize performance by 40%..."
                                    className="w-full min-h-[200px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none text-sm leading-relaxed mb-6"
                                />

                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-xl group"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Crafting your letter...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            <span>Generate Cover Letter</span>
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
                                <div className="bg-zinc-50 rounded-[2.5rem] p-8 border border-zinc-200 h-full flex flex-col shadow-inner animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-white" />
                                            </div>
                                            <h3 className="text-lg font-bold text-zinc-900">Your Cover Letter</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={copyToClipboard}
                                                className="p-3 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors shadow-sm"
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-zinc-600" />}
                                            </button>
                                            <button
                                                onClick={downloadAsWord}
                                                className="flex items-center gap-2 px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors shadow-lg text-sm font-bold"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span>Download Word</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto bg-white rounded-2xl p-8 border border-zinc-200 shadow-sm">
                                        <div className="prose prose-sm max-w-none text-zinc-800 whitespace-pre-wrap leading-relaxed font-serif italic text-lg opacity-90">
                                            {coverLetter}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200 h-full flex flex-col items-center justify-center text-center p-12 order-first lg:order-last min-h-[400px]">
                                    <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                                        <FileText className="w-10 h-10 text-zinc-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900 mb-2">Ready to Generate</h3>
                                    <p className="text-zinc-500 max-w-xs">
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
