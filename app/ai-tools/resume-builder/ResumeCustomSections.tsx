"use client"

import { Layout, ShieldCheck, Languages, Heart, BookOpen, Trophy, Users, Terminal, Trash2, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResumeData } from "@/types"
import ResumeSectionHeader from "./ResumeSectionHeader"

interface ResumeCustomSectionsProps {
    data: ResumeData;
    onChange: (data: ResumeData) => void;
}

export default function ResumeCustomSections({ data, onChange }: ResumeCustomSectionsProps) {
    const presets = [
        { title: "Certifications", icon: ShieldCheck },
        { title: "Languages", icon: Languages },
        { title: "Volunteer Work", icon: Heart },
        { title: "Publications", icon: BookOpen },
        { title: "Awards", icon: Trophy },
        { title: "References", icon: Users },
        { title: "Technical Skills", icon: Terminal }
    ];

    const handleAddPreset = (preset: { title: string; icon: any }) => {
        onChange({
            ...data,
            customSections: [
                ...(data.customSections || []),
                { id: Math.random().toString(36).substr(2, 9), title: preset.title, items: [{ description: "" }] }
            ]
        });
    };

    const handleRemoveSection = (sIdx: number) => {
        const newSections = [...(data.customSections || [])];
        newSections.splice(sIdx, 1);
        onChange({ ...data, customSections: newSections });
    };

    const handleSectionTitleChange = (sIdx: number, value: string) => {
        const newSections = [...(data.customSections || [])];
        newSections[sIdx].title = value;
        onChange({ ...data, customSections: newSections });
    };

    const handleAddItem = (sIdx: number) => {
        const newSections = [...(data.customSections || [])];
        newSections[sIdx].items.push({ description: "" });
        onChange({ ...data, customSections: newSections });
    };

    const handleRemoveItem = (sIdx: number, iIdx: number) => {
        const newSections = [...(data.customSections || [])];
        newSections[sIdx].items.splice(iIdx, 1);
        onChange({ ...data, customSections: newSections });
    };

    const handleItemChange = (sIdx: number, iIdx: number, field: string, value: string) => {
        const newSections = [...(data.customSections || [])];
        (newSections[sIdx].items[iIdx] as any)[field] = value;
        onChange({ ...data, customSections: newSections });
    };

    const handleAddCustomSection = () => {
        onChange({
            ...data,
            customSections: [
                ...(data.customSections || []),
                { id: Math.random().toString(36).substr(2, 9), title: "", items: [{ description: "" }] }
            ]
        });
    };

    return (
        <div className="space-y-16">
            <div className="space-y-8">
                <ResumeSectionHeader title="Custom Sections" icon={Layout} />

                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Presets</Label>
                    <div className="flex flex-wrap gap-3">
                        {presets.map((preset) => (
                            <button
                                key={preset.title}
                                onClick={() => handleAddPreset(preset)}
                                className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-blue-600/10 hover:border-blue-500/20 transition-all group"
                            >
                                <preset.icon className="w-3.5 h-3.5 text-blue-500 group-hover:scale-110 transition-transform" />
                                {preset.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                {(data.customSections || []).map((section, sIdx) => (
                    <div key={section.id} className="p-10 bg-white/5 rounded-[3rem] border border-white/10 relative group shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                        <button
                            onClick={() => handleRemoveSection(sIdx)}
                            className="absolute top-6 right-6 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Section Title</Label>
                                <Input
                                    className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 backdrop-blur-xl"
                                    value={section.title}
                                    onChange={e => handleSectionTitleChange(sIdx, e.target.value)}
                                    placeholder="e.g. Certifications, Volunteer Work, Publications"
                                />
                            </div>

                            <div className="space-y-6">
                                {section.items.map((item, iIdx) => (
                                    <div key={iIdx} className="p-6 bg-white/5 rounded-2xl border border-white/5 relative group/item">
                                        <button
                                            onClick={() => handleRemoveItem(sIdx, iIdx)}
                                            className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl opacity-0 group-hover/item:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Title</Label>
                                                <Input
                                                    className="h-10 px-4 bg-white/5 border-white/10 rounded-xl"
                                                    value={item.title || ""}
                                                    onChange={e => handleItemChange(sIdx, iIdx, "title", e.target.value)}
                                                    placeholder="e.g. AWS Certified"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Sub-header</Label>
                                                <Input
                                                    className="h-10 px-4 bg-white/5 border-white/10 rounded-xl"
                                                    value={item.subtitle || ""}
                                                    onChange={e => handleItemChange(sIdx, iIdx, "subtitle", e.target.value)}
                                                    placeholder="e.g. Associate Level"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Temporal Marker</Label>
                                                <Input
                                                    className="h-10 px-4 bg-white/5 border-white/10 rounded-xl"
                                                    value={item.date || ""}
                                                    onChange={e => handleItemChange(sIdx, iIdx, "date", e.target.value)}
                                                    placeholder="Dec 2023"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Location</Label>
                                                <Input
                                                    className="h-10 px-4 bg-white/5 border-white/10 rounded-xl"
                                                    value={item.location || ""}
                                                    onChange={e => handleItemChange(sIdx, iIdx, "location", e.target.value)}
                                                    placeholder="Remote / City"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Description</Label>
                                            <textarea
                                                className="w-full min-h-[80px] p-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none text-white text-xs backdrop-blur-xl"
                                                value={item.description}
                                                onChange={e => handleItemChange(sIdx, iIdx, "description", e.target.value)}
                                                placeholder="Detailed accomplishments..."
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleAddItem(sIdx)}
                                    className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-3 h-3" />
                                    Append Sub-Node
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAddCustomSection}
                    className="w-full py-8 border-2 border-dashed border-white/20 rounded-[2.5rem] bg-blue-600/5 text-blue-400 hover:bg-blue-600/10 hover:text-white transition-all font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 group"
                >
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Plus className="w-5 h-5" />
                    </div>
                    Add Custom Section
                </button>
            </div>
        </div>
    );
}
