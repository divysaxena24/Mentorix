import { NextRequest, NextResponse } from "next/server";
import { MODELS } from "@/lib/ai/models";
import { generateAIResponse } from "@/lib/ai/provider-manager";
import pdf from "pdf-parse-fork";
import { db } from "@/lib/db/db";
import { resumeAnalysisTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";
import { parseResume, serializeResume, inferSkills } from "@/lib/ai/resume-parser";

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

    // Step 2: Parse resume into structured data
    const parsedResume = parseResume(resumeText);
    const structuredResume = serializeResume(parsedResume);

    // Step 3: Run skill inference
    const skillInference = inferSkills(parsedResume);

    // Log extracted data for debugging
    console.log("=== Extracted Resume Data ===");
    console.log("Projects:", parsedResume.projects.map(p => ({ name: p.name, tech: p.technologies })));
    console.log("Experiences:", parsedResume.experiences.map(e => ({ role: e.role, company: e.company })));
    console.log("Skills:", parsedResume.skills);
    console.log("Inferred Skills:", skillInference.inferredSkills);
    console.log("============================");

    // Step 4: Validate data (attempt recovery if needed)
    // We'll proceed even with partial data, but log issues
    if (parsedResume.projects.length === 0) {
      console.warn("No projects detected from resume!");
    }
    if (parsedResume.experiences.length === 0) {
      console.warn("No experiences detected from resume!");
    }
    if (parsedResume.skills.length === 0) {
      console.warn("No skills detected from resume!");
    }

    // Step 5: Prepare AI prompt
    const hasJD = !!jobDescription.trim();
    const hasIntent = !!(fieldOfInterest.trim() || targetRole.trim());
    const mode = hasJD ? "strict_jd" : hasIntent ? "career_intent" : "general";

    const systemPrompt = `You are an elite Senior Staff Technical Recruiter and Career Intelligence Analyst with 15+ years of experience.
Your job is to analyze this resume and provide actionable, specific, and personalized feedback.

ANALYSIS GUIDELINES:
1. Focus on the EXTRACTED structured data (projects, experiences, skills) provided in the prompt
2. For each project, analyze its complexity, technologies used, and recruiter appeal
3. For each experience, evaluate its relevance, impact, and technical depth
4. Infer skills even if not explicitly listed, based on projects and experiences
5. Provide specific recommendations (e.g., "Add Redis caching to Mentorix", not "Improve your project")
6. Always reference the actual projects and experiences from the resume
7. Be encouraging but honest about gaps
8. Tailor recommendations to the target role/field/company if provided

OUTPUT JSON SCHEMA:
{
  "score": 0-100,
  "summary": "4-5 sentence executive summary citing specific resume content",
  "scoreBreakdown": {
    "skills": 0-100,
    "projects": 0-100,
    "experience": 0-100,
    "ats": 0-100,
    "impact": 0-100,
    "industryFit": 0-100
  },
  "strengths": ["specific strength 1", "specific strength 2"],
  "criticalGaps": ["specific gap 1", "specific gap 2"],
  "improvementPoints": ["specific improvement 1", "specific improvement 2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "sectionwiseAnalysis": {
    "education": "feedback on education",
    "experience": "feedback on experience",
    "projects": "feedback on projects",
    "skills": "feedback on skills"
  },
  "improvementPlan": {
    "additionalSkills": ["skill1", "skill2"],
    "newProjectIdeas": ["specific project idea 1", "specific project idea 2"],
    "projectEnhancements": ["specific enhancement to existing project 1", "specific enhancement to existing project 2"]
  },
  "executiveSummary": {
    "professionalOverview": "brief overview",
    "careerStageAssessment": "stage assessment",
    "top3Strengths": ["strength1", "strength2", "strength3"],
    "top3Improvements": ["improvement1", "improvement2", "improvement3"],
    "overallHiringImpression": "hiring impression"
  },
  "projectAnalysis": [
    {
      "projectName": "name from extracted data",
      "technologyStack": ["tech1", "tech2"],
      "domain": "project domain",
      "complexity": "Low/Medium/High/Very High",
      "technicalComplexity": 0-100,
      "recruiterAppeal": 0-100,
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "suggestedEnhancements": ["specific enhancement1", "specific enhancement2"],
      "recruiterImpression": "detailed impression"
    }
  ],
  "experienceAnalysis": [
    {
      "role": "role from extracted data",
      "company": "company from extracted data",
      "duration": "duration",
      "isResearch": true/false,
      "isInternship": true/false,
      "technicalDepth": 0-100,
      "businessImpact": 0-100,
      "recruiterAppeal": 0-100,
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "suggestedImprovements": ["specific improvement1", "specific improvement2"],
      "recruiterImpression": "detailed impression"
    }
  ],
  "skillsAnalysis": {
    "strongAreas": ["category1", "category2"],
    "missingAreas": ["category3", "category4"],
    "learningRecommendations": ["specific recommendation1", "specific recommendation2"]
  },
  "growthPlan": {
    "first30Days": { "focus": "focus area", "actions": ["action1", "action2"], "skills": ["skill1", "skill2"], "expectedOutcome": "outcome" },
    "next60Days": { "focus": "focus area", "actions": ["action1", "action2"], "skills": ["skill1", "skill2"], "expectedOutcome": "outcome" },
    "next90Days": { "focus": "focus area", "actions": ["action1", "action2"], "skills": ["skill1", "skill2"], "expectedOutcome": "outcome" }
  },
  "extractedData": {
    "projects": ${JSON.stringify(parsedResume.projects)},
    "experiences": ${JSON.stringify(parsedResume.experiences)},
    "skills": ${JSON.stringify(parsedResume.skills)},
    "skillInference": ${JSON.stringify(skillInference)}
  }
}

IMPORTANT: ALWAYS include the extractedData section with the provided parsed resume data!
CRITICAL: Return ONLY valid JSON - no markdown, no code fences, no extra text!`;

    let userPromptParts: string[] = [];
    if (mode === "strict_jd" && jobDescription) {
      userPromptParts.push(`TARGET JOB DESCRIPTION:\n${jobDescription}`);
    }
    if (mode === "career_intent") {
      userPromptParts.push(`CAREER INTENT:\nField: ${fieldOfInterest}\nTarget Role: ${targetRole}`);
    }

    userPromptParts.push(`EXTRACTED RESUME DATA:\n${structuredResume}`);
    userPromptParts.push(`SKILL INFERENCE DATA:\n${JSON.stringify(skillInference, null, 2)}`);

    const userPrompt = userPromptParts.join("\n\n");

    // Step 6: Send to AI
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

    // Ensure extractedData is always present
    if (!aiOutput.extractedData) {
      aiOutput.extractedData = {
        projects: parsedResume.projects,
        experiences: parsedResume.experiences,
        skills: parsedResume.skills,
        skillInference
      };
    }

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
