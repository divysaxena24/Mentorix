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
  output.targetRole ??= "";

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
  targetCompany: string,
  aiOutput: any
): Promise<void> {
  let displayTitle = jobDescription.trim();
  if (displayTitle) {
    const firstLine = displayTitle.split("\n")[0].trim();
    displayTitle = firstLine.length > 80 ? firstLine.substring(0, 77) + "..." : firstLine;
  } else if (fieldOfInterest || targetRole || targetCompany) {
    const titleParts = [fieldOfInterest, targetRole, targetCompany].filter(Boolean);
    displayTitle = titleParts.join(" - ");
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
    const targetCompany = formData.get("targetCompany") as string || "";

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

    const systemPrompt = `You are a Senior Recruiter, Hiring Manager, ATS Expert, and Career Coach. Your job is to analyze the candidate's resume against a TARGET ROLE. You adapt your entire analysis framework to the specific role — you never reuse generic categories across different roles.

==================================================
CRITICAL RULE: YOU ARE ROLE-DRIVEN, NOT RESUME-DRIVEN
==================================================

You must first IDENTIFY the target role from: job description, field of interest, or target role name.

Then GENERATE a role-specific competency framework — the evaluation dimensions, categories, and criteria must CHANGE for each role.

RULES:
- If target role changes, Readiness categories MUST change.
- If target role changes, Missing skills MUST change.
- If target role changes, ATS keywords MUST change.
- If target role changes, Recruiter verdict MUST change.
- If target role changes, Strengths and Weaknesses MUST change.
- NEVER reuse generic software engineering categories for non-SWE roles.

==================================================
CRITICAL RULES
==================================================

DO NOT GENERATE GENERIC FEEDBACK.
DO NOT HALLUCINATE.
DO NOT ASSUME SKILLS THAT DO NOT EXIST.
DO NOT MARK SKILLS AS MISSING IF THEY ARE PRESENT OR CAN BE INFERRED.
ALL ANALYSIS MUST BE BASED ON ACTUAL RESUME DATA.
Keep all feedback concise. recruiterReport text must be under 2000 characters.
If no specific role/JD provided, do a general analysis but identify the most likely role fit from the resume.

==================================================
ROLE-SPECIFIC COMPETENCY FRAMEWORKS — Use the RIGHT one
==================================================

SOFTWARE ENGINEER:
  Categories: DSA, Backend, System Design, Projects, CS Fundamentals
  Missing Skills: Kubernetes, System Design, Distributed Systems, GraphQL, CI/CD
  ATS Keywords: Java, Python, JavaScript, React, Node.js, Docker, AWS, Git, SQL, OOP, DSA, Linux, REST APIs

AI / MACHINE LEARNING ENGINEER:
  Categories: Machine Learning, Deep Learning, LLMs, MLOps, Research, Data Engineering
  Missing Skills: PyTorch, TensorFlow, MLOps, RAG, Docker, AWS SageMaker, LLM Fine-tuning
  ATS Keywords: PyTorch, TensorFlow, scikit-learn, Python, NLP, Computer Vision, LLM, RAG, LangChain, Pandas, NumPy, ML, Deep Learning, Hugging Face, Transformers

DATA SCIENTIST:
  Categories: Statistics, Machine Learning, SQL, Python, Experimentation, Data Visualization
  Missing Skills: A/B Testing, Hypothesis Testing, Statistical Modeling, Tableau, Power BI, Spark, Feature Engineering
  ATS Keywords: Python, SQL, R, Machine Learning, Statistics, Pandas, NumPy, Scikit-learn, A/B Testing, Tableau, Power BI, Data Analysis, Regression, Classification, Data Visualization

BUSINESS ANALYST:
  Categories: SQL, Excel, Data Analysis, Business Acumen, Communication, Stakeholder Management
  Missing Skills: SQL, Advanced Excel, Power BI, Tableau, Requirements Gathering, BRD, Agile, JIRA
  ATS Keywords: SQL, Excel, Power BI, Tableau, Business Analysis, Requirements Gathering, BRD, FRD, Data Analysis, Stakeholder Management, Agile, JIRA, Visio, Process Mapping

PRODUCT MANAGER:
  Categories: Product Strategy, User Research, Analytics, Roadmapping, Leadership, Communication
  Missing Skills: Product Roadmapping, User Research, A/B Testing, SQL, PRD Writing, Stakeholder Management
  ATS Keywords: Product Management, Product Strategy, Roadmap, User Research, A/B Testing, SQL, Agile, Scrum, PRD, OKRs, KPI, Data Analysis, User Stories, JIRA

CHARTERED ACCOUNTANT / FINANCE:
  Categories: Accounting, Taxation, Auditing, Financial Reporting, Compliance, Regulatory Knowledge
  Missing Skills: GAAP/IFRS, Tax Planning, Internal Audit, Financial Modeling, Risk Assessment, Tally, SAP
  ATS Keywords: Accounting, Taxation, Audit, Financial Reporting, GAAP, IFRS, Tally, SAP FICO, Compliance, Risk Management, Internal Audit, GST, Income Tax, Financial Analysis, Balance Sheet

MARKETING MANAGER:
  Categories: Digital Marketing, Content Strategy, SEO/SEM, Analytics, Brand Management, Campaign Management
  Missing Skills: SEO, SEM, Google Analytics, Content Strategy, Social Media Marketing, CRM, HubSpot
  ATS Keywords: Digital Marketing, SEO, SEM, Google Analytics, Content Marketing, Social Media, Brand Management, Campaign Analysis, CRM, HubSpot, Marketing Strategy, PPC

UI/UX DESIGNER:
  Categories: UX Research, Interaction Design, Visual Design, Prototyping, Design Systems, Usability Testing
  Missing Skills: Figma, User Research, Design Systems, Prototyping, Usability Testing, Accessibility, Motion Design
  ATS Keywords: UX Design, UI Design, Figma, Sketch, User Research, Prototyping, Design Systems, Wireframing, Usability Testing, Accessibility, Interaction Design, Visual Design

DATA ENGINEER:
  Categories: ETL, Data Warehousing, Distributed Systems, SQL, Data Modeling, Pipeline Orchestration
  Missing Skills: Apache Spark, Airflow, DBT, Data Warehousing, Kafka, ETL Pipeline Design, Snowflake, BigQuery
  ATS Keywords: Python, SQL, Apache Spark, Airflow, ETL, Data Warehousing, Kafka, Snowflake, BigQuery, Data Modeling, DBT, Data Pipeline, Distributed Systems

DEVOPS / SRE ENGINEER:
  Categories: CI/CD, Containerization, Cloud Platforms, Monitoring, Infrastructure as Code, Security
  Missing Skills: Terraform, Kubernetes, Helm, Prometheus, Grafana, GitHub Actions, AWS/Azure, Ansible
  ATS Keywords: Docker, Kubernetes, Terraform, CI/CD, Jenkins, GitHub Actions, AWS, Azure, Linux, Prometheus, Grafana, Helm, Ansible, Infrastructure as Code, Monitoring

If target role doesn't match any listed: GENERATE a custom 5-category framework dynamically based on that role's real-world requirements.

==================================================
EVERYTHING CHANGES WITH THE ROLE
==================================================

Company Readiness Areas MUST be role-specific categories from the framework above.
Missing Skills MUST be the role-specific missing skills listed above.
ATS Keywords MUST be the role-specific keywords listed above.
Recruiter Verdict MUST reference the target role explicitly.
Strengths/Weaknesses MUST be evaluated against target role requirements.

SCORING ADJUSTMENTS BY ROLE:
- If resume is technical (Java, Python, React) but target role is CHARTERED ACCOUNTANT: readiness score should be LOW (20-35). Missing skills should include Accounting, Taxation, GAAP/IFRS, Tally. Verdict should explain why the technical background doesn't transfer.
- If resume is technical but target role is BUSINESS ANALYST: readiness moderate (40-55). Missing skills should include SQL, Excel, Power BI, BRD writing. Identify transferable skills like data analysis, communication. Highlight missing business-analysis competencies.
- If resume is non-technical but target role is SOFTWARE ENGINEER: readiness LOW (15-30). Missing skills should include programming languages, DSA, system design.
- If resume perfectly matches the target role: readiness HIGH (80-95).

==================================================
SCORING FORMULAS
==================================================

Skills Score = Depth (40%) + Breadth (20%) + Role Relevance (20%) + Core Competency (20%)
  — The "Core Competency" must be role-specific (e.g., DSA for SWE, Journal Entries for CA, UX Research for Designer)

Project Score = Technical Skill Relevance (30%) + Role Alignment (25%) + Complexity (20%) + Innovation (15%) + Value (10%)
  — "Role Alignment" measures how much the project demonstrates skills relevant to the TARGET ROLE

Experience Score = Skill Relevance (40%) + Role Alignment (25%) + Impact (20%) + Exposure (15%)
  — "Role Alignment" measures how relevant past experience is to the target role

==================================================
ATS ANALYSIS — Role-driven keywords
==================================================

Match keywords from the role-specific keyword lists above. Extract from resume what matches.
Missing = role-specific keywords NOT found in resume.
Never use generic tech keywords for non-tech roles.
Target 12-20+ matched keywords for good coverage.

==================================================
RECRUITER-GRADE FEEDBACK
==================================================

Feedback must feel like it was written by a Senior Recruiter for that SPECIFIC role — NOT a generic AI chatbot.
Be specific. Be evidence-based. Be recruiter-grade.
Mention the target role by name in the verdict.

==================================================
OUTPUT JSON SCHEMA — Return ONLY this exact structure:
==================================================

{
  "overallScore": 0-100,
  "targetRole": "Software Engineer",

  "skillsScore": 0-100,
  "strongSkills": ["Java", "Python", "React", "PostgreSQL", "AWS"],
  "missingSkills": ["Kubernetes", "GraphQL"],
  "criticalMissingSkills": ["Kubernetes"],
  "skillsRecruiterVerdict": "1-2 sentence verdict on skills for target role",

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
  "matchedKeywords": ["Java", "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express.js", "PostgreSQL", "MongoDB", "Redis", "Docker", "AWS", "GitHub Actions", "Linux", "HTML", "CSS", "Git"],
  "missingKeywords": ["Kubernetes", "GraphQL"],
  "criticalMissingKeywords": ["Kubernetes"],
  "expectedATSImprovement": "Adding Kubernetes and GraphQL could improve ATS compatibility by 10-15%.",

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
  "companyReadinessVerdict": "Strong internship candidate with solid CS fundamentals, DSA skills, and project experience for the target role. Interview probability is high with focused system design preparation.",

  "recruiterReport": "2-3 paragraph detailed analysis. Keep under 2000 characters. Explain all scores with evidence from resume."
}

overallScore = skillsScore*0.25 + avg(projectScores)*0.30 + avg(experienceScores)*0.25 + atsScore*0.10 + companyReadinessScore*0.10

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no extra text, no explanations. Raw JSON only. Include "targetRole" field so the UI can display it. Keep recruiterReport under 2000 characters to prevent content overflow.`;

    let userPromptParts: string[] = [];
    if (mode === "strict_jd" && jobDescription) {
      userPromptParts.push(`TARGET JOB DESCRIPTION:\n${jobDescription}`);
    }
    if (mode === "career_intent") {
      let intentParts = [`CAREER INTENT:`];
      if (fieldOfInterest) intentParts.push(`Field: ${fieldOfInterest}`);
      if (targetRole) intentParts.push(`Target Role: ${targetRole}`);
      if (targetCompany) intentParts.push(`Target Company: ${targetCompany}`);
      userPromptParts.push(intentParts.join("\n"));
    }

    // Send ONLY structured JSON to AI — never raw resume text
    // Truncate structured resume to prevent exceeding Groq free-tier TPM limits (12k)
    const MAX_STRUCTURED_CHARS = 3000;
    const truncatedResume = structuredResume.length > MAX_STRUCTURED_CHARS
      ? structuredResume.substring(0, MAX_STRUCTURED_CHARS) + "\n[truncated for length]"
      : structuredResume;
    userPromptParts.push(`EXTRACTED RESUME DATA (structured JSON only):\n${truncatedResume}`);

    let effectiveSystemPrompt = systemPrompt;
    let effectiveMaxOutput = 4000; // max output tokens — reduced from 8000 to fit Groq free tier 12k TPM limit

    const userPrompt = userPromptParts.join("\n\n");

    // Token budget guard: total = input (est.) + max output must stay under 11k (leaving margin)
    const estimatedInputTokens = Math.ceil((effectiveSystemPrompt.length + userPrompt.length) / 4);
    const estimatedTotal = estimatedInputTokens + effectiveMaxOutput;
    if (estimatedTotal > 11000) {
      const overflow = estimatedTotal - 11000;
      console.warn(`[AI] Request too large: est. ${estimatedTotal} tokens (${overflow} over), trimming system prompt...`);
      // Compress system prompt: keep everything up to the ROLE-SPECIFIC COMPETENCY FRAMEWORKS section,
      // plus the output schema. Drop verbose role framework examples and scoring details.
      const schemaIdx = effectiveSystemPrompt.indexOf("OUTPUT JSON SCHEMA");
      const frameworksIdx = effectiveSystemPrompt.indexOf("ROLE-SPECIFIC COMPETENCY FRAMEWORKS");
      const rulesIdx = effectiveSystemPrompt.indexOf("CRITICAL RULES");
      if (schemaIdx > 0) {
        // Keep: critical rules + schema. Remove: verbose frameworks, scoring formulas, ATS details
        const headerPart = effectiveSystemPrompt.substring(0, frameworksIdx > 0 ? frameworksIdx : 0);
        // Keep the schema from OUTPUT JSON SCHEMA onward, truncated to 2500 chars
        const schemaPart = effectiveSystemPrompt.substring(schemaIdx, Math.min(schemaIdx + 2500, effectiveSystemPrompt.length));
        effectiveSystemPrompt = headerPart + "\n\n[Role-specific competency frameworks removed for brevity — apply appropriate framework based on target role]\n\n" + schemaPart;
        console.warn(`[AI] Trimmed system prompt from ${systemPrompt.length} to ${effectiveSystemPrompt.length} chars`);
      } else if (rulesIdx > 0) {
        // Fallback: just take first 4000 chars
        effectiveSystemPrompt = effectiveSystemPrompt.substring(0, 4000) + "\n\n[System prompt truncated for length — follow output schema strictly]\n\n" + effectiveSystemPrompt.substring(effectiveSystemPrompt.lastIndexOf("{"));
      }
    }

    // Step 5: Send to AI
    const providerToUse = "groq";
    const modelToUse = MODELS.GROQ_PRIMARY;

    let aiOutput = await sendAnalysisRequest(
      effectiveSystemPrompt,
      userPrompt,
      effectiveMaxOutput,
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
      await saveToDatabase(userEmail, resumeText, resumeName, jobDescription, fieldOfInterest, targetRole, targetCompany, aiOutput);
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
