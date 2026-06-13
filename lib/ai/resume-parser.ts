/**
 * lib/ai/resume-parser.ts
 *
 * Intelligent resume parser that extracts structured data from raw resume text.
 * Uses advanced heuristics for project detection, skill inference, experience parsing,
 * and entity extraction. The structured output replaces raw resume text in the
 * analysis prompt, significantly reducing token usage while improving quality.
 */

export interface ParsedResume {
  education: ParsedEducation[];
  skills: string[];
  projects: ParsedProject[];
  experiences: ParsedExperience[];
  achievements: string[];
  certifications: string[];
  summary: string;
  leadership: string[];
  openSource: string[];
  research: string[];
  hackathons: string[];
  publications: string[];
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  field?: string;
  year?: string;
  gpa?: string;
}

export interface ParsedProject {
  name: string;
  technologies: string[];
  description: string;
  features: string[];
  domain: string;
  hasAI: boolean;
  hasML: boolean;
  hasCloud: boolean;
  hasScalability: boolean;
  complexity: "Low" | "Medium" | "High" | "Very High";
}

export interface ParsedExperience {
  role: string;
  company: string;
  duration: string;
  description: string;
  isResearch: boolean;
  isInternship: boolean;
  technologies: string[];
  numericalMetrics: string[];
  actionVerbs: string[];
}

// ─── Comprehensive technology keyword map ─────────────────────────────

const TECH_KEYWORDS: Record<string, string[]> = {
  "Programming Languages": [
    "Python", "Java", "JavaScript", "TypeScript", "Go", "Golang", "Rust",
    "C++", "C", "C#", "Ruby", "Swift", "Kotlin", "Scala", "PHP", "Perl",
    "R", "MATLAB", "Dart", "Lua", "Haskell", "Elixir", "Clojure", "Solidity",
    "Zig", "Nim", "OCaml", "Erlang", "F#", "Assembly", "COBOL", "Fortran",
  ],
  "Frontend": [
    "React", "Next.js", "NextJS", "Next", "Vue", "Vue.js", "Angular",
    "Svelte", "SolidJS", "Remix", "Gatsby", "Nuxt", "HTML", "CSS",
    "Tailwind", "Bootstrap", "Sass", "SCSS", "Less", "Styled Components",
    "Redux", "Zustand", "Jotai", "Recoil", "MobX", "jQuery", "D3.js",
    "Three.js", "WebGL", "Canvas", "Framer Motion", "GSAP",
    "Webpack", "Vite", "esbuild", "Parcel", "Rollup", "Babel",
  ],
  "Backend": [
    "Node.js", "NodeJS", "Express", "Django", "Flask", "FastAPI",
    "Spring", "Spring Boot", "ASP.NET", "Laravel", "Rails", "Ruby on Rails",
    "Phoenix", "Actix", "Axum", "Gin", "Echo", "Fiber",
    "Nest.js", "NestJS", "Next.js", "NextJS",
    "GraphQL", "Apollo", "tRPC", "REST", "gRPC",
    "WebSocket", "Socket.io", "RabbitMQ", "Kafka", "NATS",
    "Postman", "Swagger", "OpenAPI", "HATEOAS",
  ],
  "Databases": [
    "PostgreSQL", "Postgres", "MongoDB", "MySQL", "SQLite", "MariaDB",
    "Redis", "Elasticsearch", "Cassandra", "DynamoDB", "CouchDB",
    "Firebase", "Supabase", "PlanetScale", "Neon", "CockroachDB",
    "ClickHouse", "InfluxDB", "TimescaleDB", "Neo4j", "ArangoDB",
    "Prisma", "Drizzle", "TypeORM", "Sequelize", "Mongoose",
    "SQL", "NoSQL", "Vector Database", "Pinecone", "Weaviate",
    "ChromaDB", "Qdrant", "Milvus",
  ],
  "Cloud": [
    "AWS", "Amazon Web Services", "EC2", "S3", "Lambda", "CloudFront",
    "ECS", "EKS", "Fargate", "RDS", "DynamoDB (AWS)", "SQS", "SNS",
    "API Gateway", "Route 53", "CloudWatch", "IAM",
    "Azure", "Google Cloud", "GCP", "Cloud Run", "GKE", "BigQuery",
    "Cloud Functions", "App Engine", "Firestore", "Cloud Storage",
    "DigitalOcean", "Linode", "Vercel", "Netlify", "Railway",
    "Fly.io", "Render", "Heroku",
  ],
  "DevOps": [
    "Docker", "Kubernetes", "K8s", "Terraform", "Ansible", "Pulumi",
    "CI/CD", "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI",
    "ArgoCD", "Helm", "Prometheus", "Grafana", "Datadog",
    "New Relic", "Sentry", "ELK Stack", "Filebeat", "Logstash",
    "Nginx", "Apache", "HAProxy", "Envoy", "Istio", "Linkerd",
    "Linux", "Bash", "Shell Scripting", "Makefile",
  ],
  "AI/ML": [
    "Machine Learning", "ML", "Deep Learning", "DL", "Neural Networks",
    "LLM", "LLMs", "Large Language Model", "GPT", "OpenAI",
    "Claude", "Gemini", "Llama", "Mistral", "Hugging Face",
    "Transformers", "BERT", "T5", "Stable Diffusion", "Diffusion Models",
    "RAG", "Retrieval Augmented Generation", "Embeddings",
    "Vector Embedding", "Semantic Search", "Vector Search",
    "TensorFlow", "TF", "PyTorch", "JAX", "Keras",
    "Scikit-learn", "scikit-learn", "sklearn", "XGBoost",
    "LightGBM", "CatBoost", "Pandas", "NumPy", "SciPy",
    "NLP", "Natural Language Processing", "Computer Vision", "CV",
    "OpenCV", "YOLO", "LangChain", "LlamaIndex", "Haystack",
    "CrewAI", "AutoGen", "Agents", "AI Agents",
    "Fine-tuning", "LoRA", "QLoRA", "RLHF", "DPO",
    "Prompt Engineering", "Chain of Thought", "ReAct",
    "Speech Recognition", "ASR", "TTS", "Whisper",
    "Reinforcement Learning", "RL", "GANs", "VAE",
    "Data Science", "Data Mining", "Statistical Analysis",
    "A/B Testing", "Experimental Design", "Hypothesis Testing",
    "MLOps", "MLflow", "Weights & Biases", "wandb",
    "Model Serving", "TensorRT", "ONNX", "Triton",
  ],
  "System Design": [
    "Microservices", "Monolith", "Event-Driven Architecture",
    "CQRS", "Event Sourcing", "Saga Pattern", "Circuit Breaker",
    "Load Balancing", "Caching", "CDN", "Rate Limiting",
    "Distributed Systems", "Consensus", "Paxos", "Raft",
    "Sharding", "Partitioning", "Replication", "Consistency",
    "CAP Theorem", "ACID", "BASE", "Two-Phase Commit",
    "Message Queues", "Pub/Sub", "Stream Processing",
    "Bloom Filter", "Merkle Tree", "Consistent Hashing",
    "Monitoring", "Observability", "Tracing", "Telemetry",
  ],
  "Security": [
    "OAuth", "OAuth2", "JWT", "SAML", "OpenID Connect",
    "Authentication", "Authorization", "RBAC", "ABAC",
    "Encryption", "HTTPS", "SSL/TLS", "Hashing", "bcrypt",
    "XSS", "CSRF", "SQL Injection", "CORS",
    "Penetration Testing", "Security Audit", "Vulnerability Assessment",
    "Zero Trust", "IAM", "Secrets Management",
  ],
  "Mobile": [
    "React Native", "Expo", "Flutter", "SwiftUI", "UIKit",
    "Android", "Kotlin Multiplatform", "Ionic", "Capacitor",
    "Mobile Development", "iOS", "Android Development",
  ],
  "Blockchain": [
    "Blockchain", "Ethereum", "Solana", "Web3", "Smart Contracts",
    "Solidity", "Rust (Blockchain)", "DeFi", "NFT",
    "Hardhat", "Foundry", "web3.js", "ethers.js",
  ],
  "Testing": [
    "Unit Testing", "Integration Testing", "E2E Testing",
    "Jest", "Mocha", "Chai", "Cypress", "Playwright",
    "Selenium", "Puppeteer", "Vitest", "React Testing Library",
    "TDD", "Test-Driven Development", "BDD",
  ],
};

// All tech keywords flattened for regex matching, sorted longest-first to avoid partial matches
const ALL_TECH_KEYWORDS = Object.values(TECH_KEYWORDS).flat();
// Sort by length descending so "Next.js" matches before "Next"
const SORTED_TECH_KEYWORDS = [...new Set(ALL_TECH_KEYWORDS.map(k => k.trim()).filter(Boolean))]
  .sort((a, b) => b.length - a.length);
const TECH_REGEX = new RegExp(`\\b(${SORTED_TECH_KEYWORDS.map(escapeRegex).join("|")})\\b`, "gi");

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Section detection ────────────────────────────────────────────────

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
  /^technical reports$/im,
  /^thesis$/im,
];

function detectSections(text: string): Map<string, string> {
  const sections = new Map<string, string>();
  let currentHeader = "__preamble__";
  let currentStart = 0;

  const lines = text.split("\n");
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

// ─── Education parser ──────────────────────────────────────────────────

function parseEducation(text: string): ParsedEducation[] {
  const entries: ParsedEducation[] = [];
  const lines = text.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Match patterns like: "B.Tech CSE, SRM University, 9.25 CGPA"
    // or "SRM University | B.Tech Computer Science | 9.25"
    // or "Bachelor of Technology in Computer Science - SRM University"
    const eduMatch = trimmed.match(
      /(.+?)(?:\s*[|,–\-—]\s*)(.+?)(?:\s*[|,–\-—]\s*)?(?:\s*(?:CGPA|GPA|Percentage|Score|%)\s*[:\-–]?\s*(\d+\.?\d*))?/i
    );
    
    // Try to identify degree vs institution
    const degreeKeywords = /(B\.?Tech|Bachelor|M\.?Tech|Master|PhD|B\.?E|M\.?E|B\.?Sc|M\.?Sc|B\.?A|M\.?A|BBA|MBA|BCA|MCA|B\.?Com|M\.?Com|Diploma|Higher Secondary|HSC|SSC|Class\s+X|Class\s+XII)/i;
    
    if (eduMatch) {
      const part1 = eduMatch[1].trim();
      const part2 = eduMatch[2].trim();
      const gpa = eduMatch[3]?.trim();
      
      // Determine which is degree and which is institution
      if (degreeKeywords.test(part1)) {
        entries.push({
          degree: part1,
          institution: part2,
          gpa: gpa,
        });
      } else if (degreeKeywords.test(part2)) {
        entries.push({
          degree: part2,
          institution: part1,
          gpa: gpa,
        });
      } else {
        entries.push({
          institution: part1,
          degree: part2,
          gpa: gpa,
        });
      }
    } else if (trimmed.length > 5 && trimmed.length < 150) {
      // Check for CGPA/GPA mentions
      const gpaMatch = trimmed.match(/(\d+\.?\d*)\s*(?:\/10|%)?(?:\s*CGPA|\s*GPA|\s*Percentage)/i);
      const gpa = gpaMatch ? gpaMatch[1] : undefined;
      
      // Check if it contains degree info
      if (degreeKeywords.test(trimmed)) {
        entries.push({
          institution: trimmed,
          degree: "",
          gpa: gpa,
        });
      } else {
        entries.push({
          institution: trimmed,
          degree: "",
          gpa: gpa,
        });
      }
    }
  }
  return entries;
}

// ─── Skills parser ─────────────────────────────────────────────────────

function parseSkills(text: string): string[] {
  const skills: string[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Split by common delimiters: comma, pipe, bullet, dash
    const items = trimmed.split(/[,|•–\-·•·•]+/).map((s) => s.trim()).filter(Boolean);
    
    for (const item of items) {
      const cleaned = item
        .replace(/^[•\-*#]+/, "")
        .replace(/^:+/, "")
        .trim();
      
      if (cleaned.length > 1 && cleaned.length < 60 && 
          !SECTION_HEADERS.some((re) => re.test(cleaned))) {
        // Normalize: capitalize first letter, remove trailing dots
        const normalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).replace(/\.+$/, "").trim();
        skills.push(normalized);
      }
    }
  }

  // Deduplicate (case-insensitive)
  const seen = new Set<string>();
  return skills.filter(s => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Technology extractor ──────────────────────────────────────────────

function extractTechnologies(text: string): string[] {
  const matches = new Set<string>();
  
  // Try explicit technology sections first
  const techSection = text.match(
    /(?:Technologies?|Tech Stack|Stack|Built with|Tools|Tech used|Languages|Frameworks)[:\-–]\s*(.+)/i
  );
  if (techSection) {
    const explicit = techSection[1].split(/[,|•]+/).map(s => s.trim()).filter(Boolean);
    explicit.forEach(t => {
      const clean = t.replace(/^[•\-*]+/, "").trim();
      if (clean.length > 0 && clean.length < 60) matches.add(clean);
    });
  }

  // Regex match known technologies
  const techMatches = text.matchAll(TECH_REGEX);
  for (const match of techMatches) {
    matches.add(match[1]);
  }

  return [...matches];
}

/**
 * Detect project domain based on technologies and description
 */
function detectDomain(name: string, technologies: string[], description: string): string {
  const text = `${name} ${description} ${technologies.join(" ")}`.toLowerCase();
  
  if (/\b(ai|llm|gpt|rag|machine learning|deep learning|neural|nlp|computer vision|chatbot|recommendation|predictive|classification)\b/i.test(text)) {
    if (/\b(rag|retrieval|vector|embedding|semantic search|knowledge)\b/i.test(text)) {
      return "AI (RAG/LLM)";
    }
    return "AI/ML";
  }
  if (/\b(blockchain|web3|smart contract|nft|crypto|defi|ethereum|solana)\b/i.test(text)) {
    return "Blockchain/Web3";
  }
  if (/\b(microservice|distributed|kubernetes|k8s|docker|cloud|aws|gcp|azure|deployment|devops|ci\/cd)\b/i.test(text)) {
    return "Cloud/DevOps";
  }
  if (/\b(real.time|websocket|live|streaming|realtime)\b/i.test(text)) {
    return "Real-time Systems";
  }
  if (/\b(full.?stack|web app|web application|frontend|backend|api|saas|crm|ecommerce|dashboard)\b/i.test(text)) {
    return "Full Stack Web";
  }
  if (/\b(mobile|android|ios|react native|flutter|app)\b/i.test(text)) {
    return "Mobile Development";
  }
  if (/\b(data science|data analysis|analytics|visualization|dashboard|etl|pipeline|big data)\b/i.test(text)) {
    return "Data Engineering/Analytics";
  }
  if (/\b(security|auth|encryption|penetration|vulnerability)\b/i.test(text)) {
    return "Security";
  }
  if (/\b(game|gaming|unreal|unity|three\.js|webgl|3d|animation)\b/i.test(text)) {
    return "Game Development/Graphics";
  }
  if (/\b(iot|embedded|raspberry|arduino|sensor|hardware|firmware)\b/i.test(text)) {
    return "IoT/Embedded";
  }
  if (/\b(compiler|parser|interpreter|language|dsl|tooling)\b/i.test(text)) {
    return "Developer Tools";
  }
  
  return "General Software Development";
}

/**
 * Detect project complexity based on technologies and description
 */
function detectComplexity(name: string, technologies: string[], description: string): "Low" | "Medium" | "High" | "Very High" {
  const text = `${name} ${description} ${technologies.join(" ")}`.toLowerCase();
  
  const veryHighSignals = [
    /\b(distributed|kubernetes|k8s|microservice|load.?.balancing|partitioning|sharding|replication)\b/i,
    /\b(llm|rag|fine.?tuning|transformer|diffusion|gan)\b/i,
    /\b(real.?time|concurrent|parallel|multi.?threaded|high.?performance)\b/i,
    /\b(compiler|parser|interpreter|programming language|dsl)\b/i,
  ];
  
  const highSignals = [
    /\b(docker|container|orchestration|ci\/cd|pipeline)\b/i,
    /\b(api|graphql|rest|microservice|event.?driven)\b/i,
    /\b(oauth|jwt|auth|encryption|security)\b/i,
    /\b(optimization|caching|redis|elasticsearch|indexing)\b/i,
    /\b(ai|ml|machine learning|deep learning|nlp|computer vision|recommendation)\b/i,
    /\b(full.?stack|web application|saas|platform|system)\b/i,
  ];
  
  const mediumSignals = [
    /\b(crud|database|api|backend|frontend)\b/i,
    /\b(web.?app|mobile.?app|dashboard)\b/i,
    /\b(ci\/cd|testing|deployment|hosting)\b/i,
  ];

  let score = 0;
  for (const sig of veryHighSignals) if (sig.test(text)) score += 4;
  for (const sig of highSignals) if (sig.test(text)) score += 2;
  for (const sig of mediumSignals) if (sig.test(text)) score += 1;
  
  // Bonus for number of technologies
  if (technologies.length >= 5) score += 2;
  else if (technologies.length >= 3) score += 1;

  if (score >= 6) return "Very High";
  if (score >= 4) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

// ─── Project parser ────────────────────────────────────────────────────

function parseProjects(text: string): ParsedProject[] {
  const entries: ParsedProject[] = [];
  // Split by blank lines (paragraph boundaries)
  const blocks = text.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim();
    
    // Extract project name (first line, remove bullets/hashes)
    let name = firstLine
      .replace(/^[#*•\-·]+\s*/, "")
      .split(/[\[\(]/)[0]
      .replace(/[:;]$/, "")
      .trim();
    
    // Filter out section-like headers that aren't project names
    if (name.length < 2 || name.length > 60) continue;
    if (SECTION_HEADERS.some((re) => re.test(name))) continue;
    
    const fullText = lines.slice(1).join(" ").trim();
    const combinedText = name + " " + fullText;
    
    // Extract technologies
    const technologies = extractTechnologies(block);

    // Extract features (bullet points)
    const features: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("-") || trimmed.startsWith("•") || trimmed.startsWith("*") || 
          trimmed.startsWith("–") || /^\d+[.)]/.test(trimmed)) {
        const feature = trimmed.replace(/^[-•*–\d.)\s]+/, "").trim();
        if (feature.length > 5) features.push(feature);
      }
    }

    // Detect AI usage
    const hasAI = /\b(ai|llm|gpt|openai|claude|gemini|rag|embedding|vector|semantic|langchain|llamaindex|hugging\s*face|transformer|neural|nlp|natural language|computer vision|machine learning|deep learning|tensorflow|pytorch)\b/i.test(combinedText);
    const hasML = hasAI || /\b(ml|machine learning|tensorflow|pytorch|scikit|sklearn|xgboost|classification|regression|clustering|prediction|recommendation)\b/i.test(combinedText);
    const hasCloud = /\b(aws|gcp|azure|cloud|deploy|vercel|netlify|heroku|digitalocean|railway|render)\b/i.test(combinedText);
    const hasScalability = /\b(distributed|scalable|high.?perf|load.?balanc|cache|redis|microservice|kubernetes|docker|container|horizontal|vertical.?scal|concurrent|parallel)\b/i.test(combinedText);

    entries.push({
      name: name || "Project",
      technologies,
      description: fullText.substring(0, 500),
      features,
      domain: detectDomain(name, technologies, combinedText),
      hasAI,
      hasML,
      hasCloud,
      hasScalability,
      complexity: detectComplexity(name, technologies, combinedText),
    });
  }

  return entries;
}

// ─── Experience parser ─────────────────────────────────────────────────

function parseExperience(text: string): ParsedExperience[] {
  const entries: ParsedExperience[] = [];
  const blocks = text.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim().replace(/^[#*•\-·]+\s*/, "");

    // Try to extract: Role @ Company, Company - Role, or Role at Company
    const roleMatch = firstLine.match(
      /(.+?)\s+(?:at|@|–|-|—|,|of|for|with)\s+(.+)/
    ) || firstLine.match(
      /(.+?)\s*[–\-—|,]\s*(.+)/
    );

    let role = "";
    let company = "";

    if (roleMatch) {
      const [_, part1, part2] = roleMatch;
      const p1 = part1.trim();
      const p2 = part2.trim();
      
      // Heuristic: shorter part is usually the role (e.g., "SDE Intern @ Amazon")
      // But if one starts with a known role keyword, that's the role
      const roleKeywords = /^(sde|software|intern|research|assistant|engineer|developer|analyst|scientist|consultant|lead|manager|coordinator|associate|fellow|trainee|volunteer)/i;
      
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

    // Extract duration (look for date patterns)
    const durationMatch = block.match(
      /(\w+\s+\d{4})\s*[–\-—to]+\s*(\w+\s+\d{4}|Present|Current|Now|Till\s+Date|Ongoing)/i
    ) || block.match(
      /(\d{4})\s*[–\-—to]+\s*(\d{4}|Present|Current|Now)/i
    );
    const duration = durationMatch
      ? `${durationMatch[1]} – ${durationMatch[2]}`
      : "";

    // Detect if it's research
    const fullText = role + " " + company + " " + lines.slice(1).join(" ");
    const isResearch = /\b(research|thesis|dissertation|lab|laboratory|publication|paper|study|analysis|experiment|investigat)\b/i.test(fullText);
    
    // Detect if it's an internship
    const isInternship = /\b(intern|internship|trainee|summer\s+(intern|fellow|scholar|research))\b/i.test(fullText);
    
    // Extract technologies mentioned in experience description
    const technologies = extractTechnologies(block);
    
    // Extract numerical metrics (numbers, percentages, improvements with numbers)
    const numericalMetrics: string[] = [];
    const numMetricRegex = /(\d+[%x]|\d{2,}\s*[%+]|\d{2,}\s*(?:users|customers|requests|queries|records|documents|files|nodes|servers|containers|instances|calls|transactions|data|points|times|faster|reduction|improvement|increase|decrease))/gi;
    const numMatches = block.match(numMetricRegex);
    if (numMatches) {
      numericalMetrics.push(...numMatches);
    }
    
    // Extract action verbs (what the candidate actually did)
    const actionVerbs: string[] = [];
    const actionRegex = /(improved|increased|decreased|reduced|optimized|achieved|delivered|generated|scaled|handled|processed|managed|led|built|created|developed|designed|implemented|architected|spearheaded|pioneered|established|launched|deployed|engineered|architected|mentored|trained|coordinated|facilitated|automated|streamlined|accelerated|transformed|pioneered|integrated|migrated|consolidated|standardized)/gi;
    const actionMatches = block.match(actionRegex);
    if (actionMatches) {
      actionVerbs.push(...actionMatches);
    }

    entries.push({
      role,
      company,
      duration,
      description: lines.slice(1).join(" ").trim().substring(0, 600),
      isResearch,
      isInternship,
      technologies,
      numericalMetrics,
      actionVerbs,
    });
  }

  return entries;
}

// ─── Achievements parser ───────────────────────────────────────────────

function parseAchievements(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim().replace(/^[•\-*#·]+/, "").trim())
    .filter((l) => l.length > 5 && l.length < 300);
}

// ─── Leadership parser ─────────────────────────────────────────────────

function parseLeadership(text: string): string[] {
  const items: string[] = [];
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    const cleaned = line.replace(/^[•\-*#·]+\s*/, "").trim();
    if (cleaned.length > 5) {
      items.push(cleaned);
    }
  }
  
  return items;
}

// ─── Main parser ───────────────────────────────────────────────────────

/**
 * Parse raw resume text into structured JSON.
 * Uses heuristics for section detection and specialized parsing.
 */
export function parseResume(resumeText: string): ParsedResume {
  const sections = detectSections(resumeText);

  const result: ParsedResume = {
    education: [],
    skills: [],
    projects: [],
    experiences: [],
    achievements: [],
    certifications: [],
    summary: "",
    leadership: [],
    openSource: [],
    research: [],
    hackathons: [],
    publications: [],
  };

  for (const [header, content] of sections) {
    const h = header.toLowerCase().trim();

    if (h === "summary" || h === "professional summary" || h === "objective" || 
        h === "career objective" || h === "profile" || h === "professional profile") {
      result.summary = content.substring(0, 600);
    } else if (h === "education" || h === "courses" || h === "coursework" || h === "relevant coursework" || h === "academic background") {
      result.education = parseEducation(content);
    } else if (h.includes("skill") || h.includes("technical") || h === "languages" || 
               h === "core competencies" || h === "competencies") {
      result.skills = parseSkills(content);
    } else if (h.includes("project") || h.includes("portfolio")) {
      result.projects = parseProjects(content);
    } else if (h.includes("experience") || h.includes("work") || h.includes("professional") || h.includes("employment")) {
      result.experiences = parseExperience(content);
    } else if (h.includes("achievement") || h.includes("honor") || h.includes("award")) {
      result.achievements = parseAchievements(content);
    } else if (h.includes("certification") || h.includes("license") || h.includes("credential")) {
      result.certifications = parseAchievements(content);
    } else if (h.includes("leadership") || h.includes("position") || h.includes("responsibility") || h.includes("extracurricular")) {
      result.leadership = parseLeadership(content);
    } else if (h.includes("open source") || h.includes("open-source")) {
      result.openSource = parseAchievements(content);
    } else if (h.includes("research") || h.includes("thesis") || h.includes("dissertation")) {
      result.research = parseAchievements(content);
    } else if (h.includes("hackathon") || h.includes("competition")) {
      result.hackathons = parseAchievements(content);
    } else if (h.includes("publication") || h.includes("paper") || h.includes("conference") || h.includes("talk") || h.includes("patent")) {
      result.publications = parseAchievements(content);
    }
  }

  // If preamble has content and no dedicated summary, use it
  if (sections.has("__preamble__") && !result.summary) {
    const preamble = sections.get("__preamble__")!;
    // Check if preamble looks like a summary (not too long, not too short)
    if (preamble.length > 20 && preamble.length < 800) {
      result.summary = preamble;
    }
    // If preamble has education info and no education was found
    if (result.education.length === 0) {
      result.education = parseEducation(preamble);
    }
  }

  return result;
}

/**
 * Convert a parsed resume to a compact, high-information string for the AI prompt.
 * Includes structured data, inferred domains, detected features, and metrics.
 * This is significantly smaller than raw resume text while being richer in signal.
 */
export function serializeResume(parsed: ParsedResume): string {
  const parts: string[] = [];

  if (parsed.summary) parts.push(`=== SUMMARY ===\n${parsed.summary}`);

  if (parsed.education.length > 0) {
    parts.push("=== EDUCATION ===");
    for (const e of parsed.education) {
      const fields = [
        e.degree,
        e.institution,
        e.field ? `Field: ${e.field}` : "",
        e.gpa ? `GPA: ${e.gpa}` : "",
        e.year ? `Year: ${e.year}` : "",
      ].filter(Boolean);
      parts.push(`  - ${fields.join(" | ")}`);
    }
  }

  if (parsed.skills.length > 0) {
    parts.push(`=== EXPLICIT SKILLS ===\n${parsed.skills.slice(0, 40).join(", ")}`);
  }

  if (parsed.projects.length > 0) {
    parts.push("=== PROJECTS ===");
    for (const p of parsed.projects) {
      const tags: string[] = [];
      tags.push(p.domain);
      tags.push(p.complexity);
      if (p.hasAI) tags.push("AI-Powered");
      if (p.hasML) tags.push("ML-Enabled");
      if (p.hasCloud) tags.push("Cloud-Deployed");
      if (p.hasScalability) tags.push("Scalable");
      
      const tech = p.technologies.length > 0 ? ` [${p.technologies.slice(0, 10).join(", ")}]` : "";
      const features = p.features.length > 0 ? ` Features: ${p.features.slice(0, 3).join(" | ")}` : "";
      
      parts.push(`  [${tags.join(", ")}] ${p.name}${tech}: ${p.description.substring(0, 300)}${features}`);
    }
  }

  if (parsed.experiences.length > 0) {
    parts.push("=== EXPERIENCE ===");
    for (const e of parsed.experiences) {
      const tags: string[] = [];
      if (e.isResearch) tags.push("RESEARCH");
      if (e.isInternship) tags.push("INTERNSHIP");
      
      const tagStr = tags.length > 0 ? ` [${tags.join(", ")}]` : "";
      const duration = e.duration ? ` (${e.duration})` : "";
      const company = e.company ? ` @ ${e.company}` : "";
      const tech = e.technologies.length > 0 ? ` Tech: ${e.technologies.slice(0, 6).join(", ")}` : "";
      
      parts.push(`  -${tagStr} ${e.role}${company}${duration}: ${e.description.substring(0, 300)}${tech}`);
    }
  }

  if (parsed.achievements.length > 0) {
    parts.push("=== ACHIEVEMENTS ===\n" + parsed.achievements.slice(0, 10).map(a => `  - ${a}`).join("\n"));
  }

  if (parsed.certifications.length > 0) {
    parts.push("=== CERTIFICATIONS ===\n" + parsed.certifications.slice(0, 6).map(c => `  - ${c}`).join("\n"));
  }

  if (parsed.leadership.length > 0) {
    parts.push("=== LEADERSHIP ===\n" + parsed.leadership.slice(0, 5).map(l => `  - ${l}`).join("\n"));
  }

  if (parsed.openSource.length > 0) {
    parts.push("=== OPEN SOURCE ===\n" + parsed.openSource.slice(0, 3).map(o => `  - ${o}`).join("\n"));
  }

  if (parsed.research.length > 0) {
    parts.push("=== RESEARCH ===\n" + parsed.research.slice(0, 5).map(r => `  - ${r}`).join("\n"));
  }

  if (parsed.hackathons.length > 0) {
    parts.push("=== HACKATHONS ===\n" + parsed.hackathons.slice(0, 5).map(h => `  - ${h}`).join("\n"));
  }

  if (parsed.publications.length > 0) {
    parts.push("=== PUBLICATIONS ===\n" + parsed.publications.slice(0, 5).map(p => `  - ${p}`).join("\n"));
  }

  return parts.join("\n\n");
}
