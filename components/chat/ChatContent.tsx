"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface CodeBlockProps {
    language: string
    value: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        toast.success("Code copied to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="relative group/code rounded-xl overflow-hidden my-6 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-white/5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {language || "code"}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                    {copied ? (
                        <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Copied</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            <SyntaxHighlighter
                language={language}
                style={atomDark}
                customStyle={{
                    margin: 0,
                    padding: "1.5rem",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    background: "rgba(15, 23, 42, 0.8)",
                }}
            >
                {value}
            </SyntaxHighlighter>
        </div>
    )
}

export const MemoizedReactMarkdown = React.memo(
    ReactMarkdown,
    (prevProps: any, nextProps: any) =>
        prevProps.children === nextProps.children &&
        prevProps.className === nextProps.className
)

export const ChatMarkdownComponents = {
    h1: ({ ...props }) => (
        <h1 className="text-2xl font-black mt-8 mb-4 uppercase tracking-tighter text-blue-400" {...props} />
    ),
    h2: ({ ...props }) => (
        <h2 className="text-xl font-black mt-6 mb-3 uppercase tracking-tight text-white/90" {...props} />
    ),
    h3: ({ ...props }) => (
        <h3 className="text-lg font-black mt-5 mb-2 uppercase tracking-wide text-white/80" {...props} />
    ),
    ul: ({ ...props }) => (
        <ul className="list-disc pl-6 space-y-3 my-4 text-slate-300" {...props} />
    ),
    ol: ({ ...props }) => (
        <ol className="list-decimal pl-6 space-y-3 my-4 text-slate-300" {...props} />
    ),
    li: ({ ...props }) => (
        <li className="leading-relaxed font-medium" {...props} />
    ),
    p: ({ ...props }) => (
        <p className="leading-relaxed mb-4 text-slate-300 font-medium" {...props} />
    ),
    strong: ({ ...props }) => (
        <strong className="font-black text-white" {...props} />
    ),
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || "")
        return !inline && match ? (
            <CodeBlock
                language={match[1]}
                value={String(children).replace(/\n$/, "")}
                {...props}
            />
        ) : (
            <code
                className="bg-white/10 px-1.5 py-0.5 rounded text-blue-400 font-bold text-[13px]"
                {...props}
            >
                {children}
            </code>
        )
    },
}
