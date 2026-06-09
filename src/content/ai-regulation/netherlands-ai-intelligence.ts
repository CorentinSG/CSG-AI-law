import { getEuropeCountryProfileBySlug } from "@/content/ai-regulation/europe-country-profiles";
import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";

export interface NetherlandsAuthorityMapEntry {
  id: string;
  title: string;
  category:
    | "data_protection_authority"
    | "supervision_authority"
    | "government_implementation"
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

export interface NetherlandsTimelineEntry {
  id: string;
  date: string;
  title: string;
  category:
    | "implementation"
    | "guidance"
    | "governance"
    | "case_law"
    | "consultation";
  note: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface NetherlandsVerificationGap {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  note: string;
}

export function getNetherlandsAiIntelligenceSnapshot() {
  const netherlandsProfile = getEuropeCountryProfileBySlug("netherlands");
  if (!netherlandsProfile) {
    return {
      authorityMap: [] as NetherlandsAuthorityMapEntry[],
      timeline: [] as NetherlandsTimelineEntry[],
      verifiedDecisions: [],
      verificationGaps: [] as NetherlandsVerificationGap[],
    };
  }

  const findRef = (matcher: (url: string) => boolean) =>
    netherlandsProfile.sourceReferences.find((reference) => matcher(reference.url)) ?? null;

  const apAlgorithmsRef = findRef((url) => url.includes("autoriteitpersoonsgegevens.nl"));
  const rdiAiRef = findRef((url) => url.includes("rdi.nl"));
  const consultationRef = findRef((url) =>
    url.includes("overheid.nl") ||
    url.includes("rijksoverheid.nl") ||
    url.includes("internetconsultatie.nl"),
  );

  const authorityMap: NetherlandsAuthorityMapEntry[] = [
    apAlgorithmsRef
      ? {
          id: "netherlands-ap-algorithms",
          title: "Autoriteit Persoonsgegevens — algorithms and AI oversight",
          category: "data_protection_authority",
          statusLabel: "officially_supported",
          note:
            "The AP algorithms and AI page confirms an institutional Dutch data-protection and algorithmic oversight capability. The AP is the competent national authority for GDPR enforcement and is directly relevant to AI Act supervision in the Netherlands context, but the final AI Act designated national authority role has not yet been conclusively verified in this profile.",
          sourceLabel: apAlgorithmsRef.title,
          sourceUrl: apAlgorithmsRef.url,
          publicationDate: apAlgorithmsRef.publicationDate ?? null,
        }
      : null,
    rdiAiRef
      ? {
          id: "netherlands-rdi-ai",
          title: "Rijksdienst voor Digitale Infrastructuur — AI supervision",
          category: "supervision_authority",
          statusLabel: "preparing_or_partial",
          note:
            "The RDI AI supervision page confirms an official Dutch digital infrastructure regulator with a declared AI supervision mandate. The scope and relationship to the AI Act designated national authority remains under review.",
          sourceLabel: rdiAiRef.title,
          sourceUrl: rdiAiRef.url,
          publicationDate: rdiAiRef.publicationDate ?? null,
        }
      : null,
    consultationRef
      ? {
          id: "netherlands-ai-consultation",
          title: "Dutch government AI Regulation implementing act consultation",
          category: "government_implementation",
          statusLabel: "direct_instrument_under_review",
          note:
            "The official Dutch government announcement of an internet consultation on an AI Regulation implementing act (opened 20 April 2026) confirms an active national implementation track, but the consultation outcome and final designation instrument remain under review.",
          sourceLabel: consultationRef.title,
          sourceUrl: consultationRef.url,
          publicationDate: consultationRef.publicationDate ?? null,
        }
      : null,
  ].filter(Boolean) as NetherlandsAuthorityMapEntry[];

  const timeline: NetherlandsTimelineEntry[] = [
    consultationRef
      ? {
          id: "nl-ai-consultation-2026",
          date: "2026-04-20",
          title: "Dutch government opened internet consultation on AI Regulation implementing act",
          category: "consultation",
          note:
            "Official Dutch government announcement confirming that a proposal for an AI Regulation implementing act was opened for internet consultation on 20 April 2026. This is the primary verified national implementation milestone to date.",
          sourceLabel: consultationRef.title,
          sourceUrl: consultationRef.url,
        }
      : null,
  ].filter(Boolean) as NetherlandsTimelineEntry[];

  const verifiedDecisions = europeAiCaseLawEntries.filter(
    (entry) => entry.country === "Netherlands",
  );

  const verificationGaps: NetherlandsVerificationGap[] = [
    {
      id: "nl-authority-designation",
      title: "Final AI Act national competent authority not yet conclusively verified",
      severity: "high",
      note:
        "AP and RDI are both relevant Dutch authorities for AI governance, but the final enacted national competent authority map under the EU AI Act has not yet been verified from a binding designation instrument in this profile.",
    },
    {
      id: "nl-consultation-outcome",
      title: "Consultation outcome and implementing act status unknown",
      severity: "high",
      note:
        "The April 2026 internet consultation was confirmed, but the resulting enacted instrument, timeline, and final regulatory structure have not yet been reviewed into the public baseline.",
    },
    {
      id: "nl-case-law-layer",
      title: "Netherlands AI decision layer not yet populated",
      severity: "medium",
      note:
        "No Dutch AI-specific case law or enforcement decision has been reviewed into the public baseline in this phase.",
    },
    {
      id: "nl-parser-depth",
      title: "Netherlands official feeds require deeper parser coverage",
      severity: "medium",
      note:
        "AP and RDI sources are registered as monitoring anchors, but deeper extraction and recurring capture have not yet been validated against live feed responses.",
    },
  ];

  return {
    authorityMap,
    timeline: timeline.sort((a, b) => b.date.localeCompare(a.date)),
    verifiedDecisions,
    verificationGaps,
  };
}
