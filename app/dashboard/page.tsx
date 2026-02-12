"use client"

import { useState } from "react"
import { SignInButton, SignedIn, SignedOut, UserButton, SignOutButton } from "@clerk/nextjs"
import Sidebar from "@/components/Sidebar"
import { FileText, Map, MessageCircle, FileEdit, Menu, Lightbulb, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
    return (
        <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
            {/* AI Career Coach Banner */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/5 p-8 lg:p-12 text-white shadow-2xl">
                {/* Visual Background Elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full -ml-32 -mb-32"></div>

                <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-blue-500/20">
                        <Sparkles className="w-3 h-3" />
                        AI Career Intelligence
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight leading-tight">
                        Elevate Your Career with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            Precision AI.
                        </span>
                    </h2>
                    <p className="text-slate-400 text-lg mb-10 leading-relaxed max-w-2xl font-medium">
                        "Smarter career decisions start here — get tailored advice, real-time market insights, and a roadmap built just for you with the power of AI."
                    </p>
                    <Link href="/ai-tools">
                        <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all flex items-center gap-2">
                            Get Your Career Insights
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </Link>
                </div>
            </section>

            {/* Available AI Tools Section */}
            <section>
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Available AI Tools</h2>
                        <p className="text-slate-500 font-medium">Power up your career search with our proprietary AI toolset.</p>
                    </div>
                    <Link href="/ai-tools">
                        <button className="px-6 py-3 bg-white/5 hover:bg-white text-slate-400 hover:text-slate-950 border border-white/10 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 group">
                            Explore All Features
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tool Cards */}
                    {[
                        { icon: MessageCircle, title: "Career Chat", sub: "24/7 AI Guidance", href: "/ai-tools/ai-chat", color: "blue", gradient: "from-blue-500 to-cyan-500", label: "Let's Chat" },
                        { icon: FileText, title: "Resume Scanner", sub: "ATS Optimization", href: "/ai-tools/resume-analyzer", color: "purple", gradient: "from-purple-500 to-pink-500", label: "Analyze Now" },
                        { icon: Map, title: "Career Roadmaps", sub: "Step-by-Step Paths", href: "/ai-tools/roadmap", color: "emerald", gradient: "from-emerald-500 to-teal-500", label: "Generate" },
                    ].map((tool, i) => (
                        <div key={i} className="group relative bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:bg-white/[0.08] transition-all duration-300 backdrop-blur-xl flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-[1.25rem] bg-gradient-to-br ${tool.gradient} p-0.5 mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                <div className="w-full h-full bg-slate-900 rounded-[calc(1.25rem-2px)] flex items-center justify-center">
                                    <tool.icon className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <h3 className="font-extrabold text-white text-lg mb-1">{tool.title}</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8">{tool.sub}</p>
                            <Link href={tool.href} className="w-full mt-auto">
                                <button className="w-full py-3.5 bg-white/5 hover:bg-white text-slate-400 hover:text-slate-950 border border-white/10 rounded-xl text-sm font-bold transition-all">
                                    {tool.label}
                                </button>
                            </Link>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
