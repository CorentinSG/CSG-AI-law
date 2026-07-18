import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { AuthorityType, DevelopmentType, Jurisdiction, LegalArea } from "@/db/schema";

export type AustriaNationalDepthEntry = {
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
    detectedAt: "2026-07-18T23:00:00.000Z",
    retrievedAt: "2026-07-18T23:00:00.000Z",
    lastVerifiedAt: "2026-07-18T23:00:00.000Z",
    jurisdiction: "Austria",
    documentType: input.documentType,
    excerpt: input.excerpt,
    pinpoint: input.pinpoint ?? null,
    reliabilityLevel: "high",
    verificationStatus: "verified_official_source",
    notes:
      "Country-by-country Austria national-depth entry. Official source verified manually; keep national follow-up monitoring separate from the EU baseline layer.",
  };
}

function entry(input: Omit<AustriaNationalDepthEntry, "country" | "tags" | "sourceReference"> & {
  sourceType: SourceReference["sourceType"];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
  tags: string[];
}): AustriaNationalDepthEntry {
  const tags = ["austria-national-depth", "official-source", "country-depth-entry", ...input.tags];
  return {
    country: "Austria",
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

export const austriaNationalDepthEntries = [
  entry({
    title: "Austria operates the RTR AI Service Desk for AI Act implementation support",
    sourceName: "Rundfunk und Telekom Regulierungs-GmbH (RTR)",
    sourceUrl: "https://www.rtr.at/rtr/service/ki-servicestelle/KI-Servicestelle.en.html",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "AI governance",
    authorityType: "Agency guidance",
    summary:
      "RTR runs Austria's AI Service Desk as a public point of contact and information hub supporting preparation for and implementation of the EU AI Act.",
    whatHappened:
      "RTR's service desk publishes AI Act guidance, timelines, FAQ material, actor obligations, risk levels, sanctions, transparency obligations, and companion legislation references.",
    whyItMatters:
      "This is Austria's main operational information layer for AI Act implementation before all national competent-authority designations are fully settled.",
    practicalImpact:
      "Austrian providers, deployers and advisers should use RTR guidance as a national implementation watchpoint while separately tracking binding authority designations and enforcement acts.",
    excerpt:
      "RTR describes the AI Service Desk as a public contact and information hub that supports implementation of the European AI Act.",
    tags: ["ai-act", "service-desk", "rtr", "implementation-watch"],
  }),
  entry({
    title: "AIM AT 2030 and the 2024 implementation plan frame Austria's AI governance strategy",
    sourceName: "Digital Austria",
    sourceUrl: "https://www.digitalaustria.gv.at/verwaltung/strategien/ki-aim-at-2030.html",
    sourceType: "government",
    publicationDate: "2024-11-01",
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "Austria's AI strategy and implementation plan set the national policy framework for trustworthy AI, AI literacy, public-sector modernisation and competitiveness.",
    whatHappened:
      "Digital Austria reports that AIM AT 2030 is an agile national strategy and that the 2024 implementation plan concretises new short- and medium-term measures.",
    whyItMatters:
      "The strategy is not binding law, but it is the national policy baseline against which future AI Act implementation, public-sector AI and funding measures should be tracked.",
    practicalImpact:
      "Country monitoring should map Austrian strategy measures to later legislation, authority mandates, public-sector AI deployments, AI literacy programmes and funding instruments.",
    excerpt:
      "Digital Austria lists the strategy's goals around common-good AI, research and innovation, and Austrian competitiveness, plus a 2024 implementation plan.",
    tags: ["ai-strategy", "aim-at-2030", "policy-framework", "public-sector-ai"],
  }),
  entry({
    title: "Austrian DSB explains that GDPR remains parallel to the AI Act for personal-data AI systems",
    sourceName: "Austrian Data Protection Authority (DSB)",
    sourceUrl: "https://dsb.gv.at/kuenstlichebrintelligenz/kuenstliche-intelligenz-datenschutz",
    sourceType: "regulator",
    publicationDate: null,
    developmentType: "Agency guidance",
    legalArea: "Data protection",
    authorityType: "Agency guidance",
    summary:
      "The Austrian DSB states that GDPR and the Austrian Data Protection Act remain applicable whenever AI systems process personal data.",
    whatHappened:
      "DSB's AI and data-protection page explains the relationship between the EU AI Act and GDPR and identifies data-protection issues as remaining within DSB competence.",
    whyItMatters:
      "This gives Austria a national GDPR/AI guidance layer for model training, deployment, automated decisions and controller/processor compliance.",
    practicalImpact:
      "Austrian AI projects should run GDPR legal-basis, transparency, DPIA, data-subject-rights and processor/controller analyses in parallel with AI Act classification.",
    excerpt:
      "DSB states that where personal data is processed, the GDPR and Austrian Data Protection Act apply and the DSB remains competent for data-protection questions.",
    tags: ["data-protection", "gdpr", "dsb", "agency-guidance"],
  }),
  entry({
    title: "Austrian Copyright Act section 42h provides the national text-and-data-mining layer",
    sourceName: "Austrian Legal Information System (RIS)",
    sourceUrl:
      "https://ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Anlage=&Artikel=&FassungVom=2026-01-19&Gesetzesnummer=10001848&Paragraf=42h&Uebergangsrecht=",
    sourceType: "legislation",
    publicationDate: "2022-01-01",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Section 42h of Austria's Copyright Act is the national text-and-data-mining provision relevant to AI training and generative-AI copyright analysis.",
    whatHappened:
      "RIS records section 42h on text and data mining, including authorised reproductions of lawfully accessible works for automated analysis in research and cultural-heritage contexts.",
    whyItMatters:
      "Generative-AI training and rights-reservation questions in Austria must be assessed against the Austrian TDM provision as well as the EU DSM Directive and AI Act GPAI copyright duties.",
    practicalImpact:
      "AI model developers and rights holders should check lawful access, research/non-commercial limits, deletion/retention rules, opt-outs and the interaction with EU GPAI transparency obligations.",
    excerpt:
      "RIS identifies Copyright Act section 42h as the Austrian provision on text and data mining with an entry into force date of 1 January 2022.",
    pinpoint: { section: "UrhG § 42h" },
    tags: ["copyright", "text-and-data-mining", "generative-ai", "ris"],
  }),
  entry({
    title: "Austria's Data Strategy establishes the national data-infrastructure layer for AI and cloud",
    sourceName: "Austrian Federal Chancellery",
    sourceUrl:
      "https://www.bundeskanzleramt.gv.at/dam/jcr%3A9ac58135-0ad6-44ad-bcd8-55965b0f2110/Digitale-Dekade_2025_EN-final.pdf",
    sourceType: "government",
    publicationDate: "2025-01-01",
    developmentType: "Policy report",
    legalArea: "Cloud and infrastructure",
    authorityType: "Policy report",
    summary:
      "Austria's Digital Decade roadmap records the national Data Strategy as a framework for data infrastructure, responsible data use and data culture.",
    whatHappened:
      "The roadmap says Austria published its Data Strategy in October 2024 to improve framework conditions for the data economy and support sustainable data infrastructures.",
    whyItMatters:
      "AI deployment relies on cloud, compute and data infrastructure; this gives Austria a national infrastructure and data-governance layer to connect with the EU Data Act.",
    practicalImpact:
      "Monitoring should track Austrian data-space, cloud, interoperability, public-sector data and AI infrastructure measures, including any binding implementation or procurement rules.",
    excerpt:
      "The Digital Decade roadmap describes three Data Strategy objectives: developing data infrastructure, promoting responsible data use and establishing an innovative data culture.",
    tags: ["data-strategy", "cloud", "infrastructure", "digital-decade"],
  }),
  entry({
    title: "Austrian BVwG held that the AMS AMAS labour-market algorithm did not violate GDPR",
    sourceName: "Austrian Federal Administrative Court (BVwG)",
    sourceUrl:
      "https://www.bvwg.gv.at/Aktuelles/Publikationen-des-BVwG/Ausgew-hlte-Entscheidungen-des-Bundesverwaltungsgerichts/AMS-Algorithmus--verst--t-nicht-gegen-DSGVO.html",
    sourceType: "court",
    publicationDate: "2025-09-01",
    developmentType: "Other official regulatory development",
    legalArea: "Labor and social law",
    authorityType: "Binding law",
    summary:
      "Austria's Federal Administrative Court found that the AMS labour-market opportunities assistance system did not violate GDPR under the court's assessment of human final decision-making.",
    whatHappened:
      "After the Supreme Administrative Court required reassessment, the BVwG concluded that AMS counsellors retained substantive final decision-making and could depart from the AMAS score.",
    whyItMatters:
      "AMAS is one of Europe's most important public-employment algorithm cases and directly links AI, labour administration, profiling and GDPR Article 22.",
    practicalImpact:
      "Austrian public bodies and employers using algorithmic support should document meaningful human discretion, appeal routes, training, safeguards and evidence that staff do not rubber-stamp algorithmic outputs.",
    excerpt:
      "BVwG states that AMAS was not used alone for assessments and that AMS advisers retained substantive final decision-making.",
    pinpoint: { caseNumber: "W256 2235360-1" },
    tags: ["case-law", "amas", "algorithmic-management", "public-employment", "article-22"],
  }),
  entry({
    title: "CJEU Dun & Bradstreet Austria clarifies explanation duties for automated credit scoring",
    sourceName: "Court of Justice of the European Union",
    sourceUrl: "https://curia.europa.eu/juris/document/document.jsf?docid=295841&doclang=en",
    sourceType: "court",
    publicationDate: "2025-02-27",
    developmentType: "Other official regulatory development",
    legalArea: "Automated decision-making",
    authorityType: "Binding law",
    summary:
      "The CJEU's Dun & Bradstreet Austria judgment clarifies GDPR access and explanation duties for automated credit scoring and profiling.",
    whatHappened:
      "The Court answered questions from the Vienna Administrative Court on meaningful information about the logic involved in automated decision-making and the handling of trade-secret constraints.",
    whyItMatters:
      "This Austrian reference complements SCHUFA and gives Austria a central automated-decision precedent for credit, telecom, employment and other scoring systems.",
    practicalImpact:
      "Controllers using automated scoring should prepare intelligible decision-level explanations, input-data logic, challenge pathways and trade-secret handling procedures.",
    excerpt:
      "The judgment concerns GDPR Article 15(1)(h), automated decision-making, profiling, scoring and access to meaningful information about the logic involved.",
    pinpoint: { caseNumber: "C-203/22", ECLI: "EU:C:2025:117" },
    tags: ["case-law", "automated-decision-making", "credit-scoring", "article-15", "article-22"],
  }),
] as const satisfies readonly AustriaNationalDepthEntry[];
