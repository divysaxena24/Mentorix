"use client"

import { useState } from "react"
import { SignedIn, UserButton, useClerk } from "@clerk/nextjs"
import Sidebar from "@/components/Sidebar"
import { Menu, LogOut } from "lucide-react"
import Link from "next/link"
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

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [showSignOutDialog, setShowSignOutDialog] = useState(false)
    const { signOut } = useClerk()

    const handleSignOut = async () => {
        await signOut({ redirectUrl: '/' })
    }

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
                        </div>

                        <div className="flex items-center gap-4">
                            <SignedIn>
                                <div className="flex items-center gap-3">
                                    <UserButton
                                        appearance={{
                                            elements: {
                                                userButtonPopoverActionButton__signOut: {
                                                    display: "none"
                                                },
                                                userButtonPopoverFooter: {
                                                    display: "none"
                                                }
                                            }
                                        }}
                                    >
                                        <UserButton.MenuItems>
                                            <UserButton.Action
                                                label="Sign Out"
                                                labelIcon={<LogOut className="w-4 h-4" />}
                                                onClick={() => setShowSignOutDialog(true)}
                                            />
                                        </UserButton.MenuItems>
                                    </UserButton>
                                </div>
                            </SignedIn>
                        </div>
                    </div>
                </header>

                {/* Confirm Sign Out Dialog */}
                <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                            <AlertDialogDescription>
                                You will need to log in again to access your dashboard and AI tools.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleSignOut}
                                className="bg-red-600 hover:bg-red-700 text-white border-none"
                            >
                                Sign Out
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-auto bg-slate-50">
                    {children}
                </main>
            </div>
        </div>
    )
}
