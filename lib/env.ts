import { z } from "zod";

/**
 * Validates required environment variables at import time.
 * If any are missing, the app will fail fast with a clear error
 * instead of crashing with cryptic runtime errors.
 */
const serverEnvSchema = z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    NEXT_PUBLIC_NEON_DB_CONNECTION_STRING: z.string().min(1, "Database connection string is required"),
    NEXT_PUBLIC_SUPABASE_URL: z.string().min(1, "Supabase URL is required"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),
    YOUTUBE_API_KEY: z.string().min(1, "YouTube API key is required"),
});

function validateEnv() {
    const result = serverEnvSchema.safeParse(process.env);

    if (!result.success) {
        const missing = result.error.issues
            .map((issue) => `  ✗ ${issue.path.join(".")}: ${issue.message}`)
            .join("\n");

        console.error(
            `\n❌ Missing or invalid environment variables:\n${missing}\n\n` +
            `Please check your .env file and ensure all required variables are set.\n`
        );

        // In development, throw so it's obvious. In production, log but don't crash
        // since some routes may not need all variables.
        if (process.env.NODE_ENV === "development") {
            throw new Error("Missing required environment variables. See console output above.");
        }
    }

    return result.success ? result.data : process.env;
}

export const env = validateEnv();
