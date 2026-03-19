"use client"

import { useState } from "react"
import { Upload, FileText, Loader2, Sparkles, ShieldCheck, Zap, Target } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { toast } from "sonner"

interface OnboardingProps {
    onComplete: (data: any) => void
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const onDrop = (acceptedFiles: File[]) => {
        setFile(acceptedFiles[0])
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1
    })

    const handleUpload = async () => {
        if (!file) return

        setLoading(true)
        const formData = new FormData()
        formData.append("resume", file)

        try {
            const response = await axios.post("/api/profile", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            toast.success("Profile generated successfully!")
            onComplete(response.data.data)
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to generate profile")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl w-full text-center space-y-8"
            >
                <div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-4">
                        Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Mentorix Profile</span>
                    </h2>
                    <p className="text-slate-400 font-medium leading-relaxed">
                        Upload your resume to automatically generate your professional dashboard.
                        Mentorix will extract skills, projects, experience, and links in seconds.
                    </p>
                </div>

                <div
                    {...getRootProps()}
                    className={`
                        relative group cursor-pointer
                        bg-white/5 border-2 border-dashed rounded-[2.5rem] p-12
                        transition-all duration-500 overflow-hidden
                        ${isDragActive ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20"}
                    `}
                >
                    <input {...getInputProps()} />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-500 shadow-2xl">
                            <Upload className="w-10 h-10 text-slate-400 group-hover:text-white" />
                        </div>

                        <AnimatePresence mode="wait">
                            {file ? (
                                <motion.div
                                    key="file"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center"
                                >
                                    <p className="text-lg font-black text-white truncate max-w-[300px]">{file.name}</p>
                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1">Ready to sync</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="no-file"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center"
                                >
                                    <p className="text-lg font-black text-white uppercase tracking-tight">Drag & Drop Resume</p>
                                    <p className="text-sm text-slate-500 font-medium mt-1">PDF or DOCX (Max 10MB)</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl group overflow-hidden relative"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Parsing Resume...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            <span>Generate Profile</span>
                        </>
                    )}
                </button>

                <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                        <Target className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-white uppercase tracking-tighter">Accurate</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                        <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-white uppercase tracking-tighter">Fast</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                        <ShieldCheck className="w-5 h-5 text-green-400 mx-auto mb-2" />
                        <p className="text-[10px] font-black text-white uppercase tracking-tighter">Secure</p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
