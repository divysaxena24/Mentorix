"use client"

import { useState } from "react"
import { Wand2, Loader2, ChevronRight } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import type { ResumeData } from "@/types"

interface ImproveResumeProps {
  existingData: ResumeData | null
  onResumeGenerated?: (data: ResumeData) => void
}

export default function ImproveResume({ existingData, onResumeGenerated }: ImproveResumeProps) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleImprove = async () => {
    if (!prompt.trim()) {
      toast.error("Tell the AI what to improve")
      return
    }

    setLoading(true)
    setResult(null)
    try {
      const response = await axios.post("/api/resume-builder/ai", {
        mode: "IMPROVE_EXISTING_RESUME",
        resumeData: existingData,
        userPrompt: prompt,
      })

      const res = response.data
      setResult(res)
      if (res.resumeData) {
        onResumeGenerated?.(res.resumeData)
      }
      toast.success("Resume improved!")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to improve resume")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Wand2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-base font-black uppercase tracking-wider text-white">Improve Resume</h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Tell AI how to improve your current resume
          </p>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
        <p className="text-[9px] text-blue-300/70 font-medium">
          AI already has your current resume data. Just describe what you want changed.
        </p>
      </div>

      <textarea
        className="w-full min-h-[200px] p-6 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm backdrop-blur-xl leading-relaxed"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder={`Tell AI what improvements to make...`}
      />

      <div className="flex justify-end">
        <button
          onClick={handleImprove}
          disabled={loading || !prompt.trim()}
          className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:from-blue-700 hover:to-cyan-700 transition-all shadow-xl disabled:opacity-50 group"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Improving...</>
          ) : (
            <><Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Improve <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-4 mt-6 pt-6 border-t border-white/10">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">AI Changes</h4>

          {result.changesMade?.length > 0 && (
            <div className="space-y-2">
              {result.changesMade.map((change: any, idx: number) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                  <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-lg text-[8px] font-black uppercase tracking-wider">{change.section}</span>
                  {change.before && <div className="text-[10px] text-slate-500 line-through">Before: {change.before.substring(0, 150)}</div>}
                  {change.after && <div className="text-[10px] text-green-400">After: {change.after.substring(0, 150)}</div>}
                  <p className="text-[8px] text-slate-500 italic">{change.reason}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {result.atsImprovement && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-[8px] text-blue-300 font-black uppercase tracking-wider mb-0.5">ATS Impact</p>
                <p className="text-[10px] text-slate-300">{result.atsImprovement}</p>
              </div>
            )}
            {result.summary && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-[8px] text-green-300 font-black uppercase tracking-wider mb-0.5">Summary</p>
                <p className="text-[10px] text-slate-300">{result.summary}</p>
              </div>
            )}
          </div>

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
