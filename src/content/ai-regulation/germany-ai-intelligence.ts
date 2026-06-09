import { getEuropeCountryProfileBySlug } from "@/content/ai-regulation/europe-country-profiles";
import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";

export interface GermanyAuthorityMapEntry {
  id: string;
  title: string;
  category:
    | "data_protection_authority"
    | "government_implementation"
    | "parliamentary_implementation"
    | "soft_law_guidance";
  statusLabel:
    | "officially_supported"
    | "direct_instrument_under_review"
    | "preparing_or_partial"
    | "needs_full_verification";
  note: string;
  sourceLabel: string;
  sourceUrl: string;
  publicationDate: string | null;
}

export interface GermanyTimelineEntry {
  id: string;
  date: string;
  title: string;
  category:
    | "implementation"
    | "guidance"
    | "governance"
    | "case_law"
    | "parliamentary_development";
  note: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface GermanyVerificationGap {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  note: string;
}

export function getGermanyAiIntelligenceSnapshot() {
  const germanyProfile = getEuropeCountryProfileBySlug("germany");
  if (!germanyProfile) {
    return {
      authorityMap: [] as GermanyAuthorityMapEntry[],
      timeline: [] as GermanyTimelineEntry[],
      verifiedDecisions: [],
      verificationGaps: [] as GermanyVerificationGap[],
    };
  }

  const findRef = (matcher: (url: string) => boolean) =>
    germanyProfile.sourceReferences.find((reference) => matcher(reference.url)) ?? null;

  const bfdiAiUnit = findRef((url) => url.includes("/Referat_28.html"));
  const bfdiConsultation = findRef((url) => url.includes("/KI-pbD/KI-pbD-Einleitung.html"));
  const federalImplementation = findRef((url) => url.includes("/umsetzung-ki-verordnung-2406638"));
  const bundestagImplementation = findRef((url) => url.includes("/presse/hib/kurzmeldungen-1155112"));
  const bundestagBundesrat = findRef((url) => url.includes("/presse/hib/kurzmeldungen-1161640"));

  const authorityMap: GermanyAuthorityMapEntry[] = [
    federalImplementation
      ? {
          id: "germany-federal-implementation",
          title: "Federal Government implementation track for the EU AI Regulation",
          category: "government_implementation",
          statusLabel: "direct_instrument_under_review",
          note:
            "The Federal Government implementation page confirms that the cabinet decided how the AI Act should be carried out in Germany. It materially strengthens the implementation baseline, but the project still treats the final authority map as under review.",
          sourceLabel: federalImplementation.title,
          sourceUrl: federalImplementation.url,
          publicationDate: federalImplementation.publicationDate ?? null,
        }
      : null,
    bundestagImplementation
      ? {
          id: "germany-bundestag-implementation",
          title: "Bundestag legislative processing of the AI Act implementation bill",
          category: "parliamentary_implementation",
          statusLabel: "preparing_or_partial",
          note:
            "The Bundestag materials make the implementation bill and planned authority structure more legible, including the central role proposed for the BNetzA, while the final enacted authority map remains under review.",
          sourceLabel: bundestagImplementation.title,
          sourceUrl: bundestagImplementation.url,
          publicationDate: bundestagImplementation.publicationDate ?? null,
        }
      : null,
    bfdiAiUnit
      ? {
          id: "germany-bfdi-ai-unit",
          title: "BfDI AI unit and oversight posture",
          category: "data_protection_authority",
          statusLabel: "officially_supported",
          note:
            "The BfDI AI unit page officially confirms an institutional German AI and data-protection oversight capability, including engagement with AI Act interpretation and implementation issues.",
          sourceLabel: bfdiAiUnit.title,
          sourceUrl: bfdiAiUnit.url,
          publicationDate: bfdiAiUnit.publicationDate ?? null,
        }
      : null,
    bfdiConsultation
      ? {
          id: "germany-bfdi-consultation",
          title: "BfDI consultation on personal data in AI models",
          category: "soft_law_guidance",
          statusLabel: "preparing_or_partial",
          note:
            "The BfDI consultation page supports a live official German guidance layer on AI-model compliance and data protection, while remaining distinct from binding legislation or final designation instruments.",
          sourceLabel: bfdiConsultation.title,
          sourceUrl: bfdiConsultation.url,
          publicationDate: bfdiConsultation.publicationDate ?? null,
        }
      : null,
  ].filter(Boolean) as GermanyAuthorityMapEntry[];

  const timeline: GermanyTimelineEntry[] = [
    federalImplementation
      ? {
          id: "de-federal-implementation-2026",
          date: "2026-02-11",
          title: "Federal cabinet decided how to implement the EU AI Regulation in Germany",
          category: "implementation",
          note:
            "Official Federal Government milestone materially supporting Germany's implementation-in-progress posture.",
          sourceLabel: federalImplementation.title,
          sourceUrl: federalImplementation.url,
        }
      : null,
    bundestagImplementation
      ? {
          id: "de-bundestag-bill-2026",
          date: "2026-03-11",
          title: "Bundestag received the AI Act implementation bill",
          category: "parliamentary_development",
          note:
            "Official parliamentary milestone showing the implementation bill entering Bundestag processing and describing the planned authority and enforcement structure.",
          sourceLabel: bundestagImplementation.title,
          sourceUrl: bundestagImplementation.url,
        }
      : null,
    bundestagBundesrat
      ? {
          id: "de-bundesrat-statement-2026",
          date: "2026-04-02",
          title: "Bundestag published Bundesrat material on the AI Act implementation bill",
          category: "parliamentary_development",
          note:
            "Official parliamentary milestone reflecting the Bundesrat statement and continued legislative processing of Germany's AI Act implementation framework.",
          sourceLabel: bundestagBundesrat.title,
          sourceUrl: bundestagBundesrat.url,
        }
      : null,
    {
      id: "de-bgh-schufa-2025",
      date: "2025-10-14",
      title: "BGH ruled on transfer of positive data to SCHUFA",
      category: "case_law",
      note:
        "Official BGH press material on a German data-protection and scoring dispute relevant to automated decision-making and algorithmic credit assessment.",
      sourceLabel: "BGH press release on VI ZR 431/24",
      sourceUrl:
        "https://juris.bundesgerichtshof.de/cgi-bin/rechtsprechung/document.py?Art=pm&Blank=1&Datum=2025&Gericht=bgh&anz=210&nr=143457&pos=1",
    },
  ].filter(Boolean) as GermanyTimelineEntry[];

  const verifiedDecisions = europeAiCaseLawEntries.filter((entry) => entry.country === "Germany");

  const verificationGaps: GermanyVerificationGap[] = [
    {
      id: "de-authority-map",
      title: "Final AI Act authority map still needs full legal pinning",
      severity: "high",
      note:
        "Germany now has stronger official implementation and parliamentary materials, but the final enacted and article-level authority map should still not be described as conclusively verified.",
    },
    {
      id: "de-case-law-layer",
      title: "German decision layer remains narrow",
      severity: "medium",
      note:
        "The public Germany decision layer is still centered on automated decision-making and scoring materials rather than a broad German AI case-law corpus.",
    },
    {
      id: "de-parser-depth",
      title: "Germany official feeds still need richer parser depth",
      severity: "medium",
      note:
        "BfDI, Bundestag, and Federal Government sources are wired, but deeper extraction should still be built before claiming comprehensive recurring capture.",
    },
  ];

  return {
    authorityMap,
    timeline: timeline.sort((a, b) => b.date.localeCompare(a.date)),
    verifiedDecisions,
    verificationGaps,
  };
}
