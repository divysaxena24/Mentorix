import { useState } from "react"
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
import { User, MapPin, GraduationCap, Briefcase, BarChart, Pencil, Loader2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProfileHeaderProps {
    data: any
    onUpdate: () => void
}

export default function ProfileHeader({ data, onUpdate }: ProfileHeaderProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: data.name || "",
        currentRole: data.currentRole || "",
        university: data.university || "",
        location: data.location || "",
        internshipsCount: data.internshipsCount || 0,
        leetcodeCount: data.leetcodeCount || 0
    })
    const [showCloseConfirm, setShowCloseConfirm] = useState(false)

    const hasChanges = () => {
        return (
            formData.name !== (data.name || "") ||
            formData.currentRole !== (data.currentRole || "") ||
            formData.university !== (data.university || "") ||
            formData.location !== (data.location || "") ||
            parseInt(formData.internshipsCount) !== (data.internshipsCount || 0) ||
            parseInt(formData.leetcodeCount) !== (data.leetcodeCount || 0)
        )
    }

    const handleOpenChange = (open: boolean) => {
        if (!open && hasChanges()) {
            setShowCloseConfirm(true)
        } else {
            setIsEditing(open)
            if (open) {
                setFormData({
                    name: data.name || "",
                    currentRole: data.currentRole || "",
                    university: data.university || "",
                    location: data.location || "",
                    internshipsCount: data.internshipsCount || 0,
                    leetcodeCount: data.leetcodeCount || 0
                })
            }
        }
    }

    const handleUpdate = async () => {
        setLoading(true)
        try {
            await axios.patch("/api/profile", {
                type: "profile",
                data: {
                    name: formData.name,
                    currentRole: formData.currentRole,
                    university: formData.university,
                    location: formData.location
                }
            })

            await axios.patch("/api/profile", {
                type: "stats",
                data: {
                    internshipsCount: parseInt(formData.internshipsCount) || 0,
                    leetcodeCount: parseInt(formData.leetcodeCount) || 0
                }
            })

            toast.success("Profile updated successfully")
            onUpdate()
            setIsEditing(false)
        } catch (error) {
            toast.error("Failed to update profile")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -mr-32 -mt-32 rounded-full" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                {/* Profile Photo Placeholder */}
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-white/10 shrink-0 overflow-hidden group">
                    {data.profilePhoto ? (
                        <img src={data.profilePhoto} alt={data.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <User className="w-12 h-12 md:w-16 md:h-16 text-white/50 group-hover:scale-110 transition-transform duration-500" />
                    )}
                </div>

                <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-2">
                                {data.name || "User Name"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                    <Briefcase className="w-3 h-3 text-blue-400" />
                                    {data.currentRole || "Role Not Set"}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                    <GraduationCap className="w-3 h-3 text-purple-400" />
                                    {data.university || "University Not Set"}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                    <MapPin className="w-3 h-3 text-green-400" />
                                    {data.location || "Location Not Set"}
                                </div>
                            </div>
                        </div>

                        <Dialog open={isEditing} onOpenChange={handleOpenChange}>
                            <DialogTrigger asChild>
                                <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-950 border-white/10 text-white max-w-lg">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Edit Profile Info</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 py-6">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name || ""}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Role</Label>
                                        <Input
                                            id="role"
                                            value={formData.currentRole || ""}
                                            onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Location</Label>
                                        <Input
                                            id="location"
                                            value={formData.location || ""}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="uni" className="text-[10px] font-black uppercase tracking-widest text-slate-500">University</Label>
                                        <Input
                                            id="uni"
                                            value={formData.university || ""}
                                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="internships" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Internships Count</Label>
                                        <Input
                                            id="internships"
                                            type="number"
                                            value={formData.internshipsCount || 0}
                                            onChange={(e) => setFormData({ ...formData, internshipsCount: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="leetcode" className="text-[10px] font-black uppercase tracking-widest text-slate-500">LeetCode Solved</Label>
                                        <Input
                                            id="leetcode"
                                            type="number"
                                            value={formData.leetcodeCount || 0}
                                            onChange={(e) => setFormData({ ...formData, leetcodeCount: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={handleUpdate}
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-6 rounded-2xl"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile Changes"}
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
                                        You have made changes to your profile info. Closing this will discard all unsaved edits.
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
                                        Discard Changes
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {/* Completion Bar */}
                    <div className="max-w-md space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <span>Profile Completion</span>
                            <span className="text-white">{data.completionPercentage}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${data.completionPercentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
                    {[
                        { label: "Projects", value: data.projects?.length || 0, color: "text-blue-400" },
                        { label: "Internships", value: data.internshipsCount || 0, color: "text-purple-400" },
                        { label: "LeetCode", value: data.leetcodeCount || 0, color: "text-green-400" },
                        { label: "Resume Score", value: `${data.insights?.atsScore || 0}%`, color: "text-yellow-400" }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)" }}
                            className="bg-white/5 p-4 rounded-3xl border border-white/10 min-w-[120px] transition-colors"
                        >
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}
