import { NextRequest, NextResponse } from "next/server"
import { generateLatex } from "@/app/ai-tools/resume-builder/lib/latex/engine"
import type { ResumeData } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const { resume, action } = await req.json()
    
    if (!resume || !resume.personalInfo) {
      return NextResponse.json({ error: "Invalid resume data" }, { status: 400 })
    }

    // Generate LaTeX from resume JSON
    const latex = generateLatex(resume as ResumeData)

    if (action === "tex") {
      // Return .tex file for download
      const fileName = `${resume.personalInfo.fullName?.replace(/\s+/g, "_") || "resume"}.tex`
      return new NextResponse(latex, {
        headers: {
          "Content-Type": "application/x-tex",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      })
    }

    if (action === "compile" || action === "pdf") {
      // Try to compile LaTeX to PDF using xelatex if available
      try {
        const { execSync } = require("child_process")
        const fs = require("fs")
        const path = require("path")
        const os = require("os")

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "resume-"))
        const texPath = path.join(tmpDir, "resume.tex")
        fs.writeFileSync(texPath, latex, "utf-8")

        // Try xelatex compilation
        try {
          execSync(`xelatex -interaction=nonstopmode -output-directory="${tmpDir}" "${texPath}"`, {
            timeout: 30000,
            stdio: "pipe",
          })
          const pdfPath = path.join(tmpDir, "resume.pdf")
          
          if (fs.existsSync(pdfPath)) {
            const pdfBuffer = fs.readFileSync(pdfPath)
            // Cleanup
            fs.rmSync(tmpDir, { recursive: true, force: true })
            
            return new NextResponse(pdfBuffer, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${resume.personalInfo.fullName?.replace(/\s+/g, "_") || "resume"}.pdf"`,
              },
            })
          }
        } catch (compileError) {
          console.warn("XeLaTeX compilation failed:", compileError)
        }

        // Cleanup
        try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
      } catch (execError) {
        console.warn("LaTeX compilation not available:", execError)
      }

      // Fallback: Return the .tex file and let the client know
      return NextResponse.json({
        error: "LaTeX compiler not available on this server. Please install XeLaTeX or use the .tex download option.",
        latex,
      }, { status: 501 })
    }

    // Default: return LaTeX source
    return NextResponse.json({ latex, template: resume.template })
  } catch (error: any) {
    console.error("Compile API error:", error)
    return NextResponse.json({ error: error.message || "Compilation failed" }, { status: 500 })
  }
}
