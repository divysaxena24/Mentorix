// lib/ai/logger.ts

/** Simple logger that writes structured messages to console */
export const logger = {
  success: (provider: string, model: string, durationMs: number) => {
    console.log(`[AI] Provider: ${provider} | Model: ${model} | Time: ${durationMs}ms | Status: Success`);
  },
  retry: (provider: string, keyIndex: number, error: any) => {
    console.warn(`[AI] ${provider} key #${keyIndex + 1} retryable error (${error.status || "unknown"}): ${error.message || ""}`);
  },
  error: (provider: string, error: any) => {
    console.error(`[AI] Provider: ${provider} | Error: ${error.message || error}`);
  },
  hit: (cacheKey: string) => {
    console.log(`[AI] Cache hit for ${cacheKey}`);
  },
  /** Log a structured startup configuration line (format: "  Label: ✓ detail") */
  config: (label: string, status: "✓" | "✗", detail: string) => {
    console.log(`  ${label}: ${status} ${detail}`);
  },
  /** Log a section header for grouped startup output */
  header: (title: string) => {
    console.log(`\n[${title}]`);
  },
};
