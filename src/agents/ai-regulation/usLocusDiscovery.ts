import type { DiscoveryLeadInput } from "@/agents/ai-regulation/governance";
import type { RegulationSource } from "@/agents/ai-regulation/types";

export const LOCUS_DATASET_URL = "https://huggingface.co/datasets/davidyinyan/LOCUS-v1";
export const LOCUS_CORPUS_NAME = "LOCUS-v1";
export const LOCUS_SOURCE_ID = "src-us-locus-v1";

export const locusDiscoverySourceRegistration = {
  id: LOCUS_SOURCE_ID,
  name: "LOCUS-v1 U.S. local law discovery corpus",
  jurisdiction: "United States federal",
  region: "United States",
  country: "United States",
  sourceUrl: LOCUS_DATASET_URL,
  sourceType: "discovery_source",
  scanFrequency: "weekly",
  active: false,
  lastScannedAt: null,
  notes:
    "Optional external research corpus for U.S. local AI-law discovery only. Not official legal authority; never publish LOCUS-derived items without official municipal/county verification.",
  reliabilityLevel: "medium",
  preferredExtractionMethod: "api",
  config: {
    sourceCategory: "discovery_source",
    corpusSource: LOCUS_CORPUS_NAME,
    corpusRole: "external_research_corpus",
    legalAuthority: false,
    publicDisplayAllowed: false,
    requiresOfficialSource: true,
    datasetLicense: "cc-by-nc-4.0",
  },
  ingestionMethod: "existing",
  sourceCategory: "discovery_source",
  scraplingConfig: {},
  crawlRootUrl: LOCUS_DATASET_URL,
} satisfies Omit<RegulationSource, "createdAt" | "updatedAt">;

export interface LocusDiscoveryRow {
  content?: string | null;
  header?: string | null;
  state?: string | null;
  city?: string | null;
  county?: string | null;
  topic?: string | null;
  function?: string | null;
  source_jurisdiction_type?: string | null;
  is_substantive?: boolean | null;
  official_municipal_code_url?: string | null;
  municipal_code_url?: string | null;
  source_url?: string | null;
  url?: string | null;
  [key: string]: unknown;
}

export interface LocusDiscoveryMetadata {
  corpusSource: typeof LOCUS_CORPUS_NAME;
  corpusUrl: typeof LOCUS_DATASET_URL;
  city: string | null;
  county: string | null;
  state: string | null;
  textExcerpt: string;
  topic: string;
  confidenceScore: number;
  detectedTerms: string[];
  locusMetadata: Record<string, unknown>;
  officialMunicipalCodeUrl: string | null;
  verificationStatus: "needs_official_source";
  citationQuality: "discovery_only";
  requiresOfficialSource: true;
  publicDisplayAllowed: false;
  conversionRequirements: string[];
}

export interface LocusDiscoveryOptions {
  detectedAt?: string;
  sourceId?: string | null;
}

type TopicRule = {
  topic: string;
  terms: string[];
};

const TOPIC_RULES: TopicRule[] = [
  { topic: "facial recognition", terms: ["facial recognition", "face recognition", "face surveillance"] },
  { topic: "automated decision systems", terms: ["automated decision system", "automated decision-making", "automated decision making"] },
  { topic: "algorithmic decision-making", terms: ["algorithmic decision", "algorithmic decision-making", "algorithmic decision making", "algorithm"] },
  { topic: "AI procurement", terms: ["artificial intelligence procurement", "ai procurement", "algorithmic procurement"] },
  { topic: "predictive policing", terms: ["predictive policing", "predictive analytics policing"] },
  { topic: "surveillance technology", terms: ["surveillance technology", "surveillance technologies", "surveillance ordinance"] },
  { topic: "biometric systems", terms: ["biometric", "biometrics"] },
  { topic: "automated license plate readers", terms: ["automated license plate reader", "automatic license plate reader", "alpr", "license plate reader"] },
  { topic: "autonomous delivery robots", terms: ["autonomous delivery robot", "delivery robot", "personal delivery device"] },
  { topic: "smart city systems", terms: ["smart city", "smart cities"] },
  { topic: "tenant screening algorithms", terms: ["tenant screening algorithm", "tenant screening", "rental screening algorithm"] },
  { topic: "employment screening algorithms", terms: ["employment screening algorithm", "employment screening", "automated employment decision"] },
  { topic: "AI infrastructure data centers", terms: ["ai data center", "artificial intelligence data center", "data center artificial intelligence", "data centre artificial intelligence"] },
  { topic: "artificial intelligence", terms: ["artificial intelligence", " ai "] },
];

const CONVERSION_REQUIREMENTS = [
  "Find the official municipal or county ordinance source.",
  "Confirm the official source URL is accessible.",
  "Verify the LOCUS excerpt against the official source text.",
  "Verify jurisdiction, enactment/publication date, citation, and pinpoint.",
  "Confirm the provision is AI-related.",
  "Keep admin review available before any legal-database conversion.",
];

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function makeExcerpt(value: string, maxLength = 700) {
  const compact = compactWhitespace(value);
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeState(value: string) {
  return value.trim().toUpperCase();
}

function getOfficialCandidateUrl(row: LocusDiscoveryRow) {
  const candidates = [
    row.official_municipal_code_url,
    row.municipal_code_url,
    row.source_url,
    row.url,
  ];
  return candidates.find((value): value is string => typeof value === "string" && /^https?:\/\//i.test(value)) ?? null;
}

function detectTopic(content: string) {
  const haystack = ` ${content.toLowerCase()} `;
  const detectedTerms: string[] = [];
  const topicScores = new Map<string, number>();

  for (const rule of TOPIC_RULES) {
    for (const term of rule.terms) {
      const needle = term.toLowerCase();
      if (haystack.includes(needle)) {
        detectedTerms.push(term.trim());
        topicScores.set(rule.topic, (topicScores.get(rule.topic) ?? 0) + 1);
      }
    }
  }

  if (detectedTerms.length === 0) return null;
  const [topic] = [...topicScores.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return TOPIC_RULES.findIndex((rule) => rule.topic === a[0]) -
      TOPIC_RULES.findIndex((rule) => rule.topic === b[0]);
  })[0];
  return {
    topic,
    detectedTerms: [...new Set(detectedTerms)].sort(),
  };
}

function scoreConfidence(input: {
  detectedTerms: string[];
  isSubstantive: boolean | null | undefined;
  officialMunicipalCodeUrl: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
}) {
  let score = 0.35;
  score += Math.min(0.25, input.detectedTerms.length * 0.05);
  if (input.isSubstantive === true) score += 0.1;
  if (input.officialMunicipalCodeUrl) score += 0.1;
  if (input.state) score += 0.08;
  if (input.city || input.county) score += 0.07;
  return Math.min(0.95, Number(score.toFixed(2)));
}

function buildPossibleJurisdiction(input: {
  city: string | null;
  county: string | null;
  state: string | null;
}) {
  const locality = input.city || input.county;
  if (locality && input.state) return `${locality}, ${input.state}`;
  return locality || input.state || "United States local jurisdiction";
}

function safeLocusMetadata(row: LocusDiscoveryRow): Record<string, unknown> {
  return {
    header: cleanText(row.header) || null,
    topic: cleanText(row.topic) || null,
    function: cleanText(row.function) || null,
    sourceJurisdictionType: cleanText(row.source_jurisdiction_type) || null,
    isSubstantive: typeof row.is_substantive === "boolean" ? row.is_substantive : null,
    state: cleanText(row.state) || null,
    city: cleanText(row.city) || null,
    county: cleanText(row.county) || null,
  };
}

export function buildLocusDiscoveryMetadata(row: LocusDiscoveryRow): LocusDiscoveryMetadata | null {
  const content = cleanText(row.content);
  if (!content) return null;
  const detected = detectTopic(content);
  if (!detected) return null;

  const state = cleanText(row.state) ? normalizeState(cleanText(row.state)) : null;
  const city = cleanText(row.city) || null;
  const county = cleanText(row.county) || null;
  const officialMunicipalCodeUrl = getOfficialCandidateUrl(row);
  const textExcerpt = makeExcerpt(content);
  const confidenceScore = scoreConfidence({
    detectedTerms: detected.detectedTerms,
    isSubstantive: row.is_substantive,
    officialMunicipalCodeUrl,
    city,
    county,
    state,
  });

  return {
    corpusSource: LOCUS_CORPUS_NAME,
    corpusUrl: LOCUS_DATASET_URL,
    city,
    county,
    state,
    textExcerpt,
    topic: detected.topic,
    confidenceScore,
    detectedTerms: detected.detectedTerms,
    locusMetadata: safeLocusMetadata(row),
    officialMunicipalCodeUrl,
    verificationStatus: "needs_official_source",
    citationQuality: "discovery_only",
    requiresOfficialSource: true,
    publicDisplayAllowed: false,
    conversionRequirements: CONVERSION_REQUIREMENTS,
  };
}

export function parseLocusReviewerNotes(notes: string | null | undefined): LocusDiscoveryMetadata | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as Partial<LocusDiscoveryMetadata>;
    if (parsed.corpusSource !== LOCUS_CORPUS_NAME) return null;
    if (parsed.requiresOfficialSource !== true || parsed.publicDisplayAllowed !== false) return null;
    return parsed as LocusDiscoveryMetadata;
  } catch {
    return null;
  }
}

export function buildLocusDiscoveryLead(
  row: LocusDiscoveryRow,
  options: LocusDiscoveryOptions = {},
): DiscoveryLeadInput | null {
  const metadata = buildLocusDiscoveryMetadata(row);
  if (!metadata) return null;

  const header = cleanText(row.header);
  const headline = header || `LOCUS local AI-law lead: ${metadata.topic}`;
  const detectedAt = options.detectedAt ?? new Date().toISOString();
  const possibleJurisdiction = buildPossibleJurisdiction(metadata);

  return {
    rawItemId: null,
    sourceId: options.sourceId ?? LOCUS_SOURCE_ID,
    headline,
    discoverySourceUrl: LOCUS_DATASET_URL,
    outboundUrl: metadata.officialMunicipalCodeUrl,
    detectedAt,
    possibleJurisdiction,
    possibleTopic: metadata.topic,
    possibleLegalArea: "U.S. local AI law",
    possibleAuthorityType: "Discovery lead",
    status: "unresolved",
    officialSourceFound: false,
    officialSourceUrl: metadata.officialMunicipalCodeUrl,
    corroboratingSourceCount: 0,
    corroboratingSourceUrls: [],
    convertedUpdateId: null,
    reviewerNotes: JSON.stringify(metadata),
    lastVerifiedAt: null,
    staleAt: null,
    publicVisibilityAllowed: false,
  };
}
