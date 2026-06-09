import type { SourceReference } from "@/agents/ai-regulation/citations";

export type EuTimelineStatus =
  | "proposal"
  | "political_agreement"
  | "adopted"
  | "in_force"
  | "upcoming"
  | "guidance"
  | "implementation";

export interface EuTimelineEntry {
  id: string;
  title: string;
  date: string;
  description: string;
  institution: string;
  sourceUrl: string;
  status: EuTimelineStatus;
  confidence: "high" | "medium" | "low";
  legalEffect: string;
  authorityType: string;
  lastVerifiedAt: string;
  sourceReferences: SourceReference[];
}

const verifiedAt = "2026-05-27T00:00:00.000Z";

function timelineSource(input: {
  title: string;
  institution: string;
  url: string;
  publicationDate?: string | null;
  authorityType: string;
}): SourceReference {
  return {
    sourceRole: "primary",
    title: input.title,
    institution: input.institution,
    url: input.url,
    canonicalUrl: input.url,
    sourceType: "official",
    authorityType: input.authorityType,
    publicationDate: input.publicationDate ?? null,
    detectedAt: verifiedAt,
    retrievedAt: verifiedAt,
    lastVerifiedAt: verifiedAt,
    jurisdiction: "European Union",
    documentType: input.authorityType,
    excerpt: null,
    pinpoint: null,
    reliabilityLevel: "high",
    verificationStatus: "verified",
    archivedUrl: null,
    accessLimitations: null,
    notes: "Official source supporting this exact timeline milestone.",
  };
}

export const euAiTimelineEntries: EuTimelineEntry[] = [
  {
    id: "eu-ai-proposal-2021",
    title: "Commission proposal for the AI Act",
    date: "2021-04-21",
    description:
      "The European Commission published its proposal for a Regulation laying down harmonised rules on artificial intelligence.",
    institution: "European Commission",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/library/proposal-regulation-laying-down-harmonised-rules-artificial-intelligence",
    status: "proposal",
    confidence: "high",
    legalEffect: "Commission legislative proposal stage.",
    authorityType: "European Commission proposal",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title:
          "Proposal for a Regulation laying down harmonised rules on artificial intelligence",
        institution: "European Commission",
        url: "https://digital-strategy.ec.europa.eu/en/library/proposal-regulation-laying-down-harmonised-rules-artificial-intelligence",
        publicationDate: "2021-04-21",
        authorityType: "Legislative proposal",
      }),
    ],
  },
  {
    id: "eu-ai-political-agreement-2023",
    title: "Political agreement reached",
    date: "2023-12-11",
    description:
      "The Commission announced the political agreement reached between the European Parliament and the Council on the AI Act.",
    institution: "European Commission",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/news/commission-welcomes-political-agreement-artificial-intelligence-act",
    status: "political_agreement",
    confidence: "high",
    legalEffect: "Political agreement milestone before formal adoption.",
    authorityType: "European Commission news release",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title:
          "Commission welcomes political agreement on Artificial Intelligence Act",
        institution: "European Commission",
        url: "https://digital-strategy.ec.europa.eu/en/news/commission-welcomes-political-agreement-artificial-intelligence-act",
        publicationDate: "2023-12-11",
        authorityType: "Political agreement announcement",
      }),
    ],
  },
  {
    id: "eu-ai-office-established-2024",
    title: "European AI Office established",
    date: "2024-05-29",
    description:
      "The Commission unveiled the AI Office within the Commission to support implementation and supervision under the AI Act.",
    institution: "European Commission",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/news/commission-establishes-ai-office-strengthen-eu-leadership-safe-and-trustworthy-artificial",
    status: "implementation",
    confidence: "high",
    legalEffect: "EU-level institutional implementation milestone.",
    authorityType: "European Commission news release",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title:
          "Commission establishes AI Office to strengthen EU leadership in safe and trustworthy artificial intelligence",
        institution: "European Commission",
        url: "https://digital-strategy.ec.europa.eu/en/news/commission-establishes-ai-office-strengthen-eu-leadership-safe-and-trustworthy-artificial",
        publicationDate: "2024-05-29",
        authorityType: "Governance implementation announcement",
      }),
    ],
  },
  {
    id: "eu-ai-act-adopted-2024",
    title: "AI Act adopted",
    date: "2024-06-13",
    description:
      "Regulation (EU) 2024/1689 was adopted by the European Parliament and the Council on 13 June 2024.",
    institution: "European Parliament and Council",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
    status: "adopted",
    confidence: "high",
    legalEffect: "Formal adoption of Regulation (EU) 2024/1689.",
    authorityType: "EU Regulation",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title:
          "Regulation (EU) 2024/1689 of the European Parliament and of the Council",
        institution: "EUR-Lex / Official Journal of the European Union",
        url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
        publicationDate: "2024-07-12",
        authorityType: "EU Regulation",
      }),
    ],
  },
  {
    id: "eu-ai-act-oj-2024",
    title: "Published in the Official Journal",
    date: "2024-07-12",
    description:
      "The AI Act was published in the Official Journal of the European Union as Regulation (EU) 2024/1689.",
    institution: "EUR-Lex / Official Journal",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
    status: "adopted",
    confidence: "high",
    legalEffect: "Official Journal publication milestone.",
    authorityType: "Official Journal publication",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title:
          "Regulation (EU) 2024/1689 of the European Parliament and of the Council",
        institution: "EUR-Lex / Official Journal of the European Union",
        url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
        publicationDate: "2024-07-12",
        authorityType: "Official Journal publication",
      }),
    ],
  },
  {
    id: "eu-ai-act-entry-into-force-2024",
    title: "Entry into force",
    date: "2024-08-01",
    description:
      "The European Commission confirmed that the AI Act entered into force on 1 August 2024.",
    institution: "European Commission",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/news/european-artificial-intelligence-act-comes-force",
    status: "in_force",
    confidence: "high",
    legalEffect: "Entry into force of the AI Act.",
    authorityType: "European Commission implementation announcement",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title: "European Artificial Intelligence Act comes into force",
        institution: "European Commission",
        url: "https://digital-strategy.ec.europa.eu/en/news/european-artificial-intelligence-act-comes-force",
        publicationDate: "2024-08-01",
        authorityType: "Entry into force announcement",
      }),
    ],
  },
  {
    id: "eu-ai-prohibited-practices-2025",
    title: "Prohibited practices and AI literacy rules apply",
    date: "2025-02-02",
    description:
      "The Commission’s AI Act policy page states that prohibited AI practices and AI literacy obligations started applying from 2 February 2025.",
    institution: "European Commission",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    status: "implementation",
    confidence: "high",
    legalEffect:
      "Application milestone for prohibited practices and AI literacy obligations according to official Commission materials.",
    authorityType: "European Commission policy page",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title: "AI Act",
        institution: "European Commission, Digital Strategy",
        url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
        authorityType: "Implementation timeline policy page",
      }),
    ],
  },
  {
    id: "eu-ai-gpai-code-2025",
    title: "General-Purpose AI Code of Practice published",
    date: "2025-07-10",
    description:
      "The official GPAI Code of Practice page states that the code was published on 10 July 2025 as a voluntary tool supporting compliance.",
    institution: "European Commission / AI Office",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/news/general-purpose-ai-code-practice-now-available",
    status: "guidance",
    confidence: "high",
    legalEffect:
      "Implementation-supporting GPAI Code availability milestone; not treated as standalone binding law in this baseline.",
    authorityType: "European Commission implementation material",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title: "General-Purpose AI Code of Practice now available",
        institution: "European Commission",
        url: "https://digital-strategy.ec.europa.eu/en/news/general-purpose-ai-code-practice-now-available",
        publicationDate: "2025-07-10",
        authorityType: "Implementation guidance",
      }),
    ],
  },
  {
    id: "eu-ai-gpai-guidelines-2025",
    title: "Commission publishes GPAI provider guidelines",
    date: "2025-07-18",
    description:
      "The Commission published guidelines for providers of general-purpose AI models ahead of the next AI Act application milestone.",
    institution: "European Commission",
    sourceUrl:
      "https://digital-strategy.ec.europa.eu/en/news/commission-publishes-guidelines-providers-general-purpose-ai-models",
    status: "guidance",
    confidence: "high",
    legalEffect: "Commission guidance milestone for GPAI providers.",
    authorityType: "European Commission guidance",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title:
          "Commission publishes guidelines for providers of general-purpose AI models",
        institution: "European Commission",
        url: "https://digital-strategy.ec.europa.eu/en/news/commission-publishes-guidelines-providers-general-purpose-ai-models",
        publicationDate: "2025-07-18",
        authorityType: "Guidance publication",
      }),
    ],
  },
  {
    id: "eu-ai-gpai-obligations-2025",
    title: "GPAI obligations and governance rules apply",
    date: "2025-08-02",
    description:
      "The Commission’s AI Act policy page states that governance rules and obligations for GPAI models became applicable from 2 August 2025.",
    institution: "European Commission",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    status: "implementation",
    confidence: "high",
    legalEffect:
      "Application milestone for governance rules and GPAI model obligations according to official Commission materials.",
    authorityType: "European Commission policy page",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title: "AI Act",
        institution: "European Commission, Digital Strategy",
        url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
        authorityType: "Implementation timeline policy page",
      }),
    ],
  },
  {
    id: "eu-ai-full-application-2026",
    title: "General application date",
    date: "2026-08-02",
    description:
      "The Commission’s AI Act policy page states that the AI Act will be fully applicable from 2 August 2026, subject to listed exceptions.",
    institution: "European Commission",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    status: "upcoming",
    confidence: "high",
    legalEffect:
      "General application date according to official Commission materials, subject to listed exceptions.",
    authorityType: "European Commission policy page",
    lastVerifiedAt: verifiedAt,
    sourceReferences: [
      timelineSource({
        title: "AI Act",
        institution: "European Commission, Digital Strategy",
        url: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
        authorityType: "Implementation timeline policy page",
      }),
    ],
  },
];

export function getUpcomingEuTimelineEntries() {
  return euAiTimelineEntries.filter((entry) => entry.status === "upcoming");
}
