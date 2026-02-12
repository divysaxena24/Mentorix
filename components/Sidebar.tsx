"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Wrench,
    History,
    CreditCard,
    User,
    Menu,
    X
} from 'lucide-react'

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Features', icon: Wrench, href: '/ai-tools' },
    { name: 'My History', icon: History, href: '/history' },
    { name: 'Profile', icon: User, href: '/dashboard/profile' },
]

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()

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
          w-64 bg-slate-950 border-r border-white/5
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between px-6 border-b border-white/5 h-20">
                        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                                M
                            </div>
                            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
                                Mentorix
                            </h1>
                        </Link>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 text-slate-400 hover:bg-white/5 rounded-lg"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="flex-1 p-4 space-y-1.5">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={onClose}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group
                    ${isActive
                                            ? 'bg-blue-600/10 text-blue-400'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }
                  `}
                                >
                                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                    <span className="text-sm font-medium">{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5">
                        <div className="text-[10px] text-slate-600 text-center font-bold uppercase tracking-widest">
                            © 2026 Mentorix
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
