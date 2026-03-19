"use client"

import { useState } from "react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, useClerk } from "@clerk/nextjs";
import { Sparkles, FileText, Map, MessageCircle, FileEdit, ArrowRight, Mail, Linkedin, Github } from "lucide-react";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LandingPage() {
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);
    const { signOut } = useClerk();

    const handleSignOut = async () => {
        await signOut({ redirectUrl: '/' });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col selection:bg-blue-500/30">
            {/* Navbar */}
            <header className="fixed w-full bg-slate-950/20 backdrop-blur-2xl border-b border-white/5 z-50">
                <div className="px-12 h-24 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] group-hover:rotate-3 transition-transform">
                            S
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter">
                            Mentorix
                        </h1>
                    </Link>

                    <div className="flex items-center gap-6">
                        <SignedOut>
                            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-sm font-black uppercase tracking-widest border border-white/10 transition-all">
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all">
                                    Join Now
                                </button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <button
                                onClick={() => setShowSignOutDialog(true)}
                                className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-sm font-black uppercase tracking-widest border border-red-500/20 transition-all"
                            >
                                Logout
                            </button>
                        </SignedIn>
                    </div>
                </div>
            </header>

            {/* Hero & Features Sections */}
            <main className="flex-1 pt-32 relative overflow-hidden">
                <section className="px-6 pb-24 relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 min-h-[80vh]">
                    {/* Left Side: Copy & CTAs */}
                    <div className="flex-1 text-left animate-fade-in-up">
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md">
                            <Sparkles className="w-4 h-4" />
                            AI Career Navigation Platform
                        </div>

                        <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-8 leading-[1.1]">
                            Architect Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 animate-gradient bg-[length:200%_auto]">
                                Career Trajectory.
                            </span>
                        </h2>

                        <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed font-medium">
                            Get a measurable Job Readiness Score, optimize your resume, and apply smarter with AI-driven insights.
                        </p>

                        <div className="flex flex-col sm:flex-row items-start justify-start gap-4 mt-4">
                            <SignedIn>
                                <Link href="/dashboard">
                                    <button className="relative group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:-translate-y-1 flex items-center justify-center gap-3 w-full sm:w-auto">
                                        Go to Dashboard
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </SignedIn>
                            <SignedOut>
                                <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                                    <button className="relative group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:-translate-y-1 flex items-center justify-center gap-3 w-full sm:w-auto">
                                        Get Started
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </SignUpButton>
                            </SignedOut>
                        </div>
                    </div>

                    {/* Right Side: Floating Dashboard Preview */}
                    <div className="flex-1 w-full lg:w-auto relative perspective:1000px mt-12 lg:mt-0">
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full animate-pulse-glow"></div>

                        <div className="relative w-full max-w-lg mx-auto transform-gpu lg:rotate-y-[-10deg] rotate-x-[5deg] animate-float transition-all duration-700 ease-out hover:rotate-0 hover:scale-[1.02]">
                            <div className="glass-card rounded-[2rem] p-6 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-900/60 backdrop-blur-2xl relative overflow-hidden">
                                {/* Mock UI Header */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white text-sm font-bold">Mentorix Analytics</h4>
                                            <p className="text-slate-500 text-xs">Real-time metrics</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                        Live
                                    </div>
                                </div>

                                {/* Score Cards */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 shadow-inner">
                                        <p className="text-slate-400 text-xs mb-2">Job Readiness Score</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-black text-white">72%</span>
                                            <span className="text-emerald-400 text-[10px] mb-1 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">↑ 12%</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[72%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5 shadow-inner">
                                        <p className="text-slate-400 text-xs mb-2">Resume Match</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-black text-white">85%</span>
                                            <span className="text-emerald-400 text-[10px] mb-1 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">↑ 5%</span>
                                        </div>
                                        <div className="flex -space-x-2 mt-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-500 border border-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-md">TS</div>
                                            <div className="w-6 h-6 rounded-full bg-purple-500 border border-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-md">Re</div>
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 border border-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-md">Nd</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Feedback Snippet */}
                                <div className="bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl p-4 border border-blue-500/10 hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageCircle className="w-4 h-4 text-blue-400" />
                                        <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Interview Feedback</span>
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        "Your explanation of system design was clear. To improve, focus on discussing trade-offs between monolithic vs microservices."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-32 relative z-10 border-t border-white/5 bg-[#020617]/50">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                                Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Get Hired</span>
                            </h2>
                            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
                                AI modules designed to optimize every stage of your career journey.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { icon: MessageCircle, title: "Career Advisor", desc: "AI chatbot delivering on-demand, personalized career guidance.", accent: "from-blue-500 to-cyan-400" },
                                { icon: FileText, title: "Resume Architect", desc: "Gain a competitive edge with professionally AI-optimized resumes.", accent: "from-purple-500 to-indigo-500" },
                                { icon: FileEdit, title: "ATS Optimization", desc: "Receive actionable feedback to maximize applicant tracking system scores.", accent: "from-orange-500 to-rose-500" },
                                { icon: Map, title: "Smart Roadmaps", desc: "Discover interactive learning pathways tailored to your target roles.", accent: "from-emerald-500 to-teal-400" },
                                { icon: Sparkles, title: "AI Mentorship", desc: "Practice with realistic AI interviews and get instant actionable feedback.", accent: "from-cyan-500 to-blue-600" },
                                { icon: FileText, title: "Readiness Score", desc: "Track your overall job-readiness with our proprietary AI scoring metric.", accent: "from-fuchsia-500 to-pink-500" },
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="group relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.04] hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:border-white/10 hover:-translate-y-2 flex flex-col h-full animate-fade-in-up"
                                    style={{ animationDelay: `${(i % 3) * 100 + 100}ms`, animationFillMode: "both" }}
                                >
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.accent} p-[1px] mb-8 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                                        <div className="w-full h-full bg-[#020617] rounded-[15px] flex items-center justify-center relative overflow-hidden group-hover:bg-[#020617]/80 transition-colors">
                                            <feature.icon className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{feature.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed flex-grow font-medium">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Dynamic Background Elements */}
                <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-20 bg-[#020617]">
                    {/* Main glow top */}
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
                    {/* Main glow bottom right */}
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full"></div>
                    {/* Subtle Grid overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_100%,transparent_100%)]"></div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-slate-950/80 backdrop-blur-xl py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 text-slate-500">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">S</div>
                        <span className="font-black text-xl text-white tracking-tighter">Mentorix</span>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest">© 2026 Mentorix. Built for Hackathon Excellence.</p>
                    <div className="flex items-center gap-8">
                        <a href="mailto:divysaxena2402@gmail.com" className="hover:text-blue-400 transition-all hover:scale-110" title="Email">
                            <Mail className="w-6 h-6" />
                        </a>
                        <a href="https://linkedin.com/in/divyasaxena24/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-all hover:scale-110" title="LinkedIn">
                            <Linkedin className="w-6 h-6" />
                        </a>
                        <a href="https://github.com/divysaxena24" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-all hover:scale-110" title="GitHub">
                            <Github className="w-6 h-6" />
                        </a>
                    </div>
                    <div className="flex gap-8 text-sm font-black uppercase tracking-widest">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
            {/* Confirm Sign Out Dialog */}
            <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            You will need to log in again to access Mentorix's full features.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSignOut}
                            className="bg-red-600 hover:bg-red-700 text-white border-none rounded-xl"
                        >
                            Sign Out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
