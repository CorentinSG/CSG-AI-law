import { getEuropeCountryProfileBySlug } from "@/content/ai-regulation/europe-country-profiles";
import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";

export interface IrelandAuthorityMapEntry {
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

export interface IrelandTimelineEntry {
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

export interface IrelandVerificationGap {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  note: string;
}

export function getIrelandAiIntelligenceSnapshot() {
  const irelandProfile = getEuropeCountryProfileBySlug("ireland");
  if (!irelandProfile) {
    return {
      authorityMap: [] as IrelandAuthorityMapEntry[],
      timeline: [] as IrelandTimelineEntry[],
      verifiedDecisions: [],
      verificationGaps: [] as IrelandVerificationGap[],
    };
  }

  const findRef = (matcher: (url: string) => boolean) =>
    irelandProfile.sourceReferences.find((reference) => matcher(reference.url)) ?? null;

  const dpcRef = findRef((url) => url.includes("dataprotection.ie"));
  const deteRef = findRef(
    (url) => url.includes("enterprise.gov.ie") || url.includes("gov.ie"),
  );

  const authorityMap: IrelandAuthorityMapEntry[] = [
    dpcRef
      ? {
          id: "ireland-dpc-ai",
          title: "Data Protection Commission (DPC) — AI and data-protection oversight authority",
          category: "data_protection_authority",
          statusLabel: "officially_supported",
          note:
            "The DPC is Ireland's official data-protection authority and an EDPB member. Ireland is the EU establishment of many large AI and technology companies including Meta, Google, Apple, LinkedIn, and Microsoft, making the DPC the lead supervisory authority for many cross-border GDPR cases involving AI systems. The DPC has active GDPR enforcement activity on AI-related data processing. The DPC's precise role as national competent authority under the EU AI Act has not been verified from a binding national designation instrument in this profile.",
          sourceLabel: dpcRef.title,
          sourceUrl: dpcRef.url,
          publicationDate: dpcRef.publicationDate ?? null,
        }
      : null,
    deteRef
      ? {
          id: "ireland-dete-ai",
          title: "Department of Enterprise, Trade and Employment (DETE) — AI Act national implementation",
          category: "government_implementation",
          statusLabel: "preparing_or_partial",
          note:
            "DETE is the Irish government department responsible for enterprise, trade, and digital regulation. DETE is expected to have a leading role in Ireland's national AI Act implementation. Specific national implementation measures and authority-designation instruments remain under review in this profile.",
          sourceLabel: deteRef.title,
          sourceUrl: deteRef.url,
          publicationDate: deteRef.publicationDate ?? null,
        }
      : null,
  ].filter(Boolean) as IrelandAuthorityMapEntry[];

  const timeline: IrelandTimelineEntry[] = [
    dpcRef
      ? {
          id: "ie-dpc-tech-hub-enforcement",
          date: "2023-01-01",
          title: "DPC as lead supervisory authority for major AI and technology companies in EU",
          category: "governance",
          note:
            "Ireland's status as the EU headquarters for Meta, Google, Apple, LinkedIn, Microsoft, and others makes the DPC the lead supervisory authority under GDPR for cross-border processing cases. This has heightened practical relevance as many AI systems involving personal data are operated by companies whose EU establishments are in Ireland. DPC's enforcement posture on AI and data use is therefore significant beyond Ireland's domestic context.",
          sourceLabel: dpcRef.title,
          sourceUrl: dpcRef.url,
        }
      : null,
    deteRef
      ? {
          id: "ie-dete-ai-strategy",
          date: "2021-07-01",
          title: "Ireland AI Strategy and national digital policy context",
          category: "implementation",
          note:
            "Ireland has published national AI strategy documents and digital policy frameworks relevant to national AI governance. DETE coordinates the national enterprise and innovation agenda, providing the institutional context for EU AI Act national implementation. Specific binding measures implementing the EU AI Act remain under review.",
          sourceLabel: deteRef.title,
          sourceUrl: deteRef.url,
        }
      : null,
  ].filter(Boolean) as IrelandTimelineEntry[];

  const verifiedDecisions = europeAiCaseLawEntries.filter(
    (entry) => entry.country === "Ireland",
  );

  const verificationGaps: IrelandVerificationGap[] = [
    {
      id: "ie-authority-designation",
      title: "Final AI Act national competent authority not yet conclusively verified",
      severity: "high",
      note:
        "The DPC is likely to have a supervisory role for AI systems involving personal data, but Ireland's final national competent authority map and market-surveillance authority designation under the EU AI Act have not been verified from a binding national instrument in this profile.",
    },
    {
      id: "ie-implementation-instruments",
      title: "No binding national AI Act implementation instrument verified",
      severity: "high",
      note:
        "No Irish national legislative or regulatory instrument specifically implementing the EU AI Act has been reviewed into this baseline. The implementation-in-progress label reflects EU-wide applicability and institutional readiness, not a verified enacted national measure.",
    },
    {
      id: "ie-dpc-ai-act-role",
      title: "DPC formal AI Act role not yet mapped from binding instrument",
      severity: "medium",
      note:
        "The DPC is the expected supervisory authority for AI systems involving personal data, but its formal market-surveillance or notifying authority designation under the EU AI Act has not been verified from a binding national instrument in this profile. DPC's current enforcement activities derive primarily from GDPR jurisdiction.",
    },
    {
      id: "ie-case-law-layer",
      title: "Ireland AI decision and enforcement layer not yet populated",
      severity: "medium",
      note:
        "No Irish AI-specific enforcement decision, court ruling, or DPC sanction specifically related to AI Act provisions has been reviewed into the public baseline in this phase. DPC GDPR enforcement actions relating to AI processing exist but have not been individually reviewed and classified in this profile.",
    },
    {
      id: "ie-parser-depth",
      title: "Ireland official feeds require deeper parser coverage",
      severity: "medium",
      note:
        "The DPC, DETE, and gov.ie are registered as monitoring anchors, but deeper extraction and recurring capture have not yet been validated against live feed responses.",
    },
  ];

  return {
    authorityMap,
    timeline: timeline.sort((a, b) => b.date.localeCompare(a.date)),
    verifiedDecisions,
    verificationGaps,
  };
}
