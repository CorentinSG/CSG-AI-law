import type { CountryIntelligenceSource } from "@/agents/ai-regulation/governance";

/**
 * View-model for one source row on the public country page. Mirrors the shape
 * the `SourceList` component on `/ai-regulation/europe/[country]` already
 * consumes from the TypeScript content layer, so DB-backed sources render
 * identically.
 */
export interface CountrySourceListItem {
  label: string;
  url: string;
  institution: string;
  responseStatus: number | null;
  runtimeAccessible: boolean | null;
  note: string;
}

export interface GroupedCountrySources {
  regulation: CountrySourceListItem[];
  caseLaw: CountrySourceListItem[];
  softLaw: CountrySourceListItem[];
}

/**
 * The seed prefixes each stored note with its family (`regulation: ...`,
 * `case-law: ...`, `soft-law: ...`). Strip it so the public display matches the
 * original TypeScript note text.
 */
function stripFamilyPrefix(note: string): string {
  return note.replace(/^(regulation|case-law|soft-law):\s*/, "");
}

/**
 * Source IDs are `country-source-<slug>-<family>-<n>`. Extract the trailing
 * 1-based index so sources render in their authored order regardless of the
 * order the repository returns them in.
 */
function sourceIndex(id: string): number {
  const match = id.match(/-(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function toItem(source: CountryIntelligenceSource): CountrySourceListItem {
  return {
    label: source.sourceTitle,
    url: source.sourceUrl,
    institution: source.institution ?? "",
    responseStatus: source.responseStatus ?? null,
    runtimeAccessible: source.runtimeAccessible ?? null,
    note: stripFamilyPrefix(source.notes ?? ""),
  };
}

/**
 * Group normalized `country_intelligence_sources` rows back into the three
 * source families the public country page renders.
 *
 * Family detection uses `authorityType`, which the seed sets explicitly to
 * `case_law_source` for case-law sources and `guidance_source` for soft-law
 * sources. Every other authority type (regulator, government, legislation,
 * soft_law, etc.) belongs to the national AI regulation family.
 */
export function groupCountryIntelligenceSourcesByFamily(
  sources: CountryIntelligenceSource[],
): GroupedCountrySources {
  const regulation: CountryIntelligenceSource[] = [];
  const caseLaw: CountryIntelligenceSource[] = [];
  const softLaw: CountryIntelligenceSource[] = [];

  for (const source of sources) {
    if (source.authorityType === "case_law_source") {
      caseLaw.push(source);
    } else if (source.authorityType === "guidance_source") {
      softLaw.push(source);
    } else {
      regulation.push(source);
    }
  }

  const sortAndMap = (list: CountryIntelligenceSource[]) =>
    [...list].sort((a, b) => sourceIndex(a.id) - sourceIndex(b.id)).map(toItem);

  return {
    regulation: sortAndMap(regulation),
    caseLaw: sortAndMap(caseLaw),
    softLaw: sortAndMap(softLaw),
  };
}
