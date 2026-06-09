import { getEuropeCountryProfileBySlug } from "@/content/ai-regulation/europe-country-profiles";
import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";

export interface SwedenAuthorityMapEntry {
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

export interface SwedenTimelineEntry {
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

export interface SwedenVerificationGap {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  note: string;
}

export function getSwedenAiIntelligenceSnapshot() {
  const swedenProfile = getEuropeCountryProfileBySlug("sweden");
  if (!swedenProfile) {
    return {
      authorityMap: [] as SwedenAuthorityMapEntry[],
      timeline: [] as SwedenTimelineEntry[],
      verifiedDecisions: [],
      verificationGaps: [] as SwedenVerificationGap[],
    };
  }

  const findRef = (matcher: (url: string) => boolean) =>
    swedenProfile.sourceReferences.find((reference) => matcher(reference.url)) ?? null;

  const imyRef = findRef((url) => url.includes("imy.se"));
  const diggRef = findRef((url) => url.includes("digg.se"));
  const regeringenRef = findRef(
    (url) => url.includes("regeringen.se") || url.includes("government.se"),
  );

  const authorityMap: SwedenAuthorityMapEntry[] = [
    imyRef
      ? {
          id: "sweden-imy-ai",
          title: "Integritetsskyddsmyndigheten (IMY) — AI and data-protection oversight authority",
          category: "data_protection_authority",
          statusLabel: "officially_supported",
          note:
            "IMY is Sweden's official data-protection authority and an EDPB member. IMY has an active posture on AI oversight in the context of GDPR and is expected to play a supervisory role for AI Act provisions concerning AI systems that process personal data. IMY participated in the EDPB coordinated enforcement action on ChatGPT, demonstrating direct engagement with large-scale AI systems. The final national competent authority map under the AI Act for Sweden has not been verified from a binding designation instrument.",
          sourceLabel: imyRef.title,
          sourceUrl: imyRef.url,
          publicationDate: imyRef.publicationDate ?? null,
        }
      : null,
    diggRef
      ? {
          id: "sweden-digg-ai",
          title: "DIGG (Myndigheten för digital förvaltning) — Agency for Digital Government",
          category: "government_implementation",
          statusLabel: "preparing_or_partial",
          note:
            "DIGG manages Sweden's public-sector digital transformation and is relevant to national AI governance and policy implementation context. DIGG's precise role under the EU AI Act — including any market-surveillance or notifying authority designation — has not been verified from a binding instrument in this profile.",
          sourceLabel: diggRef.title,
          sourceUrl: diggRef.url,
          publicationDate: diggRef.publicationDate ?? null,
        }
      : null,
    regeringenRef
      ? {
          id: "sweden-regeringen-ai",
          title: "Regeringen — Swedish Government AI and digital policy",
          category: "government_implementation",
          statusLabel: "preparing_or_partial",
          note:
            "The Swedish Government coordinates national AI strategy and digital policy. National implementation instruments and authority-designation measures for the EU AI Act remain under review in this profile.",
          sourceLabel: regeringenRef.title,
          sourceUrl: regeringenRef.url,
          publicationDate: regeringenRef.publicationDate ?? null,
        }
      : null,
  ].filter(Boolean) as SwedenAuthorityMapEntry[];

  const timeline: SwedenTimelineEntry[] = [
    imyRef
      ? {
          id: "se-imy-chatgpt-investigation",
          date: "2023-04-01",
          title: "IMY participates in EDPB coordinated ChatGPT investigation",
          category: "governance",
          note:
            "IMY participated in the EDPB coordinated enforcement action on ChatGPT launched in April 2023, reflecting Sweden's active engagement with AI and large language model oversight within the European data-protection framework. This is directly relevant to AI Act supervision for high-impact AI systems in Sweden.",
          sourceLabel: imyRef.title,
          sourceUrl: imyRef.url,
        }
      : null,
    diggRef
      ? {
          id: "se-digg-ai-governance",
          date: "2021-01-01",
          title: "DIGG coordinates Sweden's public-sector digital transformation agenda",
          category: "implementation",
          note:
            "DIGG has been coordinating Sweden's digital government agenda, which provides the institutional and policy context for national AI governance. DIGG's work predates the EU AI Act and its status as a formal AI Act implementation or supervisory body has not been verified.",
          sourceLabel: diggRef.title,
          sourceUrl: diggRef.url,
        }
      : null,
  ].filter(Boolean) as SwedenTimelineEntry[];

  const verifiedDecisions = europeAiCaseLawEntries.filter(
    (entry) => entry.country === "Sweden",
  );

  const verificationGaps: SwedenVerificationGap[] = [
    {
      id: "se-authority-designation",
      title: "Final AI Act national competent authority not yet conclusively verified",
      severity: "high",
      note:
        "IMY is a likely AI Act supervisory authority for AI systems involving personal data, but Sweden's final national competent authority map and market-surveillance authority designation under the AI Act have not been verified from a binding instrument in this profile.",
    },
    {
      id: "se-implementation-instruments",
      title: "No binding national AI Act implementation instrument verified",
      severity: "high",
      note:
        "No Swedish national legislative or regulatory instrument specifically implementing the EU AI Act has been reviewed into this baseline. The current implementation-in-progress label reflects institutional readiness and EU-wide applicability rather than a verified enacted measure.",
    },
    {
      id: "se-digg-role",
      title: "DIGG role under AI Act not yet mapped",
      severity: "medium",
      note:
        "DIGG's role as a potential national market-surveillance or notifying authority under the EU AI Act has not been verified from a binding instrument. DIGG is registered as a monitoring anchor for digital government policy, but its AI Act jurisdiction remains under review.",
    },
    {
      id: "se-case-law-layer",
      title: "Sweden AI decision layer not yet populated",
      severity: "medium",
      note:
        "No Swedish AI-specific enforcement decision, court ruling, or IMY sanction specifically related to AI Act provisions has been reviewed into the public baseline in this phase.",
    },
    {
      id: "se-parser-depth",
      title: "Sweden official feeds require deeper parser coverage",
      severity: "medium",
      note:
        "IMY, DIGG, and Regeringen are registered as monitoring anchors, but deeper extraction and recurring capture have not yet been validated against live feed responses.",
    },
  ];

  return {
    authorityMap,
    timeline: timeline.sort((a, b) => b.date.localeCompare(a.date)),
    verifiedDecisions,
    verificationGaps,
  };
}
