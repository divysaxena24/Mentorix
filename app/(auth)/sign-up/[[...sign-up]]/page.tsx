import { Metadata } from "next"
import { SignUp } from '@clerk/nextjs'

export const metadata: Metadata = {
    title: "Sign Up",
    description: "Create your Mentorix account and start building your career with AI-powered tools, roadmaps, and resume analysis.",
    openGraph: { title: "Sign Up • Mentorix" },
    twitter: { title: "Sign Up • Mentorix" },
}

export default function Page() {
    return <div className='flex items-center justify-center h-screen'>
        <SignUp />
    </div>
}