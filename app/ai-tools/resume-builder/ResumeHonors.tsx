"use client"

import { Sparkles, Trophy, Trash2, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResumeData } from "@/types"
import ResumeSectionHeader from "./ResumeSectionHeader"

interface ResumeHonorsProps {
    data: ResumeData;
    onChange: (data: ResumeData) => void;
}

export default function ResumeHonors({ data, onChange }: ResumeHonorsProps) {
    const handleAddHonor = () => {
        onChange({ ...data, honors: [...(data.honors || []), ""] });
    };

    const handleRemoveHonor = (idx: number) => {
        const newHonors = [...(data.honors || [])];
        newHonors.splice(idx, 1);
        onChange({ ...data, honors: newHonors });
    };

    const handleHonorChange = (idx: number, value: string) => {
        const newHonors = [...(data.honors || [])];
        newHonors[idx] = value;
        onChange({ ...data, honors: newHonors });
    };

    return (
        <div className="space-y-12">
            <ResumeSectionHeader title="Honors & Awards" icon={Sparkles} />
            <div className="space-y-6">
                {(data.honors || []).map((honor, idx) => (
                    <div key={idx} className="flex gap-4 items-center group animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <Trophy className="w-4 h-4 text-blue-500/50" />
                            </div>
                            <Input
                                className="h-14 pl-14 pr-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl transition-all"
                                value={honor}
                                onChange={e => handleHonorChange(idx, e.target.value)}
                                placeholder="e.g. Strategic Growth Award 2024"
                            />
                        </div>
                        <button
                            onClick={() => handleRemoveHonor(idx)}
                            className="p-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-xl backdrop-blur-xl"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
                <button
                    onClick={handleAddHonor}
                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-white/5 transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 group"
                >
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Plus className="w-5 h-5" />
                    </div>
                    Add Honor
                </button>
            </div>
        </div>
    );
}
