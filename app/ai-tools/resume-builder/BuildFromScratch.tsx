"use client"

import { useState } from "react"
import { Sparkles, Loader2, ChevronRight, Zap } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import type { ResumeData } from "@/types"

interface BuildFromScratchProps {
  onResumeGenerated: (data: ResumeData) => void
}

// ─── Placeholder Detection ──────────────────────────────────────────────

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^your\s+/i,
  /^untitled\s+/i,
  /^techcorp$/i,
  /^abc\s+company$/i,
  /^xyz\s+university$/i,
  /^certification\s+name$/i,
  /^project\s+name$/i,
  /^institution$/i,
  /^company$/i,
  /^role$/i,
]

function isPlaceholder(val: string | null | undefined): boolean {
  if (!val || val.trim() === "") return true
  return PLACEHOLDER_PATTERNS.some(p => p.test(val.trim()))
}

function hasRealContent(val: string | null | undefined): boolean {
  return !isPlaceholder(val)
}

function filterRealItems<T>(items: T[], fieldsToCheck: ((item: T) => string)[]): T[] {
  return items.filter(item =>
    fieldsToCheck.some(fn => hasRealContent(fn(item)))
  )
}

export default function BuildFromScratch({ onResumeGenerated }: BuildFromScratchProps) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe your background")
      return
    }

    setLoading(true)
    try {
      const response = await axios.post("/api/resume-builder/ai", {
        mode: "BUILD_NEW_RESUME",
        resumeText: prompt,
      })

      const result = response.data

      if (result.resume) {
        const resume = result.resume

        // ── Filter raw AI output: remove placeholder entries ──
        const rawEducation = (resume.education || [])
          .map((edu: any) => ({
            institution: typeof edu === "string" ? edu : edu.institution || "",
            degree: typeof edu === "string" ? "" : edu.degree || "",
            location: "",
            startDate: "",
            endDate: "",
            cgpa: typeof edu === "string" ? "" : edu.cgpa || "",
          }))
          .filter(e => hasRealContent(e.institution))

        const rawExperience = (resume.experience || [])
          .map((exp: any) => ({
            company: typeof exp === "string" ? exp : exp.company || "",
            role: typeof exp === "string" ? "" : exp.role || "",
            location: "",
            startDate: typeof exp === "string" ? "" : exp.startDate || "",
            endDate: typeof exp === "string" ? "" : exp.endDate || "",
            description: typeof exp === "string" ? exp : exp.description || "",
          }))
          .filter(e => hasRealContent(e.company) || hasRealContent(e.role) || hasRealContent(e.description))

        const rawSkills = (resume.skills || [])
          .map((skill: any) => {
            if (typeof skill === "string") return { category: "General", skills: [skill].filter(s => hasRealContent(s)) }
            if (Array.isArray(skill)) return { category: "General", skills: skill.filter(s => hasRealContent(s)) }
            const skillsArr = (skill.skills || (typeof skill === "object" ? Object.values(skill) : [skill]))
              .filter((s: string) => hasRealContent(s))
            return {
              category: skill.category || "General",
              skills: skillsArr,
            }
          })
          .filter(s => s.skills.length > 0)

        const rawProjects = (resume.projects || [])
          .map((proj: any) => {
            let techs: string[] = []
            if (typeof proj === "string") {
              techs = []
            } else if (Array.isArray(proj.technologies)) {
              techs = proj.technologies.filter((t: string) => hasRealContent(t))
            } else if (typeof proj.technologies === "string") {
              techs = proj.technologies.split(",").map((s: string) => s.trim()).filter(s => hasRealContent(s))
            }
            return {
              title: typeof proj === "string" ? proj : proj.title || "",
              description: typeof proj === "string" ? "" : proj.description || "",
              technologies: techs,
              link: typeof proj === "string" ? "" : proj.link || "",
            }
          })
          .filter(p => hasRealContent(p.title) || hasRealContent(p.description))

        const rawHonors = (resume.achievements || resume.honors || [])
          .filter((h: any) => hasRealContent(typeof h === "string" ? h : h.title || h.name || ""))

        const rawCerts = (resume.certifications || [])
          .map((cert: any) => ({
            title: typeof cert === "string" ? cert : cert.name || cert.title || "",
            description: typeof cert === "string" ? "" : cert.description || "",
          }))
          .filter(c => hasRealContent(c.title))

        // ── Map certifications ────────────────────────────────────────
        const rawCertifications = (resume.certifications || [])
          .map((cert: any) => ({
            title: typeof cert === "string" ? cert : cert.name || cert.title || "",
            issuer: typeof cert === "string" ? "" : cert.issuer || "",
            date: typeof cert === "string" ? "" : cert.date || "",
            link: typeof cert === "string" ? "" : cert.link || "",
            description: typeof cert === "string" ? "" : cert.description || "",
          }))
          .filter(c => hasRealContent(c.title))

        // ── Map achievements ──────────────────────────────────────────
        const rawAchievements = (resume.achievements || resume.honors || [])
          .map((ach: any) => ({
            title: typeof ach === "string" ? ach : ach.title || ach.name || "",
            date: typeof ach === "string" ? "" : ach.date || "",
            description: typeof ach === "string" ? "" : ach.description || "",
            type: typeof ach === "string" ? ("other" as const) : (ach.type || "other"),
          }))
          .filter(a => hasRealContent(a.title))

        // ── Map languages ─────────────────────────────────────────────
        const rawLanguages = (resume.languages || [])
          .map((lang: any) => ({
            name: typeof lang === "string" ? lang : lang.name || "",
            proficiency: typeof lang === "string" ? undefined : (lang.proficiency || undefined),
          }))
          .filter(l => hasRealContent(l.name))

        // ── Map publications ──────────────────────────────────────────
        const rawPublications = (resume.publications || [])
          .map((pub: any) => ({
            title: typeof pub === "string" ? pub : pub.title || "",
            publisher: typeof pub === "string" ? "" : pub.publisher || "",
            date: typeof pub === "string" ? "" : pub.date || "",
            link: typeof pub === "string" ? "" : pub.link || "",
            description: typeof pub === "string" ? "" : pub.description || "",
          }))
          .filter(p => hasRealContent(p.title))

        const mappedData: ResumeData = {
          personalInfo: {
            fullName: "",
            email: "",
            phone: "",
            address: "",
            linkedin: "",
            github: "",
            leetcode: "",
            portfolio: "",
            summary: hasRealContent(resume.summary) ? resume.summary : "",
          },
          education: rawEducation,
          experience: rawExperience,
          skills: rawSkills,
          projects: rawProjects,
          honors: rawHonors,
          certifications: rawCertifications,
          achievements: rawAchievements,
          languages: rawLanguages,
          publications: rawPublications,
          customSections: [],
          sectionOrder: [],
          template: "corporate",
        }

        onResumeGenerated(mappedData)
        toast.success(`Resume generated!${result.atsScore ? ` ATS Score: ${result.atsScore}/100` : ""}`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to generate resume")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-base font-black uppercase tracking-wider text-white">Build from Scratch</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Describe your background — AI generates a complete resume
          </p>
        </div>
      </div>

      <textarea
        className="w-full min-h-[280px] p-6 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm backdrop-blur-xl leading-relaxed"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder={`Describe your background in detail...`}
      />

      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl disabled:opacity-50 group"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Generate <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </div>
    </div>
  )
}
