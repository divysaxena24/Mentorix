"use client"

import { Plus } from "lucide-react"

interface WritingHubProps {
    docTypes: any[];
    onSelect: (id: string) => void;
}

export default function WritingHub({ docTypes, onSelect }: WritingHubProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {docTypes.map((type) => (
                <div
                    key={type.id}
                    onClick={() => onSelect(type.id)}
                    className="group relative flex flex-col bg-white/3 border border-white/10 rounded-4xl p-8 cursor-pointer hover:bg-white/6 transition-all duration-700 hover:scale-[1.02] hover:shadow-[0_0_80px_rgba(37,99,235,0.15)] overflow-hidden min-h-[320px]"
                >
                    <div className={`absolute top-0 right-0 w-40 h-40 bg-linear-to-br ${type.color} opacity-0 blur-[80px] -mr-20 -mt-20 group-hover:opacity-20 transition-opacity duration-700`} />

                    <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${type.color} p-4 mb-10 shadow-2xl transform group-hover:rotate-6 group-hover:scale-110 transition-all duration-500`}>
                        <type.icon className="w-full h-full text-white" />
                    </div>

                    <div className="space-y-4 flex-1">
                        <h3 className="text-xl font-black group-hover:text-blue-400 transition-colors uppercase tracking-tight leading-tight">{type.title}</h3>
                        <p className="text-slate-500 text-xs leading-relaxed font-bold tracking-wide">{type.description}</p>
                    </div>

                    <div className="pt-8 mt-auto border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-blue-400 transition-colors">Generate Now</span>
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                            <Plus className="w-5 h-5 group-hover:scale-110" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
