/**
 * lib/ai/prompt-compressor.ts
 *
 * Automatic prompt compression when token count exceeds provider limits.
 * Compresses verbose sections while preserving key information.
 */

/**
 * Compress a job description to reduce token count.
 * Keeps: role name, company, key requirements, key qualifications.
 * Removes: company boilerplate, repeated phrases, generic paragraphs.
 */
export function compressJobDescription(jd: string, maxTokens: number = 500): string {
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
      .slice(0, 8);
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
      .slice(0, 5);
    sections.push(`Responsibilities: ${resp.join("; ")}`);
  }

  // Extract tech stack / skills
  const techMatch = jd.match(
    /(?:Technologies?|Tech stack|Skills|Tools|Stack)[:\s]*([\s\S]*?)(?=\n\s*(?:Requirements?|Responsibilities?|About|Benefits?|$))/i
  );
  if (techMatch) {
    sections.push(`Tech: ${techMatch[1].trim().substring(0, 300)}`);
  }

  // If nothing was extracted, use first 500 chars
  if (sections.length === 0) {
    return jd.substring(0, 500) + "...";
  }

  return sections.join("\n");
}

/**
 * Compress project descriptions while keeping technologies and outcomes.
 */
export function compressProjectDescription(description: string, maxTokens: number = 100): string {
  if (!description || description.length / 4 <= maxTokens) return description;

  // Keep: technologies, metrics, outcomes
  // Remove: narrative fluff
  const keep: string[] = [];

  const techMatch = description.match(
    /(?:using|built with|tech|technologies?|stack)[:\s]*([^.]*)/i
  );
  if (techMatch) keep.push(`Tech: ${techMatch[1].trim()}`);

  const outcomeMatch = description.match(
    /(?:achieved|resulted|improved|reduced|increased|handled|served|processed)[^.]*\./gi
  );
  if (outcomeMatch) {
    keep.push(...outcomeMatch.slice(0, 2).map((m) => m.trim()));
  }

  if (keep.length === 0) {
    return description.substring(0, 200) + "...";
  }

  return keep.join(" | ");
}

/**
 * Compress experience descriptions while keeping role, company, and outcomes.
 */
export function compressExperienceDescription(description: string, maxTokens: number = 80): string {
  if (!description || description.length / 4 <= maxTokens) return description;

  // Keep: metrics, technologies, achievements
  const keep: string[] = [];

  const metricMatch = description.match(
    /(?:built|developed|created|designed|implemented|led|managed|improved|reduced|achieved)[^.]*\./gi
  );
  if (metricMatch) {
    keep.push(...metricMatch.slice(0, 2).map((m) => m.trim()));
  }

  if (keep.length === 0) {
    return description.substring(0, 150) + "...";
  }

  return keep.join(" | ");
}

/**
 * Compress a full resume's description texts to reduce token count.
 * Only compresses if the total exceeds the specified budget.
 */
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
    const compressedJD = compressJobDescription(data.jobDescription, Math.floor(tokenBudget * 0.3));
    const saved = estimateTokens(data.jobDescription) - estimateTokens(compressedJD);
    result.jobDescription = compressedJD;
    reduced += saved;
  }

  // 2. Compress experience descriptions next
  if (reduced < reductionNeeded && data.experienceDescriptions.length > 0) {
    result.experienceDescriptions = data.experienceDescriptions.map((d, i) => {
      if (reduced >= reductionNeeded) return d;
      const before = estimateTokens(d);
      const compressed = compressExperienceDescription(d);
      const after = estimateTokens(compressed);
      reduced += before - after;
      return compressed;
    });
  }

  // 3. Compress project descriptions last
  if (reduced < reductionNeeded && data.projectDescriptions.length > 0) {
    result.projectDescriptions = data.projectDescriptions.map((d, i) => {
      if (reduced >= reductionNeeded) return d;
      const before = estimateTokens(d);
      const compressed = compressProjectDescription(d);
      const after = estimateTokens(compressed);
      reduced += before - after;
      return compressed;
    });
  }

  // 4. Compress summary as last resort
  if (reduced < reductionNeeded && data.summary && data.summary.length > 100) {
    result.summary = data.summary.substring(0, 100) + "...";
  }

  return result;
}
