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
import { Textarea } from "@/components/ui/textarea"
import { Briefcase, GraduationCap, Calendar, MapPin, Pencil, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

interface Experience {
    id?: number
    company: string
    role: string
    location?: string
    startDate?: string
    endDate?: string
    description?: string
}

interface Education {
    id?: number
    institution: string
    degree?: string
    fieldOfStudy?: string
    cgpa?: string
    startDate?: string
    endDate?: string
    description?: string
}

interface Achievement {
    id?: number
    title: string
    description?: string
}

interface CareerJourneyProps {
    experience?: Experience[]
    education?: Education[]
    achievements?: Achievement[]
    onUpdate: () => void
}

export default function CareerJourney({
    experience = [],
    education = [],
    achievements = [],
    onUpdate
}: CareerJourneyProps) {
    const [isEditingExp, setIsEditingExp] = useState(false)
    const [isEditingEdu, setIsEditingEdu] = useState(false)
    const [isEditingAch, setIsEditingAch] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showConfirmExp, setShowConfirmExp] = useState(false)
    const [showConfirmEdu, setShowConfirmEdu] = useState(false)
    const [showConfirmAch, setShowConfirmAch] = useState(false)

    // Local States
    const [editableExp, setEditableExp] = useState<Experience[]>(experience)
    const [editableEdu, setEditableEdu] = useState<Education[]>(education)
    const [editableAch, setEditableAch] = useState<Achievement[]>(achievements)

    // Sync local state when props change (for auto-updates)
    useEffect(() => { setEditableExp(JSON.parse(JSON.stringify(experience))) }, [experience])
    useEffect(() => { setEditableEdu(JSON.parse(JSON.stringify(education))) }, [education])
    useEffect(() => { setEditableAch(JSON.parse(JSON.stringify(achievements))) }, [achievements])

    const hasExpChanges = () => JSON.stringify(editableExp) !== JSON.stringify(experience)
    const hasEduChanges = () => JSON.stringify(editableEdu) !== JSON.stringify(education)
    const hasAchChanges = () => JSON.stringify(editableAch) !== JSON.stringify(achievements)

    const handleExpOpenChange = (open: boolean) => {
        if (!open && hasExpChanges()) setShowConfirmExp(true)
        else {
            setIsEditingExp(open)
            if (open) setEditableExp(JSON.parse(JSON.stringify(experience)))
        }
    }

    const handleEduOpenChange = (open: boolean) => {
        if (!open && hasEduChanges()) setShowConfirmEdu(true)
        else {
            setIsEditingEdu(open)
            if (open) setEditableEdu(JSON.parse(JSON.stringify(education)))
        }
    }

    const handleAchOpenChange = (open: boolean) => {
        if (!open && hasAchChanges()) setShowConfirmAch(true)
        else {
            setIsEditingAch(open)
            if (open) setEditableAch(JSON.parse(JSON.stringify(achievements)))
        }
    }

    const handleUpdate = async (type: string, data: any) => {
        setLoading(true)
        try {
            await axios.patch("/api/profile", { type, data })
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`)
            onUpdate()
            if (type === "experience") setIsEditingExp(false)
            if (type === "education") setIsEditingEdu(false)
            if (type === "achievements") setIsEditingAch(false)
        } catch (error) {
            toast.error(`Failed to update ${type}`)
        } finally {
            setLoading(false)
        }
    }

    if (experience.length === 0 && education.length === 0 && achievements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] group hover:bg-white/10 transition-all cursor-pointer" onClick={() => setIsEditingExp(true)}>
                <Plus className="w-8 h-8 text-slate-500 mb-4 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest group-hover:text-white transition-colors">Build Your Career Journey</p>
            </div>
        )
    }

    return (
        <section className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl -mr-32 -mt-32 rounded-full" />

                <div className="relative z-10 space-y-12">
                    {/* Experience Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                    <Briefcase className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Professional Experience</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your career milestones</p>
                                </div>
                            </div>

                            <Dialog open={isEditingExp} onOpenChange={handleExpOpenChange}>
                                <DialogTrigger asChild>
                                    <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-950 border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tight text-white mb-6">Edit Experience</DialogTitle></DialogHeader>
                                    <div className="space-y-6 py-4">
                                        {editableExp.map((exp, idx) => (
                                            <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/10 relative group">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="absolute top-4 right-4 text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        ><Trash2 className="w-4 h-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Experience?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-slate-400">
                                                                This will remove this milestone from your career journey. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => setEditableExp(editableExp.filter((_, i) => i !== idx))}
                                                                className="bg-red-600 hover:bg-red-500 text-white"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">Company</Label><Input value={exp.company || ""} onChange={e => { const n = [...editableExp]; n[idx] = { ...n[idx], company: e.target.value }; setEditableExp(n) }} className="bg-white/5 border-white/10" /></div>
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">Role</Label><Input value={exp.role || ""} onChange={e => { const n = [...editableExp]; n[idx] = { ...n[idx], role: e.target.value }; setEditableExp(n) }} className="bg-white/5 border-white/10" /></div>
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">Start Date</Label><Input value={exp.startDate || ""} onChange={e => { const n = [...editableExp]; n[idx] = { ...n[idx], startDate: e.target.value }; setEditableExp(n) }} className="bg-white/5 border-white/10" /></div>
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">End Date</Label><Input value={exp.endDate || ""} onChange={e => { const n = [...editableExp]; n[idx] = { ...n[idx], endDate: e.target.value }; setEditableExp(n) }} className="bg-white/5 border-white/10" placeholder="Present" /></div>
                                                    <div className="space-y-2 col-span-2"><Label className="text-[10px] font-black uppercase text-slate-500">Location</Label><Input value={exp.location || ""} onChange={e => { const n = [...editableExp]; n[idx] = { ...n[idx], location: e.target.value }; setEditableExp(n) }} className="bg-white/5 border-white/10" /></div>
                                                    <div className="space-y-2 col-span-2"><Label className="text-[10px] font-black uppercase text-slate-500">Description</Label><Textarea value={exp.description || ""} onChange={e => { const n = [...editableExp]; n[idx] = { ...n[idx], description: e.target.value }; setEditableExp(n) }} className="bg-white/5 border-white/10 min-h-[80px]" /></div>
                                                </div>
                                            </div>
                                        ))}
                                        <Button onClick={() => setEditableExp([...editableExp, { company: "", role: "", startDate: "", endDate: "" }])} className="w-full bg-white/5 border border-dashed border-white/20 py-8 rounded-3xl"><Plus className="w-4 h-4 mr-2" /> Add Experience</Button>
                                    </div>
                                    <DialogFooter><Button onClick={() => handleUpdate("experience", editableExp)} disabled={loading} className="w-full bg-blue-600 py-6 rounded-2xl font-black uppercase">{loading ? <Loader2 className="animate-spin" /> : "Save Experience"}</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <AlertDialog open={showConfirmExp} onOpenChange={setShowConfirmExp}>
                                <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                            Unsaved Experience
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-400">Discard changes to your professional experience?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Keep Editing</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => { setShowConfirmExp(false); setIsEditingExp(false) }} className="bg-red-600 hover:bg-red-500 text-white">Discard</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {experience.map((exp, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    className="group bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-all font-inter"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{exp.role}</h3>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{exp.company}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                                <Calendar className="w-3 h-3 text-blue-400" /> {exp.startDate} - {exp.endDate || "Present"}
                                            </span>
                                            {exp.location && (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                                    <MapPin className="w-3 h-3 text-purple-400" /> {exp.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {exp.description && (
                                        <div className="text-sm text-slate-400 leading-relaxed font-medium space-y-1">
                                            {(() => {
                                                try {
                                                    // If it's a JSON string (likely an array)
                                                    if (exp.description.startsWith('[') || exp.description.startsWith('{')) {
                                                        const parsed = JSON.parse(exp.description);
                                                        if (Array.isArray(parsed)) {
                                                            return parsed.map((bullet, idx) => (
                                                                <p key={idx} className="flex gap-2">
                                                                    <span className="text-blue-500">•</span>
                                                                    {bullet}
                                                                </p>
                                                            ));
                                                        }
                                                    }
                                                    // Handle comma separated or bullet separated strings
                                                    return exp.description.split(/[•\n]/).filter(s => s.trim()).map((bullet, idx) => (
                                                        <p key={idx} className="flex gap-2">
                                                            <span className="text-blue-500">•</span>
                                                            {bullet.trim()}
                                                        </p>
                                                    ));
                                                } catch (e) {
                                                    return <p>{exp.description}</p>;
                                                }
                                            })()}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Education Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                                    <GraduationCap className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Education</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Academic background</p>
                                </div>
                            </div>

                            <Dialog open={isEditingEdu} onOpenChange={handleEduOpenChange}>
                                <DialogTrigger asChild>
                                    <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-950 border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tight text-white mb-6">Edit Education</DialogTitle></DialogHeader>
                                    <div className="space-y-6 py-4">
                                        {editableEdu.map((edu, idx) => (
                                            <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/10 relative group">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="absolute top-4 right-4 text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        ><Trash2 className="w-4 h-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Education?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-slate-400">
                                                                This will remove this academic record. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => setEditableEdu(editableEdu.filter((_, i) => i !== idx))}
                                                                className="bg-red-600 hover:bg-red-500 text-white"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2 col-span-2"><Label className="text-[10px] font-black uppercase text-slate-500">Institution</Label><Input value={edu.institution || ""} onChange={e => { const n = [...editableEdu]; n[idx] = { ...n[idx], institution: e.target.value }; setEditableEdu(n) }} className="bg-white/5 border-white/10" /></div>
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">Degree</Label><Input value={edu.degree || ""} onChange={e => { const n = [...editableEdu]; n[idx] = { ...n[idx], degree: e.target.value }; setEditableEdu(n) }} className="bg-white/5 border-white/10" /></div>
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">Field of Study</Label><Input value={edu.fieldOfStudy || ""} onChange={e => { const n = [...editableEdu]; n[idx] = { ...n[idx], fieldOfStudy: e.target.value }; setEditableEdu(n) }} className="bg-white/5 border-white/10" /></div>
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">CGPA / Percentage</Label><Input value={edu.cgpa || ""} onChange={e => { const n = [...editableEdu]; n[idx] = { ...n[idx], cgpa: e.target.value }; setEditableEdu(n) }} className="bg-white/5 border-white/10" placeholder="9.5 CGPA" /></div>
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">Start Date</Label><Input value={edu.startDate || ""} onChange={e => { const n = [...editableEdu]; n[idx] = { ...n[idx], startDate: e.target.value }; setEditableEdu(n) }} className="bg-white/5 border-white/10" /></div>
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">End Date</Label><Input value={edu.endDate || ""} onChange={e => { const n = [...editableEdu]; n[idx] = { ...n[idx], endDate: e.target.value }; setEditableEdu(n) }} className="bg-white/5 border-white/10" placeholder="Present" /></div>
                                                </div>
                                            </div>
                                        ))}
                                        <Button onClick={() => setEditableEdu([...editableEdu, { institution: "", degree: "", startDate: "", endDate: "" }])} className="w-full bg-white/5 border border-dashed border-white/20 py-8 rounded-3xl"><Plus className="w-4 h-4 mr-2" /> Add Education</Button>
                                    </div>
                                    <DialogFooter><Button onClick={() => handleUpdate("education", editableEdu)} disabled={loading} className="w-full bg-purple-600 py-6 rounded-2xl font-black uppercase">{loading ? <Loader2 className="animate-spin" /> : "Save Education"}</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <AlertDialog open={showConfirmEdu} onOpenChange={setShowConfirmEdu}>
                                <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                            Unsaved Education
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-400">Discard changes to your academic background?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Keep Editing</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => { setShowConfirmEdu(false); setIsEditingEdu(false) }} className="bg-red-600 hover:bg-red-500 text-white">Discard</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {education.map((edu, i) => (
                                <motion.div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/10 hover:bg-white/10 transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tight">{edu.institution || "Unknown Institution"}</h3>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{edu.degree || "Degree Not Specified"} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                            {edu.cgpa && (
                                                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                                                    {edu.cgpa}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                                <Calendar className="w-3 h-3 text-purple-400" /> {edu.startDate || "N/A"} - {edu.endDate || "Present"}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Achievements Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                                    <Calendar className="w-6 h-6 text-yellow-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Achievements</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Honors and certifications</p>
                                </div>
                            </div>

                            <Dialog open={isEditingAch} onOpenChange={handleAchOpenChange}>
                                <DialogTrigger asChild>
                                    <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-950 border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tight text-white mb-6">Edit Achievements</DialogTitle></DialogHeader>
                                    <div className="space-y-6 py-4">
                                        {editableAch.map((ach, idx) => (
                                            <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/10 relative group">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost" size="icon"
                                                            className="absolute top-4 right-4 text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        ><Trash2 className="w-4 h-4" /></Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Achievement?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-slate-400">
                                                                This will remove this achievement record. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => setEditableAch(editableAch.filter((_, i) => i !== idx))}
                                                                className="bg-red-600 hover:bg-red-500 text-white"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                <div className="space-y-4">
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">Title</Label><Input value={ach.title || ""} onChange={e => { const n = [...editableAch]; n[idx] = { ...n[idx], title: e.target.value }; setEditableAch(n) }} className="bg-white/5 border-white/10" /></div>
                                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500">Description</Label><Textarea value={ach.description || ""} onChange={e => { const n = [...editableAch]; n[idx] = { ...n[idx], description: e.target.value }; setEditableAch(n) }} className="bg-white/5 border-white/10 min-h-[60px]" /></div>
                                                </div>
                                            </div>
                                        ))}
                                        <Button onClick={() => setEditableAch([...editableAch, { title: "" }])} className="w-full bg-white/5 border border-dashed border-white/20 py-8 rounded-3xl"><Plus className="w-4 h-4 mr-2" /> Add Achievement</Button>
                                    </div>
                                    <DialogFooter><Button onClick={() => handleUpdate("achievements", editableAch)} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 py-6 rounded-2xl font-black uppercase text-black">{loading ? <Loader2 className="animate-spin" /> : "Save Achievements"}</Button></DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <AlertDialog open={showConfirmAch} onOpenChange={setShowConfirmAch}>
                                <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                            Unsaved Achievements
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-400">Discard changes to your achievements?</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Keep Editing</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => { setShowConfirmAch(false); setIsEditingAch(false) }} className="bg-red-600 hover:bg-red-500 text-white">Discard</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {achievements.map((ach, i) => (
                                <motion.div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/10 hover:border-yellow-500/30 transition-all">
                                    <h3 className="text-sm font-black text-white mb-2 uppercase tracking-tight">{ach.title}</h3>
                                    {ach.description && <p className="text-xs text-slate-400 leading-relaxed font-medium">{ach.description}</p>}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
