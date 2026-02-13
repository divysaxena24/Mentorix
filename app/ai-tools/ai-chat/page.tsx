"use client"

import { useState, useEffect } from "react"
import { Plus, Send, History, X, MessageSquare, Copy, Check, Trash2, Sparkles, Loader2, Share2, Globe, Link as LinkIcon, ArrowLeft } from "lucide-react"
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

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
        <div className="relative group my-6 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900/50 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <span>{language || 'code'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 hover:text-white transition-all"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
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
                    padding: '2rem',
                    fontSize: '13px',
                    lineHeight: '1.7',
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
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [isShared, setIsShared] = useState(false)
    const [sharingLoading, setSharingLoading] = useState(false)

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
            checkSharingStatus(chatId)
        } catch (error) {
            console.error("Error loading chat session:", error)
            setLoading(false)
        }
    }

    const checkSharingStatus = async (chatId: string) => {
        try {
            const result = await axios.get(`/api/ai-career-chat-agent/share?chatId=${chatId}`)
            setIsShared(result.data.shared)
        } catch (error) {
            console.error("Error checking sharing status:", error)
        }
    }

    const toggleSharing = async () => {
        if (!currentChatId) return
        setSharingLoading(true)
        try {
            const nextShared = !isShared
            await axios.post("/api/ai-career-chat-agent/share", {
                chatId: currentChatId,
                shared: nextShared
            })
            setIsShared(nextShared)
            toast.success(nextShared ? "Sharing enabled!" : "Sharing disabled.")
        } catch (error) {
            console.error("Error toggling sharing:", error)
            toast.error("Failed to update sharing settings.")
        } finally {
            setSharingLoading(false)
        }
    }

    const copyShareLink = () => {
        const url = `${window.location.origin}/share/${currentChatId}`
        navigator.clipboard.writeText(url)
        toast.success("Link copied to clipboard!")
    }

    const handleSend = async (textOverride?: string) => {
        const messageText = textOverride || input
        if (!messageText.trim() || loading) return

        let activeChatId = currentChatId
        let activeTitle = chatTitle

        if (!activeChatId) {
            activeChatId = crypto.randomUUID()
            activeTitle = messageText.length > 40 ? messageText.substring(0, 40) + "..." : messageText
            setCurrentChatId(activeChatId)
            setChatTitle(activeTitle)
        }

        const userMessage: Message = { role: "user", content: messageText }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setLoading(true)

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
        handleSend(question)
    }

    const startNewChat = () => {
        setMessages([])
        setCurrentChatId(null)
        setChatTitle(null)
    }

    const handleDeleteChat = async (chatId: string) => {
        try {
            await axios.delete(`/api/ai-career-chat-agent/history?chatId=${chatId}`);
            toast.success("Chat history deleted successfully");
            if (currentChatId === chatId) {
                startNewChat();
            }
            fetchHistory();
        } catch (error) {
            console.error("Error deleting chat:", error);
            toast.error("Failed to delete chat history");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -mr-48 -mt-48 rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] -ml-48 -mb-48 rounded-full pointer-events-none" />

            {/* Top Header Section */}
            <div className="max-w-7xl mx-auto px-6 py-8 w-full">


                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">

                    {/* shifting history and new sessions button to the right and back to dashboard to the left */}
                    <div className="flex items-center justify-between w-full">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-0 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Back to Dashboard</span>
                        </Link>

                        <div className="flex items-center gap-3">
                            {currentChatId && (
                                <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
                                    <DialogTrigger asChild>
                                        <button
                                            onClick={() => setIsShareModalOpen(true)}
                                            className="flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl backdrop-blur-xl"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            <span>Share</span>
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-[2.5rem] sm:max-w-[540px] w-[95vw] p-8 sm:p-14 border-white/10 shadow-2xl bg-slate-900/90 backdrop-blur-2xl text-white flex flex-col gap-0 overflow-hidden">
                                        <DialogHeader className="text-left mb-10 w-full">
                                            <DialogTitle className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight uppercase text-left">
                                                Share this <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 italic">Conversation</span>
                                            </DialogTitle>
                                            <DialogDescription className="text-slate-400 text-base sm:text-lg font-medium leading-relaxed mt-4 text-left">
                                                Make this conversation public to generate a unique shareable link for others to view.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="flex flex-col gap-8 w-full">
                                            <div className={`w-full flex items-center justify-between p-6 sm:p-8 rounded-[2rem] border transition-all duration-500 ${isShared ? 'bg-white/5 border-white/20 shadow-[0_0_50px_rgba(37,99,235,0.2)]' : 'bg-white/5 border-white/10'}`}>
                                                <div className="flex items-center gap-6 min-w-0 pr-2">
                                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${isShared ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-slate-500'}`}>
                                                        <Globe className={`w-6 h-6 sm:w-8 sm:h-8 ${isShared ? 'animate-pulse' : ''}`} />
                                                    </div>
                                                    <div className="min-w-0 flex flex-col">
                                                        <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] mb-1 ${isShared ? 'text-blue-400' : 'text-slate-500'}`}>
                                                            Visibility
                                                        </span>
                                                        <span className={`text-lg sm:text-2xl font-black truncate ${isShared ? 'text-white' : 'text-slate-400'}`}>
                                                            {isShared ? 'Public Access' : 'Private'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={isShared}
                                                    onCheckedChange={toggleSharing}
                                                    disabled={sharingLoading}
                                                    className="scale-125 data-[state=checked]:bg-blue-600"
                                                />
                                            </div>

                                            {isShared && (
                                                <div className="flex flex-col gap-5 w-full animate-in fade-in slide-in-from-top-6 duration-700">
                                                    <div className="group relative w-full">
                                                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                                            <LinkIcon className="w-4 h-4 text-blue-400" />
                                                        </div>
                                                        <div className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-[12px] sm:text-[13px] font-mono text-slate-400 overflow-hidden truncate shadow-inner group-hover:border-white/20 transition-all">
                                                            {window.location.host}/share/{currentChatId}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={copyShareLink}
                                                        className="w-full flex items-center justify-center gap-4 py-5 sm:py-6 bg-white text-black rounded-[1.8rem] font-black text-lg transition-all hover:bg-slate-200 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.98] group"
                                                    >
                                                        <Copy className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-12" />
                                                        <span className="uppercase tracking-widest text-sm">Copy Share Link</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                            <button
                                onClick={() => setShowHistory(true)}
                                className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-xl backdrop-blur-xl"
                            >
                                <History className="w-4 h-4" />
                                <span>History</span>
                            </button>
                            <button
                                onClick={startNewChat}
                                className="flex items-center gap-3 px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl group"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                                <span>New Session</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col space-y-12 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
                        <div className="text-center mb-16 space-y-6">
                            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border border-white/10 group animate-bounce duration-[3s]">
                                <MessageSquare className="w-12 h-12 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">How can I <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 italic">Help You?</span></h2>
                                <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto leading-relaxed">Select a tailored prompt below or start typing to begin your strategic session.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full px-4">
                            {recommendations.map((question, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleRecommendationClick(question)}
                                    className="p-8 text-left bg-white/5 border border-white/10 rounded-[2.5rem] text-sm text-slate-400 hover:border-blue-500/50 hover:bg-white/10 hover:text-white transition-all shadow-xl group relative overflow-hidden backdrop-blur-xl"
                                >
                                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative z-10 font-bold leading-relaxed">{question}</div>
                                    <div className="absolute bottom-4 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <Send className="w-4 h-4 text-blue-500" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto w-full space-y-10">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                                <div className={`max-w-[85%] relative ${msg.role === 'user' ? 'w-fit' : 'w-full'}`}>
                                    <div className={`p-8 rounded-[2.5rem] text-base leading-relaxed font-medium shadow-2xl backdrop-blur-3xl ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none border border-blue-400/30'
                                        : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-none prose prose-invert prose-slate max-w-none'
                                        }`}>
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h1: ({ node, ...props }) => <h1 className="text-3xl font-black mt-10 mb-6 uppercase tracking-tight text-white text-left" {...props} />,
                                                    h2: ({ node, ...props }) => <h2 className="text-2xl font-black mt-10 mb-4 border-b border-white/10 pb-4 text-white uppercase tracking-tight text-left" {...props} />,
                                                    h3: ({ node, ...props }) => <h3 className="text-xl font-black mt-8 mb-3 text-white tracking-tight text-left" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-3 my-6 text-slate-300 text-left" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-3 my-6 text-slate-300 text-left" {...props} />,
                                                    li: ({ node, ...props }) => <li className="pl-2 leading-relaxed text-left" {...props} />,
                                                    p: ({ node, ...props }) => <p className="mb-6 last:mb-0 leading-relaxed text-slate-300 text-left" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="font-black text-white uppercase tracking-wide" {...props} />,
                                                    code({ node, inline, className, children, ...props }: any) {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        return !inline && match ? (
                                                            <CodeBlock
                                                                language={match[1]}
                                                                value={String(children).replace(/\n$/, '')}
                                                                {...props}
                                                            />
                                                        ) : (
                                                            <code className="bg-white/10 px-2 py-1 rounded-lg text-xs font-mono text-purple-400 border border-white/5" {...props}>
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
                                    <div className={`absolute -bottom-6 ${msg.role === 'user' ? 'right-4' : 'left-4'} text-[10px] font-black text-slate-600 uppercase tracking-widest`}>
                                        {msg.role === 'user' ? 'You' : 'Mentorix AI'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Input Area */}
            <div className="px-6 pb-5 pt-4 bg-transparent shrink-0 mt-auto relative z-10 w-full">
                <div className="max-w-7xl mx-auto flex gap-4">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-0 bg-blue-500/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-[2rem]" />
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Message Mentorix AI Strategy Expert..."
                            className="relative w-full px-8 py-3.5 bg-white/5 border border-white/10 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-slate-600 shadow-2xl backdrop-blur-3xl text-lg font-medium"
                        />
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                        className="w-14 h-14 flex items-center justify-center bg-white text-black rounded-[1.5rem] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shrink-0 hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-black" />
                        ) : (
                            <Send className="w-5 h-5 rotate-45 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        )}
                    </button>
                </div>
            </div>

            {/* History Overlay Panel */}
            {showHistory && (
                <div className="absolute inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" onClick={() => setShowHistory(false)} />
                    <div className="relative w-full max-w-lg bg-slate-900/90 border-l border-white/10 h-full shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500 backdrop-blur-3xl overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl -mr-32 -mt-32 rounded-full" />

                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight text-left">Strategy Archive</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 text-left">Review your past sessions</p>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group">
                                <X className="w-6 h-6 text-slate-400 group-hover:text-white group-hover:rotate-90 transition-all duration-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar relative z-10">
                            {history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-[2.5rem] border border-white/10 border-dashed">
                                    <MessageSquare className="w-12 h-12 text-slate-700 mb-6" />
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No history found</p>
                                </div>
                            ) : (
                                history.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="w-full text-left p-6 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-white/10 transition-all group relative flex items-start gap-5 shadow-sm overflow-hidden"
                                    >
                                        {/* Clickable Overlay - Decoupled from Delete Button */}
                                        <div
                                            className="absolute inset-0 z-0 cursor-pointer"
                                            onClick={() => loadChatSession(item.chatId)}
                                        />

                                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        <div className="relative z-10 w-12 h-12 shrink-0 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-500 pointer-events-none">
                                            <MessageSquare className="w-5 h-5 text-slate-500 group-hover:text-white" />
                                        </div>

                                        <div className="relative z-10 flex-1 min-w-0 pointer-events-none">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-colors">
                                                    {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                                <div className="delete-btn-area pointer-events-auto relative z-20" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <button
                                                                className="p-2 hover:bg-red-500/10 text-slate-700 hover:text-red-500 rounded-xl transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="rounded-[2.5rem] bg-slate-900 border-white/10 text-white">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle className="uppercase tracking-tight font-black text-left">Delete Session?</AlertDialogTitle>
                                                                <AlertDialogDescription className="text-slate-400 text-left">
                                                                    This will permanently delete this conversation and all its messages. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl font-bold uppercase text-[10px] tracking-widest"
                                                                >
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteChat(item.chatId);
                                                                    }}
                                                                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                            <h4 className="text-base font-black text-white truncate group-hover:text-blue-400 transition-colors leading-tight">
                                                {item.chatTitle || "Untitled Session"}
                                            </h4>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            <Toaster />
        </div>
    )
}
