import type {
  AiRegulatoryUpdate,
  RawRegulatoryItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import type { SourceReference, SourceReferenceType } from "@/agents/ai-regulation/citations";
import { getSourceReferencesFromRawItem } from "@/agents/ai-regulation/citations";
import { isSameStoryTitle } from "@/agents/ai-regulation/storyClustering";
import {
  isDiscoveryOnlySource,
  isMediaDiscoverySource,
} from "@/agents/ai-regulation/utils/discovery";
import {
  extractVerificationMetadata,
  type VerificationMetadata,
} from "@/agents/ai-regulation/verification";

/**
 * Cross-source corroboration at ingestion time (worldmonitor pattern).
 *
 * When a freshly created update fuzzy-matches a recent update from a
 * DIFFERENT serious source (official, regulator, or reputable press), both
 * items gain a "supporting" source reference. The news projection then
 * derives verificationStatus "corroborated", which feeds the standing
 * publication policy: legal news corroborated by multiple sources may become
 * public. Informal discovery-only sources never count as corroboration and
 * never gain visibility from it.
 */

export const CORROBORATION_WINDOW_DAYS = 14;
export const CORROBORATION_MAX_MATCHES = 3;

export interface CorroborationMatch {
  update: AiRegulatoryUpdate;
  source: RegulationSource | null;
}

/**
 * Minimal shape needed to look for corroborating counterparts. Satisfied by a
 * full AiRegulatoryUpdate, and buildable from a raw candidate before its
 * update exists (used to prioritise AI processing of corroborated items).
 */
export interface CorroborationProbe {
  id: string;
  sourceId: string;
  title: string;
  jurisdiction: string;
  region: string;
  country: string;
  publicationDate: string | null;
  detectedDate: string;
}

export function isEligibleCorroboratingSource(source: RegulationSource | null) {
  if (!source) return false;
  // Reputable media discovery counts (multi-source press corroboration);
  // informal discovery-only aggregators never do.
  if (isMediaDiscoverySource(source)) return true;
  return !isDiscoveryOnlySource(source);
}

function updateTimestamp(update: CorroborationProbe) {
  return update.publicationDate ?? update.detectedDate;
}

function withinWindow(a: CorroborationProbe, b: CorroborationProbe, windowDays: number) {
  const aMs = Date.parse(updateTimestamp(a));
  const bMs = Date.parse(updateTimestamp(b));
  if (!Number.isFinite(aMs) || !Number.isFinite(bMs)) return true;
  return Math.abs(aMs - bMs) <= windowDays * 24 * 60 * 60 * 1000;
}

function sameGeography(a: CorroborationProbe, b: CorroborationProbe) {
  return (
    a.region === b.region ||
    a.jurisdiction === b.jurisdiction ||
    (Boolean(a.country) && a.country === b.country)
  );
}

export function findCorroboratingUpdates(input: {
  update: CorroborationProbe;
  recentUpdates: AiRegulatoryUpdate[];
  sourcesById: Map<string, RegulationSource>;
  windowDays?: number;
  maxMatches?: number;
}): CorroborationMatch[] {
  const windowDays = input.windowDays ?? CORROBORATION_WINDOW_DAYS;
  const maxMatches = input.maxMatches ?? CORROBORATION_MAX_MATCHES;
  const matches: CorroborationMatch[] = [];
  const seenSourceIds = new Set<string>([input.update.sourceId]);

  for (const candidate of input.recentUpdates) {
    if (matches.length >= maxMatches) break;
    if (candidate.id === input.update.id) continue;
    if (candidate.status === "rejected" || candidate.status === "archived") continue;
    if (seenSourceIds.has(candidate.sourceId)) continue;
    const candidateSource = input.sourcesById.get(candidate.sourceId) ?? null;
    if (!isEligibleCorroboratingSource(candidateSource)) continue;
    if (!sameGeography(input.update, candidate)) continue;
    if (!withinWindow(input.update, candidate, windowDays)) continue;
    if (!isSameStoryTitle(input.update.title, candidate.title)) continue;

    seenSourceIds.add(candidate.sourceId);
    matches.push({ update: candidate, source: candidateSource });
  }

  return matches;
}

function referenceSourceType(source: RegulationSource | null): SourceReferenceType {
  if (!source) return "official";
  if (isMediaDiscoverySource(source)) return "media_source";
  if (source.sourceType === "legislative_database") return "official";
  if (source.sourceType === "regulator_page" || source.sourceType === "RSS") {
    return "regulator";
  }
  return "official";
}

export function buildCorroboratingReference(input: {
  counterpart: AiRegulatoryUpdate;
  counterpartSource: RegulationSource | null;
  now: string;
}): SourceReference {
  return {
    sourceRole: "supporting",
    title: input.counterpart.title,
    institution: input.counterpart.sourceName,
    url: input.counterpart.sourceUrl,
    canonicalUrl: input.counterpart.sourceUrl,
    sourceType: referenceSourceType(input.counterpartSource),
    authorityType: input.counterpart.authorityType ?? null,
    publicationDate: input.counterpart.publicationDate,
    detectedAt: input.counterpart.detectedDate,
    retrievedAt: input.now,
    lastVerifiedAt: input.now,
    jurisdiction: input.counterpart.jurisdiction,
    documentType: input.counterpart.developmentType,
    excerpt: null,
    pinpoint: {},
    reliabilityLevel: input.counterpartSource?.reliabilityLevel ?? "medium",
    verificationStatus: "corroborated",
    archivedUrl: null,
    notes:
      "Cross-source corroboration: an independent monitored source reported the same development (matched automatically by story similarity).",
  };
}

function mergeSupportingReferences(
  rawMetadata: Record<string, unknown>,
  references: SourceReference[],
) {
  const existing = getSourceReferencesFromRawItem({ rawMetadata });
  const existingUrls = new Set(existing.map((reference) => reference.url));
  const additions = references.filter((reference) => !existingUrls.has(reference.url));
  return { merged: [...existing, ...additions], additions };
}

function mergeCorroborationVerification(
  rawMetadata: Record<string, unknown>,
  corroboratingUrls: string[],
  now: string,
): VerificationMetadata | null {
  const existing = extractVerificationMetadata({ rawMetadata });
  if (!existing) return null;
  const urls = Array.from(
    new Set([...(existing.corroboratingSourceUrls ?? []), ...corroboratingUrls]),
  );
  return {
    ...existing,
    lastVerifiedAt: now,
    verificationStatus: urls.length > 0 ? "corroborated" : existing.verificationStatus,
    corroboratingSourcesCount: urls.length,
    corroboratingSourceUrls: urls,
  };
}

/**
 * Returns the raw-metadata patch marking this item as corroborated by the
 * given counterpart updates. Pure — the caller persists the returned metadata.
 */
export function buildCorroborationMetadataPatch(input: {
  rawItem: Pick<RawRegulatoryItem, "rawMetadata">;
  matches: CorroborationMatch[];
  now: string;
}): { rawMetadata: Record<string, unknown>; addedReferences: SourceReference[] } | null {
  if (input.matches.length === 0) return null;

  const references = input.matches.map((match) =>
    buildCorroboratingReference({
      counterpart: match.update,
      counterpartSource: match.source,
      now: input.now,
    }),
  );
  const { merged, additions } = mergeSupportingReferences(
    input.rawItem.rawMetadata,
    references,
  );
  if (additions.length === 0) return null;

  const verification = mergeCorroborationVerification(
    input.rawItem.rawMetadata,
    additions.map((reference) => reference.url),
    input.now,
  );

  return {
    rawMetadata: {
      ...input.rawItem.rawMetadata,
      sourceReferences: merged,
      ...(verification ? { verification } : {}),
    },
    addedReferences: additions,
  };
}
