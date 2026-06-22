import { describe, expect, it } from "vitest";

import { assessCitationQuality, type SourceReference } from "@/agents/ai-regulation/citations";
import { relevanceFilter } from "@/agents/ai-regulation/processors/relevanceFilter";
import { aiClassifier } from "@/agents/ai-regulation/processors/aiClassifier";
import { StaticPageConnector } from "@/agents/ai-regulation/connectors/static-page-connector";
import { buildSeedDataset } from "@/db/seed/seed-profiles";
import {
  aiRegulatoryUpdatesSeed,
  rawRegulatoryItemsSeed,
  regulationSourcesSeed,
} from "@/db/seed/ai-regulation-seed";
import { aiLawNewsSourceConfigs } from "@/content/ai-regulation/news-sources";
import { sourceDiscoveryRegistry } from "@/content/ai-regulation/source-discovery-registry";
import type { ExtractedCandidateItem, RawRegulatoryItem, RegulationSource } from "@/agents/ai-regulation/types";
import { buildInitialVerificationMetadata } from "@/agents/ai-regulation/verification";

// Regression note:
// When the monitor misses an important official legal-AI development, add a deterministic
// regression here with representative official metadata, expected classification, and at least
// one negative example showing what should still be rejected.

const nyCourtsSource =
  regulationSourcesSeed.find((source) => source.id === "src-nycourts-part-161-ai") ?? null;
const nyCourtsRawItem =
  rawRegulatoryItemsSeed.find((item) => item.id === "raw-028") ?? null;
const nyCourtsUpdate =
  aiRegulatoryUpdatesSeed.find((item) => item.id === "upd-026") ?? null;

function assertNyFixtures() {
  expect(nyCourtsSource).not.toBeNull();
  expect(nyCourtsRawItem).not.toBeNull();
  expect(nyCourtsUpdate).not.toBeNull();
}

function makeCandidate(overrides: Partial<ExtractedCandidateItem>): ExtractedCandidateItem {
  return {
    title: "Part 161. Use of Artificial Intelligence Technology",
    url: "https://ww2.nycourts.gov/rules/chiefadmin/161.shtml",
    text:
      "The New York State Unified Court System adopted Part 161 in the Rules of the Chief Administrator regulating the use of artificial intelligence technology in court papers. The rule applies in civil cases and criminal cases. Attorneys and parties must independently review AI-assisted filings and sanctions or remedial action may follow noncompliance.",
    excerpt:
      "Official NY Courts Part 161 rule for AI use in court papers, attorney review obligations, and sanctions risk.",
    metadata: {
      contentType: "nycourts_part_161_rule",
      category: "court rule",
    },
    ...overrides,
  };
}

function makeDiscoverySource(): RegulationSource {
  return {
    id: "src-lawfirm-alert",
    name: "Example Law Firm AI Alert",
    jurisdiction: "New York",
    region: "North America",
    country: "United States",
    sourceUrl: "https://examplelawfirm.com/client-alerts/ny-ai-rule",
    sourceType: "discovery_source",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "Client alert and newsletter source only.",
    reliabilityLevel: "low",
    preferredExtractionMethod: "html_static",
    config: { sourceCategory: "discovery_source" },
    createdAt: "2026-06-04T00:00:00.000Z",
    updatedAt: "2026-06-04T00:00:00.000Z",
  };
}

function makeMediaOnlyReferences(): SourceReference[] {
  return [
    {
      sourceRole: "discovery",
      title: "Law firm alert on New York AI rule",
      institution: "Example Law Firm",
      url: "https://examplelawfirm.com/client-alerts/ny-ai-rule",
      sourceType: "media_source",
      authorityType: "Other",
      publicationDate: "2026-06-02",
      detectedAt: "2026-06-04T12:00:00.000Z",
      retrievedAt: "2026-06-04T12:00:00.000Z",
      lastVerifiedAt: null,
      jurisdiction: "New York",
      documentType: "client_alert",
      excerpt:
        "Client alert summarizing a court rule on artificial intelligence in filings.",
      pinpoint: null,
      reliabilityLevel: "low",
      verificationStatus: "needs_official_source",
      notes: "Non-official discovery source only.",
    },
  ];
}

function makeOfficialReferences(): SourceReference[] {
  return [
    {
      sourceRole: "primary",
      title: "Part 161. Use of Artificial Intelligence Technology",
      institution: "New York State Unified Court System",
      url: "https://ww2.nycourts.gov/rules/chiefadmin/161.shtml",
      canonicalUrl: "https://ww2.nycourts.gov/rules/chiefadmin/161.shtml",
      sourceType: "court",
      authorityType: "Binding law",
      publicationDate: "2026-03-25",
      detectedAt: "2026-06-04T12:00:00.000Z",
      retrievedAt: "2026-06-04T12:00:00.000Z",
      lastVerifiedAt: "2026-06-04T12:00:00.000Z",
      jurisdiction: "New York",
      documentType: "court_rule",
      excerpt:
        "Official rule page describing whether AI use is permitted, the duty of independent review, and the model rule structure.",
      pinpoint: {
        ruleNumber: "Part 161",
        section: "161.3",
        annex: "Appendix A",
      },
      reliabilityLevel: "high",
      verificationStatus: "verified_for_review",
      notes: "Primary official NY Courts rule page.",
    },
    {
      sourceRole: "official_confirmation",
      title: "Administrative Order of the Chief Administrative Judge adding Part 161 (AO/75/2026)",
      institution: "New York State Unified Court System",
      url: "https://www.nycourts.gov/LegacyPDFS/rules/comments/pdf/AdministrativeOrder-CAJ-75-2026-ArttificialIntelligence-032526r.pdf",
      canonicalUrl:
        "https://www.nycourts.gov/LegacyPDFS/rules/comments/pdf/AdministrativeOrder-CAJ-75-2026-ArttificialIntelligence-032526r.pdf",
      sourceType: "court",
      authorityType: "Binding law",
      publicationDate: "2026-03-25",
      detectedAt: "2026-06-04T12:00:00.000Z",
      retrievedAt: "2026-06-04T12:00:00.000Z",
      lastVerifiedAt: "2026-06-04T12:00:00.000Z",
      jurisdiction: "New York",
      documentType: "administrative_order",
      excerpt:
        "Official administrative order confirming promulgation and effective date of Part 161.",
      pinpoint: {
        docket: "AO/75/2026",
        ruleNumber: "Part 161",
      },
      reliabilityLevel: "high",
      verificationStatus: "verified_for_review",
      notes: "Official administrative-order confirmation.",
    },
  ];
}

describe("NY Courts Part 161 regression harness", () => {
  it("keeps an official NY Courts source in the registry and refuses law-firm-only discovery as authority", () => {
    assertNyFixtures();

    expect(nyCourtsSource?.name).toBe("New York Courts Part 161 and AI Court Rules");
    expect(nyCourtsSource?.sourceUrl).toBe("https://ww2.nycourts.gov/rules/chiefadmin/161.shtml");
    expect(nyCourtsSource?.sourceType).toBe("court_database");
    expect(nyCourtsSource?.config?.parserType).toBe("nycourts_part_161_rule_page");
    expect(nyCourtsSource?.config?.authorityClassification).toBe("binding_court_rule");
    expect(nyCourtsSource?.config?.activeMonitoringStatus).toBe("active");

    const registryEntry = sourceDiscoveryRegistry.find(
      (entry) => entry.id === "official-new-york-courts-part-161-ai",
    );
    expect(registryEntry?.official).toBe(true);
    expect(registryEntry?.authorityTier).toBe("official_court_or_legislative_database");
    expect(registryEntry?.requiresOfficialSourceConfirmation).toBe(false);

    const newsSource = aiLawNewsSourceConfigs.find(
      (entry) => entry.id === "news-official-new-york-courts-part-161",
    );
    expect(newsSource?.official).toBe(true);
    expect(newsSource?.sourceType).toBe("official_source");

    const discoveryVerification = buildInitialVerificationMetadata({
      source: makeDiscoverySource(),
      rawItem: {
        rawTitle: "Law firm alert about New York AI filing rule",
        rawUrl: "https://examplelawfirm.com/client-alerts/ny-ai-rule",
        detectedAt: "2026-06-04T12:00:00.000Z",
        rawMetadata: {},
      } as Pick<RawRegulatoryItem, "rawTitle" | "rawUrl" | "detectedAt" | "rawMetadata">,
    });

    expect(discoveryVerification.verificationStatus).toBe("needs_official_source");
    expect(discoveryVerification.publicVisibilityAllowed).toBe(false);
  });

  it("treats Part 161 as a highly relevant legal-AI development for attorneys and court filings", () => {
    assertNyFixtures();
    const candidate = makeCandidate({});
    const relevance = relevanceFilter.evaluate(candidate, nyCourtsSource as RegulationSource);

    expect(relevance.relevant).toBe(true);
    expect(relevance.matchedAiTerms).toContain("artificial intelligence");
    expect(relevance.matchedRegulatoryTerms).toEqual(
      expect.arrayContaining(["rule", "official"]),
    );

    const classification = aiClassifier.classify({
      title: candidate.title,
      text: candidate.text,
      sourceName: nyCourtsSource?.name ?? "New York Courts",
      publicationDate: "2026-03-25",
      jurisdictionHint: "New York",
    });

    expect(classification.jurisdiction).toBe("New York");
    expect(classification.developmentType).toBe("Final rule");
    expect(classification.legalArea).toBe("Professional responsibility");
    expect(classification.importanceLevel).toBe("high");
    expect(classification.authorityType).toBe("Binding law");
  });

  it("parses binding court-rule and administrative-order authority for Part 161", async () => {
    const html = `
      <html>
        <body>
          <main>
            <h1>PART 161. Use of Artificial Intelligence Technology</h1>
            <p>Historical Note: Added Part 161 on <a href="/LegacyPDFS/rules/comments/pdf/AdministrativeOrder-CAJ-75-2026-ArttificialIntelligence-032526r.pdf">March 25, 2026</a>, effective June 1, 2026</p>
            <p>This Part applies in civil cases and criminal cases across the New York State Unified Court System.</p>
            <h2>Section 161.3 Policy</h2>
            <p>The use by attorneys and parties of artificial intelligence tools in preparing papers submitted to a court should not be prohibited.</p>
            <h2>Appendix A</h2>
            <p>Any attorney or party who uses an artificial intelligence tool in preparing any paper filed in or submitted to this court is required to carefully review the paper and independently ensure that it contains no fabricated or fictitious cases, statutes, or other material. Failure to comply may result in sanction or other remedial action.</p>
          </main>
        </body>
      </html>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(nyCourtsSource as RegulationSource);

    const partRule = result.items.find(
      (item) => item.metadata?.contentType === "nycourts_part_161_rule",
    );
    const adminOrder = result.items.find(
      (item) => item.metadata?.contentType === "nycourts_administrative_order_pdf",
    );

    expect(partRule?.authorityTypeHint).toBe("Binding law");
    expect(partRule?.metadata?.authorityClassification).toBe("binding_court_rule");
    expect(adminOrder?.authorityTypeHint).toBe("Binding law");
    expect(adminOrder?.metadata?.authorityClassification).toBe(
      "administrative_court_rule_order",
    );
    expect(partRule?.authorityTypeHint).not.toBe("Agency guidance");
    expect(partRule?.authorityTypeHint).not.toBe("Soft law");
    expect(partRule?.authorityTypeHint).not.toBe("Best practice");
  });

  it("extracts official date, forum, jurisdiction, and civil/criminal scope", async () => {
    const html = `
      <html>
        <body>
          <main>
            <h1>PART 161. Use of Artificial Intelligence Technology</h1>
            <p>Historical Note: Added Part 161 on <a href="/LegacyPDFS/rules/comments/pdf/AdministrativeOrder-CAJ-75-2026-ArttificialIntelligence-032526r.pdf">March 25, 2026</a>, effective June 1, 2026</p>
            <p>This Part applies in civil cases and criminal cases across the New York State Unified Court System.</p>
          </main>
        </body>
      </html>
    `;

    global.fetch = async () =>
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });

    const connector = new StaticPageConnector();
    const result = await connector.scan(nyCourtsSource as RegulationSource);
    const partRule = result.items.find(
      (item) => item.metadata?.contentType === "nycourts_part_161_rule",
    );

    expect(partRule?.publicationDate).toBe("2026-03-25");
    expect(partRule?.metadata?.effectiveDate).toBe("2026-06-01");
    expect(partRule?.jurisdictionHint).toBe("New York");
    expect(partRule?.metadata?.applicableForum).toBe("New York State Unified Court System");
    expect(partRule?.metadata?.scope).toEqual(["civil cases", "criminal cases"]);
  });

  it("requires official NY Courts citations for rule-permission, review, and sanctions claims", () => {
    const officialAssessment = assessCitationQuality(makeOfficialReferences());
    expect(officialAssessment.publicationEligible).toBe(true);
    expect(officialAssessment.qualityStatus).toBe("complete");
    expect(officialAssessment.primaryOfficialSource?.institution).toBe(
      "New York State Unified Court System",
    );

    const discoveryOnlyAssessment = assessCitationQuality(makeMediaOnlyReferences());
    expect(discoveryOnlyAssessment.publicationEligible).toBe(false);
    expect(discoveryOnlyAssessment.qualityStatus).toBe("discovery_only");
    expect(discoveryOnlyAssessment.warnings[0]).toContain("No official or authoritative source");
  });

  it("publishes official Part 161 demo items without admin approval", () => {
    const dataset = buildSeedDataset("demo");
    const update = dataset.updates.find((item) => item.id === "upd-026");
    const newsItem = dataset.newsItems.find((item) => item.regulatoryUpdateId === "upd-026");

    expect(update?.status).toBe("published");
    expect(update?.reviewedBy).toBe("system:auto-official-source");
    expect(update?.publishedAt).not.toBeNull();
    expect(newsItem?.publicVisibilityStatus).toBe("public");
    expect(newsItem?.relatedMonitorItemId).toBe("upd-026");
  });

  it("keeps official Part 161 production-safe seed items private", () => {
    const dataset = buildSeedDataset("production_safe");
    const update = dataset.updates.find((item) => item.id === "upd-026");
    const newsItem = dataset.newsItems.find((item) => item.regulatoryUpdateId === "upd-026");

    expect(update?.status).toBe("needs_review");
    expect(update?.reviewedBy).toBeNull();
    expect(update?.publishedAt).toBeNull();
    expect(newsItem?.publicVisibilityStatus).toBe("admin_only");
    expect(newsItem?.relatedMonitorItemId).toBeNull();
  });

  it("rejects common false positives that should not become regulatory items", () => {
    const nonOfficialSource = makeDiscoverySource();
    const cases: Array<{ title: string; text: string }> = [
      {
        title: "Client alert: How our AI compliance team can help",
        text: "A client alert about our firm's legal AI services and marketing offering.",
      },
      {
        title: "Conference announcement: Legal AI innovation summit",
        text: "Join our conference on artificial intelligence adoption in law practice and productivity.",
      },
      {
        title: "AI newsletter summary of New York court rule",
        text: "A newsletter summarizing headlines about an AI court rule and market reaction.",
      },
      {
        title: "Republished AI strategy article with a fresh 2026 date",
        text: "An old article reposted with a new publication date about enterprise AI transformation.",
      },
      {
        title: "AI image generation product update",
        text: "A product page describing artificial intelligence photo features for consumers.",
      },
    ];

    for (const item of cases) {
      const decision = relevanceFilter.evaluate(
        makeCandidate({
          title: item.title,
          text: item.text,
          excerpt: item.text,
          metadata: {},
        }),
        nonOfficialSource,
      );

      expect(decision.relevant, item.title).toBe(false);
    }
  });

  it("keeps the seeded Part 161 regression artifact internally structured and source-backed", () => {
    assertNyFixtures();

    expect(nyCourtsRawItem?.rawMetadata.institution).toBe("New York State Unified Court System");
    expect(nyCourtsRawItem?.rawMetadata.authorityClassification).toBe("binding_court_rule");
    expect(nyCourtsRawItem?.rawMetadata.effectiveDate).toBe("2026-06-01");
    expect(nyCourtsRawItem?.rawMetadata.applicableForum).toBe(
      "New York State Unified Court System",
    );
    expect(nyCourtsRawItem?.rawMetadata.scope).toEqual(["civil cases", "criminal cases"]);
    expect(nyCourtsUpdate?.status).toBe("published");
    expect(nyCourtsUpdate?.reviewedBy).toBe("system:auto-official-source");
  });
});
