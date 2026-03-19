"use client"

import { ElementType } from "react"

interface SectionHeaderProps {
    title: string;
    icon: ElementType;
}

export default function ResumeSectionHeader({ title, icon: Icon }: SectionHeaderProps) {
    return (
        <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-center justify-center shadow-2xl backdrop-blur-3xl group transition-all hover:bg-white/10 hover:border-white/20">
                <Icon className="w-6 h-6 text-blue-500 transition-transform group-hover:scale-110" />
            </div>
            <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                    {title}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                    <div className="h-1 w-8 bg-blue-600 rounded-full" />
                    <div className="h-1 w-1 bg-blue-600/30 rounded-full" />
                    <div className="h-1 w-1 bg-blue-600/10 rounded-full" />
                </div>
            </div>
        </div>
    );
}
