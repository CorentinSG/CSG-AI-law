/**
 * Detects machine-generated curation boilerplate that must never be shown to
 * readers as legal substance. These strings come from three generators:
 * the discovery-lead copy (pipeline), the obligation/deadline extractor
 * fallbacks, and the national-depth backfill scripts' internal curation
 * instructions. On a published entry, "Key obligations" must describe the
 * law's obligations — or nothing.
 */
const BOILERPLATE_PATTERNS: RegExp[] = [
  // Extractor fallbacks (utils/deadlines.ts)
  /^No binding obligations were identified in the reviewed source\.?$/i,
  /^No clear deadline was detected in the reviewed source\.?$/i,
  // Discovery-lead copy (pipeline buildDiscoveryLeadCopy)
  /^Do not publish this discovery lead directly\.?$/i,
  /^Locate and verify an official source/i,
  /^Look for at least one additional reliable corroborating source/i,
  /^No legal deadline should be inferred from a non-official discovery lead\.?$/i,
  // Discovery-lead audience placeholders
  /^Editorial reviewers$/i,
  /^Legal intelligence researchers$/i,
  /^AI regulation monitoring team$/i,
  // Backfill curation instructions (national-depth / official waves)
  /^Use the official source as the primary authority/i,
  /^Separate official national .* sources from/i,
  /^Track follow-up .* (legislation|updates)/i,
  /^Map each item to the legal-area/i,
  /^Cross-check .* against the official/i,
];

export function isCurationBoilerplate(text: string): boolean {
  const normalized = text.trim();
  if (!normalized) return true;
  return BOILERPLATE_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Keep only reader-facing substance; empty result means "hide the section". */
export function stripCurationBoilerplate(items: string[]): string[] {
  return items.filter((item) => !isCurationBoilerplate(item));
}
