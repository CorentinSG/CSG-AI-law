import OpenAI from "openai";

import { env } from "@/lib/env";

let cachedClient: OpenAI | null | undefined;

export function getOpenAiClient() {
  if (cachedClient !== undefined) return cachedClient;
  cachedClient = env.OPENAI_API_KEY ? new OpenAI({ apiKey: env.OPENAI_API_KEY }) : null;
  return cachedClient;
}
