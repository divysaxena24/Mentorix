"use client"

import { useState } from "react"
import { SignInButton, SignedIn, SignedOut, UserButton, SignOutButton } from "@clerk/nextjs"
import Sidebar from "@/components/Sidebar"
import { FileText, Map, MessageCircle, FileEdit, Menu, Lightbulb } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
    return (
        <div className="p-6 space-y-8">
            {/* AI Career Coach Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#b91c1c] via-[#7e22ce] to-[#1e40af] p-10 text-white shadow-xl">
                <div className="relative z-10 max-w-3xl">
                    <h2 className="text-4xl font-bold mb-4">Mentorix - Your AI Career Coach</h2>
                    <p className="text-zinc-100 text-lg mb-8 leading-relaxed">
                        "Smarter career decisions start here — get tailored advice, real-time market insights, and a roadmap built just for you with the power of AI."
                    </p>
                    <button className="px-6 py-3 bg-white text-zinc-900 rounded-xl font-semibold hover:bg-zinc-100 transition-colors shadow-lg">
                        Let's Get Started
                    </button>
                </div>
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            </section>

            {/* Available AI Tools Section */}
            <section>
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Available AI Tools</h2>
                    <p className="text-gray-500">Start Building and Shape Your Career with this exclusive AI Tools</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Tool Card 1 */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                            <MessageCircle className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">AI Career Q&A Chat</h3>
                        <p className="text-sm text-gray-500 mb-6">Chat with AI Agent</p>
                        <Link href="/ai-tools/ai-chat" className="w-full">
                            <button className="w-full py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                                Let's Chat
                            </button>
                        </Link>
                    </div>

                    {/* Tool Card 2 */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-orange-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">AI Resume Analyzer</h3>
                        <p className="text-sm text-gray-500 mb-6">Optimize your resume for ATS</p>
                        <Link href="/ai-tools/resume-analyzer" className="w-full">
                            <button className="w-full py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                                Start
                            </button>
                        </Link>
                    </div>

                    {/* Tool Card 3 */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                            <Map className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Learning Roadmap</h3>
                        <p className="text-sm text-gray-500 mb-6">Chat with AI Agent</p>
                        <Link href="/ai-tools/roadmap" className="w-full">
                            <button className="w-full py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                                Get Started
                            </button>
                        </Link>
                    </div>

                    {/* Tool Card 4 */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                            <FileEdit className="w-8 h-8 text-purple-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Cover Letter Generator</h3>
                        <p className="text-sm text-gray-500 mb-6">Chat with AI Agent</p>
                        <Link href="/ai-tools/cover-letter" className="w-full">
                            <button className="w-full py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                                Lets Generate
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    )
}
