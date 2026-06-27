import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

/**
 * POST /api/resume-builder/html-to-pdf
 * Accepts raw HTML string in request body and returns PDF.
 */
export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();
    if (!html) {
      return NextResponse.json({ error: "Missing 'html' field in request body" }, { status: 400 });
    }
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    const fileName = "resume.pdf";
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });
  } catch (error: any) {
    console.error("HTML to PDF generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 });
  }
}
