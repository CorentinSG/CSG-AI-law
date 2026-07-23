import { classifyEuNewsItem } from "@/agents/ai-regulation/euNewsClassification";
import type { AiLawNewsItem } from "@/content/ai-regulation/news";

/**
 * Story clustering engine for the live legal-intelligence lanes.
 *
 * Groups near-duplicate news items reported by different sources into one
 * "story" (fuzzy title similarity), so cross-source corroboration becomes a
 * first-class ranking signal instead of visual duplication. Deterministic and
 * heuristic only — no LLM, no embeddings, consistent with the AI-off default.
 */

export type LegalStoryPhase = "breaking" | "developing" | "sustained" | "fading";

export interface LegalStoryCorroboration {
  /** Distinct reporting sources across the cluster. */
  sourceCount: number;
  /** Distinct source types (official, press, tracker…) across the cluster. */
  sourceTypeCount: number;
  /** True when at least one member is official or officially confirmed. */
  officialSourcePresent: boolean;
}

export interface LegalStory {
  id: string;
  /** Most authoritative member — official beats press, then recency. */
  primary: AiLawNewsItem;
  /** All members, primary first. */
  members: AiLawNewsItem[];
  corroboration: LegalStoryCorroboration;
  /** 0–100 composite: authority 0.55 · source tier 0.2 · corroboration 0.15 · recency 0.1. */
  importanceScore: number;
  phase: LegalStoryPhase;
  /** Newest publication/detection timestamp across members. */
  newestAt: string;
}

export const STORY_SIMILARITY_THRESHOLD = 0.45;
export const STORY_OVERLAP_THRESHOLD = 0.7;
export const STORY_MIN_SHARED_TOKENS = 4;

const TITLE_STOPWORDS = new Set([
  // English
  "the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "with", "by",
  "at", "from", "as", "is", "are", "its", "it", "this", "that", "into", "over",
  "after", "about", "new", "amid",
  // French
  "la", "le", "les", "de", "du", "des", "un", "une", "et", "ou", "sur", "pour",
  "dans", "par", "au", "aux", "en", "que", "qui", "se", "son", "sa", "ses",
  "est", "vers", "avec", "apres", "sans",
]);

export function tokenizeStoryTitle(title: string): Set<string> {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const tokens = new Set<string>();
  for (const raw of normalized.split(/[^a-z0-9]+/)) {
    if (raw.length < 2) continue;
    if (TITLE_STOPWORDS.has(raw)) continue;
    tokens.add(raw);
  }
  return tokens;
}

function intersectionSize(a: Set<string>, b: Set<string>) {
  let count = 0;
  for (const token of a) {
    if (b.has(token)) count += 1;
  }
  return count;
}

/** Jaccard similarity between two token sets (0 when either is empty). */
export function storyTitleSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const shared = intersectionSize(a, b);
  return shared / (a.size + b.size - shared);
}

function isSameStory(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return false;
  const shared = intersectionSize(a, b);
  const jaccard = shared / (a.size + b.size - shared);
  if (jaccard >= STORY_SIMILARITY_THRESHOLD) return true;
  // Overlap coefficient handles short press headlines matched against long
  // official titles, where Jaccard is diluted by the longer title.
  const overlap = shared / Math.min(a.size, b.size);
  return overlap >= STORY_OVERLAP_THRESHOLD && shared >= STORY_MIN_SHARED_TOKENS;
}

/** Whether two raw titles describe the same story, per the clustering rules. */
export function isSameStoryTitle(a: string, b: string) {
  return isSameStory(tokenizeStoryTitle(a), tokenizeStoryTitle(b));
}

/** 1 = official, 2 = reputable press, 3 = tracker, 4 = other/discovery. */
export function getNewsSourceTier(
  item: Pick<AiLawNewsItem, "sourceType" | "sourceReliability">,
): 1 | 2 | 3 | 4 {
  if (item.sourceType === "official_source") return 1;
  if (
    item.sourceType === "legal_regulatory_press" ||
    item.sourceReliability === "reputable_secondary"
  ) {
    return 2;
  }
  if (item.sourceReliability === "tracker_secondary") return 3;
  return 4;
}

function itemTimestamp(item: AiLawNewsItem) {
  return item.publicationDate ?? item.exactDateOfInformation ?? item.detectedAt;
}

function hoursSince(value: string, now: Date) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.max(0, (now.getTime() - parsed.getTime()) / 36e5);
}

function normalizeSourceName(name: string) {
  return name.trim().toLowerCase();
}

function pickPrimary(members: AiLawNewsItem[]) {
  return [...members].sort((a, b) => {
    const tierDelta = getNewsSourceTier(a) - getNewsSourceTier(b);
    if (tierDelta !== 0) return tierDelta;
    if (a.officialSourceFound !== b.officialSourceFound) {
      return a.officialSourceFound ? -1 : 1;
    }
    return itemTimestamp(b).localeCompare(itemTimestamp(a));
  })[0];
}

function buildCorroboration(members: AiLawNewsItem[]): LegalStoryCorroboration {
  const sourceNames = new Set(members.map((item) => normalizeSourceName(item.sourceName)));
  const sourceTypes = new Set(members.map((item) => item.sourceType));
  return {
    sourceCount: sourceNames.size,
    sourceTypeCount: sourceTypes.size,
    officialSourcePresent: members.some(
      (item) => item.sourceType === "official_source" || item.officialSourceFound,
    ),
  };
}

function getAuthorityScore(members: AiLawNewsItem[]) {
  let best = 25;
  for (const item of members) {
    const classification = classifyEuNewsItem(item);
    let score = 25;
    if (classification.hardLaw) score = 100;
    else if (classification.caseLaw || classification.enforcement) score = 85;
    else if (classification.softLaw) score = 60;
    else if (item.sourceType === "legal_regulatory_press") score = 40;
    best = Math.max(best, score);
  }
  return best;
}

function getTierScore(members: AiLawNewsItem[]) {
  const bestTier = Math.min(...members.map((item) => getNewsSourceTier(item)));
  switch (bestTier) {
    case 1:
      return 100;
    case 2:
      return 70;
    case 3:
      return 45;
    default:
      return 20;
  }
}

function getCorroborationScore(corroboration: LegalStoryCorroboration) {
  return Math.min(
    100,
    (corroboration.sourceCount - 1) * 35 +
      (corroboration.sourceTypeCount - 1) * 15 +
      (corroboration.officialSourcePresent ? 15 : 0),
  );
}

function getRecencyScore(ageHours: number | null) {
  if (ageHours === null) return 40;
  if (ageHours <= 6) return 100;
  if (ageHours <= 24) return 80;
  if (ageHours <= 72) return 50;
  if (ageHours <= 168) return 25;
  return 5;
}

function derivePhase(
  ageHours: number | null,
  corroboration: LegalStoryCorroboration,
): LegalStoryPhase {
  if (ageHours === null) return "developing";
  if (ageHours <= 12) return "breaking";
  if (ageHours <= 36 && corroboration.sourceCount >= 2) return "breaking";
  if (ageHours <= 72) return "developing";
  if (ageHours <= 240) return "sustained";
  return "fading";
}

export interface ClusterNewsOptions {
  now?: Date;
}

export function clusterNewsIntoStories(
  items: AiLawNewsItem[],
  options?: ClusterNewsOptions,
): LegalStory[] {
  const now = options?.now ?? new Date();
  const clusters: { tokens: Set<string>; members: AiLawNewsItem[] }[] = [];

  const sorted = [...items].sort((a, b) =>
    itemTimestamp(b).localeCompare(itemTimestamp(a)),
  );

  for (const item of sorted) {
    const tokens = tokenizeStoryTitle(item.title);
    const match = clusters.find((cluster) => isSameStory(cluster.tokens, tokens));
    if (match) {
      match.members.push(item);
      for (const token of tokens) match.tokens.add(token);
    } else {
      clusters.push({ tokens: new Set(tokens), members: [item] });
    }
  }

  return clusters.map((cluster) => {
    const primary = pickPrimary(cluster.members);
    const members = [
      primary,
      ...cluster.members.filter((item) => item !== primary),
    ];
    const corroboration = buildCorroboration(members);
    const newestAt = members
      .map(itemTimestamp)
      .sort((a, b) => b.localeCompare(a))[0];
    const ageHours = hoursSince(newestAt, now);
    const importanceScore = Math.round(
      0.55 * getAuthorityScore(members) +
        0.2 * getTierScore(members) +
        0.15 * getCorroborationScore(corroboration) +
        0.1 * getRecencyScore(ageHours),
    );

    return {
      id: `story-${primary.id}`,
      primary,
      members,
      corroboration,
      importanceScore,
      phase: derivePhase(ageHours, corroboration),
      newestAt,
    };
  });
}

export interface LiveStoryFeedOptions extends ClusterNewsOptions {
  limit?: number;
}

/** Cluster, rank by composite importance then recency, and cap the feed. */
export function buildLiveStoryFeed(
  items: AiLawNewsItem[],
  options?: LiveStoryFeedOptions,
): LegalStory[] {
  const limit = options?.limit ?? 6;
  return clusterNewsIntoStories(items, options)
    .sort((a, b) => {
      if (b.importanceScore !== a.importanceScore) {
        return b.importanceScore - a.importanceScore;
      }
      return b.newestAt.localeCompare(a.newestAt);
    })
    .slice(0, limit);
}

export function getStoryPhaseDisplay(phase: LegalStoryPhase) {
  switch (phase) {
    case "breaking":
      return "Breaking";
    case "developing":
      return "Developing";
    case "sustained":
      return "Sustained";
    case "fading":
    default:
      return "Fading";
  }
}
