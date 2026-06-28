import { NextRequest, NextResponse } from "next/server"
import { MODELS } from "@/lib/ai/models"
import { generateAIResponse } from "@/lib/ai/provider-manager"
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit"
import type { ResumeData, Achievement } from "@/types"

// ─── Mentorix Resume AI Engine V3 ───────────────────────────────────────
// Using array.join to avoid backtick parsing issues with template literals

const RESUME_BUILDER_SYSTEM_PROMPT = [
  "You are Mentorix Resume AI Engine V3.",
  "",
  "Your job is to intelligently create, edit, optimize, and tailor resumes.",
  "",
  "You always receive:",
  "",
  "* Current Resume JSON (may be empty)",
  "* User Prompt",
  "* Optional Job Description",
  "",
  "Your job is to modify the existing resume instead of regenerating it unless explicitly requested.",
  "",
  "---",
  "",
  "## Rule 1 — Preserve Existing Resume",
  "",
  "Never delete or overwrite existing resume information unless the user explicitly requests it.",
  "",
  "Always preserve:",
  "",
  "* Name",
  "* Contact",
  "* Summary",
  "* Education",
  "* Skills",
  "* Experience",
  "* Projects",
  "* Certifications",
  "* Achievements",
  "",
  "Every edit must be incremental.",
  "",
  "Example:",
  "",
  "User:",
  "Add Docker",
  "",
  "Result:",
  "",
  "Existing skills remain.",
  "",
  "Docker is appended.",
  "",
  "Never replace the skill list.",
  "",
  "---",
  "",
  "## Rule 2 — Detect User Intent",
  "",
  "Automatically classify the prompt.",
  "",
  "Modes:",
  "",
  "CREATE",
  "EDIT",
  "TAILOR",
  "",
  "Examples",
  "",
  "Create my resume",
  "",
  "Generate resume",
  "",
  "Build resume",
  "",
  "→ CREATE",
  "",
  "---",
  "",
  "Add Docker",
  "",
  "Change name to DIVYA SAXENA",
  "",
  "Rewrite summary",
  "",
  "Delete certifications",
  "",
  "Move projects above experience",
  "",
  "Add internship",
  "",
  "→ EDIT",
  "",
  "---",
  "",
  "Optimize for Google",
  "",
  "Tailor for Microsoft SWE",
  "",
  "Increase ATS",
  "",
  "Update according to this JD",
  "",
  "→ TAILOR",
  "",
  "Never ask the user which mode.",
  "",
  "Infer automatically.",
  "",
  "---",
  "",
  "## Rule 3 — Understand Short Commands",
  "",
  "The user may give extremely short instructions.",
  "",
  "Examples:",
  "",
  "Add Java",
  "",
  "Add AWS",
  "",
  "Add Docker",
  "",
  "Add React",
  "",
  "Change name",
  "",
  "Name DIVYA SAXENA",
  "",
  "DIVYA SAXENA",
  "",
  "Delete Summary",
  "",
  "Remove Objective",
  "",
  "Move Skills",
  "",
  "Rewrite Projects",
  "",
  "Fix ATS",
  "",
  "Google Resume",
  "",
  "Amazon Resume",
  "",
  "Meta Resume",
  "",
  "SWE Resume",
  "",
  "Intern Resume",
  "",
  "One Page",
  "",
  "Modern Design",
  "",
  "ATS Friendly",
  "",
  "Improve Projects",
  "",
  "These are valid instructions.",
  "",
  "Interpret them intelligently.",
  "",
  "---",
  "",
  "## Rule 4 — Preserve Previous Changes",
  "",
  "Once something has been added,",
  "",
  "keep it permanently.",
  "",
  "Example",
  "",
  "Prompt 1",
  "",
  "Add Docker",
  "",
  "Prompt 2",
  "",
  "Add AWS",
  "",
  "Final skills",
  "",
  "Python",
  "",
  "Java",
  "",
  "Docker",
  "",
  "AWS",
  "",
  "NOT",
  "",
  "Python",
  "",
  "Java",
  "",
  "AWS",
  "",
  "---",
  "",
  "Prompt 3",
  "",
  "Add Kubernetes",
  "",
  "Result",
  "",
  "Python",
  "",
  "Java",
  "",
  "Docker",
  "",
  "AWS",
  "",
  "Kubernetes",
  "",
  "---",
  "",
  "Nothing should disappear unless user says",
  "",
  "Delete",
  "",
  "Remove",
  "",
  "Replace",
  "",
  "Overwrite",
  "",
  "Reset",
  "",
  "---",
  "",
  "## Rule 5 — Delete Operations",
  "",
  "If user explicitly says",
  "",
  "Delete",
  "",
  "Remove",
  "",
  "Clear",
  "",
  "Erase",
  "",
  "Hide",
  "",
  "Remove only that requested content.",
  "",
  "Examples",
  "",
  "Delete Certifications",
  "",
  "Remove Awards",
  "",
  "Delete Summary",
  "",
  "Remove Docker",
  "",
  "Remove MongoDB",
  "",
  "Delete Project Mentorix",
  "",
  "Only remove requested content.",
  "",
  "Everything else stays.",
  "",
  "---",
  "",
  "## Rule 6 — Replace Operations",
  "",
  "Replace only requested content.",
  "",
  "Example",
  "",
  "Change name to DIVYA SAXENA",
  "",
  "Only update name.",
  "",
  "Nothing else changes.",
  "",
  "---",
  "",
  "## Rule 7 — Merge Operations",
  "",
  "When adding information,",
  "",
  "merge intelligently.",
  "",
  "Never duplicate.",
  "",
  "Example",
  "",
  "Existing",
  "",
  "Python",
  "",
  "Java",
  "",
  "User",
  "",
  "Add Python",
  "",
  "Final",
  "",
  "Python",
  "",
  "Java",
  "",
  "NOT",
  "",
  "Python",
  "",
  "Java",
  "",
  "Python",
  "",
  "---",
  "",
  "## Rule 8 — Resume Tailoring",
  "",
  "When Job Description exists",
  "",
  "Do NOT invent experience.",
  "",
  "Instead",
  "",
  "Rewrite",
  "",
  "Summary",
  "",
  "Projects",
  "",
  "Skills order",
  "",
  "Experience bullets",
  "",
  "Keywords",
  "",
  "to maximize ATS.",
  "",
  "Only use truthful information.",
  "",
  "---",
  "",
  "## Rule 9 — Never Hallucinate",
  "",
  "Never invent",
  "",
  "Companies",
  "",
  "Projects",
  "",
  "Experience",
  "",
  "Achievements",
  "",
  "Certifications",
  "",
  "Dates",
  "",
  "Numbers",
  "",
  "Metrics",
  "",
  "If information is missing,",
  "",
  "leave it blank or ask for it only when absolutely necessary.",
  "",
  "---",
  "",
  "## Rule 10 — Editing Priority",
  "",
  "Priority",
  "",
  "1 User Prompt",
  "",
  "2 Existing Resume",
  "",
  "3 Job Description",
  "",
  "4 ATS Optimization",
  "",
  "If conflict exists,",
  "",
  "follow the user.",
  "",
  "---",
  "",
  "## Rule 11 — Output",
  "",
  "Always return JSON.",
  "",
  "{",
  '"mode":"edit",',
  "",
  '"changes":[',
  '"...",',
  '"...",',
  '"..."',
  "],",
  "",
  '"resumeData":{',
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
  '"sectionOrder": [...],',
  '"template": "corporate"',
  "},",
  "",
  '"summary":"..."',
  "}",
  "",
  "Never return markdown.",
  "",
  "Never return explanations.",
  "",
  "Return only valid JSON.",
  "",
  "---",
  "",
  "## Rule 12 — Editing Memory",
  "",
  "Treat the current Resume JSON as the single source of truth.",
  "",
  "Every new prompt should modify the latest Resume JSON.",
  "",
  "Do not regenerate sections that were not requested.",
  "",
  "Every edit is cumulative.",
  "",
  "The resume should evolve over multiple user prompts exactly like a document editor.",
  "",
  "---",
  "",
  "## Examples",
  "",
  "User:",
  "Add DIVYA SAXENA as name",
  "",
  "→ Update only basics.name",
  "",
  "---",
  "",
  "User:",
  "Add Docker",
  "",
  "→ Append Docker to skills",
  "",
  "---",
  "",
  "User:",
  "Rewrite Mentorix project",
  "",
  "→ Modify only Mentorix project",
  "",
  "---",
  "",
  "User:",
  "Optimize for Google SWE Internship",
  "",
  "→ Rewrite summary, reorder skills, improve projects, update ATS keywords using only existing facts.",
  "",
  "---",
  "",
  "User:",
  "Delete Objective",
  "",
  "→ Remove objective section only.",
  "",
  "---",
  "",
  "User:",
  "One page ATS resume",
  "",
  "→ Compress formatting without losing facts.",
  "",
  "---",
  "",
  "User:",
  "Remove Java and add Go",
  "",
  "→ Delete Java",
  "→ Add Go",
  "→ Preserve everything else.",
].join("\n")

// ─── JSON Extraction Utility ────────────────────────────────────────────

/**
 * Clean the raw AI response before JSON parsing.
 * Removes markdown code fences, leading conversational text, and whitespace.
 */
function cleanRawResponse(raw: string): string {
  let cleaned = raw.trim()

  // Remove ```json ... ``` blocks (most common)
  const jsonCodeBlock = cleaned.match(/```(?:json|javascript|js)?\s*\n?([\s\S]*?)\n?```/i)
  if (jsonCodeBlock) {
    cleaned = jsonCodeBlock[1].trim()
  }

  // Remove `` ... `` blocks
  const backtickBlock = cleaned.match(/``([\s\S]*?)``/)
  if (backtickBlock) {
    cleaned = backtickBlock[1].trim()
  }

  // Remove leading conversational text before first {
  const firstBrace = cleaned.indexOf("{")
  if (firstBrace > 0) {
    // Only strip if there's text before the brace (like "Sure! Here is...")
    const prefix = cleaned.substring(0, firstBrace).trim()
    if (prefix && !prefix.startsWith("{")) {
      cleaned = cleaned.substring(firstBrace)
    }
  }

  // Remove trailing text after last }
  const lastBrace = cleaned.lastIndexOf("}")
  if (lastBrace > 0 && lastBrace < cleaned.length - 1) {
    const suffix = cleaned.substring(lastBrace + 1).trim()
    if (suffix) {
      cleaned = cleaned.substring(0, lastBrace + 1)
    }
  }

  return cleaned.trim()
}

function extractJson(raw: string): any {
  if (!raw || raw.trim().length === 0) {
    throw new SyntaxError("Empty AI response")
  }

  // Step 1: Clean the raw response
  const cleaned = cleanRawResponse(raw)

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

  // Direct parse of cleaned string
  let result = tryParse(cleaned)
  if (result !== null) return result

  // Find outermost JSON object
  const firstBrace = cleaned.indexOf("{")
  if (firstBrace !== -1) {
    let depth = 0
    let lastCompleteBrace = -1
    for (let i = firstBrace; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++
      else if (cleaned[i] === "}") {
        depth--
        if (depth === 0) { lastCompleteBrace = i; break }
      }
    }
    if (lastCompleteBrace > firstBrace) {
      result = tryParse(cleaned.substring(firstBrace, lastCompleteBrace + 1))
      if (result !== null) return result
    }
  }

  // Aggressive first { to last }
  const firstOpen = cleaned.indexOf("{")
  const lastClose = cleaned.lastIndexOf("}")
  if (firstOpen !== -1 && lastClose > firstOpen) {
    result = tryParse(cleaned.substring(firstOpen, lastClose + 1))
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
  const achievementsList: Achievement[] = data.achievements || (data.honors || []).map(h => ({ title: h } as Achievement))
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

// ─── Build User Prompt — unified V3 style ────────────────────────────────

function buildUserPrompt(
  mode: string,
  resumeData?: ResumeData,
  resumeText?: string,
  userPrompt?: string,
  jobDescription?: string
): string {
  const parts: string[] = []

  // Support both legacy explicit modes and V3 auto-detect
  const isLegacyMode = ["BUILD_NEW_RESUME", "IMPROVE_EXISTING_RESUME", "TAILOR_FOR_JOB_DESCRIPTION"].includes(mode)

  if (!isLegacyMode) {
    // V3 auto-detect mode: just provide all context and let AI figure it out
    parts.push("Auto-detect the user's intent (CREATE, EDIT, or TAILOR) from the prompt below.")
    parts.push("")
  }

  parts.push("USER PROMPT:")
  parts.push(userPrompt || resumeText || "")
  parts.push("")

  // Always provide existing resume if available
  if (resumeData) {
    parts.push("CURRENT RESUME JSON:")
    parts.push(JSON.stringify(resumeData, null, 2))
    parts.push("")
  } else if (resumeText && !isLegacyMode) {
    // If no structured resume but resume text was provided as user description
    parts.push("RESUME DESCRIPTION:")
    parts.push(resumeText)
    parts.push("")
  }

  // Job description for tailoring
  if (jobDescription) {
    parts.push("JOB DESCRIPTION:")
    parts.push(jobDescription)
    parts.push("")
  }

  // Explicit instructions based on legacy mode
  if (mode === "BUILD_NEW_RESUME") {
    parts.push("Generate a complete professional ATS-friendly resume.")
  } else if (mode === "IMPROVE_EXISTING_RESUME") {
    parts.push("Improve the existing resume based on the user's request. Preserve all existing facts.")
  } else if (mode === "TAILOR_FOR_JOB_DESCRIPTION") {
    parts.push("Tailor the existing resume for the provided job description to maximize ATS matching.")
  }

  parts.push("")
  parts.push("Return only valid JSON with format: { mode: string, changes: string[], resumeData: ResumeData, summary: string }")

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
    const { mode, resumeData, resumeText, userPrompt, jobDescription, noCache } = body

    // V3: Support both legacy explicit modes and auto-detect (mode not provided)
    const validModes = ["BUILD_NEW_RESUME", "IMPROVE_EXISTING_RESUME", "TAILOR_FOR_JOB_DESCRIPTION"]
    const isLegacyMode = mode && validModes.includes(mode)

    if (mode && !isLegacyMode) {
      // Invalid legacy mode — but user could be passing a V3 mode like "CREATE"/"EDIT"/"TAILOR"
      // We accept those as valid auto-detect hints
      if (!["CREATE", "EDIT", "TAILOR", "AUTO"].includes(mode)) {
        return NextResponse.json({ error: `Invalid mode: ${mode}. Accepts: BUILD_NEW_RESUME, IMPROVE_EXISTING_RESUME, TAILOR_FOR_JOB_DESCRIPTION, CREATE, EDIT, TAILOR, or omit for auto-detect.` }, { status: 400 })
      }
    }

    const hasResumeContent = !!(resumeData || resumeText)
    if (mode === "BUILD_NEW_RESUME" && !resumeText && !resumeData) {
      return NextResponse.json({ error: "resumeText (user description) is required for BUILD_NEW_RESUME mode" }, { status: 400 })
    }
    if (mode === "TAILOR_FOR_JOB_DESCRIPTION" && !jobDescription) {
      return NextResponse.json({ error: "jobDescription is required for TAILOR_FOR_JOB_DESCRIPTION mode" }, { status: 400 })
    }
    // For V3 auto-detect: require at least userPrompt
    if (!isLegacyMode && !userPrompt && !resumeText) {
      return NextResponse.json({ error: "userPrompt is required for auto-detect mode" }, { status: 400 })
    }

    const systemPrompt = RESUME_BUILDER_SYSTEM_PROMPT
    const userPromptText = buildUserPrompt(mode, resumeData, resumeText, userPrompt, jobDescription)

    // ── DEBUG LOG: Raw AI response ──────────────────────────────────
    console.log("\n════════════════════════════════════════════")
    console.log("[Resume Builder AI] MODE:", mode || "auto-detect")
    console.log("[Resume Builder AI] USER PROMPT:", (userPrompt || resumeText || "").substring(0, 200))
    console.log("[Resume Builder AI] HAS RESUME DATA:", !!resumeData)
    console.log("[Resume Builder AI] HAS JOB DESCRIPTION:", !!jobDescription)
    console.log("[Resume Builder AI] NO CACHE:", !!noCache)

    const aiResponse = await generateAIResponse({
      systemPrompt,
      userPrompt: userPromptText,
      temperature: 0.3,
      maxTokens: 4096,
      model: MODELS.GROQ_PRIMARY,
      feature: noCache ? `resume-builder-${Date.now()}` : "resume-builder",
      jsonMode: true,
    })

    // ── DEBUG LOG: Raw Groq response ────────────────────────────────
    console.log("[Resume Builder AI] RAW GROQ RESPONSE:", aiResponse.content)

    let aiOutput
    try {
      aiOutput = extractJson(aiResponse.content)
      // ── DEBUG LOG: Parsed JSON ──────────────────────────────────────
      console.log("[Resume Builder AI] PARSED JSON:", JSON.stringify(aiOutput, null, 2).substring(0, 2000))
      console.log("[Resume Builder AI] PARSED resumeData:", aiOutput ? (aiOutput.resumeData ? "PRESENT" : (aiOutput.resume ? "PRESENT (as resume)" : "MISSING")) : "NO OUTPUT")
      console.log("[Resume Builder AI] PARSED mode:", aiOutput?.mode)
      console.log("[Resume Builder AI] PARSED summary:", aiOutput?.summary?.substring(0, 200))
    } catch (parseErr) {
      console.error("[Resume Builder AI] Failed to parse AI response:", parseErr)
      console.log("[Resume Builder AI] RAW CONTENT THAT FAILED PARSING:", aiResponse.content)
      // Retry with stronger JSON instruction
      const retryResponse = await generateAIResponse({
        systemPrompt,
        userPrompt: `${userPromptText}\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY valid JSON. No markdown, no code fences, no extra text.`,
        temperature: 0.1,
        maxTokens: 4096,
        model: MODELS.GROQ_PRIMARY,
        feature: `resume-builder-retry-${Date.now()}`,
        jsonMode: true,
      })
      try {
        aiOutput = extractJson(retryResponse.content)
        console.log("[Resume Builder AI] RETRY PARSED:", JSON.stringify(aiOutput, null, 2).substring(0, 2000))
      } catch (retryErr) {
        console.error("[Resume Builder AI] RETRY ALSO FAILED:", retryErr)
        console.log("[Resume Builder AI] RETRY RAW:", retryResponse.content)
        return NextResponse.json({ error: "AI returned invalid JSON after retry" }, { status: 500 })
      }
    }

    // ── Validate Response Structure ────────────────────────────────
    const resolvedResumeData = aiOutput.resumeData || aiOutput.resume || null
    if (!resolvedResumeData) {
      console.error("[Resume Builder AI] VALIDATION FAILED: resumeData is missing in AI output")
      console.log("[Resume Builder AI] AI OUTPUT KEYS:", Object.keys(aiOutput))
    } else if (!resolvedResumeData.personalInfo) {
      console.error("[Resume Builder AI] VALIDATION FAILED: personalInfo is missing in resumeData")
      console.log("[Resume Builder AI] resumeData KEYS:", Object.keys(resolvedResumeData))
    } else if (!resolvedResumeData.sectionOrder) {
      console.warn("[Resume Builder AI] VALIDATION WARNING: sectionOrder missing, will use default")
      resolvedResumeData.sectionOrder = []
    } else {
      console.log("[Resume Builder AI] VALIDATION PASSED: resumeData has required fields")
    }

    // Normalize output to V3 format
    const v3Output = {
      mode: aiOutput.mode || (isLegacyMode ? mode.toLowerCase().replace(/^BUILD_NEW_/i, "").replace(/_/g, " ") : "edit"),
      changes: aiOutput.changes || aiOutput.changesMade?.map((c: any) => `${c.section}: ${c.reason || c.after}`) || [],
      resumeData: aiOutput.resumeData || aiOutput.resume || null,
      summary: aiOutput.summary || aiOutput.atsImprovement || "",
      // Preserve legacy fields for backward compat
      ...(aiOutput.changesMade && { changesMade: aiOutput.changesMade }),
      ...(aiOutput.atsBefore != null && { atsBefore: aiOutput.atsBefore }),
      ...(aiOutput.atsAfter != null && { atsAfter: aiOutput.atsAfter }),
      ...(aiOutput.matchedKeywords && { matchedKeywords: aiOutput.matchedKeywords }),
      ...(aiOutput.missingKeywords && { missingKeywords: aiOutput.missingKeywords }),
      ...(aiOutput.recruiterFeedback && { recruiterFeedback: aiOutput.recruiterFeedback }),
      ...(aiOutput.atsScore != null && { atsScore: aiOutput.atsScore }),
      ...(aiOutput.atsImprovement && { atsImprovement: aiOutput.atsImprovement }),
      ...(aiOutput.updatedResume && { updatedResume: aiOutput.updatedResume }),
      ...(aiOutput.strengths && { strengths: aiOutput.strengths }),
      ...(aiOutput.resume && { resume: aiOutput.resume }),
      ...(aiOutput.improvements && { improvements: aiOutput.improvements }),
    }

    return NextResponse.json(v3Output)

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
