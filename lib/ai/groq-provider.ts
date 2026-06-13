// lib/ai/groq-provider.ts

import { GenerateParams, UnifiedResponse } from "./types";
import { aiCache } from "./cache";
import { logger } from "./logger";
import { isRetryableGroqError, getNextGroqClient, getGroqClientCount } from "./groq";
import { MODELS } from "./models";

// Map to track temporarily unavailable keys
const unavailableMap = new Map<number, number>(); // index -> timestamp until available
const UNAVAILABLE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Call Groq with round‑robin key rotation and key health tracking.
 *
 * Flow:
 *   1. Get the next client from the round‑robin counter.
 *   2. If that key is temporarily blacklisted (repeated 429s), skip it.
 *   3. Mark the key as blacklisted for 5 minutes on retryable errors.
 *   4. Retry with the next key automatically.
 *
 * Request cycling: 1 → 2 → 3 → 4 → 5 → 1 → 2 → 3 → ... (indefinitely)
 */
async function callGroq(params: GenerateParams): Promise<UnifiedResponse> {
  const start = Date.now();
  const { systemPrompt, userPrompt, temperature, maxTokens, model } = params;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const numClients = getGroqClientCount();
  if (numClients === 0) {
    throw new Error("No Groq API keys configured");
  }

  for (let attempt = 0; attempt < numClients; attempt++) {
    const result = getNextGroqClient();
    if (!result) {
      throw new Error("No Groq API clients available");
    }
    const { client, index } = result;

    // Skip temporarily disabled keys (repeated 429s)
    const now = Date.now();
    const blockedUntil = unavailableMap.get(index) ?? 0;
    if (now < blockedUntil) {
      continue;
    }

    console.log(`[AI] Using Groq Key #${index + 1}`);

    try {
      const response = await client.chat.completions.create({
        messages: messages as any,
        model: model || MODELS.GROQ_PRIMARY,
        temperature: temperature ?? 0.3,
        max_tokens: maxTokens ?? 4096,
      });
      const content = response.choices[0]?.message?.content ?? "";
      const duration = Date.now() - start;
      logger.success("Groq", model || MODELS.GROQ_PRIMARY, duration);
      return {
        content,
        providerUsed: "Groq",
        modelUsed: model || MODELS.GROQ_PRIMARY,
        responseTime: duration,
      };
    } catch (error: any) {
      if (isRetryableGroqError(error)) {
        // Temporarily disable this key for 5 minutes
        unavailableMap.set(index, Date.now() + UNAVAILABLE_DURATION_MS);
        logger.retry("Groq", index, error);
        console.warn(`[AI] Key #${index + 1} disabled for 5 minutes (${error.status || "error"})`);

        if (attempt === numClients - 1) {
          throw new Error("All Groq API keys exhausted for this request");
        }
        continue;
      }
      // Non‑retryable error — propagate immediately
      throw error;
    }
  }

  throw new Error("Groq request failed after exhausting all keys");
}

export const groqProvider = {
  name: "Groq",
  async generate(params: GenerateParams): Promise<UnifiedResponse> {
    // Cache key based on feature + prompts
    const cacheKey = `groq:${params.feature ?? ""}:${params.systemPrompt}:${params.userPrompt}`;
    const cached = aiCache.get(cacheKey);
    if (cached) {
      logger.hit(cacheKey);
      return cached as UnifiedResponse;
    }
    const result = await callGroq(params);
    aiCache.set(cacheKey, result);
    return result;
  },
};
