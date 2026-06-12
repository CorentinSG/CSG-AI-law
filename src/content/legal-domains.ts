// Legal-domain taxonomy — the canonical list of practice areas the platform
// covers, so the site can grow beyond AI law into adjacent legal-intelligence
// domains (privacy/data protection, cloud law) without scattering hardcoded
// labels across pages. Honest by design: only "live" domains have a hub; others
// are clearly marked as in development or planned and must never imply coverage
// that does not yet exist.

export type LegalDomainStatus = "live" | "in_development" | "planned";

export interface LegalDomain {
  slug: string;
  /** Full title for headings. */
  title: string;
  /** Compact label for chips/nav. */
  shortLabel: string;
  /** One-line positioning statement. */
  tagline: string;
  /** Short paragraph describing the domain's scope. */
  description: string;
  status: LegalDomainStatus;
  statusLabel: string;
  /** Public hub route when the domain is live; null while not yet shipped. */
  hubHref: string | null;
  /** Honest, current-state note about what is (and isn't) covered today. */
  coverageNote: string;
}

export const legalDomains: LegalDomain[] = [
  {
    slug: "ai-law",
    title: "AI Law & Governance",
    shortLabel: "AI Law",
    tagline: "Artificial-intelligence regulation, governance, and enforcement.",
    description:
      "Binding law, proposed law, regulator guidance, enforcement, soft law, and standards on artificial intelligence, monitored from official sources with human review before publication.",
    status: "live",
    statusLabel: "Live",
    hubHref: "/ai-regulation",
    coverageNote:
      "EU AI Act and member-state implementation, the United States (federal, 50 states + DC), and official regulators and standards bodies.",
  },
  {
    slug: "privacy-data-protection",
    title: "Privacy & Data Protection",
    shortLabel: "Privacy",
    tagline: "Personal-data and data-protection law across jurisdictions.",
    description:
      "Data-protection authority guidance, enforcement, and legislative developments on personal data and privacy — built on the same official-source, human-reviewed model as the AI law hub.",
    status: "in_development",
    statusLabel: "In development",
    hubHref: null,
    coverageNote:
      "Official data-protection authorities (CNIL, EDPB, EDPS, Garante, BfDI, AEPD, IMY, and others) are progressively being wired as monitored sources. No dedicated public hub yet.",
  },
  {
    slug: "cloud-law",
    title: "Cloud Law",
    shortLabel: "Cloud",
    tagline: "Cloud computing, data localization, and digital-infrastructure law.",
    description:
      "Legal developments on cloud computing, data localization, sovereignty requirements, and digital-infrastructure regulation.",
    status: "planned",
    statusLabel: "Planned",
    hubHref: null,
    coverageNote: "Scope is being defined; no sources or public hub yet.",
  },
];

/**
 * The editorial separation the platform preserves across every domain:
 * official authority vs. discovery-only signals vs. human-validated publication.
 */
export const legalDomainSourcingPrinciple =
  "Across every domain the platform keeps the same separation: official sources are authority, discovery/media signals are leads requiring verification, and nothing is published without human review.";

export function getLegalDomains(): LegalDomain[] {
  return legalDomains;
}

export function getLegalDomainBySlug(slug: string): LegalDomain | null {
  return legalDomains.find((domain) => domain.slug === slug) ?? null;
}

export function getLiveLegalDomains(): LegalDomain[] {
  return legalDomains.filter((domain) => domain.status === "live");
}
