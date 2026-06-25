"use client"

import { useState } from "react"
import { Target, Loader2, ChevronRight, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import type { ResumeData } from "@/types"

interface TailorForJobProps {
  existingData: ResumeData | null
  onResumeGenerated?: (data: ResumeData) => void
}

export default function TailorForJob({ existingData, onResumeGenerated }: TailorForJobProps) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTailor = async () => {
    if (!prompt.trim()) {
      toast.error("Paste the job description or describe the role")
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const response = await axios.post("/api/resume-builder/ai", {
        mode: "TAILOR_FOR_JOB_DESCRIPTION",
        resumeData: existingData,
        jobDescription: prompt,
      })

      const res = response.data
      setResult(res)
      // Support both V3 (resumeData) and legacy (flat/personalInfo) formats
      const resumeData = res.resumeData ?? (res.personalInfo ? res : null)
      if (resumeData) {
        onResumeGenerated?.(resumeData)
      }
      toast.success("Resume tailored!")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to tailor resume")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-base font-black uppercase tracking-wider text-white">Tailor for Job</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Paste a job description — AI tailors your resume
          </p>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-purple-500/5 border border-purple-500/10 rounded-xl">
        <p className="text-[9px] text-purple-300/70 font-medium">
          AI already has your resume data. Just paste the job description.
        </p>
      </div>

      <textarea
        className="w-full min-h-[280px] p-6 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm backdrop-blur-xl leading-relaxed"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder={`Paste the full job description here...`}
      />

      <div className="flex justify-end">
        <button
          onClick={handleTailor}
          disabled={loading || !prompt.trim()}
          className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl disabled:opacity-50 group"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Tailoring...</>
          ) : (
            <><Target className="w-4 h-4 group-hover:scale-110 transition-transform" /> Tailor <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-5 mt-6 pt-6 border-t border-white/10">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400">Results</h4>

          <div className="flex gap-3 flex-wrap">
            <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">ATS Before</p>
              <p className="text-2xl font-black text-white">{result.atsBefore ?? "—"}</p>
            </div>
            <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5 text-green-400" />ATS After</p>
              <p className="text-2xl font-black text-green-400">{result.atsAfter ?? "—"}</p>
            </div>
            {result.atsBefore != null && result.atsAfter != null && (
              <div className="px-5 py-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                <p className="text-[8px] text-green-400 uppercase tracking-wider font-bold">Gain</p>
                <p className="text-2xl font-black text-green-300">+{Math.max(0, (result.atsAfter || 0) - (result.atsBefore || 0))}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
              <p className="text-[8px] text-green-400 font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> Matched
              </p>
              <div className="flex flex-wrap gap-1">
                {(result.matchedKeywords || []).map((kw: string, idx: number) => (
                  <span key={idx} className="text-[8px] px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full font-bold">{kw}</span>
                ))}
                {(!result.matchedKeywords || result.matchedKeywords.length === 0) && <span className="text-[9px] text-slate-500 italic">No data</span>}
              </div>
            </div>
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <p className="text-[8px] text-red-400 font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> Missing
              </p>
              <div className="flex flex-wrap gap-1">
                {(result.missingKeywords || []).map((kw: string, idx: number) => (
                  <span key={idx} className="text-[8px] px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full font-bold">{kw}</span>
                ))}
                {(!result.missingKeywords || result.missingKeywords.length === 0) && <span className="text-[9px] text-slate-500 italic">None</span>}
              </div>
            </div>
          </div>

          {result.recruiterFeedback && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <p className="text-[8px] text-purple-300 font-black uppercase tracking-wider mb-1">Recruiter Feedback</p>
              <p className="text-[10px] text-slate-300">{result.recruiterFeedback}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setResult(null)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
