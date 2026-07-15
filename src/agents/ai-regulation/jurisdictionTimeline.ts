import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { VisibilityScope } from "@/db/repository-types";

export type TimelineAuthorityCategory =
  | "hard_law"
  | "soft_law"
  | "case_law_and_decisions"
  | "legal_news";

export interface JurisdictionTimelineEntry {
  updateId: string;
  title: string;
  date: string;
  jurisdiction: string;
  region: string;
  category: TimelineAuthorityCategory;
  sourceName: string;
  sourceUrl: string;
  summary: string;
  confidenceLevel: AiRegulatoryUpdate["confidenceLevel"];
}

export interface JurisdictionLegalDatabaseSnapshot {
  jurisdiction: string;
  region?: string;
  timeline: JurisdictionTimelineEntry[];
  coverage: Record<TimelineAuthorityCategory, number>;
  sourceUpdateIds: string[];
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function updateBelongsToJurisdiction(update: AiRegulatoryUpdate, jurisdiction: string, region?: string) {
  const target = normalize(jurisdiction);
  if (region && normalize(update.region) !== normalize(region)) return false;

  return (
    normalize(update.jurisdiction) === target ||
    normalize(update.country) === target ||
    normalize(update.jurisdiction).includes(target)
  );
}

export function classifyTimelineAuthority(update: Pick<AiRegulatoryUpdate, "developmentType" | "legalArea" | "tags">): TimelineAuthorityCategory {
  const haystack = [
    update.developmentType,
    update.legalArea,
    ...update.tags,
  ].join(" ").toLowerCase();

  if (/country-baseline/.test(haystack)) {
    return "soft_law";
  }
  if (/\b(case|court|judgment|judgement|decision|sanction|enforcement)\b|attorney general/.test(haystack)) {
    return "case_law_and_decisions";
  }
  if (/guidance|framework|standard|soft law|best practice|policy|recommendation|opinion|country-baseline/.test(haystack)) {
    return "soft_law";
  }
  if (/law|act|regulation|rule|statute|bill|ordinance|code|legislation|final rule/.test(haystack)) {
    return "hard_law";
  }
  return "legal_news";
}

function isTimelineEligible(update: AiRegulatoryUpdate) {
  return update.status === "published" || update.status === "approved";
}

function toTimelineEntry(update: AiRegulatoryUpdate): JurisdictionTimelineEntry {
  return {
    updateId: update.id,
    title: update.title,
    date: update.publicationDate ?? update.detectedDate,
    jurisdiction: update.jurisdiction,
    region: update.region,
    category: classifyTimelineAuthority(update),
    sourceName: update.sourceName,
    sourceUrl: update.sourceUrl,
    summary: update.oneSentenceSummary,
    confidenceLevel: update.confidenceLevel,
  };
}

export function buildJurisdictionLegalDatabaseSnapshot(input: {
  jurisdiction: string;
  region?: string;
  updates: AiRegulatoryUpdate[];
}): JurisdictionLegalDatabaseSnapshot {
  const timeline = input.updates
    .filter(isTimelineEligible)
    .filter((update) => updateBelongsToJurisdiction(update, input.jurisdiction, input.region))
    .map(toTimelineEntry)
    .sort((a, b) => b.date.localeCompare(a.date));

  const coverage: Record<TimelineAuthorityCategory, number> = {
    hard_law: 0,
    soft_law: 0,
    case_law_and_decisions: 0,
    legal_news: 0,
  };

  for (const entry of timeline) {
    coverage[entry.category] += 1;
  }

  return {
    jurisdiction: input.jurisdiction,
    region: input.region,
    timeline,
    coverage,
    sourceUpdateIds: timeline.map((entry) => entry.updateId),
  };
}

export function distributeCentralLegalDatabase(input: {
  jurisdictions: Array<{ jurisdiction: string; region?: string }>;
  updates: AiRegulatoryUpdate[];
}) {
  return input.jurisdictions.map((jurisdiction) =>
    buildJurisdictionLegalDatabaseSnapshot({
      ...jurisdiction,
      updates: input.updates,
    }),
  );
}

export async function getJurisdictionLegalDatabaseSnapshot(input: {
  jurisdiction: string;
  region?: string;
  scope?: VisibilityScope;
}) {
  const scope = input.scope ?? "public";
  const updates =
    scope === "public"
      ? await updateRepository.listPublicUpdates({
          region: input.region,
        })
      : await updateRepository.listUpdates({
          region: input.region,
        });

  return buildJurisdictionLegalDatabaseSnapshot({
    jurisdiction: input.jurisdiction,
    region: input.region,
    updates,
  });
}
