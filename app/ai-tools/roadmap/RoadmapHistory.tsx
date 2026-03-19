"use client"

import { RoadmapResult } from "@/types"
import { Map, Loader2, Trash2 } from "lucide-react"
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

interface RoadmapHistoryProps {
    history: RoadmapResult[];
    fetching: boolean;
    onSelect: (roadmap: RoadmapResult) => void;
    onDelete: (id: string | number) => void;
}

export default function RoadmapHistory({ history, fetching, onSelect, onDelete }: RoadmapHistoryProps) {
    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Strategy History...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-32 bg-white/2 border border-dashed border-white/10 rounded-5xl">
                <Map className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">No Roadmaps Yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-medium">Generate your first career roadmap to see it here.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {history.map((item) => (
                <div
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="group relative bg-white/5 border border-white/5 hover:border-white/20 rounded-4xl p-8 transition-all duration-500 hover:-translate-y-2 hover:bg-white/8 shadow-2xl cursor-pointer"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="p-3 bg-blue-600/10 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 border border-blue-600/20">
                            <Map className="w-6 h-6" />
                        </div>
                        <div onClick={(e) => e.stopPropagation()} className="relative z-20">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button className="p-2 text-slate-500 hover:text-red-400 transition-colors bg-white/5 rounded-xl opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-slate-950 border-white/10 rounded-4xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-white font-black uppercase tracking-tight">Delete Roadmap</AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-400 font-medium">
                                            Are you sure? This will permanently delete this roadmap and all its associated data.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                item.id && onDelete(item.id);
                                            }}
                                            className="bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl"
                                        >
                                            Delete Permanently
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-white mb-4 line-clamp-2 uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                        {item.targetField || item.title}
                    </h3>

                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">
                        Created {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                    </div>

                    <div className="w-full py-4 bg-white/5 group-hover:bg-white text-slate-400 group-hover:text-black border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-center transition-all shadow-lg">
                        View Strategy Result
                    </div>
                </div>
            ))}
        </div>
    );
}
