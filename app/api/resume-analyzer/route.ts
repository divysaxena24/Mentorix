import { NextRequest, NextResponse } from "next/server";
import { analyzeWithGroqLPU } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
// Use pdf-parse-fork which is more stable in Next.js environments
import pdf from "pdf-parse-fork";
import { db } from "@/lib/db/db";
import { resumeAnalysisTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";

// Forced Refresh: 2026-02-09T06:05:00Z
export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    const ip = getRequestIP(req);
    const { limited, resetIn } = checkRateLimit(`resume:${ip}`, AI_RATE_LIMIT);
    if (limited) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${resetIn} seconds.` },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File;
    const directResumeText = formData.get("resumeText") as string || "";
    const directResumeName = formData.get("resumeName") as string || "";
    const jobDescription = formData.get("jobDescription") as string || "";
    const fieldOfInterest = formData.get("fieldOfInterest") as string || "";
    const targetRole = formData.get("targetRole") as string || "";

    if (!file && !directResumeText) {
      return NextResponse.json({ error: "Resume file or text is required" }, { status: 400 });
    }

    // 1. Extract text from PDF using pdf-parse (Robust, function-based)
    let resumeText = "";
    let resumeName = directResumeName || file?.name || "Untitled Resume";

    if (directResumeText) {
      resumeText = directResumeText;
    } else {
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        // Safety check for pdfParse
        const pdfParse = typeof pdf === 'function' ? pdf : (pdf as unknown as { default: any }).default || pdf;
        const data = await pdfParse(buffer);
        resumeText = data.text;
      } catch (parseError: unknown) {
        const err = parseError as Error;
        console.error("PDF Parsing Error:", err);
        return NextResponse.json({
          error: "Failed to extract text from the PDF. Please ensure it's a valid PDF document.",
          detail: err.message
        }, { status: 422 });
      }
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json({ error: "Failed to extract text from the resume" }, { status: 400 });
    }

    // 3. AI Analysis using Groq
    const hasJD = !!jobDescription.trim();
    const hasIntent = !!(fieldOfInterest.trim() || targetRole.trim());

    let mode = "general";
    if (hasJD) mode = "strict_jd";
    else if (hasIntent) mode = "career_intent";

    const systemPrompt = `
You are an elite AI Career Coach and former FAANG Senior Technical Recruiter.
Your goal is to deeply evaluate a candidate's resume and generate a "Job Readiness Intelligence Report."

STRICT RULES:
- NO GENERIC BUZZWORDS: Avoid "team player", "highly motivated", etc.
- PUNCHY BULLETS: The "improvementPoints" and "sectionwiseAnalysis" MUST be written as highly actionable, metric-driven bullet points (e.g., "Add metrics showing X% impact").
- NO "N/A": If a date or detail is missing, omit it cleanly or suggest where to find it. Do not use placeholders.
- MULTI-DIMENSIONAL ANALYSIS: 
  1. Skills Match (30%) 2. Project Strength (20%) 3. Experience Depth (15%) 
  4. ATS Optimization (15%) 5. Impact & Metrics (10%) 6. Industry Fit (10%)
- ALL SCORES MUST BE OUT OF 100. "score" and ALL "scoreBreakdown" values MUST be percentages between 0 and 100.

Output Format (Strict JSON ONLY):
{
  "score": "number (0-100)",
  "summary": "Concise 3-sentence executive summary.",
  "scoreBreakdown": { "skills": "number (0-100)", "projects": "number (0-100)", "experience": "number (0-100)", "ats": "number (0-100)", "impact": "number (0-100)", "industryFit": "number (0-100)" },
  "strengths": ["Bullet 1", "Bullet 2"],
  "criticalGaps": ["Gap 1", "Gap 2"],
  "improvementPoints": ["Action 1", "Action 2"],
  "missingKeywords": ["Keyword 1", "Keyword 2"],
  "sectionwiseAnalysis": {
    "education": "...",
    "experience": "...",
    "projects": "...",
    "skills": "..."
  },
  "improvementPlan": {
    "additionalSkills": ["..."],
    "newProjectIdeas": ["..."],
    "projectEnhancements": ["..."]
  }
}
`;

    const userPrompt = `
${mode === "strict_jd" ? `TARGET JOB DESCRIPTION:\n${jobDescription}` : ""}
${mode === "career_intent" ? `CAREER INTENT:\nField: ${fieldOfInterest}\nTarget: ${targetRole}` : ""}
${mode === "general" ? "MODE: General Job Readiness Benchmarking" : ""}

RESUME TEXT:
${resumeText}
`;

    const responseData = await analyzeWithGroqLPU([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], {
      model: MODELS.GROQ_PRIMARY,
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.3
    });

    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;

    if (!responseData?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from AI provider");
    }

    const aiOutput = JSON.parse(responseData.choices[0].message.content);

    // Save to Database if user is authenticated
    if (userEmail) {
      // Use field/role as title if job description is empty
      const displayTitle = jobDescription.trim()
        ? jobDescription
        : (fieldOfInterest || targetRole)
          ? `${fieldOfInterest}${fieldOfInterest && targetRole ? ' - ' : ''}${targetRole}`.trim()
          : "Job Readiness Baseline";

      await db.insert(resumeAnalysisTable).values({
        userEmail,
        resumeText,
        resumeName: resumeName,
        jobDescription: displayTitle,
        analysisData: JSON.stringify(aiOutput)
      });
    }

    return NextResponse.json(aiOutput);

  } catch (error: unknown) {
    const err = error as { message?: string; stack?: string; response?: { data?: any } };
    console.error("Resume Analysis Error Detail:", {
      message: err.message,
      stack: err.stack,
      response: err.response?.data
    });
    return NextResponse.json({
      error: err.message || "Failed to analyze resume",
      detail: err.response?.data || err.stack
    }, { status: 500 });
  }
}
