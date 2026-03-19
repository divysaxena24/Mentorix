"use client"

import { Code, Sparkles, Trash2, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResumeData } from "@/types"
import ResumeSectionHeader from "./ResumeSectionHeader"

interface ResumeSkillsProjectsProps {
    data: ResumeData;
    onChange: (data: ResumeData) => void;
}

export default function ResumeSkillsProjects({ data, onChange }: ResumeSkillsProjectsProps) {
    const handleAddSkillGroup = () => {
        onChange({ ...data, skills: [...data.skills, { category: "", skills: [] }] });
    };

    const handleRemoveSkillGroup = (idx: number) => {
        const newSkills = [...data.skills];
        newSkills.splice(idx, 1);
        onChange({ ...data, skills: newSkills });
    };

    const handleSkillCategoryChange = (idx: number, value: string) => {
        const newSkills = [...data.skills];
        newSkills[idx].category = value;
        onChange({ ...data, skills: newSkills });
    };

    const handleSkillsChange = (idx: number, value: string) => {
        const newSkills = [...data.skills];
        newSkills[idx].skills = value.split(",").map(s => s.trim());
        onChange({ ...data, skills: newSkills });
    };

    const handleAddProject = () => {
        onChange({
            ...data,
            projects: [...data.projects, {
                title: "",
                description: "",
                technologies: [],
                link: ""
            }]
        });
    };

    const handleRemoveProject = (idx: number) => {
        const newProjects = [...data.projects];
        newProjects.splice(idx, 1);
        onChange({ ...data, projects: newProjects });
    };

    const handleProjectChange = (idx: number, field: string, value: any) => {
        const newProjects = [...data.projects];
        (newProjects[idx] as any)[field] = value;
        onChange({ ...data, projects: newProjects });
    };

    return (
        <div className="space-y-16">
            <div className="space-y-12">
                <ResumeSectionHeader title="Skills" icon={Code} />
                <div className="space-y-8">
                    {data.skills.map((skillGroup, idx) => (
                        <div key={idx} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative group shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500 space-y-8">
                            <button
                                onClick={() => handleRemoveSkillGroup(idx)}
                                className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Skill Category</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={skillGroup.category || ""}
                                    onChange={e => handleSkillCategoryChange(idx, e.target.value)}
                                    placeholder="e.g. Frontend Development, Data Analysis"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Skills (Comma separated)</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={skillGroup.skills?.join(", ") || ""}
                                    onChange={e => handleSkillsChange(idx, e.target.value)}
                                    placeholder="PyTorch, AWS, Docker..."
                                />
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={handleAddSkillGroup}
                        className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-white/5 transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                    >
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Plus className="w-5 h-5" />
                        </div>
                        Add Skill Category
                    </button>
                </div>
            </div>

            <div className="space-y-12">
                <ResumeSectionHeader title="Projects" icon={Sparkles} />
                <div className="space-y-8">
                    {data.projects.map((project, idx) => (
                        <div key={idx} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative group shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500 space-y-8">
                            <button
                                onClick={() => handleRemoveProject(idx)}
                                className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Project Title</Label>
                                    <Input
                                        className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                        value={project.title || ""}
                                        onChange={e => handleProjectChange(idx, "title", e.target.value)}
                                        placeholder="e.g. Personal Portfolio"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Project Link</Label>
                                    <Input
                                        className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                        value={project.link || ""}
                                        onChange={e => handleProjectChange(idx, "link", e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Tech Stack (Comma separated)</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={project.technologies?.join(", ") || ""}
                                    onChange={e => handleProjectChange(idx, "technologies", e.target.value.split(",").map((t: string) => t.trim()))}
                                    placeholder="React, Node.js..."
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Description</Label>
                                <textarea
                                    className="w-full min-h-[100px] p-6 bg-white/5 border border-white/10 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm backdrop-blur-xl"
                                    value={project.description || ""}
                                    onChange={e => handleProjectChange(idx, "description", e.target.value)}
                                    placeholder="Project overview and key achievements..."
                                />
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={handleAddProject}
                        className="w-full py-8 border-2 border-dashed border-white/10 rounded-[2.5rem] text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-white/5 transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                    >
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Plus className="w-5 h-5" />
                        </div>
                        Add Project
                    </button>
                </div>
            </div>
        </div>
    );
}
