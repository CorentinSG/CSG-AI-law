import { MemoryAiRegulationRepository } from "@/db/repositories/memory-repository";
import { SupabaseAiRegulationRepository } from "@/db/repositories/supabase-repository";
import type { AiRegulationRepository } from "@/db/repository-types";
import { RepositoryConfigurationError, type RepositoryMode } from "@/db/repository-types";
import { env } from "@/lib/env";

const memoryRepository = new MemoryAiRegulationRepository();
const supabaseRepository = new SupabaseAiRegulationRepository();

export function getRepositoryMode(): RepositoryMode {
  return env.APP_DATA_MODE;
}

export function getAiRegulationRepository(): AiRegulationRepository {
  const mode = getRepositoryMode();
  if (mode === "memory") return memoryRepository;
  if (mode === "supabase") return supabaseRepository;
  throw new RepositoryConfigurationError(`Unsupported APP_DATA_MODE: ${mode}`);
}

export function assertSupabaseConfigured() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new RepositoryConfigurationError(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
}
