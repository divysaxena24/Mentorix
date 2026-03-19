"use client"

import { Briefcase, Trash2, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResumeData } from "@/types"
import ResumeSectionHeader from "./ResumeSectionHeader"

interface ResumeExperienceProps {
    data: ResumeData;
    onChange: (data: ResumeData) => void;
}

export default function ResumeExperience({ data, onChange }: ResumeExperienceProps) {
    const handleAddExperience = () => {
        onChange({
            ...data,
            experience: [...data.experience, {
                company: "",
                role: "",
                location: "",
                startDate: "",
                endDate: "",
                description: ""
            }]
        });
    };

    const handleRemoveExperience = (idx: number) => {
        const newExp = [...data.experience];
        newExp.splice(idx, 1);
        onChange({ ...data, experience: newExp });
    };

    const handleExperienceChange = (idx: number, field: string, value: string) => {
        const newExp = [...data.experience];
        (newExp[idx] as any)[field] = value;
        onChange({ ...data, experience: newExp });
    };

    return (
        <div className="space-y-12">
            <ResumeSectionHeader title="Professional Experience" icon={Briefcase} />
            <div className="space-y-8">
                {data.experience.map((exp, idx) => (
                    <div key={idx} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative group shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                        <button
                            onClick={() => handleRemoveExperience(idx)}
                            className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Company</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={exp.company || ""}
                                    onChange={e => handleExperienceChange(idx, "company", e.target.value)}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Role</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={exp.role || ""}
                                    onChange={e => handleExperienceChange(idx, "role", e.target.value)}
                                    placeholder="e.g. Software Engineer"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Start Date</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={exp.startDate || ""}
                                    onChange={e => handleExperienceChange(idx, "startDate", e.target.value)}
                                    placeholder="Oct 2022"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">End Date</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={exp.endDate || ""}
                                    onChange={e => handleExperienceChange(idx, "endDate", e.target.value)}
                                    placeholder="Present"
                                />
                            </div>
                        </div>
                        <div className="mt-8 space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Description</Label>
                            <textarea
                                className="w-full min-h-[120px] p-6 bg-white/5 border border-white/10 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm backdrop-blur-xl"
                                value={exp.description || ""}
                                onChange={e => handleExperienceChange(idx, "description", e.target.value)}
                                placeholder="Key impact and achievements..."
                            />
                        </div>
                    </div>
                ))}
                <button
                    onClick={handleAddExperience}
                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-white/5 transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                >
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Plus className="w-5 h-5" />
                    </div>
                    Add Experience
                </button>
            </div>
        </div>
    );
}
