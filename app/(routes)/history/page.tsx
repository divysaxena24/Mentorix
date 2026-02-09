"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Map,
    MessageSquare,
    FileText,
    History as HistoryIcon,
    Trash2,
    Loader2,
    ArrowRight,
    Search,
    Clock,
    Calendar,
    ChevronRight,
    MapPin
} from "lucide-react"
import axios from "axios"
import Link from "next/link"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { RoadmapItem, ChatItem, CoverLetterItem, ResumeAnalysisItem } from "@/types"


export default function HistoryPage() {
    const [activeTab, setActiveTab] = useState("roadmaps")
    const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>([])
    const [chats, setChats] = useState<ChatItem[]>([])
    const [coverLetters, setCoverLetters] = useState<CoverLetterItem[]>([])
    const [resumes, setResumes] = useState<ResumeAnalysisItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    const fetchRoadmaps = useCallback(async () => {
        try {
            const response = await axios.get("/api/roadmap/history")
            const formatted = response.data.map((item: any) => ({
                id: item.id,
                targetField: item.targetField,
                createdAt: item.createdAt,
                roadmapData: item.roadmapData
            }))
            setRoadmaps(formatted)
        } catch (err) {
            console.error("Failed to fetch roadmap history:", err)
        }
    }, [])

    const fetchChats = useCallback(async () => {
        try {
            const response = await axios.get("/api/ai-career-chat-agent/history")
            setChats(response.data)
        } catch (err) {
            console.error("Failed to fetch chat history:", err)
        }
    }, [])

    const fetchCoverLetters = useCallback(async () => {
        try {
            const response = await axios.get("/api/cover-letter/history")
            setCoverLetters(response.data)
        } catch (err) {
            console.error("Failed to fetch cover letter history:", err)
        }
    }, [])

    const fetchResumes = useCallback(async () => {
        try {
            const response = await axios.get("/api/resume-analyzer/history")
            setResumes(response.data)
        } catch (err) {
            console.error("Failed to fetch resume history:", err)
        }
    }, [])

    const fetchAllHistory = useCallback(async () => {
        setLoading(true)
        await Promise.all([
            fetchRoadmaps(),
            fetchChats(),
            fetchCoverLetters(),
            fetchResumes()
        ])
        setLoading(false)
    }, [fetchRoadmaps, fetchChats, fetchCoverLetters, fetchResumes])

    useEffect(() => {
        fetchAllHistory()
    }, [fetchAllHistory])

    const handleDeleteRoadmap = async (id: number) => {
        try {
            await axios.delete(`/api/roadmap/history?id=${id}`)
            toast.success("Roadmap deleted successfully")
            setRoadmaps(roadmaps.filter(item => item.id !== id))
        } catch (err) {
            toast.error("Failed to delete roadmap")
        }
    }

    const handleDeleteChat = async (chatId: string) => {
        try {
            await axios.delete(`/api/ai-career-chat-agent/history?chatId=${chatId}`)
            toast.success("Chat history deleted successfully")
            setChats(chats.filter(item => item.chatId !== chatId))
        } catch (err) {
            toast.error("Failed to delete chat")
        }
    }

    const handleDeleteCoverLetter = async (id: number) => {
        try {
            await axios.delete(`/api/cover-letter/history?id=${id}`)
            toast.success("Cover letter deleted successfully")
            setCoverLetters(coverLetters.filter(item => item.id !== id))
        } catch (err) {
            toast.error("Failed to delete cover letter")
        }
    }

    const handleDeleteResume = async (id: number) => {
        try {
            await axios.delete(`/api/resume-analyzer/history?id=${id}`)
            toast.success("Resume analysis deleted successfully")
            setResumes(resumes.filter(item => item.id !== id))
        } catch (err) {
            toast.error("Failed to delete resume analysis")
        }
    }

    const filteredRoadmaps = roadmaps.filter(item =>
        item.targetField.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredChats = chats.filter(item =>
        (item.chatTitle || "Untitled Chat").toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredCoverLetters = coverLetters.filter(item =>
        item.jobDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.coverLetter.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredResumes = resumes.filter(item =>
        (item.jobDescription || "General Analysis").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.analysisData?.summary || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">My History</h1>
                    <p className="text-gray-500 font-medium">Manage your past roadmaps and chat sessions.</p>
                </div>

                <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm group-hover:shadow-md"
                    />
                </div>
            </div>

            <Tabs defaultValue="roadmaps" onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-gray-100 p-1 rounded-2xl h-auto flex flex-wrap gap-1">
                    <TabsTrigger
                        value="roadmaps"
                        className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold transition-all flex items-center gap-2"
                    >
                        <Map className="w-4 h-4" />
                        Roadmaps
                        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg text-[10px] ml-1">
                            {roadmaps.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="chats"
                        className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold transition-all flex items-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Chat Sessions
                        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg text-[10px] ml-1">
                            {chats.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="cover-letters"
                        className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold transition-all flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Cover Letters
                        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg text-[10px] ml-1">
                            {coverLetters.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="resumes"
                        className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold transition-all flex items-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        Resume Analysis
                        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-lg text-[10px] ml-1">
                            {resumes.length}
                        </span>
                    </TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <p className="text-gray-500 font-medium animate-pulse">Loading your history...</p>
                    </div>
                ) : (
                    <>
                        <TabsContent value="roadmaps" className="focus-visible:outline-none ring-0">
                            {filteredRoadmaps.length === 0 ? (
                                <EmptyState
                                    icon={<Map className="w-8 h-8 text-gray-300" />}
                                    title="No roadmaps found"
                                    description={searchQuery ? "Try a different search term" : "Generated roadmaps will appear here."}
                                    action={!searchQuery ? { label: "Generate Roadmap", href: "/ai-tools/roadmap" } : undefined}
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredRoadmaps.map((item) => (
                                        <HistoryCard
                                            key={item.id}
                                            icon={<Map className="w-5 h-5" />}
                                            title={item.targetField}
                                            date={new Date(item.createdAt).toLocaleDateString()}
                                            href="/ai-tools/roadmap"
                                            onDelete={() => handleDeleteRoadmap(item.id)}
                                            deleteTitle="Delete Roadmap?"
                                            deleteDescription="This action cannot be undone. This will permanently delete your roadmap."
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="chats" className="focus-visible:outline-none ring-0">
                            {filteredChats.length === 0 ? (
                                <EmptyState
                                    icon={<MessageSquare className="w-8 h-8 text-gray-300" />}
                                    title="No chat history"
                                    description={searchQuery ? "Try a different search term" : "Your AI career chat sessions will appear here."}
                                    action={!searchQuery ? { label: "Start New Chat", href: "/ai-tools/ai-chat" } : undefined}
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredChats.map((item) => (
                                        <HistoryCard
                                            key={item.chatId}
                                            icon={<MessageSquare className="w-5 h-5" />}
                                            title={item.chatTitle || "Untitled Chat"}
                                            date={new Date(item.createdAt).toLocaleDateString()}
                                            href={`/ai-tools/ai-chat?chatId=${item.chatId}`}
                                            onDelete={() => handleDeleteChat(item.chatId)}
                                            deleteTitle="Delete Chat?"
                                            deleteDescription="All messages in this conversation will be permanently removed."
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="cover-letters" className="focus-visible:outline-none ring-0">
                            {filteredCoverLetters.length === 0 ? (
                                <EmptyState
                                    icon={<FileText className="w-8 h-8 text-gray-300" />}
                                    title="No cover letters found"
                                    description={searchQuery ? "Try a different search term" : "Your generated cover letters will appear here."}
                                    action={!searchQuery ? { label: "Generate Cover Letter", href: "/ai-tools/cover-letter" } : undefined}
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredCoverLetters.map((item) => (
                                        <HistoryCard
                                            key={item.id}
                                            icon={<FileText className="w-5 h-5" />}
                                            title={item.jobDescription}
                                            date={new Date(item.createdAt).toLocaleDateString()}
                                            href="/ai-tools/cover-letter"
                                            onDelete={() => handleDeleteCoverLetter(item.id)}
                                            deleteTitle="Delete Cover Letter?"
                                            deleteDescription="This action cannot be undone."
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="resumes" className="focus-visible:outline-none ring-0">
                            {filteredResumes.length === 0 ? (
                                <EmptyState
                                    icon={<Search className="w-8 h-8 text-gray-300" />}
                                    title="No resume analysis found"
                                    description={searchQuery ? "Try a different search term" : "Your resume analysis reports will appear here."}
                                    action={!searchQuery ? { label: "Analyze Resume", href: "/ai-tools/resume-analyzer" } : undefined}
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredResumes.map((item) => (
                                        <HistoryCard
                                            key={item.id}
                                            icon={<Search className="w-5 h-5" />}
                                            title={item.jobDescription || "Resume Analysis"}
                                            date={new Date(item.createdAt).toLocaleDateString()}
                                            href="/ai-tools/resume-analyzer"
                                            onDelete={() => handleDeleteResume(item.id)}
                                            deleteTitle="Delete Analysis?"
                                            deleteDescription="This report and analysis will be permanently removed."
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    )
}

function HistoryCard({
    icon,
    title,
    date,
    href,
    onDelete,
    deleteTitle,
    deleteDescription
}: {
    icon: React.ReactNode,
    title: string,
    date: string,
    href: string,
    onDelete: () => void,
    deleteTitle: string,
    deleteDescription: string
}) {
    return (
        <div className="group relative bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 blur-2xl -mr-12 -mt-12 rounded-full group-hover:bg-blue-50 transition-colors" />

            <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                        {icon}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {date}
                        </span>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
                                    <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                <div>
                    <h4 className="text-lg font-black text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {title}
                    </h4>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-end">
                    <Link
                        href={href}
                        className="text-xs font-bold text-gray-900 flex items-center gap-2 hover:gap-3 transition-all"
                    >
                        View Details
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

function EmptyState({
    icon,
    title,
    description,
    action
}: {
    icon: React.ReactNode,
    title: string,
    description: string,
    action?: { label: string, href: string }
}) {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 font-medium mb-8 text-center max-w-xs">{description}</p>
            {action && (
                <Link
                    href={action.href}
                    className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-sm font-black transition-all hover:bg-black flex items-center gap-2 group"
                >
                    {action.label}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            )}
        </div>
    )
}
