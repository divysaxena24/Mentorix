"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import {
    Sparkles,
    Wand2,
    Minus,
    Plus,
    SpellCheck,
    Globe,
    Briefcase,
    Smile,
    GraduationCap,
    RefreshCw,
    Trash2,
    Target,
    Flag,
    Key,
    FileText,
    Search,
    Check,
    Loader2,
    BookOpen,
    Award,
    Lightbulb,
    PenLine,
    ChevronDown,
    Clock,
    Star,
    TrendingUp,
    Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import axios from "axios"
import { toast } from "sonner"

type DocType = "cover_letter" | "sop" | "lor" | "proposal"

interface AIAction {
    id: string
    label: string
    icon: React.ReactNode
    group: string
    keywords: string[]
}

interface AIActionsDropdownProps {
    docType: DocType
    content: string
    selectedText?: string
    onContentChange: (newContent: string) => void
}

const baseActions: AIAction[] = [
    // ✍️ Writing
    { id: "improve_writing", label: "Improve Writing", icon: <Wand2 className="w-4 h-4" />, group: "Writing", keywords: ["enhance", "polish", "refine"] },
    { id: "rewrite", label: "Rewrite", icon: <RefreshCw className="w-4 h-4" />, group: "Writing", keywords: ["rephrase", "redo"] },
    { id: "shorten", label: "Shorten", icon: <Minus className="w-4 h-4" />, group: "Writing", keywords: ["condense", "summarize", "brief"] },
    { id: "expand", label: "Expand", icon: <Plus className="w-4 h-4" />, group: "Writing", keywords: ["elaborate", "detail", "lengthen"] },
    { id: "grammar_check", label: "Grammar Check", icon: <SpellCheck className="w-4 h-4" />, group: "Writing", keywords: ["proofread", "spelling", "correct"] },
    { id: "improve_vocabulary", label: "Improve Vocabulary", icon: <BookOpen className="w-4 h-4" />, group: "Writing", keywords: ["thesaurus", "words", "synonyms"] },
    { id: "simplify_english", label: "Simplify English", icon: <Globe className="w-4 h-4" />, group: "Writing", keywords: ["simple", "basic", "easy"] },
    { id: "fix_formatting", label: "Fix Formatting", icon: <FileText className="w-4 h-4" />, group: "Writing", keywords: ["format", "clean", "spacing"] },

    // 💼 Professional Tone
    { id: "make_professional", label: "Make More Professional", icon: <Briefcase className="w-4 h-4" />, group: "Professional Tone", keywords: ["formal", "corporate", "business"] },
    { id: "make_friendly", label: "Make More Friendly", icon: <Smile className="w-4 h-4" />, group: "Professional Tone", keywords: ["warm", "approachable", "casual"] },
    { id: "make_academic", label: "Make Academic Tone", icon: <GraduationCap className="w-4 h-4" />, group: "Professional Tone", keywords: ["scholarly", "research", "university"] },
    { id: "make_conversational", label: "Make Conversational", icon: <PenLine className="w-4 h-4" />, group: "Professional Tone", keywords: ["chat", "natural", "dialogue"] },
    { id: "make_corporate", label: "Make Corporate Tone", icon: <Briefcase className="w-4 h-4" />, group: "Professional Tone", keywords: ["corporate", "business", "executive"] },
    { id: "make_persuasive", label: "Make More Persuasive", icon: <TrendingUp className="w-4 h-4" />, group: "Professional Tone", keywords: ["convincing", "impactful", "compelling"] },

    // 🎯 Optimization
    { id: "make_ats_friendly", label: "Optimize for ATS", icon: <FileText className="w-4 h-4" />, group: "Optimization", keywords: ["ats", "resume", "keyword", "parse"] },
    { id: "add_keywords", label: "Add Industry Keywords", icon: <Key className="w-4 h-4" />, group: "Optimization", keywords: ["seo", "terms", "buzzwords"] },
    { id: "improve_readability", label: "Improve Readability", icon: <Target className="w-4 h-4" />, group: "Optimization", keywords: ["readable", "clear", "flow"] },
    { id: "improve_clarity", label: "Improve Clarity", icon: <Lightbulb className="w-4 h-4" />, group: "Optimization", keywords: ["clear", "understandable"] },
    { id: "remove_repetition", label: "Remove Repetition", icon: <Trash2 className="w-4 h-4" />, group: "Optimization", keywords: ["duplicate", "redundant"] },

    // 🧩 Content Editing
    { id: "regenerate_paragraph", label: "Regenerate Selected Paragraph", icon: <RefreshCw className="w-4 h-4" />, group: "Content Editing", keywords: ["redo", "reselect"] },
    { id: "add_details", label: "Add More Details", icon: <Plus className="w-4 h-4" />, group: "Content Editing", keywords: ["expand", "elaborate"] },
    { id: "condense", label: "Condense Content", icon: <Minus className="w-4 h-4" />, group: "Content Editing", keywords: ["shrink", "compact", "tighten"] },
    { id: "strengthen_opening", label: "Strengthen Opening", icon: <Flag className="w-4 h-4" />, group: "Content Editing", keywords: ["introduction", "start", "hook"] },
    { id: "improve_conclusion", label: "Improve Conclusion", icon: <Target className="w-4 h-4" />, group: "Content Editing", keywords: ["ending", "closing", "final"] },
    { id: "improve_transitions", label: "Improve Transitions", icon: <RefreshCw className="w-4 h-4" />, group: "Content Editing", keywords: ["flow", "connect", "smooth"] },
]

const docSpecificActions: Record<DocType, AIAction[]> = {
    cover_letter: [
        { id: "optimize_for_jd", label: "Optimize for Job Description", icon: <Target className="w-4 h-4" />, group: "Document Specific", keywords: ["jd", "match", "role"] },
        { id: "tailor_for_company", label: "Tailor for Company", icon: <Briefcase className="w-4 h-4" />, group: "Document Specific", keywords: ["company", "customize"] },
        { id: "highlight_relevant_exp", label: "Highlight Relevant Experience", icon: <Star className="w-4 h-4" />, group: "Document Specific", keywords: ["experience", "relevant"] },
        { id: "emphasize_skills", label: "Emphasize Technical Skills", icon: <Wand2 className="w-4 h-4" />, group: "Document Specific", keywords: ["skills", "technical", "stack"] },
    ],
    sop: [
        { id: "tailor_for_university", label: "Tailor for University", icon: <GraduationCap className="w-4 h-4" />, group: "Document Specific", keywords: ["uni", "school", "admissions"] },
        { id: "strengthen_research", label: "Strengthen Research Interests", icon: <Lightbulb className="w-4 h-4" />, group: "Document Specific", keywords: ["research", "phd"] },
        { id: "improve_career_goals", label: "Improve Career Goals", icon: <Target className="w-4 h-4" />, group: "Document Specific", keywords: ["vision", "future", "aspirations"] },
    ],
    lor: [
        { id: "strengthen_recommendation", label: "Strengthen Recommendation", icon: <Award className="w-4 h-4" />, group: "Document Specific", keywords: ["endorse", "support", "recommend"] },
        { id: "highlight_leadership", label: "Highlight Leadership", icon: <Users className="w-4 h-4" />, group: "Document Specific", keywords: ["leadership", "lead"] },
        { id: "highlight_technical", label: "Highlight Technical Strengths", icon: <Wand2 className="w-4 h-4" />, group: "Document Specific", keywords: ["technical", "skills"] },
        { id: "highlight_research", label: "Highlight Research Experience", icon: <BookOpen className="w-4 h-4" />, group: "Document Specific", keywords: ["research", "lab"] },
    ],
    proposal: [
        { id: "improve_exec_summary", label: "Improve Executive Summary", icon: <FileText className="w-4 h-4" />, group: "Document Specific", keywords: ["summary", "abstract"] },
        { id: "strengthen_objectives", label: "Strengthen Objectives", icon: <Target className="w-4 h-4" />, group: "Document Specific", keywords: ["goals", "aims"] },
        { id: "improve_deliverables", label: "Improve Deliverables", icon: <Check className="w-4 h-4" />, group: "Document Specific", keywords: ["outcomes", "results"] },
        { id: "improve_timeline", label: "Improve Timeline", icon: <Clock className="w-4 h-4" />, group: "Document Specific", keywords: ["schedule", "milestones"] },
        { id: "improve_budget", label: "Improve Budget Justification", icon: <FileText className="w-4 h-4" />, group: "Document Specific", keywords: ["budget", "cost", "finance"] },
    ],
}

// Expose openDropdown function for parent to trigger via right-click
let globalSetIsOpen: ((open: boolean) => void) | null = null

export function openAIActionsDropdown() {
    globalSetIsOpen?.(true)
}

export default function AIActionsDropdown({
    docType,
    content,
    selectedText,
    onContentChange,
}: AIActionsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Expose setIsOpen for parent right-click handler
    useEffect(() => {
        globalSetIsOpen = setIsOpen
        return () => { globalSetIsOpen = null }
    }, [])

    const allActions = [...baseActions, ...(docSpecificActions[docType] || [])]

    const filteredActions = search
        ? allActions.filter(a =>
            a.label.toLowerCase().includes(search.toLowerCase()) ||
            a.keywords.some(k => k.includes(search.toLowerCase()))
        )
        : allActions

    const groupedActions = filteredActions.reduce<Record<string, AIAction[]>>((acc, action) => {
        if (!acc[action.group]) acc[action.group] = []
        acc[action.group].push(action)
        return acc
    }, {})

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                setSearch("")
            }
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [isOpen])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isOpen])

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsOpen(false)
                setSearch("")
            }
        }
        document.addEventListener("keydown", handler)
        return () => document.removeEventListener("keydown", handler)
    }, [isOpen])

    const executeAction = useCallback(async (action: AIAction) => {
        // All actions are AI-powered now — call the API
        setLoading(action.id)
        setIsOpen(false)

        try {
            const textToProcess = selectedText || content
            if (!textToProcess) {
                toast.error("No content to process")
                setLoading(null)
                setSearch("")
                return
            }

            const response = await axios.post("/api/writing-studio/ai-action", {
                action: action.id,
                text: textToProcess,
                docType,
                isPartialSelection: !!selectedText,
                fullContext: content,
            })

            if (response.data.success) {
                if (selectedText) {
                    const newContent = content.replace(selectedText, response.data.content)
                    onContentChange(newContent)
                } else {
                    onContentChange(response.data.content)
                }
                toast.success(response.data.message || `${action.label} applied!`)
            } else {
                toast.error(response.data.error || `Failed to ${action.label.toLowerCase()}`)
            }
        } catch (err: any) {
            const status = err.response?.status
            if (status === 429) {
                toast.error("The AI is under high load. Please wait a moment and try again.")
            } else {
                toast.error(err.response?.data?.error || `Failed to ${action.label.toLowerCase()}`)
            }
        } finally {
            setLoading(null)
            setSearch("")
        }
    }, [content, selectedText, docType, onContentChange])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            const items = dropdownRef.current?.querySelectorAll("[data-action-item]")
            if (items && items.length > 0) {
                (items[0] as HTMLElement).focus()
            }
        }
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setIsOpen(!isOpen)
                    setSearch("")
                }}
                disabled={!!loading}
                className="flex items-center gap-2.5 px-5 py-3 bg-white/10 border border-white/10 rounded-xl hover:bg-white/15 transition-all text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Sparkles className="w-4 h-4" />
                )}
                <span>{loading ? "Processing..." : "AI Actions"}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[380px] bg-[#0f172a] border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Search */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                        <Search className="w-4 h-4 text-slate-500 shrink-0" />
                        <input
                            ref={inputRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search AI actions..."
                            className="flex-1 bg-transparent text-white placeholder:text-slate-600 text-sm font-medium focus:outline-none"
                        />
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>⌘</span>K
                        </kbd>
                    </div>

                    {/* Actions */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {Object.entries(groupedActions).map(([group, actions]) => (
                            <div key={group}>
                                <div className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                    {group}
                                </div>
                                {actions.map((action) => (
                                    <button
                                        key={action.id}
                                        data-action-item
                                        onClick={() => executeAction(action)}
                                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/5 hover:text-white transition-all text-left group relative"
                                        onKeyDown={(e) => {
                                            if (e.key === "ArrowDown") {
                                                e.preventDefault()
                                                const next = (e.currentTarget as HTMLElement).nextElementSibling?.querySelector("[data-action-item]") as HTMLElement
                                                if (next) next.focus()
                                            }
                                            if (e.key === "ArrowUp") {
                                                e.preventDefault()
                                                const prev = (e.currentTarget as HTMLElement).previousElementSibling?.querySelector("[data-action-item]") as HTMLElement
                                                if (prev) prev.focus()
                                            }
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                executeAction(action)
                                            }
                                        }}
                                    >
                                        <span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all shrink-0">
                                            {action.icon}
                                        </span>
                                        <span className="flex-1 text-[11px] font-bold tracking-wide">
                                            {action.label}
                                        </span>
                                        {loading === action.id && (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
                                        )}
                                    </button>
                                ))}
                                <div className="h-px bg-white/5 mx-3 my-1 last:hidden" />
                            </div>
                        ))}
                        {Object.keys(groupedActions).length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-slate-500 text-sm font-medium">No AI actions found</p>
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                            {selectedText ? "Applied to selection" : "Applied to entire document"}
                        </span>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                            {allActions.length} AI actions
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
