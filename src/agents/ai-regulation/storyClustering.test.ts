import { describe, expect, it } from "vitest";

import {
  buildLiveStoryFeed,
  clusterNewsIntoStories,
  getNewsSourceTier,
  getStoryPhaseDisplay,
  storyTitleSimilarity,
  tokenizeStoryTitle,
} from "@/agents/ai-regulation/storyClustering";
import type { AiLawNewsItem } from "@/content/ai-regulation/news";

const NOW = new Date("2026-07-23T12:00:00.000Z");

function buildItem(overrides: Partial<AiLawNewsItem> & { id: string }): AiLawNewsItem {
  return {
    title: "Placeholder title",
    slug: `slug-${overrides.id}`,
    shortSummary: "Short summary.",
    fullSummary: "Full summary.",
    detectedAt: "2026-07-23T08:00:00.000Z",
    eventDate: null,
    publicationDate: "2026-07-23T08:00:00.000Z",
    lastVerifiedAt: null,
    sourceName: "CNIL",
    sourceUrl: "https://www.cnil.fr/example",
    sourceType: "official_source",
    sourceReliability: "official_authority",
    sourceJurisdiction: "France",
    jurisdiction: "France",
    region: "Europe",
    countryOrState: "France",
    legalArea: "Data protection",
    topicTags: [],
    authorityType: "Agency guidance",
    developmentType: "Agency guidance",
    verificationStatus: "official_verified",
    officialSourceFound: true,
    officialSourceUrl: "https://www.cnil.fr/example",
    sourceReferences: [],
    corroboratingSources: [],
    exactDateOfInformation: null,
    datePrecision: "exact",
    citationQuality: "citation_complete",
    publicVisibilityStatus: "public",
    reviewerNotes: "",
    relatedMonitorItemId: null,
    ...overrides,
  };
}

describe("tokenizeStoryTitle", () => {
  it("normalizes accents and drops stopwords in French titles", () => {
    const tokens = tokenizeStoryTitle(
      "Décision du Conseil d'État sur l'algorithme Parcoursup",
    );
    expect(tokens.has("decision")).toBe(true);
    expect(tokens.has("conseil")).toBe(true);
    expect(tokens.has("etat")).toBe(true);
    expect(tokens.has("parcoursup")).toBe(true);
    expect(tokens.has("du")).toBe(false);
    expect(tokens.has("sur")).toBe(false);
  });

  it("keeps short meaningful tokens like AI and IA", () => {
    expect(tokenizeStoryTitle("EU AI Act enforcement").has("ai")).toBe(true);
    expect(tokenizeStoryTitle("Régulation de l'IA en Europe").has("ia")).toBe(true);
  });
});

describe("storyTitleSimilarity", () => {
  it("scores identical titles at 1 and disjoint titles at 0", () => {
    const a = tokenizeStoryTitle("CNIL publishes AI compliance guidance");
    expect(storyTitleSimilarity(a, new Set(a))).toBe(1);
    const b = tokenizeStoryTitle("Quantum computing patent dispute settled");
    expect(storyTitleSimilarity(a, b)).toBe(0);
  });
});

describe("getNewsSourceTier", () => {
  it("ranks official above press above tracker above discovery", () => {
    expect(
      getNewsSourceTier({ sourceType: "official_source", sourceReliability: "official_authority" }),
    ).toBe(1);
    expect(
      getNewsSourceTier({
        sourceType: "legal_regulatory_press",
        sourceReliability: "reputable_secondary",
      }),
    ).toBe(2);
    expect(
      getNewsSourceTier({
        sourceType: "tracker_database",
        sourceReliability: "tracker_secondary",
      }),
    ).toBe(3);
    expect(
      getNewsSourceTier({
        sourceType: "informal_discovery_source",
        sourceReliability: "informal_discovery",
      }),
    ).toBe(4);
  });
});

describe("clusterNewsIntoStories", () => {
  it("groups the same development reported by different sources into one story", () => {
    const official = buildItem({
      id: "u1",
      title: "CNIL publishes new AI Act compliance guidance for recommendation systems",
      sourceName: "CNIL",
      publicationDate: "2026-07-23T09:00:00.000Z",
    });
    const press = buildItem({
      id: "u2",
      title: "CNIL AI Act compliance guidance targets recommendation systems",
      sourceName: "MLex",
      sourceType: "legal_regulatory_press",
      sourceReliability: "reputable_secondary",
      officialSourceFound: false,
      officialSourceUrl: null,
      verificationStatus: "media_reported",
      publicationDate: "2026-07-23T10:00:00.000Z",
    });
    const unrelated = buildItem({
      id: "u3",
      title: "Bundestag debates federal cloud sovereignty framework",
      sourceName: "Bundestag",
      publicationDate: "2026-07-23T07:00:00.000Z",
    });

    const stories = clusterNewsIntoStories([official, press, unrelated], { now: NOW });

    expect(stories).toHaveLength(2);
    const merged = stories.find((story) => story.members.length === 2);
    expect(merged).toBeDefined();
    expect(merged?.corroboration.sourceCount).toBe(2);
    expect(merged?.corroboration.sourceTypeCount).toBe(2);
    expect(merged?.corroboration.officialSourcePresent).toBe(true);
  });

  it("picks the official member as primary even when press is newer", () => {
    const press = buildItem({
      id: "p1",
      title: "France adopts binding AI transparency law for public services",
      sourceName: "Contexte",
      sourceType: "legal_regulatory_press",
      sourceReliability: "reputable_secondary",
      officialSourceFound: false,
      publicationDate: "2026-07-23T11:00:00.000Z",
    });
    const official = buildItem({
      id: "o1",
      title: "France adopts binding AI transparency law covering public services",
      sourceName: "Légifrance",
      publicationDate: "2026-07-23T08:00:00.000Z",
    });

    const [story] = clusterNewsIntoStories([press, official], { now: NOW });
    expect(story.members).toHaveLength(2);
    expect(story.primary.id).toBe("o1");
    expect(story.newestAt).toBe("2026-07-23T11:00:00.000Z");
  });

  it("does not merge stories about different subjects", () => {
    const a = buildItem({
      id: "a1",
      title: "Garante fines facial recognition operator under GDPR",
      sourceName: "Garante",
    });
    const b = buildItem({
      id: "b1",
      title: "EDPB adopts guidelines on large language model training data",
      sourceName: "EDPB",
    });
    expect(clusterNewsIntoStories([a, b], { now: NOW })).toHaveLength(2);
  });

  it("derives breaking phase for fresh corroborated stories and fading for old ones", () => {
    const fresh = buildItem({
      id: "f1",
      title: "Council of State suspends automated welfare scoring algorithm",
      sourceName: "Conseil d'État",
      publicationDate: "2026-07-23T10:30:00.000Z",
    });
    const old = buildItem({
      id: "f2",
      title: "Historic overview of algorithmic accountability litigation trends",
      sourceName: "CNIL",
      publicationDate: "2026-06-01T10:00:00.000Z",
    });

    const stories = clusterNewsIntoStories([fresh, old], { now: NOW });
    const freshStory = stories.find((story) => story.primary.id === "f1");
    const oldStory = stories.find((story) => story.primary.id === "f2");
    expect(freshStory?.phase).toBe("breaking");
    expect(oldStory?.phase).toBe("fading");
  });
});

describe("buildLiveStoryFeed", () => {
  it("ranks corroborated hard-law stories above single-source soft signals", () => {
    const hardLawOfficial = buildItem({
      id: "h1",
      title: "National assembly passes AI liability statute amending civil code",
      sourceName: "Assemblée nationale",
      developmentType: "national law",
      publicationDate: "2026-07-22T09:00:00.000Z",
    });
    const hardLawPress = buildItem({
      id: "h2",
      title: "AI liability statute passes national assembly, amending civil code",
      sourceName: "MLex",
      sourceType: "legal_regulatory_press",
      sourceReliability: "reputable_secondary",
      officialSourceFound: false,
      publicationDate: "2026-07-22T11:00:00.000Z",
    });
    const softSignal = buildItem({
      id: "s1",
      title: "Ministry publishes voluntary AI ethics charter for startups",
      sourceName: "Ministry of Digital Affairs",
      developmentType: "soft law",
      publicationDate: "2026-07-23T11:30:00.000Z",
    });

    const feed = buildLiveStoryFeed([softSignal, hardLawPress, hardLawOfficial], {
      now: NOW,
      limit: 6,
    });

    expect(feed[0].primary.id).toBe("h1");
    expect(feed[0].corroboration.sourceCount).toBe(2);
    expect(feed[0].importanceScore).toBeGreaterThan(feed[1].importanceScore);
  });

  it("caps the feed at the requested limit", () => {
    const titles = [
      "Senate hearing examines biometric surveillance moratorium",
      "Irish DPC opens inquiry against chatbot provider",
      "Spanish AESIA releases sandbox participation results",
      "Federal court certifies class action over hiring algorithms",
      "Commission consults on general-purpose model codes",
      "Dutch authority audits municipal fraud detection systems",
    ];
    const items = titles.map((title, index) =>
      buildItem({
        id: `n${index}`,
        title,
        sourceName: `Source ${index}`,
      }),
    );
    expect(buildLiveStoryFeed(items, { now: NOW, limit: 4 })).toHaveLength(4);
  });
});

describe("getStoryPhaseDisplay", () => {
  it("maps phases to display labels", () => {
    expect(getStoryPhaseDisplay("breaking")).toBe("Breaking");
    expect(getStoryPhaseDisplay("fading")).toBe("Fading");
  });
});
