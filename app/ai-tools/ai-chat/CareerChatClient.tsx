"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Send, History, X, MessageSquare, Copy, Check, Trash2, Sparkles, Loader2, Share2, Globe, Link as LinkIcon, ArrowLeft, Paperclip } from "lucide-react"
import axios from "axios";
import Link from "next/link";
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
import { ChatItem } from "@/types"
import {
    getChatSessionsAction,
    getChatMessagesAction,
    saveChatMessageAction,
    deleteChatSessionAction
} from "@/app/actions/chatActions"
import { ChatHistorySidebar } from "@/components/chat/ChatHistorySidebar"
import { MemoizedReactMarkdown, ChatMarkdownComponents } from "@/components/chat/ChatContent"
import remarkGfm from "remark-gfm"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function CareerChatClient() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState<ChatItem[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [chatTitle, setChatTitle] = useState<string | null>(null)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [isShared, setIsShared] = useState(false)
    const [sharingLoading, setSharingLoading] = useState(false)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [attachedFile, setAttachedFile] = useState<File | null>(null)
    const searchParams = useSearchParams()
    const urlChatId = searchParams.get("chatId")

    // Sync URL Chat ID with session
    useEffect(() => {
        if (urlChatId && urlChatId !== currentChatId) {
            loadChatSession(urlChatId)
        }
    }, [urlChatId])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be under 5MB");
            return;
        }

        if (!file.type.includes("pdf") && !file.type.startsWith("text/")) {
            toast.error("Only PDF and Text documents are supported.");
            return;
        }

        setAttachedFile(file);
    };

    const handleRemoveFile = () => {
        setAttachedFile(null);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    useEffect(() => {
        if (showHistory) {
            fetchHistory()
        }
    }, [showHistory])

    const fetchHistory = async () => {
        setHistoryLoading(true)
        try {
            const result = await getChatSessionsAction();
            if (result.success && result.data) {
                setHistory(result.data.map(h => ({
                    chatId: h.chatId || '',
                    chatTitle: h.chatTitle || 'Career Conversation',
                    createdAt: h.createdAt?.toString() || new Date().toISOString()
                })));
            }
        } catch (error) {
            console.error("Error fetching history:", error)
        } finally {
            setHistoryLoading(false)
        }
    }

    const saveMessageToHistory = async (role: string, content: string, chatIdToUse: string, titleToUse: string) => {
        try {
            await saveChatMessageAction(role as 'user' | 'assistant', content, chatIdToUse, titleToUse);
        } catch (error) {
            console.error("Error saving to history:", error)
        }
    }

    const loadChatSession = async (chatId: string) => {
        try {
            setLoading(true)
            const result = await getChatMessagesAction(chatId);
            if (result.success && result.data) {
                setMessages(result.data.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content || '' })))
                setCurrentChatId(chatId)
                if (result.data.length > 0) {
                    setChatTitle(result.data[0].chatTitle || "History Chat")
                }
                setShowHistory(false)
                checkSharingStatus(chatId)
            }
        } catch (error) {
            console.error("Error loading chat session:", error)
        } finally {
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
        if ((!messageText.trim() && !attachedFile) || loading) return

        let activeChatId = currentChatId
        let activeTitle = chatTitle

        if (!activeChatId) {
            activeChatId = crypto.randomUUID()
            activeTitle = messageText.length > 40 ? messageText.substring(0, 40) + "..." : messageText || "File Upload"
            setCurrentChatId(activeChatId)
            setChatTitle(activeTitle)
        }

        const userMessage: Message = {
            role: "user",
            content: messageText + (attachedFile ? `\n\n[Attached File: ${attachedFile.name}]` : "")
        }
        setMessages(prev => [...prev, userMessage])

        const fileToSend = attachedFile;
        setInput("")
        setAttachedFile(null)
        setLoading(true)

        try {
            let fileBase64 = null;
            let fileType = null;
            let fileName = null;

            if (fileToSend) {
                fileBase64 = await fileToBase64(fileToSend);
                fileType = fileToSend.type;
                fileName = fileToSend.name;
            }

            if (activeChatId && activeTitle) {
                saveMessageToHistory("user", userMessage.content, activeChatId, activeTitle)
            }

            const result = await axios.post("/api/ai-career-chat-agent", {
                userInput: messageText,
                fileBase64,
                fileType,
                fileName,
                conversationHistory: [...messages, userMessage]
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

        } catch (error: unknown) {
            console.error("Chat Error:", error)
            const status = (error as any).response?.status;
            let errorMessage = "Sorry, I encountered an error. Please try again.";

            if (status === 429) {
                errorMessage = "The AI is currently under high load (Too Many Requests). Please wait a few seconds and try again.";
            } else if (status === 413) {
                errorMessage = "The file or message is too large for the AI to process. Please try a smaller one.";
            } else if ((error as any).response?.data?.error) {
                errorMessage = (error as any).response.data.error;
            }

            const aiErrorMessage: Message = { role: "assistant", content: errorMessage }
            setMessages(prev => [...prev, aiErrorMessage])
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
            const result = await deleteChatSessionAction(chatId);
            if (result.success) {
                toast.success("Chat history deleted successfully");
                if (currentChatId === chatId) {
                    startNewChat();
                }
                fetchHistory();
            } else {
                toast.error(result.error || "Failed to delete chat history");
            }
        } catch (error) {
            console.error("Error deleting chat:", error);
            toast.error("Failed to delete chat history");
        }
    };

    const handleDeleteAllChats = async () => {
        try {
            const result = await deleteChatSessionAction("all");
            if (result.success) {
                toast.success("All chat history deleted successfully");
                startNewChat();
                fetchHistory();
                setShowHistory(false);
            } else {
                toast.error(result.error || "Failed to delete all chat history");
            }
        } catch (error) {
            console.error("Error deleting all chats:", error);
            toast.error("Failed to delete all chat history");
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
                    <div className="flex items-center justify-between w-full">
                        <Link href="/ai-tools" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-0 group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-medium">Back to Features</span>
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
                                                Share this <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500 italic">Conversation</span>
                                            </DialogTitle>
                                            <DialogDescription className="text-slate-400 text-base sm:text-lg font-medium leading-relaxed mt-4 text-left">
                                                Make this conversation public to generate a unique shareable link for others to view.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="flex flex-col gap-8 w-full">
                                            <div className={`w-full flex items-center justify-between p-6 sm:p-8 rounded-4xl border transition-all duration-500 ${isShared ? 'bg-white/5 border-white/20 shadow-[0_0_50px_rgba(37,99,235,0.2)]' : 'bg-white/5 border-white/10'}`}>
                                                <div className="flex items-center gap-6 min-w-0 pr-2">
                                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 ${isShared ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-slate-500'}`}>
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
                        <div className="text-center mb-12 space-y-6">
                            <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border border-white/10 group animate-bounce duration-[3s]">
                                <MessageSquare className="w-12 h-12 text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">How can I <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 italic">Help You?</span></h2>
                                <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto leading-relaxed">Select a tailored prompt below or start typing to begin your chat session.</p>
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
                                            <MemoizedReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={ChatMarkdownComponents}
                                            >
                                                {msg.content}
                                            </MemoizedReactMarkdown>
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
                <div className="max-w-7xl mx-auto flex flex-col gap-3">
                    {attachedFile && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl w-fit animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white max-w-[200px] truncate">{attachedFile.name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{(attachedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                            <button onClick={handleRemoveFile} className="ml-2 w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors group">
                                <X className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                            </button>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <div className="flex-1 relative group">
                            <div className="absolute inset-0 bg-blue-500/10 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-4xl" />
                            <div className="relative w-full flex items-center">
                                <label className="absolute left-2 cursor-pointer p-3 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors group/attach z-10">
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept=".pdf,.txt"
                                    />
                                    <Paperclip className="w-5 h-5 group-hover/attach:scale-110 transition-transform" />
                                </label>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Message Mentorix AI..."
                                    className="relative w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-4xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white placeholder:text-slate-500 shadow-2xl backdrop-blur-3xl text-lg font-medium"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => handleSend()}
                            disabled={loading || (!input.trim() && !attachedFile)}
                            className={`w-16 h-16 flex items-center justify-center border border-white/20 rounded-4xl disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shrink-0 hover:scale-105 active:scale-95 transition-all duration-300 group ${(input.trim() || attachedFile)
                                ? "bg-white text-black hover:bg-slate-100 shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                                : "bg-white/10 text-slate-400 hover:bg-white/20"
                                }`}
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin text-black" />
                            ) : (
                                <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <ChatHistorySidebar
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                history={history}
                historyLoading={historyLoading}
                currentChatId={currentChatId}
                onLoadChat={loadChatSession}
                onDeleteChat={handleDeleteChat}
                onDeleteAllChats={handleDeleteAllChats}
            />

            <Toaster />
        </div>
    )
}

