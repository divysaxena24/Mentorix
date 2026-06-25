"use client"

import { useState } from "react"
import { Sparkles, Loader2, Send, Check, X, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import type { ResumeData } from "@/types"

interface AIResumeAssistantProps {
  existingData: ResumeData | null
  onResumeGenerated: (data: ResumeData) => void
}

interface ChangeItem {
  section: string
  before?: string
  after?: string
  reason?: string
}

interface AIResult {
  mode: string
  changes: string[]
  resumeData: ResumeData | null
  summary: string
  // Legacy fields preserved for backward compat
  changesMade?: ChangeItem[]
  atsBefore?: number
  atsAfter?: number
  matchedKeywords?: string[]
  missingKeywords?: string[]
  recruiterFeedback?: string
  atsImprovement?: string
  updatedResume?: string
  strengths?: string[]
  improvements?: string[]
  atsScore?: number
}

const QUICK_ACTIONS = [
  { label: "Add Docker", prompt: "Add Docker to my skills" },
  { label: "ATS Friendly", prompt: "Make my resume ATS friendly" },
  { label: "Improve Projects", prompt: "Rewrite my project descriptions to be more impactful" },
  { label: "One Page", prompt: "Compress to one page without losing key facts" },
  { label: "Stronger Bullets", prompt: "Improve all bullet points with stronger action verbs" },
  { label: "Delete Summary", prompt: "Delete the summary section" },
]

export default function AIResumeAssistant({ existingData, onResumeGenerated }: AIResumeAssistantProps) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AIResult | null>(null)

  const handleSubmit = async (userPrompt?: string) => {
    const finalPrompt = userPrompt || prompt
    if (!finalPrompt.trim()) {
      toast.error("Describe what you want to do")
      return
    }

    setLoading(true)
    setResult(null)
    try {
      // Check if this looks like a job description (long text with typical JD keywords)
      const hasJobDescriptionFlags = finalPrompt.length > 100 &&
        /(job|position|role|responsibilities|qualifications|requirements|salary|company|apply)/i.test(finalPrompt)

      const response = await axios.post("/api/resume-builder/ai", {
        // Don't pass explicit mode — let V3 auto-detect
        resumeData: existingData,
        userPrompt: finalPrompt,
        // If it looks like a JD, pass it as jobDescription for better TAILOR detection
        ...(hasJobDescriptionFlags ? { jobDescription: finalPrompt } : {}),
      })

      const res = response.data as AIResult
      setResult(res)

      // If resumeData returned, apply it
      if (res.resumeData) {
        onResumeGenerated(res.resumeData)
      }
      toast.success(`Resume ${res.mode || "updated"}!`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to process request")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const clearResult = () => {
    setResult(null)
    setPrompt("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-base font-black uppercase tracking-wider text-white">AI Resume Assistant</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Tell me what to do — create, edit, tailor, or optimize
          </p>
        </div>
      </div>

      {/* Quick actions */}
      {!result && !loading && (
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setPrompt(action.prompt)
                handleSubmit(action.prompt)
              }}
              disabled={loading}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[8px] font-bold text-slate-400 hover:text-white hover:bg-blue-600/10 hover:border-blue-500/30 transition-all uppercase tracking-wider"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative">
        <textarea
          className="w-full min-h-[120px] p-5 pr-14 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm backdrop-blur-xl leading-relaxed"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`e.g. "Add Docker to skills", "Rewrite summary for Google SWE", "Make ATS friendly", "Tailor for this job: [paste JD]"`}
          disabled={loading}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={loading || !prompt.trim()}
          className="absolute bottom-4 right-4 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-xl"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <p className="text-[10px] text-blue-300 font-medium">Processing your request...</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4 mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mode badge */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
              result.mode === "create" ? "bg-green-500/20 text-green-300" :
              result.mode === "tailor" ? "bg-purple-500/20 text-purple-300" :
              "bg-blue-500/20 text-blue-300"
            }`}>
              {result.mode || "edit"}
            </span>
            <span className="text-[9px] text-slate-500 font-medium">{result.changes?.length || 0} changes made</span>
          </div>

          {/* Summary */}
          {result.summary && (
            <div className="px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
              <p className="text-[9px] text-blue-300 font-bold uppercase tracking-wider mb-1">Summary</p>
              <p className="text-[11px] text-slate-300">{result.summary}</p>
            </div>
          )}

          {/* Changes list */}
          {result.changes && result.changes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Changes</h4>
              <div className="space-y-1.5">
                {result.changes.map((change, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                    <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-[10px] text-slate-300">{change}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy changesMade */}
          {result.changesMade && result.changesMade.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Detailed Changes</h4>
              {result.changesMade.map((change, idx) => (
                <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                  <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-lg text-[8px] font-black uppercase tracking-wider">{change.section}</span>
                  {change.before && <div className="text-[9px] text-slate-500 line-through">Before: {change.before.substring(0, 120)}</div>}
                  {change.after && <div className="text-[9px] text-green-400">After: {change.after.substring(0, 120)}</div>}
                  {change.reason && <p className="text-[8px] text-slate-500 italic">{change.reason}</p>}
                </div>
              ))}
            </div>
          )}

          {/* ATS scores (tailor mode) */}
          {(result.atsBefore != null || result.atsAfter != null) && (
            <div className="flex gap-3">
              {result.atsBefore != null && (
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">ATS Before</p>
                  <p className="text-lg font-black text-white">{result.atsBefore}</p>
                </div>
              )}
              {result.atsAfter != null && (
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5 text-green-400" /> ATS After
                  </p>
                  <p className="text-lg font-black text-green-400">{result.atsAfter}</p>
                </div>
              )}
              {result.atsBefore != null && result.atsAfter != null && (
                <div className="px-4 py-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-[8px] text-green-400 uppercase tracking-wider font-bold">Gain</p>
                  <p className="text-lg font-black text-green-300">+{Math.max(0, result.atsAfter - result.atsBefore)}</p>
                </div>
              )}
            </div>
          )}

          {/* Matched/Missing Keywords */}
          {result.matchedKeywords && result.matchedKeywords.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                <p className="text-[8px] text-green-400 font-black uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Matched
                </p>
                <div className="flex flex-wrap gap-1">
                  {result.matchedKeywords.map((kw, idx) => (
                    <span key={idx} className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-300 rounded-full font-bold">{kw}</span>
                  ))}
                </div>
              </div>
              {result.missingKeywords && result.missingKeywords.length > 0 && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <p className="text-[8px] text-red-400 font-black uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> Missing
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result.missingKeywords.map((kw, idx) => (
                      <span key={idx} className="text-[8px] px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded-full font-bold">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recruiter feedback */}
          {result.recruiterFeedback && (
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <p className="text-[8px] text-purple-300 font-black uppercase tracking-wider mb-1">Recruiter Feedback</p>
              <p className="text-[10px] text-slate-300">{result.recruiterFeedback}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={clearResult}
              className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <X className="w-3 h-3" /> Clear
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3 h-3" /> Send Another
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      {!result && !loading && (
        <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-400" /> Example Commands
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            <span className="text-[9px] text-slate-500">"Add Docker"</span>
            <span className="text-[9px] text-slate-500">"Change name to John"</span>
            <span className="text-[9px] text-slate-500">"Delete certifications"</span>
            <span className="text-[9px] text-slate-500">"Rewrite projects"</span>
            <span className="text-[9px] text-slate-500">"Optimize for Google"</span>
            <span className="text-[9px] text-slate-500">"Make ATS friendly"</span>
            <span className="text-[9px] text-slate-500">"One page"</span>
          </div>
        </div>
      )}
    </div>
  )
}
