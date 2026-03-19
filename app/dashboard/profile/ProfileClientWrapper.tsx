"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, UserCircle } from "lucide-react"
import Link from "next/link"

import Onboarding from "@/components/mentorix-profile/Onboarding"
import ProfileHeader from "@/components/mentorix-profile/ProfileHeader"
import ResumeIntelligence from "@/components/mentorix-profile/ResumeIntelligence"
import ProfessionalLinks from "@/components/mentorix-profile/ProfessionalLinks"
import SkillsAndProjects from "@/components/mentorix-profile/SkillsAndProjects"
import CareerGoals from "@/components/mentorix-profile/CareerGoals"
import AIInsights from "@/components/mentorix-profile/AIInsights"
import CareerJourney from "@/components/mentorix-profile/CareerJourney"
import DetailedAnalysis from "@/components/mentorix-profile/DetailedAnalysis"
import { ProfileWithRelations } from "@/types"

interface ProfileClientWrapperProps {
    initialProfile: any; // We'll use any here briefly because of serialized JSON from server, or we can use the actual type
}

export default function ProfileClientWrapper({ initialProfile }: ProfileClientWrapperProps) {
    const [profile, setProfile] = useState<any>(initialProfile)
    const [isUpdating, setIsUpdating] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (!isUpdating) {
            setProfile(initialProfile)
        }
    }, [initialProfile, isUpdating])

    const handleUpdate = () => {
        // Trigger server-side revalidation
        router.refresh()
    }

    return (
        <AnimatePresence mode="wait">
            {(!profile || isUpdating) ? (
                <motion.div
                    key="onboarding"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                >
                    <Onboarding onComplete={(p) => { setIsUpdating(false); setProfile(p); handleUpdate(); }} />
                </motion.div>
            ) : (
                <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Dashboard Header */}
                    <div className="flex items-center justify-between gap-4 mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tight">
                                Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Center</span>
                            </h1>
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Your Personal Career Intel</p>
                                <div className="h-1 w-1 bg-slate-700 rounded-full" />
                                <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px]">
                                    Last Synced: {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'Just Now'}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/dashboard/profile/account"
                            className="flex items-center gap-2 px-4 md:px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all group shrink-0"
                        >
                            <UserCircle className="w-4 h-4" />
                            Account Settings
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        <ProfileHeader data={profile} onUpdate={handleUpdate} />
                        <ResumeIntelligence
                            insights={profile.insights}
                            onUpdateResume={() => setIsUpdating(true)}
                        />
                        <ProfessionalLinks links={profile.links} onUpdate={handleUpdate} />
                        <CareerJourney
                            experience={profile.experience}
                            education={profile.education}
                            achievements={profile.achievements}
                            onUpdate={handleUpdate}
                        />
                        <SkillsAndProjects
                            skills={profile.skills}
                            projects={profile.projects}
                            onUpdate={handleUpdate}
                        />
                        <CareerGoals goals={profile.goals} onUpdate={handleUpdate} />
                        <AIInsights insights={profile.insights} metrics={profile.metrics} />
                        <DetailedAnalysis insights={profile.insights} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
