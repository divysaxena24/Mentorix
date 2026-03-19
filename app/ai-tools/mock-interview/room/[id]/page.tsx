"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Square, Volume2, User, Loader2, Play, CheckCircle2, Clock, SkipForward, LogOut, AlertTriangle } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

// Safely access modern browser speech APIs
const SpeechRecognition = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null

export default function InterviewRoomPage() {
    const params = useParams()
    const router = useRouter()
    const interviewId = params.id as string

    const [interview, setInterview] = useState<any>(null)
    const [questions, setQuestions] = useState<any[]>([])
    const [currentQuestion, setCurrentQuestion] = useState<any>(null)

    // Conversation States
    type InterviewState = 'idle' | 'speaking' | 'listening' | 'evaluating' | 'finished' | 'error'
    const [status, setStatus] = useState<InterviewState>('idle')
    const [transcript, setTranscript] = useState("")

    const synthesisRef = useRef<SpeechSynthesis | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<BlobPart[]>([])
    const transcriptRef = useRef("")

    // Timer State
    const [timeLeft, setTimeLeft] = useState(0)

    useEffect(() => {
        if (!interview) return;
        // Parse duration like "15 Mins" or "30 Minutes"
        const durationStr = interview.duration || "15";
        const mins = parseInt(durationStr.match(/\d+/)?.[0] || "15", 10);
        setTimeLeft(mins * 60);
    }, [interview]);

    useEffect(() => {
        if (!interview || status === 'finished' || timeLeft <= 0) return;
        const interval = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(interval)
    }, [interview, status, timeLeft])

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    // Setup Interview State
    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const res = await fetch(`/api/mi-details/${interviewId}`)
                if (!res.ok) {
                    const errorText = await res.text()
                    throw new Error(`Failed to fetch API (${res.status}): ${errorText.slice(0, 100)}`)
                }

                const data = await res.json()
                setInterview(data.interview)
                setQuestions(data.questions)

                if (data.interview.status === "Completed") {
                    setStatus('finished')
                } else {
                    const latestUnanswered = data.questions.find((q: any) => !q.userTranscript)
                    if (latestUnanswered) {
                        setCurrentQuestion(latestUnanswered)
                    }
                }
            } catch (err) {
                console.error(err)
                setStatus('error')
            }
        }
        fetchInterview()

        // Init Speech Synthesis
        if (typeof window !== 'undefined') {
            synthesisRef.current = window.speechSynthesis
        }

        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop()
            }
            if (synthesisRef.current) synthesisRef.current.cancel()
        }
    }, [interviewId])

    const speakQuestion = (text: string) => {
        if (!synthesisRef.current || status === 'finished') return

        synthesisRef.current.cancel() // Stop any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text)

        // Try to find a good English voice
        const voices = synthesisRef.current.getVoices()
        const preferredVoice = voices.find(v => v.lang.includes('en-US'))
        if (preferredVoice) utterance.voice = preferredVoice

        utterance.rate = 1.0
        utterance.pitch = 1.0

        utterance.onstart = () => {
            setStatus('speaking')
        }

        utterance.onend = () => {
            setStatus('idle')
        }

        synthesisRef.current.speak(utterance)
    }

    // Play first question when interview loads
    useEffect(() => {
        if (currentQuestion && status === 'idle' && !transcript) {
            // Slight delay so the UI fully renders before speaking
            const timeout = setTimeout(() => {
                speakQuestion(currentQuestion.questionText)
            }, 1000)
            return () => clearTimeout(timeout)
        }
    }, [currentQuestion])

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            synthesisRef.current?.cancel() // Stop AI if speaking
            setTranscript("Recording in progress...") // Show basic UI feedback since we transcribe at the end
            transcriptRef.current = ""
            setStatus('listening')

            mediaRecorder.start(1000) // Collect chunks every second
        } catch (err) {
            console.error("Failed to start media recorder:", err)
            alert("Microphone access denied or unavailable. Please enable microphone permissions.")
        }
    }

    const stopListeningAndEvaluate = async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return

        setStatus('evaluating')
        setTranscript("Transcribing audio...")

        const stopPromise = new Promise<Blob>((resolve) => {
            if (!mediaRecorderRef.current) return resolve(new Blob())
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                audioChunksRef.current = []
                resolve(audioBlob)
            }
            mediaRecorderRef.current.stop()

            // Stop all microphone tracks to release the hardware
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        })

        const audioBlob = await stopPromise;

        try {
            // 1. Transcribe the audio via our new Groq Whisper endpoint
            let finalUserText = "No audible response recorded."

            if (audioBlob.size > 0) {
                const formData = new FormData()
                // Append the blob and give it a filename that includes extension so the backend knows it's WebM
                formData.append("file", audioBlob, "audio.webm")

                const transcribeRes = await fetch("/api/mi-stt", {
                    method: "POST",
                    body: formData
                })

                if (transcribeRes.ok) {
                    const sttData = await transcribeRes.json()
                    finalUserText = sttData.text || finalUserText
                } else {
                    console.error("Transcription failed:", await transcribeRes.text())
                }
            }

            // Fallback for empty strings
            if (!finalUserText.trim()) {
                finalUserText = "No audible response deciphered."
            }

            setTranscript(finalUserText)
            transcriptRef.current = finalUserText

            // 2. Evaluate the answer
            const res = await fetch("/api/mi-evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interviewId: parseInt(interviewId),
                    questionId: currentQuestion.id,
                    userTranscript: finalUserText
                }),
            })

            let data;
            const text = await res.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON response:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!res.ok) {
                throw new Error(data.error || data.message || "Failed to evaluate response.");
            }

            // Update local state with evaluation
            setQuestions(prev => prev.map(q =>
                q.id === currentQuestion.id
                    ? { ...q, userTranscript: finalUserText, aiEvaluationText: data.evaluation, score: data.score }
                    : q
            ))

            if (data.isFinished) {
                setStatus('finished')
                speakQuestion(data.closingRemarks || "Thank you. We have concluded the interview. You can now view your report.")
            } else {
                setQuestions(prev => [...prev, data.nextQuestion])
                setCurrentQuestion(data.nextQuestion)
                speakQuestion(data.nextQuestion.questionText)
            }

        } catch (error) {
            console.error(error)
            setStatus('error')
        }
    }

    const skipQuestion = async () => {
        if (!currentQuestion) return;
        synthesisRef.current?.cancel()

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        }

        setStatus('evaluating')

        try {
            const res = await fetch("/api/mi-evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interviewId: parseInt(interviewId),
                    questionId: currentQuestion.id,
                    userTranscript: "User skipped the question."
                }),
            })

            let data;
            const text = await res.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Failed to parse JSON response on skip:", text);
                throw new Error("Server returned an invalid response.");
            }

            if (!res.ok) {
                throw new Error(data.error || data.message || "Failed to skip response.");
            }

            // Update local state with evaluation
            setQuestions(prev => prev.map(q =>
                q.id === currentQuestion.id
                    ? { ...q, userTranscript: "User skipped the question.", aiEvaluationText: "Question was skipped.", score: 0 }
                    : q
            ))

            if (data.isFinished) {
                setStatus('finished')
                speakQuestion(data.closingRemarks || "Thank you. We have concluded the interview. You can now view your report.")
            } else {
                setQuestions(prev => [...prev, data.nextQuestion])
                setCurrentQuestion(data.nextQuestion)
                speakQuestion(data.nextQuestion.questionText)
            }
        } catch (error) {
            console.error(error)
            setStatus('error')
        }
    }

    const [showEndModal, setShowEndModal] = useState(false)

    const endInterview = () => {
        setShowEndModal(true)
    }

    const confirmEndInterview = () => {
        setShowEndModal(false)
        synthesisRef.current?.cancel()
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        }
        setStatus('finished')
    }

    if (!interview || !currentQuestion && status !== 'finished') {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden text-white font-inter">
            {/* Visualizer Background */}
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none">
                {status === 'speaking' && (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-[500px] h-[500px] bg-blue-500 rounded-full blur-[100px]"
                    />
                )}
                {status === 'listening' && (
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-[500px] h-[500px] bg-purple-500 rounded-full blur-[100px]"
                    />
                )}
            </div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl">M</div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tight">{interview.topic} Mock Interview</h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{interview.difficulty} • {interview.duration}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 flex items-center gap-2 text-slate-300">
                        <Clock className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-400' : 'text-blue-400'}`} />
                        <span className={`font-mono text-sm font-bold ${timeLeft < 60 ? 'text-red-400' : ''}`}>{formatTime(timeLeft)}</span>
                    </div>

                    <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === 'evaluating' ? 'bg-yellow-400' : status === 'speaking' ? 'bg-blue-400' : status === 'listening' ? 'bg-purple-400' : 'bg-slate-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${status === 'evaluating' ? 'bg-yellow-500' : status === 'speaking' ? 'bg-blue-500' : status === 'listening' ? 'bg-purple-500' : 'bg-slate-500'}`}></span>
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                            {status === 'idle' ? 'Ready' : status === 'speaking' ? 'Interviewer Speaking' : status === 'listening' ? 'Listening...' : status === 'evaluating' ? 'Evaluating...' : 'Finished'}
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Stage */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">

                {status === 'finished' ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tight">Interview Completed</h2>
                        <p className="text-slate-400 max-w-md mx-auto">Your responses have been recorded and evaluated. You can now safely exit or view your detailed feedback report.</p>

                        <div className="pt-8 flex flex-col items-center gap-4">
                            <button
                                onClick={() => router.push(`/ai-tools/mock-interview/report/${interviewId}`)}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-lg shadow-blue-500/20"
                            >
                                View Final Report
                            </button>
                            <button
                                onClick={() => router.push("/ai-tools/mock-interview")}
                                className="px-8 py-3 text-slate-400 hover:text-white font-bold uppercase tracking-widest text-[10px] transition-colors"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Conversation Display */}
                        <div className="w-full bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-md mb-8 min-h-[300px] flex flex-col justify-end">
                            <AnimatePresence mode="popLayout">
                                {currentQuestion && (
                                    <motion.div
                                        key={currentQuestion.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-6 w-full"
                                    >
                                        {/* Question Bubble */}
                                        <div className="flex gap-4 max-w-[85%]">
                                            <div className="w-10 h-10 shrink-0 bg-blue-600 rounded-full flex items-center justify-center mt-1">
                                                <Volume2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="bg-white/5 border border-white/10 rounded-tl-none rounded-3xl p-6">
                                                <p className="text-lg leading-relaxed text-slate-200">
                                                    {currentQuestion.questionText}
                                                </p>
                                                {status === 'idle' && (
                                                    <button
                                                        onClick={() => speakQuestion(currentQuestion.questionText)}
                                                        className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300"
                                                    >
                                                        <Play className="w-3 h-3" /> Replay Question
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Live Transcript Bubble */}
                                        {(status === 'listening' || transcript) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex gap-4 max-w-[85%] self-end ml-auto flex-row-reverse"
                                            >
                                                <div className="w-10 h-10 shrink-0 bg-purple-600 rounded-full flex items-center justify-center mt-1">
                                                    <User className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="bg-purple-600/10 border border-purple-500/20 rounded-tr-none rounded-3xl p-6">
                                                    <p className="text-lg leading-relaxed text-slate-300">
                                                        {transcript || <span className="text-slate-500 animate-pulse block">Listening to your response...</span>}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4 w-full max-w-2xl mx-auto justify-between">
                            {/* Skip Question Button */}
                            {status !== 'evaluating' && (
                                <button
                                    onClick={skipQuestion}
                                    disabled={status === 'speaking'}
                                    className={`px-6 py-4 rounded-2xl flex items-center gap-2 transition-all group
                                        ${status === 'speaking' ? 'text-slate-600 cursor-not-allowed opacity-50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                    title="Skip this question"
                                >
                                    <SkipForward className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">Skip</span>
                                </button>
                            )}

                            {/* Main Action Button */}
                            <div className="flex-1 flex justify-center">
                                {status === 'evaluating' ? (
                                    <div className="px-8 py-6 bg-yellow-500/10 border border-yellow-500/20 rounded-3xl flex items-center gap-4">
                                        <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                                        <span className="text-sm font-black uppercase tracking-widest text-yellow-400">Evaluating your answer...</span>
                                    </div>
                                ) : status === 'listening' ? (
                                    <button
                                        onClick={stopListeningAndEvaluate}
                                        className="px-10 py-6 bg-red-600 hover:bg-red-500 text-white rounded-[2rem] shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all flex items-center gap-4 group"
                                    >
                                        <Square className="w-6 h-6 fill-current group-hover:scale-90 transition-transform" />
                                        <div className="text-left leading-none">
                                            <div className="text-xl font-black uppercase tracking-tight">Stop Recording</div>
                                            <div className="text-[10px] font-bold text-red-200 uppercase tracking-widest mt-1">Submit Answer</div>
                                        </div>
                                    </button>
                                ) : (
                                    <button
                                        onClick={startListening}
                                        disabled={status === 'speaking'}
                                        className={`px-10 py-6 rounded-[2rem] transition-all flex items-center gap-4 group
                                        ${status === 'speaking'
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_40px_rgba(147,51,234,0.4)]'}`}
                                    >
                                        <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        <div className="text-left leading-none">
                                            <div className="text-xl font-black uppercase tracking-tight">Tap to Answer</div>
                                            <div className="text-[10px] font-bold text-purple-200 uppercase tracking-widest mt-1">Start Recording</div>
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* Submit Interview Button */}
                            {status !== 'evaluating' && (
                                <button
                                    onClick={endInterview}
                                    className="px-6 py-4 rounded-2xl flex items-center gap-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all group"
                                    title="Submit / End Interview Early"
                                >
                                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline-block">End</span>
                                </button>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Custom End Modal */}
            <AnimatePresence>
                {showEndModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                        >
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight text-center mb-4">End Interview?</h3>
                            <p className="text-slate-400 text-center mb-8">
                                Are you sure you want to end and submit your interview early? Any remaining questions will be marked as skipped.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={() => setShowEndModal(false)}
                                    className="w-full px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmEndInterview}
                                    className="w-full px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all flex justify-center items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" /> Yes, End Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
