"use client"

import { useState, useMemo, useEffect } from "react"
import {
    ChevronDown,
    ChevronRight,
    Copy,
    RefreshCw,
    X,
    User,
    FileText,
    GraduationCap,
    Briefcase,
    FolderGit2,
    Wrench,
    Trophy,
    Award,
    Globe,
    BookOpen,
    Users,
    Heart,
    Star,
    Zap,
    Layers,
    ExternalLink,
    Check,
    Eye,
    EyeOff
} from "lucide-react"
import { toast } from "sonner"
import type { ResumeData, Skill, Project, Experience, Education, Achievement, Certification, Language, Publication, CustomSection } from "@/types"

// ── Section configuration ──────────────────────────────────────────────
interface SectionDef {
    key: string
    label: string
    icon: React.ReactNode
    /** Keys on ResumeData that are handled by this section */
    dataKeys: string[]
    /** Emoji fallback for unknown sections */
    emoji?: string
}

/** Known sections with their display config */
const KNOWN_SECTIONS: SectionDef[] = [
    { key: "personalInfo", label: "Personal Information", icon: <User className="w-4 h-4" />, dataKeys: ["personalInfo"] },
    { key: "summary", label: "Professional Summary", icon: <FileText className="w-4 h-4" />, dataKeys: ["summary"] },
    { key: "education", label: "Education", icon: <GraduationCap className="w-4 h-4" />, dataKeys: ["education"] },
    { key: "experience", label: "Experience", icon: <Briefcase className="w-4 h-4" />, dataKeys: ["experience"] },
    { key: "projects", label: "Projects", icon: <FolderGit2 className="w-4 h-4" />, dataKeys: ["projects"] },
    { key: "skills", label: "Technical Skills", icon: <Wrench className="w-4 h-4" />, dataKeys: ["skills"] },
    { key: "achievements", label: "Achievements", icon: <Trophy className="w-4 h-4" />, dataKeys: ["achievements"] },
    { key: "certifications", label: "Certifications", icon: <Award className="w-4 h-4" />, dataKeys: ["certifications"] },
    { key: "languages", label: "Languages", icon: <Globe className="w-4 h-4" />, dataKeys: ["languages"] },
    { key: "publications", label: "Publications", icon: <BookOpen className="w-4 h-4" />, dataKeys: ["publications"] },
    { key: "leadership", label: "Leadership", icon: <Users className="w-4 h-4" />, dataKeys: ["leadership"] },
    { key: "volunteer", label: "Volunteer Work", icon: <Heart className="w-4 h-4" />, dataKeys: ["volunteer"] },
    { key: "awards", label: "Awards & Honors", icon: <Star className="w-4 h-4" />, dataKeys: ["awards"] },
    { key: "interests", label: "Interests", icon: <Zap className="w-4 h-4" />, dataKeys: ["interests"] },
    { key: "customSections", label: "Custom Sections", icon: <Layers className="w-4 h-4" />, dataKeys: ["customSections"] },
]

/** Keys on ResumeData that should be skipped (metadata, not displayable sections) */
const SKIP_KEYS = new Set([
    "personalInfo", "education", "experience", "projects", "skills",
    "achievements", "certifications", "languages", "publications",
    "customSections", "sectionOrder", "template", "honors",
])

// ── Helpers ────────────────────────────────────────────────────────────

/** Count items in a section value (array length, or 1 for objects) */
function countItems(value: unknown): number {
    if (Array.isArray(value)) return value.length
    if (typeof value === "object" && value !== null) return 1
    return 0
}

/** Check if a section has any meaningful data */
function sectionHasData(data: ResumeData, section: SectionDef): boolean {
    for (const key of section.dataKeys) {
        const value = (data as any)[key]
        if (value === undefined || value === null) continue
        if (typeof value === "string" && value.trim()) return true
        if (Array.isArray(value) && value.length > 0) return true
        if (typeof value === "object" && !Array.isArray(value)) {
            // Check if object has any non-empty values
            const obj = value as Record<string, unknown>
            return Object.values(obj).some(v => v !== undefined && v !== null && v !== "")
        }
    }
    return false
}

/** Find unknown (future-proof) keys on the ResumeData that aren't in known sections */
function findUnknownSections(data: ResumeData): string[] {
    const unknown: string[] = []
    for (const key of Object.keys(data)) {
        if (SKIP_KEYS.has(key)) continue
        // Check if this key is already handled by any known section
        const isHandled = KNOWN_SECTIONS.some(s => s.dataKeys.includes(key))
        if (!isHandled) {
            const value = (data as any)[key]
            if (value !== undefined && countItems(value) > 0) {
                unknown.push(key)
            }
        }
    }
    return unknown
}

// ── Sub-renderers ──────────────────────────────────────────────────────

function renderPersonalInfo(data: ResumeData) {
    const p = data.personalInfo
    if (!p) return null
    const fields: { label: string; value: string | undefined; href?: string }[] = [
        { label: "Name", value: p.fullName },
        { label: "Email", value: p.email, href: `mailto:${p.email}` },
        { label: "Phone", value: p.phone, href: p.phone ? `tel:${p.phone}` : undefined },
        { label: "Address", value: p.address },
        { label: "LinkedIn", value: p.linkedin, href: p.linkedin },
        { label: "GitHub", value: p.github, href: p.github },
        { label: "Portfolio", value: p.portfolio, href: p.portfolio },
        { label: "Website", value: p.leetcode, href: p.leetcode },
    ]
    const nonEmpty = fields.filter(f => f.value?.trim())
    if (nonEmpty.length === 0) return null

    return (
        <div className="space-y-2">
            {nonEmpty.map(f => (
                <div key={f.label} className="flex items-start gap-2 text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider min-w-[80px] shrink-0">{f.label}</span>
                    {f.href ? (
                        <a href={f.href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 truncate max-w-[400px]">
                            {f.value}
                        </a>
                    ) : (
                        <span className="text-white/80">{f.value}</span>
                    )}
                </div>
            ))}
        </div>
    )
}

function renderSummary(data: ResumeData) {
    const summary = data.personalInfo?.summary
    if (!summary?.trim()) return null
    return (
        <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{summary}</p>
    )
}

function renderEducation(edu: Education[]) {
    if (!edu || edu.length === 0) return null
    return (
        <div className="space-y-4">
            {edu.map((e, i) => (
                <div key={i} className="border-l-2 border-blue-500/30 pl-4 py-1 space-y-1">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-white">{e.degree}</p>
                            <p className="text-xs text-blue-400 font-medium">{e.institution}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[10px] text-slate-500 font-bold">{e.startDate} – {e.endDate || "Present"}</p>
                            {e.cgpa && <p className="text-[10px] text-emerald-400 font-bold">CGPA: {e.cgpa}</p>}
                        </div>
                    </div>
                    {e.location && <p className="text-[10px] text-slate-600">{e.location}</p>}
                    {e.description && <p className="text-[11px] text-white/70 leading-relaxed">{e.description}</p>}
                </div>
            ))}
        </div>
    )
}

function renderExperience(exp: Experience[]) {
    if (!exp || exp.length === 0) return null
    return (
        <div className="space-y-4">
            {exp.map((e, i) => (
                <div key={i} className="border-l-2 border-emerald-500/30 pl-4 py-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-white">{e.role}</p>
                            <p className="text-xs text-emerald-400 font-medium">{e.company}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-[10px] text-slate-500 font-bold">{e.startDate} – {e.endDate || "Present"}</p>
                            {e.location && <p className="text-[10px] text-slate-600">{e.location}</p>}
                        </div>
                    </div>
                    {e.description && <p className="text-[11px] text-white/70 leading-relaxed">{e.description}</p>}
                </div>
            ))}
        </div>
    )
}

function renderProjects(proj: Project[]) {
    if (!proj || proj.length === 0) return null
    return (
        <div className="space-y-4">
            {proj.map((p, i) => (
                <div key={i} className="border-l-2 border-purple-500/30 pl-4 py-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-bold text-white">{p.title}</p>
                        {(p.link) && (
                            <a href={p.link} target="_blank" rel="noopener noreferrer" className="shrink-0 text-slate-500 hover:text-blue-400 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                    {p.technologies && p.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {p.technologies.map(t => (
                                <span key={t} className="text-[9px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">{t}</span>
                            ))}
                        </div>
                    )}
                    {p.description && <p className="text-[11px] text-white/70 leading-relaxed">{p.description}</p>}
                </div>
            ))}
        </div>
    )
}

function renderSkills(skills: Skill[]) {
    if (!skills || skills.length === 0) return null
    return (
        <div className="space-y-3">
            {skills.map((cat, i) => (
                cat.skills && cat.skills.length > 0 && (
                    <div key={i}>
                        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">{cat.category}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {cat.skills.map(s => (
                                <span key={s} className="text-[10px] font-medium text-white bg-white/5 px-2.5 py-1 rounded-full border border-white/10">{s}</span>
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    )
}

function renderAchievements(achievements: Achievement[]) {
    if (!achievements || achievements.length === 0) return null
    return (
        <div className="space-y-2.5">
            {achievements.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-white">{a.title}</p>
                        {a.date && <p className="text-[10px] text-slate-500">{a.date}</p>}
                        {a.description && <p className="text-[11px] text-white/70 mt-0.5">{a.description}</p>}
                    </div>
                </div>
            ))}
        </div>
    )
}

function renderCertifications(certs: Certification[]) {
    if (!certs || certs.length === 0) return null
    return (
        <div className="space-y-3">
            {certs.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                    <Award className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-white">{c.title}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                            {c.issuer && <span>{c.issuer}</span>}
                            {c.date && <span>{c.date}</span>}
                        </div>
                        {c.link && (
                            <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 underline underline-offset-2 inline-flex items-center gap-1 mt-0.5">
                                View Credential <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                        )}
                        {c.description && <p className="text-[11px] text-white/70 mt-0.5">{c.description}</p>}
                    </div>
                </div>
            ))}
        </div>
    )
}

function renderLanguages(langs: Language[]) {
    if (!langs || langs.length === 0) return null
    return (
        <div className="flex flex-wrap gap-2">
            {langs.map((l, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/3 border border-white/10 rounded-lg px-3 py-2">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <div>
                        <p className="text-xs font-medium text-white">{l.name}</p>
                        {l.proficiency && <p className="text-[9px] text-slate-500">{l.proficiency}</p>}
                    </div>
                </div>
            ))}
        </div>
    )
}

function renderPublications(pubs: Publication[]) {
    if (!pubs || pubs.length === 0) return null
    return (
        <div className="space-y-3">
            {pubs.map((p, i) => (
                <div key={i} className="border-l-2 border-rose-500/30 pl-4 py-1 space-y-1">
                    <p className="text-sm font-medium text-white">{p.title}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        {p.publisher && <span>{p.publisher}</span>}
                        {p.date && <span>{p.date}</span>}
                    </div>
                    {p.link && (
                        <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 underline underline-offset-2 inline-flex items-center gap-1">
                            View Publication <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                    )}
                    {p.description && <p className="text-[11px] text-white/70">{p.description}</p>}
                </div>
            ))}
        </div>
    )
}

function renderCustomSections(custom: CustomSection[]) {
    if (!custom || custom.length === 0) return null
    return (
        <div className="space-y-4">
            {custom.map((section, i) => (
                <div key={section.id || i}>
                    <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">{section.title}</p>
                    <div className="space-y-2.5">
                        {section.items.map((item, j) => (
                            <div key={j} className="border-l-2 border-white/10 pl-3 py-0.5 space-y-0.5">
                                {item.title && <p className="text-xs font-medium text-white">{item.title}</p>}
                                {item.subtitle && <p className="text-[10px] text-slate-400">{item.subtitle}</p>}
                                {(item.date || item.location) && (
                                    <p className="text-[10px] text-slate-500">{item.date}{item.date && item.location ? " • " : ""}{item.location}</p>
                                )}
                                {item.description && <p className="text-[11px] text-white/70">{item.description}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

/** Generic renderer for future-proof unknown sections */
function renderUnknownSection(key: string, value: unknown) {
    if (Array.isArray(value)) {
        return (
            <div className="space-y-2">
                {value.map((item: any, i: number) => (
                    <div key={i} className="border-l-2 border-white/10 pl-3 py-0.5 text-[11px] text-white/70 leading-relaxed">
                        {typeof item === "string" ? item : (
                            <div className="space-y-0.5">
                                {Object.entries(item).map(([k, v]) => (
                                    v && <p key={k}><span className="text-slate-500 font-medium capitalize">{k.replace(/([A-Z])/g, " $1")}:</span> {String(v)}</p>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )
    }
    if (typeof value === "string") {
        return <p className="text-[11px] text-white/70">{value}</p>
    }
    return <p className="text-[11px] text-white/70">{JSON.stringify(value)}</p>
}

// ── Main Component ────────────────────────────────────────────────────

interface ResumePreviewProps {
    resumeData: ResumeData
    resumeName: string
    onRemove: () => void
    onRefresh: () => void
}

export default function ResumePreview({ resumeData, resumeName, onRemove, onRefresh }: ResumePreviewProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(["personalInfo", "summary"]))
    const [justCopied, setJustCopied] = useState(false)

    const toggleSection = (key: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const expandAll = () => {
        setExpandedSections(new Set(populatedSections.map(s => s.key)))
    }

    const collapseAll = () => {
        setExpandedSections(new Set())
    }

    // Determine which sections are populated
    const populatedSections = useMemo(() => {
        const sections: { def: SectionDef; count: number }[] = []

        for (const def of KNOWN_SECTIONS) {
            if (!sectionHasData(resumeData, def)) continue
            let count = 0
            for (const key of def.dataKeys) {
                const val = (resumeData as any)[key]
                if (key === "personalInfo") {
                    // personal info counts as 1 if any field is non-empty
                    const p = resumeData.personalInfo
                    if (p && Object.values(p).some(v => v?.toString().trim())) count = 1
                } else if (key === "summary") {
                    if (resumeData.personalInfo?.summary?.trim()) count = 1
                } else {
                    count += countItems(val)
                }
            }
            if (count > 0) sections.push({ def, count })
        }

        // Future-proof: add unknown sections
        const unknownKeys = findUnknownSections(resumeData)
        for (const key of unknownKeys) {
            const val = (resumeData as any)[key]
            sections.push({
                def: {
                    key,
                    label: key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()),
                    icon: <Zap className="w-4 h-4" />,
                    dataKeys: [key],
                },
                count: countItems(val),
            })
        }

        return sections
    }, [resumeData])

    const totalSections = populatedSections.length
    const totalItems = populatedSections.reduce((sum, s) => sum + s.count, 0)

    const handleCopyAll = async () => {
        try {
            const text = JSON.stringify(resumeData, null, 2)
            await navigator.clipboard.writeText(text)
            setJustCopied(true)
            toast.success("Resume JSON copied to clipboard!")
            setTimeout(() => setJustCopied(false), 2000)
        } catch {
            toast.error("Failed to copy")
        }
    }

    // Render section content based on key
    const renderSectionContent = (def: SectionDef) => {
        switch (def.key) {
            case "personalInfo": return renderPersonalInfo(resumeData)
            case "summary": return renderSummary(resumeData)
            case "education": return renderEducation(resumeData.education)
            case "experience": return renderExperience(resumeData.experience)
            case "projects": return renderProjects(resumeData.projects)
            case "skills": return renderSkills(resumeData.skills)
            case "achievements": return renderAchievements(resumeData.achievements)
            case "certifications": return renderCertifications(resumeData.certifications)
            case "languages": return renderLanguages(resumeData.languages)
            case "publications": return renderPublications(resumeData.publications)
            case "customSections": return renderCustomSections(resumeData.customSections)
            default: {
                // Unknown section — render generically
                const value = (resumeData as any)[def.key]
                if (value === undefined) return null
                return renderUnknownSection(def.key, value)
            }
        }
    }

    return (
        <div className="border border-white/10 rounded-3xl overflow-hidden bg-white/[0.015] backdrop-blur-3xl">
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-tighter text-white">{resumeName}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                            {totalSections} sections • {totalItems} items
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={expandAll}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        title="Expand all"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={collapseAll}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        title="Collapse all"
                    >
                        <EyeOff className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleCopyAll}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        title="Copy resume JSON"
                    >
                        {justCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={onRefresh}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        title="Refresh from Resume Builder"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button
                        onClick={onRemove}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Remove imported resume"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Sections */}
            <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {populatedSections.map(({ def, count }) => {
                    const isExpanded = expandedSections.has(def.key)
                    const content = renderSectionContent(def)
                    if (!content) return null

                    return (
                        <div key={def.key}>
                            <button
                                onClick={() => toggleSection(def.key)}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-all text-left group"
                            >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                                    isExpanded ? "bg-blue-500/15 border-blue-500/30" : "bg-white/5 border-white/10 group-hover:bg-white/[0.08]"
                                }`}>
                                    <span className={isExpanded ? "text-blue-400" : "text-slate-400"}>{def.icon}</span>
                                </div>
                                <span className="flex-1 text-xs font-bold uppercase tracking-tighter">
                                    {def.label}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                                    {count}
                                </span>
                                {isExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                )}
                            </button>
                            {isExpanded && (
                                <div className="px-5 pb-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                    {content}
                                </div>
                            )}
                        </div>
                    )
                })}

                {populatedSections.length === 0 && (
                    <div className="px-5 py-8 text-center">
                        <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 font-medium">No populated sections found in this resume.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
