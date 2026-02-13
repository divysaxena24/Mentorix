"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import { MessageSquare, Calendar, User, Bot, AlertCircle } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { ChatMessage } from "@/types"

export default function SharedChatPage() {
    const { chatId } = useParams()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchChat = async () => {
            try {
                const response = await axios.get(`/api/ai-career-chat-agent/public-chat?chatId=${chatId}`)
                setMessages(response.data)
            } catch (err: any) {
                setError(err.response?.data?.error || "Failed to load chat")
            } finally {
                setLoading(false)
            }
        }
        if (chatId) fetchChat()
    }, [chatId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                <p className="text-gray-500 animate-pulse">Loading shared conversation...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Unavailable</h1>
                    <p className="text-gray-500 mb-8">{error}</p>
                    <a href="/" className="inline-block px-8 py-3 bg-black text-white rounded-xl font-bold transition-transform hover:scale-105">
                        Back to Mentorix
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-zinc-200 rotate-3 group">
                            <MessageSquare className="w-6 h-6 -rotate-3 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h1 className="text-xl font-black text-zinc-900 tracking-tight">Shared Chat</h1>
                                <span className="px-2 py-0.5 bg-zinc-100 text-[10px] uppercase font-black tracking-widest text-zinc-500 rounded-full border border-zinc-200">Public</span>
                            </div>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Powered by Mentorix AI</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-0.5">Shared On</span>
                            <div className="flex items-center gap-2 text-zinc-900 border border-zinc-100 bg-zinc-50 px-3 py-1 rounded-full">
                                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                                <span className="text-xs font-black">
                                    {messages.length > 0 ? new Date(messages[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ""}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Banner */}
            <div className="bg-gradient-to-r from-zinc-50 to-white border-b border-zinc-100 py-4 overflow-hidden">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex items-center gap-2 whitespace-nowrap animate-marquee">
                        {[...Array(10)].map((_, i) => (
                            <span key={i} className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 flex items-center gap-2">
                                Shared Conversation <div className="w-1 h-1 bg-zinc-200 rounded-full" />
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Content */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16">
                <div className="space-y-12">
                    {messages.map((item, idx) => (
                        <div key={idx} className={`relative flex gap-6 ${item.role === 'user' ? 'opacity-100' : ''}`}>
                            {/* Vertical Line for Bot */}
                            {item.role === 'assistant' && (
                                <div className="absolute left-6 top-16 bottom-0 w-px bg-zinc-100 -mb-12" />
                            )}

                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-transform hover:scale-110 duration-300 ${item.role === 'user'
                                ? 'bg-white border-zinc-100 text-zinc-400'
                                : 'bg-zinc-900 border-zinc-900 text-white shadow-lg shadow-zinc-200'
                                }`}>
                                {item.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                            </div>

                            <div className={`flex-1 overflow-hidden p-8 rounded-[2rem] border transition-all duration-300 ${item.role === 'user'
                                ? 'bg-white border-zinc-100 text-zinc-700 hover:border-zinc-200 shadow-sm'
                                : 'bg-transparent border-transparent text-zinc-800'
                                }`}>
                                {item.role === 'assistant' && <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Mentorix Assistant</p>}
                                <div className="prose prose-base max-w-none prose-zinc lg:prose-lg select-text">
                                    <ReactMarkdown components={{
                                        h2: ({ node, ...props }) => <h2 className="text-2xl font-black mt-8 mb-4 text-zinc-900" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-xl font-black mt-6 mb-3 text-zinc-800" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-3 my-6 marker:text-zinc-900" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-3 my-6 marker:text-zinc-900" {...props} />,
                                        p: ({ node, ...props }) => <p className="leading-relaxed mb-6 last:mb-0 text-zinc-600 font-medium" {...props} />,
                                        code: ({ node, ...props }) => <code className="bg-zinc-100 px-2 py-1 rounded text-zinc-900 font-mono text-[0.9em] border border-zinc-200" {...props} />,
                                        pre: ({ node, ...props }) => <pre className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 my-8 overflow-x-auto shadow-2xl" {...props} />
                                    }}>
                                        {item.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Call To Action */}
                <div className="mt-24 pt-24 border-t border-zinc-100">
                    <div className="bg-zinc-900 rounded-[3rem] p-12 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32 group-hover:scale-150 transition-transform duration-700" />

                        <div className="relative z-10">
                            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Ready to build your career?</h2>
                            <p className="text-zinc-400 text-lg mb-10 font-medium max-w-xl mx-auto">
                                Join Mentorix today and get personalized career roadmaps, resume analysis, and expert technical guidance.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a href="/" className="px-10 py-4 bg-white text-zinc-900 rounded-2xl font-black text-lg transition-transform hover:scale-105 active:scale-95 shadow-xl">
                                    Get Started Free
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-zinc-50 border-t border-zinc-100 py-12 text-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-black text-xl">M</div>
                        <span className="text-2xl font-black text-zinc-900 tracking-tighter">Mentorix</span>
                    </div>
                    <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.3em]">Igniting Technical Careers</p>
                    <div className="w-12 h-1 bg-zinc-200 rounded-full" />
                </div>
            </footer>
        </div>
    )
}
