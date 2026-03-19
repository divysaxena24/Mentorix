"use client"

import { Sparkles, ArrowRight, FileText, Map, MessageCircle, TrendingUp, Target, Zap, ShieldCheck } from "lucide-react"
import Link from "next/link"

interface DashboardProps {
    metrics: {
        resumeScore: number;
        roadmapsGenerated: number;
        jobReadinessScore: number;
        docsGenerated: number;
    }
}

export default function DashboardContent({ metrics }: DashboardProps) {
    const metricCards = [
        {
            title: "Resume Score",
            value: metrics.resumeScore,
            sub: "ATS Optimization",
            icon: ShieldCheck,
            gradient: "from-blue-600 to-cyan-500",
            suffix: "%"
        },
        {
            title: "Roadmaps",
            value: metrics.roadmapsGenerated,
            sub: "Pathways Explored",
            icon: Map,
            gradient: "from-purple-600 to-pink-500",
            suffix: ""
        },
        {
            title: "Job Readiness",
            value: metrics.jobReadinessScore,
            sub: "Industry Alignment",
            icon: Target,
            gradient: "from-emerald-600 to-teal-500",
            suffix: "%"
        },
        {
            title: "AI Writing Studio",
            value: metrics.docsGenerated,
            sub: "Documents Generated",
            icon: Zap,
            gradient: "from-orange-600 to-red-500",
            suffix: ""
        }
    ];

    return (
        <div className="p-6 lg:p-6 space-y-16 max-w-7xl mx-auto pb-32">
            {/* Career Insights Section */}
            <section className="pt-0">
                <div className="mb-5">
                    <h2 className="text-3xl font-black text-white tracking-tight">Dashboard</h2>
                    <p className="text-slate-500 font-medium mt-2 uppercase tracking-wider text-xs">Real-time status of your career preparation</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metricCards.map((metric, i) => (
                        <div key={i} className="group relative glass-card rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-500 border-white/5 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.gradient} bg-opacity-10`}>
                                    <metric.icon className="w-6 h-6 text-white" />
                                </div>
                                <TrendingUp className="w-4 h-4 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{metric.title}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-white tracking-tighter">
                                        {metric.value}
                                    </span>
                                    <span className="text-lg font-bold text-slate-500">{metric.suffix}</span>
                                </div>
                                <p className="text-xs font-medium text-slate-500">{metric.sub}</p>
                            </div>

                            {/* Decorative background element */}
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${metric.gradient} blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Quick Access Tools */}
            <section className="pt-12">
                <div className="mb-16 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">AI Tools</h2>
                        <p className="text-slate-500 font-medium mt-2 uppercase tracking-wider text-xs">Available tools for your career</p>
                    </div>
                    <Link href="/ai-tools">
                        <button className="px-6 py-3 glass hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-4 group">
                            View All Tools
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                        { icon: MessageCircle, title: "Career Advisor", sub: "Strategic Guidance", href: "/ai-tools/ai-chat", gradient: "from-blue-600 to-cyan-500", label: "Initialize" },
                        { icon: FileText, title: "Resume Architect", sub: "Profile Construction", href: "/ai-tools/resume-builder", gradient: "from-purple-600 to-pink-500", label: "Initialize" },
                        { icon: Map, title: "Roadmaps", sub: "Learning Pathways", href: "/ai-tools/roadmap", gradient: "from-emerald-600 to-teal-500", label: "Initialize" },
                    ].map((tool, i) => (
                        <div key={i} className="group relative glass-card rounded-3xl py-6 px-8 hover:bg-white/[0.08] transition-all duration-700 backdrop-blur-3xl flex flex-col items-center text-center hover:-translate-y-4 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-white/5">
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${tool.gradient} p-0.5 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-[0_0_40px_rgba(0,0,0,0.3)]`}>
                                <div className="w-full h-full bg-slate-950 rounded-[calc(1.8rem-px)] flex items-center justify-center">
                                    <tool.icon className="w-10 h-10 text-white group-hover:scale-110 transition-all duration-700" />
                                </div>
                            </div>
                            <h3 className="font-black text-white text-2xl mb-2 tracking-tighter">{tool.title}</h3>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-6">{tool.sub}</p>
                            <Link href={tool.href} className="w-full mt-auto">
                                <button className="w-full py-4 glass group-hover:bg-blue-600 group-hover:text-white border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                                    {tool.label}
                                </button>
                            </Link>
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none"></div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
