"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Page Error:", error)
    }, [error])

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                        Something Went Wrong
                    </h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        An unexpected error occurred. Please try again.
                    </p>
                </div>

                <button
                    onClick={reset}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.3)]"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        </div>
    )
}
