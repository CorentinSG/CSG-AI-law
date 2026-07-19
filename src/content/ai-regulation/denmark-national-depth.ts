import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";

export type DenmarkNationalDepthEntry = {
  country: Jurisdiction;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publicationDate: string | null;
  developmentType: DevelopmentType;
  legalArea: LegalArea;
  authorityType: AuthorityType;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  practicalImpact: string;
  tags: string[];
  sourceReference: SourceReference;
};

function officialReference(input: {
  title: string;
  institution: string;
  url: string;
  sourceType: SourceReference["sourceType"];
  authorityType: AuthorityType;
  publicationDate: string | null;
  documentType: DevelopmentType;
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
}): SourceReference {
  const persistedSourceType =
    input.sourceType === "court" ||
    input.sourceType === "regulator" ||
    input.sourceType === "standards_body" ||
    input.sourceType === "discovery_source" ||
    input.sourceType === "media_source" ||
    input.sourceType === "tracker"
      ? input.sourceType
      : "official";

  return {
    sourceRole: "primary",
    title: input.title,
    institution: input.institution,
    url: input.url,
    canonicalUrl: input.url,
    sourceType: persistedSourceType,
    authorityType: input.authorityType,
    publicationDate: input.publicationDate,
    detectedAt: "2026-07-19T03:45:00.000Z",
    retrievedAt: "2026-07-19T03:45:00.000Z",
    lastVerifiedAt: "2026-07-19T03:45:00.000Z",
    jurisdiction: "Denmark",
    documentType: input.documentType,
    excerpt: input.excerpt,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes:
      "Country-by-country Denmark national-depth entry. Official source verified manually; keep national follow-up monitoring separate from the EU baseline layer.",
  };
}

function entry(input: Omit<DenmarkNationalDepthEntry, "country" | "tags" | "sourceReference"> & {
  sourceType: SourceReference["sourceType"];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
  tags: string[];
}): DenmarkNationalDepthEntry {
  const tags = ["denmark-national-depth", "official-source", "country-depth-entry", ...input.tags];
  return {
    country: "Denmark",
    title: input.title,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    publicationDate: input.publicationDate,
    developmentType: input.developmentType,
    legalArea: input.legalArea,
    authorityType: input.authorityType,
    summary: input.summary,
    whatHappened: input.whatHappened,
    whyItMatters: input.whyItMatters,
    practicalImpact: input.practicalImpact,
    tags,
    sourceReference: officialReference({
      title: input.title,
      institution: input.sourceName,
      url: input.sourceUrl,
      sourceType: input.sourceType,
      authorityType: input.authorityType,
      publicationDate: input.publicationDate,
      documentType: input.developmentType,
      excerpt: input.excerpt,
      pinpoint: input.pinpoint,
    }),
  };
}

export const denmarkNationalDepthEntries = [
  entry({
    title: "Denmark appointed the Agency for Digital Government as national AI Act competent authority",
    sourceName: "Danish Agency for Digital Government",
    sourceUrl:
      "https://en.digst.dk/news/news-archive/2024/maj/the-agency-for-digital-government-publishes-ai-guides/",
    sourceType: "government",
    publicationDate: "2024-05-03",
    developmentType: "Government announcement",
    legalArea: "AI governance",
    authorityType: "Governance framework",
    summary:
      "Denmark's Agency for Digital Government states that it has been appointed national competent authority for the EU AI Act and coordinates with Danish supervisory authorities, other Member States and the European Commission.",
    whatHappened:
      "The agency published generative-AI guides for citizens, companies and authorities and described its AI Act role, including coordination and cooperation with the European AI Office.",
    whyItMatters:
      "This is Denmark's clearest official national AI Act governance anchor while sectoral supervisory assignments and binding implementation details continue to mature.",
    practicalImpact:
      "Danish AI providers, deployers and advisers should treat the agency as the national AI Act coordination watchpoint and track subsequent designations, sandbox output and guidance.",
    excerpt:
      "The agency says it was appointed national competent authority for the EU AI Act and will coordinate with competent supervisory authorities in Denmark.",
    tags: ["ai-act", "competent-authority", "digst", "generative-ai-guides"],
  }),
  entry({
    title: "Denmark's AI strategies page records the national responsible-AI policy baseline",
    sourceName: "Danish Agency for Digital Government",
    sourceUrl:
      "https://en.digst.dk/digital-governance/new-technologies/danish-strategies-for-artificial-intelligence/",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Denmark's official AI strategies page frames responsible AI through the national digitalisation strategy, strategic AI approach, AI taskforce, research-based advice, Danish language models and open Danish data.",
    whatHappened:
      "The agency describes a broad parliamentary consensus to accelerate AI in a balanced and responsible manner with people and democratic values at the centre.",
    whyItMatters:
      "This is Denmark's national policy baseline for connecting AI Act implementation with public-sector AI rollout, Danish-language model infrastructure, data access and responsible innovation.",
    practicalImpact:
      "Country monitoring should map Danish AI Act guidance, public-sector deployments, language-model initiatives and data-opening measures back to this strategic framework.",
    excerpt:
      "The page describes strategic AI initiatives on public-sector rollout, responsible-use advice, Danish language models and open Danish data.",
    tags: ["ai-strategy", "responsible-ai", "digitalisation", "public-sector-ai"],
  }),
  entry({
    title: "Datatilsynet AI guidance requires public authorities to build GDPR analysis into AI projects",
    sourceName: "Danish Data Protection Agency (Datatilsynet)",
    sourceUrl:
      "https://www.datatilsynet.dk/Media/638321084132236143/Offentlige%20myndigheders%20brug%20af%20kunstig%20intelligens%20-%20Inden%20I%20g%C3%A5r%20i%20gang.pdf",
    sourceType: "regulator",
    publicationDate: "2023-10-01",
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "Datatilsynet's public-authority AI guidance explains that data-protection rules apply regardless of technology and should be integrated before, during and after AI development.",
    whatHappened:
      "The guidance walks authorities through purpose, proportionality, dataset reuse, legal bases, special categories, transparency, DPIAs, profiling and automated decisions for AI systems processing personal data.",
    whyItMatters:
      "This gives Denmark a national regulator layer for AI projects that process personal data, especially in public administration and welfare-service contexts.",
    practicalImpact:
      "Danish authorities and vendors should run GDPR legal-basis, proportionality, data-minimisation, DPIA, transparency and human-review analysis alongside AI Act classification.",
    excerpt:
      "Datatilsynet says data-protection rules apply regardless of technology and must be handled as an integrated part of the AI project lifecycle.",
    pinpoint: { section: "Offentlige myndigheders brug af kunstig intelligens, October 2023" },
    tags: ["datatilsynet", "gdpr", "public-sector-ai", "dpia"],
  }),
  entry({
    title: "Denmark's cloud-services guide anchors public-sector cloud and infrastructure governance",
    sourceName: "Danish Agency for Digital Government",
    sourceUrl: "https://en.digst.dk/digital-governance/new-technologies/guide-on-the-use-of-cloud-services/",
    sourceType: "government",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Cloud and infrastructure",
    authorityType: "Agency guidance",
    summary:
      "Denmark's Agency for Digital Government publishes cloud-services guidance for Danish authorities covering acquisition decisions, legal questions, international transfers and security standards.",
    whatHappened:
      "The guide is positioned as practical support for organisations considering cloud services and addresses technology models, legal concerns and information-security considerations.",
    whyItMatters:
      "AI deployment depends on cloud, compute and data infrastructure; this guide is Denmark's national public-sector cloud governance anchor for AI and data-driven services.",
    practicalImpact:
      "Public authorities and suppliers should assess cloud procurement, transfer-risk, information-security, contractual and architecture choices before deploying AI workloads.",
    excerpt:
      "The agency says the guide covers cloud models, legal questions such as third-country transfers and information-security standards.",
    tags: ["cloud", "infrastructure", "public-sector", "security", "transfers"],
  }),
  entry({
    title: "Denmark's Copyright Act sections 11b and 11c implement DSM text-and-data-mining rules",
    sourceName: "Retsinformation / Danish Ministry of Culture",
    sourceUrl: "https://retsinformation.dk/eli/lta/2023/1093",
    sourceType: "legislation",
    publicationDate: "2023-08-20",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Denmark's consolidated Copyright Act includes sections 11b and 11c on text and data mining, relevant to AI training and generative-AI copyright analysis.",
    whatHappened:
      "Retsinformation records general text-and-data-mining access for lawfully accessible works subject to rights reservations, and a scientific-research TDM rule for research organisations and cultural-heritage institutions.",
    whyItMatters:
      "Danish generative-AI training and rights-reservation questions must be assessed under national TDM provisions as well as the EU DSM Directive and AI Act GPAI copyright duties.",
    practicalImpact:
      "Model developers, research organisations and rights holders should check lawful access, opt-out reservations, storage limits, research status and database-right interactions under Danish law.",
    excerpt:
      "The Copyright Act defines text and data mining and permits extraction and copies for TDM under statutory conditions.",
    pinpoint: { section: "Ophavsretsloven sections 11b-11c" },
    tags: ["copyright", "text-and-data-mining", "generative-ai", "dsm-directive"],
  }),
  entry({
    title: "Datatilsynet employment guidance constrains workplace monitoring and digital control",
    sourceName: "Danish Data Protection Agency (Datatilsynet)",
    sourceUrl:
      "https://www.datatilsynet.dk/regler-og-vejledning/databeskyttelse-i-forbindelse-med-ansaettelsesforhold",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Labor and social law",
    authorityType: "Agency guidance",
    summary:
      "Datatilsynet's employment data-protection guidance explains that workplace control measures such as website logging, email review and GPS tracking must comply with data-protection rules.",
    whatHappened:
      "The authority describes employer monitoring as employee personal-data processing and links workplace control to GDPR principles and Danish labour-control expectations.",
    whyItMatters:
      "This is Denmark's national labour-adjacent compliance layer for AI-enabled workforce analytics, productivity monitoring, location tracking and algorithmic management.",
    practicalImpact:
      "Employers should document the business purpose, proportionality, transparency, retention, access controls, employee involvement and DPIA needs before using AI monitoring or scoring tools.",
    excerpt:
      "Datatilsynet says workplace control measures often process employee personal data and must be carried out in accordance with data-protection rules.",
    pinpoint: { section: "Overvågning på arbejdspladsen" },
    tags: ["workplace-monitoring", "employment", "algorithmic-management", "gdpr"],
  }),
  entry({
    title: "Datatilsynet AI guidance maps profiling and automated decisions for public-sector AI",
    sourceName: "Danish Data Protection Agency (Datatilsynet)",
    sourceUrl:
      "https://www.datatilsynet.dk/Media/638321084132236143/Offentlige%20myndigheders%20brug%20af%20kunstig%20intelligens%20-%20Inden%20I%20g%C3%A5r%20i%20gang.pdf",
    sourceType: "regulator",
    publicationDate: "2023-10-01",
    developmentType: "Agency guidance",
    legalArea: "Automated decision-making",
    authorityType: "Agency guidance",
    summary:
      "Datatilsynet's AI guidance includes dedicated sections on profiling and automated decisions, translating GDPR Article 22 issues into Danish public-authority AI project design.",
    whatHappened:
      "The guidance asks authorities to identify whether an AI solution profiles individuals or makes automated decisions and to assess this during project scoping and design.",
    whyItMatters:
      "This is Denmark's practical national guidance layer for automated welfare, benefits, enforcement, credit-like, employment and other AI-supported decisions.",
    practicalImpact:
      "Controllers should document whether decisions are solely automated, what legal effects or significant impacts may arise, where human intervention sits and how data subjects can receive meaningful explanations and contest outcomes.",
    excerpt:
      "The guidance contains a dedicated section on profiling and automated decisions in the scoping and design phase for public-authority AI projects.",
    pinpoint: { section: "Section 3.6 Profilering og automatiske afgørelser" },
    tags: ["automated-decision-making", "article-22", "profiling", "human-intervention"],
  }),
] as const satisfies readonly DenmarkNationalDepthEntry[];
