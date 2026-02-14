"use client"

import { useState } from "react"
import { SignInButton, SignedIn, SignedOut, UserButton, SignOutButton } from "@clerk/nextjs"
import Sidebar from "@/components/Sidebar"
import { FileText, Map, MessageCircle, FileEdit, Menu, Lightbulb, Sparkles, ArrowRight, TrendingUp, Target, Zap, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
    return (
        <div className="p-8 lg:p-16 space-y-12 max-w-7xl mx-auto pb-24">
            {/* AI Career Coach Banner */}
            <section className="relative overflow-hidden rounded-[3rem] bg-slate-900 border border-white/10 p-10 lg:p-16 text-white shadow-2xl group">
                {/* Visual Background Elements - Animated-style Blobs */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/25 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full -ml-32 -mb-32 animate-pulse delay-700"></div>
                <div className="absolute top-1/2 left-1/4 w-[200px] h-[200px] bg-cyan-500/10 blur-[80px] rounded-full animate-bounce duration-[10s]"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 border border-blue-500/20 backdrop-blur-md">
                        <Sparkles className="w-4 h-4" />
                        Next-Gen Career Intelligence
                    </div>

                    <h2 className="text-5xl lg:text-7xl font-black mb-8 tracking-tighter leading-[1] text-white max-w-4xl">
                        Architect Your Future with <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
                            Algorithmic Precision.
                        </span>
                    </h2>

                    <p className="text-slate-400 text-xl lg:text-2xl mb-12 leading-relaxed max-w-3xl font-medium">
                        "Your career trajectory, optimized. Forge unbeatable resumes, master market trends, and navigate custom-built learning paths."
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link href="/ai-tools">
                            <button className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-blue-700 hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] transition-all flex items-center gap-3 group/btn text-sm scale-110">
                                Launch Career AI
                                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Subtle Decorative Grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            </section>

            {/* Available AI Tools Section */}
            <section className="pt-8">
                <div className="mb-12 flex flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tight">AI Career Toolkit</h2>
                    </div>
                    <Link href="/ai-tools">
                        <button className="px-8 py-4 bg-white/5 hover:bg-white text-slate-400 hover:text-slate-950 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 group">
                            Explore Features
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Tool Cards */}
                    {[
                        { icon: MessageCircle, title: "Career Chat", sub: "24/7 Neural Guide", href: "/ai-tools/ai-chat", gradient: "from-blue-500 to-cyan-500", label: "Initialize" },
                        { icon: FileText, title: "Resume Builder", sub: "Guided Architect", href: "/ai-tools/resume-builder", gradient: "from-purple-500 to-pink-500", label: "Assemble" },
                        { icon: Map, title: "Roadmaps", sub: "Trajectory Engine", href: "/ai-tools/roadmap", gradient: "from-emerald-500 to-teal-500", label: "Generate" },
                    ].map((tool, i) => (
                        <div key={i} className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/[0.08] transition-all duration-500 backdrop-blur-2xl flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                            <div className={`w-20 h-20 rounded-[1.75rem] bg-gradient-to-br ${tool.gradient} p-0.5 mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.1)]`}>
                                <div className="w-full h-full bg-slate-900 rounded-[calc(1.75rem-2px)] flex items-center justify-center">
                                    <tool.icon className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                            <h3 className="font-black text-white text-2xl mb-2 tracking-tight">{tool.title}</h3>
                            <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] mb-10">{tool.sub}</p>
                            <Link href={tool.href} className="w-full mt-auto">
                                <button className="w-full py-4 bg-white/5 group-hover:bg-white text-slate-400 group-hover:text-slate-950 border border-white/10 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500">
                                    {tool.label}
                                </button>
                            </Link>

                            {/* Hover Decorative Glow */}
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem] pointer-events-none"></div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
