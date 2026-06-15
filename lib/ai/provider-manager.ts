// lib/ai/provider-manager.ts
//
// Groq-only AI provider with round-robin API key rotation.
// All Mentorix AI features use this shared system for load balancing.

import {
  GenerateParams,
  UnifiedResponse,
} from "./types";
import { groqProvider } from "./groq-provider";
import { logger } from "./logger";
import { aiCache } from "./cache";

// ─── Environment Key Loader ────────────────────────────────────────────

/**
 * List of env var names checked for Groq API keys.
 * Primary format: GROQ_API_KEY1, GROQ_API_KEY2, ..., GROQ_API_KEY5
 * Also supports: GROQ_API_KEY (single-key config) and GROQ_API_KEY_1..5
 */
const GROQ_ENV_VARS = (() => {
  const vars = ["GROQ_API_KEY"];
  for (let i = 1; i <= 5; i++) {
    vars.push(`GROQ_API_KEY_${i}`);
    vars.push(`GROQ_API_KEY${i}`);
  }
  return vars;
})();

/**
 * Load all Groq API keys from environment variables.
 * Returns a deduplicated array of non-empty key strings.
 */
function loadGroqKeys(): string[] {
  const keys: string[] = [];
  for (const varName of GROQ_ENV_VARS) {
    const val = process.env[varName];
    if (val && typeof val === "string" && val.trim().length > 0) {
      keys.push(val.trim());
    }
  }
  return [...new Set(keys)];
}

// ─── Startup Validation ────────────────────────────────────────────────

/**
 * Print a structured startup report showing Groq key count and
 * round-robin status.
 */
export function validateEnvironment(): void {
  logger.header("AI Config");

  const groqKeys = loadGroqKeys();
  logger.config("Groq Keys Found", String(groqKeys.length),
    groqKeys.length > 0
      ? `${groqKeys.length} keys found`
      : "no keys detected");

  logger.config("Round Robin", "Enabled", "requests cycle through all keys");

  logger.config("Provider", "Groq Only", "Bedrock removed");

  if (groqKeys.length === 0) {
    console.warn("\n  ⚠ No AI providers available. Check environment configuration.\n");
  } else {
    console.log(`  → Round Robin active: 1 → 2 → ... → ${groqKeys.length} → 1 → 2 → ...\n`);
  }
}

// Automatically run validation on import in non-test environments
if (process.env.NODE_ENV !== "test") {
  validateEnvironment();
}

// ─── Core AI Response Generation ───────────────────────────────────────

/**
 * Core function that sends requests through the Groq provider with
 * round-robin key rotation. The groq-provider handles:
 *   - Key rotation (1→2→3→4→5→1→...)
 *   - Key health tracking (temporarily disable keys on repeated 429s)
 *   - Retry with next key on rate limits / timeouts
 *
 * Throws only when ALL keys have been exhausted.
 */
export async function generateAIResponse(
  params: GenerateParams
): Promise<UnifiedResponse> {
  const cacheKey = `ai:${params.feature ??    ""}:${params.jsonMode ? "json:" : ""}:${params.systemPrompt}:${params.userPrompt}`;
  const cached = aiCache.get(cacheKey);
  if (cached) {
    logger.hit(cacheKey);
    return cached as UnifiedResponse;
  }

  // Groq is the only provider — all key rotation logic lives in groq-provider.ts
  try {
    const result = await groqProvider.generate(params);
    aiCache.set(cacheKey, result);
    return result;
  } catch (err: any) {
    logger.error("Groq", err);

    if (err.status) {
      throw err;
    }
    throw new Error("All Groq API keys exhausted for this request.", {
      cause: { status: 500, detail: err.message ?? "All keys failed" },
    });
  }
}
