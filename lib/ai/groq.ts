import Groq from "groq-sdk";
import * as fs from "fs";

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
 * - 401: Invalid API key (other keys may be valid)
 * - 5xx: Server errors (may be transient or load-balanced per key)
 */
export function isRetryableGroqError(error: any): boolean {
    if (error.status === 429) return true;  // Rate limit
    if (error.status === 401) return true;  // Invalid key — try next
    if (error.status >= 500 && error.status < 600) return true;  // Server error
    return false;
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
 * Generate a completion using Groq LPU with multi-key round-robin rotation.
 * No Bedrock fallback — Groq-only.
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
        model: options?.model || "llama-3.3-70b-versatile",
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
 * to Groq LPU with round-robin key rotation (no Bedrock).
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
        throw error;
    }
}

/**
 * Native Groq Client completion function with automatic multi-key rotation.
 * If a retryable error is encountered (rate limit, invalid key, server error),
 * it automatically retries with the next available API key in round-robin fashion.
 * Use this for high speed parsing without AWS rate limit constraints.
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

    // Try each client in round-robin order
    const numClients = groqClients.length;

    for (let attempt = 0; attempt < numClients; attempt++) {
        const result = getNextGroqClient();
        if (!result) {
          throw new Error("No Groq API clients available for completion.");
        }
        const { client, index } = result;

        try {
            const response = await client.chat.completions.create({
                messages: messages as any,
                model: options.model || "llama-3.3-70b-versatile",
                temperature: options.temperature ?? 0.3,
                max_tokens: options.max_tokens ?? 4096,
                response_format: options.response_format,
            });

            console.log(`[Groq] Request succeeded with key #${index + 1}`);

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
            const retryable = isRetryableGroqError(error);
            console.error(
                `[Groq] Key #${index + 1} failed (${error.status || "unknown"}): ${error.message || "Unknown error"}` +
                (retryable && attempt < numClients - 1 ? " — trying next key..." : "")
            );

            // If this is the last attempt or the error isn't retryable, throw
            if (attempt >= numClients - 1 || !retryable) {
                throw error;
            }

            // Otherwise, continue to the next key (retryable error like rate limit, bad key, server error)
        }
    }

    // Should never reach here, but just in case
    throw new Error("All Groq API keys exhausted and failed.");
}
