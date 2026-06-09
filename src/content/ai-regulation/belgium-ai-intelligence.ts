import { getEuropeCountryProfileBySlug } from "@/content/ai-regulation/europe-country-profiles";
import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";

export interface BelgiumAuthorityMapEntry {
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

export interface BelgiumTimelineEntry {
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

export interface BelgiumVerificationGap {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  note: string;
}

export function getBelgiumAiIntelligenceSnapshot() {
  const belgiumProfile = getEuropeCountryProfileBySlug("belgium");
  if (!belgiumProfile) {
    return {
      authorityMap: [] as BelgiumAuthorityMapEntry[],
      timeline: [] as BelgiumTimelineEntry[],
      verifiedDecisions: [],
      verificationGaps: [] as BelgiumVerificationGap[],
    };
  }

  const findRef = (matcher: (url: string) => boolean) =>
    belgiumProfile.sourceReferences.find((reference) => matcher(reference.url)) ?? null;

  const apdRef = findRef(
    (url) =>
      url.includes("dataprotectionauthority.be") ||
      url.includes("gegevensbeschermingsautoriteit.be") ||
      url.includes("autoriteprotectiondonnees.be"),
  );
  const digitalBelgiumRef = findRef((url) => url.includes("digitalbelgium.be"));
  const ai4BelgiumRef = findRef((url) => url.includes("ai4belgium.be"));

  const authorityMap: BelgiumAuthorityMapEntry[] = [
    apdRef
      ? {
          id: "belgium-apd-ai",
          title:
            "Autorité de protection des données / Gegevensbeschermingsautoriteit — AI and algorithmic oversight",
          category: "data_protection_authority",
          statusLabel: "officially_supported",
          note:
            "The APD/GBA is the official Belgian data-protection authority and an EDPB member. It has published guidance on algorithmic decision-making, facial recognition, and profiling. The APD/GBA is a relevant supervisory authority for AI Act compliance in Belgium for AI systems involving personal data, but the final AI Act national competent authority map for Belgium has not been verified from a binding designation instrument.",
          sourceLabel: apdRef.title,
          sourceUrl: apdRef.url,
          publicationDate: apdRef.publicationDate ?? null,
        }
      : null,
    digitalBelgiumRef
      ? {
          id: "belgium-digital-belgium",
          title: "Digital Belgium — federal digital and AI policy",
          category: "government_implementation",
          statusLabel: "preparing_or_partial",
          note:
            "Digital Belgium is the federal government's digital transformation programme. It provides the policy framework relevant to Belgium's approach to AI, including alignment with EU AI Act implementation. Specific authority-designation instruments under the AI Act remain under review.",
          sourceLabel: digitalBelgiumRef.title,
          sourceUrl: digitalBelgiumRef.url,
          publicationDate: digitalBelgiumRef.publicationDate ?? null,
        }
      : null,
    ai4BelgiumRef
      ? {
          id: "belgium-ai4belgium",
          title: "AI4Belgium — government AI coordination",
          category: "soft_law_guidance",
          statusLabel: "preparing_or_partial",
          note:
            "AI4Belgium is the Belgian government's AI coordination initiative, which has produced strategic recommendations for public and private sector AI adoption. It is a policy-level coordination body, not a supervisory authority under the AI Act.",
          sourceLabel: ai4BelgiumRef.title,
          sourceUrl: ai4BelgiumRef.url,
          publicationDate: ai4BelgiumRef.publicationDate ?? null,
        }
      : null,
  ].filter(Boolean) as BelgiumAuthorityMapEntry[];

  const timeline: BelgiumTimelineEntry[] = [
    apdRef
      ? {
          id: "be-apd-ai-guidance",
          date: "2024-01-01",
          title: "APD/GBA active on AI and algorithmic oversight under GDPR framework",
          category: "guidance",
          note:
            "The APD/GBA has maintained an official AI and algorithms guidance page and has been engaged with EDPB positions on AI. This reflects ongoing institutional readiness for AI Act supervision in Belgium. The APD's AI-related guidance predates the AI Act's entry into force and forms part of Belgium's data-protection supervisory baseline.",
          sourceLabel: apdRef.title,
          sourceUrl: apdRef.url,
        }
      : null,
  ].filter(Boolean) as BelgiumTimelineEntry[];

  const verifiedDecisions = europeAiCaseLawEntries.filter(
    (entry) => entry.country === "Belgium",
  );

  const verificationGaps: BelgiumVerificationGap[] = [
    {
      id: "be-authority-designation",
      title: "Final AI Act national competent authority not yet conclusively verified",
      severity: "high",
      note:
        "The APD/GBA is a likely AI Act supervisory authority for AI systems involving personal data, but Belgium's final national competent authority map and market-surveillance authority designation under the AI Act have not been verified from a binding instrument in this profile.",
    },
    {
      id: "be-federal-structure",
      title: "Belgium's federal structure complicates national AI governance mapping",
      severity: "high",
      note:
        "Belgium has a complex federal structure (federal government, three regions — Flemish, Walloon, Brussels-Capital — and three language communities). AI Act supervision may involve multiple levels of government. The current profile covers only the federal tier and has not mapped regional-level AI governance.",
    },
    {
      id: "be-implementation-instruments",
      title: "No binding national AI Act implementation instrument verified",
      severity: "high",
      note:
        "No Belgian national legislative or regulatory instrument specifically implementing the EU AI Act has been reviewed into this baseline. The current implementation-in-progress label reflects institutional readiness and EU-wide applicability rather than a verified enacted measure.",
    },
    {
      id: "be-case-law-layer",
      title: "Belgium AI decision layer not yet populated",
      severity: "medium",
      note:
        "No Belgian AI-specific enforcement decision, court ruling, or APD/GBA sanction related to AI has been reviewed into the public baseline in this phase.",
    },
    {
      id: "be-parser-depth",
      title: "Belgium official feeds require deeper parser coverage",
      severity: "medium",
      note:
        "APD/GBA, Digital Belgium, and AI4Belgium are registered as monitoring anchors, but deeper extraction and recurring capture have not yet been validated against live feed responses.",
    },
  ];

  return {
    authorityMap,
    timeline: timeline.sort((a, b) => b.date.localeCompare(a.date)),
    verifiedDecisions,
    verificationGaps,
  };
}
