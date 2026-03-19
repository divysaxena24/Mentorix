"use client"

import { useState, useEffect } from "react"
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
    Sparkles,
    Clock,
    Loader2
} from "lucide-react"
import Link from "next/link"
import axios from "axios"
import { toast } from "sonner"
import { ResumeData } from "@/types"
import { downloadResume } from "@/components/resume/ResumeTemplates"
import ResumePreview from "@/components/resume/ResumePreview"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"

import ResumeSidebar from "./ResumeSidebar"
import ResumePersonalInfo from "./ResumePersonalInfo"
import ResumeExperience from "./ResumeExperience"
import ResumeEducation from "./ResumeEducation"
import ResumeSkillsProjects from "./ResumeSkillsProjects"
import ResumeHonors from "./ResumeHonors"
import ResumeCustomSections from "./ResumeCustomSections"

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

export default function ResumeClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const resumeId = searchParams.get("id")

    const [step, setStep] = useState(1)
    const [data, setData] = useState<ResumeData>(INITIAL_DATA)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(!!resumeId)
    const [sidebarSize, setSidebarSize] = useState(20)
    const [fetchingProfile, setFetchingProfile] = useState(false)

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

    const handleAutoFetch = async () => {
        setFetchingProfile(true)
        try {
            const response = await axios.get("/api/profile")
            const profile = response.data

            if (!profile) {
                toast.error("No profile data found. Please analyze your resume first.")
                return
            }

            // Map Professional Links
            const getLink = (platform: string) =>
                profile.links?.find((l: any) => l.platform.toLowerCase() === platform.toLowerCase())?.url || ""

            // Group Skills by Category
            const groupedSkills: any[] = []
            profile.skills?.forEach((s: any) => {
                const category = s.category || "General"
                let group = groupedSkills.find(g => g.category === category)
                if (!group) {
                    group = { category, skills: [] }
                    groupedSkills.push(group)
                }
                group.skills.push(s.skillName)
            })

            const mappedData: ResumeData = {
                ...INITIAL_DATA,
                personalInfo: {
                    fullName: profile.name || "",
                    email: profile.userEmail || "",
                    phone: "",
                    address: profile.location || "",
                    linkedin: getLink("LinkedIn"),
                    github: getLink("GitHub"),
                    leetcode: getLink("LeetCode"),
                    portfolio: getLink("Portfolio"),
                    summary: profile.currentRole ? `Professional ${profile.currentRole}` : "",
                },
                education: profile.education?.map((edu: any) => ({
                    institution: edu.institution,
                    degree: edu.degree,
                    location: "",
                    startDate: edu.startDate,
                    endDate: edu.endDate,
                    cgpa: edu.cgpa,
                    description: edu.description
                })) || [],
                experience: profile.experience?.map((exp: any) => ({
                    company: exp.company,
                    role: exp.role,
                    location: exp.location || "",
                    startDate: exp.startDate,
                    endDate: exp.endDate,
                    description: exp.description
                })) || [],
                skills: groupedSkills,
                projects: profile.projects?.map((proj: any) => {
                    let projectLinks = {}
                    try { projectLinks = JSON.parse(proj.links || "{}") } catch (e) { }
                    return {
                        title: proj.title,
                        description: proj.description,
                        technologies: proj.techStack?.split(",").map((s: string) => s.trim()) || [],
                        link: (projectLinks as any).github || (projectLinks as any).live || ""
                    }
                }) || [],
                honors: profile.achievements?.map((a: any) => a.title) || [],
                template: data.template || "corporate"
            }

            setData(mappedData)
            toast.success("Profile data loaded successfully!")
        } catch (error) {
            console.error("Auto-fetch error:", error)
            toast.error("Failed to fetch profile data")
        } finally {
            setFetchingProfile(false)
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
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
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
                        <Link href="/ai-tools" className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group" title="Back to Features">
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
                        </Link>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                                Resume Builder
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
                            onClick={handleAutoFetch}
                            disabled={fetchingProfile}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl group disabled:opacity-50"
                        >
                            {fetchingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                            Auto-Fetch from Profile
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-slate-300 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl backdrop-blur-xl group disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                            {searchParams.get("id") ? "Update Resume" : "Save Progress"}
                        </button>

                        <button
                            onClick={() => downloadResume(data)}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl group"
                        >
                            <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                            Download PDF
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
                        <ResumeSidebar
                            steps={steps}
                            currentStep={step}
                            onStepChange={setStep}
                            sidebarSize={sidebarSize}
                        />
                    </ResizablePanel>

                    <ResizableHandle className="w-1 bg-white/5 hover:bg-blue-500/30 transition-colors hidden xl:flex" />

                    {/* Form Area */}
                    <ResizablePanel defaultSize={40} minSize={30}>
                        <div id="form-area" className="h-full p-8 pb-0 lg:p-12 lg:pb-0 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700 bg-slate-950/40">
                            <div className="max-w-2xl mx-auto space-y-16">
                                {step === 1 && <ResumePersonalInfo data={data} onChange={setData} />}
                                {step === 2 && <ResumeExperience data={data} onChange={setData} />}
                                {step === 3 && <ResumeEducation data={data} onChange={setData} />}
                                {step === 4 && <ResumeSkillsProjects data={data} onChange={setData} />}
                                {step === 5 && <ResumeHonors data={data} onChange={setData} />}
                                {step === 6 && <ResumeCustomSections data={data} onChange={setData} />}

                                {/* Navigation Buttons */}
                                <div className="pt-12 border-t border-white/5 flex items-center justify-between mt-20">
                                    <button
                                        onClick={prevStep}
                                        disabled={step === 1}
                                        className="flex items-center gap-3 px-8 py-5 text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] disabled:opacity-0 transition-all group"
                                    >
                                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                        Previous Step
                                    </button>
                                    {step < 6 ? (
                                        <button
                                            onClick={nextStep}
                                            className="flex items-center gap-3 px-12 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-2xl group"
                                        >
                                            Next Step
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => downloadResume(data)}
                                            className="flex items-center gap-3 px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] group"
                                        >
                                            Generate PDF
                                            <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                                        </button>)}
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
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Document Preview</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <div className="w-2 h-2 rounded-full bg-blue-500/20" />
                                    <div className="w-2 h-2 rounded-full bg-blue-500/10" />
                                </div>
                            </div>
                            <div className="relative group">
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
