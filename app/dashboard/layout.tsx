"use client"

import { useState } from "react"
import { SignedIn, UserButton } from "@clerk/nextjs"
import Sidebar from "@/components/Sidebar"
import { Menu } from "lucide-react"
import Link from "next/link"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 z-20 shrink-0 h-20 flex items-center">
                    <div className="flex-1 flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    M
                                </div>
                                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                    Mentorix
                                </h1>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            <SignedIn>
                                <div className="flex items-center gap-3">
                                    <UserButton afterSignOutUrl="/" />
                                </div>
                            </SignedIn>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-auto bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    )
}
