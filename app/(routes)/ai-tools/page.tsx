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
    }
]

export default function AiToolsHub() {
    return (
        <div className="space-y-12 italic">
            {/* Hero Section */}
            <div className="max-w-4xl space-y-4">
                <div
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/20 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]"
                >
                    <Sparkles className="w-3 h-3" />
                    Career Suite v5.0.1
                </div>
                <h1
                    className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.9]"
                >
                    SUPERCHARGE YOUR <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 pb-2 uppercase italic">Career Growth.</span>
                </h1>
                <p
                    className="text-lg text-gray-400 font-semibold max-w-2xl leading-relaxed italic"
                >
                    High-performance AI tools engineered to decode your resume, simulate interviews, and map your professional ascent.
                </p>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl pb-20">
                {tools.map((tool, idx) => (
                    <div
                        key={tool.title}
                    >
                        <Link href={tool.href} className="group block h-full cursor-pointer">
                            <div className="relative h-full bg-gray-900 rounded-[3rem] p-1 border border-gray-800 shadow-sm hover:shadow-2xl hover:border-blue-900/50 transition-all duration-500 overflow-hidden">
                                {/* Decorative Glow */}
                                <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-[0.03] blur-[80px] transition-opacity duration-500`} />

                                <div className="relative p-10 h-full flex flex-col">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className={`p-4 rounded-[1.5rem] bg-gradient-to-br ${tool.color} text-white shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                                            <tool.icon className="w-7 h-7" />
                                        </div>
                                        <span className="px-3 py-1 bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            {tool.tag}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl font-black text-white mb-4 group-hover:text-blue-400 transition-colors">
                                        {tool.title}
                                    </h3>
                                    <p className="text-gray-400 font-bold leading-relaxed mb-8 flex-1 italic">
                                        {tool.description}
                                    </p>

                                    <div className="space-y-4 mb-10">
                                        {tool.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-2 text-xs font-black text-gray-400 group-hover:text-gray-600 transition-colors">
                                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${tool.color} opacity-40`} />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 text-white font-black text-sm group-hover:gap-4 transition-all uppercase tracking-widest">
                                        Open Tool
                                        <ArrowRight className="w-4 h-4 text-blue-400" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {/* Footer Branding - This will be part of the DashboardLayout/Global Footer anyway */}
        </div>
    )
}
