"use client"

import { UserProfile, SignedIn } from "@clerk/nextjs"

export default function ProfilePage() {
    return (
        <SignedIn>
            <div className="p-0 pt-0 flex flex-col items-center justify-center">

                <div className="p-4 pt-0 md:p-8 flex justify-center">
                    <UserProfile
                        path="/dashboard/profile"
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
        </SignedIn>
    )
}
