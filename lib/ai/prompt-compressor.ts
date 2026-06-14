/**
 * lib/ai/prompt-compressor.ts
 *
 * Automatic prompt compression when token count exceeds provider limits.
 * Compresses verbose sections while preserving key information.
 */

// ─── System Prompt Compression ─────────────────────────────────────────

/**
 * Compress the analysis system prompt by removing verbose examples and
 * redundant instructions while keeping the core structure and output schema.
 *
 * The full system prompt is very long due to extensive examples and scoring
 * calibration tables. This function preserves the essential phases, rules,
 * and the output JSON schema, but strips verbose examples and redundant
 * explanations.
 */
export function compressSystemPrompt(fullPrompt: string): string {
  if (!fullPrompt) return fullPrompt;

  // Strategy: Keep everything before the OUTPUT JSON SCHEMA line,
  // but reduce verbose sections within the analysis protocol.

  // Find the OUTPUT JSON SCHEMA section — that's essential and must be kept.
  const schemaMarker = "OUTPUT JSON SCHEMA";
  const schemaIndex = fullPrompt.indexOf(schemaMarker);

  if (schemaIndex === -1) return fullPrompt; // Can't find schema, leave as-is

  const protocolSection = fullPrompt.substring(0, schemaIndex);
  const schemaSection = fullPrompt.substring(schemaIndex);

  // Compress the protocol section:
  // 1. Remove the "REAL PROJECT EXAMPLES" block
  // 2. Remove verbose scoring calibration (PHASE 7) preserving just the summary
  // 3. Keep phase headers and key rules
  let compressedProtocol = protocolSection;

  // Remove the REAL PROJECT EXAMPLES block
  compressedProtocol = compressedProtocol.replace(
    /REAL PROJECT EXAMPLES:[\s\S]*?(?=\n\[PHASE 3\])/,
    ""
  );

  // Trim verbose scoring calibration — keep only overall resume scoring
  compressedProtocol = compressedProtocol.replace(
    /PROJECT SCORING:[\s\S]*?GPA scoring:[^\n]*/,
    "SCORING: Map project scores 0-100 based on complexity and quality. Map experience scores 0-100 based on relevance and impact. Overall resume: 90+ FAANG-ready, 80-89 strong, 70-79 good, 60-69 average, <60 needs work. GPA: 9.0+/10 → 85+, 8.0+/10 → 75+, 7.0+/10 → 65+."
  );

  // Remove the BAD/GOOD examples from PHASE 6, keep just the instruction
  compressedProtocol = compressedProtocol.replace(
    /BAD \(generic\):[\s\S]*?actual stack\./,
    "Your advice must cite specific technologies, tools, and enhancements relevant to the candidate's actual stack. Never give generic advice like 'improve your skills' or 'build more projects'."
  );

  // Remove redundant SCORING CALIBRATION example list
  compressedProtocol = compressedProtocol.replace(
    /SCORING CALIBRATION:[\s\S]*?(?=\[PHASE 5\])/,
    "SCORING CALIBRATION: Value research internships at top institutes at 85-95. SWE internships at 85-95. TA/grader at 65-75. Non-technical at 40-60.\n\n"
  );

  return compressedProtocol + "\n" + schemaSection;
}

// ─── Individual Description Compressors ────────────────────────────────

/**
 * Compress a job description to reduce token count.
 * Keeps: role name, company, key requirements, key qualifications.
 * Removes: company boilerplate, repeated phrases, generic paragraphs.
 */
export function compressJobDescription(jd: string, maxTokens: number = 300): string {
  if (!jd || jd.length / 4 <= maxTokens) return jd;

  // Extract key parts using common JD section markers
  const sections: string[] = [];

  // Extract job title (usually first line)
  const titleMatch = jd.match(/^(.+)/m);
  if (titleMatch) sections.push(`Role: ${titleMatch[1].trim()}`);

  // Extract requirements / qualifications
  const reqMatch = jd.match(
    /(?:Requirements?|Qualifications?|You have|You'll need|What you.*need|Must have)[:\s]*([\s\S]*?)(?=\n\s*(?:Benefits?|About|Nice to have|Bonus|Why join|Apply|$))/i
  );
  if (reqMatch) {
    const reqs = reqMatch[1]
      .split("\n")
      .map((l) => l.trim().replace(/^[•\-*#]+\s*/, ""))
      .filter((l) => l.length > 3)
      .slice(0, 6);
    sections.push(`Requirements: ${reqs.join("; ")}`);
  }

  // Extract responsibilities
  const respMatch = jd.match(
    /(?:Responsibilities?|What you'll do|Key responsibilities|Role.*responsibilities)[:\s]*([\s\S]*?)(?=\n\s*(?:Requirements?|Qualifications?|Benefits?|About|$))/i
  );
  if (respMatch) {
    const resp = respMatch[1]
      .split("\n")
      .map((l) => l.trim().replace(/^[•\-*#]+\s*/, ""))
      .filter((l) => l.length > 3)
      .slice(0, 4);
    sections.push(`Responsibilities: ${resp.join("; ")}`);
  }

  // Extract tech stack / skills
  const techMatch = jd.match(
    /(?:Technologies?|Tech stack|Skills|Tools|Stack)[:\s]*([\s\S]*?)(?=\n\s*(?:Requirements?|Responsibilities?|About|Benefits?|$))/i
  );
  if (techMatch) {
    sections.push(`Tech: ${techMatch[1].trim().substring(0, 200)}`);
  }

  // If nothing was extracted, use first 300 chars
  if (sections.length === 0) {
    return jd.substring(0, 300) + "...";
  }

  return sections.join("\n");
}

/**
 * Compress project descriptions while keeping technologies and outcomes.
 */
export function compressProjectDescription(description: string, maxTokens: number = 80): string {
  if (!description || description.length / 4 <= maxTokens) return description;

  // Keep: technologies, metrics, outcomes — remove narrative fluff
  const keep: string[] = [];

  const techMatch = description.match(
    /(?:using|built with|tech|technologies?|stack)[:\s]*([^.]*)/i
  );
  if (techMatch) keep.push(`Tech: ${techMatch[1].trim().substring(0, 150)}`);

  const outcomeMatch = description.match(
    /(?:achieved|resulted|improved|reduced|increased|handled|served|processed)[^.]*\./gi
  );
  if (outcomeMatch) {
    keep.push(...outcomeMatch.slice(0, 1).map((m) => m.trim()));
  }

  if (keep.length === 0) {
    return description.substring(0, 150) + "...";
  }

  return keep.join(" | ");
}

/**
 * Compress experience descriptions while keeping role, company, and outcomes.
 */
export function compressExperienceDescription(description: string, maxTokens: number = 60): string {
  if (!description || description.length / 4 <= maxTokens) return description;

  // Keep: metrics, technologies, achievements
  const keep: string[] = [];

  const metricMatch = description.match(
    /(?:built|developed|created|designed|implemented|led|managed|improved|reduced|achieved)[^.]*\./gi
  );
  if (metricMatch) {
    keep.push(...metricMatch.slice(0, 1).map((m) => m.trim()));
  }

  if (keep.length === 0) {
    return description.substring(0, 100) + "...";
  }

  return keep.join(" | ");
}

// ─── Full Resume Auto-Compression ──────────────────────────────────────

export interface CompressibleResumeData {
  summary?: string;
  projectDescriptions: string[];
  experienceDescriptions: string[];
  jobDescription?: string;
}

/**
 * Analyze the prompt and automatically compress if it exceeds limits.
 * Returns the compressed versions of inputs.
 */
export function autoCompress(
  data: CompressibleResumeData,
  tokenBudget: number
): CompressibleResumeData {
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);
  const currentTotal = [
    data.summary || "",
    ...data.projectDescriptions,
    ...data.experienceDescriptions,
    data.jobDescription || "",
  ].reduce((sum, t) => sum + estimateTokens(t), 0);

  if (currentTotal <= tokenBudget) return data; // no compression needed

  const result = { ...data };
  const reductionNeeded = currentTotal - tokenBudget;
  let reduced = 0;

  // 1. Compress job description first (usually the largest)
  if (data.jobDescription) {
    const compressedJD = compressJobDescription(data.jobDescription, Math.floor(tokenBudget * 0.25));
    const saved = estimateTokens(data.jobDescription) - estimateTokens(compressedJD);
    result.jobDescription = compressedJD;
    reduced += saved;
  }

  // 2. Compress experience descriptions next
  if (reduced < reductionNeeded && data.experienceDescriptions.length > 0) {
    result.experienceDescriptions = data.experienceDescriptions.map((d) => {
      const before = estimateTokens(d);
      const compressed = compressExperienceDescription(d);
      const after = estimateTokens(compressed);
      reduced += before - after;
      return compressed;
    });
  }

  // 3. Compress project descriptions last
  if (reduced < reductionNeeded && data.projectDescriptions.length > 0) {
    result.projectDescriptions = data.projectDescriptions.map((d) => {
      const before = estimateTokens(d);
      const compressed = compressProjectDescription(d);
      const after = estimateTokens(compressed);
      reduced += before - after;
      return compressed;
    });
  }

  // 4. Compress summary as last resort
  if (reduced < reductionNeeded && data.summary && data.summary.length > 80) {
    result.summary = data.summary.substring(0, 80) + "...";
  }

  return result;
}
