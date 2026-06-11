'use server';

import { revalidatePath } from "next/cache";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type {
  CountryIntelligenceSource,
  CountryReviewStatus,
} from "@/agents/ai-regulation/governance";
import type {
  CountryIntelligenceSourceWriteInput,
  CountryIntelligenceUpsertInput,
} from "@/db/repository-types";
import { assertAdminServerActionAccess } from "@/lib/admin-auth";

const reviewStatuses: readonly CountryReviewStatus[] = [
  "needs_review",
  "verified",
  "stale",
  "flagged",
];

function parseTextareaList(input: FormDataEntryValue | null): string[] {
  if (typeof input !== "string") return [];
  return input
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function optionalText(input: FormDataEntryValue | null): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Persist the editable editorial fields of one country profile to the
 * normalized `country_intelligence` table (F8 admin editor).
 *
 * Scope is deliberately limited to the mutable editorial/review fields that
 * the public country page overrides when present:
 *   - publicSummary, editorialNotes, missingSourceWarnings, implementationNotes
 *   - reviewStatus / reviewedBy (admin-only review metadata)
 *
 * Structural fields (country name, slug, region, implementation status,
 * confidence, citation quality, authority maps) are NOT editable here — they
 * stay sourced from the verified TypeScript content layer to avoid drift and
 * accidental content loss on a public legal page. Blank fields are stored as
 * empty/null so the public page falls back to the TypeScript baseline.
 */
export async function saveCountryProfileEditorial(formData: FormData) {
  await assertAdminServerActionAccess();

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;

  const existing = await updateRepository.getCountryIntelligenceBySlug(slug);
  if (!existing) {
    throw new Error(
      `No country_intelligence row found for slug "${slug}". Run "npm run seed:country-intelligence" first.`,
    );
  }

  const rawStatus = String(formData.get("reviewStatus") ?? "");
  const reviewStatus: CountryReviewStatus = reviewStatuses.includes(
    rawStatus as CountryReviewStatus,
  )
    ? (rawStatus as CountryReviewStatus)
    : existing.reviewStatus;

  const editorialNotesList = parseTextareaList(formData.get("editorialNotes"));

  const input: CountryIntelligenceUpsertInput = {
    id: existing.id,
    region: existing.region,
    countryCode: existing.countryCode,
    countryName: existing.countryName,
    slug: existing.slug,
    // Structural fields preserved from the existing row.
    implementationStatus: existing.implementationStatus,
    implementationConfidence: existing.implementationConfidence,
    competentAuthorityName: existing.competentAuthorityName ?? null,
    competentAuthorityUrl: existing.competentAuthorityUrl ?? null,
    dpaName: existing.dpaName ?? null,
    dpaUrl: existing.dpaUrl ?? null,
    marketSurveillanceAuthority: existing.marketSurveillanceAuthority ?? null,
    primaryOfficialSourceUrl: existing.primaryOfficialSourceUrl ?? null,
    primaryOfficialSourceTitle: existing.primaryOfficialSourceTitle ?? null,
    lastOfficialSourceCheck: existing.lastOfficialSourceCheck ?? null,
    citationQualityStatus: existing.citationQualityStatus,
    // Structural content (F8C-3c) — editable; blank arrays/notes fall back to
    // the TS baseline on the public page.
    implementationMeasures: parseTextareaList(formData.get("implementationMeasures")),
    competentAuthorities: parseTextareaList(formData.get("competentAuthorities")),
    marketSurveillanceAuthorities: parseTextareaList(
      formData.get("marketSurveillanceAuthorities"),
    ),
    notifyingAuthorities: parseTextareaList(formData.get("notifyingAuthorities")),
    relevantMinistries: parseTextareaList(formData.get("relevantMinistries")),
    nationalAIRegulationNotes: optionalText(formData.get("nationalAIRegulationNotes")),
    nationalCaseLawNotes: optionalText(formData.get("nationalCaseLawNotes")),
    nationalSoftLawNotes: optionalText(formData.get("nationalSoftLawNotes")),
    // Editable editorial fields.
    implementationNotes: optionalText(formData.get("implementationNotes")),
    publicSummary: optionalText(formData.get("publicSummary")),
    editorialNotes:
      editorialNotesList.length > 0 ? editorialNotesList.join("\n") : null,
    missingSourceWarnings: parseTextareaList(formData.get("missingSourceWarnings")),
    // Review metadata.
    lastReviewedAt: new Date().toISOString(),
    reviewedBy: optionalText(formData.get("reviewedBy")) ?? "admin-editor",
    reviewStatus,
  };

  await updateRepository.upsertCountryIntelligence(input);

  revalidatePath("/admin/ai-regulation/countries");
  revalidatePath(`/admin/ai-regulation/countries/${slug}`);
  revalidatePath(`/ai-regulation/europe/${slug}`);
}

// ---------------------------------------------------------------------------
// Source management (F8C-2). Built on `replaceCountryIntelligenceSources`, so
// each add/update/remove loads the full source set, applies the single change,
// and writes the whole set back. The public country page groups these rows
// into the three source families by `authorityType`.
// ---------------------------------------------------------------------------

const countrySourceAuthorityTypes: readonly string[] = [
  "government",
  "parliament",
  "legislation",
  "policy",
  "regulator",
  "court",
  "official",
  "standards_body",
  "soft_law",
  "case_law_source",
  "guidance_source",
];

function parseAuthorityType(input: FormDataEntryValue | null): string | null {
  if (typeof input !== "string") return null;
  return countrySourceAuthorityTypes.includes(input) ? input : null;
}

function parseTriState(input: FormDataEntryValue | null): boolean | null {
  if (input === "yes") return true;
  if (input === "no") return false;
  return null;
}

function parseResponseStatus(input: FormDataEntryValue | null): number | null {
  if (typeof input !== "string" || input.trim().length === 0) return null;
  const parsed = Number.parseInt(input.trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toWriteInput(
  source: CountryIntelligenceSource,
): CountryIntelligenceSourceWriteInput {
  return {
    id: source.id,
    countryId: source.countryId,
    sourceUrl: source.sourceUrl,
    sourceTitle: source.sourceTitle,
    institution: source.institution ?? null,
    authorityType: source.authorityType ?? null,
    publicAccessible: source.publicAccessible,
    runtimeAccessible: source.runtimeAccessible ?? null,
    lastCheckedAt: source.lastCheckedAt ?? null,
    responseStatus: source.responseStatus ?? null,
    active: source.active,
    notes: source.notes ?? null,
  };
}

function nextSourceIndex(existing: CountryIntelligenceSourceWriteInput[]): number {
  let max = 0;
  for (const source of existing) {
    const match = source.id.match(/-(\d+)$/);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }
  return max + 1;
}

/**
 * Resolve the country row for a slug and load its current sources as writable
 * inputs. Throws if the country has not been seeded.
 */
async function loadCountrySources(slug: string) {
  const country = await updateRepository.getCountryIntelligenceBySlug(slug);
  if (!country) {
    throw new Error(
      `No country_intelligence row found for slug "${slug}". Run "npm run seed:country-intelligence" first.`,
    );
  }
  const sources = await updateRepository.listCountryIntelligenceSources(country.id);
  return { country, sources: sources.map(toWriteInput) };
}

function revalidateCountry(slug: string) {
  revalidatePath("/admin/ai-regulation/countries");
  revalidatePath(`/admin/ai-regulation/countries/${slug}`);
  revalidatePath(`/ai-regulation/europe/${slug}`);
}

export async function addCountrySource(formData: FormData) {
  await assertAdminServerActionAccess();

  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;

  const sourceTitle = String(formData.get("sourceTitle") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  // A source is meaningless without a title and URL — silently ignore blanks.
  if (!sourceTitle || !sourceUrl) return;

  const { country, sources } = await loadCountrySources(slug);

  const newSource: CountryIntelligenceSourceWriteInput = {
    id: `country-source-${slug}-custom-${nextSourceIndex(sources)}`,
    countryId: country.id,
    sourceUrl,
    sourceTitle,
    institution: optionalText(formData.get("institution")),
    authorityType: parseAuthorityType(formData.get("authorityType")),
    publicAccessible: true,
    runtimeAccessible: parseTriState(formData.get("runtimeAccessible")),
    lastCheckedAt: null,
    responseStatus: parseResponseStatus(formData.get("responseStatus")),
    active: String(formData.get("active") ?? "true") !== "false",
    notes: optionalText(formData.get("notes")),
  };

  await updateRepository.replaceCountryIntelligenceSources(country.id, [
    ...sources,
    newSource,
  ]);

  revalidateCountry(slug);
}

export async function updateCountrySource(formData: FormData) {
  await assertAdminServerActionAccess();

  const slug = String(formData.get("slug") ?? "").trim();
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  if (!slug || !sourceId) return;

  const sourceTitle = String(formData.get("sourceTitle") ?? "").trim();
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
  if (!sourceTitle || !sourceUrl) return;

  const { country, sources } = await loadCountrySources(slug);
  if (!sources.some((source) => source.id === sourceId)) return;

  const updated = sources.map((source) =>
    source.id === sourceId
      ? {
          ...source,
          sourceTitle,
          sourceUrl,
          institution: optionalText(formData.get("institution")),
          authorityType: parseAuthorityType(formData.get("authorityType")),
          runtimeAccessible: parseTriState(formData.get("runtimeAccessible")),
          responseStatus: parseResponseStatus(formData.get("responseStatus")),
          active: String(formData.get("active") ?? "true") !== "false",
          notes: optionalText(formData.get("notes")),
        }
      : source,
  );

  await updateRepository.replaceCountryIntelligenceSources(country.id, updated);

  revalidateCountry(slug);
}

export async function removeCountrySource(formData: FormData) {
  await assertAdminServerActionAccess();

  const slug = String(formData.get("slug") ?? "").trim();
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  if (!slug || !sourceId) return;

  const { country, sources } = await loadCountrySources(slug);
  const remaining = sources.filter((source) => source.id !== sourceId);
  if (remaining.length === sources.length) return;

  await updateRepository.replaceCountryIntelligenceSources(country.id, remaining);

  revalidateCountry(slug);
}
