"use client"

import { useState, useEffect, useCallback } from "react"
import {
    ArrowLeft,
    Wand2,
    History
} from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { toast } from "sonner"
import { Document, Packer, Paragraph, TextRun } from "docx"
import { saveAs } from "file-saver"
import { useSearchParams } from "next/navigation"
import { getWritingHistoryAction, getWritingItemAction, deleteWritingItemAction } from "@/app/actions/writingActions"
import { getUserProfileAction } from "@/app/actions/profileActions"

import WritingHub from "./WritingHub"
import WritingForm from "./WritingForm"
import WritingDisplay from "./WritingDisplay"
import WritingHistory from "./WritingHistory"

type DocType = "cover_letter" | "sop" | "motivation_letter" | "proposal"

interface DocumentItem {
    id: number
    docType: DocType
    context: string
    userDetails: string
    generatedContent: string
    createdAt: string
}

const docTypes = [
    {
        id: "cover_letter",
        title: "Cover Letter Generator",
        description: "Tailored cover letters that matching job descriptions perfectly.",
        icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>,
        color: "from-blue-500 to-cyan-400"
    },
    {
        id: "sop",
        title: "Statement of Purpose",
        description: "Craft powerful SOPs for university or job applications.",
        icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>,
        color: "from-purple-500 to-pink-400"
    },
    {
        id: "motivation_letter",
        title: "Motivation Letter",
        description: "Express your passion and fit for roles with personalized letters.",
        icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>,
        color: "from-orange-500 to-amber-400"
    },
    {
        id: "proposal",
        title: "Proposal Generator",
        description: "Generate structured and persuasive business proposals.",
        icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>,
        color: "from-indigo-500 to-violet-400"
    }
]

const tones = ["Professional", "Formal", "Confident", "Technical", "Creative", "Friendly"]
const lengths = ["Short", "Medium", "Detailed"]

export default function WritingClient() {
    const searchParams = useSearchParams()

    const linkedDocParam = searchParams.get("docType") as DocType | null
    const linkedIdParam = searchParams.get("id")

    const [selectedDoc, setSelectedDoc] = useState<DocType | null>(linkedDocParam)
    const [view, setView] = useState<"hub" | "studio">(linkedDocParam && linkedIdParam ? "studio" : "hub")
    const [tab, setTab] = useState<"generate" | "history">("generate")

    const [context, setContext] = useState("")
    const [userDetails, setUserDetails] = useState("")
    const [tone, setTone] = useState("Professional")
    const [length, setLength] = useState("Medium")
    const [loading, setLoading] = useState(false)
    const [output, setOutput] = useState("")
    const [copied, setCopied] = useState(false)

    const [history, setHistory] = useState<DocumentItem[]>([])
    const [fetchingHistory, setFetchingHistory] = useState(false)
    const [initializedFromLink, setInitializedFromLink] = useState(false)

    const [profileResumeText, setProfileResumeText] = useState("")

    const fetchProfileData = useCallback(async () => {
        try {
            const result = await getUserProfileAction();
            if (result.success && result.data) {
                const p = result.data;
                const parts = [];
                if (p.name) parts.push(`Name: ${p.name}`);
                if (p.currentRole) parts.push(`Current Role: ${p.currentRole}`);

                const skills = (p as any).skills;
                if (skills && skills.length > 0) parts.push(`Skills: ${skills.map((s: any) => s.skillName).join(", ")}`);

                const exp = (p as any).experience;
                if (exp && exp.length > 0) Object.values(exp).forEach((e: any) => parts.push(`Experience: ${e.role} at ${e.company} (${e.startDate}-${e.endDate})`));

                const edu = (p as any).education;
                if (edu && edu.length > 0) Object.values(edu).forEach((e: any) => parts.push(`Education: ${e.degree} from ${e.institution}`));

                setProfileResumeText(parts.join("\n"));
            }
        } catch (err) {
            console.error("Failed to fetch profile resume:", err)
        }
    }, [])

    useEffect(() => {
        fetchProfileData()
    }, [fetchProfileData])

    const handleAutoFetch = () => {
        if (!profileResumeText) {
            toast.error("No profile resume found. Please analyze a resume first.")
            return
        }
        setUserDetails(profileResumeText)
        toast.success("Personal details populated from your Profile Resume!")
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
        if (!context || !userDetails || !selectedDoc) {
            toast.error("Please fill in all required fields")
            return
        }

        setLoading(true)
        try {
            const response = await axios.post("/api/writing-studio", {
                docType: selectedDoc,
                context,
                userDetails,
                tone,
                length
            })
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
        navigator.clipboard.writeText(output)
        setCopied(true)
        toast.success("Copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadAsWord = async () => {
        if (!output) return

        const paragraphs = output.split("\n\n").map(block => {
            const isHeader = block.startsWith("###");
            const cleanText = block.replace(/^###\s*/, "").replace(/\*\*/g, "");

            return new Paragraph({
                children: [
                    new TextRun({
                        text: cleanText,
                        bold: isHeader || block.includes("**"),
                        size: isHeader ? 28 : 24
                    })
                ],
                spacing: { before: 200, after: 200 }
            });
        });

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

        const htmlContent = output
            .replace(/^\s*# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^\s*## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^\s*### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^\s*#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^\s*##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^\s*###### (.*$)/gim, '<h6>$1</h6>')
            .replace(/^\s*---+\s*$/gim, '<hr />')
            .replace(/^\s*\* (.*$)/gim, '<li>$1</li>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\n/gim, '<br />');

        printWindow.document.write(`
            <html>
                <head>
                    <title>${selectedDoc}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
                        body { 
                            font-family: 'Inter', -apple-system, sans-serif; 
                            padding: 60px; 
                            line-height: 1.7; 
                            color: #1e293b; 
                            max-width: 850px; 
                            margin: auto;
                            background: white;
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
                        li { margin-bottom: 10px; list-style-type: none; position: relative; padding-left: 20px; }
                        li:before { content: "•"; position: absolute; left: 0; color: #3b82f6; font-weight: bold; }
                        .content { white-space: normal; }
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
        const cleanText = output.replace(/[#*]/g, '').replace(/\*\*/g, '');
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
                            setTab("generate")
                        }}
                        title={getSelectedTypeTitle()}
                        onInitiate={() => setTab("generate")}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <WritingForm
                            context={context}
                            setContext={setContext}
                            userDetails={userDetails}
                            setUserDetails={setUserDetails}
                            tone={tone}
                            setTone={setTone}
                            length={length}
                            setLength={setLength}
                            loading={loading}
                            onGenerate={handleGenerate}
                            onAutoFetch={handleAutoFetch}
                            hasProfileResume={!!profileResumeText}
                            tones={tones}
                            lengths={lengths}
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
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
