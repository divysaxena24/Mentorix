/**
 * Centralized AI model configuration.
 * All model references should use these constants instead of hardcoded strings.
 */
export const MODELS = {
    /** Primary model changed to Amazon Nova Pro to bypass Anthropic AWS Marketplace limits while keeping high intelligence */
    PRIMARY: "amazon.nova-pro-v1:0",
    /** High-speed, high-quality conversational model for Real-time tasks (Mock Interviews, AI Chat) */
    FAST_REASONING: "amazon.nova-lite-v1:0",
    /** Lighter model for fallback and simple logic */
    FALLBACK: "amazon.nova-lite-v1:0",
    /** Smallest, cheapest model for simple structural extraction like Quizzes */
    QUIZ: "meta.llama3-8b-instruct-v1:0",
    /** Smallest model for simple categorization like video ranking */
    RANKING: "meta.llama3-8b-instruct-v1:0",
    /** Flagship Groq Model for fast structured output analysis */
    GROQ_PRIMARY: "llama-3.3-70b-versatile",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];
