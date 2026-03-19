import { Suspense } from "react"
import { Metadata } from "next"
import { Loader2 } from "lucide-react"
import CareerChatClient from "./CareerChatClient"

export const metadata: Metadata = {
    title: "AI Career Advisory Agent | Mentorix Professional Tools",
    description: "Get personalized career advice, interview preparation tips, and resume revision suggestions from Mentorix's intelligent AI Career Agent. Chat anytime, anywhere.",
}

export default function CareerChatPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Connecting to Career Agent...</p>
            </div>
        }>
            <CareerChatClient />
        </Suspense>
    )
}
