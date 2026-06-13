/**
 * lib/ai/token-counter.ts
 *
 * Lightweight token estimation for monitoring prompt sizes before AI requests.
 * Uses a simple heuristic (chars / 4) for estimation since we don't have
 * access to the model's actual tokenizer at runtime.
 *
 * Provider limits are tracked so we can warn before exceeding them.
 */

export interface TokenEstimate {
  total: number;
  systemPrompt: number;
  userPrompt: number;
  safe: boolean;
  usagePercent: number;
  provider: string;
  limit: number;
}

// Known provider rate limits (TPM = tokens per minute)
const PROVIDER_LIMITS: Record<string, { tpm: number; maxContext: number }> = {
  groq: { tpm: 12000, maxContext: 128000 },
  bedrock: { tpm: 60000, maxContext: 128000 },
  gemini: { tpm: 60000, maxContext: 128000 },
};

/**
 * Estimate token count from text.
 * Uses a 4:1 character-to-token ratio which is a common heuristic.
 * More accurate for English text than code.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Count words and special tokens roughly
  // ~1.3 tokens per word on average for English, or ~4 chars per token
  return Math.ceil(text.length / 4);
}

/**
 * Get provider limits for a given provider name.
 */
export function getProviderLimits(provider: string): { tpm: number; maxContext: number } {
  const key = provider.toLowerCase();
  return PROVIDER_LIMITS[key] || { tpm: 12000, maxContext: 128000 };
}

/**
 * Estimate total token usage for a prompt and return status info.
 */
export function estimatePromptTokens(
  systemPrompt: string,
  userPrompt: string,
  provider: string = "groq"
): TokenEstimate {
  const systemTokens = estimateTokens(systemPrompt);
  const userTokens = estimateTokens(userPrompt);
  const total = systemTokens + userTokens;
  const limits = getProviderLimits(provider);
  const usagePercent = Math.round((total / limits.tpm) * 100);
  const safe = total <= limits.tpm;

  return {
    total,
    systemPrompt: systemTokens,
    userPrompt: userTokens,
    safe,
    usagePercent,
    provider,
    limit: limits.tpm,
  };
}

/**
 * Log token diagnostics to console.
 */
export function logTokenDiagnostics(
  systemPrompt: string,
  userPrompt: string,
  provider: string,
  model: string
): TokenEstimate {
  const estimate = estimatePromptTokens(systemPrompt, userPrompt, provider);

  console.log(`[AI] Prompt Tokens: ${estimate.total}`);
  console.log(`  Provider: ${provider}`);
  console.log(`  Model: ${model}`);
  console.log(`  Status: ${estimate.safe ? "Safe" : "LIMIT EXCEEDED"}`);
  console.log(`  Usage: ${estimate.usagePercent}% of ${estimate.limit} TPM limit`);

  if (estimate.usagePercent > 90) {
    console.warn(`[AI] ⚠ Prompt is at ${estimate.usagePercent}% of provider limit`);
  }
  if (!estimate.safe) {
    console.error(`[AI] ✗ Prompt exceeds ${estimate.limit} TPM limit by ${estimate.total - estimate.limit} tokens`);
  }

  return estimate;
}
