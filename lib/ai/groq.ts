import Groq from "groq-sdk";
import * as fs from "fs";
import { GROQ_MODEL_FALLBACKS, getActiveModel, resolveModel } from "./models";

// ===== Multi-Key Groq Client Rotation =====
/**
 * Collect all available Groq API keys from environment variables.
 * Supports multiple naming formats:
 *   - GROQ_API_KEY
 *   - GROQ_API_KEY1, GROQ_API_KEY2, GROQ_API_KEY3, GROQ_API_KEY4, GROQ_API_KEY5
 *   - GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3
 */
function getGroqClients(): Groq[] {
    const keys: string[] = [];
    // Primary key
    if (process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
    // Additional keys — check both underscore and no-underscore formats (index 1-5)
    for (let i = 1; i <= 5; i++) {
        const key = process.env[`GROQ_API_KEY_${i}`] || process.env[`GROQ_API_KEY${i}`];
        if (key) keys.push(key);
    }
    return keys.map(key => new Groq({ apiKey: key }));
}

/**
 * Returns the number of configured Groq clients.
 * Used by the provider manager to check availability before making requests.
 */
export function getGroqClientCount(): number {
    return groqClients.length;
}

let groqClients = getGroqClients();
let currentKeyIndex = 0;

/**
 * Get the next Groq client in round-robin fashion.
 * This distributes requests evenly across all available API keys.
 * Returns `null` when no clients are available instead of crashing.
 */
export function getNextGroqClient(): { client: Groq; index: number } | null {
    if (groqClients.length === 0) {
        return null;
    }
    const client = groqClients[currentKeyIndex];
    const index = currentKeyIndex;
    currentKeyIndex = (currentKeyIndex + 1) % groqClients.length;
    return { client, index };
}

/**
 * Determines if a Groq API error is worth retrying with a different API key.
 * Retryable errors include:
 * - 429: Rate limited (different key has separate quota)
 * - 403: Unauthorized / access denied (different key may have access)
 * - 404: Model not found (different key may have access to different models)
 * - 401: Invalid API key (other keys may be valid)
 * - 5xx: Server errors (may be transient or load-balanced per key)
 */
export function isRetryableGroqError(error: any): boolean {
    if (error.status === 429) return true;  // Rate limit
    if (error.status === 403) return true;  // Access denied — try next key
    if (error.status === 404) return true;  // Model not found — try next key or model
    if (error.status === 401) return true;  // Invalid key — try next
    if (error.status >= 500 && error.status < 600) return true;  // Server error
    return false;
}

/**
 * Determines if an error is model-related (not found, no access) and should
 * trigger a model fallback rather than just a key rotation.
 */
function isModelError(error: any): boolean {
    if (error.status === 404) return true;
    if (error.status === 403) return true;
    // Check error messages for model-related issues
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("model_not_found")) return true;
    if (msg.includes("model not found")) return true;
    if (msg.includes("does not exist")) return true;
    if (msg.includes("not supported")) return true;
    if (msg.includes("access")) return true;
    return false;
}

/**
 * Maps common Groq API errors to user-friendly messages.
 */
function getUserFriendlyError(error: any, model?: string): string {
    const status = error.status;
    const msg = (error.message || "").toLowerCase();

    if (status === 404 || msg.includes("model_not_found") || msg.includes("does not exist")) {
        return `The AI model "${model || "requested"}" is currently unavailable. Please try again in a few moments.`;
    }
    if (status === 403 || msg.includes("access")) {
        return `Access denied to the AI service. Please check your API key permissions.`;
    }
    if (status === 429 || msg.includes("rate")) {
        return "The AI is currently under high load (Too Many Requests). Please wait a moment and try again.";
    }
    if (status === 401) {
        return "Invalid API key. Please check your Groq API key configuration.";
    }
    if (status === 400) {
        return "Invalid request to AI service. Please try rephrasing your input.";
    }
    if (status && status >= 500) {
        return "The AI service is temporarily unavailable. Please try again shortly.";
    }
    if (msg.includes("timeout") || msg.includes("timed out")) {
        return "The AI request timed out. Please try again with a shorter input.";
    }
    return "An unexpected AI error occurred. Please try again.";
}

/**
 * Transcribe audio using Groq's Whisper API with automatic multi-key rotation.
 * If a retryable error is encountered (rate limit, invalid key, server error),
 * it retries with the next available API key.
 */
export async function transcribeWithGroqRotation(
    audioFilePath: string,
    options?: {
        model?: string;
        language?: string;
    }
): Promise<string> {
    // Refresh clients in case env vars changed since import time
    groqClients = getGroqClients();
    if (currentKeyIndex >= groqClients.length) {
        currentKeyIndex = 0;
    }

    const numClients = groqClients.length;

    for (let attempt = 0; attempt < numClients; attempt++) {
        const result = getNextGroqClient();
        if (!result) {
          throw new Error("No Groq API clients available for STT transcription.");
        }
        const { client, index } = result;

        try {
            const transcription = await client.audio.transcriptions.create({
                file: fs.createReadStream(audioFilePath),
                model: options?.model || "whisper-large-v3",
                language: options?.language || "en",
            });

            console.log(`[Groq STT] Transcription succeeded with key #${index + 1}`);
            return transcription.text;
        } catch (error: any) {
            const retryable = isRetryableGroqError(error);
            console.error(
                `[Groq STT] Key #${index + 1} failed (${error.status || "unknown"}): ${error.message || "Unknown error"}` +
                (retryable && attempt < numClients - 1 ? " — trying next key..." : "")
            );

            // If this is the last attempt or the error isn't retryable, throw
            if (attempt >= numClients - 1 || !retryable) {
                throw error;
            }
        }
    }

    throw new Error("All Groq API keys exhausted for STT.");
}

/**
 * Generate a completion using Groq LPU with multi-key round-robin rotation
 * and automatic model fallback.
 *
 * If a model returns 404 (not found) or 403 (no access), the system
 * automatically tries the next model in the fallback chain:
 *   llama-3.3-70b-versatile → deepseek-r1-distill-llama-70b → llama-3.1-8b-instant
 *
 * All requests are load-balanced across all configured API keys.
 */
export async function generateGroqCompletion(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: {
        model?: string;
        temperature?: number;
        max_tokens?: number;
        response_format?: { type: "json_object" };
    }
) {
    const groqMessages = messages.map(m => ({
        role: m.role,
        content: m.content
    }));

    const groqOptions: any = {
        model: resolveModel(),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 4096,
    };
    if (options?.response_format) {
        groqOptions.response_format = options.response_format;
    }

    const response = await analyzeWithGroqLPU(groqMessages, groqOptions);
    let textContent = response.choices[0]?.message?.content || "";

    // Robust JSON extraction for json_object responses
    if (options?.response_format?.type === "json_object") {
        const jsonBlockMatch = textContent.match(/```json\n([\s\S]*?)\n```/) || textContent.match(/```([\s\S]*?)```/);
        if (jsonBlockMatch) {
            textContent = jsonBlockMatch[1];
        } else {
            const firstBrace = textContent.indexOf('{');
            const lastBrace = textContent.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                textContent = textContent.substring(firstBrace, lastBrace + 1);
            }
        }
    }

    return textContent.trim();
}

/**
 * Migration shim: keeps the old 'chatWithGroq' signature but now routes directly
 * to Groq LPU with round-robin key rotation and model fallback (no Bedrock).
 *
 * Errors are normalized to include user-friendly messages.
 */
export async function chatWithGroq(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options: any = {}
) {
    try {
        const textResponse = await generateGroqCompletion(messages, options);
        return {
            choices: [
                {
                    message: {
                        content: textResponse
                    }
                }
            ]
        };
    } catch (error: any) {
        console.error("[Groq] chatWithGroq error:", error);

        // Normalize error to include user-friendly message
        const model = options?.model || getActiveModel();
        const friendlyMessage = getUserFriendlyError(error, model);
        const normalizedError = new Error(friendlyMessage);
        (normalizedError as any).status = error.status || 500;
        (normalizedError as any).originalError = error.message;
        throw normalizedError;
    }
}

/**
 * Native Groq Client completion function with automatic multi-key rotation
 * AND automatic model fallback.
 *
 * Model fallback chain:
 *   1. llama-3.3-70b-versatile (most capable)
 *   2. deepseek-r1-distill-llama-70b (fallback)
 *   3. llama-3.1-8b-instant (last resort)
 *
 * For each model, it tries ALL configured API keys in round-robin order.
 * If a model returns 404 (model_not_found) or 403 (no access), it falls
 * back to the next model in the chain.
 *
 * This ensures the user NEVER sees a model selection error.
 */
export async function analyzeWithGroqLPU(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options: any = {}
) {
    // Refresh clients in case env vars changed since import time
    groqClients = getGroqClients();
    // Guard against index overflow if number of keys decreased
    if (currentKeyIndex >= groqClients.length) {
        currentKeyIndex = 0;
    }

    const numClients = groqClients.length;
    if (numClients === 0) {
        throw new Error("No Groq API clients available for completion.");
    }

    // Determine model chain: start with requested model, fallback through chain
    const requestedModel = options.model || getActiveModel();
    const modelChain = buildModelChain(requestedModel);

    let lastError: any = null;

    // Try each model in the chain
    for (let modelIndex = 0; modelIndex < modelChain.length; modelIndex++) {
        const currentModel = modelChain[modelIndex];

        // Try each client in round-robin order for this model
        for (let attempt = 0; attempt < numClients; attempt++) {
            const result = getNextGroqClient();
            if (!result) {
                throw new Error("No Groq API clients available for completion.");
            }
            const { client, index } = result;

            try {
                const response = await client.chat.completions.create({
                    messages: messages as any,
                    model: currentModel,
                    temperature: options.temperature ?? 0.3,
                    max_tokens: options.max_tokens ?? 4096,
                    response_format: options.response_format,
                });

                console.log(`[Groq] Model "${currentModel}" succeeded with key #${index + 1}`);

                return {
                    choices: [
                        {
                            message: {
                                content: response.choices[0]?.message?.content || ""
                            }
                        }
                    ]
                };
            } catch (error: any) {
                lastError = error;
                const retryable = isRetryableGroqError(error);
                const modelError = isModelError(error);

                console.error(
                    `[Groq] Model "${currentModel}" key #${index + 1} failed (${error.status || "unknown"}): ${error.message || "Unknown error"}` +
                    (modelError && modelIndex < modelChain.length - 1 ? " — trying next model..." : "") +
                    (retryable && attempt < numClients - 1 ? " — trying next key..." : "")
                );

                // If this is a model error (404/403) and we have more models to try,
                // break out of key loop and try the next model
                if (modelError && modelIndex < modelChain.length - 1) {
                    console.log(`[Groq] Falling back to next model: ${modelChain[modelIndex + 1]}`);
                    // Reset key index for the next model
                    currentKeyIndex = (currentKeyIndex + attempt) % numClients;
                    break;
                }

                // If this is the last attempt or the error isn't retryable, and
                // we have no more models, throw with user-friendly message
                if (attempt >= numClients - 1 || !retryable) {
                    if (modelIndex >= modelChain.length - 1) {
                        // All models exhausted — throw with friendly message
                        const friendlyMessage = getUserFriendlyError(error, currentModel);
                        const friendlyError = new Error(friendlyMessage);
                        (friendlyError as any).status = error.status || 500;
                        (friendlyError as any).originalError = error.message;
                        throw friendlyError;
                    }
                    // More models to try
                    break;
                }

                // Otherwise, continue to the next key (retryable error)
            }
        }
    }

    // Should never reach here, but just in case
    const friendlyMessage = getUserFriendlyError(lastError, modelChain[modelChain.length - 1]);
    const finalError = new Error(friendlyMessage);
    (finalError as any).status = lastError?.status || 500;
    (finalError as any).originalError = lastError?.message || "Unknown error";
    throw finalError;
}

/**
 * Build a model fallback chain starting from the requested model.
 * If the requested model is already in the fallback list, it starts from there.
 * Otherwise, it prepends the requested model to the standard fallback chain.
 */
function buildModelChain(requestedModel: string): string[] {
    const chain: string[] = [];

    // Start with the requested model
    chain.push(requestedModel);

    // Add standard fallbacks, skipping duplicates
    for (const model of GROQ_MODEL_FALLBACKS) {
        if (!chain.includes(model)) {
            chain.push(model);
        }
    }

    return chain;
}
