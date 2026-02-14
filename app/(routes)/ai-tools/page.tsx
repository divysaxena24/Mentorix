"use client"

import {
    Wrench,
    FileSearch,
    Map,
    FileText,
    MessageSquare,
    ArrowRight,
    Sparkles,
    Zap,
    Target,
    ShieldCheck
} from "lucide-react"
import Link from "next/link"

const tools = [
    {
        title: "Resume Analyzer",
        description: "Get a professional ATS score and 2-3 pages of detailed, actionable feedback to land your dream job.",
        icon: FileSearch,
        href: "/ai-tools/resume-analyzer",
        color: "from-blue-600 to-cyan-500",
        tag: "Most Popular",
        features: ["ATS Scoring", "Keyword Analysis", "Multi-page Report"]
    },
    {
        title: "Roadmap Generator",
        description: "AI-powered personalized learning paths tailored to your career goals and current skill level.",
        icon: Map,
        href: "/ai-tools/roadmap",
        color: "from-purple-600 to-pink-500",
        tag: "Career Growth",
        features: ["Step-by-step Guides", "Resource Links", "Skill Tracking"]
    },
    {
        title: "Cover Letter AI",
        description: "Generate high-converting, professional cover letters that match your resume and job description perfectly.",
        icon: FileText,
        href: "/ai-tools/cover-letter",
        color: "from-orange-600 to-amber-500",
        tag: "Job Ready",
        features: ["Smart Matching", "Tone Selection", "Instant Export"]
    },
    {
        title: "Career AI Chat",
        description: "Your 24/7 personal career coach. Ask anything from interview prep to salary negotiation.",
        icon: MessageSquare,
        href: "/ai-tools/ai-chat",
        color: "from-emerald-600 to-teal-500",
        tag: "AI Coach",
        features: ["Mock Interviews", "Salary Insights", "Real-time Advice"]
    },
    {
        title: "Resume Builder",
        description: "Create professional, ATS-friendly resumes using premium templates and expert guidance.",
        icon: FileText,
        href: "/ai-tools/resume-builder",
        color: "from-rose-600 to-pink-500",
        tag: "New Feature",
        features: ["Premium Templates", "Multi-step Builder", "Instant PDF Export"]
    }
]

export default function AiToolsHub() {
    return (
        <div className="p-8 lg:p-16 space-y-12 lg:space-y-16 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="border-b border-white/5 pb-12 mb-12">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                        <Wrench className="w-3 h-3" />
                        Core Workspace
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Features</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                        Explore our suite of AI-driven career tools designed to accelerate your professional growth.
                    </p>
                </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                {tools.map((tool, idx) => (
                    <div
                        key={tool.title}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        <Link href={tool.href} className="group block h-full">
                            <div className="relative h-full bg-white/5 backdrop-blur-2xl rounded-[3rem] p-1 border border-white/10 shadow-sm hover:shadow-[0_0_50px_rgba(37,99,235,0.1)] hover:border-white/20 transition-all duration-500 overflow-hidden">
                                {/* Dynamic Background Glow */}
                                <div className={`absolute -top-32 -right-32 w-80 h-80 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-[0.08] blur-[100px] transition-opacity duration-700`} />
                                <div className={`absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-[0.05] blur-[100px] transition-opacity duration-700`} />

                                <div className="relative p-10 lg:p-12 h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-10">
                                        <div className={`p-5 rounded-2xl bg-gradient-to-br ${tool.color} p-0.5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                            <div className="w-full h-full bg-slate-950 rounded-[calc(1rem-2px)] flex items-center justify-center p-3">
                                                <tool.icon className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                        <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-full group-hover:bg-blue-600/20 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                                            {tool.tag}
                                        </span>
                                    </div>

                                    <h3 className="text-3xl font-black text-white mb-4 tracking-tight">
                                        {tool.title}
                                    </h3>
                                    <p className="text-slate-400 font-medium leading-relaxed mb-8 flex-1">
                                        {tool.description}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                                        {tool.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-2.5 text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${tool.color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 text-white font-black text-sm uppercase tracking-[0.15em] transition-all group-hover:gap-5">
                                        Explore Tool
                                        <div className="w-8 h-px bg-white/20 group-hover:w-12 group-hover:bg-blue-500 transition-all" />
                                        <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}
