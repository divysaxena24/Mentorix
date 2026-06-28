import { NextRequest, NextResponse } from "next/server";
import { chatWithGroq } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import { currentUser } from "@clerk/nextjs/server";
import { checkRateLimit, getRequestIP, AI_RATE_LIMIT } from "@/lib/rate-limit";

const actionPrompts: Record<string, { label: string; systemPrompt: string }> = {
    improve_writing: {
        label: "Improve Writing",
        systemPrompt: `You are a professional editor. Improve the following text's clarity, flow, and impact while preserving its original meaning and intent. Enhance sentence structure, word choice, and overall readability. Output ONLY the improved text with no explanations, introductions, or meta-commentary.`
    },
    rewrite: {
        label: "Rewrite",
        systemPrompt: `You are a professional writer. Rewrite the following text completely while preserving its core message and key information. Use fresh language and a different sentence structure. Output ONLY the rewritten text with no explanations, introductions, or meta-commentary.`
    },
    shorten: {
        label: "Shorten",
        systemPrompt: `You are a concise editor. Condense the following text to its essential points, removing any redundancy, fluff, or unnecessary details. Keep it clear and impactful. Output ONLY the shortened text with no explanations, introductions, or meta-commentary.`
    },
    expand: {
        label: "Expand",
        systemPrompt: `You are a detail-oriented writer. Expand the following text by adding relevant details, examples, and elaboration while maintaining the original tone and style. Make it more comprehensive. Output ONLY the expanded text with no explanations, introductions, or meta-commentary.`
    },
    grammar_check: {
        label: "Grammar Check",
        systemPrompt: `You are a grammar expert. Correct all grammar, punctuation, spelling, and syntax errors in the following text. Preserve the original voice and style while ensuring flawless grammar. Output ONLY the corrected text with no explanations or lists of changes.`
    },
    improve_vocabulary: {
        label: "Improve Vocabulary",
        systemPrompt: `You are a vocabulary expert. Enhance the following text by replacing basic or overused words with more sophisticated and precise vocabulary. Maintain the original tone and ensure the new words fit naturally. Output ONLY the enhanced text with no explanations.`
    },
    simplify_english: {
        label: "Simplify English",
        systemPrompt: `You are a plain language expert. Simplify the following text to make it easier to understand for non-native English speakers. Use simple vocabulary, shorter sentences, and clear structure while preserving key information. Output ONLY the simplified text.`
    },
    make_professional: {
        label: "Make More Professional",
        systemPrompt: `You are a business writing expert. Transform the following text to be more professional and polished. Use formal language, eliminate casual expressions, and enhance the authoritative tone. Output ONLY the professional version.`
    },
    make_friendly: {
        label: "Make More Friendly",
        systemPrompt: `You are a communication expert. Make the following text warmer and more approachable while maintaining professionalism. Use a friendly, engaging tone. Output ONLY the friendly version.`
    },
    make_ats_friendly: {
        label: "Make ATS Friendly",
        systemPrompt: `You are an ATS optimization expert. Optimize the following text for Applicant Tracking Systems. Use standard section headings, incorporate relevant industry keywords naturally, and avoid complex formatting. Output ONLY the ATS-optimized text.`
    },
    make_academic: {
        label: "Make Academic Tone",
        systemPrompt: `You are an academic writing expert. Transform the following text into a formal academic tone. Use scholarly language, precise terminology, and objective phrasing suitable for academic submissions. Output ONLY the academic version.`
    },
    make_conversational: {
        label: "Make Conversational",
        systemPrompt: `You are a communication expert. Rewrite the following text in a conversational style that feels natural and engaging, as if speaking directly to the reader. Use contractions and natural flow. Output ONLY the conversational version.`
    },
    regenerate_paragraph: {
        label: "Regenerate Selected Paragraph",
        systemPrompt: `You are a creative writer. Regenerate the following paragraph with fresh language and perspective while maintaining its core message and role within the larger document. Output ONLY the regenerated paragraph.`
    },
    add_details: {
        label: "Add More Details",
        systemPrompt: `You are a detail-oriented editor. Enhance the following text by adding specific details, examples, data points, or elaborations that strengthen the content. Make it more substantive. Output ONLY the enhanced text.`
    },
    remove_repetition: {
        label: "Remove Repetition",
        systemPrompt: `You are a concise editor. Remove any repetitive phrases, redundant information, or duplicate ideas from the following text. Keep it clear and non-repetitive. Output ONLY the cleaned text.`
    },
    strengthen_opening: {
        label: "Strengthen Opening",
        systemPrompt: `You are a persuasive writing expert. Strengthen the opening of the following text to make it more compelling, attention-grabbing, and impactful. Create a strong first impression. Output ONLY the improved opening.`
    },
    improve_conclusion: {
        label: "Improve Conclusion",
        systemPrompt: `You are a writing expert. Improve the conclusion of the following text to make it more memorable, impactful, and satisfying. End with strength. Output ONLY the improved conclusion.`
    },
    fix_formatting: {
        label: "Fix Formatting",
        systemPrompt: `You are a formatting expert. Fix the formatting of the following text — ensure consistent spacing, remove extra line breaks, standardize bullet points, and clean up any formatting inconsistencies. Output ONLY the formatted text with no explanations.`
    },
    make_corporate: {
        label: "Make Corporate Tone",
        systemPrompt: `You are a corporate communications expert. Transform the following text into a polished corporate tone — use business-appropriate language, strategic phrasing, and executive-level vocabulary. Sound confident and authoritative. Output ONLY the corporate version.`
    },
    make_persuasive: {
        label: "Make More Persuasive",
        systemPrompt: `You are a persuasion expert. Enhance the following text to be more persuasive and compelling. Use rhetorical techniques, strong calls to action, and convincing language. Output ONLY the persuasive version.`
    },
    improve_readability: {
        label: "Improve Readability",
        systemPrompt: `You are a readability expert. Improve the readability of the following text — use shorter sentences, simpler words where appropriate, clear structure, and better flow. Make it easy to read and understand while preserving all key information. Output ONLY the improved text.`
    },
    improve_clarity: {
        label: "Improve Clarity",
        systemPrompt: `You are a clarity expert. Make the following text clearer and more understandable. Eliminate ambiguity, clarify vague statements, and ensure each sentence has a clear meaning. Output ONLY the clarified text.`
    },
    condense: {
        label: "Condense Content",
        systemPrompt: `You are a concise editor. Condense the following text significantly while preserving all key information and main points. Remove wordiness, trim redundancies, and make every word count. Output ONLY the condensed text.`
    },
    improve_transitions: {
        label: "Improve Transitions",
        systemPrompt: `You are a flow expert. Improve the transitions between ideas and paragraphs in the following text. Add smooth connecting phrases, ensure logical flow, and make the progression of ideas seamless. Output ONLY the improved text.`
    },
    highlight_relevant_exp: {
        label: "Highlight Relevant Experience",
        systemPrompt: `You are a career coach. Reframe the following cover letter to better highlight the candidate's most relevant experience for the target role. Emphasize specific achievements, skills, and outcomes that directly match the job requirements. Output ONLY the enhanced cover letter section.`
    },
    emphasize_skills: {
        label: "Emphasize Technical Skills",
        systemPrompt: `You are a technical recruiter. Emphasize the technical skills mentioned in the following cover letter. Highlight specific technologies, tools, and methodologies with concrete examples of their application. Output ONLY the enhanced cover letter section.`
    },
    highlight_leadership: {
        label: "Highlight Leadership",
        systemPrompt: `You are a leadership development expert. Amplify the leadership qualities demonstrated in the following text. Highlight initiative, team management, mentorship, decision-making, and strategic impact. Output ONLY the enhanced text with leadership qualities emphasized.`
    },
    highlight_technical: {
        label: "Highlight Technical Strengths",
        systemPrompt: `You are a technical evaluator. Identify and amplify the technical strengths mentioned in the following text. Highlight depth of expertise, specific technologies, problem-solving abilities, and technical achievements. Output ONLY the enhanced text.`
    },
    highlight_research: {
        label: "Highlight Research Experience",
        systemPrompt: `You are a research advisor. Enhance the following text to better highlight research experience. Emphasize methodology, findings, publications, presentations, and the intellectual contribution of the research. Output ONLY the enhanced text.`
    },
    improve_deliverables: {
        label: "Improve Deliverables",
        systemPrompt: `You are a project management expert. Improve the deliverables section of the following proposal. Make deliverables concrete, measurable, clearly scoped, and directly tied to project objectives. Include timelines and success criteria where relevant. Output ONLY the improved deliverables section.`
    },
    add_keywords: {
        label: "Add Industry Keywords",
        systemPrompt: `You are an SEO and industry expert. Naturally incorporate relevant industry keywords, buzzwords, and terminology into the following text. Make it keyword-rich while maintaining readability. Output ONLY the enhanced text.`
    },
    // Document-specific actions
    optimize_for_jd: {
        label: "Optimize for Job Description",
        systemPrompt: `You are a career coach. Optimize the following cover letter to better match the job description. Incorporate relevant keywords from the job requirements, highlight matching skills, and align the tone with the company culture. Output ONLY the optimized cover letter.`
    },
    ats_optimization: {
        label: "ATS Optimization",
        systemPrompt: `You are an ATS optimization specialist. Optimize the following cover letter for Applicant Tracking Systems. Naturally incorporate industry keywords matching the job description, use standard formatting, and ensure the letter passes automated screening. Output ONLY the ATS-optimized cover letter.`
    },
    tailor_for_company: {
        label: "Tailor for Company",
        systemPrompt: `You are a career strategist. Tailor the following cover letter specifically for the target company. Reference the company's mission, values, and industry position. Show genuine interest and research. Output ONLY the tailored cover letter.`
    },
    tailor_for_university: {
        label: "Tailor for University",
        systemPrompt: `You are an admissions consultant. Tailor the following Statement of Purpose for the specific university. Reference the program's strengths, faculty research, and how the candidate fits. Output ONLY the tailored SOP.`
    },
    strengthen_research: {
        label: "Strengthen Research Interest",
        systemPrompt: `You are a research advisor. Strengthen the research interest section of the following Statement of Purpose. Articulate clear research questions, methodology interests, and academic passion. Output ONLY the enhanced research section.`
    },
    improve_career_goals: {
        label: "Improve Career Goals",
        systemPrompt: `You are a career development expert. Improve the career goals section of the following Statement of Purpose. Make the goals specific, ambitious yet realistic, and clearly connected to the program. Output ONLY the improved career goals section.`
    },
    make_academic_tone: {
        label: "Make More Academic",
        systemPrompt: `You are an academic referee. Enhance the following Letter of Recommendation with a more formal academic tone. Use scholarly language appropriate for university admissions committees. Output ONLY the enhanced letter.`
    },
    make_professional_tone: {
        label: "Professional Tone",
        systemPrompt: `You are a professional writing expert. Transform the following Letter of Recommendation to use a polished, professional tone. Use formal business language while maintaining warmth and credibility. Output ONLY the enhanced letter.`
    },
    strengthen_recommendation: {
        label: "Strengthen Recommendation",
        systemPrompt: `You are a recommendation expert. Strengthen the endorsement in the following Letter of Recommendation. Use more powerful language of recommendation, specific superlatives, and confident endorsements. Output ONLY the strengthened letter.`
    },
    highlight_strengths: {
        label: "Highlight Candidate Strengths",
        systemPrompt: `You are a talent evaluator. Identify and amplify the candidate's key strengths and standout qualities in the following Letter of Recommendation. Use specific language that highlights their unique value proposition. Output ONLY the enhanced letter.`
    },
    improve_exec_summary: {
        label: "Improve Executive Summary",
        systemPrompt: `You are a business consultant. Improve the executive summary of the following proposal. Make it concise, compelling, and clear about the value proposition and key outcomes. Output ONLY the improved executive summary.`
    },
    strengthen_objectives: {
        label: "Strengthen Objectives",
        systemPrompt: `You are a project management expert. Strengthen the objectives section of the following proposal. Make objectives SMART (Specific, Measurable, Achievable, Relevant, Time-bound). Output ONLY the strengthened objectives.`
    },
    improve_budget: {
        label: "Improve Budget Justification",
        systemPrompt: `You are a budget analyst. Improve the budget justification section of the following proposal. Provide clear rationale for each cost item and demonstrate value for money. Output ONLY the improved budget justification.`
    },
    improve_timeline: {
        label: "Improve Timeline",
        systemPrompt: `You are a project scheduler. Improve the timeline section of the following proposal. Make milestones realistic, well-sequenced, and clearly mapped to deliverables. Include clear phases and deadlines. Output ONLY the improved timeline.`
    },
    strengthen_deliverables: {
        label: "Strengthen Deliverables",
        systemPrompt: `You are a project manager. Strengthen the deliverables section of the following proposal. Make deliverables concrete, measurable, and clearly tied to objectives. Output ONLY the strengthened deliverables.`
    },
};

export async function POST(req: NextRequest) {
    try {
        const ip = getRequestIP(req);
        const { limited, resetIn } = checkRateLimit(`writing-action:${ip}`, AI_RATE_LIMIT);
        if (limited) {
            return NextResponse.json(
                { error: `Too many requests. Please try again in ${resetIn} seconds.` },
                { status: 429 }
            );
        }

        const user = await currentUser();
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, text, docType, isPartialSelection, fullContext } = body;

        if (!action || !text) {
            return NextResponse.json({ error: "Action and text are required" }, { status: 400 });
        }

        const actionConfig = actionPrompts[action];
        if (!actionConfig) {
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

        let systemPrompt = actionConfig.systemPrompt;

        // Add context about the document type for better results
        const docTypeNames: Record<string, string> = {
            cover_letter: "Cover Letter",
            sop: "Statement of Purpose",
            lor: "Letter of Recommendation",
            proposal: "Proposal"
        };
        const docName = docTypeNames[docType] || "document";

        systemPrompt += `\n\nThis text is from a ${docName}. ${isPartialSelection ? "The user selected a portion of the document. Focus specifically on that selection while maintaining coherence with the full document." : "Apply the action to the entire provided text."}`;

        if (fullContext && isPartialSelection) {
            systemPrompt += `\n\nFull document context (for reference):\n${fullContext}`;
        }

        const responseData = await chatWithGroq([
            { role: "system", content: systemPrompt },
            { role: "user", content: text }
        ], {
            model: MODELS.PRIMARY,
            temperature: 0.7,
            max_tokens: 2048,
        });

        if (!responseData?.choices?.[0]?.message?.content) {
            throw new Error("Invalid response from AI provider");
        }

        const processedContent = responseData.choices[0].message.content;

        return NextResponse.json({
            success: true,
            content: processedContent,
            message: `${actionConfig.label} applied successfully!`
        });

    } catch (error: any) {
        console.error("AI Action Error:", error);
        const statusCode = error.status || 500;
        return NextResponse.json({
            error: error.message || "Failed to process action",
        }, { status: statusCode });
    }
}
