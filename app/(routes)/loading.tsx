import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                <Loader2 className="w-12 h-12 text-blue-500 animate-[spin_2s_linear_infinite] relative z-10" />
            </div>
            <div className="space-y-2 text-center">
                <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Loading</p>
                <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">Please wait...</p>
            </div>
        </div>
    )
}
