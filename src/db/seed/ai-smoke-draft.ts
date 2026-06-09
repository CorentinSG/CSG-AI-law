import type {
  AiRegulatoryUpdate,
  RawRegulatoryItem,
} from "@/agents/ai-regulation/types";

const now = "2026-05-25T05:10:00.000Z";

export const aiSmokeTestRawItemSeed: RawRegulatoryItem = {
  id: "raw-smoke-001",
  sourceId: "src-ftc-ai-press",
  rawTitle:
    "Internal Smoke Test Draft - FTC announces settlement over deceptive AI voice-cloning claims",
  rawUrl:
    "https://www.ftc.gov/news-events/news/press-releases/2026/05/internal-smoke-test-ftc-ai-voice-cloning-settlement",
  rawText:
    "Official-source-style smoke test draft for internal verification only. The Federal Trade Commission announced a settlement with a software vendor that marketed an AI voice-cloning tool to small businesses and schools. According to the announcement, the company represented that the tool could generate consent-compliant synthetic voices and reliably prevent impersonation misuse, but the Commission alleged that the company lacked adequate substantiation for those claims and failed to implement reasonable safeguards against deceptive deployment. The settlement announcement states that the company must stop making unsupported AI safety and performance claims, maintain documentation supporting future marketing statements, implement internal review for high-risk synthetic voice features, and preserve records relating to testing, complaints, and misuse reporting. The announcement also notes that no immediate civil penalty was imposed in this resolution, but that order violations could trigger monetary penalties and additional enforcement exposure. No specific compliance deadline was stated in the text provided beyond effectiveness upon final administrative approval.",
  rawMetadata: {
    excerpt:
      "FTC settlement announcement focused on deceptive AI voice-cloning claims, substantiation, and safeguards.",
    stableId: "smoke-test-ftc-ai-voice-cloning-settlement-2026-05",
    smokeTestDraft: true,
    internalOnly: true,
    sourceCategory: "enforcement_action",
  },
  detectedAt: "2026-05-25T05:10:00.000Z",
  hash: "hash-smoke-001",
  duplicateOf: null,
  processingStatus: "processed",
  createdAt: now,
  updatedAt: now,
};

export const aiSmokeTestUpdateSeed: AiRegulatoryUpdate = {
  id: "upd-smoke-001",
  sourceId: "src-ftc-ai-press",
  rawItemId: "raw-smoke-001",
  title:
    "Internal Smoke Test Draft - FTC AI voice-cloning settlement",
  sourceName: "FTC AI Press Releases",
  sourceUrl: aiSmokeTestRawItemSeed.rawUrl,
  jurisdiction: "United States federal",
  region: "North America",
  country: "United States",
  developmentType: "Enforcement action",
  legalArea: "Consumer protection",
  publicationDate: "2026-05-25",
  detectedDate: "2026-05-25",
  oneSentenceSummary:
    "Internal smoke test draft seeded for one-item OpenAI verification. Not for publication.",
  summary:
    "Internal smoke test draft seeded for one-item OpenAI verification. This placeholder should be replaced by guarded AI output during the smoke test.",
  whatHappened:
    "An internal smoke test draft was created from realistic official-source-style FTC enforcement content so one guarded OpenAI pass can be verified without touching published items.",
  whyItMatters:
    "The draft exists only to confirm that AI enrichment can save to a needs_review item without auto-publication.",
  practicalImpact:
    "No public-facing impact. This draft is for internal verification only and should remain in human review.",
  affectedParties: ["Internal reviewer"],
  keyObligations: ["No specific obligation detected from the provided text."],
  complianceDeadlines: ["No clear deadline detected."],
  enforcementRisk:
    "This is a non-public internal smoke test draft and carries no direct legal effect.",
  importanceLevel: "high",
  confidenceLevel: "low",
  tags: ["smoke-test", "internal-only", "ftc", "ai-enforcement"],
  status: "needs_review",
  reviewedBy: null,
  reviewedAt: null,
  publishedAt: null,
  createdAt: now,
  updatedAt: now,
};
