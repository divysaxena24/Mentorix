"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    BookOpen,
    Sparkles,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    Youtube,
    ExternalLink,
    PlayCircle,
    BrainCircuit,
    ChevronRight,
    Trophy,
    Target,
    Clock,
    Zap,
    Code,
    MessageSquare,
    AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { RoadmapSkeleton } from "@/components/ToolSkeletons"
import {
    createCourseAction,
    getCourseDetails,
    generateCourseContentAction,
    updateLessonProgress
} from "@/app/actions/courseActions"

// --- Constants ---
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const GOALS = ["Interview Prep", "Industry Mastery", "Academic", "Freelancing"];

export default function CourseClient() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const courseId = searchParams.get("id")

    // --- State ---
    const [loading, setLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [course, setCourse] = useState<any>(null)
    const [activeModule, setActiveModule] = useState(0)
    const [activeLesson, setActiveLesson] = useState(0)

    // --- Form State ---
    const [topic, setTopic] = useState("")
    const [level, setLevel] = useState("Intermediate")
    const [goal, setGoal] = useState("Industry Mastery")
    const [duration, setDuration] = useState("4 Weeks")

    // --- Sync Logic ---
    useEffect(() => {
        if (!courseId) {
            setLoading(false)
            return
        }

        const fetchAndSync = async () => {
            setLoading(true)
            try {
                const data = await getCourseDetails(Number(courseId))
                if (data) {
                    setCourse(data)
                    // If course is still generating, trigger the background worker
                    if (data.generationStatus === "generating") {
                        triggerBackgroundSync(data.id)
                    }
                }
            } catch (err) {
                toast.error("Failed to load course")
            } finally {
                setLoading(false)
            }
        }

        fetchAndSync()
    }, [courseId])

    const triggerBackgroundSync = async (id: number) => {
        setIsGenerating(true)
        try {
            const res = await generateCourseContentAction(id)
            if (res.success) {
                // Refresh data once done
                const finalData = await getCourseDetails(id)
                setCourse(finalData)
                toast.success("All lessons generated successfully!")
            }
        } catch (err) {
            console.error("Background Sync Failed:", err)
        } finally {
            setIsGenerating(false)
        }
    }

    // --- Handlers ---
    const handleCreateCourse = async () => {
        if (!topic) return toast.error("Please enter a topic")
        setLoading(true)
        try {
            const res = await createCourseAction(topic, level, duration, goal)
            if (res.success) {
                router.push(`/ai-tools/course?id=${res.courseId}`)
            } else {
                toast.error(res.error || "Generation failed")
            }
        } catch (err) {
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const toggleLessonStatus = async (lessonId: number, currentStatus: boolean) => {
        try {
            await updateLessonProgress(lessonId, !currentStatus)
            // Re-fetch course to update checkmarks
            const data = await getCourseDetails(Number(courseId))
            setCourse(data)
            if (!currentStatus) {
                toast.success("Lesson marked as complete!")
            }
        } catch (err) { }
    }

    if (loading && !course) return <RoadmapSkeleton />

    // --- Landing / Generator View ---
    if (!course) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 py-20 relative">

                {/* Back to Dashboard Button */}
                <div className="absolute top-8 left-8 sm:top-12 sm:left-12 z-50">
                    <Link href="/ai-tools" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Features</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl w-full space-y-12"
                >
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.2)] mb-2">
                            <Zap className="w-3 h-3 fill-current" /> Premium AI Engine
                        </div>
                        <h1 className="text-6xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                            Mentorix <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Course Forge</span>
                        </h1>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full text-xs font-bold text-amber-200 uppercase tracking-wider mb-6">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Beta Version: We're rapidly evolving this engine to be even more advanced.
                        </div>
                        <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto mt-4">
                            Generate industry-standard, high-depth courses with real-world projects, interview prep, and curated videos.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] -mr-48 -mt-48 rounded-full" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-4 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Target className="w-3 h-3" /> Core Learning Topic
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Distributed Systems with Go or Advanced UI Design"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold placeholder:text-white/10 transition-all"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-yellow-500" /> Skill Level
                                </label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold focus:outline-none"
                                >
                                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-green-500" /> Estimated Duration
                                </label>
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold focus:outline-none"
                                >
                                    <option value="2 Weeks">Rapid Sprint (2 Weeks)</option>
                                    <option value="4 Weeks">Steady Mastery (4 Weeks)</option>
                                    <option value="8 Weeks">Deep Dive (8 Weeks)</option>
                                </select>
                            </div>

                            <div className="space-y-4 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Trophy className="w-3 h-3 text-purple-500" /> Targeted Goal
                                </label>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {GOALS.map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setGoal(g)}
                                            className={`py-3 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all ${goal === g ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleCreateCourse}
                                disabled={loading}
                                className="md:col-span-2 mt-4 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] group"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Forging Your Curriculum...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        <span>Initialize Premium Engine</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    // --- Premium Course Dashboard ---
    const currentModule = course.modules[activeModule] || course.modules[0]
    const currentLesson = currentModule?.lessons[activeLesson] || currentModule?.lessons[0]

    // Safety Parse
    const takeaways = JSON.parse(currentLesson?.takeaways || "[]")
    const commonMistakes = JSON.parse(currentLesson?.commonMistakes || "[]")
    const interviewQs = JSON.parse(currentLesson?.interviewQuestions || "[]")
    const outcomes = JSON.parse(course?.outcomes || "[]")

    const totalLessons = course.modules.reduce((acc: number, m: any) => acc + m.lessons.length, 0);
    const completedLessons = course.modules.reduce((acc: number, m: any) => acc + m.lessons.filter((l: any) => l.isCompleted).length, 0);
    const completionPercentage = totalLessons === 0 ? 0 : (completedLessons / totalLessons) * 100;

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-screen">

                {/* 1. Sidebar Navigation */}
                <div className="lg:col-span-3 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl h-screen sticky top-0 overflow-y-auto custom-scrollbar p-6">
                    <button onClick={() => router.push("/dashboard")} className="flex items-center gap-3 text-slate-500 hover:text-white mb-10 transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em]">Dashboard</span>
                    </button>

                    <div className="space-y-12">
                        <div className="space-y-2">
                            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Course Progress</h2>
                            <p className="text-xl font-black text-white leading-tight mb-2">{course.title}</p>

                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-400 font-bold">{Math.round(completionPercentage)}% Completed</span>
                                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">{completedLessons}/{totalLessons}</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                                    style={{ width: `${completionPercentage}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-8">
                            {course.modules.map((m: any, mIdx: number) => (
                                <div key={m.id} className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1 h-1 bg-blue-500 rounded-full" />
                                            {m.title}
                                        </h3>
                                    </div>
                                    <div className="space-y-1">
                                        {m.lessons.map((l: any, lIdx: number) => (
                                            <button
                                                key={l.id}
                                                onClick={() => {
                                                    setActiveModule(mIdx)
                                                    setActiveLesson(lIdx)
                                                }}
                                                className={`w-full text-left p-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${activeModule === mIdx && activeLesson === lIdx ? "bg-white text-black shadow-xl" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                                            >
                                                <span className="truncate pr-4">{l.title}</span>
                                                {l.isCompleted ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Main Content Area */}
                <div className="lg:col-span-9 h-screen overflow-y-auto custom-scrollbar bg-slate-950 p-8 lg:p-16">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentLesson?.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-4xl mx-auto space-y-16 pb-32"
                        >
                            {/* Header */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        {course.level}
                                    </span>
                                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        {currentModule?.title}
                                    </span>
                                </div>
                                <h1 className="text-5xl font-black text-white uppercase tracking-tight leading-[1.1]">
                                    {currentLesson?.title}
                                </h1>
                                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                                    {currentLesson?.content && currentLesson?.content.length > 200 ? '' : currentLesson?.content}
                                </p>
                            </div>

                            {/* Background Sync Banner */}
                            {(isGenerating || course.generationStatus === 'generating') && (
                                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] flex items-center gap-6 animate-pulse">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black uppercase tracking-widest">Synthesizing Deep Content...</p>
                                        <p className="text-[10px] text-blue-400/60 font-bold uppercase tracking-widest">The AI engine is generating high-depth explanations and projects in the background.</p>
                                    </div>
                                </div>
                            )}

                            {/* 3. Deep Explanations */}
                            {currentLesson?.explanation ? (
                                <div className="space-y-20">
                                    {/* Detailed Text */}
                                    <section className="prose prose-invert max-w-none">
                                        <div className="text-slate-300 text-lg leading-[1.8] space-y-8 font-medium whitespace-pre-wrap">
                                            {currentLesson.explanation}
                                        </div>
                                    </section>

                                    {/* Video Integration */}
                                    {currentLesson.videoUrl && (
                                        <section className="space-y-8">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                                <Youtube className="w-4 h-4 text-red-500" /> Curated Video Tutorial
                                            </h3>
                                            <div className="aspect-video w-full rounded-[3rem] overflow-hidden border border-white/10 bg-black group relative shadow-2xl">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${currentLesson.videoUrl.split('v=')[1]}`}
                                                    className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                                                    allowFullScreen
                                                />
                                            </div>
                                            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">{currentLesson.videoTitle || "Structured Deep Dive"}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">AI-Ranked for {course.level} learners</p>
                                                </div>
                                                <a href={currentLesson.videoUrl} target="_blank" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </section>
                                    )}

                                    {/* Real World Scenario */}
                                    {currentLesson.realWorldExample && (
                                        <section className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-6 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                                                <Target className="w-4 h-4" /> Industry Application
                                            </h3>
                                            <p className="text-slate-300 text-lg leading-relaxed font-medium">
                                                {currentLesson.realWorldExample}
                                            </p>
                                        </section>
                                    )}

                                    {/* Code Sandbox Meta */}
                                    {currentLesson.codeExample && (
                                        <section className="space-y-6">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                                <Code className="w-4 h-4 text-purple-400" /> Professional Implementation
                                            </h3>
                                            <div className="bg-[#0f1117] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative">
                                                <div className="absolute top-4 right-6 flex gap-2">
                                                    <div className="w-3 h-3 bg-red-500/50 rounded-full" />
                                                    <div className="w-3 h-3 bg-yellow-500/50 rounded-full" />
                                                    <div className="w-3 h-3 bg-green-500/50 rounded-full" />
                                                </div>
                                                <pre className="text-sm text-blue-300 font-mono overflow-x-auto selection:bg-purple-500/30 py-4">
                                                    <code>{currentLesson.codeExample}</code>
                                                </pre>
                                            </div>
                                        </section>
                                    )}

                                    {/* Common Mistakes */}
                                    {commonMistakes.length > 0 && (
                                        <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="p-10 bg-red-500/5 border border-red-500/10 rounded-[3rem] space-y-6">
                                                <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-3">
                                                    <AlertTriangle className="w-4 h-4" /> Pitfalls to Avoid
                                                </h3>
                                                <div className="space-y-4">
                                                    {commonMistakes.map((m: string, i: number) => (
                                                        <div key={i} className="flex gap-4">
                                                            <div className="w-1.5 h-1.5 mt-2 bg-red-500 rounded-full" />
                                                            <p className="text-sm text-slate-400 font-semibold">{m}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-10 bg-green-500/5 border border-green-500/10 rounded-[3rem] space-y-6">
                                                <h3 className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-3">
                                                    <BrainCircuit className="w-4 h-4" /> Lab Exercise
                                                </h3>
                                                <p className="text-sm text-slate-300 font-bold leading-relaxed">
                                                    {currentLesson.exercise}
                                                </p>
                                            </div>
                                        </section>
                                    )}

                                    {/* Interview Questions */}
                                    {interviewQs.length > 0 && (
                                        <section className="space-y-8">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                                                <MessageSquare className="w-4 h-4 text-pink-500" /> Prep for Technical Interviews
                                            </h3>
                                            <div className="space-y-4">
                                                {interviewQs.map((q: any, i: number) => (
                                                    <div key={i} className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:border-pink-500/20 transition-all group">
                                                        <p className="text-white font-black text-md mb-4 group-hover:text-pink-400">Q: {q.question}</p>
                                                        <p className="text-slate-400 text-sm font-medium leading-relaxed pl-6 border-l border-white/10">A: {q.answer}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-20 border-t border-white/5">
                                        <button
                                            onClick={() => toggleLessonStatus(currentLesson.id, currentLesson.isCompleted)}
                                            className={`px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-3 ${currentLesson.isCompleted
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                                                }`}
                                        >
                                            <CheckCircle2 className={`w-5 h-5 ${currentLesson.isCompleted ? 'text-emerald-400' : ''}`} />
                                            {currentLesson.isCompleted ? 'Completed' : 'Mark Lesson as Complete'}
                                        </button>

                                        <div className="flex items-center gap-3">
                                            <button
                                                disabled={activeModule === 0 && activeLesson === 0}
                                                onClick={() => {
                                                    if (activeLesson > 0) setActiveLesson(activeLesson - 1)
                                                    else if (activeModule > 0) { setActiveModule(activeModule - 1); setActiveLesson(course.modules[activeModule - 1].lessons.length - 1); }
                                                }}
                                                className="p-5 bg-white/5 rounded-2xl hover:bg-white/10 disabled:opacity-30 transition-all border border-white/5"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                disabled={activeModule === course.modules.length - 1 && activeLesson === currentModule.lessons.length - 1}
                                                onClick={() => {
                                                    if (activeLesson < currentModule.lessons.length - 1) setActiveLesson(activeLesson + 1)
                                                    else if (activeModule < course.modules.length - 1) { setActiveModule(activeModule + 1); setActiveLesson(0); }
                                                }}
                                                className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl"
                                            >
                                                Next Mission
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-12">
                                    <div className="w-full aspect-video rounded-[3rem] bg-white/5 animate-pulse" />
                                    <div className="space-y-4">
                                        <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse" />
                                        <div className="h-4 bg-white/5 rounded-full w-1/2 animate-pulse" />
                                        <div className="h-4 bg-white/5 rounded-full w-5/6 animate-pulse" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </div>
    )
}
