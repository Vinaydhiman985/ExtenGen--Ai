import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.string().default('info'),

  // PostgreSQL / Supabase
  DATABASE_URL: z.string().optional(),
  PGHOST: z.string().optional(),
  PGPORT: z.coerce.number().optional(),
  PGDATABASE: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  PGSSLMODE: z.enum(['disable', 'require']).optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Google Generative AI — FREE embeddings via gemini-embedding-001 (768 dims)
  GOOGLE_API_KEY: z.string().default('mock'),
  EMBEDDING_MODEL: z.string().default('gemini-embedding-001'),
  EMBEDDING_DIMENSIONS: z.coerce.number().default(768),
  GEMINI_SUMMARY_MODEL: z.string().default('gemini-2.5-flash'),

  // Redis / BullMQ for Async Embedding Queue
  // If left empty, ExtenGen runs queue jobs synchronously in-process
  REDIS_URL: z.string().optional(),

  // GitHub integration
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),

  // Defaults for CLI / Single-Tenant Stdio mode
  DEFAULT_ORG_ID: z.string().uuid().default('00000000-0000-0000-0000-000000000001'),
  DEFAULT_USER_ID: z.string().uuid().default('00000000-0000-0000-0000-000000000002'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    // In test environment, fallback to defaults where possible
    if (process.env.NODE_ENV === 'test') {
      return envSchema.parse({
        NODE_ENV: 'test',
        GOOGLE_API_KEY: 'mock',
      });
    }
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}

export const env = loadEnv();
