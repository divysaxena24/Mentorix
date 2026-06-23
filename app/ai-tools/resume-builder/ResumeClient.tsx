"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    ArrowLeft,
    Download,
    Save,
    Clock,
    Loader2,
    Zap,
    Wand2,
    Target,
    Eye,
} from "lucide-react"
import Link from "next/link"
import axios from "axios"
import { toast } from "sonner"
import { ResumeData } from "@/types"
import { downloadResume } from "@/components/resume/ResumeTemplates"
import ResumePreview from "@/components/resume/ResumePreview"

import BuildFromScratch from "./BuildFromScratch"
import ImproveResume from "./ImproveResume"
import TailorForJob from "./TailorForJob"

type BuilderMode = "build" | "improve" | "tailor"

const INITIAL_DATA: ResumeData = {
    personalInfo: { fullName: "", email: "", phone: "", address: "", linkedin: "", github: "", leetcode: "", portfolio: "", summary: "" },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    honors: [],
    certifications: [],
    achievements: [],
    languages: [],
    publications: [],
    customSections: [],
    sectionOrder: [],
    template: "corporate",
}

const MODE_TABS: { id: BuilderMode; label: string; icon: any; gradient: string; desc: string }[] = [
    { id: "build", label: "Build from Scratch", icon: Zap, gradient: "from-blue-600 to-purple-600", desc: "Describe your background — AI generates a complete resume" },
    { id: "improve", label: "Improve Resume", icon: Wand2, gradient: "from-blue-600 to-cyan-600", desc: "Tell AI how to improve your current resume — no forms needed" },
    { id: "tailor", label: "Tailor for Job", icon: Target, gradient: "from-purple-600 to-pink-600", desc: "Paste a job description — AI tailors your resume automatically" },
]

export default function ResumeClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const resumeId = searchParams.get("id")

    const [mode, setMode] = useState<BuilderMode>("build")
    const [data, setData] = useState<ResumeData>(INITIAL_DATA)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(!!resumeId)

    useEffect(() => {
        if (resumeId) fetchResume(resumeId)
    }, [resumeId])

    const fetchResume = async (id: string) => {
        try {
            const res = await axios.get(`/api/resume-builder?id=${id}`)
            setData(res.data.resumeData)
        } catch { toast.error("Failed to load resume") }
        finally { setLoading(false) }
    }

    const handleResumeGenerated = (generated: ResumeData) => {
        setData(generated)
        // Scroll to preview to show result
        setTimeout(() => {
            document.getElementById("preview-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 300)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await axios.post("/api/resume-builder", {
                id: resumeId,
                resumeName: data.personalInfo.fullName || "Untitled Resume",
                resumeData: data,
            })
            toast.success("Resume saved!")
            if (!resumeId) router.push(`/ai-tools/resume-builder?id=${res.data.id}`)
        } catch { toast.error("Failed to save") }
        finally { setSaving(false) }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Background */}
            <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[150px] -mr-48 -mt-48 rounded-full pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] -ml-48 -mb-48 rounded-full pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/ai-tools" className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                            <ArrowLeft className="w-4 h-4 text-slate-400" />
                        </Link>
                        <div>
                            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[8px] font-black uppercase tracking-widest">
                                Resume Architect
                            </div>
                            <h1 className="text-lg font-black uppercase tracking-tight mt-0.5">
                                Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Builder</span>
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/history?tab=saved-resumes" className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-all">
                            <Clock className="w-3 h-3" /> History
                        </Link>
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50">
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {resumeId ? "Update" : "Save"}
                        </button>
                        <button onClick={() => downloadResume(data)} className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                            <Download className="w-3 h-3" /> PDF
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Mode Tabs */}
                <div className="flex gap-2 mb-6">
                    {MODE_TABS.map((tab) => {
                        const isActive = mode === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setMode(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isActive
                                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                                    : "bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                                    }`}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>

                {/* Mode description */}
                <div className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl mb-6 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${MODE_TABS.find(t => t.id === mode)?.gradient}`} />
                    <p className="text-[9px] text-slate-400 font-medium">{MODE_TABS.find(t => t.id === mode)?.desc}</p>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Prompt Input */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {mode === "build" && <BuildFromScratch onResumeGenerated={handleResumeGenerated} />}                        {mode === "improve" && <ImproveResume existingData={data} onResumeGenerated={handleResumeGenerated} />}
                {mode === "tailor" && <TailorForJob existingData={data} onResumeGenerated={handleResumeGenerated} />}
                    </div>

                    {/* Right: Live Preview */}
                    <div id="preview-panel" className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="sticky top-0">
                            <div className="flex items-center gap-2.5 mb-4">
                                <Eye className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Preview</span>
                                <div className="flex gap-1.5 ml-auto">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/10" />
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-br from-blue-600/5 to-purple-600/5 blur-3xl opacity-50" />
                                <ResumePreview data={data} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
