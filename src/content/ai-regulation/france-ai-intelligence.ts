import { getEuropeCountryProfileBySlug } from "@/content/ai-regulation/europe-country-profiles";
import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";

export interface FranceAuthorityMapEntry {
  id: string;
  title: string;
  category:
    | "fundamental_rights_authority"
    | "market_surveillance"
    | "notifying_authority"
    | "national_coordination"
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

export interface FranceTimelineEntry {
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

export interface FranceVerificationGap {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  note: string;
}

export function getFranceAiIntelligenceSnapshot() {
  const franceProfile = getEuropeCountryProfileBySlug("france");
  if (!franceProfile) {
    return {
      authorityMap: [] as FranceAuthorityMapEntry[],
      timeline: [] as FranceTimelineEntry[],
      verifiedDecisions: [],
      verificationGaps: [] as FranceVerificationGap[],
    };
  }

  const findRef = (matcher: (url: string) => boolean) =>
    franceProfile.sourceReferences.find((reference) => matcher(reference.url)) ?? null;

  const annualReport = findRef((url) => url.includes("/rapport-annuel-2025"));
  const workProgramme = findRef((url) =>
    url.includes("/accompagnement-des-professionnels-le-programme-de-travail-de-la-cnil-pour-2026"),
  );
  const adaptationBill = findRef((url) => url.includes("pjl_ecom2524721l_cm_10.11.2025.pdf"));
  const senate442 = findRef((url) => url.includes("/Amdt_442.html"));
  const senate444 = findRef((url) => url.includes("/Amdt_444.html"));
  const healthGuidance = findRef((url) =>
    url.includes("/ia-et-sante-developper-et-evaluer-des-systemes-ia-conformes"),
  );

  const authorityMap: FranceAuthorityMapEntry[] = [
    annualReport
      ? {
          id: "cnil-fundamental-rights",
          title: "CNIL as AI Act fundamental-rights authority",
          category: "fundamental_rights_authority",
          statusLabel: "officially_supported",
          note:
            "The CNIL annual report states that CNIL was designated in 2025 as an authority for protection of fundamental rights under the AI Act.",
          sourceLabel: annualReport.title,
          sourceUrl: annualReport.url,
          publicationDate: annualReport.publicationDate ?? null,
        }
      : null,
    workProgramme
      ? {
          id: "cnil-market-surveillance",
          title: "CNIL market-surveillance role",
          category: "market_surveillance",
          statusLabel: "preparing_or_partial",
          note:
            "The CNIL 2026 work programme says CNIL is preparing to be designated as market-surveillance authority, but the final designation map still needs fuller pinpointing.",
          sourceLabel: workProgramme.title,
          sourceUrl: workProgramme.url,
          publicationDate: workProgramme.publicationDate ?? null,
        }
      : null,
    senate444
      ? {
          id: "france-notifying-authority",
          title: "French notifying-authority and coordination framework",
          category: "notifying_authority",
          statusLabel: "direct_instrument_under_review",
          note:
            "Senate amendment no. 444 provides direct parliamentary-stage coordination and notifying-authority architecture, but it is not yet treated as the final promulgated map.",
          sourceLabel: senate444.title,
          sourceUrl: senate444.url,
          publicationDate: senate444.publicationDate ?? null,
        }
      : null,
    adaptationBill
      ? {
          id: "france-national-coordination",
          title: "National AI Act adaptation bill structure",
          category: "national_coordination",
          statusLabel: "direct_instrument_under_review",
          note:
            "The 10 November 2025 government adaptation bill introduces a dedicated French AI Act title at draft stage and is part of the direct implementation baseline.",
          sourceLabel: adaptationBill.title,
          sourceUrl: adaptationBill.url,
          publicationDate: adaptationBill.publicationDate ?? null,
        }
      : null,
    healthGuidance
      ? {
          id: "france-health-guidance",
          title: "Healthcare AI sectoral guidance",
          category: "sectoral_guidance",
          statusLabel: "officially_supported",
          note:
            "France now has current official CNIL healthcare guidance for development and evaluation of AI systems, which strengthens the sectoral live-governance layer.",
          sourceLabel: healthGuidance.title,
          sourceUrl: healthGuidance.url,
          publicationDate: healthGuidance.publicationDate ?? null,
        }
      : null,
  ].filter(Boolean) as FranceAuthorityMapEntry[];

  const timeline: FranceTimelineEntry[] = [
    adaptationBill
      ? {
          id: "fr-adaptation-bill-2025",
          date: "2025-11-10",
          title: "Government adaptation bill introduced a French AI Act title",
          category: "implementation",
          note:
            "Direct official adaptation instrument at bill stage, used here as implementation architecture rather than final designation proof.",
          sourceLabel: adaptationBill.title,
          sourceUrl: adaptationBill.url,
        }
      : null,
    {
      id: "fr-ce-charter-2025",
      date: "2025-12-11",
      title: "Conseil d'Etat published its internal AI charter",
      category: "governance",
      note:
        "Official judicial-governance milestone for AI use inside the administrative judiciary.",
      sourceLabel: "Conseil d'Etat charter on use of artificial intelligence within the administrative courts",
      sourceUrl:
        "https://www.conseil-etat.fr/site/qui-sommes-nous/deontologie/charte-d-utilisation-de-l-intelligence-artificielle-au-sein-de-la-juridiction-administrative",
    },
    {
      id: "fr-ce-506370-2026",
      date: "2026-01-30",
      title: "Conseil d'Etat decision no. 506370 entered the verified France layer",
      category: "case_law",
      note:
        "Official ArianeWeb decision page linked to algorithmic video analysis around schools in Nice.",
      sourceLabel: "ArianeWeb decision no. 506370",
      sourceUrl: "https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2026-01-30/506370",
    },
    senate442
      ? {
          id: "fr-senate-442-2026",
          date: "2026-02-12",
          title: "Senate amendment no. 442 addressed CNIL AI Act powers",
          category: "implementation",
          note:
            "Direct parliamentary-stage milestone on CNIL authority powers and complaint-handling framework under the AI Act.",
          sourceLabel: senate442.title,
          sourceUrl: senate442.url,
        }
      : null,
    senate444
      ? {
          id: "fr-senate-444-2026",
          date: "2026-02-12",
          title: "Senate amendment no. 444 addressed coordination and notifying authorities",
          category: "implementation",
          note:
            "Direct parliamentary-stage milestone on French AI Act governance coordination and notifying-authority arrangements.",
          sourceLabel: senate444.title,
          sourceUrl: senate444.url,
        }
      : null,
    healthGuidance
      ? {
          id: "fr-cnil-health-guidance-2026",
          date: "2026-03-05",
          title: "CNIL published healthcare AI compliance guidance",
          category: "guidance",
          note:
            "Official CNIL sectoral guidance on developing and evaluating AI systems in healthcare.",
          sourceLabel: healthGuidance.title,
          sourceUrl: healthGuidance.url,
        }
      : null,
    workProgramme
      ? {
          id: "fr-cnil-work-programme-2026",
          date: "2026-04-07",
          title: "CNIL 2026 work programme flagged AI Act market-surveillance preparation",
          category: "guidance",
          note:
            "Current official CNIL programme page used to track authority-readiness and incoming workstreams.",
          sourceLabel: workProgramme.title,
          sourceUrl: workProgramme.url,
        }
      : null,
    annualReport
      ? {
          id: "fr-cnil-annual-report-2026",
          date: "2026-05-18",
          title: "CNIL annual report confirmed the fundamental-rights authority designation baseline",
          category: "implementation",
          note:
            "Current strongest official institutional source for CNIL's AI Act fundamental-rights role.",
          sourceLabel: annualReport.title,
          sourceUrl: annualReport.url,
        }
      : null,
  ].filter(Boolean) as FranceTimelineEntry[];

  const verifiedDecisions = europeAiCaseLawEntries.filter((entry) => entry.country === "France");

  const verificationGaps: FranceVerificationGap[] = [
    {
      id: "fr-final-authority-map",
      title: "Final promulgated authority map still needs tighter pinpointing",
      severity: "high",
      note:
        "The direct-source baseline is much stronger, but the final promulgated French AI Act authority architecture is still not fully pinned article by article.",
    },
    {
      id: "fr-market-surveillance-map",
      title: "Market-surveillance and notifying-authority map remains incomplete",
      severity: "high",
      note:
        "The repository has direct CNIL and Senate-stage signals, but not yet a complete final official map of every surveillance and notifying authority.",
    },
    {
      id: "fr-case-law-coverage",
      title: "France decision layer is broader, but still non-exhaustive",
      severity: "medium",
      note:
        "Verified France decisions and CNIL acts are now present, but this should still not be described as a full French AI jurisprudence database.",
    },
    {
      id: "fr-runtime-access",
      title: "Some official runtime access paths remain brittle",
      severity: "medium",
      note:
        "Legifrance may still hit Cloudflare, and Cour de cassation / Defenseur des droits need richer extraction coverage on top of current targeted-page parsing.",
    },
  ];

  return {
    authorityMap,
    timeline: timeline.sort((a, b) => b.date.localeCompare(a.date)),
    verifiedDecisions,
    verificationGaps,
  };
}
