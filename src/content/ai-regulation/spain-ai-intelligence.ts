import { getEuropeCountryProfileBySlug } from "@/content/ai-regulation/europe-country-profiles";
import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";

export interface SpainAuthorityMapEntry {
  id: string;
  title: string;
  category:
    | "data_protection_authority"
    | "ai_supervision_body"
    | "draft_governance_instrument"
    | "market_surveillance_readiness"
    | "sectoral_guidance";
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

export interface SpainTimelineEntry {
  id: string;
  date: string;
  title: string;
  category:
    | "implementation"
    | "guidance"
    | "governance"
    | "case_law"
    | "administrative_decision";
  note: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface SpainVerificationGap {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  note: string;
}

export function getSpainAiIntelligenceSnapshot() {
  const spainProfile = getEuropeCountryProfileBySlug("spain");
  if (!spainProfile) {
    return {
      authorityMap: [] as SpainAuthorityMapEntry[],
      timeline: [] as SpainTimelineEntry[],
      verifiedDecisions: [],
      verificationGaps: [] as SpainVerificationGap[],
    };
  }

  const findRef = (matcher: (url: string) => boolean) =>
    spainProfile.sourceReferences.find((reference) => matcher(reference.url)) ?? null;

  const aepdGuidance = findRef((url) => url.includes("/la-agencia-publica-unas-orientaciones-sobre-inteligencia"));
  const aepdProhibitedSystems = findRef((url) => url.includes("/la-aepd-recuerda-que-ya-puede-actuar-ante-sistemas-de-ia"));
  const aepdActionPlan = findRef((url) => url.includes("/agencia-publica-su-plan-actuacion-2026"));
  const aepdImageRisks = findRef((url) => url.includes("/la-aepd-alerta-sobre-los-riesgos-visibles-e-invisibles-del"));
  const aesiaStatute = findRef((url) => url.includes("/eli/es/rd/2023/08/22/729"));
  const aesiaDirector = findRef((url) => url.includes("/boe/dias/2026/01/07/pdfs/BOE-A-2026-389.pdf"));
  const governanceBill = findRef((url) => url.includes("/20260526-referencia-rueda-de-prensa-ministros"));

  const authorityMap: SpainAuthorityMapEntry[] = [
    aepdProhibitedSystems
      ? {
          id: "spain-aepd-market-readiness",
          title: "AEPD readiness for prohibited-AI supervision affecting personal data",
          category: "market_surveillance_readiness",
          statusLabel: "preparing_or_partial",
          note:
            "The AEPD states that Spain had not yet completed the national AI law at that point, but the authority could already act where prohibited-AI uses affected personal-data protection. This is an official competence signal, not a final AI Act market-surveillance designation.",
          sourceLabel: aepdProhibitedSystems.title,
          sourceUrl: aepdProhibitedSystems.url,
          publicationDate: aepdProhibitedSystems.publicationDate ?? null,
        }
      : null,
    aesiaStatute
      ? {
          id: "spain-aesia-body",
          title: "AESIA as a verified Spanish AI supervision body",
          category: "ai_supervision_body",
          statusLabel: "officially_supported",
          note:
            "Spain has a verified statutory basis for AESIA through the BOE publication of Royal Decree 729/2023. This confirms AESIA as an official institution, while the final full AI Act authority map remains under review.",
          sourceLabel: aesiaStatute.title,
          sourceUrl: aesiaStatute.url,
          publicationDate: aesiaStatute.publicationDate ?? null,
        }
      : null,
    governanceBill
      ? {
          id: "spain-draft-governance-law",
          title: "Draft Spanish AI governance law",
          category: "draft_governance_instrument",
          statusLabel: "direct_instrument_under_review",
          note:
            "The Council of Ministers reference of 26 May 2026 is the strongest current official draft-law milestone in the Spain baseline, but it remains a draft-stage implementation signal rather than final promulgated authority mapping.",
          sourceLabel: governanceBill.title,
          sourceUrl: governanceBill.url,
          publicationDate: governanceBill.publicationDate ?? null,
        }
      : null,
    aepdGuidance
      ? {
          id: "spain-aepd-agentic-guidance",
          title: "AEPD agentic AI guidance",
          category: "sectoral_guidance",
          statusLabel: "officially_supported",
          note:
            "The AEPD's 18 February 2026 agentic-AI publication strengthens Spain's official live-guidance layer and shows ongoing AI compliance activity from the Spanish data-protection authority.",
          sourceLabel: aepdGuidance.title,
          sourceUrl: aepdGuidance.url,
          publicationDate: aepdGuidance.publicationDate ?? null,
        }
      : null,
    aepdActionPlan
      ? {
          id: "spain-aepd-governance-plan",
          title: "AEPD 2026 action-plan AI governance workstream",
          category: "data_protection_authority",
          statusLabel: "officially_supported",
          note:
            "The AEPD action plan for 2026 confirms ongoing AI-related workstreams, institutional capacity building, and governance activity, strengthening the Spanish official monitoring baseline.",
          sourceLabel: aepdActionPlan.title,
          sourceUrl: aepdActionPlan.url,
          publicationDate: aepdActionPlan.publicationDate ?? null,
        }
      : null,
  ].filter(Boolean) as SpainAuthorityMapEntry[];

  const timeline: SpainTimelineEntry[] = [
    aesiaStatute
      ? {
          id: "es-aesia-statute-2023",
          date: "2023-09-02",
          title: "BOE published the AESIA statute",
          category: "implementation",
          note:
            "Official legal basis for AESIA as a Spanish AI-supervision institution, used here as foundational governance infrastructure rather than proof of a complete AI Act authority map.",
          sourceLabel: aesiaStatute.title,
          sourceUrl: aesiaStatute.url,
        }
      : null,
    aepdProhibitedSystems
      ? {
          id: "es-aepd-prohibited-ai-2025",
          date: "2025-07-15",
          title: "AEPD clarified it could already act on prohibited-AI uses affecting personal data",
          category: "implementation",
          note:
            "Official AEPD competence signal on prohibited AI systems and personal-data protection while Spain's broader national AI law remained pending.",
          sourceLabel: aepdProhibitedSystems.title,
          sourceUrl: aepdProhibitedSystems.url,
        }
      : null,
    aesiaDirector
      ? {
          id: "es-aesia-director-2026",
          date: "2026-01-07",
          title: "BOE recorded the appointment of the AESIA director",
          category: "governance",
          note:
            "Official BOE milestone strengthening the institutional-operational layer of AESIA in the Spanish baseline.",
          sourceLabel: aesiaDirector.title,
          sourceUrl: aesiaDirector.url,
        }
      : null,
    aepdImageRisks
      ? {
          id: "es-aepd-image-risks-2026",
          date: "2026-01-13",
          title: "AEPD warned about AI image risks involving third-party data",
          category: "guidance",
          note:
            "Official AEPD publication on visible and less visible risks linked to using third-party images in AI systems.",
          sourceLabel: aepdImageRisks.title,
          sourceUrl: aepdImageRisks.url,
        }
      : null,
    aepdGuidance
      ? {
          id: "es-aepd-agentic-ai-2026",
          date: "2026-02-18",
          title: "AEPD published agentic AI guidance",
          category: "guidance",
          note:
            "Official AEPD guidance relevant to AI governance, data protection, and operational compliance in Spain.",
          sourceLabel: aepdGuidance.title,
          sourceUrl: aepdGuidance.url,
        }
      : null,
    aepdActionPlan
      ? {
          id: "es-aepd-action-plan-2026",
          date: "2026-03-25",
          title: "AEPD published its 2026 action plan",
          category: "governance",
          note:
            "Official institutional milestone confirming active 2026 AI-related workstreams and governance capacity-building.",
          sourceLabel: aepdActionPlan.title,
          sourceUrl: aepdActionPlan.url,
        }
      : null,
    governanceBill
      ? {
          id: "es-governance-bill-2026",
          date: "2026-05-26",
          title: "Council of Ministers approved the draft organic law on AI governance",
          category: "implementation",
          note:
            "Strongest current official draft-law implementation milestone in the Spain layer, but still not treated as final promulgated AI Act implementation architecture.",
          sourceLabel: governanceBill.title,
          sourceUrl: governanceBill.url,
        }
      : null,
  ].filter(Boolean) as SpainTimelineEntry[];

  const verifiedDecisions = europeAiCaseLawEntries.filter((entry) => entry.country === "Spain");

  const verificationGaps: SpainVerificationGap[] = [
    {
      id: "es-final-authority-map",
      title: "Final AI Act authority map still needs article-level verification",
      severity: "high",
      note:
        "Spain now has a stronger official baseline, but the full final designation of competent, market-surveillance, and notifying authorities is still not completely pinned article by article.",
    },
    {
      id: "es-hard-law-promulgation",
      title: "Draft-law milestone is strong, but final promulgation still needs confirmation",
      severity: "high",
      note:
        "The 26 May 2026 Council of Ministers reference is a strong draft-law signal, but it should not be treated as final enacted implementation architecture until promulgated text and pinpoints are verified.",
    },
    {
      id: "es-decision-layer",
      title: "Spain decision layer is now real but still narrow",
      severity: "medium",
      note:
        "The current Spain decision layer relies on official AEPD legal-criteria pages and still needs broader resolution-level and court-level expansion before it can be described as a substantial jurisprudence database.",
    },
    {
      id: "es-runtime-parsers",
      title: "Spain official feeds still need richer runtime parser coverage",
      severity: "medium",
      note:
        "AEPD, AESIA, BOE, and La Moncloa are now anchored in the Spain monitoring architecture, but dedicated extraction strategies should still be deepened for more exhaustive recurring capture.",
    },
  ];

  return {
    authorityMap,
    timeline: timeline.sort((a, b) => b.date.localeCompare(a.date)),
    verifiedDecisions,
    verificationGaps,
  };
}
