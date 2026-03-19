"use client"

import { GraduationCap, Trash2, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResumeData } from "@/types"
import ResumeSectionHeader from "./ResumeSectionHeader"

interface ResumeEducationProps {
    data: ResumeData;
    onChange: (data: ResumeData) => void;
}

export default function ResumeEducation({ data, onChange }: ResumeEducationProps) {
    const handleAddEducation = () => {
        onChange({
            ...data,
            education: [...data.education, {
                institution: "",
                degree: "",
                location: "",
                startDate: "",
                endDate: "",
                cgpa: ""
            }]
        });
    };

    const handleRemoveEducation = (idx: number) => {
        const newEdu = [...data.education];
        newEdu.splice(idx, 1);
        onChange({ ...data, education: newEdu });
    };

    const handleEducationChange = (idx: number, field: string, value: string) => {
        const newEdu = [...data.education];
        (newEdu[idx] as any)[field] = value;
        onChange({ ...data, education: newEdu });
    };

    return (
        <div className="space-y-12">
            <ResumeSectionHeader title="Education" icon={GraduationCap} />
            <div className="space-y-8">
                {data.education.map((edu, idx) => (
                    <div key={idx} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative group shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                        <button
                            onClick={() => handleRemoveEducation(idx)}
                            className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Institution</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={edu.institution || ""}
                                    onChange={e => handleEducationChange(idx, "institution", e.target.value)}
                                    placeholder="e.g. Stanford University"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Degree / Specialization</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={edu.degree || ""}
                                    onChange={e => handleEducationChange(idx, "degree", e.target.value)}
                                    placeholder="B.S. Computer Science"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Start Date</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={edu.startDate || ""}
                                    onChange={e => handleEducationChange(idx, "startDate", e.target.value)}
                                    placeholder="2018"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">End Date</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={edu.endDate || ""}
                                    onChange={e => handleEducationChange(idx, "endDate", e.target.value)}
                                    placeholder="2022"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Metric (CGPA / %)</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={edu.cgpa || ""}
                                    onChange={e => handleEducationChange(idx, "cgpa", e.target.value)}
                                    placeholder="9.8 / 10"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    onClick={handleAddEducation}
                    className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-white/5 transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                >
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Plus className="w-5 h-5" />
                    </div>
                    Add Education
                </button>
            </div>
        </div>
    );
}
