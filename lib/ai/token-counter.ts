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
  expectedOutput: number;
  safe: boolean;
  usagePercent: number;
  provider: string;
  limit: number;
}

// Known provider rate limits (TPM = tokens per minute)
// Groq free-tier limits: 12000 TPM for llama-3.3-70b-versatile
// The per-request effective limit is the same as the TPM limit.
const PROVIDER_LIMITS: Record<string, { tpm: number; maxContext: number }> = {
  groq: { tpm: 12000, maxContext: 128000 },
  bedrock: { tpm: 60000, maxContext: 128000 },
  gemini: { tpm: 60000, maxContext: 128000 },
};

/**
 * SAFETY THRESHOLDS:
 * - SAFE_LIMIT:  10 000 tokens — trigger compression when exceeded
 * - HARD_LIMIT:  11 000 tokens — never send a request above this
 * These apply to (systemPrompt + userPrompt + maxOutputTokens).
 */
export const SAFE_LIMIT = 10_000;
export const HARD_LIMIT = 11_000;

/**
 * Estimate token count from text.
 * Uses a 4:1 character-to-token ratio which is a common heuristic.
 * More accurate for English text than code.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
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
 * Estimate total token usage for the complete request (prompt + output).
 * This is the number that counts against Groq's per-request / per-minute limit.
 */
export function estimateTotalTokens(
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number = 2000,
  provider: string = "groq"
): TokenEstimate {
  const systemTokens = estimateTokens(systemPrompt);
  const userTokens = estimateTokens(userPrompt);
  const outputTokens = maxOutputTokens;
  const total = systemTokens + userTokens + outputTokens;
  const limits = getProviderLimits(provider);
  const usagePercent = Math.round((total / limits.tpm) * 100);
  const safe = total <= limits.tpm;

  return {
    total,
    systemPrompt: systemTokens,
    userPrompt: userTokens,
    expectedOutput: outputTokens,
    safe,
    usagePercent,
    provider,
    limit: limits.tpm,
  };
}

/**
 * Legacy — estimate prompt-only tokens (no output).
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
    expectedOutput: 0,
    safe,
    usagePercent,
    provider,
    limit: limits.tpm,
  };
}

// ─── Detailed Token Breakdown Logging ─────────────────────────────────

export interface TokenBreakdown {
  systemPromptTokens: number;
  userPromptTokens: number;
  expectedOutputTokens: number;
  totalTokens: number;
  limit: number;
  usagePercent: number;
  isOverSafe: boolean;
  isOverHard: boolean;
  provider: string;
  model: string;
}

/**
 * Log a detailed token breakdown before every AI request.
 * Returns the breakdown object for programmatic use.
 */
export function logTokenBreakdown(
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number,
  provider: string,
  model: string
): TokenBreakdown {
  const spTokens = estimateTokens(systemPrompt);
  const upTokens = estimateTokens(userPrompt);
  const outputTokens = maxOutputTokens;
  const total = spTokens + upTokens + outputTokens;
  const limits = getProviderLimits(provider);
  const usagePercent = Math.round((total / limits.tpm) * 100);
  const isOverSafe = total > SAFE_LIMIT;
  const isOverHard = total > HARD_LIMIT;

  console.log("═══════════════════════════════════════════");
  console.log("  [AI Token Analysis]");
  console.log("───────────────────────────────────────────");
  console.log(`  System Prompt Tokens:     ${spTokens}`);
  console.log(`  Resume / User Tokens:     ${upTokens}`);
  console.log(`  Expected Output Tokens:   ${outputTokens}`);
  console.log(`  ─────────────────────────`);
  console.log(`  Total Estimated Tokens:   ${total}`);
  console.log(`  Provider Limit (TPM):     ${limits.tpm}`);
  console.log(`  Usage:                    ${usagePercent}% of limit`);
  console.log(`  Safe Threshold (${SAFE_LIMIT}): ${isOverSafe ? "⚠ EXCEEDED" : "✓ OK"}`);
  console.log(`  Hard Cap (${HARD_LIMIT}):     ${isOverHard ? "✗ EXCEEDED — MUST COMPRESS" : "✓ OK"}`);
  console.log(`  Provider:                 ${provider}`);
  console.log(`  Model:                    ${model}`);
  console.log("═══════════════════════════════════════════");

  return {
    systemPromptTokens: spTokens,
    userPromptTokens: upTokens,
    expectedOutputTokens: outputTokens,
    totalTokens: total,
    limit: limits.tpm,
    usagePercent,
    isOverSafe,
    isOverHard,
    provider,
    model,
  };
}

/**
 * Log token diagnostics to console (legacy wrapper — delegates to logTokenBreakdown).
 */
export function logTokenDiagnostics(
  systemPrompt: string,
  userPrompt: string,
  provider: string,
  model: string
): TokenEstimate {
  return estimatePromptTokens(systemPrompt, userPrompt, provider);
}
