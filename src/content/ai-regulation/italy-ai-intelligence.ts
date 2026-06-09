import { getEuropeCountryProfileBySlug } from "@/content/ai-regulation/europe-country-profiles";
import { europeAiCaseLawEntries } from "@/content/ai-regulation/europe-ai-case-law";

export interface ItalyAuthorityMapEntry {
  id: string;
  title: string;
  category:
    | "data_protection_authority"
    | "digital_governance_body"
    | "national_legal_designation"
    | "government_strategy"
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

export interface ItalyTimelineEntry {
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

export interface ItalyVerificationGap {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  note: string;
}

export function getItalyAiIntelligenceSnapshot() {
  const italyProfile = getEuropeCountryProfileBySlug("italy");
  if (!italyProfile) {
    return {
      authorityMap: [] as ItalyAuthorityMapEntry[],
      timeline: [] as ItalyTimelineEntry[],
      verifiedDecisions: [],
      verificationGaps: [] as ItalyVerificationGap[],
    };
  }

  const findRef = (matcher: (url: string) => boolean) =>
    italyProfile.sourceReferences.find((reference) => matcher(reference.url)) ?? null;

  const law132 = findRef((url) => url.includes("/eli/id/2025/09/25/25G00143/CONSOLIDATED"));
  const garanteAi = findRef((url) => url.includes("garanteprivacy.it/temi/intelligenza-artificiale"));
  const agidConsultation = findRef((url) =>
    url.includes("/linee-guida-su-ia-nella-pa-al-la-consultazione-pubblica-su-sviluppo-e-procurement"),
  );
  const dtdLaw = findRef((url) =>
    url.includes("/approvata-in-via-definitiva-la-legge-italiana-sull-intelligenza-artificiale"),
  );
  const dtdStrategy = findRef((url) =>
    url.includes("/strategia-italiana-per-l-intelligenza-artificiale-2024-2026"),
  );

  const authorityMap: ItalyAuthorityMapEntry[] = [
    law132
      ? {
          id: "italy-law-132-designation",
          title: "Italian AI law baseline and national authority-designation architecture",
          category: "national_legal_designation",
          statusLabel: "direct_instrument_under_review",
          note:
            "Law No. 132 is a verified official baseline instrument for Italy. It supports a stronger national-implementation posture, but the project still treats the final full article-by-article authority map as under review.",
          sourceLabel: law132.title,
          sourceUrl: law132.url,
          publicationDate: law132.publicationDate ?? null,
        }
      : null,
    garanteAi
      ? {
          id: "italy-garante-ai",
          title: "Garante AI guidance and supervisory posture",
          category: "data_protection_authority",
          statusLabel: "officially_supported",
          note:
            "The Garante AI topic page provides an official supervisory and guidance layer for Italian AI and data-protection issues. It is relevant to enforcement and compliance posture, but it is not itself a binding legal designation instrument.",
          sourceLabel: garanteAi.title,
          sourceUrl: garanteAi.url,
          publicationDate: garanteAi.publicationDate ?? null,
        }
      : null,
    agidConsultation
      ? {
          id: "italy-agid-guidelines",
          title: "AgID AI-in-public-administration guideline track",
          category: "soft_law_guidance",
          statusLabel: "preparing_or_partial",
          note:
            "AgID's 2026 consultation on AI development and procurement guidelines for the public administration strengthens the official Italian soft-law and implementation layer, while remaining distinct from binding legislation.",
          sourceLabel: agidConsultation.title,
          sourceUrl: agidConsultation.url,
          publicationDate: agidConsultation.publicationDate ?? null,
        }
      : null,
    dtdStrategy
      ? {
          id: "italy-dtd-strategy",
          title: "Digital Transformation Department AI strategy coordination",
          category: "government_strategy",
          statusLabel: "officially_supported",
          note:
            "The Italian AI strategy page supports the national governance and planning layer. It is an official strategy source rather than a binding authority-designation instrument.",
          sourceLabel: dtdStrategy.title,
          sourceUrl: dtdStrategy.url,
          publicationDate: dtdStrategy.publicationDate ?? null,
        }
      : null,
  ].filter(Boolean) as ItalyAuthorityMapEntry[];

  const timeline: ItalyTimelineEntry[] = [
    dtdStrategy
      ? {
          id: "it-strategy-2024",
          date: "2024-07-22",
          title: "Italy published the national AI strategy 2024-2026",
          category: "governance",
          note:
            "Official strategy milestone anchoring Italy's governance and policy direction around AI before the later national AI law and implementation materials.",
          sourceLabel: dtdStrategy.title,
          sourceUrl: dtdStrategy.url,
        }
      : null,
    dtdLaw
      ? {
          id: "it-law-approval-2025",
          date: "2025-09-25",
          title: "Italy's AI law entered the public official baseline",
          category: "implementation",
          note:
            "The official government and Normattiva layer together support a stronger national implementation posture, while final authority mapping remains under review.",
          sourceLabel: dtdLaw.title,
          sourceUrl: dtdLaw.url,
        }
      : null,
    agidConsultation
      ? {
          id: "it-agid-guidelines-2026",
          date: "2026-03-12",
          title: "AgID opened consultation on AI development and procurement guidelines for the public administration",
          category: "guidance",
          note:
            "Official consultation milestone for AI implementation guidance in the public administration, relevant to Italy's live soft-law and operational-governance posture.",
          sourceLabel: agidConsultation.title,
          sourceUrl: agidConsultation.url,
        }
      : null,
    {
      id: "it-garante-workplace-2026",
      date: "2026-05-28",
      title: "Garante warned over AI emotion-analysis in workplace messaging tools",
      category: "administrative_decision",
      note:
        "Official Garante press communication describing a warning to an Italian startup about AI-based analysis of worker stress in workplace communications.",
      sourceLabel: "Garante AI and work press release",
      sourceUrl: "https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10255522",
    },
    {
      id: "it-garante-school-2026",
      date: "2026-06-03",
      title: "Garante requested information on generative AI use in schools",
      category: "administrative_decision",
      note:
        "Official Garante press communication on a request for information concerning the use of generative AI in educational settings and associated data-protection safeguards.",
      sourceLabel: "Garante AI in schools press release",
      sourceUrl: "https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/10257612",
    },
  ].filter(Boolean) as ItalyTimelineEntry[];

  const verifiedDecisions = europeAiCaseLawEntries.filter((entry) => entry.country === "Italy");

  const verificationGaps: ItalyVerificationGap[] = [
    {
      id: "it-authority-map",
      title: "Final article-level authority map still needs deeper legal pinning",
      severity: "high",
      note:
        "Italy has a stronger national-law baseline, but the project still needs a deeper article-level pass before describing the full AI Act authority architecture as conclusively mapped.",
    },
    {
      id: "it-decision-layer",
      title: "Italy decision layer is now real but still regulator-heavy",
      severity: "medium",
      note:
        "The first public Italy decision layer is anchored in official Garante actions and communications. Broader court-level AI jurisprudence still needs a dedicated pass.",
    },
    {
      id: "it-parser-depth",
      title: "Italy official feeds still need richer parser depth",
      severity: "medium",
      note:
        "Normattiva, Garante, AgID, and Digital Transformation Department sources are now wired, but deeper extraction should still be built before claiming comprehensive recurring capture.",
    },
  ];

  return {
    authorityMap,
    timeline: timeline.sort((a, b) => b.date.localeCompare(a.date)),
    verifiedDecisions,
    verificationGaps,
  };
}
