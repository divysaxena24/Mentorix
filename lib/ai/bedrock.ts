import { chatWithGroq } from "./groq";
import { MODELS } from "./models";
import { z } from "zod";

// Zod Schemas for Validation
const CourseOutlineSchema = z.object({
    courseTitle: z.string(),
    description: z.string(),
    learningOutcomes: z.array(z.string()),
    capstoneProject: z.string(),
    modules: z.array(z.object({
        title: z.string(),
        description: z.string(),
        lessons: z.array(z.object({
            title: z.string(),
            focus: z.string()
        }))
    }))
});

const LessonContentSchema = z.object({
    explanation: z.string(),
    realWorldExample: z.string(),
    codeExample: z.string().optional(),
    commonMistakes: z.array(z.string()),
    exercise: z.string(),
    interviewQuestions: z.array(z.object({
        question: z.string(),
        answer: z.string()
    }))
});

const QuizSchema = z.object({
    questions: z.array(z.object({
        question: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.string()
    }))
});

/**
 * Executes a call to Groq with Premium Engine specific handling
 */
async function callGroqPremium(model: string, systemPrompt: string, userPrompt: string, jsonMode: boolean = true) {
    try {
        const responseData = await chatWithGroq([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ], {
            model: model,
            response_format: jsonMode ? { type: "json_object" } : undefined,
            temperature: 0.7
        });

        if (!responseData?.choices?.[0]?.message?.content) {
            throw new Error("Empty response from Groq Engine");
        }

        return responseData.choices[0].message.content;
    } catch (error: any) {
        console.error(`[PREMIUM_GROQ_ERROR] API Call Failed:`, error.message);
        throw error;
    }
}

/**
 * STEP 1: Generate the high-level course skeleton
 */
export async function generateCourseOutline(topic: string, level: string, duration: string, goalType: string) {
    console.log(">>> [DEBUG] generateCourseOutline START <<<", { topic, level, duration, goalType });

    // Logic to determine course scale based on duration
    let moduleCount = "6-8";
    if (duration.toLowerCase().includes("month")) {
        const months = parseInt(duration) || 1;
        if (months >= 3) moduleCount = "12-15";
        else if (months >= 2) moduleCount = "10-12";
        else moduleCount = "8-10";
    }

    const systemPrompt = `You are a Senior Industry Educator and FAANG-Level Technical Instructor.
    Your task is to design an elite, structured, and highly detailed curriculum inspired by world-class learning platforms like GeeksforGeeks, W3Schools, and MDN.
    
    GUIDELINES:
    1. PROGRESSION: Ensure a "Zero to Hero" flow.
    2. DEPTH: Do not skip complex sub-topics. Break them into modular lessons.
    3. STRUCTURE: Every lesson title must be descriptive and professional.
    4. REPUTATION: Aim for the clarity of W3Schools and the depth of GeeksforGeeks.
    
    Return ONLY a strict JSON object. No markdown, no filler.`;

    const userPrompt = `Generate a comprehensive ${duration} course on "${topic}" for ${level} learners.
    
    CONSTRAINTS:
    - MODULES: Use exactly ${moduleCount} modules to cover the ${duration} duration effectively.
    - LESSONS: Each module MUST have 5-6 high-quality lessons.
    - GOAL: Focus exclusively on ${goalType}.
    - HIERARCHY: Organize modules by logical progression (Basics -> Core -> Advanced -> Real-world -> Testing -> Deployment).
    
    Required JSON Format (ensure ALL fields are valid JSON and properly closed):
    {
      "courseTitle": "...",
      "description": "A detailed 150-word overview of the journey.",
      "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4", "Outcome 5"],
      "capstoneProject": "A detailed description of a production-ready project.",
      "modules": [
        {
          "title": "Module Title",
          "description": "What will be mastered here",
          "lessons": [{"title": "Lesson Title", "focus": "Deep sub-topics to cover in this lesson"}]
        }
      ]
    }`;

    try {
        const raw = await callGroqPremium(MODELS.PRIMARY, systemPrompt, userPrompt);
        console.log("[BEDROCK] Raw Outline Response:", raw);

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            console.error("[BEDROCK] JSON Parse Failed:", raw);
            throw new Error("AI returned invalid JSON structure");
        }

        const validated = CourseOutlineSchema.safeParse(parsed);
        if (!validated.success) {
            console.error("[BEDROCK] Schema Validation Failed:", validated.error.format());
            throw new Error("AI response did not match the expected course structure. Likely too many modules for a single response.");
        }

        return validated.data;
    } catch (error: any) {
        console.error("Course Outline Generation Failed:", error);
        throw new Error(error.message || "Failed to generate course structure");
    }
}

/**
 * STEP 2: Generate deep-dive content for a specific lesson
 */
export async function generateLessonContent(lessonTitle: string, focus: string, level: string, goalType: string) {
    const wordLimits: Record<string, string> = {
        "Beginner": "800-1000",
        "Intermediate": "1000-1500",
        "Advanced": "1500-2000"
    };
    const limit = wordLimits[level] || "1000-1200";

    const systemPrompt = `You are a Technical Content Architect.
    Generate a textbook-quality, highly organized lesson.
    
    INSPIRATION SOURCES:
    - GeeksforGeeks (for technical depth and interview perspective)
    - W3Schools (for clarity, structured points, and bite-sized logic)
    - MDN Web Docs (for absolute accuracy)

    FORMATTING RULES:
    1. Structure: Use H3/H4 equivalents in text for organization.
    2. Lists: Use bullet points for key features and characteristics.
    3. Syntax: Provide detailed syntax breakdowns.
    4. Practicality: Explain WHY something is used, not just HOW.
    
    Return strict JSON only.`;

    const userPrompt = `Generate lesson content for:
    Topic: "${lessonTitle}"
    Context/Focus: ${focus}
    Level: ${level}
    Goal: ${goalType}

    The explanation must be extremely detailed (approx ${limit} words) and follow a structured "Point-by-Point" format like GeeksforGeeks. Use multiple headings, comparative tables (if relevant), and deep-dive sections.
    
    Include:
    - explanation (Structured with clear headings, detailed paragraphs, and comparative tables/lists. Aim for maximum technical depth.)
    - realWorldExample (A massive, detailed case study)
    - codeExample (A fully commented, production-ready implementation)
    - commonMistakes (At least 5-7 subtle pitfalls pros face)
    - exercise (A challenging mini-project task)
    - interviewQuestions (10 highly relevant, scenario-based Q&A)

    JSON Format (strictly follow this and ensure the response is a complete, valid JSON object):
    {
      "explanation": "...",
      "realWorldExample": "...",
      "codeExample": "...",
      "commonMistakes": ["...", "..."],
      "exercise": "...",
      "interviewQuestions": [{"question": "...", "answer": "..."}]
    }`;

    let attempt = 0;
    while (attempt < 2) {
        try {
            const raw = await callGroqPremium(MODELS.PRIMARY, systemPrompt, userPrompt);
            const parsed = LessonContentSchema.parse(JSON.parse(raw));

            // Basic word count enforcement
            const wordCount = parsed.explanation.split(/\s+/).length;
            const min = parseInt(limit.split('-')[0]);

            if (wordCount < min && attempt === 0) {
                console.warn(`Lesson too short (${wordCount}/${min}). Retrying...`);
                attempt++;
                continue;
            }

            return parsed;
        } catch (error) {
            console.error(`Lesson Generation Attempt ${attempt + 1} Failed:`, error);
            attempt++;
            if (attempt === 2) throw error;
        }
    }
    throw new Error("Failed to generate lesson content after retries.");
}

/**
 * STEP 3: Generate high-quality MCQs
 */
export async function generateQuiz(content: string) {
    const systemPrompt = `You are an Expert Examiner. Generate 8 high-quality MCQs.
    Mix conceptual and scenario-based questions. Return strict JSON.`;

    const userPrompt = `Based on this content, generate 8 MCQs:
    ${content.substring(0, 3000)}

    JSON Format:
    {
      "questions": [
        {
          "question": "...",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "..."
        }
      ]
    }`;

    try {
        const raw = await callGroqPremium(MODELS.QUIZ, systemPrompt, userPrompt);
        return QuizSchema.parse(JSON.parse(raw));
    } catch (error) {
        console.error("Quiz Generation Failed:", error);
        return { questions: [] }; // Graceful failure
    }
}

/**
 * Rank YouTube videos using AI
 */
export async function rankYouTubeVideos(videos: any[], level: string) {
    if (!videos || videos.length === 0) return null;

    const systemPrompt = `Select the most structured, educational, and relevant technical tutorial best suited for ${level} learners. 
    Avoid clickbait or superficial overviews. Prioritize full course lectures or detailed deep-dives.
    Return ONLY the videoId as a string. No other text.`;

    const userPrompt = `Rank these YouTube videos based on:
    1. Title relevance to the technical topic: "${level} level mastery"
    2. Educational quality (Professional channels preferred)
    3. Duration/Depth
    
    Candidates:
    ${videos.map((v, i) => `${i + 1}. Title: ${v.title} | Channel: ${v.channelTitle} | ID: ${v.videoId}`).join("\n")}
    
    Return the best videoId:`;

    try {
        const videoId = await callGroqPremium(MODELS.RANKING, systemPrompt, userPrompt, false);
        return videoId.trim().replace(/['"]/g, "");
    } catch (error) {
        return videos[0]?.videoId; // Fallback to first
    }
}
