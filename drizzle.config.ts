import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({

    schema: './lib/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.NEXT_PUBLIC_NEON_DB_CONNECTION_STRING!,
    },
});
