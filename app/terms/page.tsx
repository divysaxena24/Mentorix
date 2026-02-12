"use client"

import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

export default function TermsPage() {
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
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-sm font-medium mb-8 border border-purple-500/20 backdrop-blur-md">
                        <FileText className="w-4 h-4" />
                        Terms of Service
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">
                        Terms of Service
                    </h1>

                    <div className="space-y-8 text-slate-400 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using Mentorix, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">2. Use of the Platform</h2>
                            <p>
                                Mentorix provides AI-powered career tools. You agree to use these tools for lawful professional development purposes. You are responsible for maintaining the confidentiality of your account credentials.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">3. User Content</h2>
                            <p>
                                You retain ownership of any content you upload (e.g., resumes). By uploading content, you grant Mentorix a license to process it to provide our AI services. We do not sell your personal data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">4. Limitation of Liability</h2>
                            <p>
                                Mentorix provides AI-generated insights. While we strive for accuracy, we are not liable for any career decisions made based on platform output. AI guidance is supplemental to your own professional judgment.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">5. Modifications to Terms</h2>
                            <p>
                                We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms.
                            </p>
                        </section>
                    </div>
                </div>

                {/* Dynamic Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden -z-10">
                    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full"></div>
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
