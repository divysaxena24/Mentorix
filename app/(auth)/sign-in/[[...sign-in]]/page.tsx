import { Metadata } from "next"
import { SignIn } from '@clerk/nextjs'

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to your Mentorix account to access AI-powered career tools, resume analysis, and personalized roadmaps.",
    openGraph: { title: "Sign In • Mentorix" },
    twitter: { title: "Sign In • Mentorix" },
}

export default function Page() {
    return (
        <div className='flex items-center justify-center h-screen'>
            <SignIn />
        </div>
    )
}