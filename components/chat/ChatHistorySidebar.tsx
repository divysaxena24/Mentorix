"use client"

import React from "react"
import { History, X, Trash2, MessageSquare, Loader2 } from "lucide-react"
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

interface ChatSession {
    chatId: string
    chatTitle: string
    createdAt: string
}

interface ChatHistorySidebarProps {
    showHistory: boolean
    setShowHistory: (show: boolean) => void
    history: ChatSession[]
    historyLoading: boolean
    currentChatId: string | null
    onLoadChat: (chatId: string) => void
    onDeleteChat: (chatId: string) => void
    onDeleteAllChats: () => void
}

export const HistorySkeleton = () => (
    <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-2xl animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
            </div>
        ))}
    </div>
)

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
    showHistory,
    setShowHistory,
    history,
    historyLoading,
    currentChatId,
    onLoadChat,
    onDeleteChat,
    onDeleteAllChats
}) => {
    if (!showHistory) return null

    return (
        <div className="absolute inset-0 z-100 flex justify-end">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xl" onClick={() => setShowHistory(false)} />
            <div className="relative w-full max-w-lg bg-slate-900/90 border-l border-white/10 h-full shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500 backdrop-blur-3xl overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl -mr-32 -mt-32 rounded-full" />

                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight text-left">Chat Archive</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 text-left">Review your past sessions</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {history.length > 0 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="w-12 h-12 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-2xl transition-all group"
                                        title="Clear All History"
                                    >
                                        <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-900 border-white/10 text-white rounded-[2.5rem] p-12">
                                    <AlertDialogHeader className="mb-8">
                                        <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter">Purge Archive?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-400 font-medium text-lg mt-4">
                                            This action will permanently erase all your past conversation sessions. This cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase py-4">Maintain Archive</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={onDeleteAllChats}
                                            className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-2xl text-[10px] font-black uppercase py-4"
                                        >
                                            Confirm Purge
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <button
                            onClick={() => setShowHistory(false)}
                            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 text-slate-300 rounded-2xl hover:text-white hover:bg-white/10 transition-all font-black"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-4 relative z-10">
                    {historyLoading ? (
                        <HistorySkeleton />
                    ) : history.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20">
                            <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center mb-8 opacity-20">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-black uppercase tracking-tighter text-slate-500">No Archives Found</h4>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">Your conversations will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((session) => (
                                <div
                                    key={session.chatId}
                                    className={`group relative flex items-center justify-between p-7 rounded-4xl border transition-all duration-300 cursor-pointer overflow-hidden ${currentChatId === session.chatId
                                        ? "bg-blue-600/20 border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.1)]"
                                        : "bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10 shadow-lg"
                                        }`}
                                    onClick={() => {
                                        onLoadChat(session.chatId)
                                        setShowHistory(false)
                                    }}
                                >
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <h4 className={`text-[13px] font-black uppercase tracking-tight truncate pr-4 ${currentChatId === session.chatId ? 'text-blue-400' : 'text-white'}`}>
                                            {session.chatTitle || 'Career Conversation'}
                                        </h4>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                                            {new Date(session.createdAt).toLocaleDateString(undefined, {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDeleteChat(session.chatId)
                                        }}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xl border border-white/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
