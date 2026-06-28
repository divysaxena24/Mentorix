/**
 * Centralized AI model configuration.
 * All model references should use these constants instead of hardcoded strings.
 *
 * Only Groq-supported models should be listed here.
 * Amazon Nova models (nova-pro, nova-lite) are NOT supported on Groq.
 */

/** Default model used when GROQ_MODEL env var is not set */
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Fallback chain: if the primary model returns 404 (model_not_found) or 403,
 * the system automatically tries the next model in this list.
 */
export const GROQ_MODEL_FALLBACKS = [
    "llama-3.3-70b-versatile",
    "deepseek-r1-distill-llama-70b",
    "llama-3.1-8b-instant",
] as const;

/**
 * Get the active Groq model based on environment variable or default.
 * @returns The model string to use for Groq requests.
 */
export function getActiveModel(): string {
    return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

/**
 * Resolve which Groq model to use.
 * Priority: GROQ_MODEL env var → default (llama-3.3-70b-versatile).
 */
export function resolveModel(): string {
    return process.env.GROQ_MODEL?.trim() || GROQ_MODEL_FALLBACKS[0];
}

/**
 * Keep MODELS for backward compatibility.
 * All keys now resolve to the same active model.
 */
export const MODELS = {
    PRIMARY: resolveModel(),
    FAST_REASONING: resolveModel(),
    FALLBACK: "llama-3.1-8b-instant",
    GROQ_PRIMARY: resolveModel(),
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

// Log model configuration on startup
console.log(`[AI] Active model: ${MODELS.PRIMARY}`);
console.log(`[AI] Fallback chain: ${GROQ_MODEL_FALLBACKS.join(" → ")}`);
