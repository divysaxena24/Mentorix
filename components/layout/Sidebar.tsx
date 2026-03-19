"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import {
    LayoutDashboard,
    Wrench,
    BookOpen,
    History,
    CreditCard,
    User,
    Menu,
    X,
    LogOut,
    Mic
} from 'lucide-react'
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

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Features', icon: Wrench, href: '/ai-tools' },
    { name: 'AI Mock Interview', icon: Mic, href: '/ai-tools/mock-interview' },
    { name: 'My History', icon: History, href: '/history' },
    { name: 'Profile', icon: User, href: '/dashboard/profile' },
]

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const { signOut } = useClerk()
    const [showSignOutDialog, setShowSignOutDialog] = useState(false)

    const handleSignOut = async () => {
        await signOut({ redirectUrl: '/' })
    }

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 glass border-r border-white/5
          transform transition-transform duration-500 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between px-6 border-b border-white/5 h-20">
                        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-300 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-[0_0_30px_rgba(37,99,235,0.4)] group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                M
                            </div>
                            <h1 className="text-xl font-black text-white tracking-tighter">
                                Mentorix
                            </h1>
                        </Link>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 text-slate-400 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 p-6 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`
                    flex items-center gap-4 px-4 py-3 rounded-xl
                    transition-all duration-300 group relative overflow-hidden
                    ${isActive
                                            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                                        }
                  `}
                                >
                                    <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-blue-400 scale-110' : 'text-slate-500 group-hover:text-slate-300 group-hover:scale-110'}`} />
                                    <span className="text-[13px] font-bold tracking-tight">{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.8)]" />
                                    )}

                                    {/* Active Glow Overlay */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-blue-500/5 blur-xl pointer-events-none"></div>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer & Logout */}
                    <div className="p-6 border-t border-white/5 space-y-4">
                        <button
                            onClick={() => setShowSignOutDialog(true)}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all group"
                        >
                            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[13px] font-bold tracking-tight">Sign Out</span>
                        </button>
                        <div className="text-[10px] text-slate-500 text-center font-black uppercase tracking-[0.3em] pt-2">
                            Command Center v1.0
                        </div>
                    </div>
                </div>
            </aside>

            {/* Confirm Sign Out Dialog */}
            <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            You will need to log in again to access your dashboard and AI tools.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleSignOut}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                        >
                            Sign Out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
