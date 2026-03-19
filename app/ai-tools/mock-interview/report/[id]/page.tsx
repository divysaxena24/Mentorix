"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Award, Target, MessageSquare, Briefcase, Zap, ArrowLeft, ArrowRight, Loader2, Link as LinkIcon, Download } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Note: If you get a "jsPDF is not a constructor" error, try:
// import { jsPDF } from "jspdf"

export default function MockInterviewReport() {
    const params = useParams()
    const interviewId = params.id as string

    const [interview, setInterview] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch(`/api/mi-details/${interviewId}`)
                if (!res.ok) throw new Error("Failed to fetch")

                const data = await res.json()
                setInterview(data.interview)
                setQuestions(data.questions)
                setLoading(false)
            } catch (err) {
                console.error(err)
                setLoading(false)
            }
        }
        fetchReport()
    }, [interviewId])

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-12">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm text-center">Crunching the data... Generating comprehensive report.</p>
        </div>
    }

    if (!interview || !questions) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">Error loading report.</div>
    }

    // Calculate overall average score based on individual question scores
    const answeredQuestions = questions.filter(q => q.score !== null)
    const averageScore = answeredQuestions.length > 0
        ? Math.round(answeredQuestions.reduce((acc, q) => acc + q.score, 0) / answeredQuestions.length)
        : 0

    const handleExportPDF = () => {
        try {
            const doc = new jsPDF()

            // Headers
            doc.setFontSize(22)
            doc.setTextColor(40)
            doc.text("Mentorix AI Interview Report", 14, 22)

            doc.setFontSize(14)
            doc.setTextColor(100)
            doc.text(`Topic: ${interview.topic}`, 14, 32)
            doc.text(`Difficulty: ${interview.difficulty}`, 14, 40)
            doc.text(`Overall Score: ${averageScore}/10`, 14, 48)

            // Line separator
            doc.setLineWidth(0.5)
            doc.line(14, 55, 196, 55)

            // Question Table
            const tableData = questions.map((q, index) => [
                `Q${index + 1}: ${q.questionText}`,
                q.userTranscript || "Did not attempt",
                q.aiEvaluationText || "N/A",
                q.score !== null ? `${q.score}/10` : "N/A"
            ])

            if (tableData.length === 0) {
                doc.text("No detailed question data available for this session.", 14, 65)
            } else {
                autoTable(doc, {
                    startY: 60,
                    head: [["Question", "Your Answer", "AI Feedback", "Score"]],
                    body: tableData,
                    theme: "grid",
                    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
                    columnStyles: {
                        0: { cellWidth: 50 },
                        1: { cellWidth: 45 },
                        2: { cellWidth: 65 },
                        3: { cellWidth: 20, halign: "center" }
                    },
                    styles: { fontSize: 10, cellPadding: 5 }
                })
            }

            doc.save(`Interview_Report_${interview.topic.replace(/\s+/g, "_")}_${interviewId}.pdf`)
        } catch (error: any) {
            console.error("PDF Export failed:", error)
            alert("Failed to generate PDF: " + error.message)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 px-6 lg:px-12 py-12 relative overflow-hidden font-inter text-slate-200">
            {/* Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto auto relative z-10 space-y-12">
                {/* Header Navigation */}
                <div className="flex items-center justify-between">
                    <Link href="/ai-tools/mock-interview" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[9px] rounded-xl transition-all border border-white/5"
                    >
                        <Download className="w-3 h-3" /> Export PDF
                    </button>
                </div>

                {/* Score Summary Billboard */}
                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 p-8 lg:p-12 rounded-[3rem] relative overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.05)]">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/30 blur-[80px] rounded-full" />

                    <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                        {/* Huge Score Display */}
                        <div className="relative shrink-0 flex items-center justify-center w-48 h-48 rounded-full border-8 border-slate-800 bg-slate-900">
                            <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                                <circle cx="50%" cy="50%" r="45%" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                <circle
                                    cx="50%" cy="50%" r="45%" fill="none"
                                    stroke="url(#gradient)" strokeWidth="12"
                                    strokeDasharray="283"
                                    strokeDashoffset={283 - (283 * averageScore) / 10}
                                    strokeLinecap="round"
                                    className="drop-shadow-[0_0_15px_rgba(56,189,248,0.5)] transition-all duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#38bdf8" />
                                        <stop offset="100%" stopColor="#c084fc" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="text-center">
                                <span className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">{averageScore}<span className="text-2xl text-slate-600">/10</span></span>
                            </div>
                        </div>

                        {/* Interview Details */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-4">Completed successfully</div>
                            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight mb-4">{interview.topic}</h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300">
                                    <Target className="w-4 h-4 text-blue-400" /> Topic Match: High
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300">
                                    <Zap className="w-4 h-4 text-yellow-400" /> {interview.difficulty} Level
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300">
                                    <Briefcase className="w-4 h-4 text-purple-400" /> {interview.duration}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Question Breakdown Timeline */}
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Detailed Question Breakdown</h2>
                    <div className="space-y-8 pl-4 lg:pl-10 border-l border-white/10 relative">
                        {questions.map((q, i) => (
                            <div key={q.id} className="relative z-10 w-full">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-4 lg:-left-10 w-8 h-8 -translate-x-1/2 rounded-full border-4 border-slate-950 flex items-center justify-center shadow-lg
                                    ${q.score && q.score >= 8 ? 'bg-green-500 shadow-green-500/20' : q.score && q.score >= 5 ? 'bg-yellow-500 shadow-yellow-500/20' : 'bg-red-500 shadow-red-500/20'}
                                    `}>
                                    <span className="text-slate-950 font-black text-[10px]">{q.score || 0}</span>
                                </div>

                                <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 lg:p-8 hover:bg-slate-800 transition-colors">
                                    {/* Question */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-2">Question {i + 1}</h3>
                                        <p className="text-xl font-medium text-slate-200">{q.questionText}</p>
                                    </div>

                                    {/* User Answer */}
                                    <div className="bg-purple-500/5 rounded-2xl p-6 mb-6">
                                        <h4 className="flex items-center gap-2 text-xs font-black text-purple-400 uppercase tracking-widest mb-3">
                                            <MessageSquare className="w-4 h-4" /> Your Recorded Answer
                                        </h4>
                                        <p className="text-slate-300 italic">"{q.userTranscript || 'Did not attempt'}"</p>
                                    </div>

                                    {/* AI Evaluation */}
                                    <div className="bg-blue-500/5 rounded-2xl p-6">
                                        <h4 className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-widest mb-3">
                                            <Award className="w-4 h-4" /> AI Coach Feedback
                                        </h4>
                                        <p className="text-slate-300">{q.aiEvaluationText || 'Pending evaluation...'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final Call to Action */}
                <div className="text-center pt-8 pb-12">
                    <p className="text-slate-400 max-w-lg mx-auto mb-6 font-medium">Want to target your weak spots? Start a new mock interview focused purely on algorithms.</p>
                    <Link href="/ai-tools/mock-interview" className="inline-flex px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-lg shadow-blue-500/20 transition-all group">
                        Practice Again <ArrowRight className="inline ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
