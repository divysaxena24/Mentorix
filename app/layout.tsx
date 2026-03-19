import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { Provider } from "./provider";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


const AppFont = DM_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-app',
})
export const metadata: Metadata = {
  title: "Mentorix - AI Career Coach",
  description: "Mentorix is your personal AI career wingman. From resume analysis to custom learning roadmaps, we provide the tools you need to level up your professional life.",
};

import { dark } from "@clerk/themes";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#2563eb',
        },
        elements: {
          card: 'bg-slate-950 border border-white/10 shadow-2xl rounded-[2rem]',
          headerTitle: 'text-2xl font-black tracking-tight',
          headerSubtitle: 'text-slate-400',
          socialButtonsBlockButton: 'rounded-xl border-white/10 hover:bg-white/5 transition-all',
          formButtonPrimary: 'rounded-xl bg-blue-600 hover:bg-blue-700 transition-all',
          formFieldInput: 'rounded-xl bg-white/5 border-white/10 focus:border-blue-500 transition-all',
        }
      }}
      localization={{
        signIn: {
          start: {
            title: 'Sign in to Mentorix',
          },
        },
        signUp: {
          start: {
            title: 'Create Mentorix Account',
          },
        },
      }}
    >
      <html lang="en" className="dark">
        <body
          className={`${AppFont.className} bg-slate-950 text-slate-200 antialiased`}
        >
          <Provider>
            {children}
          </Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
