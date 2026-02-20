"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Download,
    Save,
    User,
    Briefcase,
    GraduationCap,
    Code,
    Layout,
    Plus,
    Trash2,
    Sparkles,
    Clock,
    Loader2,
    Trophy,
    ShieldCheck,
    Languages,
    Heart,
    BookOpen,
    Users,
    Terminal
} from "lucide-react"
import Link from "next/link"
import axios from "axios"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResumeData } from "@/types"
import { downloadResume, TEMPLATES } from "@/components/resume/ResumeTemplates"
import ResumePreview from "@/components/resume/ResumePreview"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

const INITIAL_DATA: ResumeData = {
    personalInfo: {
        fullName: "",
        email: "",
        phone: "",
        address: "",
        linkedin: "",
        github: "",
        leetcode: "",
        portfolio: "",
        summary: "",
    },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    honors: [],
    customSections: [],
    template: "corporate",
}

function ResumeBuilderContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const resumeId = searchParams.get("id")

    const [step, setStep] = useState(1)
    const [data, setData] = useState<ResumeData>(INITIAL_DATA)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(!!resumeId)
    const [sidebarSize, setSidebarSize] = useState(20)

    useEffect(() => {
        if (resumeId) {
            fetchResume(resumeId)
        }
    }, [resumeId])

    const fetchResume = async (id: string) => {
        try {
            const response = await axios.get(`/api/resume-builder?id=${id}`)
            setData(response.data.resumeData)
        } catch (error) {
            toast.error("Failed to load resume")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const response = await axios.post("/api/resume-builder", {
                id: resumeId,
                resumeName: data.personalInfo.fullName || "Untitled Resume",
                resumeData: data,
            })
            toast.success("Resume saved successfully!")
            if (!resumeId) {
                router.push(`/ai-tools/resume-builder?id=${response.data.id}`)
            }
        } catch (error) {
            toast.error("Failed to save resume")
        } finally {
            setSaving(false)
        }
    }

    const steps = [
        { id: 1, name: "Personal", icon: User },
        { id: 2, name: "Experience", icon: Briefcase },
        { id: 3, name: "Education", icon: GraduationCap },
        { id: 4, name: "Skills & Projects", icon: Code },
        { id: 5, name: "Honors & Awards", icon: Sparkles },
        { id: 6, name: "Add New Section", icon: Layout },
    ]

    const nextStep = () => setStep(s => Math.min(s + 1, 6))
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 animate-spin text-zinc-900" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden text-white">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -mr-48 -mt-48 rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] -ml-48 -mb-20 rounded-full pointer-events-none" />

            {/* Header */}
            <div className="max-w-[1920px] mx-auto px-10 py-8 border-b border-white/5 relative z-10 text-left">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group">
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                        </Link>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                                Resume Engine v3.0
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                                Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Architect</span>
                            </h1>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">
                                Step {step} of 6: {steps[step - 1].name}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/history?tab=saved-resumes"
                            className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl backdrop-blur-xl group"
                        >
                            <Clock className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            My History
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl backdrop-blur-xl group disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                            {searchParams.get("id") ? "Update Core" : "Save Progress"}
                        </button>
                        <button
                            onClick={() => downloadResume(data)}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl group"
                        >
                            <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                            Finalize PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-[1920px] mx-auto h-[calc(100vh-130px)] relative z-10 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    {/* Sidebar Navigation */}
                    <ResizablePanel
                        defaultSize={20}
                        minSize={15}
                        onResize={(size) => setSidebarSize(size)}
                        className="hidden xl:block transition-all duration-300 ease-in-out"
                    >
                        <div id="sidebar-nav" className={`h-full border-r border-white/5 p-8 space-y-3 bg-white/2 backdrop-blur-xl overflow-y-auto custom-scrollbar transition-all duration-300 ${sidebarSize <= 17 ? "px-4" : "p-8"}`}>
                            <div className={`mb-10 px-4 transition-opacity duration-300 ${sidebarSize <= 17 ? "opacity-0 h-0 mb-0 overflow-hidden" : "opacity-100"}`}>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 whitespace-nowrap">Architecture</h3>
                                <div className="h-0.5 w-8 bg-blue-500/30 rounded-full" />
                            </div>
                            <div className="space-y-3">
                                {steps.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setStep(s.id)}
                                        className={`w-full flex items-center gap-4 rounded-[1.8rem] text-xs font-black uppercase tracking-widest transition-all group relative overflow-hidden ${sidebarSize <= 17 ? "justify-center px-0 py-6" : "px-6 py-4"} ${step === s.id
                                            ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] translate-x-1"
                                            : "text-slate-500 hover:text-white hover:bg-white/5"
                                            }`}
                                        title={sidebarSize <= 17 ? s.name : ""}
                                    >
                                        <s.icon className={`w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0 ${step === s.id ? "text-blue-600" : "text-slate-600"}`} />
                                        <span className={`relative z-10 transition-all duration-300 whitespace-nowrap ${sidebarSize <= 17 ? "opacity-0 w-0 scale-0 overflow-hidden invisible" : "opacity-100 w-auto scale-100 visible"}`}>
                                            {s.name}
                                        </span>
                                        {step === s.id && (
                                            <div className={`absolute bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)] transition-all ${sidebarSize <= 17 ? "bottom-2 w-1 h-1" : "right-4 w-1.5 h-1.5"}`} />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className={`absolute bottom-8 left-4 right-4 transition-all duration-300 ${sidebarSize <= 17 ? "opacity-0 scale-0 pointer-events-none" : "opacity-100 scale-100"}`}>
                                <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10 backdrop-blur-3xl">
                                    <Sparkles className="w-5 h-5 text-blue-400 mb-3" />
                                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                                        Content optimization active in neural layers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle className="w-1 bg-white/5 hover:bg-blue-500/30 transition-colors hidden xl:flex" />

                    {/* Form Area */}
                    <ResizablePanel defaultSize={40} minSize={30}>
                        <div id="form-area" className="h-full p-8 pb-0 lg:p-12 lg:pb-0 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-950/40">
                            <div className="max-w-2xl mx-auto space-y-16">
                                {step === 1 && (
                                    <div className="space-y-12">
                                        <SectionHeader title="Personal Information" icon={User} />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Full Identity</Label>
                                                <Input
                                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                                                    value={data.personalInfo.fullName || ""}
                                                    onChange={e => setData({ ...data, personalInfo: { ...data.personalInfo, fullName: e.target.value } })}
                                                    placeholder="e.g. Alexander Pierce"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Digital Mail</Label>
                                                <Input
                                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                                                    value={data.personalInfo.email || ""}
                                                    onChange={e => setData({ ...data, personalInfo: { ...data.personalInfo, email: e.target.value } })}
                                                    placeholder="alexander@interface.com"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Comm-Link</Label>
                                                <Input
                                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                                                    value={data.personalInfo.phone || ""}
                                                    onChange={e => setData({ ...data, personalInfo: { ...data.personalInfo, phone: e.target.value } })}
                                                    placeholder="+1 888 000 9999"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Geographic Node</Label>
                                                <Input
                                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                                                    value={data.personalInfo.address || ""}
                                                    onChange={e => setData({ ...data, personalInfo: { ...data.personalInfo, address: e.target.value } })}
                                                    placeholder="San Francisco, CA"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">LinkedIn Profile</Label>
                                                <Input
                                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                                                    value={data.personalInfo.linkedin || ""}
                                                    onChange={e => setData({ ...data, personalInfo: { ...data.personalInfo, linkedin: e.target.value } })}
                                                    placeholder="linkedin.com/in/username"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">GitHub Repository</Label>
                                                <Input
                                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                                                    value={data.personalInfo.github || ""}
                                                    onChange={e => setData({ ...data, personalInfo: { ...data.personalInfo, github: e.target.value } })}
                                                    placeholder="github.com/username"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">LeetCode Link</Label>
                                                <Input
                                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                                                    value={data.personalInfo.leetcode || ""}
                                                    onChange={e => setData({ ...data, personalInfo: { ...data.personalInfo, leetcode: e.target.value } })}
                                                    placeholder="leetcode.com/username"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Professional Narrative</Label>
                                            <textarea
                                                className="w-full min-h-[180px] p-6 bg-white/5 border border-white/10 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm leading-relaxed backdrop-blur-xl shadow-2xl"
                                                value={data.personalInfo.summary || ""}
                                                onChange={e => setData({ ...data, personalInfo: { ...data.personalInfo, summary: e.target.value } })}
                                                placeholder="Briefly describe your career trajectory and core competencies..."
                                            />
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-12">
                                        <SectionHeader title="Professional Trajectory" icon={Briefcase} />
                                        <div className="space-y-8">
                                            {data.experience.map((exp, idx) => (
                                                <div key={idx} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative group shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                                                    <button
                                                        onClick={() => {
                                                            const newExp = [...data.experience];
                                                            newExp.splice(idx, 1);
                                                            setData({ ...data, experience: newExp });
                                                        }}
                                                        className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Organization</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={exp.company || ""}
                                                                onChange={e => {
                                                                    const newExp = [...data.experience];
                                                                    newExp[idx].company = e.target.value;
                                                                    setData({ ...data, experience: newExp });
                                                                }}
                                                                placeholder="e.g. Neuralink"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Strategic Role</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={exp.role || ""}
                                                                onChange={e => {
                                                                    const newExp = [...data.experience];
                                                                    newExp[idx].role = e.target.value;
                                                                    setData({ ...data, experience: newExp });
                                                                }}
                                                                placeholder="e.g. Lead System Architect"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Start Phase</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={exp.startDate || ""}
                                                                onChange={e => {
                                                                    const newExp = [...data.experience];
                                                                    newExp[idx].startDate = e.target.value;
                                                                    setData({ ...data, experience: newExp });
                                                                }}
                                                                placeholder="Oct 2022"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">End Phase</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={exp.endDate || ""}
                                                                onChange={e => {
                                                                    const newExp = [...data.experience];
                                                                    newExp[idx].endDate = e.target.value;
                                                                    setData({ ...data, experience: newExp });
                                                                }}
                                                                placeholder="Present"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-8 space-y-3">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Operational Summary</Label>
                                                        <textarea
                                                            className="w-full min-h-[120px] p-6 bg-white/5 border border-white/10 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm backdrop-blur-xl"
                                                            value={exp.description || ""}
                                                            onChange={e => {
                                                                const newExp = [...data.experience];
                                                                newExp[idx].description = e.target.value;
                                                                setData({ ...data, experience: newExp });
                                                            }}
                                                            placeholder="Key impact and achievements..."
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setData({ ...data, experience: [...data.experience, { company: "", role: "", location: "", startDate: "", endDate: "", description: "" }] })}
                                                className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-white/5 transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                                            >
                                                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <Plus className="w-5 h-5" />
                                                </div>
                                                Initialize New Experience
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-12">
                                        <SectionHeader title="Academic Foundation" icon={GraduationCap} />
                                        <div className="space-y-8">
                                            {data.education.map((edu, idx) => (
                                                <div key={idx} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative group shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                                                    <button
                                                        onClick={() => {
                                                            const newEdu = [...data.education];
                                                            newEdu.splice(idx, 1);
                                                            setData({ ...data, education: newEdu });
                                                        }}
                                                        className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Institution</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={edu.institution || ""}
                                                                onChange={e => {
                                                                    const newEdu = [...data.education];
                                                                    newEdu[idx].institution = e.target.value;
                                                                    setData({ ...data, education: newEdu });
                                                                }}
                                                                placeholder="e.g. Stanford University"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Degree / Specialization</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={edu.degree || ""}
                                                                onChange={e => {
                                                                    const newEdu = [...data.education];
                                                                    newEdu[idx].degree = e.target.value;
                                                                    setData({ ...data, education: newEdu });
                                                                }}
                                                                placeholder="B.S. Computer Science"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Start Era</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={edu.startDate || ""}
                                                                onChange={e => {
                                                                    const newEdu = [...data.education];
                                                                    newEdu[idx].startDate = e.target.value;
                                                                    setData({ ...data, education: newEdu });
                                                                }}
                                                                placeholder="2018"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Conclusion Era</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={edu.endDate || ""}
                                                                onChange={e => {
                                                                    const newEdu = [...data.education];
                                                                    newEdu[idx].endDate = e.target.value;
                                                                    setData({ ...data, education: newEdu });
                                                                }}
                                                                placeholder="2022"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Metric (CGPA / %)</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={edu.cgpa || ""}
                                                                onChange={e => {
                                                                    const newEdu = [...data.education];
                                                                    newEdu[idx].cgpa = e.target.value;
                                                                    setData({ ...data, education: newEdu });
                                                                }}
                                                                placeholder="9.8 / 10"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setData({ ...data, education: [...data.education, { institution: "", degree: "", location: "", startDate: "", endDate: "", cgpa: "" }] })}
                                                className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-white/5 transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                                            >
                                                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <Plus className="w-5 h-5" />
                                                </div>
                                                Initialize Academic Node
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="space-y-16">
                                        <div className="space-y-12">
                                            <SectionHeader title="Core Capabilities" icon={Code} />
                                            <div className="space-y-8">
                                                {data.skills.map((skillGroup, idx) => (
                                                    <div key={idx} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative group shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500 space-y-8">
                                                        <button
                                                            onClick={() => {
                                                                const newSkills = [...data.skills];
                                                                newSkills.splice(idx, 1);
                                                                setData({ ...data, skills: newSkills });
                                                            }}
                                                            className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Skill Category</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={skillGroup.category || ""}
                                                                onChange={e => {
                                                                    const newSkills = [...data.skills];
                                                                    newSkills[idx].category = e.target.value;
                                                                    setData({ ...data, skills: newSkills });
                                                                }}
                                                                placeholder="e.g. Neural Networks, Cloud Ops"
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Proficiencies (Comma separated)</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={skillGroup.skills?.join(", ") || ""}
                                                                onChange={e => {
                                                                    const newSkills = [...data.skills];
                                                                    newSkills[idx].skills = e.target.value.split(",").map(s => s.trim());
                                                                    setData({ ...data, skills: newSkills });
                                                                }}
                                                                placeholder="PyTorch, AWS, Docker..."
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => setData({ ...data, skills: [...data.skills, { category: "", skills: [] }] })}
                                                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-white/5 transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                                                >
                                                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <Plus className="w-5 h-5" />
                                                    </div>
                                                    Register Capability Set
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-12">
                                            <SectionHeader title="Strategic Projects" icon={Sparkles} />
                                            <div className="space-y-8">
                                                {data.projects.map((project, idx) => (
                                                    <div key={idx} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative group shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500 space-y-8">
                                                        <button
                                                            onClick={() => {
                                                                const newProjects = [...data.projects];
                                                                newProjects.splice(idx, 1);
                                                                setData({ ...data, projects: newProjects });
                                                            }}
                                                            className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Project Title</Label>
                                                                <Input
                                                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                    value={project.title || ""}
                                                                    onChange={e => {
                                                                        const newProjects = [...data.projects];
                                                                        newProjects[idx].title = e.target.value;
                                                                        setData({ ...data, projects: newProjects });
                                                                    }}
                                                                    placeholder="Project Codex"
                                                                />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Deployment Link</Label>
                                                                <Input
                                                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                    value={project.link || ""}
                                                                    onChange={e => {
                                                                        const newProjects = [...data.projects];
                                                                        newProjects[idx].link = e.target.value;
                                                                        setData({ ...data, projects: newProjects });
                                                                    }}
                                                                    placeholder="https://..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Tech Stack (Comma separated)</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={project.technologies?.join(", ") || ""}
                                                                onChange={e => {
                                                                    const newProjects = [...data.projects];
                                                                    newProjects[idx].technologies = e.target.value.split(",").map(t => t.trim());
                                                                    setData({ ...data, projects: newProjects });
                                                                }}
                                                                placeholder="React, Node.js..."
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Project Architecture</Label>
                                                            <textarea
                                                                className="w-full min-h-[100px] p-6 bg-white/5 border border-white/10 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm backdrop-blur-xl"
                                                                value={project.description || ""}
                                                                onChange={e => {
                                                                    const newProjects = [...data.projects];
                                                                    newProjects[idx].description = e.target.value;
                                                                    setData({ ...data, projects: newProjects });
                                                                }}
                                                                placeholder="Architectural overview and core achievements..."
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => setData({ ...data, projects: [...data.projects, { title: "", description: "", technologies: [], link: "" }] })}
                                                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-white/5 transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                                                >
                                                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <Plus className="w-5 h-5" />
                                                    </div>
                                                    Initialize Project Instance
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 5 && (
                                    <div className="space-y-12">
                                        <SectionHeader title="Distinctions & Recognition" icon={Sparkles} />
                                        <div className="space-y-6">
                                            {(data.honors || []).map((honor, idx) => (
                                                <div key={idx} className="flex gap-4 items-center group animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                                    <div className="flex-1 relative">
                                                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                            <Trophy className="w-4 h-4 text-blue-500/50" />
                                                        </div>
                                                        <Input
                                                            className="h-14 pl-14 pr-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl transition-all"
                                                            value={honor}
                                                            onChange={e => {
                                                                const newHonors = [...(data.honors || [])];
                                                                newHonors[idx] = e.target.value;
                                                                setData({ ...data, honors: newHonors });
                                                            }}
                                                            placeholder="e.g. Strategic Growth Award 2024"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newHonors = [...(data.honors || [])];
                                                            newHonors.splice(idx, 1);
                                                            setData({ ...data, honors: newHonors });
                                                        }}
                                                        className="p-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-xl backdrop-blur-xl"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setData({ ...data, honors: [...(data.honors || []), ""] })}
                                                className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-white/5 transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 group"
                                            >
                                                <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <Plus className="w-5 h-5" />
                                                </div>
                                                Initialize Recognition
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === 6 && (
                                    <div className="space-y-16">
                                        <div className="space-y-8">
                                            <SectionHeader title="Custom Architecture" icon={Layout} />

                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Neural Presets</Label>
                                                <div className="flex flex-wrap gap-3">
                                                    {[
                                                        { title: "Certifications", icon: ShieldCheck },
                                                        { title: "Languages", icon: Languages },
                                                        { title: "Volunteer Work", icon: Heart },
                                                        { title: "Publications", icon: BookOpen },
                                                        { title: "Awards", icon: Trophy },
                                                        { title: "References", icon: Users },
                                                        { title: "Technical Skills", icon: Terminal }
                                                    ].map((preset) => (
                                                        <button
                                                            key={preset.title}
                                                            onClick={() => setData({
                                                                ...data,
                                                                customSections: [
                                                                    ...(data.customSections || []),
                                                                    { id: Math.random().toString(36).substr(2, 9), title: preset.title, items: [{ description: "" }] }
                                                                ]
                                                            })}
                                                            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-blue-600/10 hover:border-blue-500/20 transition-all group"
                                                        >
                                                            <preset.icon className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                                                            {preset.title}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-12">
                                            {(data.customSections || []).map((section, sIdx) => (
                                                <div key={section.id} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative group shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                                                    <button
                                                        onClick={() => {
                                                            const newSections = [...(data.customSections || [])];
                                                            newSections.splice(sIdx, 1);
                                                            setData({ ...data, customSections: newSections });
                                                        }}
                                                        className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>

                                                    <div className="space-y-8">
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Section Identity</Label>
                                                            <Input
                                                                className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                                                value={section.title}
                                                                onChange={e => {
                                                                    const newSections = [...(data.customSections || [])];
                                                                    newSections[sIdx].title = e.target.value;
                                                                    setData({ ...data, customSections: newSections });
                                                                }}
                                                                placeholder="e.g. Certifications, Volunteer Work, Publications"
                                                            />
                                                        </div>

                                                        <div className="space-y-6">
                                                            {section.items.map((item, iIdx) => (
                                                                <div key={iIdx} className="p-6 bg-white/5 rounded-2xl border border-white/5 relative group/item">
                                                                    <button
                                                                        onClick={() => {
                                                                            const newSections = [...(data.customSections || [])];
                                                                            newSections[sIdx].items.splice(iIdx, 1);
                                                                            setData({ ...data, customSections: newSections });
                                                                        }}
                                                                        className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl opacity-0 group-hover/item:opacity-100 transition-all"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Node Title</Label>
                                                                            <Input
                                                                                className="h-10 px-4 bg-white/5 border-white/10 rounded-xl"
                                                                                value={item.title || ""}
                                                                                onChange={e => {
                                                                                    const newSections = [...(data.customSections || [])];
                                                                                    newSections[sIdx].items[iIdx].title = e.target.value;
                                                                                    setData({ ...data, customSections: newSections });
                                                                                }}
                                                                                placeholder="e.g. AWS Certified"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Sub-header</Label>
                                                                            <Input
                                                                                className="h-10 px-4 bg-white/5 border-white/10 rounded-xl"
                                                                                value={item.subtitle || ""}
                                                                                onChange={e => {
                                                                                    const newSections = [...(data.customSections || [])];
                                                                                    newSections[sIdx].items[iIdx].subtitle = e.target.value;
                                                                                    setData({ ...data, customSections: newSections });
                                                                                }}
                                                                                placeholder="e.g. Associate Level"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Temporal Marker</Label>
                                                                            <Input
                                                                                className="h-10 px-4 bg-white/5 border-white/10 rounded-xl"
                                                                                value={item.date || ""}
                                                                                onChange={e => {
                                                                                    const newSections = [...(data.customSections || [])];
                                                                                    newSections[sIdx].items[iIdx].date = e.target.value;
                                                                                    setData({ ...data, customSections: newSections });
                                                                                }}
                                                                                placeholder="Dec 2023"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Location</Label>
                                                                            <Input
                                                                                className="h-10 px-4 bg-white/5 border-white/10 rounded-xl"
                                                                                value={item.location || ""}
                                                                                onChange={e => {
                                                                                    const newSections = [...(data.customSections || [])];
                                                                                    newSections[sIdx].items[iIdx].location = e.target.value;
                                                                                    setData({ ...data, customSections: newSections });
                                                                                }}
                                                                                placeholder="Remote / City"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-4 space-y-2">
                                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Description</Label>
                                                                        <textarea
                                                                            className="w-full min-h-[80px] p-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white text-xs backdrop-blur-xl"
                                                                            value={item.description}
                                                                            onChange={e => {
                                                                                const newSections = [...(data.customSections || [])];
                                                                                newSections[sIdx].items[iIdx].description = e.target.value;
                                                                                setData({ ...data, customSections: newSections });
                                                                            }}
                                                                            placeholder="Detailed accomplishments..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() => {
                                                                    const newSections = [...(data.customSections || [])];
                                                                    newSections[sIdx].items.push({ description: "" });
                                                                    setData({ ...data, customSections: newSections });
                                                                }}
                                                                className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <Plus className="w-3 h-3" />
                                                                Append Sub-Node
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => setData({
                                                    ...data,
                                                    customSections: [
                                                        ...(data.customSections || []),
                                                        { id: Math.random().toString(36).substr(2, 9), title: "", items: [{ description: "" }] }
                                                    ]
                                                })}
                                                className="w-full py-8 border-2 border-dashed border-white/20 rounded-[2.5rem] bg-blue-600/5 text-blue-400 hover:bg-blue-600/10 hover:text-white transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                                            >
                                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <Plus className="w-5 h-5" />
                                                </div>
                                                Initialize Custom Block
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="pt-12 border-t border-white/5 flex items-center justify-between mt-20">
                                    <button
                                        onClick={prevStep}
                                        disabled={step === 1}
                                        className="flex items-center gap-3 px-8 py-5 text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-0 transition-all group"
                                    >
                                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        Previous Phase
                                    </button>
                                    {step < 6 ? (
                                        <button
                                            onClick={nextStep}
                                            className="flex items-center gap-3 px-12 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-2xl group"
                                        >
                                            Continue Evolution
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => downloadResume(data)}
                                            className="flex items-center gap-3 px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] group"
                                        >
                                            Generate Final Blueprint
                                            <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle className="w-1 bg-white/5 hover:bg-blue-500/30 transition-colors hidden lg:flex" />

                    {/* Preview Area */}
                    <ResizablePanel defaultSize={40} minSize={30} className="hidden lg:block">
                        <div id="preview-area" className="h-full bg-slate-900/50 overflow-y-auto custom-scrollbar relative p-8 pb-0">
                            <div className="sticky top-0 mb-8 flex items-center justify-between z-20">
                                <div className="flex items-center gap-3">
                                    <Layout className="w-4 h-4 text-blue-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Diagnostic Preview</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <div className="w-2 h-2 rounded-full bg-blue-500/20" />
                                    <div className="w-2 h-2 rounded-full bg-blue-500/10" />
                                </div>
                            </div>
                            <div className="relative group">
                                {/* Glass background for the paper */}
                                <div className="absolute -inset-4 bg-gradient-to-br from-blue-600/5 to-purple-600/5 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                                <ResumePreview data={data} />
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    )
}

export default function ResumeBuilderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Architect...</p>
                </div>
            </div>
        }>
            <ResumeBuilderContent />
        </Suspense>
    )
}

function SectionHeader({ title, icon: Icon }: { title: string, icon: any }) {
    return (
        <div className="flex items-center gap-6 mb-12 group">
            <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-3xl group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all duration-500">
                <Icon className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2 opacity-70 group-hover:opacity-100 transition-opacity">Architecture Core</h3>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{title}</h2>
            </div>
        </div>
    )
}
