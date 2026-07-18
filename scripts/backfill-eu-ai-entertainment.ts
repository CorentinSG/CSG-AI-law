import { createHash } from "node:crypto";

import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import type { SourceReference } from "@/agents/ai-regulation/citations";
import type { RawRegulatoryItemInput, RegulatoryUpdateDraftInput } from "@/db/repository-types";
import type { AuthorityType, DevelopmentType, LegalArea } from "@/db/schema";
import { env } from "@/lib/env";

const SOURCE_ID = "eu-ai-entertainment-official-baseline";
const SOURCE_NAME = "EU AI and entertainment legal baseline";
const SOURCE_URL = "https://csg-ai-law.vercel.app/ai-regulation?view=database";
const DETECTED_AT = "2026-07-18T17:15:00.000Z";
const BACKFILL_TAG = "eu-ai-entertainment";

type EntertainmentEntry = {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceReference["sourceType"];
  sourceRole?: SourceReference["sourceRole"];
  publicationDate: string;
  developmentType: DevelopmentType;
  legalArea: LegalArea;
  authorityType: AuthorityType;
  summary: string;
  whatHappened: string;
  whyItMatters: string;
  practicalImpact: string;
  tags: string[];
  excerpt: string;
  pinpoint?: SourceReference["pinpoint"];
};

const entries: EntertainmentEntry[] = [
  {
    id: "eu-ai-act-gpai-copyright-policy-2024",
    title: "EU AI Act requires GPAI providers to maintain an EU copyright compliance policy",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
    sourceType: "legislation",
    publicationDate: "2024-07-12",
    developmentType: "Regulation",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Regulation (EU) 2024/1689 creates GPAI obligations that include putting in place a policy to comply with EU copyright and related-rights law.",
    whatHappened:
      "The EU AI Act was published with provisions linking GPAI compliance to copyright, training-data transparency, and the DSM Directive's text-and-data-mining framework.",
    whyItMatters:
      "This is the core EU hard-law bridge between generative AI model development and entertainment-sector rights holders.",
    practicalImpact:
      "Model providers serving the EU should document copyright compliance, identify rights reservations, and preserve evidence of policies governing training on creative works.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "gpai", "copyright", "training-data", "creative-industries"],
    excerpt:
      "The AI Act connects GPAI provider duties with Union copyright law and rightsholder reservations under the DSM Directive text-and-data-mining regime.",
    pinpoint: { CELEX: "32024R1689", article: "53", recital: "105-106" },
  },
  {
    id: "eu-ai-act-deepfake-entertainment-labeling-2024",
    title: "EU AI Act sets transparency duties for deepfakes and AI-generated entertainment content",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689",
    sourceType: "legislation",
    publicationDate: "2024-07-12",
    developmentType: "Regulation",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Article 50 of the AI Act requires disclosure for deepfakes and certain AI-generated or manipulated content, with a lighter rule for evidently artistic, creative, satirical, fictional, or analogous works.",
    whatHappened:
      "The AI Act introduced EU-level transparency obligations for providers and deployers of generative AI systems, including media-labelling rules relevant to film, music, games, advertising, and online entertainment.",
    whyItMatters:
      "Entertainment producers and distributors using synthetic media must distinguish legal creative uses from deceptive content and apply appropriate labelling.",
    practicalImpact:
      "Creative teams should track when Article 50 applies, especially for deepfake likenesses, AI-generated audiovisual content, AI-manipulated voice, and promotional content.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "deepfake", "synthetic-media", "article-50", "creative-works"],
    excerpt:
      "The AI Act defines deepfakes and requires deployers to disclose AI-generated or manipulated image, audio, or video content, subject to creative-work tailoring.",
    pinpoint: { CELEX: "32024R1689", article: "50", recital: "134" },
  },
  {
    id: "eu-dsm-directive-tdm-rights-reservation-2019",
    title: "DSM Copyright Directive creates EU text-and-data-mining rules and opt-out rights",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0790",
    sourceType: "legislation",
    publicationDate: "2019-05-17",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Directive (EU) 2019/790 provides text-and-data-mining exceptions for research and broader lawful-access mining, while allowing rightsholders to reserve rights outside the mandatory research exception.",
    whatHappened:
      "The DSM Directive established the copyright baseline later referenced by the AI Act for training on creative works, including music, audiovisual, images, text, and other entertainment content.",
    whyItMatters:
      "The opt-out architecture is central to disputes over whether AI companies can train models on copyrighted entertainment catalogues without licences.",
    practicalImpact:
      "Rights holders should maintain machine-readable rights reservations where relevant; AI providers should verify lawful access and opt-out compliance before training.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "text-and-data-mining", "rights-reservation", "copyright"],
    excerpt:
      "The DSM Directive permits certain reproductions and extractions for text and data mining, while preserving rightsholder reservations under specified conditions.",
    pinpoint: { CELEX: "32019L0790", article: "3-4" },
  },
  {
    id: "eu-dsm-article-17-online-content-sharing-2019",
    title: "DSM Article 17 sets liability and safeguard rules for online content-sharing platforms",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0790",
    sourceType: "legislation",
    publicationDate: "2019-05-17",
    developmentType: "Statute",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "Article 17 of the DSM Directive regulates use of protected content by online content-sharing service providers, shaping automated recognition and filtering obligations for entertainment platforms.",
    whatHappened:
      "The EU created a liability regime under which platforms that give public access to user-uploaded protected works must obtain authorisation or meet strict best-efforts and safeguard conditions.",
    whyItMatters:
      "This is the key EU copyright rule for UGC entertainment platforms using automated recognition systems around music, video, images, and audiovisual works.",
    practicalImpact:
      "Platforms should pair content-recognition systems with complaint, redress, exception, and lawful-use safeguards; rights holders should provide sufficiently precise notices and information.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "article-17", "upload-filtering", "ugc-platforms"],
    excerpt:
      "Article 17 provides that online content-sharing service providers perform acts of communication to the public when they give access to user-uploaded protected works.",
    pinpoint: { CELEX: "32019L0790", article: "17" },
  },
  {
    id: "cjeu-c401-19-article-17-upload-filtering-2022",
    title: "CJEU upholds DSM Article 17 with safeguards for automated upload filtering",
    sourceName: "Court of Justice of the European Union",
    sourceUrl: "https://curia.europa.eu/juris/liste.jsf?num=C-401/19",
    sourceType: "court",
    publicationDate: "2022-04-26",
    developmentType: "Other official regulatory development",
    legalArea: "Copyright and generative AI",
    authorityType: "Binding law",
    summary:
      "The Court of Justice dismissed Poland's challenge to Article 17, holding that prior automatic review/filtering obligations can be compatible with freedom of expression only with strict safeguards.",
    whatHappened:
      "The Grand Chamber assessed the copyright platform-liability regime and recognised that automated recognition and filtering tools may restrict lawful expression if safeguards are not respected.",
    whyItMatters:
      "The judgment is a central EU case for entertainment platforms, automated copyright enforcement, user-generated content, parody, remix, and lawful creative expression.",
    practicalImpact:
      "Platform compliance teams should treat automated recognition tools as legally sensitive and build exception, complaint, and human-redress safeguards around entertainment-content moderation.",
    tags: ["official-source", "case-law-layer", BACKFILL_TAG, "cjeu", "copyright", "automated-filtering", "article-17"],
    excerpt:
      "The CJEU linked upload filtering with freedom-of-expression safeguards and a fair balance between intellectual property and users' rights.",
    pinpoint: { caseNumber: "C-401/19", ECLI: "EU:C:2022:297" },
  },
  {
    id: "commission-guidance-dsm-article-17-2021",
    title: "Commission guidance explains Article 17 safeguards for copyright filtering on sharing platforms",
    sourceName: "European Commission",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52021DC0288",
    sourceType: "policy",
    publicationDate: "2021-06-04",
    developmentType: "Agency guidance",
    legalArea: "Copyright and generative AI",
    authorityType: "Agency guidance",
    summary:
      "Commission guidance on Article 17 explains implementation of copyright liability and safeguard duties for online content-sharing service providers.",
    whatHappened:
      "The Commission issued guidance after stakeholder dialogue on how Member States and platforms should apply Article 17 of the DSM Directive.",
    whyItMatters:
      "The guidance is an operational layer for automated copyright enforcement affecting entertainment platforms and user-generated creative content.",
    practicalImpact:
      "Platforms should map their upload-filtering workflows against the guidance, especially lawful-use exceptions, complaint handling, and overblocking controls.",
    tags: ["official-source", "guidance", BACKFILL_TAG, "article-17", "platform-liability", "copyright"],
    excerpt:
      "The guidance aims to support correct and coherent application of Article 17 across Member States and affected online content-sharing services.",
    pinpoint: { CELEX: "52021DC0288" },
  },
  {
    id: "eu-dsa-recommender-ad-transparency-entertainment-platforms-2022",
    title: "Digital Services Act regulates recommender and advertising transparency on entertainment platforms",
    sourceName: "EUR-Lex",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2065",
    sourceType: "legislation",
    publicationDate: "2022-10-27",
    developmentType: "Regulation",
    legalArea: "Consumer protection",
    authorityType: "Binding law",
    summary:
      "The DSA imposes transparency and risk-management duties for online platforms, including recommender-system parameters and advertising transparency relevant to music, video, social, gaming, and creator platforms.",
    whatHappened:
      "Regulation (EU) 2022/2065 established horizontal platform duties that interact with AI-driven entertainment distribution and personalised recommendation systems.",
    whyItMatters:
      "Entertainment discovery is often algorithmic; DSA duties affect how platforms explain, audit, and mitigate recommender and advertising risks.",
    practicalImpact:
      "Entertainment platforms should document recommender parameters, ad-targeting logic, systemic-risk assessments where applicable, and user-facing choice mechanisms.",
    tags: ["official-source", "binding-law", BACKFILL_TAG, "dsa", "recommender-systems", "platforms"],
    excerpt:
      "The DSA sets EU rules for online platforms, including transparency around recommender systems, advertisements, and systemic risks for very large online platforms.",
    pinpoint: { CELEX: "32022R2065" },
  },
  {
    id: "eu-gpai-code-practice-copyright-transparency-2025",
    title: "EU GPAI Code of Practice adds copyright and transparency measures for generative AI models",
    sourceName: "European Commission AI Office",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/contents-code-gpai",
    sourceType: "policy",
    publicationDate: "2025-07-10",
    developmentType: "Code of practice",
    legalArea: "Copyright and generative AI",
    authorityType: "Soft law",
    summary:
      "The General-Purpose AI Code of Practice provides voluntary measures for GPAI providers to demonstrate compliance with AI Act transparency, copyright, and safety obligations.",
    whatHappened:
      "The Commission published the final Code with separate Transparency, Copyright, and Safety and Security chapters, later confirmed as an adequate voluntary compliance tool.",
    whyItMatters:
      "The copyright chapter directly affects entertainment-sector training data, rights reservations, and documentation expectations for model providers.",
    practicalImpact:
      "GPAI providers can use the Code to structure copyright policies and transparency documentation; creative-sector rights holders should monitor signatories and implementation.",
    tags: ["official-source", "soft-law", BACKFILL_TAG, "gpai-code", "copyright", "transparency"],
    excerpt:
      "The Commission describes the Code as helping industry comply with AI Act obligations on safety, transparency, and copyright for GPAI models.",
  },
  {
    id: "eu-ai-generated-content-transparency-code-2026",
    title: "EU Code of Practice supports AI Act labelling rules for AI-generated content and deepfakes",
    sourceName: "European Commission AI Office",
    sourceUrl: "https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content",
    sourceType: "policy",
    publicationDate: "2026-01-01",
    developmentType: "Code of practice",
    legalArea: "Copyright and generative AI",
    authorityType: "Soft law",
    summary:
      "The AI-generated content transparency Code of Practice supports compliance with Article 50 AI Act marking, detection, and labelling duties.",
    whatHappened:
      "The AI Office set out a voluntary code for providers and deployers covering marking of AI-generated and manipulated content, deepfake labelling, and certain AI-generated text publications.",
    whyItMatters:
      "It is the practical EU soft-law layer for synthetic media used in entertainment, advertising, influencer content, games, film, and audiovisual production.",
    practicalImpact:
      "Creative and media businesses should track the code before Article 50 duties apply from 2 August 2026 and align workflows for visual labels, audio disclosures, and provenance notices.",
    tags: ["official-source", "soft-law", BACKFILL_TAG, "deepfake", "article-50", "synthetic-media"],
    excerpt:
      "The code supports compliance with AI Act transparency obligations related to marking and labelling AI-generated content.",
    pinpoint: { article: "50" },
  },
  {
    id: "euipo-genai-copyright-study-2025",
    title: "EUIPO publishes study on generative AI and copyright",
    sourceName: "EUIPO Observatory",
    sourceUrl: "https://www.euipo.europa.eu/en/publications/genai-from-a-copyright-perspective-2025",
    sourceType: "policy",
    publicationDate: "2025-05-12",
    developmentType: "Policy report",
    legalArea: "Copyright and generative AI",
    authorityType: "Policy report",
    summary:
      "EUIPO's 2025 study analyses how generative AI interacts with EU copyright law, including training, rights reservations, output, enforcement, and economic effects.",
    whatHappened:
      "EUIPO released an official Observatory study dedicated to GenAI from a copyright perspective.",
    whyItMatters:
      "It is a high-signal official EU research source for entertainment-sector copyright risk and policy development around model training and creative outputs.",
    practicalImpact:
      "The database should use this as an official policy-analysis anchor, while distinguishing it from binding law and court decisions.",
    tags: ["official-source", "policy-report", BACKFILL_TAG, "euipo", "genai", "copyright"],
    excerpt:
      "The EUIPO study covers technical, legal, and economic aspects of generative AI from the perspective of EU copyright law.",
  },
  {
    id: "ep-resolution-ai-education-culture-audiovisual-2021",
    title: "European Parliament resolution on AI in education, culture and the audiovisual sector",
    sourceName: "European Parliament",
    sourceUrl: "https://www.europarl.europa.eu/doceo/document/TA-9-2021-0238_EN.html",
    sourceType: "parliament",
    publicationDate: "2021-05-19",
    developmentType: "Policy report",
    legalArea: "Copyright and generative AI",
    authorityType: "Policy report",
    summary:
      "The European Parliament called for AI use in culture and audiovisual sectors to protect cultural diversity, creators, fundamental rights, and transparency.",
    whatHappened:
      "Parliament adopted an own-initiative resolution on AI in education, culture, and the audiovisual sector.",
    whyItMatters:
      "This is an early EU institutional baseline for AI governance in audiovisual and creative industries.",
    practicalImpact:
      "Policy monitoring should connect this resolution to later AI Act transparency rules, copyright training-data debates, and creative-sector support measures.",
    tags: ["official-source", "policy-report", BACKFILL_TAG, "audiovisual", "culture", "creative-industries"],
    excerpt:
      "The resolution addresses AI in education, culture, and the audiovisual sector and calls for safeguards around diversity, transparency, and rights.",
  },
  {
    id: "ep-resolution-copyright-generative-ai-2026",
    title: "European Parliament adopts resolution on copyright and generative AI",
    sourceName: "European Parliament",
    sourceUrl: "https://www.europarl.europa.eu/doceo/document/A-10-2026-0019_EN.html",
    sourceType: "parliament",
    publicationDate: "2026-03-10",
    developmentType: "Policy report",
    legalArea: "Copyright and generative AI",
    authorityType: "Policy report",
    summary:
      "Parliament's 2026 resolution on copyright and generative AI calls for stronger creator protections, training-data transparency, licensing mechanisms, and fair remuneration.",
    whatHappened:
      "The European Parliament adopted a non-binding resolution focused on generative AI's implications for copyright and creative sectors.",
    whyItMatters:
      "It is a major EU political signal for future copyright reform and enforcement around AI training on entertainment-sector works.",
    practicalImpact:
      "The site should track follow-up Commission initiatives, legislative proposals, AI Act enforcement practice, and rights-holder licensing frameworks.",
    tags: ["official-source", "policy-report", BACKFILL_TAG, "parliament-resolution", "copyright", "fair-remuneration"],
    excerpt:
      "The resolution addresses copyright and generative AI, including transparency, licensing, remuneration, and the continued importance of human authorship.",
  },
  {
    id: "commission-apply-ai-strategy-creative-sectors-2025",
    title: "Commission Apply AI Strategy flags copyright and creative-sector risks from generative AI",
    sourceName: "European Commission",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025DC0723",
    sourceType: "policy",
    publicationDate: "2025-10-08",
    developmentType: "Policy report",
    legalArea: "AI governance",
    authorityType: "Policy report",
    summary:
      "The Commission's Apply AI Strategy recognises cultural and creative sector concerns about unauthorised use of copyright-protected content in generative AI training and outputs.",
    whatHappened:
      "The Commission published a strategy for AI adoption that includes cultural and creative sectors as a domain with specific rights, diversity, and market-structure concerns.",
    whyItMatters:
      "It gives the database a current EU policy route connecting entertainment industry concerns with AI adoption strategy.",
    practicalImpact:
      "Monitoring should track strategy-linked funding, sector measures, standards, model licensing tools, and future copyright or AI Act implementation documents.",
    tags: ["official-source", "policy-report", BACKFILL_TAG, "apply-ai-strategy", "creative-sectors"],
    excerpt:
      "The strategy records concerns about unauthorised use of copyright-protected content in generative AI training and outputs affecting cultural diversity and media plurality.",
    pinpoint: { CELEX: "52025DC0723" },
  },
  {
    id: "commission-culture-compass-ai-creators-rights-2025",
    title: "Culture Compass links AI deployment with creators' rights and EU copyright rules",
    sourceName: "European Commission",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025DC0785",
    sourceType: "policy",
    publicationDate: "2025-11-12",
    developmentType: "Policy report",
    legalArea: "Copyright and generative AI",
    authorityType: "Policy report",
    summary:
      "The Commission's Culture Compass frames AI as a major cultural-policy issue and links AI deployment with respect for creators' rights and the DSM copyright framework.",
    whatHappened:
      "The Commission published Culture Compass for Europe, addressing digital transformation, cultural sectors, creative rights, and AI.",
    whyItMatters:
      "This is a current EU policy layer for entertainment, culture, and creative-sector AI governance.",
    practicalImpact:
      "The database should connect Culture Compass follow-up actions with AI Act implementation, Creative Europe, copyright licensing, and cultural-data initiatives.",
    tags: ["official-source", "policy-report", BACKFILL_TAG, "culture-compass", "creators-rights"],
    excerpt:
      "Culture Compass states that the AI Act aims to ensure AI development and deployment that respects creators' rights in compliance with the copyright directive.",
    pinpoint: { CELEX: "52025DC0785" },
  },
  {
    id: "council-conclusions-cultural-creative-sectors-ai-2024",
    title: "Council conclusions call for cultural and creative sectors to assess AI legal impacts",
    sourceName: "Council of the European Union",
    sourceUrl: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52024XG03542",
    sourceType: "policy",
    publicationDate: "2024-06-14",
    developmentType: "Policy report",
    legalArea: "Copyright and generative AI",
    authorityType: "Policy report",
    summary:
      "Council conclusions on empowering cultural and creative sectors call for attention to AI and advanced digital technologies, including intellectual property, copyright, privacy, and data-protection concerns.",
    whatHappened:
      "The Council adopted conclusions inviting Member States and cultural actors to anticipate risks and impacts from AI and advanced digital technologies.",
    whyItMatters:
      "This creates an EU Council policy marker for AI in entertainment and creative industries, including legal-risk monitoring beyond the AI Act alone.",
    practicalImpact:
      "Country agents should map national cultural-sector AI measures to this Council policy layer, especially copyright, privacy, data protection, and sustainability issues.",
    tags: ["official-source", "policy-report", BACKFILL_TAG, "council", "creative-sectors", "copyright"],
    excerpt:
      "The Council conclusions include legal concerns such as intellectual property rights, copyright, privacy, and personal data protection in cultural and creative AI use.",
    pinpoint: { CELEX: "52024XG03542" },
  },
  {
    id: "creative-sectors-joint-statement-gpai-code-2025",
    title: "Creative sectors criticise EU GPAI Code implementation as insufficient for rights holders",
    sourceName: "European Writers' Council",
    sourceUrl: "https://europeanwriterscouncil.eu/ccs-joint-statement-july25/",
    sourceType: "media_source",
    sourceRole: "discovery",
    publicationDate: "2025-07-01",
    developmentType: "Government announcement",
    legalArea: "Copyright and generative AI",
    authorityType: "Other",
    summary:
      "European creative-sector organisations criticised the AI Act implementation process around the GPAI Code of Practice, arguing that transparency and rights-holder protections were insufficient.",
    whatHappened:
      "Creative-sector groups issued a public statement reacting to the implementation of AI Act copyright-related rules for GPAI models.",
    whyItMatters:
      "This is not legal authority, but it is a reliable discovery signal showing where entertainment-sector legal disputes and lobbying pressure are concentrated.",
    practicalImpact:
      "Treat this as live legal news/discovery only; verify any legal claim against official AI Act, Code of Practice, Commission, Parliament, or court sources before promoting it as legal authority.",
    tags: ["media-source", "discovery-only", BACKFILL_TAG, "creative-sector-reaction", "rights-holders"],
    excerpt:
      "Creative and cultural organisations challenged the sufficiency of the EU AI Act implementation approach for copyright and rights-holder transparency.",
  },
];

function stableHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function boolEnv(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  return value === "true";
}

function rawIdentity(entry: EntertainmentEntry) {
  return `${BACKFILL_TAG}:${entry.id}:v1`;
}

function buildSourceReference(entry: EntertainmentEntry): SourceReference {
  const productionSourceType =
    entry.sourceType === "court" || entry.sourceType === "regulator" || entry.sourceType === "media_source"
      ? entry.sourceType
      : "official";

  return {
    sourceRole: entry.sourceRole ?? "primary",
    title: entry.title,
    institution: entry.sourceName,
    url: entry.sourceUrl,
    canonicalUrl: entry.sourceUrl,
    sourceType: productionSourceType,
    authorityType: entry.authorityType,
    publicationDate: entry.publicationDate,
    detectedAt: DETECTED_AT,
    retrievedAt: DETECTED_AT,
    lastVerifiedAt: DETECTED_AT,
    jurisdiction: "European Union",
    documentType: entry.developmentType,
    excerpt: entry.excerpt,
    pinpoint: entry.pinpoint ?? null,
    reliabilityLevel: entry.sourceRole === "discovery" ? "medium" : "high",
    verificationStatus: entry.sourceRole === "discovery" ? "discovery_only" : "verified_official_source",
    notes:
      entry.sourceRole === "discovery"
        ? "Reliable sector news/discovery signal only; do not treat as verified legal authority."
        : "Official EU-level source used for legal database publication.",
  };
}

function buildRawItem(entry: EntertainmentEntry): RawRegulatoryItemInput {
  const reference = buildSourceReference(entry);
  const rawText = [entry.summary, "", entry.whatHappened, "", entry.whyItMatters, "", entry.practicalImpact].join(
    "\n",
  );

  return {
    sourceId: SOURCE_ID,
    rawTitle: entry.title,
    rawUrl: entry.sourceUrl,
    rawText,
    rawMetadata: {
      baselineKind: "eu_ai_entertainment",
      sourceReferences: [reference],
      officialSourceUrls: entry.sourceRole === "discovery" ? [] : [entry.sourceUrl],
      publicationPolicy:
        entry.sourceRole === "discovery" ? "auto_publish_live_news_only" : "auto_publish_official_source",
      traceability: {
        sourceId: SOURCE_ID,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        officialSource: entry.sourceRole !== "discovery",
        parserUsed: "eu_ai_entertainment_backfill",
        scanTimestamp: DETECTED_AT,
        scanTrigger: "manual",
        scanProfile: "eu_ai_entertainment_backfill",
        contentHash: stableHash(`${rawIdentity(entry)}:${rawText}`),
        rawUrlScanned: entry.sourceUrl,
      },
    },
    detectedAt: DETECTED_AT,
    hash: stableHash(rawIdentity(entry)),
    duplicateOf: null,
    processingStatus: "processed",
  };
}

function buildUpdate(entry: EntertainmentEntry, rawItemId: string): RegulatoryUpdateDraftInput {
  return {
    sourceId: SOURCE_ID,
    rawItemId,
    title: entry.title,
    sourceName: entry.sourceName,
    sourceUrl: entry.sourceUrl,
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    developmentType: entry.developmentType,
    legalArea: entry.legalArea,
    authorityType: entry.authorityType,
    publicationDate: entry.publicationDate,
    detectedDate: DETECTED_AT,
    oneSentenceSummary: entry.summary.slice(0, 240),
    summary: entry.summary,
    whatHappened: entry.whatHappened,
    whyItMatters: entry.whyItMatters,
    practicalImpact: entry.practicalImpact,
    affectedParties: [
      "Entertainment and media companies",
      "Artists and performers",
      "Copyright holders",
      "Generative AI providers",
      "Online content-sharing platforms",
    ],
    keyObligations: [
      "Preserve the official EU source, CELEX or case identifier, date, and pinpoint before relying on this entry as legal authority.",
      "Classify entertainment-related AI issues under copyright, synthetic media, recommender systems, platform liability, and training-data transparency where appropriate.",
      "Treat media or sector-reaction items as live legal news/discovery signals unless independently confirmed by official EU sources.",
    ],
    complianceDeadlines:
      entry.id === "eu-ai-act-deepfake-entertainment-labeling-2024" ||
      entry.id === "eu-ai-generated-content-transparency-code-2026"
        ? [
            "2026-08-02: AI Act Article 50 transparency obligations apply; providers and deployers should confirm exact duties and creative-work tailoring against Article 50 and Commission guidance.",
          ]
        : [],
    enforcementRisk:
      entry.authorityType === "Binding law"
        ? "High relevance because this is EU-level binding law or CJEU case law affecting AI, copyright, platforms, or synthetic media."
        : "Medium to high relevance because this shapes EU enforcement, compliance expectations, or legislative direction for AI and entertainment.",
    importanceLevel: entry.authorityType === "Binding law" ? "critical" : "high",
    confidenceLevel: entry.sourceRole === "discovery" ? "medium" : "high",
    tags: [
      BACKFILL_TAG,
      `authority:${entry.authorityType}`,
      `legal-area:${entry.legalArea}`,
      `source-type:${entry.sourceType}`,
      ...entry.tags,
    ],
    status: "published",
    reviewedBy: entry.sourceRole === "discovery" ? "system:auto-reliable-news" : "system:auto-official-source",
    reviewedAt: DETECTED_AT,
    publishedAt: DETECTED_AT,
  };
}

async function ensureSource() {
  const existing = await updateRepository.getSource(SOURCE_ID);
  if (existing) return existing;
  return updateRepository.addSource({
    id: SOURCE_ID,
    name: SOURCE_NAME,
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    sourceUrl: SOURCE_URL,
    sourceType: "legislative_database",
    scanFrequency: "weekly",
    active: true,
    lastScannedAt: null,
    notes:
      "Curated EU-level official legal and reliable legal-news baseline for AI in entertainment, copyright, creative industries, synthetic media, and platform recommendation systems.",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    config: { sourceCategory: "official", corpus: BACKFILL_TAG },
    ingestionMethod: "existing",
    sourceCategory: "official",
    scraplingConfig: {},
    crawlRootUrl: SOURCE_URL,
  });
}

async function main() {
  const dryRun = boolEnv(process.env.EU_AI_ENTERTAINMENT_DRY_RUN, true);
  const existingRawItems = dryRun ? [] : await updateRepository.getRawItems(50000);
  const existingUpdates = dryRun ? [] : await updateRepository.listUpdates();
  const updateByRawItemId = new Map(existingUpdates.map((update) => [update.rawItemId, update]));
  const results = [];

  if (!dryRun) await ensureSource();

  for (const entry of entries) {
    const rawItem = buildRawItem(entry);
    const existingRaw = existingRawItems.find((item) => item.hash === rawItem.hash);

    if (dryRun) {
      results.push({
        id: entry.id,
        status: "dry_run",
        legalArea: entry.legalArea,
        authorityType: entry.authorityType,
        sourceRole: entry.sourceRole ?? "primary",
      });
      continue;
    }

    if (existingRaw) {
      await updateRepository.updateRawItemMetadata(existingRaw.id, rawItem.rawMetadata);
      const existingUpdate = updateByRawItemId.get(existingRaw.id);
      if (existingUpdate) {
        results.push({ id: entry.id, status: "skipped_existing_update", updateId: existingUpdate.id });
        continue;
      }
      const created = await updateRepository.createUpdate(buildUpdate(entry, existingRaw.id));
      results.push({ id: entry.id, status: "created_update_for_existing_raw_item", updateId: created.id });
      continue;
    }

    const createdRaw = await updateRepository.createRawItem(rawItem);
    const createdUpdate = await updateRepository.createUpdate(buildUpdate(entry, createdRaw.id));
    existingRawItems.push(createdRaw);
    updateByRawItemId.set(createdRaw.id, createdUpdate);
    results.push({
      id: entry.id,
      status: "created",
      updateId: createdUpdate.id,
      updateStatus: createdUpdate.status,
    });
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        dryRun,
        appDataMode: env.APP_DATA_MODE,
        entryCount: entries.length,
        results,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(
    `[backfill-eu-ai-entertainment] failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
