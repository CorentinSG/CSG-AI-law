import type { SourceHealthCheck } from "@/agents/ai-regulation/governance";
import type { RegulationSource } from "@/agents/ai-regulation/types";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";

export type SourceVerificationStatus =
  | "verified"
  | "unstable_endpoint"
  | "access_blocked"
  | "needs_dedicated_parser";

export type VerificationConfidence = "high" | "medium" | "low";
export type MonitoringRecommendation = "active" | "inactive";
export type IntelligenceHub = "europe" | "united-states" | "international";
export type SourceClassification =
  | "official_source"
  | "discovery_source"
  | "media_discovery_source";
export type AuthorityLevel = "official" | "authoritative" | "secondary" | "non_official";

export interface SourceVerificationRecord {
  sourceId: string;
  sourceUrl: string;
  finalRuntimeUrl?: string;
  lastVerifiedAt: string;
  responseStatus: number | null;
  runtimeAccessible: boolean;
  official: boolean;
  public: boolean;
  sourceClassification?: SourceClassification;
  authorityLevel?: AuthorityLevel;
  publicationAllowed?: boolean;
  requiresOfficialSourceConfirmation?: boolean;
  requiresCrossSourceVerification?: boolean;
  stableEnoughForMonitoring: boolean;
  requiresDedicatedParser: boolean;
  status: SourceVerificationStatus;
  recommendation: MonitoringRecommendation;
  confidence: VerificationConfidence;
  hub: IntelligenceHub;
  note: string;
}

export interface SourceVerificationResolutionOptions {
  sources?: RegulationSource[];
  sourceHealthChecks?: SourceHealthCheck[];
}

export const sourceVerificationRecords: SourceVerificationRecord[] = [
  {
    sourceId: "src-federal-register-ai",
    sourceUrl:
      "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bterm%5D=artificial%20intelligence&order=newest",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "united-states",
    note: "Official Federal Register API endpoint returned 200 from the scan runtime and remains suitable for scheduled monitoring.",
  },
  {
    sourceId: "src-white-house-ai",
    sourceUrl: "https://www.whitehouse.gov/presidential-actions/",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "united-states",
    note: "Official White House page returned 200 and remains publicly reachable for conservative static-page monitoring.",
  },
  {
    sourceId: "src-cnil-ai",
    sourceUrl: "https://www.cnil.fr/fr/rss.xml",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "europe",
    note: "Official CNIL RSS feed returned 200 and remains the stable public fallback while the broader AI landing page has previously failed from the scan runtime.",
  },
  {
    sourceId: "src-oecd-ai",
    sourceUrl: "https://oecd.ai/en/wonk",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "medium",
    hub: "international",
    note: "Official OECD AI policy materials page returned 200 and is publicly reachable, but it is a broader policy hub rather than a legislative feed.",
  },
  {
    sourceId: "src-uk-ico-ai",
    sourceUrl:
      "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "europe",
    note: "Official ICO guidance hub returned 200 and remains a stable public regulator source for broader European coverage.",
  },
  {
    sourceId: "src-eu-ai-office",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/ai-office",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "europe",
    note: "Official EU AI Office policy page returned 200 and remains central to Europe hub monitoring.",
  },
  {
    sourceId: "src-eu-commission-ai",
    sourceUrl: "https://commission.europa.eu/topics/artificial-intelligence_en",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "europe",
    note: "Official Commission AI topic page returned 200 and remains stable enough for monitoring high-level EU materials.",
  },
  {
    sourceId: "src-eur-lex-ai",
    sourceUrl:
      "https://eur-lex.europa.eu/search.html?scope=EURLEX&text=%22artificial%20intelligence%22&type=quick",
    finalRuntimeUrl:
      "https://eur-lex.europa.eu/search.html?text=%22artificial+intelligence%22&type=quick&scope=EURLEX",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: false,
    requiresDedicatedParser: true,
    status: "unstable_endpoint",
    recommendation: "inactive",
    confidence: "medium",
    hub: "europe",
    note: "Official EUR-Lex search returned 200 from the runtime, but recent automated scans have also produced unstable or empty-result responses. Keep inactive until a more resilient dedicated parser or API-backed method is in place.",
  },
  {
    sourceId: "src-edpb-ai",
    sourceUrl:
      "https://www.edpb.europa.eu/our-work-tools/our-documents/topic/artificial-intelligence_en",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "europe",
    note: "Official EDPB AI topic page returned 200 and remains publicly accessible for monitoring opinions, statements, and guidance.",
  },
  {
    sourceId: "src-edps-ai",
    sourceUrl:
      "https://www.edps.europa.eu/data-protection/our-work/subjects/artificial-intelligence_en?page=1",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "europe",
    note: "Official EDPS AI subject page returned 200 and remains a public source for AI supervision and data-protection materials.",
  },
  {
    sourceId: "src-ftc-ai-press",
    sourceUrl: "https://www.ftc.gov/feeds/press-release.xml",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 403,
    runtimeAccessible: false,
    official: true,
    public: true,
    stableEnoughForMonitoring: false,
    requiresDedicatedParser: false,
    status: "access_blocked",
    recommendation: "inactive",
    confidence: "high",
    hub: "united-states",
    note: "Official FTC feed returned 403 from the scan runtime during verification. Keep inactive until the runtime can reliably reach an official FTC endpoint.",
  },
  {
    sourceId: "src-nist-ai-rmf",
    sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "united-states",
    note: "Official NIST AI RMF hub returned 200 and remains suitable for public monitoring of governance-framework updates.",
  },
  {
    sourceId: "src-owasp-aima",
    sourceUrl: "https://owasp.org/www-project-ai-maturity-assessment/",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "medium",
    hub: "international",
    note: "Official OWASP project page returned 200 and remains publicly reachable for best-practice monitoring.",
  },
  {
    sourceId: "src-iso-42001",
    sourceUrl: "https://www.iso.org/standard/42001",
    finalRuntimeUrl: "https://www.iso.org/standard/42001",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "international",
    note: "Official ISO metadata page returned 200. Public metadata is monitorable, but paywalled standard text should not be reproduced.",
  },
  {
    sourceId: "src-eeoc-ai",
    sourceUrl:
      "https://www.eeoc.gov/eeoc-disability-related-resources/artificial-intelligence-and-ada",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "united-states",
    note: "Official EEOC AI and ADA page returned 200 and remains stable for employment-law monitoring.",
  },
  {
    sourceId: "src-cfpb-ai",
    sourceUrl: "https://www.consumerfinance.gov/ai/",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "united-states",
    note: "Official CFPB AI page returned 200 and remains publicly accessible for consumer-finance AI materials.",
  },
  {
    sourceId: "src-sec-ai",
    sourceUrl: "https://www.sec.gov/ai",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 403,
    runtimeAccessible: false,
    official: true,
    public: true,
    stableEnoughForMonitoring: false,
    requiresDedicatedParser: true,
    status: "access_blocked",
    recommendation: "inactive",
    confidence: "high",
    hub: "united-states",
    note: "Official SEC AI endpoint returned 403 from the scan runtime. Keep inactive until a runtime-accessible official SEC AI source is verified.",
  },
  {
    sourceId: "src-nydfs-ai",
    sourceUrl: "https://www.dfs.ny.gov/industry_guidance/innovation",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "united-states",
    note: "Official NYDFS innovation page returned 200 and remains publicly reachable for state-level AI guidance monitoring.",
  },
  {
    sourceId: "src-nyag-ai",
    sourceUrl: "https://ag.ny.gov/guidance",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "medium",
    hub: "united-states",
    note: "Official NYAG guidance hub returned 200, but it is a broad page and deterministic filtering remains essential.",
  },
  {
    sourceId: "src-cppa-ai",
    sourceUrl: "https://cppa.ca.gov/regulations/ccpa_updates.html",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: true,
    public: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: false,
    status: "verified",
    recommendation: "active",
    confidence: "high",
    hub: "united-states",
    note: "Official CPPA rulemaking page returned 200 and remains publicly accessible for ADMT and risk-assessment materials.",
  },
  {
    sourceId: "src-council-europe-ai",
    sourceUrl: "https://www.coe.int/en/web/artificial-intelligence/home",
    lastVerifiedAt: "2026-05-25T00:00:00.000Z",
    responseStatus: 403,
    runtimeAccessible: false,
    official: true,
    public: true,
    stableEnoughForMonitoring: false,
    requiresDedicatedParser: false,
    status: "access_blocked",
    recommendation: "inactive",
    confidence: "high",
    hub: "europe",
    note: "Official Council of Europe AI hub returned 403 from the scan runtime and should remain inactive until access is reliably restored.",
  },
  {
    sourceId: "src-ai-weekly-news-today",
    sourceUrl: "https://aiweekly.co/ai-news-today",
    finalRuntimeUrl: "https://aiweekly.co/ai-news-today",
    lastVerifiedAt: "2026-05-26T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: false,
    public: true,
    sourceClassification: "discovery_source",
    authorityLevel: "non_official",
    publicationAllowed: false,
    requiresOfficialSourceConfirmation: true,
    requiresCrossSourceVerification: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: true,
    status: "verified",
    recommendation: "active",
    confidence: "medium",
    hub: "international",
    note: "AI Weekly / AI News Today is publicly reachable and suitable only as a secondary discovery source. It is non-official, cannot serve as legal authority, and requires official-source confirmation before any downstream publication.",
  },
  {
    sourceId: "src-global-policy-watch-eu",
    sourceUrl: "https://www.globalpolicywatch.com/category/european-union/",
    finalRuntimeUrl: "https://www.globalpolicywatch.com/category/european-union/",
    lastVerifiedAt: "2026-05-26T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: false,
    public: true,
    sourceClassification: "discovery_source",
    authorityLevel: "non_official",
    publicationAllowed: false,
    requiresOfficialSourceConfirmation: true,
    requiresCrossSourceVerification: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: true,
    status: "verified",
    recommendation: "active",
    confidence: "medium",
    hub: "europe",
    note: "Global Policy Watch European Union category returned 200 from the scan runtime and robots.txt allows conservative crawling with a 30-second crawl delay. It is an informal discovery source only and cannot serve as legal authority.",
  },
  {
    sourceId: "src-global-policy-watch-ai",
    sourceUrl: "https://www.globalpolicywatch.com/category/artificial-intelligence/",
    finalRuntimeUrl: "https://www.globalpolicywatch.com/category/artificial-intelligence/",
    lastVerifiedAt: "2026-05-26T00:00:00.000Z",
    responseStatus: 200,
    runtimeAccessible: true,
    official: false,
    public: true,
    sourceClassification: "discovery_source",
    authorityLevel: "non_official",
    publicationAllowed: false,
    requiresOfficialSourceConfirmation: true,
    requiresCrossSourceVerification: true,
    stableEnoughForMonitoring: true,
    requiresDedicatedParser: true,
    status: "verified",
    recommendation: "active",
    confidence: "medium",
    hub: "international",
    note: "Global Policy Watch Artificial Intelligence category returned 200 from the scan runtime and robots.txt allows conservative crawling with a 30-second crawl delay. It is an informal discovery source only and cannot serve as legal authority.",
  },
];

export function getSourceVerificationRecord(sourceId: string) {
  return sourceVerificationRecords.find((record) => record.sourceId === sourceId) ?? null;
}

function regionToHub(region: string): IntelligenceHub {
  if (region === "Europe") return "europe";
  if (region === "North America") return "united-states";
  return "international";
}

export function getLatestSourceHealthCheckForSource(
  sourceId: string,
  sourceHealthChecks: SourceHealthCheck[],
) {
  return sourceHealthChecks
    .filter((check) => check.sourceId === sourceId)
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))[0] ?? null;
}

function deriveFallbackSourceVerificationRecord(
  source: RegulationSource,
): SourceVerificationRecord {
  const discoveryOnly = isDiscoveryOnlySource(source);

  return {
    sourceId: source.id,
    sourceUrl: source.sourceUrl,
    finalRuntimeUrl: source.sourceUrl,
    lastVerifiedAt:
      source.lastSuccessfulScanAt ?? source.lastScannedAt ?? source.updatedAt,
    responseStatus: source.latestResponseStatus ?? null,
    runtimeAccessible: !source.latestAccessibilityIssue,
    official: !discoveryOnly,
    public: true,
    sourceClassification: discoveryOnly ? "discovery_source" : "official_source",
    authorityLevel: discoveryOnly ? "non_official" : "official",
    publicationAllowed: !discoveryOnly,
    requiresOfficialSourceConfirmation: discoveryOnly,
    requiresCrossSourceVerification: discoveryOnly,
    stableEnoughForMonitoring:
      source.active && !source.latestAccessibilityIssue && source.latestResponseStatus !== 403,
    requiresDedicatedParser:
      source.preferredExtractionMethod === "html_dynamic" ||
      source.latestParserWarnings?.some((warning) =>
        /parser|selector|structure/i.test(warning),
      ) === true,
    status: source.latestAccessibilityIssue
      ? "access_blocked"
      : source.preferredExtractionMethod === "html_dynamic"
        ? "needs_dedicated_parser"
        : source.active
          ? "verified"
          : "unstable_endpoint",
    recommendation: source.active ? "active" : "inactive",
    confidence: source.reliabilityLevel === "high" ? "high" : "medium",
    hub: regionToHub(source.region),
    note:
      source.sourceReliabilityNotes ??
      source.notes ??
      "Fallback verification record derived from source metadata.",
  };
}

export function resolveSourceVerificationRecord(
  source: RegulationSource,
  sourceHealthChecks: SourceHealthCheck[] = [],
) {
  const fallback =
    sourceVerificationRecords.find((record) => record.sourceId === source.id) ??
    deriveFallbackSourceVerificationRecord(source);
  const latestCheck = getLatestSourceHealthCheckForSource(source.id, sourceHealthChecks);

  if (!latestCheck) return fallback;

  const inaccessible = !latestCheck.runtimeAccessible || Boolean(latestCheck.accessibilityIssue);
  const requiresDedicatedParser =
    latestCheck.parserStatus === "needs_dedicated_parser" ||
    fallback.requiresDedicatedParser;
  const status: SourceVerificationStatus = inaccessible
    ? "access_blocked"
    : requiresDedicatedParser
      ? "needs_dedicated_parser"
      : latestCheck.activeRecommendation === "active"
        ? "verified"
        : "unstable_endpoint";

  const stableEnoughForMonitoring =
    latestCheck.runtimeAccessible &&
    latestCheck.activeRecommendation === "active" &&
    latestCheck.parserStatus !== "needs_dedicated_parser";
  const recommendation: MonitoringRecommendation =
    latestCheck.activeRecommendation === "active" ? "active" : "inactive";

  const noteParts = [
    latestCheck.reliabilityNotes,
    latestCheck.accessibilityIssue,
    latestCheck.parserWarnings[0],
    fallback.note,
  ].filter(Boolean);

  return {
    ...fallback,
    sourceUrl: source.sourceUrl,
    lastVerifiedAt: latestCheck.checkedAt,
    responseStatus: latestCheck.responseStatus,
    runtimeAccessible: latestCheck.runtimeAccessible,
    stableEnoughForMonitoring,
    requiresDedicatedParser,
    status,
    recommendation,
    note: noteParts[0] ?? fallback.note,
  };
}

export function getSourceVerificationRecordsForHub(
  hub: IntelligenceHub,
  options?: SourceVerificationResolutionOptions,
) {
  if (!options?.sources) {
    return sourceVerificationRecords.filter((record) => record.hub === hub);
  }

  return options.sources
    .filter((source) => regionToHub(source.region) === hub)
    .map((source) =>
      resolveSourceVerificationRecord(source, options.sourceHealthChecks ?? []),
    );
}

export function getResolvedSourceVerificationRecord(
  sourceId: string,
  options?: SourceVerificationResolutionOptions,
) {
  if (!options?.sources) {
    return getSourceVerificationRecord(sourceId);
  }

  const source = options.sources.find((entry) => entry.id === sourceId);
  if (!source) return getSourceVerificationRecord(sourceId);

  return resolveSourceVerificationRecord(source, options.sourceHealthChecks ?? []);
}

export function getInaccessibleSourceVerificationRecords(
  options?: SourceVerificationResolutionOptions,
) {
  if (!options?.sources) {
    return sourceVerificationRecords.filter((record) => !record.runtimeAccessible);
  }

  return options.sources
    .map((source) =>
      resolveSourceVerificationRecord(source, options.sourceHealthChecks ?? []),
    )
    .filter((record) => !record.runtimeAccessible);
}
