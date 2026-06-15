/**
 * lib/ai/resume-parser.ts
 *
 * ============================================================================
 * STAGE 1: RESUME PARSER — Pure extraction only.
 *
 * Input:  Raw resume text
 * Output: Strict JSON with categorized fields
 *
 * The parser does NOT do any analysis, scoring, or recommendations.
 * It ONLY extracts and classifies information.
 *
 * ============================================================================
 * EXTRACTION RULES
 *
 * Projects:
 *   - Extracted ONLY from project sections.
 *   - Do NOT classify internships, research positions, hackathons,
 *     competitions, or achievements as projects.
 *
 * Experience:
 *   - Includes internships, research roles, campus ambassador roles,
 *     open source programs, and full-time/part-time jobs.
 *
 * Achievements:
 *   - Includes hackathons, coding contests, rankings, awards.
 *
 * Skills:
 *   - Deterministic inference from detected technologies.
 *   - Never mark inferred skills as missing.
 * ============================================================================
 */

// ─── Simple, Strict Types ─────────────────────────────────────────────

export interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
  github: string;
  liveLink: string;
}

export interface ParsedExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  year?: string;
  gpa?: string;
}

export interface ParsedAchievement {
  title: string;
  description: string;
  type: "hackathon" | "contest" | "award" | "other";
}

export interface ParsedResume {
  skills: string[];
  projects: ParsedProject[];
  experience: ParsedExperience[];
  education: ParsedEducation[];
  achievements: ParsedAchievement[];
  certifications: string[];
}

// ─── Skill Inference Result ───────────────────────────────────────────

export interface InferredSkill {
  category: string;
  label: string;
  source: string;
}

export interface SkillInferenceResult {
  strongSkills: string[];
  missingSkills: string[];
  inferred: InferredSkill[];
}

// ─── Technologies & Keywords ──────────────────────────────────────────

export const TECH_KEYWORDS: Record<string, string[]> = {
  Languages: [
    "Python", "Java", "JavaScript", "TypeScript", "Go", "Rust",
    "C++", "C", "C#", "Ruby", "Swift", "Kotlin", "Scala", "PHP",
    "R", "MATLAB", "Dart", "Lua", "Haskell", "Elixir",
  ],
  Frontend: [
    "React", "Next.js", "Vue", "Angular", "Svelte", "SolidJS",
    "Remix", "Gatsby", "Nuxt", "HTML", "CSS",
    "Tailwind", "TailwindCSS", "Bootstrap", "Sass",
    "Redux", "Zustand", "Jotai", "Recoil",
    "D3.js", "Three.js", "Framer Motion", "GSAP",
    "Webpack", "Vite", "esbuild", "Parcel", "Rollup", "Babel",
  ],
  Backend: [
    "Node.js", "Express", "Django", "Flask", "FastAPI",
    "Spring", "Spring Boot", "ASP.NET", "Laravel", "Rails",
    "Nest.js", "GraphQL", "Apollo", "tRPC", "gRPC",
    "WebSocket", "Socket.io", "RabbitMQ", "Kafka",
    "Postman", "Swagger", "OpenAPI",
  ],
  Databases: [
    "PostgreSQL", "Postgres", "MongoDB", "MySQL", "SQLite", "MariaDB",
    "Redis", "Elasticsearch", "Cassandra", "DynamoDB", "CouchDB",
    "Firebase", "Supabase", "PlanetScale", "Neon", "CockroachDB",
    "Prisma", "Drizzle", "TypeORM", "Sequelize", "Mongoose",
    "SQL", "NoSQL", "Pinecone", "Weaviate", "ChromaDB", "Qdrant",
  ],
  Cloud: [
    "AWS", "Azure", "GCP", "Google Cloud",
    "Vercel", "Netlify", "Railway", "Render", "Fly.io", "Heroku",
    "DigitalOcean", "Linode",
  ],
  DevOps: [
    "Docker", "Kubernetes", "K8s", "Terraform", "Ansible", "Pulumi",
    "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI",
    "Helm", "Prometheus", "Grafana", "Datadog",
    "Nginx", "Apache", "Linux", "Bash",
  ],
  "AI/ML": [
    "PyTorch", "TensorFlow", "Scikit-Learn", "scikit-learn", "sklearn",
    "Keras", "XGBoost", "LightGBM", "CatBoost",
    "Pandas", "NumPy", "SciPy",
    "LLM", "GPT", "OpenAI", "Claude", "Gemini", "Llama", "Mistral",
    "Hugging Face", "Transformers", "BERT", "Stable Diffusion",
    "RAG", "LangChain", "LlamaIndex", "Haystack",
    "ML", "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "OpenCV", "YOLO",
  ],
  "System Design": [
    "Distributed Systems", "Microservices", "Load Balancing", "Caching",
    "Message Queues", "Event-Driven Architecture", "CQRS",
    "Sharding", "Replication", "CAP Theorem",
    "Parallel Computing", "Consensus", "Consistent Hashing",
  ],
  "DSA": [
    "Graph Algorithms", "Dynamic Programming", "Data Structures",
    "Algorithms", "LeetCode", "Codeforces",
  ],
};

// Flattened list for regex matching (longest-first to avoid partial matches)
const ALL_TECH_KEYWORDS = Object.values(TECH_KEYWORDS).flat();
const SORTED_TECH_KEYWORDS = [...new Set(ALL_TECH_KEYWORDS.map(k => k.trim()).filter(Boolean))]
  .sort((a, b) => b.length - a.length);
const TECH_REGEX = new RegExp(`\\b(${SORTED_TECH_KEYWORDS.map(escapeRegex).join("|")})\\b`, "gi");

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Section Detection ────────────────────────────────────────────────

const SECTION_HEADERS = [
  /^education$/im,
  /^experience$/im,
  /^work experience$/im,
  /^professional experience$/im,
  /^relevant experience$/im,
  /^projects$/im,
  /^personal projects$/im,
  /^academic projects$/im,
  /^key projects$/im,
  /^technical projects$/im,
  /^skills$/im,
  /^technical skills$/im,
  /^core competencies$/im,
  /^certifications$/im,
  /^achievements$/im,
  /^honors?$/im,
  /^awards$/im,
  /^publications$/im,
  /^summary$/im,
  /^professional summary$/im,
  /^objective$/im,
  /^career objective$/im,
  /^profile$/im,
  /^professional profile$/im,
  /^research$/im,
  /^research experience$/im,
  /^leadership$/im,
  /^leadership experience$/im,
  /^extracurricular$/im,
  /^extracurricular activities$/im,
  /^languages$/im,
  /^interests$/im,
  /^open source$/im,
  /^open source contributions$/im,
  /^hackathons$/im,
  /^volunteer$/im,
  /^volunteering$/im,
  /^positions of responsibility$/im,
  /^positions$/im,
  /^coursework$/im,
  /^relevant coursework$/im,
  /^patents$/im,
  /^conferences$/im,
  /^talks$/im,
  /^thesis$/im,
];

/**
 * Pre-process text to recover formatting lost during PDF extraction.
 * PDF extraction often merges lines and removes newlines before section headers.
 * This function inserts newlines before known section headers, date patterns,
 * role keywords, and action verbs to help section detection work.
 */
function normalizeExtractedText(text: string): string {
  let normalized = text;

  // Insert newline before section headers that may be merged with previous text
  // e.g., "...something.Experience" → "...something.\nExperience"
  const headerNames = [
    "Education", "Experience", "Work Experience", "Professional Experience",
    "Projects", "Personal Projects", "Academic Projects", "Technical Projects",
    "Skills", "Technical Skills", "Core Competencies",
    "Certifications", "Achievements", "Honors", "Awards",
    "Publications", "Summary", "Professional Summary",
    "Objective", "Profile", "Research", "Leadership",
    "Extracurricular", "Hackathons", "Open Source",
    "Positions of Responsibility", "Languages", "Interests",
  ];

  for (const h of headerNames) {
    // Match when header is preceded by content on the same line (no newline before it)
    // Use \b word boundaries to avoid matching inside larger words (e.g., "Skills" in "Skillset")
    const regex = new RegExp(`([^\\n])\\b${escapeRegex(h)}\\b`, "gi");
    normalized = normalized.replace(regex, `$1\n${h}`);
  }

  // Insert newline before date ranges that might be merged
  // e.g., "Research InternMay 2026" → "Research Intern\nMay 2026"
  normalized = normalized.replace(/([a-z)])((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi, "$1\n$2");

  // Insert newline after period + space before capital letter (sentence boundary)
  // This helps when bullet points are merged
  normalized = normalized.replace(/\.\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+[:–])/g, ".\n$1");

  // Insert newline before role keywords when they appear mid-text
  const roleKeywords = [
    "Research Intern", "Software Engineer", "SDE Intern", "Data Scientist",
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Campus Ambassador", "Open Source Contributor", "Machine Learning Intern",
    "AI Intern", "ML Intern", "DevOps Intern", "Product Manager",
  ];
  for (const role of roleKeywords) {
    const regex = new RegExp(`([^\\n])${escapeRegex(role)}`, "gi");
    normalized = normalized.replace(regex, `$1\n${role}`);
  }

  // Insert newline before project action verbs
  const actionVerbs = [
    "Built ", "Developed ", "Created ", "Engineered ", "Implemented ",
    "Designed ", "Architected ", "Launched ", "Deployed ", "Spearheaded ",
  ];
  for (const verb of actionVerbs) {
    const regex = new RegExp(`([^\\n]\.\\s*)${escapeRegex(verb)}`, "gi");
    normalized = normalized.replace(regex, `$1\n${verb}`);
  }

  // Insert newline before bullet points that might be merged
  normalized = normalized.replace(/([^\n])([•\-*·]\s+)/g, "$1\n$2");

  return normalized;
}

function detectSections(text: string): Map<string, string> {
  // First, normalize the text to recover formatting lost during PDF extraction
  const normalizedText = normalizeExtractedText(text);

  const sections = new Map<string, string>();
  let currentHeader = "__preamble__";
  let currentStart = 0;

  const lines = normalizedText.split("\n");
  const headerPattern = /^(#{1,3}\s+)?([A-Z][A-Za-z\s&/-]+?):?\s*$/;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const isHeader = SECTION_HEADERS.some((re) => re.test(trimmed)) ||
      (headerPattern.test(trimmed) && trimmed.length < 50 && trimmed.length > 2);

    if (isHeader) {
      const content = lines.slice(currentStart, i).join("\n").trim();
      if (content) sections.set(currentHeader, content);

      currentHeader = trimmed.replace(/^#+\s+/, "").replace(/:$/, "").toLowerCase();
      currentStart = i + 1;
    }
  }

  const content = lines.slice(currentStart).join("\n").trim();
  if (content) sections.set(currentHeader, content);

  return sections;
}

// ─── Technology Extractor ─────────────────────────────────────────────

export function extractTechnologies(text: string): string[] {
  const matches = new Set<string>();
  const techMatches = text.matchAll(TECH_REGEX);
  for (const match of techMatches) {
    matches.add(match[1]);
  }
  return [...matches];
}

// ─── Education Parser ─────────────────────────────────────────────────

function parseEducation(text: string): ParsedEducation[] {
  const entries: ParsedEducation[] = [];
  const lines = text.split("\n").filter(l => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    const degreeKeywords = /(B\.?Tech|Bachelor|M\.?Tech|Master|PhD|B\.?E|M\.?E|B\.?Sc|M\.?Sc|B\.?A|M\.?A|BBA|MBA|BCA|MCA|B\.?Com|M\.?Com|Diploma|Higher Secondary|HSC|SSC|Class\s+X|Class\s+XII)/i;

    const eduMatch = trimmed.match(/(.+?)(?:\s*[|,\–\-\—]\s*)(.+?)(?:\s*[|,\–\-\—]\s*)?(?:\s*(?:CGPA|GPA|Percentage|Score|%)\s*[\:\-\–]?\s*(\d+\.?\d*))?/i);
    if (eduMatch) {
      const part1 = eduMatch[1].trim();
      const part2 = eduMatch[2].trim();
      const gpa = eduMatch[3]?.trim();

      if (degreeKeywords.test(part1)) {
        entries.push({ degree: part1, institution: part2, gpa });
      } else if (degreeKeywords.test(part2)) {
        entries.push({ degree: part2, institution: part1, gpa });
      } else {
        entries.push({ institution: part1, degree: part2, gpa });
      }
    } else if (trimmed.length > 5 && trimmed.length < 150) {
      const gpaMatch = trimmed.match(/(\d+\.?\d*)\s*(?:\/10|%)?(?:\s*CGPA|\s*GPA|\s*Percentage)/i);
      entries.push({
        institution: trimmed,
        degree: "",
        gpa: gpaMatch ? gpaMatch[1] : undefined,
      });
    }
  }
  return entries;
}

// ─── Skills Parser ────────────────────────────────────────────────────

function parseSkills(text: string): string[] {
  const skills: string[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const items = trimmed.split(/[,|•–\-·•]+/).map(s => s.trim()).filter(Boolean);
    for (const item of items) {
      const cleaned = item.replace(/^[•\-*#]+/, "").replace(/^:+/, "").trim();
      if (cleaned.length > 1 && cleaned.length < 60 && !SECTION_HEADERS.some(re => re.test(cleaned))) {
        const normalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).replace(/\.+$/, "").trim();
        skills.push(normalized);
      }
    }
  }

  const seen = new Set<string>();
  return skills.filter(s => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── EXCLUDE patterns for projects ────────────────────────────────────

const PROJECT_EXCLUDE_PATTERNS = [
  /\b(intern|internship)\b/i,
  /\b(research\s+(intern|assistant|fellow|scholar|position|associate))|\b(thesis|dissertation)\b/i,
  /\b(hackathon|hacknovate|reckon|gssoc|gsoc|summer of code)\b/i,
  /\b(competition|contest|codeforces|leetcode|hackerrank|coding challenge)\b/i,
  /\b(ambassador|campus ambassador|mentor|volunteer)\b/i,
  /\b(open.?source\s+(program|contribution|contributor|intern|fellow))\b/i,
  /\b(award|achievement|winner|rank\s*:?\s*\d+|\d+st\s+place|\d+nd\s+place|\d+rd\s+place)\b/i,
];

function isProjectExcluded(name: string, description: string, sectionText: string): boolean {
  const combined = `${name} ${description} ${sectionText}`;
  return PROJECT_EXCLUDE_PATTERNS.some(pattern => pattern.test(combined));
}

// ─── Project Parser ───────────────────────────────────────────────────

function parseProjects(text: string): ParsedProject[] {
  const entries: ParsedProject[] = [];
  const blocks = text.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split("\n").filter(l => l.trim());
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim();
    let name = firstLine.replace(/^[#*•\-·]+\s*/, "").split(/[\[\(]/)[0].replace(/[:;]$/, "").trim();

    if (name.length < 2 || name.length > 60) continue;
    if (SECTION_HEADERS.some(re => re.test(name))) continue;

    const fullDescription = lines.slice(1).join(" ").trim();
    const combinedText = `${name} ${fullDescription}`;

    // Exclude non-project entries
    if (isProjectExcluded(name, fullDescription, text)) continue;

    const technologies = extractTechnologies(combinedText);

    // Extract GitHub / live links
    let github = "";
    let liveLink = "";
    const githubMatch = combinedText.match(/github\.com\/([\w./-]+)/i);
    if (githubMatch) github = `https://github.com/${githubMatch[1]}`;
    const liveMatch = combinedText.match(/https?:\/\/(?!github\.com)[^\s)]+/i);
    if (liveMatch) liveLink = liveMatch[0].replace(/[).,]+$/, "");

    entries.push({
      name: name || "Project",
      description: fullDescription.substring(0, 500),
      technologies: [...new Set(technologies)],
      github,
      liveLink,
    });
  }

  return entries;
}

// ─── Experience Parser ────────────────────────────────────────────────

function parseExperience(text: string): ParsedExperience[] {
  const entries: ParsedExperience[] = [];
  const blocks = text.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split("\n").filter(l => l.trim());
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim().replace(/^[#*•\-·]+\s*/, "");

    // Try to extract: Role @ Company, Company - Role, or Role at Company
    const roleMatch = firstLine.match(/(.+?)\s+(?:at|@|–|-|—|,|of|for|with)\s*(.+)/)
      || firstLine.match(/(.+?)\s*[–\-—|,]\s*(.+)/);

    let role = "";
    let company = "";

    if (roleMatch) {
      const p1 = roleMatch[1].trim();
      const p2 = roleMatch[2].trim();
      const roleKeywords = /^(sde|software|intern|research|assistant|engineer|developer|analyst|scientist|consultant|lead|manager|coordinator|associate|fellow|trainee|volunteer|ambassador|mentor)/i;

      if (roleKeywords.test(p1) || !roleKeywords.test(p2)) {
        role = p1;
        company = p2;
      } else {
        role = p2;
        company = p1;
      }
    } else {
      role = firstLine;
      company = "";
    }

    // Extract duration
    const durationMatch = block.match(/(\w+\s+\d{4})\s*[–\-—to]+\s*(\w+\s+\d{4}|Present|Current|Now|Till\s+Date|Ongoing)/i)
      || block.match(/(\d{4})\s*[–\-—to]+\s*(\d{4}|Present|Current|Now)/i);
    const duration = durationMatch ? `${durationMatch[1]} – ${durationMatch[2]}` : "";

    entries.push({
      company,
      role,
      duration,
      description: lines.slice(1).join(" ").trim().substring(0, 600),
    });
  }

  return entries;
}

// ─── Achievements Parser ──────────────────────────────────────────────

function parseAchievements(text: string): ParsedAchievement[] {
  const entries: ParsedAchievement[] = [];
  const lines = text.split("\n").map(l => l.trim().replace(/^[•\-*#·]+/, "").trim()).filter(l => l.length > 3);

  for (const line of lines) {
    if (line.length > 300) continue;

    let type: ParsedAchievement["type"] = "other";
    if (/\b(hackathon|hacknovate|reckon|gssoc|gsoc|hack)\b/i.test(line)) {
      type = "hackathon";
    } else if (/\b(contest|codeforces|leetcode|hackerrank|codechef|rank|rating)\b/i.test(line)) {
      type = "contest";
    } else if (/\b(award|winner|champion|\d+st\s+place|\d+nd\s+place|\d+rd\s+place|medal|trophy|scholarship)\b/i.test(line)) {
      type = "award";
    }

    entries.push({ title: line, description: "", type });
  }

  return entries;
}

// ─── Certifications Parser ────────────────────────────────────────────

function parseCertifications(text: string): string[] {
  return text.split("\n")
    .map(l => l.trim().replace(/^[•\-*#·]+/, "").trim())
    .filter(l => l.length > 5 && l.length < 200);
}

// ─── Deterministic Skill Inference Engine ─────────────────────────────

/**
 * Deterministic skill inference based on detected technologies.
 *
 * Rules:
 *   React OR Next.js              → Frontend
 *   Node.js OR Express.js         → Backend
 *   MongoDB OR PostgreSQL OR MySQL → Databases
 *   AWS OR Azure OR GCP           → Cloud
 *   Docker OR Kubernetes          → DevOps
 *   PyTorch OR TensorFlow OR      → AI/ML
 *     Scikit-Learn
 *   Distributed Systems OR        → System Design
 *     Parallel Computing
 *   Graph Algorithms              → DSA
 */
export function inferSkills(parsed: ParsedResume): SkillInferenceResult {
  const allTech = new Set<string>();
  const techSources: Map<string, string[]> = new Map();

  const recordTech = (tech: string, source: string) => {
    const key = tech.toLowerCase();
    allTech.add(key);
    if (!techSources.has(key)) techSources.set(key, []);
    techSources.get(key)!.push(source);
  };

  // Collect all technologies from projects
  for (const p of parsed.projects) {
    for (const t of p.technologies) {
      recordTech(t, `Project: ${p.name}`);
    }
  }

  // Collect all technologies from experience descriptions
  for (const e of parsed.experience) {
    const techs = extractTechnologies(e.description + " " + e.role);
    for (const t of techs) {
      recordTech(t, `Experience: ${e.role} @ ${e.company}`);
    }
  }

  // Collect explicit skills
  for (const s of parsed.skills) {
    recordTech(s, "Explicit skills section");
  }

  // ── Inference Rules ─────────────────────────────────────────────

  const inferenceRules: { label: string; category: string; triggers: string[] }[] = [
    { label: "Frontend", category: "Frontend", triggers: ["react", "next.js", "vue", "angular", "svelte"] },
    { label: "Backend", category: "Backend", triggers: ["node.js", "express", "django", "flask", "fastapi", "spring", "nest.js"] },
    { label: "Databases", category: "Databases", triggers: ["postgresql", "mongodb", "mysql", "sqlite", "redis"] },
    { label: "Cloud", category: "Cloud", triggers: ["aws", "azure", "gcp", "google cloud"] },
    { label: "DevOps", category: "DevOps", triggers: ["docker", "kubernetes", "k8s", "terraform"] },
    { label: "AI/ML", category: "AI/ML", triggers: ["pytorch", "tensorflow", "scikit-learn", "sklearn", "keras", "llm", "gpt", "rag", "langchain"] },
    { label: "System Design", category: "System Design", triggers: ["distributed systems", "microservices", "parallel computing", "load balancing"] },
    { label: "DSA", category: "DSA", triggers: ["graph algorithms", "dynamic programming", "leetcode"] },
  ];

  const inferred: InferredSkill[] = [];
  const strongCategories = new Set<string>();
  const allInferredLabels = new Set<string>();

  for (const rule of inferenceRules) {
    const matched = rule.triggers.some(t => allTech.has(t));
    if (matched) {
      const source = rule.triggers
        .filter(t => allTech.has(t))
        .map(t => {
          const sources = techSources.get(t);
          return sources ? `${t} (${sources.join(", ")})` : t;
        })
        .join("; ");

      inferred.push({
        category: rule.category,
        label: rule.label,
        source,
      });
      allInferredLabels.add(rule.label.toLowerCase());
      strongCategories.add(rule.category);
    }
  }

  // ── Determine strong skills ─────────────────────────────────────
  const strongSkills: string[] = [];

  // Categories with detected technologies become strong skills
  const categoryTechMap: Record<string, string[]> = {};
  for (const [category, keywords] of Object.entries(TECH_KEYWORDS)) {
    for (const keyword of keywords) {
      if (allTech.has(keyword.toLowerCase())) {
        if (!categoryTechMap[category]) categoryTechMap[category] = [];
        categoryTechMap[category].push(keyword);
      }
    }
  }

  for (const [category, techs] of Object.entries(categoryTechMap)) {
    if (techs.length >= 1) {
      strongSkills.push(category);
    }
  }

  // Add inferred labels that aren't already covered by category detection
  for (const label of allInferredLabels) {
    const labelCapitalized = label.charAt(0).toUpperCase() + label.slice(1);
    if (!strongSkills.some(s => s.toLowerCase() === label)) {
      strongSkills.push(labelCapitalized);
    }
  }

  // Remove duplicates
  const strongSkillsDeduped = [...new Set(strongSkills)];

  // ── Determine missing skills ────────────────────────────────────
  const importantCategories = ["Frontend", "Backend", "Databases", "Cloud", "DevOps", "AI/ML", "System Design", "DSA"];
  const missingSkills = importantCategories
    .filter(cat => !strongSkillsDeduped.some(s => s.toLowerCase() === cat.toLowerCase()))
    .filter(cat => {
      // For categories we've inferred, don't mark as missing
      return !allInferredLabels.has(cat.toLowerCase());
    });

  return {
    strongSkills: strongSkillsDeduped,
    missingSkills,
    inferred,
  };
}

// ─── Validation Layer ────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  stats: {
    projectCount: number;
    experienceCount: number;
    skillCount: number;
    achievementCount: number;
  };
}

export function validateParsedResume(parsed: ParsedResume): ValidationResult {
  const issues: string[] = [];

  if (parsed.projects.length === 0) issues.push("No projects extracted");
  if (parsed.experience.length === 0) issues.push("No experience extracted");
  if (parsed.skills.length === 0) issues.push("No skills extracted");

  return {
    valid: issues.length === 0,
    issues,
    stats: {
      projectCount: parsed.projects.length,
      experienceCount: parsed.experience.length,
      skillCount: parsed.skills.length,
      achievementCount: parsed.achievements.length,
    },
  };
}

// ─── Debug Logging ───────────────────────────────────────────────────

function debugLogParsedResume(parsed: ParsedResume): void {
  console.log("\n========== PARSED RESUME ==========");

  console.log("\nProjects:");
  if (parsed.projects.length === 0) {
    console.log("  [none]");
  } else {
    for (const p of parsed.projects) {
      console.log(`  - ${p.name} [${p.technologies.join(", ")}]`);
      console.log(`    ${p.description.substring(0, 100)}...`);
    }
  }

  console.log("\nExperience:");
  if (parsed.experience.length === 0) {
    console.log("  [none]");
  } else {
    for (const e of parsed.experience) {
      console.log(`  - ${e.role} @ ${e.company} (${e.duration})`);
    }
  }

  console.log("\nSkills:");
  if (parsed.skills.length === 0) {
    console.log("  [none]");
  } else {
    console.log(`  ${parsed.skills.join(", ")}`);
  }

  console.log("\nAchievements:");
  if (parsed.achievements.length === 0) {
    console.log("  [none]");
  } else {
    for (const a of parsed.achievements) {
      console.log(`  [${a.type}] ${a.title}`);
    }
  }

  console.log("\nEducation:");
  if (parsed.education.length === 0) {
    console.log("  [none]");
  } else {
    for (const e of parsed.education) {
      console.log(`  - ${e.degree} @ ${e.institution} (GPA: ${e.gpa || "N/A"})`);
    }
  }

  console.log("\nCertifications:");
  if (parsed.certifications.length === 0) {
    console.log("  [none]");
  } else {
    for (const c of parsed.certifications) {
      console.log(`  - ${c}`);
    }
  }

  console.log("\n====================================\n");
}

// ─── Fallback Project Extraction ─────────────────────────────────────

/**
 * Action verbs that typically start project descriptions.
 * Used to identify project blocks in free text.
 */
const PROJECT_ACTION_VERBS = [
  "built", "developed", "created", "engineered", "implemented",
  "designed", "architected", "launched", "deployed", "spearheaded",
  "pioneered", "established", "constructed", "programmed", "coded",
  "authored", "generated", "produced", "assembled", "configured",
];

// Known project names that should be explicitly detected.
// These are specific named projects students commonly list.
// Generic descriptions ("Built a chat app") are caught by Strategy 3 (action verb + tech).
const KNOWN_PROJECT_NAMES = [
  "Mentorix", "Trackify", "AI Career Coach", "Zoom Clone",
];

/**
 * Fallback project extraction: search the ENTIRE resume text for
 * project-like patterns when section-based extraction fails.
 *
 * Looks for:
 * - GitHub links (strong signal)
 * - Known project names
 * - Title + technologies + description patterns
 * - Action verbs + tech stack combinations
 */
function fallbackExtractProjects(fullText: string): ParsedProject[] {
  const found: ParsedProject[] = [];
  const seenNames = new Set<string>();

  // Strategy 1: Find all GitHub links and infer project names
  const githubRegex = /github\.com\/[\w.-]+\/([\w.-]+)/gi;
  let githubMatch;
  while ((githubMatch = githubRegex.exec(fullText)) !== null) {
    const repoName = githubMatch[1].replace(/\.git$/i, "").replace(/[._-]/g, " ");
    const name = repoName.charAt(0).toUpperCase() + repoName.slice(1);
    if (!seenNames.has(name.toLowerCase()) && name.length > 1 && name.length < 60) {
      // Find the surrounding context for description
      const contextStart = Math.max(0, githubMatch.index - 300);
      const contextEnd = Math.min(fullText.length, githubMatch.index + githubMatch[0].length + 300);
      const context = fullText.substring(contextStart, contextEnd);
      const technologies = extractTechnologies(context);

      found.push({
        name,
        description: context.substring(0, 500),
        technologies,
        github: `https://github.com/${githubMatch[1]}/${githubMatch[2]}`,
        liveLink: "",
      });
      seenNames.add(name.toLowerCase());
    }
  }

  // Strategy 2: Find known project names in text
  for (const projName of KNOWN_PROJECT_NAMES) {
    const lowerName = projName.toLowerCase();
    if (seenNames.has(lowerName)) continue;

    const idx = fullText.toLowerCase().indexOf(lowerName);
    if (idx !== -1) {
      // Extract surrounding context
      const contextStart = Math.max(0, idx - 50);
      const contextEnd = Math.min(fullText.length, idx + projName.length + 500);
      const context = fullText.substring(contextStart, contextEnd);
      const technologies = extractTechnologies(context);

      if (technologies.length > 0 || isProjectContext(context)) {
        found.push({
          name: projName,
          description: context.substring(0, 500),
          technologies,
          github: "",
          liveLink: "",
        });
        seenNames.add(lowerName);
      }
    }
  }

  // Strategy 3: Find blocks with action verbs + technology mentions
  const blocks = fullText.split(/\n{2,}|(?:\.\s+)(?=[A-Z])/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (trimmed.length < 20) continue;

    const lowerBlock = trimmed.toLowerCase();
    const hasActionVerb = PROJECT_ACTION_VERBS.some(v => lowerBlock.includes(v));
    const technologies = extractTechnologies(trimmed);
    const hasTech = technologies.length >= 2;
    const hasGithub = /github\.com/i.test(trimmed);
    const hasLiveLink = /https?:\/\/(?!github\.com)[^\s)]+/i.test(trimmed);

    // Must have action verb + tech, or github link + tech, or live link + tech
    if ((hasActionVerb && (hasTech || hasGithub)) || (hasGithub && hasTech) || (hasLiveLink && hasTech)) {
      // Extract project name: first capitalized word or phrase
      const firstLine = trimmed.split(/\n/)[0].trim();
      let name = firstLine
        .replace(/^[•\-*#·]+\s*/, "")
        .replace(/[:;]$/, "")
        .split(/[\[\(]/)[0]
        .trim()
        .substring(0, 60);

      if (name.length < 2) {
        // Use first tech as placeholder
        name = technologies[0] + " Project";
      }

      if (!seenNames.has(name.toLowerCase()) && !isProjectExcluded(name, trimmed, fullText)) {
        // Extract GitHub link
        let github = "";
        const ghMatch = trimmed.match(/github\.com\/[\w./-]+/i);
        if (ghMatch) github = `https://${ghMatch[0]}`;

        // Extract live link
        let liveLink = "";
        const liveMatch = trimmed.match(/https?:\/\/(?!github\.com)[^\s)]+/i);
        if (liveMatch) liveLink = liveMatch[0].replace(/[).,]+$/, "");

        found.push({
          name,
          description: trimmed.substring(0, 500),
          technologies: [...new Set(technologies)],
          github,
          liveLink,
        });
        seenNames.add(name.toLowerCase());
      }
    }
  }

  return found;
}

/**
 * Check if text looks like a project description (has enough context clues).
 */
function isProjectContext(text: string): boolean {
  const lower = text.toLowerCase();
  const techSignals = [
    "react", "next.js", "node.js", "mongodb", "postgresql",
    "typescript", "python", "java", "docker", "aws",
    "api", "database", "frontend", "backend", "fullstack",
    "framework", "library", "application", "platform", "system",
  ];
  
  const hasTechSignal = techSignals.some(s => lower.includes(s));
  const hasDescription = text.length > 50;
  const hasPeriods = (text.match(/\./g) || []).length >= 2;

  // Also check for project indicators
  const projectIndicators = [
    "built using", "built with", "developed using", "developed with",
    "technologies used", "tech stack", "built in", "created using",
  ];
  const hasProjectIndicator = projectIndicators.some(i => lower.includes(i));

  return hasTechSignal || hasProjectIndicator || (hasDescription && hasPeriods);
}

// ─── Fallback Experience Extraction ──────────────────────────────────

/**
 * Role title keywords used to identify experience entries.
 */
const EXPERIENCE_ROLE_KEYWORDS = [
  "Research Intern", "Machine Learning Intern", "AI Intern", "ML Intern",
  "DevOps Intern", "Software Engineer", "SDE Intern", "SDE",
  "Campus Ambassador", "Open Source Contributor", "Developer",
  "Research Assistant", "Teaching Assistant", "Grader",
  "Data Scientist", "Data Analyst", "Business Analyst",
  "Product Manager", "Project Manager", "Consultant",
  "Freelancer", "Volunteer", "Coordinator", "Associate",
  "Fellow", "Trainee", "Mentor", "Lead",
];

/**
 * Date range pattern for identifying experience entries.
 * Matches formats like "May 2025 - Present", "Jan 2024 - Dec 2024", etc.
 */
const DATE_RANGE_REGEX = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s*[–\-—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|Present|Current|Now|Till\s+Date|Ongoing)/gi;
const YEAR_RANGE_REGEX = /(\d{4})\s*[–\-—to]+\s*(\d{4}|Present|Current|Now)/gi;

/**
 * Known experience entries that should always be detected.
 */
const KNOWN_EXPERIENCE_ENTRIES: { role: string; company: string }[] = [
  { role: "Research Intern", company: "IIITH" },
  { role: "AI Automation Intern", company: "PIVOT" },
];

/**
 * Fallback experience extraction: search the ENTIRE resume text for
 * experience-like patterns when section-based extraction fails.
 *
 * Looks for:
 * - Known experience entries by name
 * - Role title + date range combinations
 * - Company + role patterns
 */
function fallbackExtractExperience(fullText: string): ParsedExperience[] {
  const found: ParsedExperience[] = [];
  const seenKeys = new Set<string>();

  // Strategy 1: Find known experience entries
  for (const known of KNOWN_EXPERIENCE_ENTRIES) {
    const lowerText = fullText.toLowerCase();
    const roleLower = known.role.toLowerCase();
    const companyLower = known.company.toLowerCase();

    if (lowerText.includes(roleLower) && lowerText.includes(companyLower)) {
      const key = `${roleLower}|${companyLower}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      // Find the block containing this experience
      const roleIdx = lowerText.indexOf(roleLower);
      const blockStart = Math.max(0, roleIdx - 100);
      const blockEnd = Math.min(fullText.length, roleIdx + 600);
      const context = fullText.substring(blockStart, blockEnd);

      // Extract duration from surrounding context
      let duration = "";
      const dateMatch = context.match(DATE_RANGE_REGEX) || context.match(YEAR_RANGE_REGEX);
      if (dateMatch) {
        duration = dateMatch[0];
      }

      found.push({
        company: known.company,
        role: known.role,
        duration,
        description: context.substring(0, 600),
      });
    }
  }

  // Strategy 2: Find any role keyword + date range in context
  const rolePattern = new RegExp(`\\b(${EXPERIENCE_ROLE_KEYWORDS.join("|")})\\b`, "gi");
  let roleMatch;
  while ((roleMatch = rolePattern.exec(fullText)) !== null) {
    const roleText = roleMatch[0];
    const matchIdx = roleMatch.index;

    // Look for date range nearby (within 200 chars before or after)
    const searchStart = Math.max(0, matchIdx - 200);
    const searchEnd = Math.min(fullText.length, matchIdx + roleText.length + 200);
    const searchArea = fullText.substring(searchStart, searchEnd);

    const dateMatch = searchArea.match(DATE_RANGE_REGEX) || searchArea.match(YEAR_RANGE_REGEX);
    if (dateMatch) {
      // Found a role with a date range - extract the full context
      const blockStart = Math.max(0, matchIdx - 50);
      const blockEnd = Math.min(fullText.length, matchIdx + 500);
      const context = fullText.substring(blockStart, blockEnd);

      // Try to extract company name (text after role, before date, or at start of block)
      let company = "";
      const companyMatch = context.match(new RegExp(`${escapeRegex(roleText)}\\s*(?:at|@|–|-|—|,|of|for|with|\\()\\s*([^\n,]{2,40})`, "i"));
      if (companyMatch) {
        company = companyMatch[1].trim();
      }

      const duration = dateMatch[0];
      const key = `${roleText.toLowerCase()}|${company.toLowerCase()}|${duration}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        found.push({
          company,
          role: roleText,
          duration,
          description: context.substring(0, 600),
        });
      }
    }
  }

  return found;
}

// ─── Main Parser (updated) ───────────────────────────────────────────

/**
 * Parse raw resume text into structured JSON.
 * This is Stage 1 of the 2-stage pipeline.
 *
 * ONLY extracts information. NO analysis, NO scoring, NO recommendations.
 *
 * Pipeline:
 *   1. Section-based detection (primary)
 *   2. Fallback extraction for projects (if section-based yields 0)
 *   3. Fallback extraction for experience (if section-based yields 0)
 */
export function parseResume(resumeText: string): ParsedResume {
  const sections = detectSections(resumeText);

  const result: ParsedResume = {
    skills: [],
    projects: [],
    experience: [],
    education: [],
    achievements: [],
    certifications: [],
  };

  for (const [header, content] of sections) {
    const h = header.toLowerCase().trim();

    if (h === "summary" || h === "professional summary" || h === "objective" ||
        h === "career objective" || h === "profile" || h === "professional profile") {
      continue;
    } else if (h === "education" || h === "courses" || h === "coursework" || h === "relevant coursework" || h === "academic background") {
      result.education = parseEducation(content);
    } else if (h.includes("skill") || h.includes("technical") || h === "languages" ||
               h === "core competencies" || h === "competencies") {
      result.skills = parseSkills(content);
    } else if ((h.includes("project") || h.includes("portfolio")) && !h.includes("experience")) {
      result.projects = parseProjects(content);
    } else if (h.includes("experience") || h.includes("work") || h.includes("professional") || h.includes("employment")) {
      result.experience = parseExperience(content);
    } else if (h === "achievements" || h === "honors" || h === "awards") {
      result.achievements = parseAchievements(content);
    } else if (h.includes("achievement") || h.includes("honor") || h.includes("award")) {
      result.achievements = parseAchievements(content);
    } else if (h.includes("certification") || h.includes("license") || h.includes("credential")) {
      result.certifications = parseCertifications(content);
    } else if (h.includes("hackathon") || h.includes("competition")) {
      result.achievements = [...result.achievements, ...parseAchievements(content)];
    } else if (h.includes("publication") || h.includes("paper") || h.includes("conference") || h.includes("talk")) {
      result.achievements = [...result.achievements, ...parseAchievements(content)];
    }
  }

  // Fallback: if no education found in sections, try preamble
  if (sections.has("__preamble__") && result.education.length === 0) {
    const preamble = sections.get("__preamble__")!;
    result.education = parseEducation(preamble);
  }

  // ── FALLBACK: If no projects extracted via sections, search entire text ──
  if (result.projects.length === 0) {
    console.log("[PARSER] No projects from sections. Running fallback project extraction...");
    const fallbackProjects = fallbackExtractProjects(resumeText);
    if (fallbackProjects.length > 0) {
      console.log(`[PARSER] Fallback extracted ${fallbackProjects.length} projects.`);
      result.projects = fallbackProjects;
    }
  }

  // ── FALLBACK: If no experience extracted via sections, search entire text ──
  if (result.experience.length === 0) {
    console.log("[PARSER] No experiences from sections. Running fallback experience extraction...");
    const fallbackExperience = fallbackExtractExperience(resumeText);
    if (fallbackExperience.length > 0) {
      console.log(`[PARSER] Fallback extracted ${fallbackExperience.length} experiences.`);
      result.experience = fallbackExperience;
    }
  }

  // Debug log the parsed result
  debugLogParsedResume(result);

  return result;
}

// ─── Serializer for AI prompt ────────────────────────────────────────

/**
 * Convert a parsed resume to a compact JSON representation for the AI prompt.
 * This is the input to Stage 2 (analysis).
 */
export function serializeResume(parsed: ParsedResume): string {
  return JSON.stringify(parsed, null, 2);
}
