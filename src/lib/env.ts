import { z } from "zod";

import type { RepositoryMode } from "@/db/repository-types";

const booleanString = z
  .union([z.literal("true"), z.literal("false")])
  .transform((value) => value === "true");

const rawEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  APP_DATA_MODE: z.enum(["memory", "supabase"]).optional(),
  ALLOW_MEMORY_MODE_IN_PRODUCTION: booleanString.optional().default(false),
  OPENAI_API_KEY: z.string().min(1).optional(),
  NEWSAPI_API_KEY: z.string().min(1).optional(),
  JUDILIBRE_API_KEYID: z.string().min(1).optional(),
  // Legifrance via official DILA/PISTE API (T-RT3B). OAuth2 client-credentials
  // pair from PISTE enrollment; when absent the connector degrades honestly.
  LEGIFRANCE_PISTE_CLIENT_ID: z.string().min(1).optional(),
  LEGIFRANCE_PISTE_CLIENT_SECRET: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  // DEPRECATED: use AI_ENABLE_PROCESSING instead. Kept for backward compat. Remove in a future env cleanup (F4).
  AI_PROCESSING_ENABLED: booleanString.optional().default(false),
  AI_ENABLE_PROCESSING: booleanString.optional(),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().positive().default(20),
  AI_MAX_INPUT_TOKENS_PER_ITEM: z.coerce.number().int().positive().default(12000),
  AI_MAX_ITEMS_PER_SCAN: z.coerce.number().int().positive().default(10),
  AI_MODEL_RELEVANCE: z.string().default("gpt-5.4-nano"),
  AI_MODEL_CLASSIFICATION: z.string().default("gpt-5.4-nano"),
  AI_MODEL_SUMMARY: z.string().default("gpt-5.4-mini"),
  AI_MODEL_DEEP_ANALYSIS: z.string().default("gpt-5.4"),
  AI_COST_GUARDRAILS_ENABLED: booleanString.optional().default(true),
  ADMIN_AUTH_SECRET: z.string().min(24).optional(),
  ADMIN_USERNAME: z.string().min(1).default("admin"),
  ADMIN_PASSWORD: z.string().min(1).default("change-me"),
  CRON_SECRET: z.string().min(16).optional(),
  ALERT_WEBHOOK_URL: z.string().url().optional(),
  // Upstash Redis — optional, enables distributed rate limiting (F6)
  // Install @upstash/redis and @upstash/ratelimit to activate.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  // ── Ingestion pipeline ──────────────────────────────────────────────────
  FIRECRAWL_API_KEY: z.string().min(1).optional(),
  INGESTION_SECRET: z.string().min(16).optional(),
  SCRAPING_USER_AGENT: z.string().optional(),
  SCRAPING_RATE_LIMIT_PER_DOMAIN: z.coerce.number().int().positive().default(5),
  SCRAPLING_WORKER_URL: z.string().url().optional(),
});

export class EnvValidationError extends Error {}

export interface AppEnv {
  NODE_ENV: "development" | "test" | "production";
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  APP_DATA_MODE: RepositoryMode;
  ALLOW_MEMORY_MODE_IN_PRODUCTION: boolean;
  OPENAI_API_KEY?: string;
  NEWSAPI_API_KEY?: string;
  JUDILIBRE_API_KEYID?: string;
  /** Legifrance/PISTE OAuth2 client id — enables the official DILA API path (T-RT3B) */
  LEGIFRANCE_PISTE_CLIENT_ID?: string;
  /** Legifrance/PISTE OAuth2 client secret — required alongside the client id (T-RT3B) */
  LEGIFRANCE_PISTE_CLIENT_SECRET?: string;
  OPENAI_MODEL: string;
  /** @deprecated Use AI_ENABLE_PROCESSING instead (F4). Will be removed in a future env cleanup. */
  AI_PROCESSING_ENABLED: boolean;
  AI_ENABLE_PROCESSING: boolean;
  AI_MONTHLY_BUDGET_USD: number;
  AI_MAX_INPUT_TOKENS_PER_ITEM: number;
  AI_MAX_ITEMS_PER_SCAN: number;
  AI_MODEL_RELEVANCE: string;
  AI_MODEL_CLASSIFICATION: string;
  AI_MODEL_SUMMARY: string;
  AI_MODEL_DEEP_ANALYSIS: string;
  AI_COST_GUARDRAILS_ENABLED: boolean;
  ADMIN_AUTH_SECRET: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  CRON_SECRET?: string;
  ALERT_WEBHOOK_URL?: string;
  /** Upstash Redis REST URL — enables distributed rate limiting when set (F6) */
  UPSTASH_REDIS_REST_URL?: string;
  /** Upstash Redis REST token — required alongside UPSTASH_REDIS_REST_URL (F6) */
  UPSTASH_REDIS_REST_TOKEN?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  DATABASE_URL?: string;
  // ── Ingestion pipeline ──────────────────────────────────────────────────
  FIRECRAWL_API_KEY?: string;
  INGESTION_SECRET?: string;
  SCRAPING_USER_AGENT?: string;
  SCRAPING_RATE_LIMIT_PER_DOMAIN: number;
  SCRAPLING_WORKER_URL?: string;
}

function buildEnv(): AppEnv {
  const parsed = rawEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    APP_DATA_MODE: process.env.APP_DATA_MODE,
    ALLOW_MEMORY_MODE_IN_PRODUCTION:
      process.env.ALLOW_MEMORY_MODE_IN_PRODUCTION ?? "false",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    NEWSAPI_API_KEY: process.env.NEWSAPI_API_KEY,
    JUDILIBRE_API_KEYID: process.env.JUDILIBRE_API_KEYID,
    LEGIFRANCE_PISTE_CLIENT_ID: process.env.LEGIFRANCE_PISTE_CLIENT_ID,
    LEGIFRANCE_PISTE_CLIENT_SECRET: process.env.LEGIFRANCE_PISTE_CLIENT_SECRET,
    OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    AI_PROCESSING_ENABLED: process.env.AI_PROCESSING_ENABLED ?? "false",
    AI_ENABLE_PROCESSING: process.env.AI_ENABLE_PROCESSING,
    AI_MONTHLY_BUDGET_USD: process.env.AI_MONTHLY_BUDGET_USD ?? "20",
    AI_MAX_INPUT_TOKENS_PER_ITEM:
      process.env.AI_MAX_INPUT_TOKENS_PER_ITEM ?? "12000",
    AI_MAX_ITEMS_PER_SCAN: process.env.AI_MAX_ITEMS_PER_SCAN ?? "10",
    AI_MODEL_RELEVANCE: process.env.AI_MODEL_RELEVANCE ?? "gpt-5.4-nano",
    AI_MODEL_CLASSIFICATION:
      process.env.AI_MODEL_CLASSIFICATION ?? "gpt-5.4-nano",
    AI_MODEL_SUMMARY: process.env.AI_MODEL_SUMMARY ?? "gpt-5.4-mini",
    AI_MODEL_DEEP_ANALYSIS: process.env.AI_MODEL_DEEP_ANALYSIS ?? "gpt-5.4",
    AI_COST_GUARDRAILS_ENABLED:
      process.env.AI_COST_GUARDRAILS_ENABLED ?? "true",
    ADMIN_AUTH_SECRET: process.env.ADMIN_AUTH_SECRET,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? "admin",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "change-me",
    CRON_SECRET: process.env.CRON_SECRET,
    ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    INGESTION_SECRET: process.env.INGESTION_SECRET,
    SCRAPING_USER_AGENT: process.env.SCRAPING_USER_AGENT,
    SCRAPING_RATE_LIMIT_PER_DOMAIN: process.env.SCRAPING_RATE_LIMIT_PER_DOMAIN ?? "5",
    SCRAPLING_WORKER_URL: process.env.SCRAPLING_WORKER_URL,
  });

  const isProduction = parsed.NODE_ENV === "production";
  const appDataMode = parsed.APP_DATA_MODE ?? (isProduction ? undefined : "memory");

  if (!appDataMode) {
    throw new EnvValidationError(
      "APP_DATA_MODE is required in production. Set APP_DATA_MODE=supabase, or set APP_DATA_MODE=memory only with ALLOW_MEMORY_MODE_IN_PRODUCTION=true.",
    );
  }

  if (
    isProduction &&
    appDataMode === "memory" &&
    !parsed.ALLOW_MEMORY_MODE_IN_PRODUCTION
  ) {
    throw new EnvValidationError(
      "Memory mode is not allowed in production by default. Set APP_DATA_MODE=supabase, or explicitly set ALLOW_MEMORY_MODE_IN_PRODUCTION=true if you intentionally want memory mode.",
    );
  }

  if (!parsed.ADMIN_AUTH_SECRET) {
    throw new EnvValidationError(
      "ADMIN_AUTH_SECRET is required. Provide a strong secret with at least 24 characters for admin session signing.",
    );
  }

  if (appDataMode === "supabase") {
    if (!parsed.NEXT_PUBLIC_SUPABASE_URL) {
      throw new EnvValidationError(
        "APP_DATA_MODE=supabase requires NEXT_PUBLIC_SUPABASE_URL.",
      );
    }
    if (!parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new EnvValidationError(
        "APP_DATA_MODE=supabase requires NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    }
    if (!parsed.SUPABASE_SERVICE_ROLE_KEY) {
      throw new EnvValidationError(
        "APP_DATA_MODE=supabase requires SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
  }

  // F4: deprecation warning for the legacy AI_PROCESSING_ENABLED alias.
  // In dev mode, surface the warning so operators can migrate their env config.
  if (
    parsed.NODE_ENV === "development" &&
    parsed.AI_PROCESSING_ENABLED &&
    !parsed.AI_ENABLE_PROCESSING
  ) {
    console.warn(
      "[env] AI_PROCESSING_ENABLED is deprecated. " +
      "Use AI_ENABLE_PROCESSING=true instead. " +
      "The legacy alias will be removed in a future env cleanup (Phase F4).",
    );
  }

  const aiProcessingEnabled =
    parsed.AI_ENABLE_PROCESSING ?? parsed.AI_PROCESSING_ENABLED;

  return {
    ...parsed,
    APP_DATA_MODE: appDataMode as RepositoryMode,
    AI_PROCESSING_ENABLED: aiProcessingEnabled,
    AI_ENABLE_PROCESSING: aiProcessingEnabled,
    ADMIN_AUTH_SECRET: parsed.ADMIN_AUTH_SECRET,
  };
}

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = buildEnv();
  }

  return cachedEnv;
}

export function resetEnvForTests() {
  cachedEnv = null;
}

export function isScanJobRouteEnqueueOnlyEnabled(
  rawEnv: NodeJS.ProcessEnv = process.env,
) {
  return rawEnv.SCAN_JOB_ROUTE_ENQUEUE_ONLY === "true";
}

export const env = new Proxy({} as AppEnv, {
  get(_target, property) {
    return getEnv()[property as keyof AppEnv];
  },
});
