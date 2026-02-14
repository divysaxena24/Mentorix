"use client"

import { UserProfile, SignedIn } from "@clerk/nextjs"
import { ArrowLeft, User, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
    return (
        <SignedIn>
            <div className="min-h-screen bg-slate-950 relative overflow-hidden flex flex-col pt-6">
                {/* Atmospheric Background Decorations */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[130px] -mr-64 -mt-64 rounded-full pointer-events-none" />
                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] -ml-48 rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-600/5 blur-[100px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto w-full px-8 lg:px-16 relative z-10 flex-1 flex flex-col">
                    {/* Header Section */}


                    {/* Profile Management Area */}
                    <div className="flex-1 flex justify-center pb-24">
                        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
                            <UserProfile
                                path="/dashboard/profile"
                                appearance={{
                                    elements: {
                                        rootBox: "w-full shadow-none",
                                        cardBox: "w-full shadow-none border-none",
                                        card: "bg-white/2 backdrop-blur-3xl border border-white/10 shadow-3xl rounded-[2.5rem] w-full p-8 md:p-12",
                                        navbar: "border-r border-white/5 pr-8 hidden md:flex",
                                        navbarButton: "text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest px-6 py-4 mb-2",
                                        navbarButton__active: "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]",
                                        scrollBox: "bg-transparent",
                                        pageScrollBox: "pt-0 md:pl-12",
                                        headerTitle: "text-2xl font-black text-white uppercase tracking-tight",
                                        headerSubtitle: "text-slate-400 text-sm font-medium leading-relaxed mt-2",
                                        profileSectionTitleText: "text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 mt-8",
                                        profileSectionContent: "border-b border-white/5 pb-8 mb-8",
                                        userPreviewMainIdentifier: "text-white font-black text-lg",
                                        userPreviewSecondaryIdentifier: "text-slate-500 text-sm font-semibold",
                                        formButtonPrimary: "bg-white text-black hover:bg-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest px-8 py-4 transition-all shadow-xl",
                                        formButtonReset: "text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest px-8 py-4 transition-all",
                                        formFieldLabel: "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1",
                                        formFieldInput: "bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl h-14 px-6 transition-all",
                                        accordionTriggerButton: "text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/5 rounded-2xl p-4 transition-all",
                                        badge: "bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-full font-black text-[9px] uppercase tracking-widest",
                                        breadcrumbsItem: "text-slate-500 text-[10px] uppercase font-black tracking-widest",
                                        breadcrumbsSeparator: "text-slate-700",
                                        breadcrumbsItem__active: "text-white",
                                        activeDeviceIcon: "text-blue-500",
                                        alert: "bg-red-500/10 border border-red-500/20 rounded-3xl text-red-200 p-6",
                                        alertTitle: "font-black uppercase tracking-widest text-[10px]",
                                        alertDescription: "text-sm mt-2 opacity-80"
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </SignedIn>
    )
}
