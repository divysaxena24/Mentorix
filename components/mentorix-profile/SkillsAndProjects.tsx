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
import { Code2, Github, Globe, ExternalLink, Sparkles, FolderKanban, Pencil, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

interface Skill {
    id?: number
    category: string
    skillName: string
}

interface Project {
    id?: number
    title: string
    techStack: string
    description: string
    links: any
}

interface SkillsAndProjectsProps {
    skills?: Skill[]
    projects?: Project[]
    onUpdate: () => void
}

export default function SkillsAndProjects({ skills = [], projects = [], onUpdate }: SkillsAndProjectsProps) {
    const [isEditingSkills, setIsEditingSkills] = useState(false)
    const [isEditingProjects, setIsEditingProjects] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showCloseConfirmSkills, setShowCloseConfirmSkills] = useState(false)
    const [showCloseConfirmProjects, setShowCloseConfirmProjects] = useState(false)

    // Skills State
    const [editableSkills, setEditableSkills] = useState<Skill[]>(skills)

    // Projects State
    const [editableProjects, setEditableProjects] = useState<Project[]>(projects.map(p => ({
        ...p,
        links: typeof p.links === 'string' ? JSON.parse(p.links || "{}") : (p.links || {})
    })))

    // Sync local state when props change
    useEffect(() => { setEditableSkills(JSON.parse(JSON.stringify(skills))) }, [skills])
    useEffect(() => {
        setEditableProjects(projects.map(p => ({
            ...p,
            links: typeof p.links === 'string' ? JSON.parse(p.links || "{}") : (p.links || {})
        })))
    }, [projects])

    const hasSkillsChanges = () => JSON.stringify(editableSkills) !== JSON.stringify(skills)
    const hasProjectsChanges = () => {
        const currentProjects = editableProjects.map(p => ({
            ...p,
            links: typeof p.links === 'string' ? p.links : JSON.stringify(p.links || {})
        }))
        const originalProjects = projects.map(p => ({
            ...p,
            links: typeof p.links === 'string' ? p.links : JSON.stringify(p.links || {})
        }))
        return JSON.stringify(currentProjects) !== JSON.stringify(originalProjects)
    }

    const handleSkillsOpenChange = (open: boolean) => {
        if (!open && hasSkillsChanges()) {
            setShowCloseConfirmSkills(true)
        } else {
            setIsEditingSkills(open)
            if (open) setEditableSkills(JSON.parse(JSON.stringify(skills)))
        }
    }

    const handleProjectsOpenChange = (open: boolean) => {
        if (!open && hasProjectsChanges()) {
            setShowCloseConfirmProjects(true)
        } else {
            setIsEditingProjects(open)
            if (open) {
                setEditableProjects(JSON.parse(JSON.stringify(projects.map(p => ({
                    ...p,
                    links: typeof p.links === 'string' ? JSON.parse(p.links || "{}") : (p.links || {})
                })))))
            }
        }
    }

    const handleAddSkill = () => {
        setEditableSkills([...editableSkills, { category: "General", skillName: "" }])
    }

    const handleRemoveSkill = (index: number) => {
        setEditableSkills(editableSkills.filter((_, i) => i !== index))
    }

    const handleUpdateSkills = async () => {
        setLoading(true)
        try {
            await axios.patch("/api/profile", {
                type: "skills",
                data: editableSkills.filter(s => s.skillName)
            })
            toast.success("Skills updated successfully")
            onUpdate()
            setIsEditingSkills(false)
        } catch (error) {
            toast.error("Failed to update skills")
        } finally {
            setLoading(false)
        }
    }

    const handleAddProject = () => {
        setEditableProjects([...editableProjects, { title: "", techStack: "", description: "", links: {} }])
    }

    const handleRemoveProject = (index: number) => {
        setEditableProjects(editableProjects.filter((_, i) => i !== index))
    }

    const handleUpdateProjects = async () => {
        setLoading(true)
        try {
            await axios.patch("/api/profile", {
                type: "projects",
                data: editableProjects.filter(p => p.title)
            })
            toast.success("Projects updated successfully")
            onUpdate()
            setIsEditingProjects(false)
        } catch (error) {
            toast.error("Failed to update projects")
        } finally {
            setLoading(false)
        }
    }

    const groupedSkills = (skills || []).reduce((acc: any, skill) => {
        if (!acc[skill.category]) acc[skill.category] = []
        acc[skill.category].push(skill.skillName)
        return acc
    }, {})

    return (
        <div className="space-y-8">
            {/* Skills Section */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-3xl shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                            <Code2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-0.5">Technical Arsenal</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your stack foundation</p>
                        </div>
                    </div>

                    <Dialog open={isEditingSkills} onOpenChange={handleSkillsOpenChange}>
                        <DialogTrigger asChild>
                            <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                <Pencil className="w-4 h-4" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Edit Skills</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-6">
                                {editableSkills.map((skill, index) => (
                                    <div key={index} className="flex items-end gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="flex-1 space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Category</Label>
                                            <Input
                                                value={skill.category || ""}
                                                onChange={(e) => {
                                                    const newSkills = [...editableSkills]
                                                    newSkills[index] = { ...newSkills[index], category: e.target.value }
                                                    setEditableSkills(newSkills)
                                                }}
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>
                                        <div className="flex-[2] space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Skill Name</Label>
                                            <Input
                                                value={skill.skillName || ""}
                                                onChange={(e) => {
                                                    const newSkills = [...editableSkills]
                                                    newSkills[index] = { ...newSkills[index], skillName: e.target.value }
                                                    setEditableSkills(newSkills)
                                                }}
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
                                                    <AlertDialogTitle>Remove Skill?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-400">
                                                        This will remove this skill from your arsenal. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleRemoveSkill(index)}
                                                        className="bg-red-600 hover:bg-red-500 text-white"
                                                    >
                                                        Remove
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))}
                                <Button
                                    onClick={handleAddSkill}
                                    className="w-full bg-white/5 border border-dashed border-white/20 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest py-8 rounded-2xl"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add New Skill
                                </Button>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleUpdateSkills}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-6 rounded-2xl"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save All Skills"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <AlertDialog open={showCloseConfirmSkills} onOpenChange={setShowCloseConfirmSkills}>
                        <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                    Unsaved Skills
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                    You have unsaved changes in your skills. Discard them?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Keep Editing</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        setShowCloseConfirmSkills(false)
                                        setIsEditingSkills(false)
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white"
                                >
                                    Discard
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <div className="flex flex-col gap-3">
                    {Object.entries(groupedSkills).map(([category, items]: any, i) => (
                        <div key={i} className="flex flex-wrap md:flex-nowrap items-baseline gap-3 md:gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                            <div className="md:w-1/4 shrink-0 flex items-center gap-2">
                                <div className="w-1 h-3 bg-blue-500 rounded-full" />
                                <span className="font-black text-white uppercase tracking-widest text-xs">{category}</span>
                            </div>
                            <div className="hidden md:block text-white/20 font-light">—</div>
                            <div className="flex flex-wrap items-center gap-1.5 text-sm md:flex-1">
                                {items.map((skill: string, j: number) => (
                                    <span key={j} className="text-slate-300 font-medium">
                                        {skill}{j < items.length - 1 ? <span className="text-slate-600 mr-1.5">,</span> : ""}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Projects Section */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-3xl shadow-2xl space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                            <FolderKanban className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-0.5">Projects</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your showcased projects</p>
                        </div>
                    </div>

                    <Dialog open={isEditingProjects} onOpenChange={handleProjectsOpenChange}>
                        <DialogTrigger asChild>
                            <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                <Pencil className="w-4 h-4" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-950 border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Edit Projects</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-8 py-6">
                                {editableProjects.map((project, index) => (
                                    <div key={index} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4 relative group">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-4 right-4 text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-slate-400">
                                                        This will permanently delete this project from your profile. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleRemoveProject(index)}
                                                        className="bg-red-600 hover:bg-red-500 text-white"
                                                    >
                                                        Delete Project
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project Title</Label>
                                            <Input
                                                value={project.title || ""}
                                                onChange={(e) => {
                                                    const newProjects = [...editableProjects]
                                                    newProjects[index] = { ...newProjects[index], title: e.target.value }
                                                    setEditableProjects(newProjects)
                                                }}
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tech Stack (comma separated)</Label>
                                            <Input
                                                value={project.techStack || ""}
                                                onChange={(e) => {
                                                    const newProjects = [...editableProjects]
                                                    newProjects[index] = { ...newProjects[index], techStack: e.target.value }
                                                    setEditableProjects(newProjects)
                                                }}
                                                className="bg-white/5 border-white/10 text-white"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</Label>
                                            <Textarea
                                                value={project.description || ""}
                                                onChange={(e) => {
                                                    const newProjects = [...editableProjects]
                                                    newProjects[index] = { ...newProjects[index], description: e.target.value }
                                                    setEditableProjects(newProjects)
                                                }}
                                                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {['github', 'live', 'demo', 'docs'].map((linkType) => (
                                                <div key={linkType} className="space-y-1">
                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-600">{linkType} URL</Label>
                                                    <Input
                                                        value={project.links?.[linkType] || ""}
                                                        onChange={(e) => {
                                                            const newProjects = [...editableProjects]
                                                            newProjects[index].links = {
                                                                ...newProjects[index].links,
                                                                [linkType]: e.target.value
                                                            }
                                                            setEditableProjects(newProjects)
                                                        }}
                                                        placeholder={`Optional ${linkType} link`}
                                                        className="bg-white/5 border-white/10 text-white text-xs"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    onClick={handleAddProject}
                                    className="w-full bg-white/5 border border-dashed border-white/20 hover:bg-white/10 text-slate-400 font-bold uppercase tracking-widest py-8 rounded-2xl"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Add New Project
                                </Button>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleUpdateProjects}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-6 rounded-2xl"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save All Projects"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <AlertDialog open={showCloseConfirmProjects} onOpenChange={setShowCloseConfirmProjects}>
                        <AlertDialogContent className="bg-slate-950 border-white/10 text-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                    Unsaved Projects
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                    You have unsaved changes in your projects. Discard them?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Keep Editing</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        setShowCloseConfirmProjects(false)
                                        setIsEditingProjects(false)
                                    }}
                                    className="bg-red-600 hover:bg-red-500 text-white"
                                >
                                    Discard
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(projects || []).map((project, i) => {
                        let links: any = {};
                        try {
                            links = typeof project.links === 'string'
                                ? JSON.parse(project.links || "{}")
                                : (project.links || {});
                        } catch (e) {
                            console.error("Error parsing project links:", e);
                        }
                        return (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bg-white/5 border border-white/5 rounded-2xl p-6 group flex flex-col h-full overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-purple-500/10 transition-colors" />

                                <div className="relative z-10 flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {project.techStack?.split(/[•,]/).map((tech, j) => (
                                                <span key={j} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                    {tech.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3 group-hover:text-blue-400 transition-colors">
                                        {project.title}
                                    </h3>

                                    <p className="text-sm text-slate-400 font-medium leading-relaxed line-clamp-3 mb-6">
                                        {project.description}
                                    </p>
                                </div>

                                <div className="relative z-10 flex items-center gap-3 pt-6 border-t border-white/5 mt-auto">
                                    {links.github && (
                                        <a href={links.github} target="_blank" className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                            <Github className="w-4 h-4" /> Code
                                        </a>
                                    )}
                                    {!links.github && (
                                        <div className="p-2 text-slate-600 text-[10px] font-black uppercase tracking-widest italic">
                                            No source code link
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
