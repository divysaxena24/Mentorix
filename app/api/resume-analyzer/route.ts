import { NextRequest, NextResponse } from "next/server";
import { MODELS } from "@/lib/ai/models";
import { generateAIResponse } from "@/lib/ai/provider-manager";
// Use pdf-parse-fork which is more stable in Next.js environments
import pdf from "pdf-parse-fork";
import { db } from "@/lib/db/db";
import { resumeAnalysisTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";
import { parseResume, serializeResume } from "@/lib/ai/resume-parser";
import {
  logTokenBreakdown,
  estimateTokens,
  SAFE_LIMIT,
  HARD_LIMIT,
} from "@/lib/ai/token-counter";
import {
  autoCompress,
  compressJobDescription,
  compressSystemPrompt,
} from "@/lib/ai/prompt-compressor";

/**
 * Robustly extract and parse JSON from an AI response that may include
 * markdown code fences, preamble text, or trailing commentary.
 *
 * Strategy:
 * 1. Try direct JSON.parse on the raw content.
 * 2. Strip ```json ... ``` code blocks and try again.
 * 3. Find the first '{' and last '}' and parse that substring.
 * 4. If all attempts fail, throw an error.
 */
function extractJson(raw: string): any {
  // Attempt 1: direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // fall through
  }

  // Attempt 2: strip markdown code fences
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    const extracted = codeBlockMatch[1].trim();
    try {
      return JSON.parse(extracted);
    } catch {
      // fall through
    }
  }

  // Attempt 3: find the outermost JSON object
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = raw.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // fall through
    }
  }

  throw new SyntaxError("Could not extract valid JSON from AI response");
}

/**
 * Rescale a single score value from a 1-10 scale to a 0-100 scale,
 * handling both numeric and string-encoded values.
 * Returns the rescaled value if conversion was needed and possible.
 */
function rescaleScoreIfNeeded(value: any): number | null {
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed <= 10) return Math.min(Math.round(parsed * 10), 100);
    if (!isNaN(parsed)) return Math.round(parsed); // already 0-100 scale
    return null;
  }
  if (typeof value === "number") {
    if (value <= 10) return Math.min(Math.round(value * 10), 100);
    return Math.round(value); // already 0-100 scale
  }
  return null;
}

/**
 * Check whether a set of candidate score values looks like it uses a 1-10 scale
 * (rather than a 0-100 scale). Uses a less brittle heuristic:
 * - If the maximum value across all fields is ≤ 10, it's likely a 1-10 scale.
 */
function isLikelyOneToTenScale(obj: any, fields: string[]): boolean {
  const values = fields
    .map((f) => {
      const v = obj[f];
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const p = parseFloat(v);
        return isNaN(p) ? null : p;
      }
      return null;
    })
    .filter((v): v is number => v !== null);
  if (values.length === 0) return false;
  const maxVal = Math.max(...values);
  return maxVal <= 10;
}

/**
 * Post-process the AI output to fix common scoring issues:
 * - Rescale scores that appear to use a 1-10 scale instead of 0-100
 * - Ensure strong projects/experiences don't get single-digit scores
 */
function rescaleScores(output: any): void {
  if (!output || typeof output !== "object") return;

  const rescaleFields = (obj: any, fields: string[]) => {
    if (!obj || typeof obj !== "object") return;
    if (!isLikelyOneToTenScale(obj, fields)) return;
    for (const f of fields) {
      const rescaled = rescaleScoreIfNeeded(obj[f]);
      if (rescaled !== null) {
        obj[f] = rescaled;
      }
    }
  };

  // Fix projectAnalysis scores
  if (Array.isArray(output.projectAnalysis)) {
    const projectFields = ["technicalComplexity", "architectureQuality", "scalabilityScore",
      "innovationScore", "industryRelevance", "resumeValue", "recruiterAppeal"];
    for (const proj of output.projectAnalysis) {
      rescaleFields(proj, projectFields);
    }
  }

  // Fix experienceAnalysis scores
  if (Array.isArray(output.experienceAnalysis)) {
    const expFields = ["technicalDepth", "businessImpact", "ownership",
      "leadershipScore", "communicationScore", "problemSolving", "metricsUsage", "recruiterAppeal"];
    for (const exp of output.experienceAnalysis) {
      rescaleFields(exp, expFields);
    }
  }

  // Fix projectComparison ranking table scores
  if (output.projectComparison?.rankingTable) {
    const rankFields = ["technicalDepth", "scalability", "innovation", "industryRelevance", "resumeValue"];
    for (const row of output.projectComparison.rankingTable) {
      rescaleFields(row, rankFields);
    }
  }
}

// ─── Helper: Send a single analysis request to Groq ─────────────────────

async function sendAnalysisRequest(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  provider: string,
  model: string
): Promise<any> {
  const aiResponse = await generateAIResponse({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    maxTokens,
    model,
    feature: "resume-analyzer",
  });

  let aiOutput;
  try {
    aiOutput = extractJson(aiResponse.content);
    rescaleScores(aiOutput);
  } catch (parseErr) {
    console.error("Failed to parse AI response as JSON", { rawContent: aiResponse.content, parseErr });
    throw new Error("Invalid AI response format: " + String(parseErr));
  }

  return aiOutput;
}

// ─── Helper: Save results to database ────────────────────────────────────

async function saveToDatabase(
  userEmail: string,
  resumeText: string,
  resumeName: string,
  jobDescription: string,
  fieldOfInterest: string,
  targetRole: string,
  aiOutput: any
): Promise<void> {
  // Truncate job description for display title to avoid overflow in history cards
  let displayTitle = jobDescription.trim();
  if (displayTitle) {
    // Use first 80 chars as display title, or extract role name
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

// ─── Helper: Split analysis into multiple calls ─────────────────────────

/**
 * When a single request would exceed the hard token limit, split the
 * work into separate targeted calls and merge the results.
 *
 * Call 1: Core analysis (score, summary, skills, projects, experience, gaps)
 * Call 2: Advanced analysis (company readiness, interview readiness, growth plan)
 */
async function runSplitAnalysis(
  systemPrompt: string,
  parsedResume: any,
  structuredResume: string,
  jobDescription: string,
  fieldOfInterest: string,
  targetRole: string,
  mode: string,
  provider: string,
  model: string,
  maxOutputTokens: number
): Promise<any> {
  console.log("[AI] Running split analysis — Call 1: Core + Call 2: Advanced");

  // ── Call 1: Core Analysis ──
  const corePrompt = `You are a Career Intelligence Analyst. Analyze this resume and return a JSON with the core fields only.

${mode === "strict_jd" ? `TARGET JD: ${compressJobDescription(jobDescription, 200)}` : ""}
${mode === "career_intent" ? `CAREER INTENT: ${fieldOfInterest} / ${targetRole}` : ""}

RESUME:\n${structuredResume.substring(0, 6000)}

Return ONLY valid JSON with these fields:
{
  "score": 0-100,
  "summary": "concise summary",
  "scoreBreakdown": { "skills":0, "projects":0, "experience":0, "ats":0, "impact":0, "industryFit":0 },
  "strengths":[],
  "criticalGaps":[],
  "improvementPoints":[],
  "missingKeywords":[],
  "sectionwiseAnalysis":{ "education":"", "experience":"", "projects":"", "skills":"" },
  "improvementPlan":{ "additionalSkills":[], "newProjectIdeas":[], "projectEnhancements":[] },
  "executiveSummary":{ "professionalOverview":"", "careerStageAssessment":"", "top3Strengths":[], "top3Improvements":[], "overallHiringImpression":"" },
  "extendedScores":{ "overallResume":0, "ats":0, "technicalStrength":0, "projectQuality":0, "experience":0, "industryReadiness":0, "communication":0, "leadership":0 },
  "scoreExplanations":{},
  "atsKeywordAnalysis":{ "matchedKeywords":[], "missingKeywords":[], "keywordMatchPercentage":0, "mostImportantMissingKeywords":[], "impactOfMissingKeywords":"" },
  "skillsAnalysis":{ "strongAreas":[], "missingAreas":[], "learningRecommendations":[] },
  "projectAnalysis":[],
  "experienceAnalysis":[]
}`;

  let coreResult: any = {};
  try {
    coreResult = await sendAnalysisRequest(
      "",
      corePrompt,
      maxOutputTokens,
      provider,
      model
    );
  } catch (err) {
    console.error("[AI] Core analysis call failed:", err);
    coreResult = {
      score: 0,
      summary: "Analysis encountered an issue. Please try again.",
      scoreBreakdown: { skills: 0, projects: 0, experience: 0, ats: 0, impact: 0, industryFit: 0 },
      strengths: [],
      criticalGaps: [],
      improvementPoints: [],
      missingKeywords: [],
      sectionwiseAnalysis: { education: "", experience: "", projects: "", skills: "" },
    };
  }

  // ── Call 2: Advanced Analysis ──
  const advancedPrompt = `You are a Career Intelligence Analyst. Based on this resume, provide advanced analysis.

RESUME:\n${structuredResume.substring(0, 4000)}

Return ONLY valid JSON with these fields:
{
  "projectAnalysis":[{ "projectName":"", "technologyStack":[], "domain":"", "complexity":"", "industryRelevance":0, "resumeValue":0, "strengths":[], "weaknesses":[], "recruiterImpression":"" }],
  "projectComparison":{ "strongestProject":"", "projectThatShouldAppearFirst":"", "projectThatShouldBeImproved":"" },
  "experienceAnalysis":[{ "role":"", "organization":"", "duration":"", "technicalDepth":0, "strengths":[], "weaknesses":[], "recruiterImpression":"" }],
  "experienceComparison":{ "mostValuableExperience":"", "mostTechnicalExperience":"", "experienceNeedingRewrite":"" },
  "faangReadiness":{},
  "interviewReadiness":{},
  "portfolioIntelligence":{},
  "marketBenchmarking":{},
  "growthPlan":{},
  "prioritySkills":{},
  "roleSpecificRoadmap":{ "shortTerm":[], "midTerm":[], "longTerm":[], "expectedTimeline":"" }
}`;

  let advancedResult: any = {};
  try {
    advancedResult = await sendAnalysisRequest(
      "",
      advancedPrompt,
      maxOutputTokens,
      provider,
      model
    );
  } catch (err) {
    console.error("[AI] Advanced analysis call failed:", err);
  }

  // ── Merge results ──
  return {
    ...coreResult,
    ...advancedResult,
  };
}

// Forced Refresh: 2026-06-14T00:00:00Z
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

    const systemPrompt = `You are an elite Senior Staff Technical Recruiter and Career Intelligence Analyst with 15+ years of experience across FAANG, top-tier startups, and AI research labs.

Your job is to review this resume as if you're a domain-expert recruiter — not an ATS keyword scanner. Deeply understand the content, infer context, recognize real engineering work, and produce personalized, specific, and calibrated analysis.

====================================================================
ANALYSIS PROTOCOL: You MUST follow these 7 phases in order
====================================================================

[PHASE 1 — RESUME UNDERSTANDING]
Before scoring, extract and understand ALL of these entities from the resume data:
- Education: institution, degree, field, GPA/CGPA, year
- Skills: explicit skills listed, categorized by domain
- Projects: name, technologies, features, domain, AI/ML usage, scalability, complexity
- Experience: role, company, duration, technologies used, whether research or internship
- Achievements: awards, honors, hackathon wins, competitive programming
- Certifications: professional certifications, courses completed
- Leadership: club positions, team lead roles, volunteering leadership
- Open Source: contributions, repos, maintainer roles
- Research: publications, papers, thesis work, lab work

Use this structured understanding as the foundation for ALL subsequent analysis.
After extracting all entities, populate the \`extractedEntities\` field in the output JSON with everything you found from Phase 1.

[PHASE 2 — PROJECT DETECTION & EVALUATION]
Detect ALL projects. Never dismiss or classify real projects as "generic contributions".

For each project, extract:
- Name: the actual project name
- Technologies: ALL languages, frameworks, tools, services mentioned
- Features: specific capabilities described (auth, real-time, caching, etc.)
- Domain: classify as AI/ML, Full Stack Web, Cloud/DevOps, Mobile, Data Engineering, etc.
- AI Usage: any use of LLMs, RAG, embeddings, ML models, NLP, computer vision
- Scalability: microservices, caching, load balancing, distributed design
- Complexity: Low / Medium / High / Very High based on tech stack breadth and architecture

REAL PROJECT EXAMPLES:
- "Mentorix" with Next.js, TypeScript, Node.js, MongoDB, LLMs, RAG → high-value AI Full Stack project
- "E-commerce Platform" with React, Node, PostgreSQL, Redis, Docker → strong full stack with infra
- "CLI Tool" with Python, argparse, pip → moderate complexity tooling project

[PHASE 3 — SKILL INFERENCE]
Infer skills from projects, experience, and achievements — NOT just from explicit skill lists.

INFERENCE RULES:
- Project uses Next.js + TypeScript + Node.js → Infer: Full Stack Development, Frontend, Backend
- Project uses LLMs + RAG + Embeddings → Infer: AI Engineering, GenAI, Prompt Engineering, Vector Databases
- Project uses Docker + AWS + CI/CD → Infer: DevOps, Cloud Infrastructure, MLOps
- Experience mentions distributed systems → Infer: System Design, Distributed Computing
- Experience mentions research lab → Infer: Research Skills, Analytical Thinking, Experiment Design
- Achievement in hackathon → Infer: Rapid Prototyping, Problem Solving, Team Collaboration

Include inferred skills in skillsAnalysis.categories with the "inferred" array.

[PHASE 4 — EXPERIENCE UNDERSTANDING & CALIBRATION]
Value research internships, relevant SWE internships, and lab work correctly.

SCORING CALIBRATION:
- Research internship at top institute (IIITH, IIT, IISc, etc.) with parallel computing, distributed systems, graph algorithms → 85-95 relevance
- SWE internship at product company → 85-95 relevance
- AI/ML research internship → 85-95 relevance
- Teaching assistant / grader → 65-75 relevance
- Campus ambassador → 55-70 relevance
- Volunteer / non-technical → 40-60 relevance

Never give a strong research internship 50-70%. That is inaccurate.

[PHASE 5 — ROLE-AWARE ANALYSIS]
Determine the most likely target role from the resume content and user input.

Score specifically for each relevant role:
- AI Engineer: weigh AI/ML projects heavily (40%), system design (25%), DSA (20%), deployment (15%)
- ML Engineer: weigh ML models (35%), data pipelines (30%), deployment (20%), system design (15%)
- Software Engineer: weigh projects (30%), DSA (25%), system design (25%), experience (20%)
- Full Stack Engineer: weigh frontend (25%), backend (25%), projects (30%), deployment (20%)
- Backend Engineer: weigh backend (35%), system design (30%), databases (20%), DSA (15%)

Adjust your analysis recommendations based on the target role.

[PHASE 6 — RECRUITER REASONING: SPECIFIC, NOT GENERIC]
Generate recruiter-level insights. Never give generic advice.

BAD (generic): "Learn HTML/CSS/JS" or "Improve your skills" or "Build more projects"
GOOD (specific):
- "Deploy Mentorix to AWS ECS with CI/CD pipeline and add Redis caching layer"
- "Add unit tests and integration tests using Jest + React Testing Library"
- "Include RAG evaluation metrics (hit rate, MRR) in your documentation"
- "Add a real-time WebSocket component to demonstrate distributed systems knowledge"
- "Quantify your internship impact: 'Optimized parallel algorithm reducing compute time by 40%'"

Your advice must cite specific technologies, tools, and enhancements relevant to the candidate's actual stack.

[PHASE 7 — SCORING CALIBRATION]
Map scores to real-world expectations:

PROJECT SCORING:
  95-100: Production-grade system with distributed architecture, real users, CI/CD, monitoring
  90-98: Strong AI platform with auth, LLM integration, deployment, proper architecture
  85-94: Solid full-stack app with multiple features, database, deployment, testing
  80-92: ML project with proper evaluation, data pipeline, reasonable architecture
  70-84: Good CRUD app with some complexity, clean code, basic deployment
  60-75: Basic CRUD app, single tech stack, limited features
  40-60: Tutorial-level or incomplete project

EXPERIENCE SCORING:
  90-98: Research at top institute, published work, significant technical contributions
  85-95: SWE/AI internship with measurable impact, real engineering work
  80-90: Relevant internship with meaningful contributions
  70-80: Internship with moderate technical depth
  60-75: Entry-level position, TA, or less technical role
  40-60: Non-technical or volunteer role

OVERALL RESUME SCORING:
  90+: Ready for FAANG/top-tier applications
  80-89: Strong candidate, needs targeted preparation
  70-79: Good profile, some gaps to address
  60-69: Average, needs significant improvement areas identified
  <60: Needs substantial work on projects and experience presentation

GPA scoring: 9.0+/10 or 3.6+/4.0 → 85+ | 8.0+/10 or 3.2+/4.0 → 75+ | 7.0+/10 or 2.8+/4.0 → 65+

====================================================================
OUTPUT JSON SCHEMA
====================================================================
{
  "score": 0-100,
  "summary": "4-5 sentence executive summary citing specific resume content (projects, experiences, skills). No generic filler.",
  "scoreBreakdown": { "skills":0-100, "projects":0-100, "experience":0-100, "ats":0-100, "impact":0-100, "industryFit":0-100 },
  "strengths":[], "criticalGaps":[], "improvementPoints":[], "missingKeywords":[],
  "sectionwiseAnalysis":{ "education":"", "experience":"", "projects":"", "skills":"" },
  "improvementPlan":{ "additionalSkills":[], "newProjectIdeas":[], "projectEnhancements":[] },

  "executiveSummary":{ "professionalOverview":"", "careerStageAssessment":"", "top3Strengths":[], "top3Improvements":[], "overallHiringImpression":"" },
  "extendedScores":{ "overallResume":0, "ats":0, "technicalStrength":0, "projectQuality":0, "experience":0, "industryReadiness":0, "communication":0, "leadership":0 },
  "scoreExplanations":{ "overallResume":"", "ats":"", "technicalStrength":"", "projectQuality":"", "experience":"", "industryReadiness":"", "communication":"", "leadership":"" },

  "atsKeywordAnalysis":{ "matchedKeywords":[], "missingKeywords":[], "keywordMatchPercentage":0, "keywordCoverageHeatmap":[{ "category":"Frontend","percentage":0 },{"category":"Backend","percentage":0},{"category":"DevOps","percentage":0},{"category":"Cloud","percentage":0},{"category":"Databases","percentage":0},{"category":"AI/ML","percentage":0},{"category":"System Design","percentage":0},{"category":"Security","percentage":0}], "mostImportantMissingKeywords":[], "impactOfMissingKeywords":"" },

  "extractedEntities":{ "projects":[{ "name":"","technologies":[],"domain":"","hasAI":false,"complexity":"" }], "experiences":[{ "role":"","company":"","isResearch":false,"isInternship":false }], "skills":[], "education":[], "achievements":[], "certifications":[], "technologies":[], "leadershipActivities":[], "researchWork":[], "hackathons":[], "openSource":[] },
  "skillInference":{ "inferredSkills":[{ "skill":"","source":"","confidence":"" }] },

  "projectAnalysis":[{ "projectName":"", "technologyStack":[], "domain":"", "complexity":"", "technicalComplexity":0, "architectureQuality":0, "scalabilityScore":0, "innovationScore":0, "industryRelevance":0, "resumeValue":0, "recruiterAppeal":0, "strengths":[], "weaknesses":[], "missingTechnologies":[], "missingEngineeringPractices":[], "suggestedMetrics":[], "suggestedResumeRewrite":"", "suggestedFutureEnhancements":[], "recruiterImpression":"" }],

  "projectComparison":{ "rankingTable":[], "strongestProject":"", "weakestProject":"", "mostRecruiterFriendly":"", "mostTechnicallyImpressive":"", "mostInnovative":"", "projectThatShouldAppearFirst":"", "projectThatShouldBeImproved":"", "portfolioDiversityAnalysis":"" },

  "experienceAnalysis":[{ "role":"", "organization":"", "duration":"", "isResearch":false, "isInternship":false, "technicalDepth":0, "businessImpact":0, "ownership":0, "leadershipScore":0, "communicationScore":0, "problemSolving":0, "metricsUsage":0, "recruiterAppeal":0, "strengths":[], "weaknesses":[], "missingMetrics":[], "weakBulletPoints":[], "improvedBullets":[], "suggestedQuantifiableAchievements":[], "recruiterImpression":"" }],

  "experienceComparison":{ "mostValuableExperience":"", "mostTechnicalExperience":"", "mostImpactfulExperience":"", "mostRecruiterFriendly":"", "experienceNeedingRewrite":"", "experienceNeedingMoreMetrics":"" },

  "skillsAnalysis":{ "categories":{ "Programming Languages":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Frontend":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Backend":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Databases":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Cloud":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "DevOps":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "AI/ML":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Data Science":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Cybersecurity":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "System Design":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Distributed Systems":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "CS Fundamentals":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Tools & Platforms":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Soft Skills":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Research Skills":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0}, "Leadership Skills":{"detected":[],"inferred":[],"missing":[],"importanceScore":0,"marketDemandScore":0} }, "strongAreas":[], "missingAreas":[], "skillBalanceScore":0, "learningRecommendations":[] },

  "portfolioIntelligence":{ "portfolioStrengthScore":0, "projectDiversityScore":0, "experienceStrengthScore":0, "leadershipScore":0, "researchScore":0, "industryReadinessScore":0, "careerGrowthPotentialScore":0, "faangPotentialScore":0, "startupReadinessScore":0, "enterpriseReadinessScore":0 },

  "marketBenchmarking":{ "comparedToCSStudents":"", "comparedToInternshipApplicants":"", "comparedToNewGraduates":"", "comparedToFAANGApplicants":"", "reasoning":"" },

  "faangReadiness":{ "google":{"readiness":0,"whyScoreAssigned":"","strengths":[],"weaknesses":[],"missingSkills":[],"expectedImprovementIfFixed":""}, "amazon":{"readiness":0,"whyScoreAssigned":"","strengths":[],"weaknesses":[],"missingSkills":[],"expectedImprovementIfFixed":""}, "microsoft":{"readiness":0,"whyScoreAssigned":"","strengths":[],"weaknesses":[],"missingSkills":[],"expectedImprovementIfFixed":""}, "meta":{"readiness":0,"whyScoreAssigned":"","strengths":[],"weaknesses":[],"missingSkills":[],"expectedImprovementIfFixed":""} },

  "interviewReadiness":{ "dsa":{"readiness":0,"recommendations":[]}, "frontend":{"readiness":0,"recommendations":[]}, "backend":{"readiness":0,"recommendations":[]}, "fullStack":{"readiness":0,"recommendations":[]}, "behavioral":{"readiness":0,"recommendations":[]}, "systemDesign":{"readiness":0,"recommendations":[]} },

  "projectRecommendations":{ "systemDesign":[], "lowLevelDesign":[], "distributedSystems":[] },
  "actionableGapAnalysis":[],
  "resumeBulletAnalyzer":[],
  "resumeComparison":{ "scoreChange":null, "newSkillsAdded":[], "improvementTrend":null, "atsImprovement":null },

  "growthPlan":{ "first30Days":{"focus":"","actions":[],"skills":[],"expectedOutcome":""}, "next60Days":{"focus":"","actions":[],"skills":[],"expectedOutcome":""}, "next90Days":{"focus":"","actions":[],"skills":[],"expectedOutcome":""} },
  "prioritySkills":{ "immediate":[], "shortTerm":[], "longTerm":[] },
  "priorityProjects":{ "quickWins":[], "portfolioBuilders":[], "faangLevel":[] },
  "roleSpecificRoadmap":{ "shortTerm":[], "midTerm":[], "longTerm":[], "expectedTimeline":"" }
}
`;

    // ── PHASE 1: Parse resume into structured data ──
    const parsedResume = parseResume(resumeText);
    const structuredResume = serializeResume(parsedResume);

    // ── Constants ──
    const providerToUse = "groq";
    const modelToUse = MODELS.GROQ_PRIMARY;
    const MAX_OUTPUT_TOKENS = 2000;

    // ── Build user prompt ──
    const buildPrompt = (resumeData: string, jd: string): string => {
      let parts: string[] = [];
      if (mode === "strict_jd" && jd) {
        parts.push(`TARGET JOB DESCRIPTION:\n${jd}`);
      }
      if (mode === "career_intent") {
        parts.push(`CAREER INTENT:\nField: ${fieldOfInterest}\nTarget: ${targetRole}`);
      }
      if (mode === "general") {
        parts.push("MODE: General Job Readiness Benchmarking");
      }
      parts.push(`\nRESUME DATA:\n${resumeData}`);
      return parts.join("\n");
    };

    let activeSystemPrompt = systemPrompt;
    let userPrompt = buildPrompt(structuredResume, jobDescription);

    // ── Pre-flight Token Validation ──
    let breakdown = logTokenBreakdown(
      activeSystemPrompt,
      userPrompt,
      MAX_OUTPUT_TOKENS,
      providerToUse,
      modelToUse
    );

    let needsCompression = breakdown.isOverSafe; // > 10 000
    if (needsCompression) {
      console.log(`[AI] Token total ${breakdown.totalTokens} exceeds safe limit (${SAFE_LIMIT}) — optimizing...`);

      // Step 1: Compress the system prompt (remove verbose examples)
      if (breakdown.systemPromptTokens > 2000) {
        const compressedSys = compressSystemPrompt(activeSystemPrompt);
        const savedSys = estimateTokens(activeSystemPrompt) - estimateTokens(compressedSys);
        if (savedSys > 200) {
          console.log(`[AI] System prompt compressed: saved ~${savedSys} tokens`);
          activeSystemPrompt = compressedSys;
        }
      }

      // Step 2: Compress the resume & job description data
      const compressed = autoCompress(
        {
          summary: structuredResume,
          projectDescriptions: parsedResume.projects.map((p) => p.description),
          experienceDescriptions: parsedResume.experiences.map((e) => e.description),
          jobDescription: mode === "strict_jd" ? jobDescription : undefined,
        },
        // Target budget: leave room for system prompt + output
        Math.max(500, Math.floor(HARD_LIMIT - estimateTokens(activeSystemPrompt) - MAX_OUTPUT_TOKENS - 500))
      );

      // Rebuild structured resume from compressed data
      const compressedParts: string[] = [];
      if (compressed.summary) compressedParts.push(compressed.summary);

      if (parsedResume.projects.length > 0) {
        compressedParts.push("Projects:");
        for (let i = 0; i < parsedResume.projects.length; i++) {
          const p = parsedResume.projects[i];
          const desc = compressed.projectDescriptions[i] || p.description;
          const tech = p.technologies.length > 0
            ? ` [${p.technologies.slice(0, 6).join(", ")}]`
            : "";
          compressedParts.push(`  - ${p.name}${tech}: ${desc.substring(0, 150)}`);
        }
      }

      if (parsedResume.experiences.length > 0) {
        compressedParts.push("Experience:");
        for (let i = 0; i < parsedResume.experiences.length; i++) {
          const e = parsedResume.experiences[i];
          const desc = compressed.experienceDescriptions[i] || e.description;
          const duration = e.duration ? ` (${e.duration})` : "";
          const company = e.company ? ` @ ${e.company}` : "";
          compressedParts.push(`  - ${e.role}${company}${duration}: ${desc.substring(0, 150)}`);
        }
      }

      let compressedResume = compressedParts.join("\n");

      // Compress JD if present
      let finalJD = jobDescription;
      if (mode === "strict_jd" && jobDescription) {
        finalJD = compressJobDescription(jobDescription, 250);
      }

      userPrompt = buildPrompt(compressedResume, finalJD);

      // Step 3: Re-check tokens after compression
      breakdown = logTokenBreakdown(
        activeSystemPrompt,
        userPrompt,
        MAX_OUTPUT_TOKENS,
        providerToUse,
        modelToUse
      );

      // Step 4: If STILL over hard limit, switch to split analysis
      if (breakdown.isOverHard) {
        console.log(`[AI] Still at ${breakdown.totalTokens} tokens — above hard cap (${HARD_LIMIT}). Using split analysis.`);
        const combined = await runSplitAnalysis(
          activeSystemPrompt,
          parsedResume,
          structuredResume,
          jobDescription,
          fieldOfInterest,
          targetRole,
          mode,
          providerToUse,
          modelToUse,
          MAX_OUTPUT_TOKENS
        );

        // Save & return combined result
        const user = await currentUser();
        const userEmail = user?.primaryEmailAddress?.emailAddress;
        if (userEmail) {
          await saveToDatabase(userEmail, resumeText, resumeName, jobDescription, fieldOfInterest, targetRole, combined);
        }
        return NextResponse.json(combined);
      }
    }

    // ── Send main analysis request ──
    let aiOutput = await sendAnalysisRequest(
      activeSystemPrompt,
      userPrompt,
      MAX_OUTPUT_TOKENS,
      providerToUse,
      modelToUse
    );

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
