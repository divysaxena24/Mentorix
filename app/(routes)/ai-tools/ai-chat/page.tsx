"use client"

import { useState, useEffect } from "react"
import { Plus, Send, History, X, MessageSquare, Copy, Check, Trash2 } from "lucide-react"
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const CodeBlock = ({ language, value }: { language: string; value: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4 rounded-xl overflow-hidden border border-gray-800 shadow-xl bg-[#1e1e1e]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] text-gray-300 text-xs font-mono">
                <span>{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                language={language || 'text'}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    padding: '1.5rem',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    background: 'transparent',
                }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    );
};

export default function AIChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState<any[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [chatTitle, setChatTitle] = useState<string | null>(null)

    useEffect(() => {
        if (showHistory) {
            fetchHistory()
        }
    }, [showHistory])

    const fetchHistory = async () => {
        try {
            const result = await axios.get("/api/ai-career-chat-agent/history")
            setHistory(result.data)
        } catch (error) {
            console.error("Error fetching history:", error)
        }
    }

    const saveMessageToHistory = async (role: string, content: string, chatIdToUse: string, titleToUse: string) => {
        try {
            await axios.post("/api/ai-career-chat-agent/history", {
                role,
                content,
                chatId: chatIdToUse,
                chatTitle: titleToUse
            })
        } catch (error) {
            console.error("Error saving to history:", error)
        }
    }

    const loadChatSession = async (chatId: string) => {
        try {
            setLoading(true)
            const result = await axios.get(`/api/ai-career-chat-agent/history?chatId=${chatId}`)
            setMessages(result.data.map((m: any) => ({ role: m.role, content: m.content })))
            setCurrentChatId(chatId)
            setChatTitle(result.data[0]?.chatTitle || "History Chat")
            setShowHistory(false)
            setLoading(false)
        } catch (error) {
            console.error("Error loading chat session:", error)
            setLoading(false)
        }
    }

    const handleSend = async (textOverride?: string) => {
        const messageText = textOverride || input
        if (!messageText.trim() || loading) return

        let activeChatId = currentChatId
        let activeTitle = chatTitle

        // Generate new session if none exists
        if (!activeChatId) {
            activeChatId = crypto.randomUUID()
            activeTitle = messageText.length > 40 ? messageText.substring(0, 40) + "..." : messageText
            setCurrentChatId(activeChatId)
            setChatTitle(activeTitle)
        }

        // Add user message immediately
        const userMessage: Message = { role: "user", content: messageText }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setLoading(true)

        // Save user message
        if (activeChatId && activeTitle) {
            saveMessageToHistory("user", messageText, activeChatId, activeTitle)
        }

        try {
            const result = await axios.post("/api/ai-career-chat-agent", {
                userInput: messageText,
            })

            const aiResponse = result.data.output;
            if (!aiResponse) throw new Error("No response received from AI");

            const aiMessage: Message = {
                role: "assistant",
                content: aiResponse
            }
            setMessages(prev => [...prev, aiMessage]);
            setLoading(false);

            // Save AI message
            if (activeChatId && activeTitle) {
                saveMessageToHistory("assistant", aiResponse, activeChatId, activeTitle)
            }

        } catch (error) {
            console.error("Chat Error:", error)
            const errorMessage: Message = { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
            setMessages(prev => [...prev, errorMessage])
            setLoading(false)
        }
    }

    const recommendations = [
        "How can I improve my resume for a Software Engineer role?",
        "What are the most in-demand skills in AI right now?",
        "Can you help me prepare for a behavioral interview?",
        "How do I transition from Marketing to Data Science?"
    ]

    const handleRecommendationClick = (question: string) => {
        setInput(question)
    }

    const startNewChat = () => {
        setMessages([])
        setCurrentChatId(null)
        setChatTitle(null)
    }

    const handleDeleteChat = async (chatId: string) => {
        try {
            await axios.delete(`/api/ai-career-chat-agent/history?chatId=${chatId}`);
            if (currentChatId === chatId) {
                startNewChat();
            }
            fetchHistory();
        } catch (error) {
            console.error("Error deleting chat:", error);
        }
    };

    return (
        <div className="pt-6 p-2 lg:p-0 flex flex-col h-full lg:h-[calc(100vh-80px)] bg-white relative">
            {/* Top Header Section */}
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-8 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>

            <div className="p-12 pt-0 pb-8 flex justify-between items-start shrink-0">
                <div className="max-w-4xl">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {chatTitle || "AI Career Q&A Chat"}
                    </h1>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        Smarter career decisions start here — get tailored advice, real-time market insights, and a roadmap built just for you with the power of AI.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowHistory(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all shadow-sm"
                    >
                        <History className="w-4 h-4" />
                        <span>History</span>
                    </button>
                    <button
                        onClick={startNewChat}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Chat</span>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-12 py-4 flex flex-col">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">How can I help you today?</h2>
                            <p className="text-gray-500 text-sm">Select a suggested topic or type your own question below.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {recommendations.map((question, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleRecommendationClick(question)}
                                    className="p-4 text-left bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-gray-400 hover:bg-gray-100 transition-all shadow-sm group"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`mb-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-zinc-900 text-white rounded-tr-none'
                                : 'bg-gray-100 text-gray-900 rounded-tl-none prose prose-sm prose-zinc max-w-none'
                                }`}>
                                {msg.role === 'assistant' ? (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2 border-b border-gray-200 pb-1" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1 my-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-1 my-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="font-semibold text-black" {...props} />,
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <CodeBlock
                                                        language={match[1]}
                                                        value={String(children).replace(/\n$/, '')}
                                                        {...props}
                                                    />
                                                ) : (
                                                    <code className="bg-gray-200 px-1.5 py-0.5 rounded text-[11px] font-mono text-pink-600" {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Input Area */}
            <div className="px-8 pb-10 pt-4 bg-white shrink-0 border-t border-gray-100/50 mt-auto">
                <div className="max-w-6xl mx-auto flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type here"
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all text-gray-900 placeholder:text-gray-400 shadow-sm"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shrink-0"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-5 h-5 -rotate-45 -translate-y-0.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* History Overlay Panel */}
            {showHistory && (
                <div className="absolute inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Chat History</h3>
                                <p className="text-xs text-gray-500">Your past conversations</p>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-all">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-gray-400 text-sm">No history found yet.</p>
                                </div>
                            ) : (
                                history.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => loadChatSession(item.chatId)}
                                        className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-black hover:bg-gray-50 transition-all group relative flex items-start gap-3 shadow-sm cursor-pointer"
                                    >
                                        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-black group-hover:text-white transition-all text-gray-400">
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Chat History?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete this conversation and all its messages.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteChat(item.chatId)}
                                                                className="bg-red-600 hover:bg-red-700"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                                {item.chatTitle || "Untitled Chat"}
                                            </h4>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
