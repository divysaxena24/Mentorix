"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, Send, ArrowUp, ShieldCheck, Briefcase, History, Trash2, Target, Zap, ArrowLeft, Loader2, Globe } from "lucide-react"
import { motion } from "framer-motion"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AnalysisResult, ResumeAnalysisItem } from "@/types"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import ResultsDisplay from "./ResultsDisplay"

export default function ResumeAnalyzerClient() {
    const [file, setFile] = useState<File | null>(null)
    const [useSpecificJD, setUseSpecificJD] = useState(true)
    const [jobDescription, setJobDescription] = useState("")
    const [fieldOfInterest, setFieldOfInterest] = useState("")
    const [targetRole, setTargetRole] = useState("")
    const [inputMode, setInputMode] = useState<"url" | "text">("url")
    const [jobUrl, setJobUrl] = useState("")
    const [isExtracting, setIsExtracting] = useState(false)

    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<AnalysisResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [profileResumeText, setProfileResumeText] = useState<string | null>(null)
    const [profileResumeName, setProfileResumeName] = useState<string | null>(null)
    const [useProfileResume, setUseProfileResume] = useState(false)

    const [view, setView] = useState<"generator" | "history">("generator")
    const [history, setHistory] = useState<ResumeAnalysisItem[]>([])
    const [fetchingHistory, setFetchingHistory] = useState(false)
    const searchParams = useSearchParams()
    const selectedId = searchParams.get("id")

    // Sync URL ID with selection
    useEffect(() => {
        if (selectedId && history.length > 0) {
            const found = history.find(h => String(h.id) === selectedId)
            if (found) {
                const analysisDataValue = typeof (found as any).analysisData === 'string'
                    ? JSON.parse((found as any).analysisData)
                    : (found as any).analysisData;
                setResult(analysisDataValue)
                setView("history")
            }
        }
    }, [selectedId, history])

    const fetchProfile = useCallback(async () => {
        try {
            const res = await axios.get("/api/profile")
            if (res.data) {
                setProfileResumeText(res.data.resumeText)
                setProfileResumeName(res.data.resumeName)
            }
        } catch (err) {
            console.error("Failed to fetch profile resume:", err)
        }
    }, [])

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
        fetchProfile()
    }, [fetchHistory, fetchProfile])

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
        setUseProfileResume(false)
        setError(null)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    })

    const handleAnalyze = async () => {
        if (!file && !useProfileResume) {
            toast.error("Please upload a resume or select profile resume")
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)

        let finalJD = jobDescription

        if (useSpecificJD && inputMode === "url") {
            if (!jobUrl) {
                toast.error("Please provide a Job URL")
                setLoading(false)
                return
            }
            setIsExtracting(true)
            try {
                const extractRes = await axios.post("/api/assistant/extract", { url: jobUrl })
                const extractedData = extractRes.data
                finalJD = `
Job Title: ${extractedData.jobTitle}
Company: ${extractedData.companyName}
Requirements: ${extractedData.requirements?.join(", ")}
Platform: ${extractedData.platform}
                `
                setJobDescription(finalJD)
                toast.success("Job details extracted automatically!")
            } catch (err: unknown) {
                toast.error("Automatic extraction failed. Please try pasting the JD manually.")
                setIsExtracting(false)
                setLoading(false)
                return
            } finally {
                setIsExtracting(false)
            }
        }

        const formData = new FormData()
        if (useProfileResume && profileResumeText) {
            formData.append("resumeText", profileResumeText)
            formData.append("resumeName", profileResumeName || "Profile Resume")
        } else if (file) {
            formData.append("resume", file)
        }

        if (useSpecificJD) {
            formData.append("jobDescription", finalJD)
        } else {
            formData.append("fieldOfInterest", fieldOfInterest)
            formData.append("targetRole", targetRole)
        }

        try {
            const response = await axios.post("/api/resume-analyzer", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setResult(response.data)
            fetchHistory()
        } catch (err: unknown) {
            console.error(err)
            const status = (err as any).response?.status;
            let errorMessage = "Failed to analyze resume. Please try again.";

            if (status === 429) {
                errorMessage = "The AI is currently under high load (Too Many Requests). Please wait a few seconds and try again.";
            } else if (status === 413) {
                errorMessage = "The file or message is too large for the AI to process. Please try a smaller one.";
            } else if ((err as any).response?.data?.error) {
                errorMessage = (err as any).response.data.error;
            }

            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const downloadAnalysisAsPDF = async () => {
        if (!result) return

        const doc = new jsPDF()
        const primaryColor = result.score > 70 ? "#22c55e" : result.score > 40 ? "#eab308" : "#ef4444"

        doc.setFontSize(22)
        doc.setTextColor(0, 0, 0)
        doc.text("Resume ATS Analysis Report", 105, 20, { align: "center" })

        doc.setFontSize(14)
        doc.setTextColor(100, 100, 100)
        doc.text(`Overall Match Score: `, 20, 40)
        doc.setTextColor(primaryColor)
        doc.setFont("helvetica", "bold")
        doc.text(`${result.score}%`, 70, 40)
        doc.setFont("helvetica", "normal")

        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text("Executive Summary", 20, 55)
        doc.setFontSize(10)
        doc.setTextColor(80, 80, 80)
        const summaryLines = doc.splitTextToSize(result.summary, 170)
        doc.text(summaryLines, 20, 65)

        let currentY = 65 + (summaryLines.length * 5) + 10

        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text("Score Breakdown", 20, currentY)
        currentY += 10
        autoTable(doc, {
            startY: currentY,
            head: [['Category', 'Score']],
            body: [
                ['Skills Match', `${result.scoreBreakdown.skills}%`],
                ['Projects', `${result.scoreBreakdown.projects}%`],
                ['Experience', `${result.scoreBreakdown.experience}%`],
                ['ATS Optimization', `${result.scoreBreakdown.ats}%`],
                ['Impact & Metrics', `${result.scoreBreakdown.impact}%`],
                ['Industry Fit', `${result.scoreBreakdown.industryFit}%`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [0, 0, 0] },
            margin: { left: 20, right: 20 }
        })
        currentY = (doc as any).lastAutoTable.finalY + 15

        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text("Critical Gaps", 20, currentY)
        currentY += 10
        autoTable(doc, {
            startY: currentY,
            head: [['Critical Gap']],
            body: result.criticalGaps.map(g => [g]),
            theme: 'striped',
            headStyles: { fillColor: [220, 38, 38] },
            margin: { left: 20, right: 20 }
        })
        currentY = (doc as any).lastAutoTable.finalY + 15

        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text("Key Strengths", 20, currentY)
        currentY += 10
        autoTable(doc, {
            startY: currentY,
            head: [['Strength']],
            body: result.strengths.map(s => [s]),
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] },
            margin: { left: 20, right: 20 }
        })

        currentY = (doc as any).lastAutoTable.finalY + 15

        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text("Actionable Improvements", 20, currentY)
        currentY += 10
        autoTable(doc, {
            startY: currentY,
            head: [['Actionable Advice']],
            body: result.improvementPoints.map(p => [p]),
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] },
            margin: { left: 20, right: 20 }
        })

        currentY = (doc as any).lastAutoTable.finalY + 15

        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text("Detailed Section Analysis", 20, currentY)
        currentY += 10
        autoTable(doc, {
            startY: currentY,
            head: [['Section', 'Feedback']],
            body: Object.entries(result.sectionwiseAnalysis).map(([section, feedback]) => [
                section.charAt(0).toUpperCase() + section.slice(1),
                feedback
            ]),
            theme: 'grid',
            headStyles: { fillColor: [100, 100, 100] },
            margin: { left: 20, right: 20 }
        })
        currentY = (doc as any).lastAutoTable.finalY + 15

        if (result.improvementPlan) {
            doc.setFontSize(16)
            doc.setTextColor(0, 0, 0)
            doc.text("Strategic Growth Blueprint", 20, currentY)
            currentY += 10

            autoTable(doc, {
                startY: currentY,
                head: [['Category', 'Recommendations']],
                body: [
                    ['Target Skills', result.improvementPlan.additionalSkills.join(", ")],
                    ['Build Next (Project Ideas)', result.improvementPlan.newProjectIdeas.join("\n\n")],
                    ['Enhance Current Projects', result.improvementPlan.projectEnhancements.join("\n\n")]
                ],
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                margin: { left: 20, right: 20 },
                styles: { fontSize: 9, cellPadding: 5 }
            })
            currentY = (doc as any).lastAutoTable.finalY + 15
        }

        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.text("Keywords to Add", 20, currentY)
        currentY += 10
        doc.setFontSize(11)
        doc.setTextColor(239, 68, 68)
        const keywordLines = doc.splitTextToSize(result.missingKeywords.join(", "), 170)
        doc.text(keywordLines, 20, currentY)

        const pageCount = (doc as any).internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text(`Generated by Mentorix AI • Page ${i} of ${pageCount}`, 105, 285, { align: "center" })
        }

        doc.save(`Resume_Analysis_${new Date().toISOString().split('T')[0]}.pdf`)
        toast.success("Downloading PDF report...")
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <Link href="/ai-tools" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Features</span>
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                            <Zap className="w-3 h-3" />
                            AI Powered Analysis
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-4 uppercase">
                            Job Readiness <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500">Analyzer</span>
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl font-medium">
                            Upload your resume and paste the job description to get a deeper analysis of your compatibility and actionable improvement points.
                        </p>
                    </div>

                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl self-start md:self-end">
                        <button
                            onClick={() => setView("generator")}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === "generator"
                                ? "bg-white text-black shadow-lg"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            ANALYZER
                        </button>
                        <button
                            onClick={() => setView("history")}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${view === "history"
                                ? "bg-white text-black shadow-lg"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
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
                            <div className="flex flex-col items-center justify-center py-24 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 backdrop-blur-xl">
                                <History className="w-12 h-12 text-slate-700 mb-6" />
                                <h3 className="text-xl font-black text-white mb-2">No analysis yet</h3>
                                <p className="text-slate-500 max-w-xs text-center font-medium">Your resume analysis reports will appear here once you generate them.</p>
                                <button
                                    onClick={() => setView("generator")}
                                    className="mt-8 px-8 py-3 bg-white text-black rounded-xl text-xs font-black hover:bg-slate-200 transition-all shadow-xl"
                                >
                                    START NEW ANALYSIS
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {history.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group relative text-left bg-white/5 border border-white/10 rounded-4xl p-8 shadow-sm hover:shadow-2xl hover:border-white/20 transition-all duration-500 overflow-hidden backdrop-blur-xl"
                                    >
                                        <div
                                            className="absolute inset-0 z-0 cursor-pointer"
                                            onClick={() => {
                                                setResult(item.analysisData)
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
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
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
                                                            <AlertDialogContent className="rounded-4xl bg-slate-900 border-white/10 text-white">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-slate-400">
                                                                        This action cannot be undone. This will permanently remove the analysis report from your history.
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
                                                                            handleDeleteHistory(e as unknown as React.MouseEvent, item.id);
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
                                                <h4 className="text-xl font-black text-white line-clamp-1 mb-2 group-hover:text-blue-400 transition-colors uppercase">
                                                    {item.jobDescription || "Standard Profile Analysis"}
                                                </h4>
                                                {item.resumeName && (
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[200px]">
                                                            Source: {item.resumeName}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ${item.analysisData.score > 70 ? 'bg-green-500' :
                                                                item.analysisData.score > 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${item.analysisData.score}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-black text-white">{item.analysisData.score}%</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    View Detailed Report
                                                </span>
                                                <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
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
                            <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-[2.5rem] p-10 hover:border-blue-500/50 transition-all group relative overflow-hidden backdrop-blur-xl shadow-2xl">
                                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div {...getRootProps()} className="relative z-10 flex flex-col items-center justify-center cursor-pointer min-h-[300px]">
                                    <input {...getInputProps()} />
                                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 shadow-lg border border-white/10 ${useProfileResume ? 'bg-blue-600 scale-110' : 'bg-white/10 group-hover:scale-110 group-hover:bg-blue-600'}`}>
                                        {useProfileResume ? (
                                            <ShieldCheck className="w-10 h-10 text-white" />
                                        ) : (
                                            <Upload className="w-10 h-10 text-slate-400 group-hover:text-white transition-colors" />
                                        )}
                                    </div>
                                    {useProfileResume ? (
                                        <div className="text-center animate-in zoom-in-95 duration-300">
                                            <p className="text-lg font-black text-white mb-1 uppercase tracking-tight">Using Profile Resume</p>
                                            <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">{profileResumeName || "READY FOR ANALYSIS"}</p>
                                        </div>
                                    ) : file ? (
                                        <div className="text-center animate-in zoom-in-95 duration-300">
                                            <p className="text-lg font-black text-white mb-1 uppercase tracking-tight">{file.name}</p>
                                            <p className="text-sm text-slate-500 font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF READY</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-lg font-black text-white mb-2 uppercase tracking-tight">
                                                {isDragActive ? "Drop your resume here" : "Upload your resume"}
                                            </p>
                                            <p className="text-sm text-slate-500 font-medium">PDF files only, up to 10MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {profileResumeText && (
                                <button
                                    onClick={() => {
                                        setUseProfileResume(true)
                                        setFile(null)
                                        toast.success("Using your analyzed Profile Resume")
                                    }}
                                    className={`w-full py-5 rounded-full border transition-all flex items-center justify-center gap-4 font-black text-xs uppercase tracking-[0.3em] relative overflow-hidden group/profile-btn ${useProfileResume
                                        ? "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-500/30 -translate-y-1"
                                        : "bg-white border-white text-slate-900 hover:bg-slate-50 hover:shadow-xl hover:shadow-black/5"
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full group-hover/profile-btn:translate-x-full transition-transform duration-1000" />
                                    <ArrowUp className={`w-4 h-4 ${useProfileResume ? 'text-white' : 'text-slate-900'} group-hover/profile-btn:-translate-y-1 transition-transform`} />
                                    <div className="flex flex-col items-start gap-0">
                                        <span className="leading-tight">{useProfileResume ? "Profile Resume Selected" : "Use Profile Resume"}</span>
                                        {profileResumeName && (
                                            <span className={`text-[7px] font-bold tracking-widest leading-tight ${useProfileResume ? 'text-blue-100' : 'text-slate-600'}`}>
                                                {profileResumeName}
                                            </span>
                                        )}
                                    </div>
                                    {useProfileResume && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-4">
                                            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                                        </motion.div>
                                    )}
                                </button>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl transition-all hover:bg-white/10">
                                    <Target className="w-6 h-6 text-blue-400 mb-3" />
                                    <p className="text-xs font-black text-white mb-1 uppercase tracking-wider leading-none">Precise</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Advanced semantic JD matching technology.</p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl transition-all hover:bg-white/10">
                                    <Zap className="w-6 h-6 text-yellow-400 mb-3" />
                                    <p className="text-xs font-black text-white mb-1 uppercase tracking-wider leading-none">Instant</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Complete analysis in under 15 seconds.</p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl transition-all hover:bg-white/10">
                                    <ShieldCheck className="w-6 h-6 text-green-400 mb-3" />
                                    <p className="text-xs font-black text-white mb-1 uppercase tracking-wider leading-none">Secure</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Your data is processed and never stored.</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Inputs */}
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl flex flex-col h-full border border-white/10 relative overflow-hidden group/card">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 rounded-full group-hover/card:bg-blue-500/20 transition-all duration-700" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 blur-3xl -ml-16 -mb-16 rounded-full group-hover/card:bg-purple-500/10 transition-all duration-700" />

                            <div className="relative z-10 flex p-1.5 bg-white/5 rounded-3xl border border-white/10 mb-8 backdrop-blur-md">
                                <button
                                    onClick={() => setUseSpecificJD(true)}
                                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${useSpecificJD
                                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                        : "text-slate-500 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <FileText className={`w-4 h-4 ${useSpecificJD ? 'text-black' : 'text-slate-500 opacity-50'}`} />
                                    Targeted Analysis
                                </button>
                                <button
                                    onClick={() => setUseSpecificJD(false)}
                                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${!useSpecificJD
                                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                        : "text-slate-500 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <Briefcase className={`w-4 h-4 ${!useSpecificJD ? 'text-black' : 'text-slate-500 opacity-50'}`} />
                                    Career Benchmarking
                                </button>
                            </div>

                            <div className="relative z-10 flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-white/10 rounded-[1.25rem] flex items-center justify-center shadow-lg border border-white/10 group-hover/card:scale-105 transition-transform duration-500">
                                    {useSpecificJD ? (inputMode === "url" ? <Globe className="w-6 h-6 text-white" /> : <FileText className="w-6 h-6 text-white" />) : <Briefcase className="w-6 h-6 text-white" />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white leading-none mb-1.5 uppercase tracking-tight">
                                        {useSpecificJD ? (inputMode === "url" ? "Job URL Analysis" : "Job Description Matching") : "Industry Benchmark"}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em]">
                                        {useSpecificJD ? (inputMode === "url" ? "Enter a link for automated extraction" : "Paste a target role for specific compatibility") : "Compare your profile against a field"}
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 flex-1 flex flex-col gap-4">
                                {useSpecificJD ? (
                                    <>
                                        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 mb-2 backdrop-blur-md">
                                            <button
                                                onClick={() => setInputMode("url")}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${inputMode === "url"
                                                    ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                <Globe className={`w-3.5 h-3.5 ${inputMode === "url" ? 'text-white' : 'text-slate-500'}`} />
                                                Job URL
                                            </button>
                                            <button
                                                onClick={() => setInputMode("text")}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${inputMode === "text"
                                                    ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                <FileText className={`w-3.5 h-3.5 ${inputMode === "text" ? 'text-white' : 'text-slate-500'}`} />
                                                Job Description
                                            </button>
                                        </div>

                                        {inputMode === "url" ? (
                                            <div className="space-y-4">
                                                <Input
                                                    value={jobUrl}
                                                    onChange={(e) => setJobUrl(e.target.value)}
                                                    placeholder="Paste Unstop, Internshala, Naukri or LinkedIn URL..."
                                                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-20 rounded-2xl px-6 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium backdrop-blur-sm text-lg"
                                                />
                                            </div>
                                        ) : (
                                            <textarea
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                                placeholder="Paste the target role description here to get a specific ATS match score..."
                                                className="flex-1 min-h-[200px] bg-white/5 border border-white/10 rounded-3xl p-6 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all resize-none mb-0 text-sm font-medium leading-relaxed backdrop-blur-sm"
                                            />
                                        )}
                                    </>
                                ) : (
                                    <div className="space-y-6 mb-4">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Field of Interest</Label>
                                            <Input
                                                value={fieldOfInterest}
                                                onChange={(e) => setFieldOfInterest(e.target.value)}
                                                placeholder="e.g. Backend Development, Data Science..."
                                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-14 rounded-2xl px-6 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium backdrop-blur-sm"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Company/Role Type</Label>
                                            <Input
                                                value={targetRole}
                                                onChange={(e) => setTargetRole(e.target.value)}
                                                placeholder="e.g. FAANG, Early-stage Startup, Product MNC..."
                                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-14 rounded-2xl px-6 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium backdrop-blur-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading || (!file && !useProfileResume)}
                                className="relative z-10 w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl group/btn overflow-hidden mt-6"
                            >
                                <div className="absolute inset-0 bg-linear-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                                {loading || isExtracting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{isExtracting ? "Extracting Job Data..." : "Analyzing Profile..."}</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        <span>Generate Job Readiness Report</span>
                                    </>
                                )}
                            </button>
                            {error && <p className="relative z-10 mt-6 text-red-400 text-[10px] font-black uppercase tracking-widest text-center animate-pulse bg-red-400/5 py-3 rounded-xl border border-red-400/10 mb-0">{error}</p>}
                        </div>
                    </div>
                ) : (
                    <ResultsDisplay
                        result={result}
                        onReset={() => setResult(null)}
                        onDownload={downloadAnalysisAsPDF}
                    />
                )}
            </div>
        </div >
    );
}
