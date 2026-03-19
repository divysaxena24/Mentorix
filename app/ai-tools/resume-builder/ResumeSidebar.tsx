"use client"

import { User, Briefcase, GraduationCap, Code, Sparkles, Layout } from "lucide-react"

interface ResumeSidebarProps {
    steps: { id: number; name: string; icon: any }[];
    currentStep: number;
    onStepChange: (step: number) => void;
    sidebarSize: number;
}

export default function ResumeSidebar({ steps, currentStep, onStepChange, sidebarSize }: ResumeSidebarProps) {
    return (
        <div id="sidebar-nav" className={`h-full border-r border-white/5 p-8 space-y-3 bg-white/2 backdrop-blur-xl overflow-y-auto custom-scrollbar transition-all duration-300 ${sidebarSize <= 17 ? "px-4" : "p-8"}`}>
            <div className={`mb-10 px-4 transition-opacity duration-300 ${sidebarSize <= 17 ? "opacity-0 h-0 mb-0 overflow-hidden" : "opacity-100"}`}>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 whitespace-nowrap">Sections</h3>
                <div className="h-0.5 w-8 bg-blue-500/30 rounded-full" />
            </div>
            <div className="space-y-3">
                {steps.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => onStepChange(s.id)}
                        className={`w-full flex items-center gap-4 rounded-[1.8rem] text-xs font-black uppercase tracking-widest transition-all group relative overflow-hidden ${sidebarSize <= 17 ? "justify-center px-0 py-6" : "px-6 py-4"} ${currentStep === s.id
                            ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)] translate-x-1"
                            : "text-slate-500 hover:text-white hover:bg-white/5"
                            }`}
                        title={sidebarSize <= 17 ? s.name : ""}
                    >
                        <s.icon className={`w-4 h-4 transition-transform group-hover:scale-110 flex-shrink-0 ${currentStep === s.id ? "text-blue-600" : "text-slate-600"}`} />
                        <span className={`relative z-10 transition-all duration-300 whitespace-nowrap ${sidebarSize <= 17 ? "opacity-0 w-0 scale-0 overflow-hidden invisible" : "opacity-100 w-auto scale-100 visible"}`}>
                            {s.name}
                        </span>
                        {currentStep === s.id && (
                            <div className={`absolute bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)] transition-all ${sidebarSize <= 17 ? "bottom-2 w-1 h-1" : "right-4 w-1.5 h-1.5"}`} />
                        )}
                    </button>
                ))}
            </div>

            <div className={`mt-12 transition-all duration-300 ${sidebarSize <= 17 ? "opacity-0 scale-0 pointer-events-none hidden" : "opacity-100 scale-100"}`}>
                <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10 backdrop-blur-3xl">
                    <Sparkles className="w-5 h-5 text-blue-400 mb-3" />
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                        Content optimization is active.
                    </p>
                </div>
            </div>
        </div>
    );
}
