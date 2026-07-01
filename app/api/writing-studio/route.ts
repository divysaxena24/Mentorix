import { NextRequest, NextResponse } from "next/server";
import { chatWithGroq } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import { db } from "@/lib/db/db";
import { writingStudioDocsTable } from "@/lib/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";

function generateLORPrompt(context: string, userDetails: string, tone: string, length: string, docTypeNames: Record<string, string>) {
    let parsedDetails = "";
    let resumeJSONSection = "";

    try {
        const data = JSON.parse(userDetails);

        // Check if this LOR payload includes a `_resumeJSON` field (rich resume data)
        if (data._resumeJSON) {
            resumeJSONSection = `
CANDIDATE RESUME DATA (structured Resume JSON for reference):
${data._resumeJSON}

INSTRUCTIONS FOR USING THE RESUME DATA:
- PRIORITIZE: Achievements, Leadership, Projects, Research, Academic Performance, Technical Strengths.
- Extract specific accomplishments, project outcomes, and leadership examples from the resume.
- Do NOT list everything — select the 2-3 strongest, most relevant examples.
- Use actual project names, technologies, and metrics from the resume.
- Reference specific leadership roles, awards, or recognitions.
- Maintain factual accuracy — do not invent details not present in the resume.
`;
        }

        parsedDetails = `
CANDIDATE INFORMATION:
- Candidate Name: ${data.candidateName || "N/A"}
- Recommender Name: ${data.recommenderName || "N/A"}
- Recommender Designation: ${data.recommenderDesignation || "N/A"}
- Organization/University: ${data.organization || "N/A"}
- Relationship with Candidate: ${data.relationship || "N/A"}
- Duration of Association: ${data.duration || "N/A"}
- Purpose of Recommendation: ${data.purpose || "N/A"}
- Program/Company Applying To: ${data.programApplyingTo || "N/A"}
- Candidate Strengths: ${data.strengths || "N/A"}
- Major Achievements: ${data.achievements || "N/A"}
- Projects: ${data.projects || "N/A"}
- Skills: ${data.skills || "N/A"}
- Additional Instructions: ${data.additionalInstructions || "N/A"}
`;
    } catch {
        parsedDetails = userDetails;
    }

    return `
You are Mentorix, an elite academic and professional recommendation letter writer.
Generate a premium, high-impact Letter of Recommendation (LOR).

FORMATTING RULES (MANDATORY):
- Use MARKDOWN strictly.
- **Bold** key skills, achievements, and superlative qualities.
- Use asterisk (*) for every single item inside lists.
- Structure using ### Triple-Hash Headers for main sections (e.g., ### Introduction, ### Candidate Assessment, ### Specific Examples, ### Recommendation).
- Ensure sharp spacing by adding clear double-newlines between major sections.

RECOMMENDATION LETTER STRUCTURE:
### Introduction
State the recommender's credentials, relationship with the candidate, and duration of association.

### Candidate Assessment
Describe the candidate's strengths, skills, and personal qualities with specific examples.

### Key Achievements & Contributions
Highlight major achievements, projects, and their impact.

### Why This Candidate Stands Out
Provide compelling reasons why this candidate is exceptional for the opportunity.

### Recommendation
Offer a strong, unequivocal endorsement with confidence.

STRATEGY:
- Write from the recommender's perspective using first-person ("I have had the pleasure...")
- Provide specific, detailed examples that demonstrate the candidate's qualities
- Use strong endorsement language ("highly recommend", "exceptional", "outstanding")
- Be credible and specific rather than generic
- Tone: ${tone || "Academic"}. Use ${tone === "Research" ? "research-focused language with emphasis on methodology and intellectual contributions" : tone === "Internship" ? "practical, hands-on language with emphasis on workplace readiness" : tone === "Scholarship" ? "language emphasizing merit, potential, and exceptional qualities" : "formal, respectful language appropriate for academic/professional recommendations"}.
- Length: ${length || "Medium"}.

${parsedDetails}
${resumeJSONSection}
CONTEXT: ${context}

Output ONLY the recommendation letter in Markdown. No conversational filler or introductory remarks.
`;
}

function generateResumeAwarePrompt(context: string, userDetails: string, tone: string, length: string, docType: string, docTypeNames: Record<string, string>): string {
    const docName = docTypeNames[docType] || "Professional Document";

    // Context-aware instructions based on document type
    const docSpecificInstructions: Record<string, string> = {
        cover_letter: `
# Generation Pipeline

Before writing:

STEP 1 — Understand the role.

STEP 2 — Extract the important requirements from the Job Description / Context.
Examples: Backend, Database, Distributed Systems, Cloud, CI/CD, Research, Communication

STEP 3 — Read the Resume JSON.

STEP 4 — Find resume evidence for every important requirement.

STEP 5 — Discard requirements that have no resume evidence.

STEP 6 — Generate the cover letter.

---

# Primary Rule

The Resume JSON is the ONLY source of truth.
Everything written must be supported by the Resume JSON, User Instructions, or Job Description.
Never invent information.

---

# Source Priority

Always use information in this order:
1. User's provided details (Resume JSON / achievements, experience, skills)
2. Job Description / Context
3. Company Information (if evident from context)

Never reverse this order.

---

# Resume Evidence Mapping

Every paragraph must reference resume evidence.

Example:
Requirement: Distributed Systems → Resume: Research Internship → Mention: Internship
Requirement: PostgreSQL → Resume: Mentorix → Mention: Mentorix
Requirement: Docker → Resume: Mentorix → Mention: Docker

Never mention skills without resume evidence.

---

# Hallucination Prevention

Never invent: Technologies, Cloud Platforms, Metrics, Responsibilities, Architecture Experience, Leadership, Awards, Projects, Research, Certifications, Achievements, Future Goals, Database Design, Schema Optimization, Azure, ClickHouse, Cosmos DB, Infrastructure as Code — unless they explicitly exist in the Resume JSON.

If the context requires a technology absent from the resume:
"My experience with PostgreSQL and backend development has provided a strong foundation, and I am eager to expand my expertise in Azure database technologies."

Never pretend the user already knows a technology they haven't used.

---

# Candidate Level Awareness

Automatically detect seniority. If the resume shows Student, Intern, Research Intern, Entry-Level:
- Never write like an architect.
- Never write: "I have extensive experience...", "I led...", "I architected...", "I managed..."
- Instead use: "Through internships...", "My academic and research experiences...", "My projects have enabled me..."

---

# Company Personalization

Always include one paragraph explaining: Why this company?
Mention: Mission, Engineering Culture, Technology, Innovation, Products, Values from the context.
Make this paragraph unique. Never generic.

---

# Smart Resume Selection

Never use the entire resume. Choose:
- Top 2 Experiences
- Top 2 Projects
- Top 5 Skills
- Top 3 Achievements
that best match the JD/Context. Ignore unrelated information. Quality > Quantity.

---

# Project Usage

Do not simply mention project names. Explain impact.

Bad: "I built Mentorix."

Good: "While developing Mentorix, I built backend services using PostgreSQL and Redis, gaining practical experience designing database-driven applications and scalable workflows."

---

# Technical Skills

Never dump technologies.

Bad: Java, Python, React, Next, Node, Express, PostgreSQL, Docker, AWS

Good: "My experience spans backend development, distributed systems research, database-driven applications, containerized deployments, and cloud-native software engineering."

Mention technologies naturally within paragraphs.

---

# Storytelling

Every cover letter should tell a story.

Structure:
Paragraph 1 — Introduce yourself and explain interest in the role.
Paragraph 2 — Most relevant internship/research experience.
Paragraph 3 — Most relevant project with specific technologies and outcomes.
Paragraph 4 — Why this company (mission, culture, products, technology).
Paragraph 5 — Closing with confident summary and call to action.

Avoid resume repetition. Each paragraph should advance the narrative.

---

# Human Writing

Avoid repetitive AI phrases: "I am excited", "I am confident", "I am passionate", "I have a strong foundation"
Vary sentence openings. Use natural transitions. The writing should sound human, not templated.

---

# Strong Evidence

Instead of "I worked on Parallel Computing":
"During my research internship at IIIT Hyderabad, I optimized OpenMP-based graph traversal algorithms, reducing execution time from 900 ms to 150 ms through parallel processing techniques."

Evidence always beats adjectives.

---

# Company Alignment

Instead of "I want to work at Microsoft":
"Microsoft's work on scalable cloud platforms and large-scale data infrastructure strongly aligns with my interests in distributed systems, backend engineering, and high-performance computing."

---

# Remove Generic Sections

Never output: Opening, Strategic Fit, Key Impact, Technical Expertise, Career Aspirations, Closing
Generate a real business letter.

---

# Structure

[Date (optional)]
[Dear Hiring Manager,]

Paragraph 1 — Introduction: Hook with strongest relevant achievement, state the role.
Paragraph 2 — Most relevant internship/research experience.
Paragraph 3 — Most relevant project with specific technologies and outcomes.
Paragraph 4 — Why this company (mission, culture, products, technology).
Final paragraph — Closing: Confident summary and call to action.

[Sincerely,]
[Your Name]

---

# Writing Style

Natural, Professional, Confident, Specific, Warm, Recruiter-friendly, Human-like.
Never sound robotic. Use varied sentence structures.

---

# Length

Target: 350-450 words. Maximum: One page.

---

# Missing Skills

If the context requests something absent from the resume, never pretend the user has it. Instead acknowledge adjacent experience.

Example: "My experience with PostgreSQL and backend development has provided a strong foundation, and I am eager to expand my expertise in Azure database technologies."

---

# Validation Pass

Before returning, check every sentence. Ask: "Can I prove this using the Resume JSON?"
If NO — rewrite. If impossible — delete.

---

# Quality Checklist

✓ Resume-first
✓ Job-specific
✓ Company-specific
✓ Human-like
✓ No hallucinations
✓ No copied JD
✓ No skill dumping
✓ Uses measurable resume evidence
✓ Candidate seniority respected
✓ One page
✓ ATS-friendly
✓ Recruiter-quality

---

# Target Quality

The final cover letter should be comparable to those written by professional career coaches on platforms like Teal, Rezi, Kickresume, and Enhancv.
It should feel personal, authentic, and tailored — not generated from a template.
`,
        sop: `
PRIORITIZE THESE RESUME SECTIONS (most relevant first):
1. **Education** — Academic background, GPA, relevant coursework, research.
2. **Projects** — Research projects, thesis, technical implementations.
3. **Experience** — Research assistantships, teaching, lab work.
4. **Achievements** — Academic awards, scholarships, publications.
5. **Certifications** — Relevant credentials.
6. **Publications** — Research papers, conference presentations.

INTEGRATION:
- Connect past academic/research experience to future goals.
- Show a clear narrative arc: past preparation → current expertise → future aspirations.
- Mention specific faculty, labs, or research groups from the resume that align with the application.
- Demonstrate depth in the chosen field through specific project/experience examples.

WRITING STYLE:
- Opening: Personal motivation and intellectual origin story.
- Body: Academic preparation → Research experience → Reasons for choosing this program.
- Closing: Future vision and how the program fits into long-term goals.
`,
        proposal: `
PRIORITIZE THESE RESUME SECTIONS (most relevant first):
1. **Projects** — Past project experience as evidence of delivery capability.
2. **Experience** — Relevant professional background and domain expertise.
3. **Skills** — Technical competencies for execution.
4. **Achievements** — Track record of successful outcomes.
5. **Certifications** — Credentials that build trust.

INTEGRATION:
- Use past project experience as proof of ability to deliver similar outcomes.
- Highlight team leadership and collaboration experience.
- Demonstrate domain expertise through relevant work history.
- Quantify past results to build credibility for proposed work.

WRITING STYLE:
- Executive Summary: Clear value proposition backed by relevant experience.
- Approach: Demonstrate methodology informed by past project experience.
- Team: Show relevant expertise and past performance.
- Budget/Timeline: Justify with reference to similar past work.
`,
    };

    const priorityInstructions = docSpecificInstructions[docType] || `
PRIORITIZE THESE RESUME SECTIONS:
- Extract the most relevant experience, skills, and achievements.
- Match resume content to the provided context.
`;

    return `
You are an expert Career Coach, Recruiter, Hiring Manager, and Professional Resume Writer.

Your goal is to write ${docName === "Cover Letter" ? "cover letters that are indistinguishable from professionally written human cover letters" : `premium, high-impact ${docName} documents`}.

The generated ${docName === "Cover Letter" ? "cover letter must maximize interview chances while remaining 100% truthful" : "document must be professional and compelling"}.

SOURCE DATA:
Below is the candidate's COMPLETE Resume JSON — structured data from their professional resume.
This includes ALL of the following sections (where populated):
- Personal Information (name, email, phone, location, LinkedIn, GitHub, portfolio)
- Professional Summary / Objective
- Education (institution, degree, CGPA, dates, location, description)
- Experience (company, role, duration, location, responsibilities, achievements, metrics, descriptions with bullet points)
- Projects (title, description, technologies, GitHub link, live demo link, achievements)
- Technical Skills (grouped by category)
- Certifications (title, issuer, date, link, description)
- Achievements / Awards (title, date, description, type)
- Publications (title, publisher, date, link, description)
- Leadership / Extracurricular (title, organization, role, duration, description)
- Volunteer Experience (organization, role, cause, duration, description)
- Languages (name, proficiency level)
- Interests / Hobbies
- Custom Sections

Do NOT dump this data verbatim. Instead, intelligently select and weave in only the most relevant information for the specific document type.

RESUME JSON:
${userDetails}

CONTEXT (Job/Program/Project Details):
${context}

INSTRUCTIONS FOR USING THE RESUME JSON:
${priorityInstructions}

CRITICAL RULES:
- Do NOT invent information. Only use what is present in the Resume JSON.
- Do NOT list all skills — only mention the most relevant ones for the target role/program.
- Do NOT list all experiences — select the 2-3 most relevant.
- Do NOT repeat the same achievement in multiple sections.
- Use actual metrics, technologies, and project names from the resume — don't generalize them away.
- Preserve bullet points, metrics, dates, locations, and impact statements when they strengthen the narrative.
- Remove unrelated skills that don't match the context.
- Maintain factual accuracy at all times.
- Produce natural, personalized, flowing writing — not a bullet-point dump.

${docType === "cover_letter" ? "" : `
FORMATTING RULES (MANDATORY):
- Use MARKDOWN strictly.
- **Bold** key technical skills, impact metrics (X%, $Y), and elite role titles.
- Use asterisk (*) for every single item inside lists.
- Structure using ### Triple-Hash Headers for main sections.
- Ensure sharp spacing by adding clear double-newlines between major sections.
`}

STRATEGY:
- Deeply integrate RESUME DATA with the provided CONTEXT.
- Select only the most relevant information based on document type.
- Bridge the gap between past accomplishments and future goals.
- Tone: ${tone || "Professional"}.
- Length: ${length || "Medium"}.

${docType === "cover_letter"
    ? "Return ONLY the final cover letter text. No Markdown formatting. No headings. No explanations. No AI commentary. Just the plain business letter."
    : "Output ONLY the document content in Markdown. No conversational filler or introductory remarks."}
`;
}

function generateGenericPrompt(context: string, userDetails: string, tone: string, length: string, docType: string, docTypeNames: Record<string, string>, isResumeJSON?: boolean) {
    
    if (isResumeJSON) {
        return generateResumeAwarePrompt(context, userDetails, tone, length, docType, docTypeNames);
    }

    return `
You are Mentorix, an elite Executive Career Consultant.
Generate a premium, high-impact ${docTypeNames[docType] || "Professional Document"}.

FORMATTING RULES (MANDATORY):
- Use MARKDOWN strictly.
- **Bold** key technical skills, impact metrics (X%, $Y), and elite role titles.
- Use asterisk (*) for every single item inside lists.
- Structure using ### Triple-Hash Headers for main sections (e.g., ### Opening, ### Strategic Fit, ### Key Impact).
- Ensure sharp spacing by adding clear double-newlines between major sections.

STRATEGY:
- Deeply integrate USER DETAILS with the provided CONTEXT.
- Bridge the gap between past accomplishments and future goals using logic.
- Tone: ${tone || "Professional"}.
- Length: ${length || "Medium"}.

USER DETAILS: ${userDetails}
CONTEXT: ${context}

Output ONLY the document content in Markdown. No conversational filler or introductory remarks.
`;
}

export async function POST(req: NextRequest) {
    try {
        // Rate limit check
        const ip = getRequestIP(req);
        const { limited, resetIn } = checkRateLimit(`writing:${ip}`, AI_RATE_LIMIT);
        if (limited) {
            return NextResponse.json(
                { error: `Too many requests. Please try again in ${resetIn} seconds.` },
                { status: 429 }
            );
        }

        const clerkUser = await currentUser();
        if (!clerkUser || !clerkUser.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = clerkUser.primaryEmailAddress.emailAddress;
        const body = await req.json();
        const { docType, context, userDetails, tone, length, isResumeJSON, resumeJSON } = body;

        if (!docType || !context) {
            return NextResponse.json({ error: "Document type and context are required" }, { status: 400 });
        }
        if (!userDetails && !resumeJSON) {
            return NextResponse.json({ error: "Either user details or resume data is required" }, { status: 400 });
        }

        const docTypeNames: Record<string, string> = {
            cover_letter: "Cover Letter",
            sop: "Statement of Purpose (SOP)",
            lor: "Letter of Recommendation (LOR)",
            proposal: "Proposal"
        };

        // Merge resume JSON with user-typed Personal Synthesis content
        // If both are provided, combine them so the AI sees both the structured resume and the user's notes
        let effectiveUserDetails = userDetails || resumeJSON || ""
        if (resumeJSON && userDetails && userDetails !== resumeJSON) {
            effectiveUserDetails = `RESUME DATA:\n${resumeJSON}\n\nUSER'S ADDITIONAL NOTES:\n${userDetails}`
        }
        const effectiveIsResumeJSON = isResumeJSON || !!resumeJSON

        const systemPrompt = docType === "lor" 
            ? generateLORPrompt(context, userDetails || "", tone, length, docTypeNames)
            : generateGenericPrompt(context, effectiveUserDetails, tone, length, docType, docTypeNames, effectiveIsResumeJSON);

        const data = await chatWithGroq([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate the ${docTypeNames[docType]} based on the context provided.` }
        ], {
            model: MODELS.PRIMARY,
            temperature: 0.7,
            max_tokens: 2048,
        });

        if (!data?.choices?.[0]?.message?.content) {
            throw new Error("Invalid response from AI provider");
        }

        const generatedContent = data.choices[0].message.content;

        // Auto-save to history
        const [savedDoc] = await db.insert(writingStudioDocsTable).values({
            userEmail: email,
            docType,
            context,
            userDetails,
            generatedContent
        }).returning();

        return NextResponse.json({
            success: true,
            doc: savedDoc
        });

    } catch (error: unknown) {
        console.error("Writing Studio Error:", error);
        const err = error as { status?: number; message?: string; error?: { message?: string } };
        const statusCode = err.status || 500;
        const groqErrorMessage = err.error?.message || err.message;
        return NextResponse.json({
            error: groqErrorMessage || "Failed to generate document",
            details: err.message
        }, { status: statusCode });
    }
}
