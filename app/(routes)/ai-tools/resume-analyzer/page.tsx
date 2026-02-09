"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Send, CheckCircle2, AlertCircle, Sparkles, ArrowLeft, Loader2, Target, Zap, ShieldCheck, Briefcase, History, Trash2 } from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { toast } from "sonner"
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
import { ResumeAnalysisSkeleton } from "@/components/ToolSkeletons"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AnalysisResult, ResumeAnalysisItem } from "@/types"


export default function ResumeAnalyzerPage() {
    const [file, setFile] = useState<File | null>(null)
    const [useSpecificJD, setUseSpecificJD] = useState(true)
    const [jobDescription, setJobDescription] = useState("")
    const [fieldOfInterest, setFieldOfInterest] = useState("")
    const [targetRole, setTargetRole] = useState("")

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<AnalysisResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const [view, setView] = useState<"generator" | "history">("generator")
    const [history, setHistory] = useState<ResumeAnalysisItem[]>([])
    const [fetchingHistory, setFetchingHistory] = useState(false)

    const fetchHistory = useCallback(async () => {
        setFetchingHistory(true)
        try {
            const response = await axios.get("/api/resume-analyzer/history")
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
            await axios.delete(`/api/resume-analyzer/history?id=${id}`)
            toast.success("Analysis deleted")
            fetchHistory()
        } catch (err) {
            toast.error("Failed to delete")
        }
    }

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFile(acceptedFiles[0])
        setError(null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    })

    const handleAnalyze = async () => {
        if (!file) return

        setLoading(true)
        setError(null)
        setResult(null)

        const formData = new FormData()
        formData.append("resume", file)

        if (useSpecificJD) {
            formData.append("jobDescription", jobDescription)
        } else {
            formData.append("fieldOfInterest", fieldOfInterest)
            formData.append("targetRole", targetRole)
        }

        try {
            const response = await axios.post("/api/resume-analyzer", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setResult(response.data)
            fetchHistory() // Refresh history after analysis
        } catch (err: any) {
            console.error(err)
            setError(err.response?.data?.error || "Failed to analyze resume. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Dashboard</span>
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                            <Sparkles className="w-3 h-3" />
                            AI Powered Analysis
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
                            Resume ATS Optimizer
                        </h1>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            Upload your resume and paste the job description to get a deeper analysis of your compatibility and actionable improvement points.
                        </p>
                    </div>

                    <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-sm self-start md:self-end">
                        <button
                            onClick={() => setView("generator")}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === "generator"
                                ? "bg-white text-black shadow-lg"
                                : "text-zinc-400 hover:text-black hover:bg-white/50"
                                }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            ANALYZER
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
                                <h3 className="text-xl font-black text-gray-900 mb-2">No analysis yet</h3>
                                <p className="text-zinc-500 max-w-xs text-center font-medium">Your resume analysis reports will appear here once you generate them.</p>
                                <button
                                    onClick={() => setView("generator")}
                                    className="mt-8 px-8 py-3 bg-zinc-900 text-white rounded-xl text-xs font-black hover:bg-black transition-all shadow-xl"
                                >
                                    START NEW ANALYSIS
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            setResult(item.analysisData)
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
                                                                <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action cannot be undone. This will permanently remove the analysis report from your history.
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
                                                <h4 className="text-xl font-black text-gray-900 line-clamp-1 mb-2 group-hover:text-zinc-600 transition-colors">
                                                    {item.jobDescription || "General Analysis"}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 flex-1 bg-zinc-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${item.analysisData.score > 70 ? 'bg-green-500' :
                                                                item.analysisData.score > 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${item.analysisData.score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black text-zinc-900">{item.analysisData.score}%</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-zinc-50 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                    View Detailed Report
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
                ) : loading ? (
                    <ResumeAnalysisSkeleton />
                ) : !result ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Left Side: Upload */}
                        <div className="space-y-8">
                            <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-10 hover:border-zinc-400 transition-all group relative overflow-hidden">
                                <div {...getRootProps()} className="flex flex-col items-center justify-center cursor-pointer min-h-[300px]">
                                    <input {...getInputProps()} />
                                    <div className="w-20 h-20 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm border border-zinc-100">
                                        <Upload className="w-10 h-10 text-zinc-400 group-hover:text-black transition-colors" />
                                    </div>
                                    {file ? (
                                        <div className="text-center animate-in zoom-in-95 duration-300">
                                            <p className="text-lg font-bold text-gray-900 mb-1">{file.name}</p>
                                            <p className="text-sm text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Ready</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-gray-900 mb-2">
                                                {isDragActive ? "Drop your resume here" : "Upload your resume"}
                                            </p>
                                            <p className="text-sm text-zinc-400">PDF files only, up to 10MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                                    <Target className="w-5 h-5 text-zinc-900 mb-2" />
                                    <p className="text-xs font-bold text-gray-900 mb-1 uppercase tracking-wider leading-none">Precise</p>
                                    <p className="text-[10px] text-zinc-500 leading-tight">Advanced semantic JD matching technology.</p>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 font-bold uppercase tracking-wider leading-none">
                                    <Zap className="w-5 h-5 text-zinc-900 mb-2" />
                                    <p className="text-xs font-bold text-gray-900 mb-1">Instant</p>
                                    <p className="text-[10px] text-zinc-500 leading-tight text-normal">Complete analysis in under 15 seconds.</p>
                                </div>
                                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 font-bold uppercase tracking-wider leading-none">
                                    <ShieldCheck className="w-5 h-5 text-zinc-900 mb-2" />
                                    <p className="text-xs font-bold text-gray-900 mb-1">Secure</p>
                                    <p className="text-[10px] text-zinc-500 leading-tight">Your data is processed and never stored.</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Inputs */}
                        <div className="bg-zinc-900 rounded-3xl p-8 shadow-2xl flex flex-col h-full border border-white/5">
                            {/* Mode Selection Tabs */}
                            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 mb-8">
                                <button
                                    onClick={() => setUseSpecificJD(true)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${useSpecificJD
                                        ? "bg-white text-black shadow-lg"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Targeted Analysis
                                </button>
                                <button
                                    onClick={() => setUseSpecificJD(false)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${!useSpecificJD
                                        ? "bg-white text-black shadow-lg"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <Briefcase className="w-3.5 h-3.5" />
                                    Career Benchmarking
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                    {useSpecificJD ? <FileText className="w-5 h-5 text-white" /> : <Briefcase className="w-5 h-5 text-white" />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-none mb-1">
                                        {useSpecificJD ? "Job Description Matching" : "Industry Benchmark"}
                                    </h3>
                                    <p className="text-xs text-white/50">
                                        {useSpecificJD ? "Paste a target role for specific compatibility" : "Compare your profile against a field"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-4">
                                {useSpecificJD ? (
                                    <textarea
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        placeholder="Paste the target role description here to get a specific ATS match score..."
                                        className="flex-1 min-h-[200px] bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none mb-4 text-sm leading-relaxed"
                                    />
                                ) : (
                                    <div className="space-y-4 mb-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-white/60">Field of Interest</Label>
                                            <Input
                                                value={fieldOfInterest}
                                                onChange={(e) => setFieldOfInterest(e.target.value)}
                                                placeholder="e.g. Backend Development, Data Science..."
                                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-white/60">Target Company/Role Type</Label>
                                            <Input
                                                value={targetRole}
                                                onChange={(e) => setTargetRole(e.target.value)}
                                                placeholder="e.g. FAANG, Early-stage Startup, Product MNC..."
                                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !file}
                                className="w-full py-4 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl group mt-4"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Analyzing Profile...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        <span>Generate ATS Report</span>
                                    </>
                                )}
                            </button>
                            {error && <p className="mt-4 text-red-400 text-sm text-center font-medium animate-pulse">{error}</p>}
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-700">
                        {/* Results View */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Score Card */}
                            <div className="lg:col-span-1 bg-zinc-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl -mr-32 -mt-32 rounded-full" />
                                <div className="relative z-10">
                                    <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em] mb-8">ATS Match Score</p>
                                    <div className="flex items-center justify-center mb-10">
                                        <div className="relative">
                                            <svg className="w-48 h-48 transform -rotate-90">
                                                <circle
                                                    cx="96"
                                                    cy="96"
                                                    r="88"
                                                    stroke="currentColor"
                                                    strokeWidth="12"
                                                    fill="transparent"
                                                    className="text-white/5"
                                                />
                                                <circle
                                                    cx="96"
                                                    cy="96"
                                                    r="88"
                                                    stroke="currentColor"
                                                    strokeWidth="12"
                                                    fill="transparent"
                                                    strokeDasharray={552.92}
                                                    strokeDashoffset={552.92 * (1 - result.score / 100)}
                                                    className={`${result.score > 70 ? 'text-green-400' : result.score > 40 ? 'text-yellow-400' : 'text-red-400'} transition-all duration-1000 ease-out`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-6xl font-black">{result.score}</span>
                                                <span className="text-sm font-bold opacity-30">% Match</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-lg leading-relaxed text-zinc-300 font-medium">
                                        {result.summary}
                                    </p>
                                    <button
                                        onClick={() => setResult(null)}
                                        className="mt-10 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-sm font-bold transition-all"
                                    >
                                        Analyze Another Resume
                                    </button>
                                </div>
                            </div>

                            {/* Analysis Details */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white rounded-[2.5rem] p-10 border border-zinc-100 shadow-sm">
                                    <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                        Actionable Improvements
                                        <div className="h-1 flex-1 bg-zinc-50 rounded-full" />
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {result.improvementPoints.map((point, idx) => (
                                            <div key={idx} className="flex gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-colors">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-sm text-gray-700 leading-relaxed font-medium">{point}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Strengths */}
                                    <div className="bg-zinc-50 rounded-[2.5rem] p-10 border border-zinc-100">
                                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            Key Strengths
                                        </h3>
                                        <ul className="space-y-4">
                                            {result.strengths.map((s, i) => (
                                                <li key={i} className="flex gap-3 text-sm text-gray-600 font-medium leading-tight p-3 bg-white rounded-xl border border-zinc-100 ring-4 ring-green-500/5">
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Missing Keywords */}
                                    <div className="bg-zinc-50 rounded-[2.5rem] p-10 border border-zinc-100">
                                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                            Keywords to Add
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {result.missingKeywords.map((k, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white border border-red-100 text-red-600 rounded-lg text-xs font-bold tracking-tight">
                                                    {k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
