import { NextResponse } from 'next/server';

// POST /api/latex/compile
export async function POST(request: Request) {
  try {
    const { tex } = await request.json();
    if (typeof tex !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid tex payload' }, { status: 400 });
    }

    // Auto-correct common setlist bracket typos (e.g., \setlist[itemize}{ -> \setlist[itemize]{)
    const cleanedTex = tex.replace(/\\setlist\[([^\]]+)\}{/g, '\\setlist[$1]{');

    // Use external service latexonline.cc to compile LaTeX to PDF.
    // The service expects raw LaTeX via the `text` query parameter and returns the PDF binary.
    const apiUrl = `https://latexonline.cc/compile?text=${encodeURIComponent(cleanedTex)}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Compilation service failed: ${response.status} ${errText}`);
    }
    const pdfArrayBuffer = await response.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfArrayBuffer).toString('base64');
    return NextResponse.json({ success: true, pdf: pdfBase64 });
  } catch (e: any) {
    // Forward any compilation error to the frontend UI.
    return NextResponse.json({ success: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
