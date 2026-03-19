"use client"

import { User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResumeData } from "@/types"
import ResumeSectionHeader from "./ResumeSectionHeader"

interface ResumePersonalInfoProps {
    data: ResumeData;
    onChange: (data: ResumeData) => void;
}

export default function ResumePersonalInfo({ data, onChange }: ResumePersonalInfoProps) {
    return (
        <div className="space-y-12">
            <ResumeSectionHeader title="Personal Information" icon={User} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Full Name</Label>
                    <Input
                        className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                        value={data.personalInfo.fullName || ""}
                        onChange={e => onChange({ ...data, personalInfo: { ...data.personalInfo, fullName: e.target.value } })}
                        placeholder="e.g. Alexander Pierce"
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</Label>
                    <Input
                        className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                        value={data.personalInfo.email || ""}
                        onChange={e => onChange({ ...data, personalInfo: { ...data.personalInfo, email: e.target.value } })}
                        placeholder="alexander@interface.com"
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Phone Number</Label>
                    <Input
                        className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                        value={data.personalInfo.phone || ""}
                        onChange={e => onChange({ ...data, personalInfo: { ...data.personalInfo, phone: e.target.value } })}
                        placeholder="+1 888 000 9999"
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Address</Label>
                    <Input
                        className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                        value={data.personalInfo.address || ""}
                        onChange={e => onChange({ ...data, personalInfo: { ...data.personalInfo, address: e.target.value } })}
                        placeholder="San Francisco, CA"
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">LinkedIn Profile</Label>
                    <Input
                        className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                        value={data.personalInfo.linkedin || ""}
                        onChange={e => onChange({ ...data, personalInfo: { ...data.personalInfo, linkedin: e.target.value } })}
                        placeholder="linkedin.com/in/username"
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">GitHub Repository</Label>
                    <Input
                        className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                        value={data.personalInfo.github || ""}
                        onChange={e => onChange({ ...data, personalInfo: { ...data.personalInfo, github: e.target.value } })}
                        placeholder="github.com/username"
                    />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">LeetCode Link</Label>
                    <Input
                        className="h-14 px-6 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-xl transition-all"
                        value={data.personalInfo.leetcode || ""}
                        onChange={e => onChange({ ...data, personalInfo: { ...data.personalInfo, leetcode: e.target.value } })}
                        placeholder="leetcode.com/username"
                    />
                </div>
            </div>
            <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Professional Summary</Label>
                <textarea
                    className="w-full min-h-[180px] p-6 bg-white/5 border border-white/10 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none text-white placeholder:text-slate-600 text-sm leading-relaxed backdrop-blur-xl shadow-2xl"
                    value={data.personalInfo.summary || ""}
                    onChange={e => onChange({ ...data, personalInfo: { ...data.personalInfo, summary: e.target.value } })}
                    placeholder="Briefly describe your experience and skills..."
                />
            </div>
        </div>
    );
}
