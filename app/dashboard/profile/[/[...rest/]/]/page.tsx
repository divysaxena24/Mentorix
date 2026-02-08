"use client"

import { UserProfile } from "@clerk/nextjs"

export default function ProfilePage() {
    return (
        <div className="p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                    <h2 className="text-3xl font-bold text-gray-900">Account Settings</h2>
                    <p className="text-gray-500 mt-1">Manage your account preferences and profile information.</p>
                </div>
                <div className="p-4 md:p-8 flex justify-center">
                    <UserProfile
                        path="/dashboard/profile"
                        routing="path"
                        appearance={{
                            elements: {
                                rootBox: "mx-auto shadow-none border-none w-full",
                                card: "shadow-none border-none p-0 w-full",
                                navbar: "hidden md:flex",
                                scrollBox: "bg-white",
                                pageScrollBox: "p-0",
                                headerTitle: "text-gray-900 font-bold",
                                headerSubtitle: "text-gray-500",
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
