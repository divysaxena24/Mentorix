import { useState, useEffect } from "react"
import axios from "axios"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
import { Github, Linkedin, Globe, Code, ExternalLink, Plus, Trash2, Pencil, Loader2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

interface Link {
    id?: number
    platform: string
    url: string
}

interface ProfessionalLinksProps {
    links: Link[]
    onUpdate: () => void
}

const platformIcons: Record<string, any> = {
    github: Github,
    linkedin: Linkedin,
    leetcode: Code,
    portfolio: Globe,
    blog: Globe,
    medium: Globe,
    kaggle: Code,
    codeforces: Code
}

export default function ProfessionalLinks({ links = [], onUpdate }: ProfessionalLinksProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editableLinks, setEditableLinks] = useState<any[]>(links)

    const [showCloseConfirm, setShowCloseConfirm] = useState(false)

    // Sync local state when props change
    useEffect(() => { setEditableLinks(JSON.parse(JSON.stringify(links))) }, [links])

    const hasChanges = () => {
        return JSON.stringify(editableLinks) !== JSON.stringify(links)
    }

    const handleOpenChange = (open: boolean) => {
        if (!open && hasChanges()) {
            setShowCloseConfirm(true)
        } else {
            setIsEditing(open)
            if (open) setEditableLinks(JSON.parse(JSON.stringify(links)))
        }
    }

    const handleAddLink = () => {
        setEditableLinks([...editableLinks, { platform: "", url: "" }])
    }

    const handleRemoveLink = (index: number) => {
        setEditableLinks(editableLinks.filter((_, i) => i !== index))
    }

    const handleUpdate = async () => {
        setLoading(true)
        try {
            await axios.patch("/api/profile", {
                type: "links",
                data: editableLinks.filter(l => l.platform && l.url)
            })
            toast.success("Links updated successfully")
            onUpdate()
            setIsEditing(false)
        } catch (error) {
            toast.error("Failed to update links")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">Professional Links</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Connect your engineering presence</p>
                    </div>

                    <Dialog open={isEditing} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                            <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                <Pencil className="w-4 h-4" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Edit Professional Links</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-6">
                                {editableLinks.map((link, index) => (
                                    <div key={index} className="flex items-end gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Platform (e.g. GitHub)</Label>
                                            <Input
                                                value={link.platform || ""}
                                                onChange={(e) => {
                                                    const newLinks = [...editableLinks]
                                                    newLinks[index] = { ...newLinks[index], platform: e.target.value }
                                                    setEditableLinks(newLinks)
                                                }}
                                                placeholder="GitHub, LinkedIn, Portfolio..."
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div className="flex-[2] space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">URL</Label>
                                            <Input
                                                value={link.url || ""}
                                                onChange={(e) => {
                                                    const newLinks = [...editableLinks]
                                                    newLinks[index] = { ...newLinks[index], url: e.target.value }
                                                    setEditableLinks(newLinks)
                                                }}
                                                placeholder="https://..."
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-400 hover:bg-red-400/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-400">
                                                        This will remove this professional link from your profile. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleRemoveLink(index)}
                                                        className="bg-red-600 hover:bg-red-500 text-white"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                                <Button
                                    onClick={handleAddLink}
                                    className="w-full bg-white/5 border border-dashed border-white/20 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest py-8 rounded-2xl"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add New Link
                                </Button>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleUpdate}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-6 rounded-2xl"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save All Links"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
                        <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                    Unsaved Changes
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                    You have unsaved changes in your professional links. Discard them?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Keep Editing</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        setShowCloseConfirm(false)
                                        setIsEditing(false)
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white"
                                >
                                    Discard
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {links.map((link, i) => {
                        const Icon = platformIcons[link.platform?.toLowerCase()] || Globe
                        return (
                            <motion.a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group"
                            >
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 group-hover:bg-blue-600 transition-colors">
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{link.platform}</p>
                                    <p className="text-xs font-bold text-white truncate">{link.url.replace(/^https?:\/\//, '')}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                            </motion.a>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
