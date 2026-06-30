"use client"

import { useState, useEffect, useCallback } from "react"
import {
    ArrowLeft,
    Wand2,
    History,
    FileText,
    Star,
    Users,
    PenTool
} from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { toast } from "sonner"
import { Document, Packer, Paragraph, TextRun } from "docx"
import { saveAs } from "file-saver"
import { useSearchParams } from "next/navigation"
import { getWritingHistoryAction, getWritingItemAction, deleteWritingItemAction } from "@/app/actions/writingActions"
import { getLatestResumeAction } from "@/app/actions/resumeActions"
import { getUserProfileAction } from "@/app/actions/profileActions"
import type { ResumeData } from "@/types"
import { cleanDocumentForExport } from "@/lib/formatting/export-cleaner"

import WritingHub from "./WritingHub"
import WritingForm from "./WritingForm"
import WritingDisplay from "./WritingDisplay"
import WritingHistory from "./WritingHistory"

type DocType = "cover_letter" | "sop" | "lor" | "proposal"

interface DocumentItem {
    id: number
    docType: DocType
    context: string
    userDetails: string
    generatedContent: string
    createdAt: string
}

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

const docTypes = [
    {
        id: "cover_letter",
        title: "Cover Letter Generator",
        description: "Tailored cover letters that matching job descriptions perfectly.",
        icon: (props: any) => <FileText {...props} />,
        color: "from-blue-500 to-cyan-400"
    },
    {
        id: "sop",
        title: "Statement of Purpose",
        description: "Craft powerful SOPs for university or job applications.",
        icon: (props: any) => <Star {...props} />,
        color: "from-purple-500 to-pink-400"
    },
    {
        id: "lor",
        title: "Letter of Recommendation",
        description: "Create compelling recommendation letters for academic and professional opportunities.",
        icon: (props: any) => <Users {...props} />,
        color: "from-orange-500 to-amber-400"
    },
    {
        id: "proposal",
        title: "Proposal Generator",
        description: "Generate structured and persuasive business proposals.",
        icon: (props: any) => <PenTool {...props} />,
        color: "from-indigo-500 to-violet-400"
    }
]

const tones = ["Professional", "Formal", "Confident", "Technical", "Creative", "Friendly"]
const lengths = ["Short", "Medium", "Detailed"]

/**
 * Build a human-readable summary of resume section counts for the success toast.
 * Future-proof: new sections added to the ResumeData type are automatically
 * included in the JSON passed to the AI — only update this to show them in the toast.
 */
function getResumeSummary(data: ResumeData): string {
    const parts: string[] = []
    const expCount = data.experience?.length ?? 0
    const projCount = data.projects?.length ?? 0
    const eduCount = data.education?.length ?? 0
    const achievementCount = data.achievements?.length ?? 0
    const certCount = data.certifications?.length ?? 0
    const pubCount = data.publications?.length ?? 0
    const langCount = data.languages?.length ?? 0
    const skillsCount = data.skills?.reduce((total, s) => total + (s.skills?.length ?? 0), 0) ?? 0

    if (expCount > 0) parts.push(`${expCount} ${expCount === 1 ? "Experience" : "Experience Entries"}`)
    if (projCount > 0) parts.push(`${projCount} ${projCount === 1 ? "Project" : "Projects"}`)
    if (skillsCount > 0) parts.push(`${skillsCount} ${skillsCount === 1 ? "Skill" : "Skills"}`)
    if (achievementCount > 0) parts.push(`${achievementCount} ${achievementCount === 1 ? "Achievement" : "Achievements"}`)
    if (eduCount > 0) parts.push(`${eduCount} ${eduCount === 1 ? "Education" : "Education Entries"}`)
    if (certCount > 0) parts.push(`${certCount} ${certCount === 1 ? "Certification" : "Certifications"}`)
    if (pubCount > 0) parts.push(`${pubCount} ${pubCount === 1 ? "Publication" : "Publications"}`)
    if (langCount > 0) parts.push(`${langCount} ${langCount === 1 ? "Language" : "Languages"}`)

    if (parts.length === 0) return ""
    return `\n\n${parts.join(" • ")}`
}

const defaultLORData: LORFormData = {
    candidateName: "",
    recommenderName: "",
    recommenderDesignation: "",
    organization: "",
    relationship: "",
    duration: "",
    purpose: "",
    programApplyingTo: "",
    strengths: "",
    achievements: "",
    projects: "",
    skills: "",
    additionalInstructions: ""
}

export default function WritingClient() {
    const searchParams = useSearchParams()

    const linkedDocParam = searchParams.get("docType") as DocType | null
    const linkedIdParam = searchParams.get("id")

    const [selectedDoc, setSelectedDoc] = useState<DocType | null>(linkedDocParam)
    const [view, setView] = useState<"hub" | "studio">(linkedDocParam && linkedIdParam ? "studio" : "hub")
    const [tab, setTab] = useState<"generate" | "history">("generate")

    // Shared form state
    const [context, setContext] = useState("")
    const [userDetails, setUserDetails] = useState("")
    const [tone, setTone] = useState("Professional")
    const [length, setLength] = useState("Medium")

    // LOR-specific form state
    const [lorData, setLORData] = useState<LORFormData>(defaultLORData)
    const [lorTone, setLORTone] = useState("Academic")

    const [loading, setLoading] = useState(false)
    const [output, setOutput] = useState("")
    const [copied, setCopied] = useState(false)

    const [history, setHistory] = useState<DocumentItem[]>([])
    const [fetchingHistory, setFetchingHistory] = useState(false)
    const [initializedFromLink, setInitializedFromLink] = useState(false)

    /** Full structured Resume JSON from the Resume Builder */
    const [resumeData, setResumeData] = useState<ResumeData | null>(null)
    const [resumeName, setResumeName] = useState<string>("")
    /** Hidden structured Resume JSON string (passed to AI, NOT shown in UI) */
    const [resumeJSONInternal, setResumeJSONInternal] = useState<string>("")
    /** Flattened profile text fallback (if no Resume Builder resume exists) */
    const [profileFallbackText, setProfileFallbackText] = useState<string>("")
    /** Whether to show the Resume Preview panel */
    const [showResumePreview, setShowResumePreview] = useState(false)

    // Build a summary string for the toast showing section counts
    // Future-proof: new sections added to the resume type are automatically included
    // via JSON.stringify — only need to update this function to show them in the toast

    // Fetch both sources: Resume Builder (primary) and Mentorix Profile (fallback)
    const fetchUserData = useCallback(async () => {
        // Try Resume Builder first (richer structured data)
        try {
            const resumeResult = await getLatestResumeAction();
            if (resumeResult.success && resumeResult.data) {
                setResumeData(resumeResult.data)
                setResumeName(resumeResult.name || "Resume")
                return // Got structured data, no need for profile fallback
            }
        } catch (err) {
            console.error("Failed to fetch resume data:", err)
        }

        // Fallback: fetch Mentorix profile as flattened text
        try {
            const profileResult = await getUserProfileAction();
            if (profileResult.success && profileResult.data) {
                const p = profileResult.data;
                const parts = [];
                if (p.name) parts.push(`Name: ${p.name}`);
                if (p.currentRole) parts.push(`Current Role: ${p.currentRole}`);
                const skills = (p as any).skills;
                if (skills && skills.length > 0) parts.push(`Skills: ${skills.map((s: any) => s.skillName).join(", ")}`);
                const exp = (p as any).experience;
                if (exp && exp.length > 0) Object.values(exp).forEach((e: any) => parts.push(`Experience: ${e.role} at ${e.company} (${e.startDate}-${e.endDate})`));
                const edu = (p as any).education;
                if (edu && edu.length > 0) Object.values(edu).forEach((e: any) => parts.push(`Education: ${e.degree} from ${e.institution}`));
                setProfileFallbackText(parts.join("\n"));
            }
        } catch (err) {
            console.error("Failed to fetch profile fallback:", err)
        }
    }, [])

    useEffect(() => {
        fetchUserData()
    }, [fetchUserData])

    const handleAutoFetch = () => {
        if (resumeData) {
            // Store the structured JSON internally — hidden from the textarea
            const resumeJSON = JSON.stringify(resumeData, null, 2)
            setResumeJSONInternal(resumeJSON)
            setShowResumePreview(true)

            if (selectedDoc === "lor") {
                // For LOR: also fill the LOR form fields from resume
                const candidateName = resumeData.personalInfo?.fullName || ""
                const skills = resumeData.skills?.flatMap(s => s.skills).join(", ") || ""
                const achievements = resumeData.achievements?.map(a => a.title).join("; ") || ""
                setLORData(prev => ({ ...prev, candidateName: candidateName || prev.candidateName, skills: skills || prev.skills, strengths: achievements || prev.strengths }))
            }

            // Show summary toast with counts — don't fill the textarea
            const summary = getResumeSummary(resumeData)
            toast.success(`✓ Resume imported successfully${summary}`)
        } else if (profileFallbackText) {
            // Fallback: fill textarea with profile text (no structured data available)
            if (selectedDoc === "lor") {
                const lines = profileFallbackText.split("\n")
                const nameLine = lines.find(l => l.startsWith("Name:"))
                const skillsLine = lines.find(l => l.startsWith("Skills:"))
                setLORData(prev => ({
                    ...prev,
                    candidateName: nameLine?.replace("Name:", "").trim() || prev.candidateName,
                    skills: skillsLine?.replace("Skills:", "").trim() || prev.skills
                }))
            } else {
                setUserDetails(profileFallbackText)
            }
            toast.success("Personal details populated from your Profile!")
        } else {
            toast.error("No resume or profile data found. Complete your profile or build a resume first.")
        }
    }

    const handleRefreshResume = useCallback(async () => {
        setShowResumePreview(false)
        setResumeJSONInternal("")
        try {
            const resumeResult = await getLatestResumeAction()
            if (resumeResult.success && resumeResult.data) {
                setResumeData(resumeResult.data)
                setResumeName(resumeResult.name || "Resume")
                const resumeJSON = JSON.stringify(resumeResult.data, null, 2)
                setResumeJSONInternal(resumeJSON)
                setShowResumePreview(true)
                toast.success(`✓ Resume refreshed: ${resumeResult.name || "Resume"}`)
            } else {
                toast.error("Could not refresh resume. Build a resume first in the Resume Builder.")
            }
        } catch (err) {
            console.error("Failed to refresh resume:", err)
            toast.error("Failed to refresh resume. Please try again.")
        }
    }, [])

    const handleRemoveResume = () => {
        setResumeJSONInternal("")
        setShowResumePreview(false)
        toast.success("Resume removed. You can import again anytime.")
    }

    useEffect(() => {
        if (linkedIdParam && linkedDocParam && !initializedFromLink) {
            setLoading(true)
            getWritingItemAction(parseInt(linkedIdParam))
                .then(result => {
                    if (result.success && result.data) {
                        setContext(result.data.context || "")
                        setUserDetails(result.data.userDetails || "")
                        setOutput(result.data.generatedContent || "")

                        // If LOR, try to parse userDetails for LOR fields
                        if (result.data.docType === "lor" && result.data.userDetails) {
                            try {
                                const parsed = JSON.parse(result.data.userDetails)
                                setLORData({ ...defaultLORData, ...parsed })
                            } catch {
                                // fallback: keep default
                            }
                        }
                    } else if (result.error) {
                        toast.error(result.error)
                    }
                })
                .catch(err => {
                    console.error("Failed to fetch linked document details:", err)
                    toast.error("Failed to load historical document.")
                })
                .finally(() => {
                    setLoading(false)
                    setInitializedFromLink(true)
                })
        }
    }, [linkedIdParam, linkedDocParam, initializedFromLink])

    const fetchHistory = useCallback(async () => {
        if (!selectedDoc) return
        setFetchingHistory(true)
        try {
            const result = await getWritingHistoryAction(selectedDoc)
            if (result.success && result.data) {
                setHistory(result.data as unknown as DocumentItem[])
            } else {
                toast.error(result.error || "Failed to fetch history")
            }
        } catch (err) {
            console.error("Failed to fetch history:", err)
        } finally {
            setFetchingHistory(false)
        }
    }, [selectedDoc])

    useEffect(() => {
        if (tab === "history" && selectedDoc) {
            fetchHistory()
        }
    }, [tab, selectedDoc, fetchHistory])

    const handleGenerate = async () => {
        if (!selectedDoc) return

        if (selectedDoc === "lor") {
            if (!lorData.candidateName || !lorData.recommenderName || !lorData.organization) {
                toast.error("Please fill in all required LOR fields (Candidate, Recommender, Organization)")
                return
            }
        } else {
            if (!context) {
                toast.error("Please fill in Strategic Context first")
                return
            }
            if (!userDetails && !resumeJSONInternal) {
                toast.error("Please fill in Personal Synthesis or click Fetch from Resume")
                return
            }
        }

        setLoading(true)
        try {
            // Build the payload based on docType
            const payload: any = {
                docType: selectedDoc,
                tone: selectedDoc === "lor" ? lorTone : tone,
                length
            }

            // Always pass the hidden resume JSON (if available) alongside user-typed content
            if (resumeJSONInternal) {
                payload.resumeJSON = resumeJSONInternal
            }

            if (selectedDoc === "lor") {
                payload.context = `Letter of Recommendation for ${lorData.candidateName} applying to ${lorData.programApplyingTo || "N/A"}`
                // Include resume JSON alongside LOR form data for richer AI context
                const lorPayload: any = { ...lorData }
                if (resumeJSONInternal) {
                    lorPayload._resumeJSON = resumeJSONInternal
                }
                payload.userDetails = JSON.stringify(lorPayload)
            } else {
                payload.context = context
                payload.userDetails = userDetails || resumeJSONInternal || ""
                payload.isResumeJSON = !!resumeJSONInternal && (!userDetails || userDetails === resumeJSONInternal)
            }

            const response = await axios.post("/api/writing-studio", payload)
            setOutput(response.data.doc.generatedContent)
            toast.success("Document generated and saved to history!")
            if (tab === "history") fetchHistory()
        } catch (err: any) {
            console.error(err)
            const status = err.response?.status;
            let errorMessage = "Failed to generate document";

            if (status === 429) {
                errorMessage = "The AI is currently under high load (Too Many Requests). Please wait a few seconds and try again.";
            } else if (err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }

            toast.error(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (!output) return
        navigator.clipboard.writeText(cleanDocumentForExport(output))
        setCopied(true)
        toast.success("Copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadAsWord = async () => {
        if (!output) return

        const cleaned = cleanDocumentForExport(output)
        const lines = cleaned.split("\n")

        // Build paragraphs from cleaned text with heading/bullet detection
        const paragraphs: Paragraph[] = []
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const prevBlank = i === 0 || lines[i - 1].trim() === ""
            const nextBlank = i === lines.length - 1 || lines[i + 1].trim() === ""
            const trimmed = line.trim()

            if (!trimmed) continue

            const isHeading = trimmed.length <= 80 && prevBlank && nextBlank && !trimmed.endsWith(".")
            const isBullet = trimmed.startsWith("\u2022 ")

            if (isBullet) {
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: trimmed.replace(/^\u2022 /, ""),
                                size: 24
                            })
                        ],
                        bullet: { level: 0 },
                        spacing: { before: 80, after: 80 }
                    })
                )
            } else {
                paragraphs.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: trimmed,
                                bold: isHeading,
                                size: isHeading ? 28 : 24
                            })
                        ],
                        spacing: { before: isHeading ? 240 : 120, after: isHeading ? 120 : 120 }
                    })
                )
            }
        }

        const doc = new Document({
            sections: [{ properties: {}, children: paragraphs }]
        })

        const blob = await Packer.toBlob(doc)
        saveAs(blob, `${selectedDoc}_Output.docx`)
        toast.success("Downloading Word file...")
    }

    const downloadAsPdf = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const cleaned = cleanDocumentForExport(output)

        // Convert cleaned text to HTML with proper <ul> wrapping for bullet lists
        const lines = cleaned.split("\n")
        const htmlParts: string[] = []
        let inBulletList = false

        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) {
                if (inBulletList) {
                    htmlParts.push("</ul>")
                    inBulletList = false
                }
                htmlParts.push("<br />")
                continue
            }

            if (trimmed.startsWith("\u2022 ")) {
                if (!inBulletList) {
                    htmlParts.push("<ul>")
                    inBulletList = true
                }
                htmlParts.push(`<li>${trimmed.replace(/^\u2022 /, "")}</li>`)
                continue
            }

            if (inBulletList) {
                htmlParts.push("</ul>")
                inBulletList = false
            }

            // Detect likely headings (short standalone lines)
            if (trimmed.length <= 80 && !trimmed.endsWith(".")) {
                htmlParts.push(`<h3>${trimmed}</h3>`)
            } else {
                htmlParts.push(`<p>${trimmed}</p>`)
            }
        }

        if (inBulletList) {
            htmlParts.push("</ul>")
        }

        const htmlContent = htmlParts.join("\n")

        printWindow.document.write(`
            <html>
                <head>
                    <title>${selectedDoc}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
                        @page { margin: 0; }
                        body { 
                            font-family: 'Inter', -apple-system, sans-serif; 
                            padding: 60px; 
                            line-height: 1.7; 
                            color: #1e293b; 
                            max-width: 850px; 
                            margin: auto;
                            background: white;
                            position: relative;
                        }
                        h1, h2, h3, h4, h5, h6 { 
                            color: #2563eb; 
                            margin-top: 32px; 
                            margin-bottom: 12px; 
                            font-weight: 800; 
                            line-height: 1.2;
                        }
                        h1 { font-size: 2.4rem; border-bottom: 2px solid #eff6ff; padding-bottom: 12px; text-transform: uppercase; }
                        h2 { font-size: 1.8rem; }
                        h3 { font-size: 1.5rem; }
                        h4 { font-size: 1.25rem; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
                        hr { border: none; border-top: 2px solid #f1f5f9; margin: 30px 0; }
                        strong { color: #0f172a; font-weight: 700; }
                        ul { padding-left: 20px; list-style-type: none; }
                        li { margin-bottom: 10px; position: relative; padding-left: 20px; }
                        li:before { content: "\\2022"; position: absolute; left: 0; color: #3b82f6; font-weight: bold; }
                        .content { white-space: normal; }
                        /* Mentorix Watermark */
                        body::after {
                            content: "Mentorix";
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%) rotate(-35deg);
                            font-size: 120px;
                            font-weight: 900;
                            color: rgba(99, 102, 241, 0.06);
                            pointer-events: none;
                            z-index: 9999;
                            letter-spacing: 0.15em;
                            text-transform: uppercase;
                            white-space: nowrap;
                            font-family: 'Inter', sans-serif;
                        }
                        @media print {
                            body::after {
                                color: rgba(99, 102, 241, 0.08);
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="content">${htmlContent}</div>
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 700);
        toast.success("Generating High-Fidelity PDF...");
    }

    const downloadAsTxt = () => {
        if (!output) return;
        const cleanText = cleanDocumentForExport(output);
        const blob = new Blob([cleanText], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `${selectedDoc}_Output.txt`);
        toast.success("Downloading Plain Text...");
    }

    const handleDelete = async (id: number) => {
        try {
            const result = await deleteWritingItemAction(id)
            if (result.success) {
                toast.success("Document removed")
                fetchHistory()
            } else {
                toast.error(result.error || "Failed to delete")
            }
        } catch (err) {
            toast.error("Failed to delete")
        }
    }

    const getSelectedTypeTitle = () => {
        return docTypes.find(d => d.id === selectedDoc)?.title || "AI Writing Studio"
    }

    if (view === "hub") {
        return (
            <div className="min-h-screen bg-[#020617] text-white py-4 md:py-6 lg:py-8 px-8 md:px-16 lg:px-24 selection:bg-blue-500/30">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="space-y-4">
                        <Link href="/ai-tools" className="inline-flex items-center gap-2.5 text-slate-500 hover:text-white transition-all group font-bold text-[10px] uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full border border-white/5">
                            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Features</span>
                        </Link>
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-[0.9]">
                                AI Professional <br />
                                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-indigo-400 to-purple-500 tracking-tighter">Writing Studio</span>
                            </h1>
                            <p className="text-sm text-slate-500 max-w-lg font-medium leading-relaxed uppercase tracking-widest opacity-80">
                                Elevate your professional presence with intelligently synthesized documents tailored for maximum impact.
                            </p>
                        </div>
                    </div>
                    <WritingHub docTypes={docTypes} onSelect={(id) => { setSelectedDoc(id as DocType); setView("studio"); }} />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col">
            <div className="border-b border-white/5 bg-white/1 backdrop-blur-3xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto w-full px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => setView("hub")}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-black text-xs group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="space-y-0.5">
                            <h2 className="text-lg font-black uppercase tracking-tighter leading-none">{getSelectedTypeTitle()}</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em]">Studio Console</span>
                                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">Ready</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner scale-95 origin-right">
                        <button
                            onClick={() => setTab("generate")}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-[0.2em] ${tab === "generate" ? "bg-white text-black shadow-lg scale-[1.02]" : "text-slate-500 hover:text-white"}`}
                        >
                            <Wand2 className="w-4 h-4" />
                            Generate
                        </button>
                        <button
                            onClick={() => setTab("history")}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-[0.2em] ${tab === "history" ? "bg-white text-black shadow-lg scale-[1.02]" : "text-slate-500 hover:text-white"}`}
                        >
                            <History className="w-4 h-4" />
                            History
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full flex-1 p-8">
                {tab === "history" ? (
                    <WritingHistory
                        history={history}
                        fetching={fetchingHistory}
                        onDelete={handleDelete}
                        onOpen={(item) => {
                            setOutput(item.generatedContent)
                            setContext(item.context)
                            setUserDetails(item.userDetails)

                            // Restore LOR data if applicable
                            if (item.docType === "lor" && item.userDetails) {
                                try {
                                    const parsed = JSON.parse(item.userDetails)
                                    setLORData({ ...defaultLORData, ...parsed })
                                } catch {
                                    // fallback
                                }
                            }

                            setSelectedDoc(item.docType)
                            setTab("generate")
                        }}
                        title={getSelectedTypeTitle()}
                        onInitiate={() => setTab("generate")}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <WritingForm
                            docType={selectedDoc}
                            // Generic form props
                            context={context}
                            setContext={setContext}
                            userDetails={userDetails}
                            setUserDetails={setUserDetails}
                            tone={tone}
                            setTone={setTone}
                            length={length}
                            setLength={setLength}
                            // LOR form props
                            lorData={lorData}
                            setLORData={setLORData}
                            lorTone={lorTone}
                            setLORTone={setLORTone}
                            // Shared
                            loading={loading}
                            onGenerate={handleGenerate}
                            onAutoFetch={handleAutoFetch}
                            hasProfileResume={!!resumeData || !!profileFallbackText}
                            resumeName={resumeName || "Profile"}
                            tones={tones}
                            lengths={lengths}
                            // Resume Preview props
                            resumeData={resumeData}
                            showResumePreview={showResumePreview}
                            resumeJSONInternal={resumeJSONInternal}
                            onRemoveResume={handleRemoveResume}
                            onRefreshResume={handleRefreshResume}
                        />
                        <WritingDisplay
                            output={output}
                            setOutput={setOutput}
                            loading={loading}
                            copied={copied}
                            onCopy={copyToClipboard}
                            onDownloadWord={downloadAsWord}
                            onDownloadPdf={downloadAsPdf}
                            onDownloadTxt={downloadAsTxt}
                            onRegenerate={handleGenerate}
                            docType={selectedDoc || "cover_letter"}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
