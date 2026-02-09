"use client"

import { useState } from "react"
import { SignInButton, SignOutButton, SignUpButton, SignedIn, SignedOut, useClerk } from "@clerk/nextjs"
import { Sparkles, FileText, Map, MessageCircle, FileEdit } from "lucide-react"
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

export default function Home() {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const { signOut } = useClerk()

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <header className="fixed w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              M
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Mentorix
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 bg-gray-900 text-white rounded-2xl text-lg font-bold hover:bg-gray-800 hover:shadow-xl transition-all w-medium sm:w-auto">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <button
                onClick={() => setShowSignOutDialog(true)}
                className="px-10 py-2 bg-red-600 text-white rounded-2xl text-lg font-bold hover:bg-red-800 transition-colors"
              >
                Logout
              </button>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to log in again to access your career insights and roadmaps.
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

      {/* Hero Section */}
      <main className="flex-1 pt-32 relative">
        <section className="px-6 pb-20">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8 border border-blue-100 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              AI-Powered Career Intelligence
            </div>

            <h2 className="text-6xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-8">
              Navigate Your Career with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                Precision AI.
              </span>
            </h2>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              Mentorix is your personal AI career wingman. From resume analysis to custom learning roadmaps, we provide the tools you need to level up your professional life.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <SignedIn>
                <Link href="/dashboard">
                  <button className="px-10 py-5 bg-gray-900 text-white rounded-2xl text-lg font-bold hover:bg-gray-800 hover:shadow-xl transition-all w-full sm:w-auto">
                    Open Your Dashboard
                  </button>
                </Link>
              </SignedIn>
              <SignedOut>
                <SignUpButton mode="modal">
                  <button className="px-10 py-5 bg-gray-900 text-white rounded-2xl text-lg font-bold hover:bg-gray-800 hover:shadow-xl transition-all w-full sm:w-auto">
                    Get Started
                  </button>
                </SignUpButton>
              </SignedOut>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {[
                { icon: MessageCircle, title: "Career Chat", desc: "24/7 access to AI guidance", color: "blue" },
                { icon: FileText, title: "Resume Scan", desc: "Instant ATS optimization", color: "purple" },
                { icon: Map, title: "Custom Paths", desc: "Skill-based learning tracks", color: "emerald" },
                { icon: FileEdit, title: "Smart Writing", desc: "Automated cover letters", color: "orange" },
              ].map((feature, i) => (
                <div key={i} className="group p-6 bg-white border border-gray-100 rounded-3xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all">
                  <div className={`w-12 h-12 rounded-2xl bg-${feature.color}-50 flex items-center justify-center text-${feature.color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[120px] rounded-full"></div>
          <div className="absolute top-[20%] right-[-5%] w-[35%] h-[35%] bg-purple-400/20 blur-[120px] rounded-full"></div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
          <p>© 2026 Mentorix. Engineered for Excellence.</p>
        </div>
      </footer>
    </div>
  )
}
