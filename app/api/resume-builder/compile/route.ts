// app/api/resume-builder/compile/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { ResumeJSON } from "@/types/resume";
import { renderResumeToHTML } from "@/app/api/resume-builder/render";
import puppeteer from "puppeteer";

/**
 * POST /api/resume-builder/compile
 * Expects JSON body: { resume: ResumeJSON, action: "pdf" }
 * Returns a PDF (application/pdf) generated from the selected template.
 */
export async function POST(req: NextRequest) {
  try {
    const { resume, action } = await req.json();
    if (!resume || action !== "pdf") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    // Render HTML string based on resume JSON and selected template
    const html = renderResumeToHTML(resume);
    // Launch puppeteer to generate PDF (A4, no margins by default)
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    const fileName = `${resume.personalInfo?.fullName?.replace(/\s+/g, "_") || "resume"}.pdf`;
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });
  } catch (error: any) {
    console.error("Resume PDF generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 });
  }
}
