"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Sparkles,
  Wand2,
  Target,
  Loader2,
  Check,
} from "lucide-react"
import axios from "axios"
import { toast } from "sonner"
import { ResumeData } from "@/types"

interface AIEnhanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ResumeData
  onApplyResult: (mode: string, result: any) => void
}

type AIStep = "select" | "improve" | "tailor" | "result"

export default function AIEnhanceDialog({ open, onOpenChange, data, onApplyResult }: AIEnhanceDialogProps) {
  const [step, setStep] = useState<AIStep>("select")
  const [loading, setLoading] = useState(false)
  const [userPrompt, setUserPrompt] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiMode, setAiMode] = useState<string>("")

  const handleRunImprove = async () => {
    setLoading(true)
    try {
      const response = await axios.post("/api/resume-builder/ai", {
        mode: "IMPROVE_EXISTING_RESUME",
        resumeData: data,
        userPrompt: userPrompt || "Improve the resume to be more ATS-friendly, impactful, and professionally worded. Strengthen bullet points with strong action verbs and quantify impact where possible.",
      })
      setAiResult(response.data)
      setAiMode("IMPROVE_EXISTING_RESUME")
      setStep("result")
      toast.success("Resume improved successfully!")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to improve resume")
    } finally {
      setLoading(false)
    }
  }

  const handleRunTailor = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description")
      return
    }
    setLoading(true)
    try {
      const response = await axios.post("/api/resume-builder/ai", {
        mode: "TAILOR_FOR_JOB_DESCRIPTION",
        resumeData: data,
        jobDescription,
      })
      setAiResult(response.data)
      setAiMode("TAILOR_FOR_JOB_DESCRIPTION")
      setStep("result")
      toast.success("Resume tailored successfully!")
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to tailor resume")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep("select")
    setUserPrompt("")
    setJobDescription("")
    setAiResult(null)
    setAiMode("")
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(handleReset, 300)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v) }}>
      <DialogContent className="max-w-2xl bg-slate-950 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black uppercase tracking-wider">AI Resume Architect</span>
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            {step === "select" && "Choose an AI enhancement mode"}
            {step === "improve" && "Describe how you want to improve your resume"}
            {step === "tailor" && "Paste the job description to tailor your resume"}
            {step === "result" && "Review AI suggestions and apply them"}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {step === "select" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setStep("improve")}
                className="group p-8 bg-white/5 border border-white/10 rounded-[2rem] text-left hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-center md:text-left"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
                  <Wand2 className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">Improve Resume</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Enhance wording, ATS optimization, bullet points, and overall impact. Preserve all your facts.
                </p>
              </button>

              <button
                onClick={() => setStep("tailor")}
                className="group p-8 bg-white/5 border border-white/10 rounded-[2rem] text-left hover:bg-purple-600/10 hover:border-purple-500/30 transition-all text-center md:text-left"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0 group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">Tailor for Job</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Optimize your resume for a specific job description. Maximize ATS matching and recruiter appeal.
                </p>
              </button>
            </div>
          )}

          {step === "improve" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                  Improvement Prompt
                </label>
                <textarea
                  className="w-full min-h-[140px] p-6 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm backdrop-blur-xl"
                  value={userPrompt}
                  onChange={e => setUserPrompt(e.target.value)}
                  placeholder="e.g. Make it more ATS-friendly and improve bullet points with strong action verbs..."
                />
                <p className="text-[9px] text-slate-600 ml-2">
                  Leave empty for a general ATS & impact improvement.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setStep("select")}
                  className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleRunImprove}
                  disabled={loading}
                  className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl disabled:opacity-50 flex items-center gap-3"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {loading ? "Enhancing..." : "Run Enhancement"}
                </button>
              </div>
            </div>
          )}

          {step === "tailor" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                  Job Description
                </label>
                <textarea
                  className="w-full min-h-[200px] p-6 bg-white/5 border border-white/10 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm backdrop-blur-xl"
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setStep("select")}
                  className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleRunTailor}
                  disabled={loading || !jobDescription.trim()}
                  className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl disabled:opacity-50 flex items-center gap-3"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                  {loading ? "Tailoring..." : "Tailor Resume"}
                </button>
              </div>
            </div>
          )}

          {step === "result" && aiResult && (
            <div className="space-y-6">
              {aiMode === "IMPROVE_EXISTING_RESUME" && (
                <div className="space-y-4">
                  {aiResult.changesMade && aiResult.changesMade.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Changes Made</h4>
                      {aiResult.changesMade.map((change: any, idx: number) => (
                        <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">{change.section}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 line-through">{change.before?.substring(0, 150)}</div>
                          <div className="text-[10px] text-green-400">{change.after?.substring(0, 150)}</div>
                          <p className="text-[9px] text-slate-500 italic">{change.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {aiResult.atsImprovement && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                      <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">ATS Impact</p>
                      <p className="text-[11px] text-slate-300 mt-1">{aiResult.atsImprovement}</p>
                    </div>
                  )}
                  {aiResult.summary && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                      <p className="text-[10px] text-green-300 font-bold uppercase tracking-wider">Summary</p>
                      <p className="text-[11px] text-slate-300 mt-1">{aiResult.summary}</p>
                    </div>
                  )}
                  {aiResult.updatedResume && (
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl max-h-[300px] overflow-y-auto">
                      <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-mono">{aiResult.updatedResume}</pre>
                    </div>
                  )}
                </div>
              )}

              {aiMode === "TAILOR_FOR_JOB_DESCRIPTION" && (
                <div className="space-y-4">
                  <div className="flex gap-4 flex-wrap">
                    <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">ATS Before</p>
                      <p className="text-xl font-black text-white">{aiResult.atsBefore ?? "—"}</p>
                    </div>
                    <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">ATS After</p>
                      <p className="text-xl font-black text-green-400">{aiResult.atsAfter ?? "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                      <p className="text-[9px] text-green-400 font-bold uppercase tracking-wider mb-2">✅ Matched Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(aiResult.matchedKeywords || []).map((kw: string, idx: number) => (
                          <span key={idx} className="text-[9px] px-2 py-1 bg-green-500/20 text-green-300 rounded-full font-bold">
                            {kw}
                          </span>
                        ))}
                        {(!aiResult.matchedKeywords || aiResult.matchedKeywords.length === 0) && (
                          <span className="text-[10px] text-slate-500">None found</span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                      <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider mb-2">❌ Missing Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(aiResult.missingKeywords || []).map((kw: string, idx: number) => (
                          <span key={idx} className="text-[9px] px-2 py-1 bg-red-500/20 text-red-300 rounded-full font-bold">
                            {kw}
                          </span>
                        ))}
                        {(!aiResult.missingKeywords || aiResult.missingKeywords.length === 0) && (
                          <span className="text-[10px] text-slate-500">None</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {aiResult.changesMade && aiResult.changesMade.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400">Changes</h4>
                      {aiResult.changesMade.map((change: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                          <p className="text-[10px] text-slate-300"><span className="text-purple-400 font-bold">{change.section}:</span> {change.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {aiResult.recruiterFeedback && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                      <p className="text-[10px] text-purple-300 font-bold uppercase tracking-wider mb-1">Recruiter Feedback</p>
                      <p className="text-[11px] text-slate-300">{aiResult.recruiterFeedback}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2 border-t border-white/10">
                <button
                  onClick={handleReset}
                  className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                >
                  New Enhancement
                </button>
                {/* Always show Apply button if resumeData is available */}
                {(aiResult.resumeData || aiResult.updatedResume) && (
                  <button
                    onClick={() => {
                      // Pass the full result - parent should use result.resumeData ?? result
                      onApplyResult(aiMode, {
                        ...aiResult,
                        // Ensure resumeData is accessible whether AI returned resumeData or resume
                        resumeData: aiResult.resumeData || aiResult,
                      })
                      handleClose()
                    }}
                    className="px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl flex items-center gap-3"
                  >
                    <Check className="w-4 h-4" />
                    Apply & Close
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
