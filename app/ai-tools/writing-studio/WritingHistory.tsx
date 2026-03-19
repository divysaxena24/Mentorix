"use client"

import { FileText, Trash2, ArrowLeft, History } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface WritingHistoryProps {
    history: any[];
    fetching: boolean;
    onDelete: (id: number) => void;
    onOpen: (item: any) => void;
    title: string;
    onInitiate: () => void;
}

export default function WritingHistory({
    history,
    fetching,
    onDelete,
    onOpen,
    title,
    onInitiate
}: WritingHistoryProps) {
    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                <div className="w-12 h-12 border-4 border-t-blue-500 border-white/5 rounded-full animate-spin mb-6" />
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[9px]">Accessing Secure History...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white/2 rounded-5xl border border-white/5 backdrop-blur-3xl">
                <History className="w-16 h-16 text-slate-800 mb-8 opacity-20" />
                <h3 className="text-2xl font-black mb-3 uppercase tracking-tighter">History Empty</h3>
                <p className="text-slate-500 max-w-xs text-center font-bold text-[11px] uppercase tracking-widest leading-loose opacity-60 px-8">You haven't archived any {title} documents yet.</p>
                <button
                    onClick={onInitiate}
                    className="mt-10 px-10 py-4 bg-white text-black rounded-xl text-[9px] font-black hover:bg-slate-100 transition-all shadow-xl hover:scale-105 uppercase tracking-[0.3em]"
                >
                    Initiate Document
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => (
                <div
                    key={item.id}
                    className="group relative bg-white/3 border border-white/10 rounded-4xl p-4 hover:bg-white/6 transition-all duration-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.01)]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shadow-2xl border border-white/10 group-hover:scale-110 transition-transform duration-500">
                            <FileText className="w-5 h-5 text-white opacity-80" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button className="p-2.5 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-xl transition-all">
                                        <Trash2 className="w-4.5 h-4.5" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-[#020617] border-white/10 text-white rounded-4xl p-10">
                                    <AlertDialogHeader className="space-y-4">
                                        <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Erase Document?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-400 font-bold text-[13px] uppercase tracking-widest leading-loose">
                                            This action will permanently purge this document from your secure history.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-10">
                                        <AlertDialogCancel className="bg-white/5 border-white/10 rounded-xl hover:bg-white/10 hover:text-white px-6 py-3.5 text-[9px] font-black uppercase">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onDelete(item.id)}
                                            className="bg-red-600 hover:bg-red-700 rounded-xl font-black text-[9px] uppercase tracking-widest px-6 py-3.5"
                                        >
                                            Purge Record
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <h4 className="text-base font-black line-clamp-2 mb-2 uppercase tracking-tight leading-tight group-hover:text-blue-400 transition-colors">
                        {item.context}
                    </h4>
                    <p className="text-[9px] text-slate-500 line-clamp-3 leading-relaxed font-bold tracking-wide mb-4 uppercase opacity-60">
                        {item.generatedContent}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <button
                            onClick={() => onOpen(item)}
                            className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] hover:text-white transition-colors"
                        >
                            Open in Studio
                        </button>
                        <button
                            onClick={() => onOpen(item)}
                            className="w-9 h-9 rounded-xl bg-white/5 shadow-inner flex items-center justify-center hover:bg-white hover:text-black transition-all"
                        >
                            <ArrowLeft className="w-4.5 h-4.5 rotate-180" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
