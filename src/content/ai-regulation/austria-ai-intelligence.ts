import { getEuropeCountryProfileBySlug } from "@/content/ai-regulation/europe-country-profiles";
import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";

export interface AustriaAuthorityMapEntry {
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

export interface AustriaTimelineEntry {
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

export interface AustriaVerificationGap {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  note: string;
}

export function getAustriaAiIntelligenceSnapshot() {
  const austriaProfile = getEuropeCountryProfileBySlug("austria");
  if (!austriaProfile) {
    return {
      authorityMap: [] as AustriaAuthorityMapEntry[],
      timeline: [] as AustriaTimelineEntry[],
      verifiedDecisions: [],
      verificationGaps: [] as AustriaVerificationGap[],
    };
  }

  const findRef = (matcher: (url: string) => boolean) =>
    austriaProfile.sourceReferences.find((reference) => matcher(reference.url)) ?? null;

  const dsbRef = findRef((url) => url.includes("dsb.gv.at"));
  const digitalAustriaRef = findRef(
    (url) => url.includes("digital.gv.at") || url.includes("bmdw.gv.at"),
  );
  const rtrRef = findRef((url) => url.includes("rtr.at"));

  const authorityMap: AustriaAuthorityMapEntry[] = [
    dsbRef
      ? {
          id: "austria-dsb-ai",
          title:
            "Datenschutzbehörde (DSB) — AI and data-protection oversight authority",
          category: "data_protection_authority",
          statusLabel: "officially_supported",
          note:
            "The DSB is the official Austrian data-protection authority, an EDPB member, and one of the most active DPAs in Europe on AI and algorithmic decision-making. The DSB has a well-established AI-related enforcement and guidance track record under GDPR, including on automated decision-making and profiling. It is a relevant supervisory authority for AI Act compliance in Austria for AI systems involving personal data. Austria is closely associated with NOYB (Max Schrems' NGO), which regularly files AI and data-processing complaints with the DSB. The final AI Act national competent authority map for Austria has not been verified from a binding designation instrument.",
          sourceLabel: dsbRef.title,
          sourceUrl: dsbRef.url,
          publicationDate: dsbRef.publicationDate ?? null,
        }
      : null,
    digitalAustriaRef
      ? {
          id: "austria-digital-austria",
          title: "Digital Austria — federal AI strategy and digital transformation",
          category: "government_implementation",
          statusLabel: "preparing_or_partial",
          note:
            "Digital Austria is the federal government's digital transformation programme and coordinates Austria's national AI strategy. It provides the policy framework relevant to Austria's approach to AI Act implementation. Specific authority-designation instruments under the AI Act and any national legislative implementation acts remain under review in this profile.",
          sourceLabel: digitalAustriaRef.title,
          sourceUrl: digitalAustriaRef.url,
          publicationDate: digitalAustriaRef.publicationDate ?? null,
        }
      : null,
    rtrRef
      ? {
          id: "austria-rtr-ai",
          title:
            "RTR (Rundfunk und Telekom Regulierungs-GmbH) — media and communications regulator",
          category: "supervision_authority",
          statusLabel: "needs_full_verification",
          note:
            "RTR is Austria's media and telecommunications regulatory authority. It has a growing role in AI governance to the extent AI intersects with broadcasting, algorithmic content curation, and digital communications. RTR's precise role under the EU AI Act — including whether it serves as a national market-surveillance authority for any AI Act category — has not been verified from a binding instrument in this profile.",
          sourceLabel: rtrRef.title,
          sourceUrl: rtrRef.url,
          publicationDate: rtrRef.publicationDate ?? null,
        }
      : null,
  ].filter(Boolean) as AustriaAuthorityMapEntry[];

  const timeline: AustriaTimelineEntry[] = [
    dsbRef
      ? {
          id: "at-dsb-ai-enforcement",
          date: "2023-01-01",
          title: "DSB active on AI and algorithmic processing under GDPR framework",
          category: "guidance",
          note:
            "The DSB has maintained an active posture on AI-related GDPR enforcement and has received numerous complaints from NOYB on AI and data-processing matters. This sustained enforcement activity forms part of Austria's AI supervisory baseline and is directly relevant to AI Act compliance for AI systems processing personal data in Austria. The DSB's activity predates the AI Act's entry into force.",
          sourceLabel: dsbRef.title,
          sourceUrl: dsbRef.url,
        }
      : null,
    digitalAustriaRef
      ? {
          id: "at-national-ai-strategy",
          date: "2021-01-01",
          title: "Austrian national AI strategy — government coordination",
          category: "implementation",
          note:
            "Austria published a national AI strategy coordinated under the federal government's digital agenda. The strategy outlines Austria's approach to AI governance, trustworthy AI adoption, and public-sector AI deployment. It predates the EU AI Act and its status as an active AI Act implementation instrument has not been verified.",
          sourceLabel: digitalAustriaRef.title,
          sourceUrl: digitalAustriaRef.url,
        }
      : null,
  ].filter(Boolean) as AustriaTimelineEntry[];

  const verifiedDecisions = europeAiCaseLawEntries.filter(
    (entry) => entry.country === "Austria",
  );

  const verificationGaps: AustriaVerificationGap[] = [
    {
      id: "at-authority-designation",
      title: "Final AI Act national competent authority not yet conclusively verified",
      severity: "high",
      note:
        "The DSB is a likely AI Act supervisory authority for AI systems involving personal data, but Austria's final national competent authority map and market-surveillance authority designation under the AI Act have not been verified from a binding instrument in this profile.",
    },
    {
      id: "at-implementation-instruments",
      title: "No binding national AI Act implementation instrument verified",
      severity: "high",
      note:
        "No Austrian national legislative or regulatory instrument specifically implementing the EU AI Act has been reviewed into this baseline. The current implementation-in-progress label reflects institutional readiness and EU-wide applicability rather than a verified enacted measure.",
    },
    {
      id: "at-rtr-role",
      title: "RTR role under AI Act not yet mapped",
      severity: "medium",
      note:
        "RTR's role as a potential national market-surveillance or notifying authority under the EU AI Act — particularly for AI in media and communications — has not been verified from a binding instrument. RTR is registered as a monitoring anchor, but its AI Act jurisdiction remains under review.",
    },
    {
      id: "at-case-law-layer",
      title: "Austria AI decision layer not yet populated",
      severity: "medium",
      note:
        "No Austrian AI-specific enforcement decision, court ruling, or DSB sanction specifically related to AI Act provisions has been reviewed into the public baseline in this phase. GDPR-era DSB AI decisions exist but have not been individually verified into this profile.",
    },
    {
      id: "at-parser-depth",
      title: "Austria official feeds require deeper parser coverage",
      severity: "medium",
      note:
        "DSB, Digital Austria, and RTR are registered as monitoring anchors, but deeper extraction and recurring capture have not yet been validated against live feed responses.",
    },
  ];

  return {
    authorityMap,
    timeline: timeline.sort((a, b) => b.date.localeCompare(a.date)),
    verifiedDecisions,
    verificationGaps,
  };
}
