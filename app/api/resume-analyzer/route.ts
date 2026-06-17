import { NextRequest, NextResponse } from "next/server";
import { MODELS } from "@/lib/ai/models";
import { generateAIResponse } from "@/lib/ai/provider-manager";
import pdf from "pdf-parse-fork";
import { db } from "@/lib/db/db";
import { resumeAnalysisTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";
import { extractResume, serializeExtractedResume } from "@/lib/ai/resume-extractor";

/**
 * Robustly extract and parse JSON from an AI response
 */
function extractJson(raw: string): any {
  if (!raw || raw.trim().length === 0) {
    throw new SyntaxError("Empty AI response");
  }

  // Helper function to try parsing with some quick fixes for common issues
  const tryParseWithFixes = (str: string): any => {
    try {
      return JSON.parse(str);
    } catch {
      // Try removing trailing commas in objects/arrays
      let fixed = str.replace(/,(\s*[}\]])/g, "$1");
      try {
        return JSON.parse(fixed);
      } catch {
        return null;
      }
    }
  };

  // Attempt 1: direct parse
  let result = tryParseWithFixes(raw);
  if (result !== null) return result;

  // Attempt 2: strip markdown code fences
  const codeBlockRegexes = [
    /```(?:json|javascript|js)\s*\n?([\s\S]*?)\n?```/i,
    /```\s*\n?([\s\S]*?)\n?```/,
    /``([\s\S]*?)``/,
  ];
  for (const regex of codeBlockRegexes) {
    const match = raw.match(regex);
    if (match) {
      const extracted = match[1].trim();
      result = tryParseWithFixes(extracted);
      if (result !== null) return result;

      // Try to find JSON within the extracted block
      const firstBrace = extracted.indexOf("{");
      const lastBrace = extracted.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        result = tryParseWithFixes(
          extracted.substring(firstBrace, lastBrace + 1)
        );
        if (result !== null) return result;
      }
    }
  }

  // Attempt 3: find the outermost JSON object using brace-depth tracking
  const firstBrace = raw.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    let lastCompleteBrace = -1;
    for (let i = firstBrace; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          lastCompleteBrace = i;
          break;
        }
      }
    }
    if (lastCompleteBrace > firstBrace) {
      const candidate = raw.substring(firstBrace, lastCompleteBrace + 1);
      result = tryParseWithFixes(candidate);
      if (result !== null) return result;
    }
  }

  // Attempt 4: find first { and last } (aggressive)
  const firstOpen = raw.indexOf("{");
  const lastClose = raw.lastIndexOf("}");
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    const candidate = raw.substring(firstOpen, lastClose + 1);
    result = tryParseWithFixes(candidate);
    if (result !== null) return result;
  }

  console.error("[JSON Parser] Raw response that failed to parse:", raw);
  throw new SyntaxError("Could not extract valid JSON from AI response");
}

/**
 * Send analysis request to AI with retry logic
 */
async function sendAnalysisRequest(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  provider: string,
  model: string,
  retryIfJsonFails: boolean = true
): Promise<any> {
  let aiResponse = await generateAIResponse({
    systemPrompt,
    userPrompt,
    temperature: 0.2,
    maxTokens,
    model,
    feature: "resume-analyzer",
    jsonMode: true,
  });

  let aiOutput;
  try {
    aiOutput = extractJson(aiResponse.content);
    return aiOutput;
  } catch (parseErr) {
    console.error("Failed to parse AI response as JSON (attempt 1):", parseErr);

    if (retryIfJsonFails) {
      console.log("[AI] Retrying with stronger JSON-only prompt...");
      const retryUserPrompt = `${userPrompt}\n\nIMPORTANT: Your previous response was not valid JSON. You MUST return ONLY valid JSON, no markdown, no explanations, just raw JSON starting with { and ending with }!`;

      aiResponse = await generateAIResponse({
        systemPrompt,
        userPrompt: retryUserPrompt,
        temperature: 0.1,
        maxTokens,
        model,
        feature: "resume-analyzer",
        jsonMode: true,
      });

      try {
        aiOutput = extractJson(aiResponse.content);
        return aiOutput;
      } catch (retryParseErr) {
        console.error("Failed to parse AI response as JSON on retry:", retryParseErr);
        throw new Error("Invalid AI response format after retry: " + String(retryParseErr));
      }
    }

    throw new Error("Invalid AI response format: " + String(parseErr));
  }
}

/**
 * Normalize AI output to ensure all array fields have defaults.
 */
function normalizeAnalysisOutput(output: any): any {
  if (!output || typeof output !== 'object') return output;

  output.overallScore ??= 0;
  output.skillsScore ??= 0;
  output.strongSkills ??= [];
  output.missingSkills ??= [];
  output.criticalMissingSkills ??= [];
  output.skillsRecruiterVerdict ??= "";

  output.projects ??= [];
  if (Array.isArray(output.projects)) {
    output.projects = output.projects.map((p: any) => ({
      projectName: p.projectName || "Unnamed Project",
      technologies: p.technologies ?? [],
      projectScore: p.projectScore ?? 0,
      technicalDepth: p.technicalDepth ?? p.technicalComplexity ?? 0,
      scalability: p.scalability ?? 0,
      industryRelevance: p.industryRelevance ?? 0,
      innovation: p.innovation ?? 0,
      resumeValue: p.resumeValue ?? 0,
      strength: p.strength || "",
      improvement: p.improvement || "",
      recruiterVerdict: p.recruiterVerdict || "",
    }));
  }

  output.experiences ??= [];
  if (Array.isArray(output.experiences)) {
    output.experiences = output.experiences.map((e: any) => ({
      role: e.role || "",
      company: e.company || "",
      duration: e.duration || "",
      experienceScore: e.experienceScore ?? 0,
      technicalDepth: e.technicalDepth ?? 0,
      businessImpact: e.businessImpact ?? 0,
      roleRelevance: e.roleRelevance ?? 0,
      industryExposure: e.industryExposure ?? e.uniqueness ?? 0,
      strength: e.strength || "",
      improvement: e.improvement || "",
      recruiterVerdict: e.recruiterVerdict || "",
    }));
  }

  output.atsScore ??= 0;
  output.matchedKeywords ??= [];
  output.missingKeywords ??= [];
  output.criticalMissingKeywords ??= [];
  output.expectedATSImprovement ??= "";

  output.companyReadinessScore ??= 0;
  output.companyReadinessAreas ??= [];
  output.companyReadinessStrengths ??= [];
  output.companyReadinessWeaknesses ??= [];
  output.companyReadinessMissingSkills ??= [];
  output.interviewProbability ??= "";
  output.companyReadinessVerdict ??= "";

  output.recruiterReport ??= "";

  return output;
}

/**
 * Save results to database
 */
async function saveToDatabase(
  userEmail: string,
  resumeText: string,
  resumeName: string,
  jobDescription: string,
  fieldOfInterest: string,
  targetRole: string,
  aiOutput: any
): Promise<void> {
  let displayTitle = jobDescription.trim();
  if (displayTitle) {
    const firstLine = displayTitle.split("\n")[0].trim();
    displayTitle = firstLine.length > 80 ? firstLine.substring(0, 77) + "..." : firstLine;
  } else if (fieldOfInterest || targetRole) {
    displayTitle = `${fieldOfInterest}${fieldOfInterest && targetRole ? " - " : ""}${targetRole}`.trim();
  } else {
    displayTitle = "Job Readiness Baseline";
  }

  await db.insert(resumeAnalysisTable).values({
    userEmail,
    resumeText,
    resumeName,
    jobDescription: displayTitle,
    analysisData: JSON.stringify(aiOutput),
  });
}

/**
 * Main API handler
 */
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

    // Step 1: Extract text from PDF or use direct text
    let resumeText = "";
    let resumeName = directResumeName || file?.name || "Untitled Resume";
    if (directResumeText) {
      resumeText = directResumeText;
    } else if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        const pdfParse = typeof pdf === 'function' ? pdf : (pdf as unknown as { default: any }).default || pdf;
        const data = await pdfParse(buffer);
        resumeText = data.text;
      } catch (parseErr) {
        console.error("PDF Parsing Error:", parseErr);
        return NextResponse.json({
          error: "Failed to extract text from PDF",
          detail: (parseErr as Error).message
        }, { status: 422 });
      }
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json({ error: "Failed to extract text from resume" }, { status: 400 });
    }

    // Step 2: Run structured extraction pipeline
    const extraction = extractResume(resumeText);

    // Step 3: Validate extraction — fail early, don't call AI if parsing failed
    if (!extraction.success || !extraction.data) {
      console.error("[EXTRACTOR] Extraction failed:", extraction.error);
      return NextResponse.json({
        error: extraction.error || "Failed to extract structured data from resume.",
        detail: `Projects: ${extraction.stats.projectCount}, Experience: ${extraction.stats.experienceCount}, Skills: ${extraction.stats.skillCount}`
      }, { status: 422 });
    }

    const extractedResume = extraction.data;
    const structuredResume = serializeExtractedResume(extractedResume);

    console.log("=== EXTRACTION SUMMARY ===");
    console.log(`Projects: ${extraction.stats.projectCount}, Experience: ${extraction.stats.experienceCount}, Skills: ${extraction.stats.skillCount}, Achievements: ${extraction.stats.achievementCount}`);
    console.log(`Inferred Skills: ${extractedResume.inferredSkills.length}`);

    // Step 4: Prepare AI prompt — send ONLY structured JSON, never raw text
    const hasJD = !!jobDescription.trim();
    const hasIntent = !!(fieldOfInterest.trim() || targetRole.trim());
    const mode = hasJD ? "strict_jd" : hasIntent ? "career_intent" : "general";

    const systemPrompt = `You are a Senior FAANG Recruiter, Hiring Manager, ATS Expert, and Career Coach. Your job is to analyze the candidate's resume against: 1) Resume Content 2) Target Role 3) Target Company 4) Job Description.

==================================================
CRITICAL RULES
==================================================

DO NOT GENERATE GENERIC FEEDBACK.
DO NOT HALLUCINATE.
DO NOT ASSUME SKILLS THAT DO NOT EXIST.
DO NOT MARK SKILLS AS MISSING IF THEY ARE PRESENT OR CAN BE INFERRED.
ALL ANALYSIS MUST BE BASED ON ACTUAL RESUME DATA.
Keep all feedback concise. recruiterReport text must be under 2000 characters.

==================================================
SKILL INFERENCE RULES — Never mark inferred as missing
==================================================

Parallel Computing → Concurrency, Performance Engineering
OpenMP → Multithreading, Synchronization, Concurrency
Distributed Systems → Scalability, System Design
React + Next.js → Frontend Development
Node.js + Express.js → Backend Development
PostgreSQL + MongoDB → Database Engineering
AWS + Docker + CI/CD → Cloud & DevOps

==================================================
SCORING FORMULAS
==================================================

Skills Score = Technical Skills Depth (40%) + Breadth (20%) + Industry Relevance (20%) + Core CS Fundamentals (20%)

Project Score = Technical Depth (30%) + Industry Relevance (25%) + Scalability (20%) + Innovation (15%) + Resume Value (10%)

Experience Score = Technical Depth (40%) + Role Relevance (25%) + Business Impact (20%) + Industry Exposure (15%)

==================================================
COMPANY READINESS — MUST depend on target company/role/JD
==================================================

GOOGLE SWE: DSA 30% + Backend 25% + System Design 20% + Projects 15% + Experience 10%
GOOGLE AI: ML 30% + Deep Learning 25% + Projects 20% + Research 15% + Deployment 10%
META SWE: DSA 35% + Backend 25% + Scalability 20% + Projects 20%
AMAZON SDE: DSA 25% + System Design 25% + Projects 20% + Leadership 15% + Experience 15%
MICROSOFT SWE: Backend 25% + Cloud 25% + Projects 20% + DSA 20% + Experience 10%

If no company specified: use the most relevant template based on resume strengths.

==================================================
ATS ANALYSIS — Extract ALL keywords
==================================================

Match: Languages, Frameworks, Databases, Cloud, DevOps, AI/ML, Core CS
Never show only 5 keywords if 20+ technologies exist. Target 15-25+ matched keywords.

==================================================
RECRUITER-GRADE FEEDBACK
==================================================

Feedback must feel like it was written by a Senior Google Recruiter, Senior Amazon Hiring Manager, or Senior Microsoft Engineer — NOT a generic AI chatbot.

Be specific. Be evidence-based. Be recruiter-grade.

==================================================
OUTPUT JSON SCHEMA — Return ONLY this exact structure:
==================================================

{
  "overallScore": 0-100,

  "skillsScore": 0-100,
  "strongSkills": ["Java", "Python", "React", "Next.js", "PostgreSQL", "MongoDB", "Redis", "AWS", "Docker", "Distributed Systems", "Concurrency", "DSA"],
  "missingSkills": ["Kubernetes", "GraphQL"],
  "criticalMissingSkills": ["Kubernetes"],
  "skillsRecruiterVerdict": "1-2 sentence verdict on skills",

  "projects": [
    {
      "projectName": "Mentorix",
      "technologies": ["Next.js", "TypeScript", "PostgreSQL", "Redis", "Docker", "CI/CD", "AI"],
      "projectScore": 95,
      "technicalDepth": 96,
      "scalability": 92,
      "industryRelevance": 98,
      "innovation": 93,
      "resumeValue": 97,
      "strength": "Full-stack AI platform with Redis caching and Docker deployment",
      "improvement": "Add Kubernetes for production orchestration",
      "recruiterVerdict": "Impressive full-stack project demonstrating production-ready engineering skills."
    }
  ],

  "experiences": [
    {
      "role": "Research Intern",
      "company": "IIITH",
      "duration": "May 2025 - July 2025",
      "experienceScore": 93,
      "technicalDepth": 96,
      "businessImpact": 88,
      "roleRelevance": 95,
      "industryExposure": 85,
      "strength": "Advanced CS research in Parallel Computing and Distributed Systems",
      "improvement": "Quantify speedup achieved with metrics",
      "recruiterVerdict": "1 sentence recruiter verdict"
    }
  ],

  "atsScore": 85,
  "matchedKeywords": ["Java", "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express.js", "PostgreSQL", "MongoDB", "Redis", "Docker", "AWS", "GitHub Actions", "DSA", "OOP", "DBMS", "OS", "Distributed Systems", "Linux", "HTML", "CSS", "Git"],
  "missingKeywords": ["Kubernetes", "GraphQL"],
  "criticalMissingKeywords": ["Kubernetes"],
  "expectedATSImprovement": "Adding Kubernetes and GraphQL could improve your ATS score by 10-15%.",

  "companyReadinessScore": 88,
  "companyReadinessAreas": [
    {"area": "DSA", "score": 90},
    {"area": "Backend", "score": 88},
    {"area": "System Design", "score": 80},
    {"area": "Projects", "score": 92},
    {"area": "Experience", "score": 85}
  ],
  "companyReadinessStrengths": ["Strong DSA foundation", "Full-stack project experience", "Research background"],
  "companyReadinessWeaknesses": ["Limited system design exposure"],
  "companyReadinessMissingSkills": ["Distributed consensus algorithms", "Large-scale system design"],
  "interviewProbability": "High — strong internship candidate with interview potential",
  "companyReadinessVerdict": "Strong internship candidate with solid CS fundamentals, DSA skills, and project experience. Interview probability is high with focused system design preparation.",

  "recruiterReport": "2-3 paragraph detailed analysis. Keep under 2000 characters. Explain all scores with evidence from resume."
}

overallScore = skillsScore*0.25 + avg(projectScores)*0.30 + avg(experienceScores)*0.25 + atsScore*0.10 + companyReadinessScore*0.10

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no extra text, no explanations. Raw JSON only. Keep recruiterReport under 2000 characters to prevent content overflow.`;

    let userPromptParts: string[] = [];
    if (mode === "strict_jd" && jobDescription) {
      userPromptParts.push(`TARGET JOB DESCRIPTION:\n${jobDescription}`);
    }
    if (mode === "career_intent") {
      userPromptParts.push(`CAREER INTENT:\nField: ${fieldOfInterest}\nTarget Role: ${targetRole}`);
    }

    // Send ONLY structured JSON to AI — never raw resume text
    userPromptParts.push(`EXTRACTED RESUME DATA (structured JSON only):\n${structuredResume}`);

    const userPrompt = userPromptParts.join("\n\n");

    // Step 5: Send to AI
    const providerToUse = "groq";
    const modelToUse = MODELS.GROQ_PRIMARY;
    const MAX_OUTPUT_TOKENS = 8000;

    let aiOutput = await sendAnalysisRequest(
      systemPrompt,
      userPrompt,
      MAX_OUTPUT_TOKENS,
      providerToUse,
      modelToUse
    );

    // Log full AI output shape before any formatting
    console.log("=== AI Response Shape ===");
    console.log(JSON.stringify(aiOutput, null, 2));
    console.log("==========================");

    // ── Content truncation safety: prevent overflow ──
    // recruiterReport: max 2500 chars
    if (aiOutput.recruiterReport && aiOutput.recruiterReport.length > 2500) {
      aiOutput.recruiterReport = aiOutput.recruiterReport.substring(0, 2497) + "...";
    }
    // Clip all string fields to reasonable lengths
    for (const field of ['skillsRecruiterVerdict', 'expectedATSImprovement', 'interviewProbability', 'companyReadinessVerdict']) {
      if (typeof aiOutput[field] === 'string' && aiOutput[field].length > 500) {
        aiOutput[field] = aiOutput[field].substring(0, 497) + "...";
      }
    }
    // Clip individual feedback fields in projects/experiences
    for (const proj of (aiOutput.projects || [])) {
      if (proj.recruiterVerdict && proj.recruiterVerdict.length > 300) proj.recruiterVerdict = proj.recruiterVerdict.substring(0, 297) + "...";
      if (proj.strength && proj.strength.length > 300) proj.strength = proj.strength.substring(0, 297) + "...";
      if (proj.improvement && proj.improvement.length > 300) proj.improvement = proj.improvement.substring(0, 297) + "...";
    }
    for (const exp of (aiOutput.experiences || [])) {
      if (exp.recruiterVerdict && exp.recruiterVerdict.length > 300) exp.recruiterVerdict = exp.recruiterVerdict.substring(0, 297) + "...";
      if (exp.strength && exp.strength.length > 300) exp.strength = exp.strength.substring(0, 297) + "...";
      if (exp.improvement && exp.improvement.length > 300) exp.improvement = exp.improvement.substring(0, 297) + "...";
    }

    // Compute overallScore if AI didn't provide it
    if (!aiOutput.overallScore && aiOutput.skillsScore !== undefined) {
      const skillsW = (aiOutput.skillsScore || 0) * 0.25;
      const projAvg = Array.isArray(aiOutput.projects) && aiOutput.projects.length > 0
        ? aiOutput.projects.reduce((s: number, p: any) => s + (p.projectScore || 0), 0) / aiOutput.projects.length
        : 0;
      const expAvg = Array.isArray(aiOutput.experiences) && aiOutput.experiences.length > 0
        ? aiOutput.experiences.reduce((s: number, e: any) => s + (e.experienceScore || 0), 0) / aiOutput.experiences.length
        : 0;
      const projectsW = projAvg * 0.30;
      const experienceW = expAvg * 0.25;
      const atsW = (aiOutput.atsScore || 0) * 0.10;
      const companyW = (aiOutput.companyReadinessScore || 0) * 0.10;
      aiOutput.overallScore = Math.round(skillsW + projectsW + experienceW + atsW + companyW);
    }

    // Step 6: Normalize output to prevent downstream crashes
    aiOutput = normalizeAnalysisOutput(aiOutput);

    // Step 7: Save to database and return
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    if (userEmail) {
      await saveToDatabase(userEmail, resumeText, resumeName, jobDescription, fieldOfInterest, targetRole, aiOutput);
    }

    return NextResponse.json(aiOutput);

  } catch (error: unknown) {
    const err = error as { status?: number; message?: string; stack?: string; error?: { message?: string } };
    console.error("Resume Analysis Error Detail:", {
      message: err.message,
      stack: err.stack,
      status: err.status
    });
    const statusCode = err.status || 500;
    const groqErrorMessage = err.error?.message || err.message;
    return NextResponse.json({
      error: groqErrorMessage || "Failed to analyze resume",
      detail: err.stack
    }, { status: statusCode });
  }
}
