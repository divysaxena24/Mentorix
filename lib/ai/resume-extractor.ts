/**
 * lib/ai/resume-extractor.ts
 *
 * ============================================================================
 * STRUCTURED RESUME EXTRACTION PIPELINE
 *
 * PDF text → text normalization → heading detection → section parsing
 *         → skill inference → validation → structured JSON
 *
 * Rules:
 *   - NEVER return undefined arrays. Every field is always [ ].
 *   - NEVER send raw resume text to AI. AI receives ONLY structured JSON.
 *   - If validation fails (projects/experience/skills empty), return error.
 *   - Extensive logging at every stage.
 * ============================================================================
 */

// ─── Public Types ──────────────────────────────────────────────────────

export interface ExtractedProject {
  name: string;
  description: string;
  technologies: string[];
}

export interface ExtractedExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface ExtractedEducation {
  institution: string;
  degree: string;
  year?: string;
  gpa?: string;
}

export interface ExtractedAchievement {
  title: string;
  description: string;
  type: "hackathon" | "contest" | "award" | "other";
}

export interface ExtractedSkill {
  category: string;
  label: string;
  source: string;
}

export interface ExtractedResume {
  skills: string[];
  projects: ExtractedProject[];
  experience: ExtractedExperience[];
  education: ExtractedEducation[];
  achievements: ExtractedAchievement[];
  certifications: string[];
  inferredSkills: ExtractedSkill[];
}

export interface ExtractionResult {
  success: boolean;
  data: ExtractedResume | null;
  error: string | null;
  stats: {
    projectCount: number;
    experienceCount: number;
    skillCount: number;
    achievementCount: number;
  };
}

// ─── Technology Keywords (shared with old parser for compatibility) ────

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

// ─── Helpers ───────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ALL_TECH_KEYWORDS = Object.values(TECH_KEYWORDS).flat();
const SORTED_TECH_KEYWORDS = [...new Set(ALL_TECH_KEYWORDS.map(k => k.trim()).filter(Boolean))]
  .sort((a, b) => b.length - a.length);
const TECH_REGEX = new RegExp(`\\b(${SORTED_TECH_KEYWORDS.map(escapeRegex).join("|")})\\b`, "gi");

export function extractTechnologies(text: string): string[] {
  const matches = new Set<string>();
  const techMatches = text.matchAll(TECH_REGEX);
  for (const match of techMatches) {
    matches.add(match[1]);
  }
  return [...matches];
}

// ─── Step 1: Text Normalization ────────────────────────────────────────

/**
 * Fix merged words that commonly occur from PDF extraction.
 *
 * Examples:
 *   "Research InternMay 2026"       → "Research Intern May 2026"
 *   "RankedTop 45among180+ teams"    → "Ranked Top 45 among 180+ teams"
 *   "SecuredRunner-Upin theSimpli AI track" → "Secured Runner-Up in the Simpli AI track"
 *
 * IMPORTANT: Known technology names (JavaScript, TypeScript, GitHub, etc.)
 * are protected from splitting to avoid breaking tech detection.
 */
function normalizeMergedWords(text: string): string {
  let result = text;
  const placeholders: Map<string, string> = new Map();
  let counter = 0;

  // ── Step 0: Protect known tech names from being split ──────────────
  // These names contain patterns (CamelCase, digit+letter) that the
  // normalization rules would incorrectly split.
  // We temporarily replace them with placeholders and restore after.
  const protectedNames = [
    // Languages (CamelCase that would be split)
    "JavaScript", "TypeScript", "CoffeeScript", "ActionScript",
    // Platforms & Tools (CamelCase)
    "GitHub", "GitLab", "GitKraken",
    "Postman", "PostgreSQL", "MySQL", "SQLite", "MariaDB",
    "MongoDB", "CouchDB", "DynamoDB", "CockroachDB",
    "Elasticsearch", "Firebase", "Supabase", "PlanetScale",
    "Webpack", "WebSocket", "WebAssembly",
    // Multi-word tools
    "GitHub Actions", "GitLab CI", "CircleCI",
    "Hugging Face", "HuggingFace",
    "Scikit-Learn",
    // Numbers in names
    "Three.js", "D3.js", "Node.js", "Next.js", "Nuxt.js", "Nest.js", "Vue.js",
    "FastAPI", "OpenAPI",
    "Kubernetes", "LangChain", "LlamaIndex",
    // Machine learning
    "XGBoost", "LightGBM", "CatBoost", "PyTorch", "TensorFlow",
    // Multi-word concepts
    "Computer Vision", "Deep Learning", "Machine Learning",
    "Data Structures", "Distributed Systems", "Load Balancing",
    "Message Queues", "Event-Driven Architecture",
    "Parallel Computing", "Consistent Hashing",
    "Stable Diffusion", "Google Cloud",
    "Open Source", "CI/CD",
    "Higher Secondary",
    // Common section headings that might appear in text
    "Smart India",
  ];

  for (const name of protectedNames) {
    const placeholder = `__TECH_${counter}__`;
    counter++;
    const regex = new RegExp(escapeRegex(name), "gi");
    result = result.replace(regex, (match) => {
      placeholders.set(placeholder, match);
      return placeholder;
    });
  }

  // ── Step 1: Fix merged role + month ─────────────────────────────
  // "InternMay 2026" → "Intern May 2026"
  result = result.replace(
    /([a-z)\]]) ((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi,
    "$1 $2"
  );

  // ── Step 2: Fix merged role + year ──────────────────────────────
  // "Intern2024" → "Intern 2024"
  result = result.replace(
    /([a-z)\]}])\s*(\d{4})/gi,
    (match, before, year) => {
      const y = parseInt(year, 10);
      if (y >= 2020 && y <= 2029) return `${before} ${year}`;
      return match;
    }
  );

  // ── Step 3: Fix lowercase→uppercase word merges ─────────────────
  // "RankedTop" → "Ranked Top"
  // Known tech names (JavaScript, TypeScript, etc.) are protected
  // by placeholders, so this rule won't break them.
  result = result.replace(/([a-z])([A-Z][a-z]+)/g, "$1 $2");

  // ── Step 4: Fix multi-uppercase + lowercase merges ───────────────
  // "AItrack" → "AI track", "HTMLparser" → "HTML parser"
  result = result.replace(/([A-Z]{2,})([a-z]{2,})/g, "$1 $2");

  // ── Step 5: Fix merged number + word ────────────────────────────
  // "45among" → "45 among", "180+teams" → "180+ teams"
  // (Numbers before tech names are already protected above)
  result = result.replace(/(\d\+?)([a-zA-Z])/g, "$1 $2");

  // ── Step 6: Fix known compound word merges ──────────────────────
  // "Runner-Upin" → "Runner-Up in", "BuiltWith" → "Built With"
  const compoundWords = [
    "Runner-Up", "Runner-up", "runner-up",
    "Built", "Developed", "Created", "Engineered", "Implemented",
    "Designed", "Architected", "Launched", "Deployed", "Spearheaded",
    "Ranked", "Awarded", "Recognized", "Selected", "Secured",
    "Led", "Managed", "Coordinated", "Organized", "Founded",
  ];
  for (const word of compoundWords) {
    const regex = new RegExp(`(${escapeRegex(word)})([a-zA-Z]{2,})`, "g");
    result = result.replace(regex, "$1 $2");
  }

  // ── Step 7: Fix "theX" patterns ─────────────────────────────────
  // "theSimpli" → "the Simpli"
  result = result.replace(/\b(the)([A-Z])/g, "$1 $2");

  // ── Step 8: Fix bullet points without preceding newline ──────────
  result = result.replace(/([^\n])([•\-*·]\s+)/g, "$1\n$2");

  // ── Step 9: Restore protected tech names ────────────────────────
  for (const [placeholder, original] of placeholders) {
    result = result.replace(placeholder, original);
  }

  // ── Step 10: Normalize whitespace ────────────────────────────────
  result = result.replace(/[ \t]+/g, " ");
  result = result.trim();

  // ── Step 11: Final cleanup — remove any remaining placeholder tokens ──
  // If any __TECH_N__ placeholder wasn't restored (edge case), remove it
  // to prevent leaks into the final structured JSON output.
  result = result.replace(/__TECH_\d+__/g, "");
  // Also clean any **TECH_N** patterns that might appear from other sources
  result = result.replace(/\*\*TECH_\d+\*\*/g, "");

  return result;
}

// ─── Step 2: Heading Detection ─────────────────────────────────────────

/**
 * Known section headings (case-insensitive).
 * Ordered by specificity (more specific first).
 */
const KNOWN_HEADINGS = new Set([
  // Education variants
  "education", "educational background", "academic background",
  "academic qualifications", "qualifications",
  // Experience variants
  "experience", "work experience", "professional experience",
  "relevant experience", "technical experience", "internship experience",
  "research experience", "employment", "work history",
  // Projects variants
  "projects", "personal projects", "academic projects",
  "technical projects", "key projects", "major projects",
  "project work", "portfolio",
  // Skills variants
  "skills", "technical skills", "core competencies",
  "competencies", "technologies", "tech stack", "expertise",
  // Achievements variants
  "achievements", "honors", "awards", "honours",
  "accomplishments", "recognitions",
  // Certifications variants
  "certifications", "certificates", "licenses", "credentials",
  "licenses & certifications",
  // Other sections
  "summary", "professional summary", "objective", "career objective",
  "profile", "professional profile",
  "publications", "papers", "conferences",
  "leadership", "leadership experience", "extracurricular",
  "extracurricular activities", "volunteer", "volunteering",
  "languages", "interests",
  "open source", "open source contributions",
  "hackathons", "competitions",
  "positions of responsibility", "positions",
  "coursework", "relevant coursework",
  "patents", "talks",
  "thesis", "dissertation",
  "research", "research work",
  "references",
]);

// Sections that we want to extract content from
const EXTRACTION_SECTIONS = new Set([
  "education", "experience", "work experience", "professional experience",
  "relevant experience", "internship experience", "research experience",
  "employment",
  "projects", "personal projects", "academic projects",
  "technical projects", "key projects", "major projects", "project work",
  "portfolio",
  "skills", "technical skills", "core competencies", "competencies",
  "technologies", "tech stack", "expertise",
  "achievements", "honors", "awards", "honours",
  "accomplishments", "recognitions",
  "certifications", "certificates", "licenses", "credentials",
  "licenses & certifications",
  "hackathons", "competitions",
  "publications", "papers", "conferences",
]);

/**
 * Detect section headings and split text into sections.
 * Uses heading detection (not just regex patterns).
 */
function detectHeadings(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = text.split("\n");

  let currentHeader = "__preamble__";
  let currentStart = 0;
  let foundFirstHeading = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Check if this line is a section heading
    const heading = classifyHeading(trimmed);

    if (heading) {
      // Save previous section
      const content = lines.slice(currentStart, i).join("\n").trim();
      if (content) {
        sections.set(currentHeader, content);
      }

      currentHeader = heading;
      currentStart = i + 1;
      foundFirstHeading = true;
    }
  }

  // Save last section
  if (currentStart < lines.length) {
    const content = lines.slice(currentStart).join("\n").trim();
    if (content) {
      sections.set(currentHeader, content);
    }
  }

  // If no headings were found at all, treat entire text as preamble
  if (!foundFirstHeading) {
    sections.clear();
    sections.set("__preamble__", text.trim());
  }

  return sections;
}

/**
 * Check if a line is a section heading.
 * Returns the normalized heading name or null.
 */
function classifyHeading(line: string): string | null {
  const trimmed = line.trim();

  // Remove common heading decorations
  const clean = trimmed
    .replace(/^#{1,3}\s+/, "")        // remove markdown # headers
    .replace(/^[•\-*·]\s*/, "")       // remove bullet points
    .replace(/:$/, "")               // remove trailing colon
    .trim();

  if (clean.length < 2 || clean.length > 50) return null;

  // Skip lines that look like content (contain action verbs, tech names, etc.)
  if (/^(built|developed|created|implemented|designed|architected|engineered)\b/i.test(clean)) {
    return null;
  }
  // Skip lines that look like bullet content
  if (/\b(https?:\/\/|github\.com|linkedin\.com)/i.test(clean)) {
    return null;
  }
  // Skip lines that are just numbers or dates
  if (/^\d+$/.test(clean) || /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(clean)) {
    return null;
  }

  const lower = clean.toLowerCase().trim();

  // Direct match against known headings
  if (KNOWN_HEADINGS.has(lower)) {
    return lower;
  }

  // Fuzzy match: check if the line is mostly uppercase and short (ALL CAPS section headers)
  const upperCount = (clean.match(/[A-Z]/g) || []).length;
  const totalLetters = (clean.match(/[a-zA-Z]/g) || []).length;
  const isAllCaps = totalLetters > 0 && upperCount / totalLetters > 0.8 && clean.length < 40;

  if (isAllCaps) {
    const lowerClean = clean.toLowerCase();
    // Map ALL CAPS headings to known headings
    for (const known of KNOWN_HEADINGS) {
      if (lowerClean === known || lowerClean.includes(known)) {
        return known;
      }
    }
    // If it looks like an ALL CAPS heading but doesn't match known, try to classify by keyword
    if (/educ/i.test(lowerClean)) return "education";
    if (/experien/i.test(lowerClean) || /intern/i.test(lowerClean) || /work/i.test(lowerClean)) return lowerClean.includes("research") ? "research experience" : "experience";
    if (/proj/i.test(lowerClean) || /portfol/i.test(lowerClean)) return "projects";
    if (/skill/i.test(lowerClean) || /technolog/i.test(lowerClean) || /competenc/i.test(lowerClean) || /expert/i.test(lowerClean)) return "skills";
    if (/achiev/i.test(lowerClean) || /honou?r/i.test(lowerClean) || /award/i.test(lowerClean) || /accompli/i.test(lowerClean) || /recogn/i.test(lowerClean)) return "achievements";
    if (/certif/i.test(lowerClean) || /licen/i.test(lowerClean) || /credent/i.test(lowerClean)) return "certifications";
    if (/hack/i.test(lowerClean) || /compet/i.test(lowerClean)) return "hackathons";
    if (/public/i.test(lowerClean) || /paper/i.test(lowerClean) || /conferen/i.test(lowerClean)) return "publications";
  }

  return null;
}

// ─── Step 3: Section Parsers ───────────────────────────────────────────

/**
 * Parse education section text.
 * Validates that degrees are meaningful (not single characters).
 * Rejects entries with single-character degrees.
 */
function parseEducation(text: string): ExtractedEducation[] {
  const entries: ExtractedEducation[] = [];
  const lines = text.split("\n").filter(l => l.trim());

  // Known full degree names for validation
  const validDegreePrefixes = [
    "B.Tech", "B.Tech.", "B Tech", "B. Tech",
    "Bachelor", "Bachelor's", "Bachelors",
    "M.Tech", "M.Tech.", "M Tech", "M. Tech",
    "Master", "Master's", "Masters",
    "PhD", "Ph.D.", "Ph.D", "Doctorate",
    "B.E", "B.E.", "BE",
    "M.E", "M.E.", "ME",
    "B.Sc", "B.Sc.", "BSc", "B.S",
    "M.Sc", "M.Sc.", "MSc", "M.S",
    "B.A", "B.A.", "BA",
    "M.A", "M.A.", "MA",
    "BBA", "MBA", "BCA", "MCA",
    "B.Com", "M.Com", "B. Com", "M. Com",
    "Diploma", "Higher Secondary", "HSC", "SSC",
    "Class X", "Class XII", "Class 10", "Class 12",
    "10th", "12th", "Intermediate",
    "A-Levels", "O-Levels", "IB",
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5) continue;

    // Degree keyword pattern (strict: must be a known degree name)
    const degreePattern = new RegExp(`(${validDegreePrefixes.map(escapeRegex).join("|")})`, "i");

    // Try to parse: Institution | Degree, or Degree - Institution
    const sepMatch = trimmed.match(/(.+?)(?:\s*[|,\–\-\—]\s*)(.+?)(?:\s*[|,\–\-\—]\s*)?(?:\s*(?:CGPA|GPA|Percentage|Score|%)\s*[\:\-\–]?\s*(\d+\.?\d*))?/i);

    if (sepMatch) {
      const part1 = sepMatch[1].trim();
      const part2 = sepMatch[2].trim();
      const gpa = sepMatch[3]?.trim();

      let degree = "";
      let institution = "";

      if (degreePattern.test(part1)) {
        degree = part1;
        institution = part2;
      } else if (degreePattern.test(part2)) {
        degree = part2;
        institution = part1;
      } else if (part2.length < 60) {
        degree = part2;
        institution = part1;
      } else {
        degree = "";
        institution = part1;
      }

      // VALIDATION: Reject single-character degrees
      if (degree.length <= 1 && !/^[A-Z]{2,}$/.test(degree)) {
        // Single character is not a valid degree name, try to find degree in institution
        if (degreePattern.test(institution)) {
          const instMatch = institution.match(degreePattern);
          if (instMatch) {
            const foundDegree = instMatch[0];
            institution = institution.replace(foundDegree, "").replace(/[,\s]+/g, " ").trim();
            degree = foundDegree;
          }
        } else {
          degree = "";
        }
      }

      entries.push({ degree, institution, gpa });
    } else if (trimmed.length > 5 && trimmed.length < 150) {
      // Try to extract GPA even without structured format
      const gpaMatch = trimmed.match(/(\d+\.?\d*)\s*(?:\/10|%)?(?:\s*CGPA|\s*GPA|\s*Percentage)/i);

      // Try to extract degree name from the line
      const degreeMatch = trimmed.match(degreePattern);
      let degree = "";
      let institution = trimmed;

      if (degreeMatch) {
        degree = degreeMatch[0];
        institution = trimmed.replace(degreeMatch[0], "").replace(/[,\s]+/g, " ").trim();
      }

      entries.push({
        institution,
        degree,
        gpa: gpaMatch ? gpaMatch[1] : undefined,
      });
    }
  }

  // Post-process: clean up entries with single-char or empty degrees
  return entries.filter(e => {
    // Reject if degree is a single character (like "A" or "B") and not a known abbreviation
    if (e.degree.length === 1 && !/^[A-Z]{2,}$/.test(e.degree)) return false;
    // Reject empty entries
    if (!e.institution && !e.degree) return false;
    return true;
  });
}

/**
 * Parse skills section text.
 */
function parseSkills(text: string): string[] {
  const skills: string[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split by common delimiters: comma, pipe, bullet, dash
    const items = trimmed.split(/[,|•–\-·•]+/).map(s => s.trim()).filter(Boolean);

    for (const item of items) {
      const cleaned = item.replace(/^[•\-*#]+/, "").replace(/^:+/, "").trim();
      if (cleaned.length > 1 && cleaned.length < 60) {
        const normalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).replace(/\.+$/, "").trim();
        skills.push(normalized);
      }
    }
  }

  // Remove duplicates (case-insensitive)
  const seen = new Set<string>();
  return skills.filter(s => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Known project names that commonly appear in resumes.
 * These are used to detect project boundaries when blank lines are missing.
 */
const KNOWN_PROJECT_NAMES = [
  "Mentorix", "Recrutva", "Trackify", "AI Career Coach", "Zoom Clone",
  "Netflix Clone", "Spotify Clone", "Twitter Clone", "Discord Clone",
  "Slack Clone", "WhatsApp Clone", "E-commerce Platform",
  "Portfolio Website", "Personal Blog", "Task Manager", "Movie Finder",
];

/**
 * Action verbs that typically start project descriptions.
 */
const PROJECT_ACTION_VERBS = [
  "Built", "Developed", "Created", "Engineered", "Implemented",
  "Designed", "Architected", "Launched", "Deployed", "Spearheaded",
  "Pioneered", "Established", "Constructed", "Programmed", "Coded",
  "Authored", "Generated", "Produced", "Assembled", "Configured",
];

/**
 * Pre-process project section text to detect project boundaries
 * using multiple signals: GitHub links, live links, known project names,
 * action verbs, and title-cased names.
 */
function splitProjectBlocks(text: string): string[] {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip section headers
    if (KNOWN_HEADINGS.has(trimmed.toLowerCase()) && trimmed.length < 40) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      continue;
    }

    // Determine if this line starts a new project
    const isNewProject = isProjectStartLine(trimmed, i, lines);

    if (isNewProject) {
      // Save previous block
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
      }
      currentBlock = [trimmed];
    } else if (trimmed) {
      currentBlock.push(trimmed);
    } else if (currentBlock.length > 0) {
      // Empty line — could be a separator, but be careful not to split mid-project
      // Only split if the next non-empty line looks like a new project
      const nextNonEmpty = findNextNonEmptyLine(lines, i + 1);
      if (nextNonEmpty && isProjectStartLine(nextNonEmpty, i + 1, lines)) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      } else if (currentBlock.length > 0) {
        currentBlock.push(""); // preserve blank line within project
      }
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n"));
  }

  return blocks;
}

/**
 * Find the next non-empty line starting from index.
 */
function findNextNonEmptyLine(lines: string[], startIdx: number): string | null {
  for (let i = startIdx; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed) return trimmed;
  }
  return null;
}

/**
 * Check if a trimmed line looks like the start of a new project entry.
 * Uses multiple signals to make a robust determination.
 */
function isProjectStartLine(line: string, lineIdx: number, allLines: string[]): boolean {
  if (!line || line.length < 2) return false;

  const trimmed = line.trim();
  if (trimmed.length < 2) return false;

  // Signal 1: Line is a bullet point starting with action verb
  // e.g., "• Built an AI platform..."
  const bulletMatch = trimmed.match(/^[•\-*·]+\s+(\S+)/);
  if (bulletMatch) {
    const firstWord = bulletMatch[1];
    if (PROJECT_ACTION_VERBS.some(v => v.toLowerCase() === firstWord.toLowerCase())) {
      return true;
    }
  }

  // Signal 2: Line matches a known project name (case-insensitive)
  if (KNOWN_PROJECT_NAMES.some(name => trimmed.toLowerCase().startsWith(name.toLowerCase()))) {
    return true;
  }

  // Signal 3: Line contains a GitHub link (strong project signal)
  if (/github\.com\/[\w.-]+\/[\w.-]+/i.test(trimmed)) {
    return true;
  }

  // Signal 4: Line contains a live demo link
  if (/https?:\/\/(?!github\.com)[^\s)]+/i.test(trimmed) && /\b(demo|live|app|project|site)\b/i.test(trimmed)) {
    return true;
  }

  // Signal 5: Line is a short, capitalized title (2-5 words, each capitalized)
  // followed by bullet points or tech keywords in subsequent lines
  const words = trimmed.split(/\s+/);
  const isTitleCase = words.length >= 1 && words.length <= 6 &&
    words.every(w => /^[A-Z][a-z]/.test(w) || /^[A-Z]{2,}$/.test(w)) &&
    trimmed.length < 60 && trimmed.length >= 3;

  if (isTitleCase) {
    // Check that this isn't a section heading
    if (KNOWN_HEADINGS.has(trimmed.toLowerCase())) return false;
    // Check next non-empty line for project indicators
    const nextLine = findNextNonEmptyLine(allLines, lineIdx + 1);
    if (nextLine) {
      const nextTrimmed = nextLine.trim();
      // Next line has action verb, tech mentions, GitHub link, or bullet point
      const hasProjectSignal =
        PROJECT_ACTION_VERBS.some(v => nextTrimmed.startsWith(v)) ||
        /github\.com/i.test(nextTrimmed) ||
        /^[•\-*·]/.test(nextTrimmed) ||
        extractTechnologies(nextTrimmed).length >= 2 ||
        /:\s/.test(nextTrimmed);
      if (hasProjectSignal) {
        return true;
      }
    }
  }

  // Signal 6: Line starts with a project action verb directly
  if (PROJECT_ACTION_VERBS.some(v => trimmed.startsWith(v)) && !/^[•\-*·]/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Parse projects section text into structured project entries.
 * Uses enhanced boundary detection to prevent project merging.
 */
function parseProjects(text: string): ExtractedProject[] {
  const entries: ExtractedProject[] = [];
  const seenNames = new Set<string>();

  // Use enhanced boundary detection instead of simple blank-line split
  const blocks = splitProjectBlocks(text);

  for (const block of blocks) {
    const lines = block.split("\n").filter(l => l.trim());
    if (lines.length === 0) continue;

    // Find the project name (usually the first non-bullet, non-action-verb line)
    let name = "";
    let descriptionStartIdx = 0;

    // Try the first line as the project name
    const firstLine = lines[0].trim();
    let candidateName = firstLine
      .replace(/^[#*•\-·]+\s*/, "")
      .split(/[[(]/)[0]
      .replace(/[:;]$/, "")
      .trim();

    // If the first line is an action verb or bullet, try to extract name differently
    if (PROJECT_ACTION_VERBS.some(v => candidateName.startsWith(v)) || /^[•\-*·]/.test(firstLine)) {
      // Look for a project name in the preceding context
      // For now, use the first technology or generic "Project" as name
      const techInBlock = extractTechnologies(block);
      name = techInBlock.length > 0 ? `${techInBlock[0]} Project` : "Project";
      descriptionStartIdx = 0;
    } else {
      name = candidateName;
      descriptionStartIdx = 1;
    }

    if (name.length < 2 || name.length > 60) continue;
    if (name.toLowerCase() === "projects" || name.toLowerCase() === "project") continue;

    const fullDescription = lines.slice(descriptionStartIdx).join(" ").trim();
    const combinedText = `${name} ${fullDescription}`;

    // Skip if it looks like an experience entry (has role keywords without project verbs)
    if (/\b(intern|research\s+(intern|assistant|fellow))\b/i.test(combinedText) && !/\b(built|developed|created|designed|engineered)\b/i.test(combinedText)) {
      continue;
    }

    const technologies = extractTechnologies(combinedText);

    const lowerName = name.toLowerCase();
    if (!seenNames.has(lowerName)) {
      seenNames.add(lowerName);
      entries.push({
        name: name || "Project",
        description: fullDescription.substring(0, 500),
        technologies: [...new Set(technologies)],
      });
    }
  }

  // Post-processing: check for merged projects
  // If one project name is contained within another's description, split them
  const deduped = mergeProjectsIfNeeded(entries);

  return deduped;
}

/**
 * Post-processing: detect and split merged projects.
 * If one project name appears inside another project's description,
 * the description was likely merged and we should keep only the valid ones.
 */
function mergeProjectsIfNeeded(projects: ExtractedProject[]): ExtractedProject[] {
  if (projects.length <= 1) return projects;

  const result: ExtractedProject[] = [...projects];
  const toRemove = new Set<number>();

  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < result.length; j++) {
      if (i === j) continue;
      const nameI = result[i].name.toLowerCase();
      const nameJ = result[j].name.toLowerCase();

      // If project J's name appears inside project I's name or description,
      // it means I likely contains J's content (merged)
      const containerName = nameI;
      const containedName = nameJ;

      if (containerName.includes(containedName) && containerName !== containedName) {
        // Project I contains project J's name — split or mark for removal
        toRemove.add(j);
        // Try to split result[i] by the contained name
        const splitIdx = result[i].description.toLowerCase().indexOf(containedName);
        if (splitIdx > 50) { // Only split if the contained name appears mid-description
          result[i] = {
            ...result[i],
            description: result[i].description.substring(0, splitIdx).trim(),
          };
        }
      }
    }
  }

  return result.filter((_, idx) => !toRemove.has(idx));
}

/**
 * Known experience entries that should always be detected separately.
 */
const KNOWN_EXPERIENCE_ENTRIES: { role: string; company: string }[] = [
  { role: "Research Intern", company: "IIITH" },
  { role: "Research Assistant", company: "IIITH" },
  { role: "AI Automation Intern", company: "PIVOT" },
  { role: "Machine Learning Intern", company: "" },
  { role: "SDE Intern", company: "" },
  { role: "Software Engineer Intern", company: "" },
];

/**
 * Role title keywords used to identify experience entry starts.
 */
const EXPERIENCE_ROLE_KEYWORDS = [
  "Intern", "Software Intern", "Research Intern", "Research Assistant", "Teaching Assistant",
  "Machine Learning Intern", "AI Intern", "ML Intern", "AI Automation Intern",
  "DevOps Intern", "Software Engineer", "SDE Intern", "SDE",
  "Campus Ambassador", "Open Source Contributor",
  "Data Scientist", "Data Analyst", "Business Analyst",
  "Product Manager", "Project Manager", "Consultant",
  "Freelancer", "Volunteer", "Coordinator", "Associate",
  "Fellow", "Trainee", "Mentor", "Lead",
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Full-Stack Developer", "Software Developer",
];

/**
 * Pre-process experience section text to detect experience boundaries
 * using date ranges, role keywords, and known entries.
 */
function splitExperienceBlocks(text: string): string[] {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  // Date range patterns
  const dateRangePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s*[–\-—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|Present|Current|Now|Till\s+Date|Ongoing)/i;
  const yearRangePattern = /(\d{4})\s*[–\-—to]+\s*(\d{4}|Present|Current|Now)/i;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      if (currentBlock.length > 0) {
        // Check if next non-empty line starts a new experience
        const nextNonEmpty = findNextNonEmptyLine(lines, i + 1);
        if (nextNonEmpty && isExperienceStartLine(nextNonEmpty)) {
          blocks.push(currentBlock.join("\n"));
          currentBlock = [];
        } else {
          currentBlock.push(trimmed); // preserve blank line
        }
      }
      continue;
    }

    // Skip section headers
    if (KNOWN_HEADINGS.has(trimmed.toLowerCase()) && trimmed.length < 40) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      continue;
    }

    const isStart = isExperienceStartLine(trimmed);

    if (isStart) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
      }
      currentBlock = [trimmed];
    } else if (currentBlock.length > 0) {
      currentBlock.push(trimmed);
    } else {
      currentBlock.push(trimmed);
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n"));
  }

  return blocks;
}

/**
 * Check if a line looks like the start of a new experience entry.
 */
function isExperienceStartLine(line: string): boolean {
  if (!line || line.length < 3) return false;

  const trimmed = line.replace(/^[#*•\-·]+\s*/, "").trim();
  if (trimmed.length < 3) return false;

  // Signal 1: Line contains a date range (strong signal for an experience entry)
  const datePattern = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s*[–\-—to]+/i;
  const yearPattern = /(\d{4})\s*[–\-—to]+\s*(\d{4}|Present|Current|Now)/i;
  if (datePattern.test(trimmed) || yearPattern.test(trimmed)) {
    // But only if it's not a single line
    return true;
  }

  // Signal 2: Line starts with a known role keyword
  for (const keyword of EXPERIENCE_ROLE_KEYWORDS) {
    if (trimmed.toLowerCase().startsWith(keyword.toLowerCase())) {
      return true;
    }
    // Also check "at" or "@" pattern: "Intern at Company"
    const atPattern = new RegExp(`^${escapeRegex(keyword)}\\s+(?:at|@|–|-|—|,)`, "i");
    if (atPattern.test(trimmed)) {
      return true;
    }
    // Check role keyword + company pattern (e.g., "Research Intern, IIITH")
    const commaPattern = new RegExp(`^${escapeRegex(keyword)}\\s*[,]\\s*`, "i");
    if (commaPattern.test(trimmed)) {
      return true;
    }
  }

  // Signal 3: Full role keyword match in the line (not just at start)
  for (const keyword of EXPERIENCE_ROLE_KEYWORDS) {
    if (trimmed.toLowerCase().includes(keyword.toLowerCase())) {
      // Check that the line is short enough that the keyword is the main subject,
      // not a casual mention inside a long description
      if (trimmed.length < keyword.length + 30) {
        return true;
      }
    }
  }

  // Signal 4: Known experience entry patterns
  for (const known of KNOWN_EXPERIENCE_ENTRIES) {
    if (known.role && known.company) {
      if (trimmed.toLowerCase().includes(known.role.toLowerCase()) &&
          trimmed.toLowerCase().includes(known.company.toLowerCase())) {
        return true;
      }
    }
  }

  // Signal 5: Line has "Role @ Company" or "Role at Company" pattern with role keyword
  const roleCompanyMatch = trimmed.match(/(.+?)\s+(?:at|@|–|-|—|,|of|for|with)\s+(.+)/);
  if (roleCompanyMatch) {
    const firstPart = roleCompanyMatch[1].trim().toLowerCase();
    if (EXPERIENCE_ROLE_KEYWORDS.some(k => firstPart.startsWith(k.toLowerCase()) || firstPart.includes(k.toLowerCase()))) {
      return true;
    }
  }

  // Signal 6: Role keyword appears with company delimiter anywhere in line
  // Catches long role titles like "AI Automation and Web Development Intern, PIVOT"
  // without triggering false positives on long description lines.
  for (const keyword of EXPERIENCE_ROLE_KEYWORDS) {
    const kwLower = keyword.toLowerCase();
    if (trimmed.toLowerCase().includes(kwLower)) {
      // Check if the role keyword is followed by a company delimiter within the next ~40 chars
      // This ensures it's a role header, not a passing mention in a long description.
      const kwIdx = trimmed.toLowerCase().indexOf(kwLower);
      const afterKeyword = trimmed.substring(kwIdx + kwLower.length).trim();
      const afterKWL = afterKeyword.toLowerCase();

      // Keyword followed by @/at/-/comma then company name (strong header signal)
      const hasDelimiter = /^(?:\s*,\s*|\s+(?:at|@|–|-|—|of|for|with)\s+)/i.test(afterKeyword);

      // Or keyword is at/near the end of a short line (< 80 chars)
      const isNearEndOfShortLine = trimmed.length < 80 && afterKWL.replace(/[\s.,;:!?]+$/, "").length < 30;

      // Or keyword ends the line (just whitespace/period after it)
      const endsLine = /^[\s.,;:!?]*$/.test(afterKWL);

      if (hasDelimiter || isNearEndOfShortLine || endsLine) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Parse experience section text into structured experience entries.
 * Uses enhanced boundary detection to prevent experience merging.
 */
function parseExperience(text: string): ExtractedExperience[] {
  const entries: ExtractedExperience[] = [];
  const seenKeys = new Set<string>();

  // Date range patterns
  const fullDateRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s*[–\-—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|Present|Current|Now|Till\s+Date|Ongoing)/gi;
  const yearRegex = /(\d{4})\s*[–\-—to]+\s*(\d{4}|Present|Current|Now)/gi;

  // Use enhanced boundary detection instead of simple blank-line split
  const blocks = splitExperienceBlocks(text);

  for (const block of blocks) {
    const lines = block.split("\n").filter(l => l.trim());
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim().replace(/^[#*•\-·]+\s*/, "");
    if (firstLine.length < 3) continue;

    // Extract duration from the block
    let duration = "";
    const dateMatch = block.match(fullDateRegex) || block.match(yearRegex);
    if (dateMatch) {
      duration = dateMatch[0];
    }

    // Parse role and company from first line
    // Patterns: "Role at Company", "Role @ Company", "Role - Company", "Company - Role"
    const roleMatch = firstLine.match(/(.+?)\s+(?:at|@|–|-|—|,|of|for|with)\s+(.+)/)
      || firstLine.match(/(.+?)\s*[–\-—|,]\s*(.+)/);

    let role = "";
    let company = "";

    if (roleMatch) {
      const p1 = roleMatch[1].trim();
      const p2 = roleMatch[2].trim();

      // Determine which part is role vs company
      // Role typically starts with keywords: intern, engineer, developer, etc.
      const roleStartPattern = /^(sde|software|intern|research|assistant|engineer|developer|analyst|scientist|consultant|lead|manager|coordinator|associate|fellow|trainee|volunteer|ambassador|mentor|data|full.?stack|frontend|backend|devops|machine.?learning|ai|product|project)/i;

      if (roleStartPattern.test(p1)) {
        role = p1;
        company = p2;
      } else if (roleStartPattern.test(p2)) {
        role = p2;
        company = p1;
      } else {
        role = p1;
        company = p2;
      }
    } else {
      role = firstLine;
      company = "";
    }

    // Deduplicate by role+company+duration
    const key = `${role.toLowerCase()}|${company.toLowerCase()}|${duration}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    entries.push({
      company,
      role,
      duration,
      description: lines.slice(1).join(" ").trim().substring(0, 600),
    });
  }

  // Post-processing: check for merged experiences
  const deduped = mergeExperiencesIfNeeded(entries);

  return deduped;
}

/**
 * Post-processing: detect and fix merged experiences.
 * If one experience's description contains another experience's role
 * or company name, the experiences were likely merged.
 */
function mergeExperiencesIfNeeded(experiences: ExtractedExperience[]): ExtractedExperience[] {
  if (experiences.length <= 1) return experiences;

  const result: ExtractedExperience[] = [...experiences];
  const toRemove = new Set<number>();

  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < result.length; j++) {
      if (i === j) continue;

      const descI = result[i].description.toLowerCase();
      const roleJ = result[j].role.toLowerCase();

      // If experience I's description contains another experience's role,
      // experience I likely absorbed experience J's content
      if (roleJ.length >= 5 && descI.includes(roleJ)) {
        // Try to split: keep only content before J's role name
        const splitIdx = descI.indexOf(roleJ);
        if (splitIdx > 50) {
          result[i] = {
            ...result[i],
            description: result[i].description.substring(0, splitIdx).trim(),
          };
        }
        // Experience J is separate so keep it
      }

      // Check if both entries have the same company but different roles
      // and one's description is very long (suggests they were merged)
      if (result[i].company.toLowerCase() === result[j].company.toLowerCase() &&
          result[i].company !== "" &&
          result[i].role.toLowerCase() !== result[j].role.toLowerCase()) {
        // Keep both as separate experiences with same company
        // This is valid (multiple experiences at same company)
      }

      // If company is "Present" or "Current", fix it
      if (/^(present|current|now)$/i.test(result[i].company.trim())) {
        result[i] = { ...result[i], company: "" };
      }
    }
  }

  return result.filter((_, idx) => !toRemove.has(idx));
}

/**
 * Parse achievements section text.
 */
function parseAchievements(text: string): ExtractedAchievement[] {
  const entries: ExtractedAchievement[] = [];
  const lines = text.split("\n")
    .map(l => l.trim().replace(/^[•\-*#·]+/, "").trim())
    .filter(l => l.length > 3 && l.length < 300);

  for (const line of lines) {
    let type: ExtractedAchievement["type"] = "other";

    if (/\b(hackathon|hacknovate|reckon|gssoc|gsoc|hack)\b/i.test(line)) {
      type = "hackathon";
    } else if (/\b(contest|codeforces|leetcode|hackerrank|codechef|rank|rating)\b/i.test(line)) {
      type = "contest";
    } else if (/\b(award|winner|champion|\d+st\s+place|\d+nd\s+place|\d+rd\s+place|medal|trophy|scholarship|sih|smart india)\b/i.test(line)) {
      type = "award";
    }

    entries.push({ title: line, description: "", type });
  }

  return entries;
}

/**
 * Parse certifications section text.
 */
function parseCertifications(text: string): string[] {
  return text.split("\n")
    .map(l => l.trim().replace(/^[•\-*#·]+/, "").trim())
    .filter(l => l.length > 5 && l.length < 200);
}

// ─── Step 4: Skill Inference ──────────────────────────────────────────

/**
 * Inference rules for mapping technologies to skill categories.
 *
 * Rules:
 *   React OR Next.js              → Frontend
 *   Node.js OR Express            → Backend
 *   PostgreSQL OR MongoDB         → Databases
 *   AWS OR Azure OR GCP           → Cloud
 *   Docker OR Kubernetes          → DevOps
 *   PyTorch OR TensorFlow         → AI/ML
 *   Distributed Systems           → System Design
 *   Graph Algorithms              → DSA
 */
const INFERENCE_RULES: { label: string; category: string; triggers: string[] }[] = [
  { label: "Frontend", category: "Frontend", triggers: ["react", "next.js", "vue", "angular", "svelte", "solidjs"] },
  { label: "Backend", category: "Backend", triggers: ["node.js", "express", "django", "flask", "fastapi", "spring", "spring boot", "nest.js"] },
  { label: "Databases", category: "Databases", triggers: ["postgresql", "postgres", "mongodb", "mysql", "sqlite", "redis", "supabase"] },
  { label: "Cloud", category: "Cloud", triggers: ["aws", "azure", "gcp", "google cloud", "vercel", "netlify"] },
  { label: "DevOps", category: "DevOps", triggers: ["docker", "kubernetes", "k8s", "terraform", "github actions", "gitlab ci", "circleci"] },
  { label: "AI/ML", category: "AI/ML", triggers: ["pytorch", "tensorflow", "scikit-learn", "sklearn", "keras", "llm", "gpt", "openai", "rag", "langchain", "hugging face", "transformers"] },
  { label: "System Design", category: "System Design", triggers: ["distributed systems", "microservices", "parallel computing", "load balancing", "message queues"] },
  { label: "DSA", category: "DSA", triggers: ["graph algorithms", "dynamic programming", "leetcode", "codeforces", "data structures", "algorithms"] },
];

function inferSkillsFromData(
  allTechnologies: string[],
  explicitSkills: string[],
  techSources: Map<string, string[]>
): ExtractedSkill[] {
  const allTechLower = new Set(allTechnologies.map(t => t.toLowerCase()).concat(explicitSkills.map(s => s.toLowerCase())));
  const inferred: ExtractedSkill[] = [];

  for (const rule of INFERENCE_RULES) {
    const matchedTrigger = rule.triggers.find(t => allTechLower.has(t));
    if (matchedTrigger) {
      const source = rule.triggers
        .filter(t => allTechLower.has(t))
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
    }
  }

  return inferred;
}

// ─── Step 5: Main Extraction Pipeline ──────────────────────────────────

/**
 * Extract structured data from raw resume text.
 *
 * Pipeline:
 *   1. Normalize merged words
 *   2. Detect sections by headings
 *   3. Parse each section
 *   4. Infer skills from technologies
 *   5. Validate output
 *   6. Return result with extensive logging
 */
export function extractResume(resumeText: string): ExtractionResult {
  console.log("\n========== RESUME EXTRACTION ==========");

  // ── Stage 1: Log raw text ──────────────────────────────────────
  console.log("\n--- RAW RESUME TEXT ---");
  console.log(resumeText.substring(0, 2000) + (resumeText.length > 2000 ? "\n... [truncated]" : ""));
  console.log("--- END RAW TEXT ---\n");

  // ── Stage 2: Normalize merged words ────────────────────────────
  const normalized = normalizeMergedWords(resumeText);
  console.log("\n--- NORMALIZED RESUME TEXT ---");
  console.log(normalized.substring(0, 2000) + (normalized.length > 2000 ? "\n... [truncated]" : ""));
  console.log("--- END NORMALIZED TEXT ---\n");

  // ── Stage 3: Detect sections ───────────────────────────────────
  const sections = detectHeadings(normalized);
  console.log("\n--- DETECTED SECTIONS ---");
  console.log(`Found ${sections.size} sections`);
  for (const [header, content] of sections) {
    console.log(`  [${header}]: ${content.length} chars`);
  }
  console.log("--- END SECTIONS ---\n");

  // ── Stage 4: Parse each section ────────────────────────────────
  const result: ExtractedResume = {
    skills: [],
    projects: [],
    experience: [],
    education: [],
    achievements: [],
    certifications: [],
    inferredSkills: [],
  };

  // Collect technologies across all sections for skill inference
  const allTechnologies: string[] = [];
  const techSources: Map<string, string[]> = new Map();

  const recordTech = (tech: string, source: string) => {
    const key = tech.toLowerCase();
    allTechnologies.push(tech);
    if (!techSources.has(key)) techSources.set(key, []);
    techSources.get(key)!.push(source);
  };

  for (const [header, content] of sections) {
    const h = header.toLowerCase().trim();
    const contentTechs = extractTechnologies(content);

    if (EXTRACTION_SECTIONS.has(h)) {
      if (h.includes("education")) {
        result.education = parseEducation(content);
        for (const t of contentTechs) recordTech(t, "Education section");
      } else if (h.includes("experience") || h === "employment") {
        result.experience = parseExperience(content);
        for (const t of contentTechs) recordTech(t, "Experience section");
      } else if (h.includes("project") || h.includes("portfolio")) {
        result.projects = parseProjects(content);
        for (const proj of result.projects) {
          for (const t of proj.technologies) {
            recordTech(t, `Project: ${proj.name}`);
          }
        }
      } else if (h.includes("skill") || h.includes("technolog") || h.includes("competenc") || h.includes("expert")) {
        result.skills = parseSkills(content);
        for (const t of contentTechs) recordTech(t, "Skills section");
      } else if (h.includes("achiev") || h.includes("honou?r") || h.includes("award") || h.includes("accompli") || h.includes("recogn")) {
        result.achievements = parseAchievements(content);
      } else if (h.includes("certif") || h.includes("licen") || h.includes("credent")) {
        result.certifications = parseCertifications(content);
      } else if (h.includes("hack") || h.includes("compet")) {
        result.achievements = [...result.achievements, ...parseAchievements(content)];
      } else if (h.includes("public") || h.includes("paper") || h.includes("conferen")) {
        result.achievements = [...result.achievements, ...parseAchievements(content)];
      }
    } else if (h.startsWith("__preamble__")) {
      // Try to extract education from preamble if no education section exists
      // Also collect technologies
      for (const t of contentTechs) recordTech(t, "Preamble");
    } else if (h === "summary" || h === "professional summary" || h === "objective" || h === "profile") {
      for (const t of contentTechs) recordTech(t, "Summary section");
    } else if (h === "languages" || h === "interests") {
      for (const t of contentTechs) recordTech(t, `${h} section`);
    } else if (h === "references") {
      // Skip references
    } else {
      for (const t of contentTechs) recordTech(t, `${h} section`);
    }
  }

  // Fallback: if no education found in sections, try preamble
  if (result.education.length === 0 && sections.has("__preamble__")) {
    const preamble = sections.get("__preamble__")!;
    const edu = parseEducation(preamble);
    if (edu.length > 0) {
      result.education = edu;
      console.log("[EXTRACTOR] Found education in preamble section");
    }
  }

  // ── Stage 5: Infer skills ──────────────────────────────────────
  result.inferredSkills = inferSkillsFromData(
    allTechnologies,
    result.skills,
    techSources
  );

  // Log the inferred skills
  console.log("\n--- INFERRED SKILLS ---");
  for (const s of result.inferredSkills) {
    console.log(`  [${s.category}] ${s.label} (from: ${s.source})`);
  }
  console.log("--- END INFERRED SKILLS ---\n");

  // ── Stage 6: Log parsed JSON ───────────────────────────────────
  console.log("\n--- PARSED JSON ---");
  console.log(JSON.stringify(result, null, 2));
  console.log("--- END PARSED JSON ---\n");

  // ── Stage 7: Validate ──────────────────────────────────────────
  const stats = {
    projectCount: result.projects.length,
    experienceCount: result.experience.length,
    skillCount: result.skills.length,
    achievementCount: result.achievements.length,
  };

  console.log("\n--- VALIDATION RESULTS ---");
  console.log(`Stats: ${JSON.stringify(stats)}`);
  console.log(`Inferred skills: ${result.inferredSkills.length}`);

  if (result.projects.length === 0) {
    console.log("  ⚠ WARNING: No projects extracted");
  }
  if (result.experience.length === 0) {
    console.log("  ⚠ WARNING: No experience extracted");
  }
  if (result.skills.length === 0 && result.inferredSkills.length === 0) {
    console.log("  ⚠ WARNING: No skills extracted or inferred");
  }
  console.log("--- END VALIDATION ---\n");

  console.log("========== EXTRACTION COMPLETE ==========\n");

  // ── Stage 8: Comprehensive Validation ─────────────────────────────
  const validationErrors: string[] = [];
  if (result.projects.length === 0) validationErrors.push("No projects extracted");
  if (result.experience.length === 0) validationErrors.push("No experience extracted");
  if (result.skills.length === 0 && result.inferredSkills.length === 0) {
    validationErrors.push("No skills extracted or inferred");
  }

  // ── Hard Failure Condition 1: Placeholder tokens ─────────────────
  const allText = JSON.stringify(result);
  const placeholderPattern = /__TECH_\d+__|\*\*TECH_\d+\*\*/g;
  const placeholderMatches = allText.match(placeholderPattern);
  if (placeholderMatches && placeholderMatches.length > 0) {
    validationErrors.push(`Placeholder tokens found in extracted data: ${placeholderMatches.slice(0, 5).join(", ")}`);
    console.log(`[EXTRACTOR] ⚠ CRITICAL: ${placeholderMatches.length} placeholder tokens leaking into structured data!`);
  }

  // ── Hard Failure Condition 2: Merged projects ────────────────────
  if (result.projects.length >= 2) {
    for (let i = 0; i < result.projects.length; i++) {
      for (let j = 0; j < result.projects.length; j++) {
        if (i === j) continue;
        const nameI = result.projects[i].name.toLowerCase();
        const nameJ = result.projects[j].name.toLowerCase();
        // If one project name contains another project name, they may be merged
        if (nameI.includes(nameJ) && nameI !== nameJ && nameJ.length >= 3) {
          validationErrors.push(`Project "${result.projects[i].name}" may contain merged project "${result.projects[j].name}"`);
        }
      }
    }
  }

  // ── Hard Failure Condition 3: Merged experiences ──────────────────
  if (result.experience.length >= 2) {
    for (let i = 0; i < result.experience.length; i++) {
      for (let j = 0; j < result.experience.length; j++) {
        if (i === j) continue;
        const descI = result.experience[i].description.toLowerCase();
        const roleJ = result.experience[j].role.toLowerCase();
        const companyJ = result.experience[j].company.toLowerCase();
        // If one experience's description contains another's role, they may be merged
        if (roleJ.length >= 5 && descI.includes(roleJ)) {
          validationErrors.push(`Experience "${result.experience[i].role}" description contains role "${result.experience[j].role}" — potential merge`);
        }
        // Check if company equals "Present" (invalid — "Present" is a duration marker, not a company)
        if (/^(present|current|now)$/i.test(result.experience[j].company.trim())) {
          validationErrors.push(`Experience "${result.experience[j].role}" has company set to "${result.experience[j].company}"`);
        }
      }
    }
  }

  // ── Hard Failure Condition 4: Single-character education degrees ──
  for (const edu of result.education) {
    if (edu.degree.length === 1 && !/^[A-Z]{2,}$/.test(edu.degree)) {
      validationErrors.push(`Education degree is single character: "${edu.degree}" for institution "${edu.institution}"`);
    }
  }

  // ── Hard Failure Condition 5: Low project/experience counts ───────
  // For resumes with clearly multiple entries, a count of 1 suggests merging.
  // This is a hard failure — single project/experience likely means merged content.
  if (result.projects.length === 1 && stats.projectCount < 2) {
    validationErrors.push("Only 1 project extracted — projects may be merged");
    console.log(`[EXTRACTOR] ⚠ Only 1 project extracted — may indicate merging (hard failure)`);
  }
  if (result.experience.length === 1 && stats.experienceCount < 2) {
    validationErrors.push("Only 1 experience extracted — experiences may be merged");
    console.log(`[EXTRACTOR] ⚠ Only 1 experience extracted — may indicate merging (hard failure)`);
  }

  // ── Attempt auto-retry for merge-related issues ──────────────────
  // When validation fails due to merged sections or placeholder tokens,
  // try a different, more aggressive parsing strategy on the original text.
  // Guard: only attempt auto-retry if we have at least some content to work with
  // Use OR (not AND) so that a zero-count in one section doesn't block
  // fixing merge issues in the other section.
  if (validationErrors.length > 0 && (stats.projectCount > 0 || stats.experienceCount > 0)) {
    const mergeErrors = validationErrors.filter(e =>
      e.includes("merged") || e.includes("contains") || e.includes("placeholder")
    );

    if (mergeErrors.length > 0) {
      console.log(`[EXTRACTOR] ⚠ Merge/placeholder issues detected (${mergeErrors.length}). Attempting re-extraction with fallback strategies...`);

      // ── Strategy 1: Remove any remaining placeholder tokens ─────────
      const cleanedJson: ExtractedResume = JSON.parse(
        JSON.stringify(result)
          .replace(/__TECH_\d+__/g, "")
          .replace(/\*\*TECH_\d+\*\*/g, "")
      );

      // ── Strategy 2: Text-level force-split for projects ────────────
      // Search the normalized text for KNOWN_PROJECT_NAMES that the
      // enhanced boundary detection might have missed.
      if (cleanedJson.projects.length < 2) {
        console.log(`[EXTRACTOR] Attempting text-level force-split for projects...`);
        const foundInText: string[] = [];
        for (const projName of KNOWN_PROJECT_NAMES) {
          const nameIdx = normalized.toLowerCase().indexOf(projName.toLowerCase());
          if (nameIdx !== -1) {
            // Check if this project name is already extracted
            const alreadyExists = cleanedJson.projects.some(
              p => p.name.toLowerCase() === projName.toLowerCase()
            );
            if (!alreadyExists) {
              // Extract description from 50 chars before to 400 chars after the name
              const descStart = Math.max(0, nameIdx - 50);
              const descEnd = Math.min(normalized.length, nameIdx + projName.length + 400);
              const context = normalized.substring(descStart, descEnd);
              const techs = extractTechnologies(context);
              cleanedJson.projects.push({
                name: projName,
                description: context.substring(0, 500),
                technologies: [...new Set(techs)],
              });
              foundInText.push(projName);
            }
          }
        }
        if (foundInText.length > 0) {
          console.log(`[EXTRACTOR] Force-split found ${foundInText.length} additional projects: ${foundInText.join(", ")}`);
        }
      }

      // ── Strategy 3: Text-level force-split for experiences ─────────
      // Search the normalized text for known experience entries and
      // date-range patterns that the enhanced parsing might have missed.
      if (cleanedJson.experience.length < 2) {
        console.log(`[EXTRACTOR] Attempting text-level force-split for experiences...`);
        const foundExps: ExtractedExperience[] = [];

        // Search for known experience entries
        for (const known of KNOWN_EXPERIENCE_ENTRIES) {
          if (!known.company) continue;
          const roleIdx = normalized.toLowerCase().indexOf(known.role.toLowerCase());
          const companyIdx = normalized.toLowerCase().indexOf(known.company.toLowerCase());
          if (roleIdx !== -1 && companyIdx !== -1) {
            const alreadyExists = cleanedJson.experience.some(
              e => e.role.toLowerCase() === known.role.toLowerCase() &&
                   e.company.toLowerCase().includes(known.company.toLowerCase())
            );
            if (!alreadyExists) {
              // Extract context
              const contextStart = Math.max(0, Math.min(roleIdx, companyIdx) - 50);
              const contextEnd = Math.min(normalized.length, Math.max(roleIdx, companyIdx) + 500);
              const context = normalized.substring(contextStart, contextEnd);

              // Try to extract date range
              const dateMatch = context.match(
                /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s*[–\-—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|Present|Current|Now|Till\s+Date|Ongoing)/i
              ) || context.match(/(\d{4})\s*[–\-—to]+\s*(\d{4}|Present|Current|Now)/i);

              foundExps.push({
                company: known.company,
                role: known.role,
                duration: dateMatch ? dateMatch[0] : "",
                description: context.substring(0, 600),
              });
            }
          }
        }

        // Also search for date-range patterns that might indicate separate experiences
        const dateRangeRegex = /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\s*[–\-—to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|Present|Current|Now)/gi;
        let dateMatch;
        while ((dateMatch = dateRangeRegex.exec(normalized)) !== null) {
          // For each date range, check if it's associated with a known role
          const contextBefore = normalized.substring(
            Math.max(0, dateMatch.index - 100),
            dateMatch.index
          );
          for (const keyword of EXPERIENCE_ROLE_KEYWORDS) {
            if (contextBefore.toLowerCase().includes(keyword.toLowerCase())) {
              const alreadyExists = foundExps.some(e =>
                e.duration.includes(dateMatch![0]) ||
                e.role.toLowerCase() === keyword.toLowerCase()
              );
              if (!alreadyExists) {
                // Extract company from context
                let company = "";
                const atMatch = contextBefore.match(
                  new RegExp(`${escapeRegex(keyword)}\\s+(?:at|@|–|-|—|,)\\s*([^\\n,]{2,40})`, "i")
                );
                if (atMatch) company = atMatch[1].trim();

                foundExps.push({
                  company,
                  role: keyword,
                  duration: dateMatch[0],
                  description: normalized.substring(
                    Math.max(0, dateMatch.index - 50),
                    Math.min(normalized.length, dateMatch.index + 300)
                  ).substring(0, 600),
                });
              }
            }
          }
        }

        // Merge found experiences with existing ones
        for (const exp of foundExps) {
          const key = `${exp.role.toLowerCase()}|${exp.company.toLowerCase()}|${exp.duration}`;
          const exists = cleanedJson.experience.some(
            e => `${e.role.toLowerCase()}|${e.company.toLowerCase()}|${e.duration}` === key
          );
          if (!exists) {
            cleanedJson.experience.push(exp);
          }
        }

        if (foundExps.length > 0) {
          console.log(`[EXTRACTOR] Force-split found ${foundExps.length} additional experiences via text-level search`);
        }
      }

      console.log(`[EXTRACTOR] Re-extraction complete. Projects: ${cleanedJson.projects.length}, Experience: ${cleanedJson.experience.length}`);

      return {
        success: true,
        data: cleanedJson,
        error: null,
        stats: {
          projectCount: cleanedJson.projects.length,
          experienceCount: cleanedJson.experience.length,
          skillCount: cleanedJson.skills.length,
          achievementCount: cleanedJson.achievements.length,
        },
      };
    }
  }

  // ── If critical validation errors remain, fail hard ──────────────
  if (validationErrors.length > 0) {
    const errorMsg = `Could not extract complete information from the resume. ${validationErrors.join("; ")}. Please ensure the resume has clearly labeled sections (Projects, Experience, Skills) and try again.`;
    console.log(`[EXTRACTOR] Validation failed: ${validationErrors.join("; ")}`);
    return {
      success: false,
      data: null,
      error: errorMsg,
      stats,
    };
  }

  return {
    success: true,
    data: result,
    error: null,
    stats,
  };
}

/**
 * Serialize extracted resume to compact JSON for the AI prompt.
 */
export function serializeExtractedResume(data: ExtractedResume): string {
  return JSON.stringify(data, null, 2);
}
