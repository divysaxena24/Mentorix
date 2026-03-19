"use client"

import { Target, Building2, Map, Save, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import axios from "axios"

interface CareerGoalsProps {
    goals?: {
        targetRole: string
        preferredDomain: string
        targetCompanies: string
    } | null
    onUpdate: () => void
}

export default function CareerGoals({ goals, onUpdate }: CareerGoalsProps) {
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({
        targetRole: goals?.targetRole || "",
        preferredDomain: goals?.preferredDomain || "",
        targetCompanies: goals?.targetCompanies || ""
    })

    useEffect(() => {
        if (goals) {
            setData({
                targetRole: goals.targetRole || "",
                preferredDomain: goals.preferredDomain || "",
                targetCompanies: goals.targetCompanies || ""
            })
        }
    }, [goals])

    const handleSave = async () => {
        setLoading(true)
        try {
            await axios.patch("/api/profile", {
                type: "goals",
                data
            })
            toast.success("Career goals updated!")
            onUpdate()
        } catch (error: any) {
            toast.error("Failed to save goals")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
            <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Career Goals</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manually set your targets for personalized AI insights</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save Goals
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Target className="w-3 h-3 text-blue-400" /> Target Role
                        </label>
                        <input
                            value={data.targetRole}
                            onChange={(e) => setData({ ...data, targetRole: e.target.value })}
                            placeholder="e.g. Software Engineer"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Map className="w-3 h-3 text-purple-400" /> Preferred Domain
                        </label>
                        <input
                            value={data.preferredDomain}
                            onChange={(e) => setData({ ...data, preferredDomain: e.target.value })}
                            placeholder="e.g. Backend / AI"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Building2 className="w-3 h-3 text-green-400" /> Target Companies
                        </label>
                        <input
                            value={data.targetCompanies}
                            onChange={(e) => setData({ ...data, targetCompanies: e.target.value })}
                            placeholder="e.g. Google, Amazon"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
