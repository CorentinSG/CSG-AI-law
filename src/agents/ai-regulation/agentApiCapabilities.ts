export type AgentApiCapabilityStatus =
  | "available"
  | "missing_credentials"
  | "needs_user_setup"
  | "planned";

export type AgentApiCapabilityVerificationState =
  | "blocked"
  | "configured_unverified"
  | "live_verified";

export type AgentApiCapabilityUse =
  | "official_legal_database"
  | "legal_news_discovery"
  | "case_law_discovery"
  | "source_health";

export interface AgentApiCapability {
  id: string;
  label: string;
  status: AgentApiCapabilityStatus;
  verificationState: AgentApiCapabilityVerificationState;
  uses: AgentApiCapabilityUse[];
  regions: Array<"Europe" | "United States" | "Global">;
  envVars: string[];
  configuredEnvVars: string[];
  missingEnvVars: string[];
  implementedProvider?: string;
  userAction?: string;
  notes: string;
}

type AgentApiCapabilityEnv = Record<string, string | undefined>;

function hasEnv(name: string, rawEnv: AgentApiCapabilityEnv = process.env) {
  return typeof rawEnv[name] === "string" && rawEnv[name]!.trim().length > 0;
}

function hasAllEnv(names: string[], rawEnv: AgentApiCapabilityEnv = process.env) {
  return names.every((name) => hasEnv(name, rawEnv));
}

function getCourtListenerEnvVars(rawEnv: AgentApiCapabilityEnv) {
  if (hasEnv("COURTLISTENER_API_KEY", rawEnv)) return ["COURTLISTENER_API_KEY"];
  if (hasEnv("COURTLISTENER_API_TOKEN", rawEnv)) return ["COURTLISTENER_API_TOKEN"];
  return ["COURTLISTENER_API_KEY", "COURTLISTENER_API_TOKEN"];
}

export function listAgentApiCapabilities(
  rawEnv: AgentApiCapabilityEnv = process.env,
): AgentApiCapability[] {
  const newsApiReady = hasEnv("NEWSAPI_API_KEY", rawEnv);
  const judilibreReady = hasEnv("JUDILIBRE_API_KEYID", rawEnv);
  const courtListenerReady =
    hasEnv("COURTLISTENER_API_KEY", rawEnv) || hasEnv("COURTLISTENER_API_TOKEN", rawEnv);
  const courtListenerEnvVars = getCourtListenerEnvVars(rawEnv);
  const firecrawlReady = hasEnv("FIRECRAWL_API_KEY", rawEnv);
  const scraplingReady = hasEnv("SCRAPLING_WORKER_URL", rawEnv);
  const legalDataHunterReady =
    hasEnv("LEGAL_DATA_HUNTER_MCP_URL", rawEnv) || hasEnv("LEGAL_RESEARCH_MCP_URL", rawEnv);
  const legifranceReady = hasAllEnv(
    ["LEGIFRANCE_PISTE_CLIENT_ID", "LEGIFRANCE_PISTE_CLIENT_SECRET"],
    rawEnv,
  );

  const enrich = (
    capability: Omit<
      AgentApiCapability,
      "configuredEnvVars" | "missingEnvVars" | "verificationState"
    >,
  ): AgentApiCapability => {
    const configuredEnvVars = capability.envVars.filter((name) => hasEnv(name, rawEnv));
    const missingEnvVars = capability.envVars.filter((name) => !hasEnv(name, rawEnv));

    return {
      ...capability,
      verificationState: missingEnvVars.length > 0 ? "blocked" : "configured_unverified",
      configuredEnvVars,
      missingEnvVars,
    };
  };

  return [
    enrich({
      id: "firecrawl",
      label: "Firecrawl",
      status: firecrawlReady ? "available" : "missing_credentials",
      uses: ["legal_news_discovery", "official_legal_database", "source_health"],
      regions: ["Europe", "United States", "Global"],
      envVars: ["FIRECRAWL_API_KEY"],
      implementedProvider: "firecrawl",
      userAction: firecrawlReady
        ? undefined
        : "Set FIRECRAWL_API_KEY in Railway/Vercel for broad official-site crawling and hybrid discovery.",
      notes:
        "Broad crawl/map layer for official sites. Use with source-level publication rules; discovery-only results remain admin-only until verified.",
    }),
    enrich({
      id: "scrapling-sidecar",
      label: "Scrapling worker",
      status: scraplingReady ? "available" : "needs_user_setup",
      uses: ["official_legal_database", "case_law_discovery", "source_health"],
      regions: ["Europe", "United States", "Global"],
      envVars: ["SCRAPLING_WORKER_URL"],
      implementedProvider: "scrapling",
      userAction: scraplingReady
        ? undefined
        : "Deploy scrapling_worker as a Railway service and set SCRAPLING_WORKER_URL to its internal or public service URL.",
      notes:
        "Targeted extraction sidecar for high-value official legal pages. Preferred when a source has selectors or needs resilient HTML extraction.",
    }),
    enrich({
      id: "legal-data-hunter",
      label: "Legal Data Hunter / legal-research",
      status: legalDataHunterReady ? "available" : "needs_user_setup",
      uses: ["official_legal_database", "case_law_discovery", "legal_news_discovery"],
      regions: ["Europe", "United States", "Global"],
      envVars: ["LEGAL_DATA_HUNTER_MCP_URL", "LEGAL_DATA_HUNTER_API_KEY", "LEGAL_RESEARCH_MCP_URL"],
      implementedProvider: "legal_data_hunter",
      userAction: legalDataHunterReady
        ? undefined
        : "Expose the Legal Data Hunter MCP or legal-research skill to the runtime, then set LEGAL_DATA_HUNTER_MCP_URL and any required token/API key.",
      notes:
        "Preferred over generic scraping for multi-jurisdiction statutes, case law, doctrine, and source discovery when the MCP/skill is available to the agent runtime.",
    }),
    enrich({
      id: "gdelt-doc-api",
      label: "GDELT 2.1 Doc API",
      status: "available",
      uses: ["legal_news_discovery", "source_health"],
      regions: ["Europe", "United States", "Global"],
      envVars: [],
      implementedProvider: "gdelt",
      notes:
        "No key required. Use as broad discovery only; legal database promotion still requires serious-source corroboration or official-source confirmation.",
    }),
    enrich({
      id: "federal-register-api",
      label: "Federal Register API",
      status: "available",
      uses: ["official_legal_database", "source_health"],
      regions: ["United States"],
      envVars: [],
      implementedProvider: "federal_register",
      notes:
        "No key required. Official US federal rulemaking source suitable for automatic database publication when AI/legal relevance is verified.",
    }),
    enrich({
      id: "newsapi",
      label: "NewsAPI",
      status: newsApiReady ? "available" : "missing_credentials",
      uses: ["legal_news_discovery", "source_health"],
      regions: ["Europe", "United States", "Global"],
      envVars: ["NEWSAPI_API_KEY"],
      implementedProvider: "newsapi",
      userAction: newsApiReady
        ? undefined
        : "Create a NewsAPI key and set NEWSAPI_API_KEY in Vercel/local env if you want faster multi-source legal-news discovery.",
      notes:
        "Discovery-only provider. Items can publish as legal news only when the domain is serious/reputable or corroborated; it must not be treated as an official legal database source.",
    }),
    enrich({
      id: "legifrance-piste",
      label: "Legifrance DILA/PISTE API",
      status: legifranceReady ? "available" : "needs_user_setup",
      uses: ["official_legal_database", "case_law_discovery", "source_health"],
      regions: ["Europe"],
      envVars: ["LEGIFRANCE_PISTE_CLIENT_ID", "LEGIFRANCE_PISTE_CLIENT_SECRET"],
      implementedProvider: "legifrance",
      userAction: legifranceReady
        ? undefined
        : "Create free PISTE/DILA credentials and set LEGIFRANCE_PISTE_CLIENT_ID plus LEGIFRANCE_PISTE_CLIENT_SECRET.",
      notes:
        "Official France legal source. Once credentials are set, French official database monitoring can use the native API instead of degraded scraping.",
    }),
    enrich({
      id: "judilibre-api",
      label: "Judilibre API",
      status: judilibreReady ? "available" : "needs_user_setup",
      uses: ["case_law_discovery", "official_legal_database", "source_health"],
      regions: ["Europe"],
      envVars: ["JUDILIBRE_API_KEYID"],
      implementedProvider: "judilibre",
      userAction: judilibreReady
        ? undefined
        : "Request/configure a Judilibre API KeyId and set JUDILIBRE_API_KEYID to strengthen French case-law monitoring.",
      notes:
        "Official French case-law API. Use for decisions and jurisprudence; relevance and citation checks still apply.",
    }),
    enrich({
      id: "courtlistener-recap",
      label: "CourtListener / RECAP",
      status: courtListenerReady ? "available" : "needs_user_setup",
      uses: ["case_law_discovery", "official_legal_database"],
      regions: ["United States"],
      envVars: courtListenerEnvVars,
      implementedProvider: "courtlistener",
      userAction:
        courtListenerReady
          ? undefined
          : "Create a CourtListener token and set COURTLISTENER_API_KEY or COURTLISTENER_API_TOKEN to enable faster US federal/state case-law and docket discovery.",
      notes:
        "Preferred over generic scraping for US federal case law, RECAP docket metadata, and state/federal court monitoring when credentials are available.",
    }),
  ];
}

export function listMissingAgentApiCapabilities(
  rawEnv: AgentApiCapabilityEnv = process.env,
) {
  return listAgentApiCapabilities(rawEnv).filter(
    (capability) =>
      capability.status === "missing_credentials" ||
      capability.status === "needs_user_setup",
  );
}

export function listImplementedAgentApiProviders() {
  return listAgentApiCapabilities()
    .filter((capability) => capability.implementedProvider)
    .map((capability) => capability.implementedProvider);
}
