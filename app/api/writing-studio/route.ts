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
PRIORITIZE THESE RESUME SECTIONS (most relevant first):
1. **Experience** — Extract specific roles, achievements, and impact metrics.
2. **Projects** — Highlight technical depth and outcomes.
3. **Skills** — Match technical skills to the job requirements.
4. **Achievements** — Use awards and recognitions as proof points.

INTEGRATION WITH JOB DESCRIPTION:
- Map each resume experience/project to specific requirements in the job description.
- If a skill from the resume matches a JD requirement, explicitly highlight it.
- For missing skills, emphasize transferable abilities from related experience.
- Reference the company's industry/domain where relevant from the resume's experience section.

WRITING STYLE:
- Opening: Hook with your strongest relevant achievement.
- Body: 2-3 paragraphs each covering a key area (experience match, technical fit, cultural alignment).
- Closing: Confident summary and call to action.
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
You are Mentorix, an elite Executive Career Consultant.
Generate a premium, high-impact ${docName}.

SOURCE DATA:
Below is the candidate's complete Resume JSON — structured data from their professional resume.
Do NOT dump this data verbatim. Instead, intelligently select and weave in only the most relevant information.

RESUME JSON:
${userDetails}

CONTEXT (Job/Program/Project Details):
${context}

INSTRUCTIONS FOR USING THE RESUME JSON:
${priorityInstructions}

CRITICAL RULES:
- Do NOT invent information. Only use what is present in the Resume JSON.
- Do NOT list all skills — only mention the most relevant ones.
- Do NOT list all experiences — select the 2-3 most relevant.
- Do NOT repeat the same achievement in multiple sections.
- Remove unrelated skills that don't match the context.
- Maintain factual accuracy at all times.
- Produce natural, personalized, flowing writing — not a bullet-point dump.

FORMATTING RULES (MANDATORY):
- Use MARKDOWN strictly.
- **Bold** key technical skills, impact metrics (X%, $Y), and elite role titles.
- Use asterisk (*) for every single item inside lists.
- Structure using ### Triple-Hash Headers for main sections.
- Ensure sharp spacing by adding clear double-newlines between major sections.

STRATEGY:
- Deeply integrate RESUME DATA with the provided CONTEXT.
- Select only the most relevant information based on document type.
- Bridge the gap between past accomplishments and future goals.
- Tone: ${tone || "Professional"}.
- Length: ${length || "Medium"}.

Output ONLY the document content in Markdown. No conversational filler or introductory remarks.
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
