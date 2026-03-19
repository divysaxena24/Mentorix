"use client"

import { useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import {
    Map,
    MessageSquare,
    FileText,
    Trash2,
    ArrowRight,
    Search,
    Clock,
    Calendar,
    ChevronRight,
    MapPin,
    Briefcase,
    BookOpen
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
import { RoadmapItem, ChatItem, ResumeAnalysisItem, UserCourse, WritingDoc, ResumeItem } from "@/types"

interface HistoryClientProps {
    initialData: {
        roadmaps: RoadmapItem[];
        chats: ChatItem[];
        writingDocs: WritingDoc[];
        resumesAnalysed: ResumeAnalysisItem[];
        resumesBuilt: ResumeItem[];
        courses: UserCourse[];
    }
}

export default function HistoryClient({ initialData }: HistoryClientProps) {
    const searchParams = useSearchParams()
    const tabParam = searchParams.get("tab")
    const [activeTab, setActiveTab] = useState(tabParam || "roadmaps")
    const [roadmaps, setRoadmaps] = useState<RoadmapItem[]>(initialData.roadmaps)
    const [chats, setChats] = useState<ChatItem[]>(initialData.chats)
    const [writingStudioDocs, setWritingStudioDocs] = useState<WritingDoc[]>(initialData.writingDocs)
    const [resumes, setResumes] = useState<ResumeAnalysisItem[]>(initialData.resumesAnalysed)
    const [savedResumes, setSavedResumes] = useState<ResumeItem[]>(initialData.resumesBuilt)
    const [courses, setCourses] = useState<UserCourse[]>(initialData.courses)
    const [searchQuery, setSearchQuery] = useState("")

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

    const handleDeleteWritingDoc = async (id: number) => {
        try {
            await axios.delete(`/api/writing-studio/history?id=${id}`)
            toast.success("Document deleted successfully")
            setWritingStudioDocs(writingStudioDocs.filter(item => item.id !== id))
        } catch (err) {
            toast.error("Failed to delete document")
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

    const handleDeleteSavedResume = async (id: number) => {
        try {
            await axios.delete(`/api/resume-builder?id=${id}`)
            toast.success("Resume deleted successfully")
            setSavedResumes(savedResumes.filter(item => item.id !== id))
        } catch (err) {
            toast.error("Failed to delete resume")
        }
    }

    const handleDeleteCourse = async (id: number) => {
        try {
            await axios.delete(`/api/course?id=${id}`)
            toast.success("Course deleted successfully")
            setCourses(courses.filter(item => item.id !== id))
        } catch (err) {
            toast.error("Failed to delete course")
        }
    }

    const filterBySearch = (items: any[]): any[] => {
        if (!searchQuery) return items
        return items.filter(item => {
            const searchField = (item.title || item.targetField || item.chatTitle || item.jobDescription || item.resumeName || item.context || "").toLowerCase()
            return searchField.includes(searchQuery.toLowerCase())
        })
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase">Your Growth History</h1>
                    <p className="text-slate-500 font-medium">Track your progress and revisit your AI-generated resources.</p>
                </div>
                <div className="relative group min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search your history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium"
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-2xl h-auto flex flex-wrap gap-1">
                    {[
                        { id: "roadmaps", label: "Roadmaps", icon: Map },
                        { id: "chats", label: "AI Advisor", icon: MessageSquare },
                        { id: "courses", label: "Courses", icon: BookOpen },
                        { id: "resumes", label: "Analysis", icon: FileText },
                        { id: "saved_resumes", label: "Built Resumes", icon: Briefcase },
                        { id: "writing_studio", label: "Writing Studio", icon: FileText },
                    ].map(tab => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white/5"
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* Roadmaps */}
                <TabsContent value="roadmaps" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filterBySearch(roadmaps).map((item) => (
                            <HistoryCard
                                key={item.id}
                                icon={<Map className="w-5 h-5 text-blue-400" />}
                                title={item.targetField}
                                date={new Date(item.createdAt).toLocaleDateString()}
                                href={`/ai-tools/roadmap?id=${item.id}`}
                                onDelete={() => handleDeleteRoadmap(item.id)}
                                deleteTitle="Delete Roadmap"
                                deleteDescription="Are you sure? This will permanently delete this roadmap and all its associated data."
                            />
                        ))}
                        {filterBySearch(roadmaps).length === 0 && (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={<Map className="w-12 h-12 text-slate-700" />}
                                    title="No Roadmaps Found"
                                    description={searchQuery ? "No results match your search." : "You haven't generated any career roadmaps yet."}
                                    action={searchQuery ? undefined : { label: "Generate Your First Roadmap", href: "/ai-tools/roadmap" }}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* AI Advisor Chats */}
                <TabsContent value="chats" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filterBySearch(chats).map((item, index) => (
                            <HistoryCard
                                key={`${item.chatId}-${index}`}
                                icon={<MessageSquare className="w-5 h-5 text-purple-400" />}
                                title={item.chatTitle}
                                date={new Date(item.createdAt).toLocaleDateString()}
                                href={`/ai-tools/ai-chat?chatId=${item.chatId}`}
                                onDelete={() => handleDeleteChat(item.chatId)}
                                deleteTitle="Delete Chat"
                                deleteDescription="This will permanently remove this conversation from your history."
                            />
                        ))}
                        {filterBySearch(chats).length === 0 && (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={<MessageSquare className="w-12 h-12 text-slate-700" />}
                                    title="No Chats Found"
                                    description={searchQuery ? "No results match your search." : "Start a new conversation with Mentorix to get career advice."}
                                    action={searchQuery ? undefined : { label: "Start Chatting", href: "/ai-tools/ai-chat" }}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Courses */}
                <TabsContent value="courses" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filterBySearch(courses).map((item) => (
                            <HistoryCard
                                key={item.id}
                                icon={<BookOpen className="w-5 h-5 text-emerald-400" />}
                                title={item.title}
                                date={new Date(item.createdAt).toLocaleDateString()}
                                href={`/ai-tools/course?id=${item.id}`}
                                onDelete={() => handleDeleteCourse(item.id)}
                                deleteTitle="Delete Course"
                                deleteDescription="This will permanently delete this generated course."
                            />
                        ))}
                        {filterBySearch(courses).length === 0 && (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={<BookOpen className="w-12 h-12 text-slate-700" />}
                                    title="No Courses Found"
                                    description={searchQuery ? "No results match your search." : "Build your first AI course from a roadmap."}
                                    action={searchQuery ? undefined : { label: "Go to Roadmaps", href: "/ai-tools/roadmap" }}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Resume Analysis */}
                <TabsContent value="resumes" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filterBySearch(resumes).map((item) => (
                            <HistoryCard
                                key={item.id}
                                icon={<FileText className="w-5 h-5 text-orange-400" />}
                                title={item.resumeName || "Analyzed Resume"}
                                date={new Date(item.createdAt).toLocaleDateString()}
                                href={`/ai-tools/resume-analyzer?id=${item.id}`}
                                onDelete={() => handleDeleteResume(item.id)}
                                deleteTitle="Delete Analysis"
                                deleteDescription="This will permanently delete the analysis report."
                            />
                        ))}
                        {filterBySearch(resumes).length === 0 && (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={<FileText className="w-12 h-12 text-slate-700" />}
                                    title="No Analysis Reports"
                                    description={searchQuery ? "No results match your search." : "Upload your resume for AI-powered analysis."}
                                    action={searchQuery ? undefined : { label: "Analyze Resume", href: "/ai-tools/resume-analyzer" }}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Built Resumes */}
                <TabsContent value="saved_resumes" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filterBySearch(savedResumes).map((item) => (
                            <HistoryCard
                                key={item.id}
                                icon={<Briefcase className="w-5 h-5 text-cyan-400" />}
                                title={item.resumeName}
                                date={new Date(item.createdAt).toLocaleDateString()}
                                href={`/ai-tools/resume-builder?id=${item.id}`}
                                onDelete={() => handleDeleteSavedResume(item.id)}
                                deleteTitle="Delete Resume"
                                deleteDescription="This will permanently delete your saved resume design."
                            />
                        ))}
                        {filterBySearch(savedResumes).length === 0 && (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={<Briefcase className="w-12 h-12 text-slate-700" />}
                                    title="No Saved Resumes"
                                    description={searchQuery ? "No results match your search." : "Build a professional resume using our architect."}
                                    action={searchQuery ? undefined : { label: "Build Resume", href: "/ai-tools/resume-builder" }}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Writing Studio */}
                <TabsContent value="writing_studio" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filterBySearch(writingStudioDocs.map(doc => ({ ...doc, title: doc.docType.replace('_', ' ').toUpperCase() }))).map((item) => (
                            <HistoryCard
                                key={item.id}
                                icon={<FileText className="w-5 h-5 text-pink-400" />}
                                title={item.title}
                                date={new Date(item.createdAt).toLocaleDateString()}
                                href={`/ai-tools/writing-studio?id=${item.id}&docType=${item.docType}`}
                                onDelete={() => handleDeleteWritingDoc(item.id)}
                                deleteTitle="Delete Document"
                                deleteDescription="This will permanently delete this generated document."
                            />
                        ))}
                        {filterBySearch(writingStudioDocs).length === 0 && (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={<FileText className="w-12 h-12 text-slate-700" />}
                                    title="No Documents Found"
                                    description={searchQuery ? "No results match your search." : "Generate cover letters, SOPs, and more."}
                                    action={searchQuery ? undefined : { label: "Go to Writing Studio", href: "/ai-tools/writing-studio" }}
                                />
                            </div>
                        )}
                    </div>
                </TabsContent>
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
        <div className="group relative glass-card rounded-2xl border border-white/5 hover:border-white/20 transition-all p-5 backdrop-blur-3xl">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-blue-600/10 transition-colors">
                    {icon}
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button className="p-2 text-slate-500 hover:text-red-400 transition-colors bg-white/5 rounded-lg opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-950 border-white/10">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-white font-black uppercase tracking-tight">{deleteTitle}</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400 font-medium">
                                {deleteDescription}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={onDelete}
                                className="bg-red-600 text-white hover:bg-red-700 font-bold"
                            >
                                Delete Permanently
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <div className="space-y-4">
                <h3 className="font-black text-white text-lg tracking-tight line-clamp-2 min-h-14 group-hover:text-blue-400 transition-colors">
                    {title}
                </h3>

                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {date}
                    </div>
                </div>

                <Link href={href}>
                    <button className="w-full mt-2 py-3 bg-white/5 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-white/5 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                        Open Resource
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                </Link>
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
        <div className="flex flex-col items-center justify-center p-12 bg-white/2 border border-dashed border-white/10 rounded-[2.5rem] text-center">
            <div className="p-6 bg-white/3 rounded-full mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{title}</h3>
            <p className="text-slate-500 mb-8 max-w-sm font-medium">{description}</p>
            {action && (
                <Link href={action.href}>
                    <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.2)]">
                        {action.label}
                    </button>
                </Link>
            )}
        </div>
    )
}
