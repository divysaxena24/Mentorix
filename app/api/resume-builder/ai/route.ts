import { NextRequest, NextResponse } from "next/server"
import { MODELS } from "@/lib/ai/models"
import { generateAIResponse } from "@/lib/ai/provider-manager"
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit"
import type { ResumeData } from "@/types"

// ─── Shared System Prompt ───────────────────────────────────────────────
// Using array.join to avoid backtick parsing issues with template literals

const RESUME_BUILDER_SYSTEM_PROMPT = [
  "You are Mentorix Resume Builder AI, an expert FAANG recruiter, ATS specialist, resume writer, and career coach.",
  "",
  "You support three modes:",
  "",
  "1. BUILD_NEW_RESUME",
  "2. IMPROVE_EXISTING_RESUME",
  "3. TAILOR_FOR_JOB_DESCRIPTION",
  "",
  "---",
  "",
  "## GLOBAL RULES",
  "",
  "* Never invent experience.",
  "* Never invent projects.",
  "* Never invent achievements.",
  "* Never invent skills.",
  "* Never invent education.",
  "* Never invent certifications.",
  "",
  "Only use information explicitly provided by the user.",
  "",
  "Improve wording, structure, readability, impact, and ATS optimization.",
  "",
  "Use strong action verbs.",
  "",
  "Prioritize recruiter readability.",
  "",
  "Keep content concise, measurable, and achievement-focused.",
  "",
  "When possible, transform weak bullets into impact-oriented bullets.",
  "",
  "Example:",
  "",
  'Bad:',
  '"Worked on a chatbot project."',
  "",
  'Good:',
  '"Developed an AI-powered chatbot using LangChain and OpenAI APIs, reducing response latency by 30% during testing."',
  "",
  "Do not generate fake metrics.",
  "",
  "Only use metrics if provided.",
  "",
  "---",
  "",
  "## STRICT DATA INTEGRITY RULES",
  "",
  "CRITICAL: Never create placeholder content.",
  "",
  "Never generate:",
  '* "Your Full Name", "Your Email", "Your Phone", "Your Address"',
  '* "Institution", "Company", "TechCorp", "ABC Company"',
  '* "XYZ University", "Untitled Project", "Project Name"',
  '* "Role", "Certification Name"',
  "",
  "Never invent:",
  "* Projects, Experience, Certifications, Awards",
  "* Research Papers, Achievements, Companies",
  "* Universities, Dates, Metrics",
  "",
  "If information is missing:",
  "DO NOT CREATE FAKE CONTENT.",
  "Instead: Omit the section completely OR return the section with an empty array.",
  "",
  "Examples:",
  'BAD: {"projects": [{"name": "Untitled Project"}]}',
  'GOOD: {"projects": []}',
  "",
  'BAD: {"experience": [{"company": "TechCorp"}]}',
  'GOOD: {"experience": []}',
  "",
  'BAD: {"name": "Your Full Name"}',
  'GOOD: {"name": ""}',
  "",
  "Only display sections that contain real user-provided information.",
  "If a section contains no valid data, exclude it from the final resume.",
  "",
  "---",
  "",
  "## MODE 1: BUILD_NEW_RESUME",
  "",
  "If mode = BUILD_NEW_RESUME:",
  "",
  "Generate a complete professional ATS-friendly resume using:",
  "",
  "* Personal Information",
  "* Education",
  "* Experience",
  "* Projects",
  "* Skills",
  "* Certifications",
  "* Achievements",
  "",
  "Create:",
  "",
  "1. Professional Summary",
  "2. Skills Section",
  "3. Experience Section",
  "4. Projects Section",
  "5. Education Section",
  "6. Certifications Section",
  "",
  "Output JSON:",
  "",
  "{",
  '"resume": {',
  '"summary": "",',
  '"skills": [],',
  '"experience": [],',
  '"projects": [],',
  '"education": [],',
  '"certifications": [],',
  '"achievements": []',
  "},",
  '"atsScore": 0,',
  '"strengths": [],',
  '"improvements": []',
  "}",
  "",
  "---",
  "",
  "## MODE 2: IMPROVE_EXISTING_RESUME",
  "",
  "If mode = IMPROVE_EXISTING_RESUME:",
  "",
  "Inputs:",
  "",
  "* Existing Resume",
  "* User Prompt",
  "",
  "Examples:",
  "",
  '"Make ATS friendly"',
  "",
  '"Improve project descriptions"',
  "",
  '"Reduce to one page"',
  "",
  '"Optimize for internships"',
  "",
  '"Improve technical impact"',
  "",
  "Tasks:",
  "",
  "* Improve bullet points",
  "* Improve ATS keywords",
  "* Improve formatting structure",
  "* Improve readability",
  "* Improve recruiter appeal",
  "* Preserve all facts",
  "",
  "Return the full updated resume JSON as field resumeData (with all sections preserved from input, only modifying the changes requested), plus a text summary of changes.",
  "",
  "Return:",
  "",
  "{",
  '"resumeData": {',
  '"personalInfo": {...},',
  '"education": [...],',
  '"experience": [...],',
  '"skills": [...],',
  '"projects": [...],',
  '"certifications": [...],',
  '"achievements": [...],',
  '"languages": [...],',
  '"publications": [...],',
  '"customSections": [...],',
  '"template": "corporate"',
  "},",
  '"updatedResume": "",',
  '"changesMade": [',
  "{",
  '"section": "",',
  '"before": "",',
  '"after": "",',
  '"reason": ""',
  "}",
  "],",
  '"atsImprovement": "",',
  '"summary": ""',
  "}",
  "",
  "---",
  "",
  "## MODE 3: TAILOR_FOR_JOB_DESCRIPTION",
  "",
  "Inputs:",
  "",
  "* Resume",
  "* Job Description",
  "",
  "Tasks:",
  "",
  "1. Extract important keywords",
  "2. Extract required skills",
  "3. Extract technologies",
  "4. Compare against resume",
  "5. Optimize resume for ATS",
  "",
  "Return the full tailored resume JSON as field resumeData (the complete updated ResumeData after tailoring), plus text analysis.",
  "",
  "Return:",
  "",
  "{",
  '"resumeData": {',
  '"personalInfo": {...},',
  '"education": [...],',
  '"experience": [...],',
  '"skills": [...],',
  '"projects": [...],',
  '"certifications": [...],',
  '"achievements": [...],',
  '"languages": [...],',
  '"publications": [...],',
  '"customSections": [...],',
  '"template": "corporate"',
  "},",
  '"updatedResume": "",',
  '"atsBefore": 0,',
  '"atsAfter": 0,',
  '"matchedKeywords": [],',
  '"missingKeywords": [],',
  '"changesMade": [],',
  '"recruiterFeedback": ""',
  "}",
  "",
  "---",
  "",
  "## PROJECT WRITING RULES",
  "",
  "Project bullets must include:",
  "",
  "1. What was built",
  "2. Technologies used",
  "3. Technical complexity",
  "4. Outcome or impact",
  "",
  "Format:",
  "",
  "Developed [solution] using [technologies], implementing [technical concept], resulting in [impact].",
  "",
  "---",
  "",
  "## EXPERIENCE WRITING RULES",
  "",
  "Experience bullets must include:",
  "",
  "1. Action verb",
  "2. Technical contribution",
  "3. Tools used",
  "4. Outcome",
  "",
  "Format:",
  "",
  "Designed, Developed, Built, Automated, Optimized, Implemented, Engineered, Integrated, Deployed, Scaled.",
  "",
  "---",
  "",
  "## ATS OPTIMIZATION RULES",
  "",
  "* Prioritize industry-standard keywords.",
  "* Keep formatting ATS-friendly.",
  "* Avoid excessive tables.",
  "* Avoid graphics.",
  "* Use clear section headings.",
  "* Include role-relevant keywords naturally.",
  "* Optimize for recruiter scanning.",
  "",
  "---",
  "",
  "## OUTPUT REQUIREMENT",
  "",
  "Always return valid JSON only.",
  "",
  "Do not include markdown.",
  "",
  "Do not include explanations outside JSON.",
  "",
  "Do not include conversational text.",
].join("\n")

// ─── JSON Extraction Utility ────────────────────────────────────────────

function extractJson(raw: string): any {
  if (!raw || raw.trim().length === 0) {
    throw new SyntaxError("Empty AI response")
  }

  const tryParse = (str: string): any => {
    try {
      return JSON.parse(str)
    } catch {
      let fixed = str.replace(/,\s*([}\]])/g, "$1")
      try {
        return JSON.parse(fixed)
      } catch {
        return null
      }
    }
  }

  // Direct parse
  let result = tryParse(raw)
  if (result !== null) return result

  // Strip code fences (the regex uses escaped backticks inside a regular string, which is safe)
  const codeBlockRegexes = [
    /```(?:json|javascript|js)?\s*\n?([\s\S]*?)\n?```/i,
    /``([\s\S]*?)``/,
  ]
  for (const regex of codeBlockRegexes) {
    const match = raw.match(regex)
    if (match) {
      const extracted = match[1].trim()
      result = tryParse(extracted)
      if (result !== null) return result

      const firstBrace = extracted.indexOf("{")
      const lastBrace = extracted.lastIndexOf("}")
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        result = tryParse(extracted.substring(firstBrace, lastBrace + 1))
        if (result !== null) return result
      }
    }
  }

  // Find outermost JSON object
  const firstBrace = raw.indexOf("{")
  if (firstBrace !== -1) {
    let depth = 0
    let lastCompleteBrace = -1
    for (let i = firstBrace; i < raw.length; i++) {
      if (raw[i] === "{") depth++
      else if (raw[i] === "}") {
        depth--
        if (depth === 0) { lastCompleteBrace = i; break }
      }
    }
    if (lastCompleteBrace > firstBrace) {
      result = tryParse(raw.substring(firstBrace, lastCompleteBrace + 1))
      if (result !== null) return result
    }
  }

  // Aggressive first { to last }
  const firstOpen = raw.indexOf("{")
  const lastClose = raw.lastIndexOf("}")
  if (firstOpen !== -1 && lastClose > firstOpen) {
    result = tryParse(raw.substring(firstOpen, lastClose + 1))
    if (result !== null) return result
  }

  throw new SyntaxError("Could not extract valid JSON from AI response")
}

// ─── Serialize ResumeData to a readable text format ──────────────────────

function serializeResumeForAI(data: ResumeData): string {
  const sections: string[] = []

  // Personal Info
  const pi = data.personalInfo
  sections.push("PERSONAL INFORMATION:")
  sections.push(`Name: ${pi.fullName || "N/A"}`)
  sections.push(`Email: ${pi.email || "N/A"}`)
  sections.push(`Phone: ${pi.phone || "N/A"}`)
  sections.push(`Location: ${pi.address || "N/A"}`)
  if (pi.linkedin) sections.push(`LinkedIn: ${pi.linkedin}`)
  if (pi.github) sections.push(`GitHub: ${pi.github}`)
  if (pi.portfolio) sections.push(`Portfolio: ${pi.portfolio}`)
  if (pi.summary) sections.push(`Summary: ${pi.summary}`)

  // Education
  if (data.education.length > 0) {
    sections.push("\nEDUCATION:")
    data.education.forEach((edu, i) => {
      sections.push(`${i + 1}. ${edu.degree} - ${edu.institution} (${edu.startDate || ""} - ${edu.endDate || ""})${edu.cgpa ? ` | GPA: ${edu.cgpa}` : ""}`)
      if (edu.description) sections.push(`   ${edu.description}`)
    })
  }

  // Experience
  if (data.experience.length > 0) {
    sections.push("\nEXPERIENCE:")
    data.experience.forEach((exp, i) => {
      sections.push(`${i + 1}. ${exp.role} at ${exp.company} (${exp.startDate || ""} - ${exp.endDate || ""})`)
      if (exp.description) {
        exp.description.split("\n").filter(Boolean).forEach(line => sections.push(`   - ${line}`))
      }
    })
  }

  // Projects
  if (data.projects.length > 0) {
    sections.push("\nPROJECTS:")
    data.projects.forEach((proj, i) => {
      sections.push(`${i + 1}. ${proj.title || "Untitled"}${proj.technologies?.length ? ` [${proj.technologies.join(", ")}]` : ""}`)
      if (proj.description) {
        proj.description.split("\n").filter(Boolean).forEach(line => sections.push(`   - ${line}`))
      }
    })
  }

  // Skills
  if (data.skills.length > 0) {
    sections.push("\nSKILLS:")
    data.skills.forEach(skill => {
      sections.push(`  ${skill.category}: ${skill.skills.join(", ")}`)
    })
  }

  // Achievements (prefer new structure, fall back to old honors)
  const achievementsList = data.achievements || (data.honors || []).map(h => ({ title: h }))
  if (achievementsList.filter(Boolean).length > 0) {
    sections.push("\nACHIEVEMENTS & AWARDS:")
    achievementsList.forEach(a => {
      if (!a) return
      const parts = [a.title]
      if (a.date) parts.push(`(${a.date})`)
      if (a.description) parts.push(`- ${a.description}`)
      sections.push(`  - ${parts.join(" ")}`)
    })
  }

  // Certifications
  if (data.certifications && data.certifications.length > 0) {
    sections.push("\nCERTIFICATIONS:")
    data.certifications.forEach(cert => {
      const parts = [cert.title]
      if (cert.issuer) parts.push(`- ${cert.issuer}`)
      if (cert.date) parts.push(`(${cert.date})`)
      sections.push(`  - ${parts.join(" ")}`)
    })
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    sections.push("\nLANGUAGES:")
    data.languages.forEach(lang => {
      const entry = lang.proficiency ? `${lang.name} (${lang.proficiency})` : lang.name
      sections.push(`  - ${entry}`)
    })
  }

  // Publications
  if (data.publications && data.publications.length > 0) {
    sections.push("\nPUBLICATIONS:")
    data.publications.forEach(pub => {
      const parts = [pub.title]
      if (pub.publisher) parts.push(`- ${pub.publisher}`)
      if (pub.date) parts.push(`(${pub.date})`)
      sections.push(`  - ${parts.join(" ")}`)
    })
  }

  // Custom Sections
  if (data.customSections && data.customSections.length > 0) {
    sections.push("\nCUSTOM SECTIONS:")
    data.customSections.forEach(section => {
      sections.push(`  ${section.title}:`)
      section.items.forEach(item => {
        const parts = [item.title, item.subtitle, item.date, item.description].filter(Boolean)
        if (parts.length) sections.push(`    - ${parts.join(" | ")}`)
      })
    })
  }

  return sections.join("\n")
}

// ─── Build User Prompt by Mode ──────────────────────────────────────────

function buildUserPrompt(
  mode: "BUILD_NEW_RESUME" | "IMPROVE_EXISTING_RESUME" | "TAILOR_FOR_JOB_DESCRIPTION",
  resumeData?: ResumeData,
  resumeText?: string,
  userPrompt?: string,
  jobDescription?: string
): string {
  const parts: string[] = []
  parts.push(`MODE: ${mode}`)
  parts.push("")

  if (mode === "BUILD_NEW_RESUME") {
    if (resumeText) {
      parts.push("Generate a complete professional ATS-friendly resume from the following user description:")
      parts.push("")
      parts.push(resumeText)
    } else if (resumeData) {
      parts.push("Generate a complete professional ATS-friendly resume from the following data:")
      parts.push("")
      parts.push(serializeResumeForAI(resumeData))
    }
  }

  if (mode === "IMPROVE_EXISTING_RESUME") {
    parts.push("Improve the following resume based on the user's request.")
    if (userPrompt) {
      parts.push("")
      parts.push(`USER REQUEST: ${userPrompt}`)
    }
    if (resumeText) {
      parts.push("")
      parts.push("EXISTING RESUME:")
      parts.push(resumeText)
    } else if (resumeData) {
      parts.push("")
      parts.push("EXISTING RESUME:")
      parts.push(serializeResumeForAI(resumeData))
    }
  }

  if (mode === "TAILOR_FOR_JOB_DESCRIPTION") {
    parts.push("Tailor the following resume for the provided job description.")
    if (jobDescription) {
      parts.push("")
      parts.push("JOB DESCRIPTION:")
      parts.push(jobDescription)
    }
    if (resumeText) {
      parts.push("")
      parts.push("EXISTING RESUME:")
      parts.push(resumeText)
    } else if (resumeData) {
      parts.push("")
      parts.push("EXISTING RESUME:")
      parts.push(serializeResumeForAI(resumeData))
    }
  }

  return parts.join("\n")
}

// ─── POST Handler ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = getRequestIP(req)
    const { limited, resetIn } = checkRateLimit(`resume-builder-ai:${ip}`, AI_RATE_LIMIT)
    if (limited) {
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${resetIn} seconds.` },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { mode, resumeData, resumeText, userPrompt, jobDescription } = body

    if (!mode || !["BUILD_NEW_RESUME", "IMPROVE_EXISTING_RESUME", "TAILOR_FOR_JOB_DESCRIPTION"].includes(mode)) {
      return NextResponse.json({ error: "Invalid or missing mode. Must be one of: BUILD_NEW_RESUME, IMPROVE_EXISTING_RESUME, TAILOR_FOR_JOB_DESCRIPTION" }, { status: 400 })
    }

    // For BUILD_NEW_RESUME: accept resumeText (plain text prompt) instead of structured resumeData
    // For IMPROVE_EXISTING_RESUME / TAILOR_FOR_JOB_DESCRIPTION: accept resumeText as alternative to resumeData
    const hasResumeContent = !!(resumeData || resumeText)
    if (mode !== "BUILD_NEW_RESUME" && !hasResumeContent) {
      return NextResponse.json({ error: "resumeData or resumeText is required" }, { status: 400 })
    }
    if (mode === "BUILD_NEW_RESUME" && !resumeText && !resumeData) {
      return NextResponse.json({ error: "resumeText (user description) is required for BUILD_NEW_RESUME mode" }, { status: 400 })
    }

    if (mode === "TAILOR_FOR_JOB_DESCRIPTION" && !jobDescription) {
      return NextResponse.json({ error: "jobDescription is required for TAILOR_FOR_JOB_DESCRIPTION mode" }, { status: 400 })
    }

    const systemPrompt = RESUME_BUILDER_SYSTEM_PROMPT
    const userPromptText = buildUserPrompt(mode, resumeData, resumeText, userPrompt, jobDescription)

    const aiResponse = await generateAIResponse({
      systemPrompt,
      userPrompt: userPromptText,
      temperature: 0.3,
      maxTokens: 4096,
      model: MODELS.GROQ_PRIMARY,
      feature: "resume-builder",
      jsonMode: true,
    })

    let aiOutput
    try {
      aiOutput = extractJson(aiResponse.content)
    } catch (parseErr) {
      console.error("[Resume Builder AI] Failed to parse AI response:", parseErr)
      // Retry with stronger JSON instruction
      const retryResponse = await generateAIResponse({
        systemPrompt,
        userPrompt: `${userPromptText}\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY valid JSON. No markdown, no code fences, no extra text.`,
        temperature: 0.1,
        maxTokens: 4096,
        model: MODELS.GROQ_PRIMARY,
        feature: "resume-builder",
        jsonMode: true,
      })
      try {
        aiOutput = extractJson(retryResponse.content)
      } catch (retryErr) {
        return NextResponse.json({ error: "AI returned invalid JSON after retry" }, { status: 500 })
      }
    }

    return NextResponse.json({
      ...aiOutput,
      mode,
    })

  } catch (error: unknown) {
    const err = error as { status?: number; message?: string; error?: { message?: string } }
    console.error("[Resume Builder AI] Error:", err.message)
    const statusCode = err.status || 500
    return NextResponse.json(
      { error: err.error?.message || err.message || "Failed to process AI resume request" },
      { status: statusCode }
    )
  }
}
