"use client"

import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col selection:bg-blue-500/30">
            {/* Navbar */}
            <header className="fixed w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/5 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                            M
                        </div>
                        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500">
                            Mentorix
                        </h1>
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            <main className="flex-1 pt-32 pb-20 relative overflow-hidden">
                <div className="max-w-3xl mx-auto px-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium mb-8 border border-blue-500/20 backdrop-blur-md">
                        <ShieldCheck className="w-4 h-4" />
                        Legal & Privacy
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">
                        Privacy Policy
                    </h1>

                    <div className="space-y-8 text-slate-400 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
                            <p>
                                Welcome to Mentorix. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">2. Information We Collect</h2>
                            <p>
                                We collect information you provide directly to us, such as when you create an account, upload a resume, or interact with our AI career assistant. This may include your name, email address, professional history, and skill sets.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                            <p>
                                We use your information to provide and improve our services, personalize your experience, and generate career insights and roadmaps. Your data helps our AI understand your unique professional journey.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">4. Data Security</h2>
                            <p>
                                We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">5. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:divysaxena2402@gmail.com" className="text-blue-400 hover:underline">divysaxena2402@gmail.com</a>.
                            </p>
                        </section>
                    </div>
                </div>

                {/* Dynamic Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden -z-10">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full"></div>
                </div>
            </main>

            <footer className="border-t border-white/5 bg-slate-950/50 py-12">
                <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
                    <p>© 2026 Mentorix. Precision AI for Professional Success.</p>
                </div>
            </footer>
        </div>
    )
}
