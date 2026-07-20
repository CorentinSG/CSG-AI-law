import { describe, expect, it } from "vitest";

import {
  getSchedulerRecommendation,
  selectSourcesForScanProfile,
} from "@/agents/ai-regulation/scanProfiles";
import { getGermanyAgentSourceIds } from "@/agents/ai-regulation/germanyNewsSources";
import { getFranceAgentSourceIds } from "@/agents/ai-regulation/franceNewsSources";
import { getEuAgentSourceIds } from "@/agents/ai-regulation/euNewsSources";
import { getItalyAgentSourceIds } from "@/agents/ai-regulation/italyNewsSources";
import { getSpainAgentSourceIds } from "@/agents/ai-regulation/spainNewsSources";
import { getAustriaAgentSourceIds } from "@/agents/ai-regulation/austriaNewsSources";
import { getBelgiumAgentSourceIds } from "@/agents/ai-regulation/belgiumNewsSources";
import { getInternationalAgentSourceIds } from "@/agents/ai-regulation/internationalNewsSources";
import type { RegulationSource } from "@/agents/ai-regulation/types";

function createSource(overrides: Partial<RegulationSource>): RegulationSource {
  return {
    id: "src-1",
    name: "Source",
    jurisdiction: "European Union",
    region: "Europe",
    country: "European Union",
    sourceUrl: "https://example.com",
    sourceType: "regulator_page",
    scanFrequency: "daily",
    active: true,
    lastScannedAt: null,
    notes: "",
    reliabilityLevel: "high",
    preferredExtractionMethod: "html_static",
    config: {},
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("scan profiles", () => {
  it("gives Austria complete official and verification source contracts", () => {
    const official = getAustriaAgentSourceIds("austria_official_legal_scan");
    const verification = getAustriaAgentSourceIds("austria_verification_scan");

    expect(official).toEqual(
      expect.arrayContaining([
        "src-at-dsb-ai",
        "src-at-ris-ai-law",
        "src-at-ris-ai-case-law",
        "src-at-rtr-ai",
      ]),
    );
    expect(official.some((id) => id.includes("newsapi") || id.includes("gdelt"))).toBe(false);
    expect(verification.length).toBeGreaterThanOrEqual(2);
  });

  it("gives Belgium complete official and verification source contracts", () => {
    const official = getBelgiumAgentSourceIds("belgium_official_legal_scan");
    const verification = getBelgiumAgentSourceIds("belgium_verification_scan");

    expect(official).toEqual(
      expect.arrayContaining([
        "src-be-apd-ai",
        "src-be-justel-ai-law",
        "src-be-courts-ai",
        "src-be-digitalbelgium-ai",
      ]),
    );
    expect(official.some((id) => id.includes("newsapi") || id.includes("gdelt"))).toBe(false);
    expect(verification.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps discovery scans limited to discovery-like sources", () => {
    const sources = [
      createSource({ id: "official", sourceType: "regulator_page" }),
      createSource({ id: "discovery", sourceType: "discovery_source" }),
      createSource({ id: "tracker", sourceType: "tracker_source" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "live_news_discovery_scan").map(
        (source) => source.id,
      ),
    ).toEqual(["discovery", "tracker"]);
  });

  it("keeps official baseline scans limited to official sources", () => {
    const sources = [
      createSource({ id: "official", sourceType: "regulator_page" }),
      createSource({ id: "discovery", sourceType: "discovery_source" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "official_baseline_scan").map(
        (source) => source.id,
      ),
    ).toEqual(["official"]);
  });

  it("limits the fast official sweep to the priority feed allowlist", () => {
    const sources = [
      createSource({ id: "src-cnil-ai", sourceType: "RSS" }),
      createSource({ id: "src-curia-rss", sourceType: "RSS" }),
      createSource({ id: "src-federal-register-ai", sourceType: "API" }),
      createSource({ id: "src-random-official", sourceType: "regulator_page" }),
      createSource({ id: "discovery", sourceType: "discovery_source" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "official_fast_scan").map(
        (source) => source.id,
      ),
    ).toEqual(["src-cnil-ai", "src-curia-rss", "src-federal-register-ai"]);
  });

  it("documents hourly fallback when five-minute scheduling is unavailable", () => {
    const recommendation = getSchedulerRecommendation("daily_only");

    expect(recommendation.liveNewsCron).toBeNull();
    expect(recommendation.limitation).toContain("Hobby");
  });

  it("keeps France official scans limited to the France baseline sources", () => {
    const franceOfficialIds = getFranceAgentSourceIds("france_official_legal_scan");
    const sources = [
      createSource({ id: "src-cnil-ai", country: "France", jurisdiction: "France" }),
      createSource({ id: "src-fr-legifrance-ai", country: "France", jurisdiction: "France" }),
      createSource({ id: "src-fr-conseil-etat-ai", country: "France", jurisdiction: "France" }),
      createSource({ id: "src-eu-ai-office", country: "European Union", jurisdiction: "European Union" }),
      createSource({ id: "src-tracker", sourceType: "discovery_source", country: "France", jurisdiction: "France" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "france_official_legal_scan").map(
        (source) => source.id,
      ),
    ).toEqual(franceOfficialIds.filter((id) => sources.some((source) => source.id === id)));
  });

  it("keeps France live scans limited to the lightweight France live source set", () => {
    const franceLiveIds = getFranceAgentSourceIds("france_live_news_scan");
    const sources = [
      createSource({ id: "src-cnil-ai", country: "France", jurisdiction: "France" }),
      createSource({
        id: "src-fr-major-press-newsapi-ai",
        country: "France",
        jurisdiction: "France",
        sourceType: "media_source",
      }),
      createSource({ id: "src-fr-legifrance-ai", country: "France", jurisdiction: "France" }),
      createSource({ id: "src-fr-conseil-etat-ai", country: "France", jurisdiction: "France" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "france_live_news_scan").map((source) => source.id),
    ).toEqual(franceLiveIds.filter((id) => sources.some((source) => source.id === id)));
  });

  it("keeps Europe live scans limited to the Europe discovery source set", () => {
    const euLiveIds = getEuAgentSourceIds("eu_live_news_discovery_scan");
    const sources = [
      createSource({ id: "src-eu-newsapi-ai", sourceType: "media_source" }),
      createSource({ id: "src-eu-major-press-newsapi-ai", sourceType: "media_source" }),
      createSource({ id: "src-eu-gdelt-ai", sourceType: "discovery_source" }),
      createSource({ id: "src-fr-newsapi-ai", country: "France", jurisdiction: "France", sourceType: "media_source" }),
      createSource({ id: "src-eu-ai-office" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "eu_live_news_discovery_scan").map(
        (source) => source.id,
      ),
    ).toEqual(euLiveIds.filter((id) => sources.some((source) => source.id === id)));
  });

  it("keeps Europe official scans aligned with the expanded official fast-feed set", () => {
    const euOfficialIds = getEuAgentSourceIds("eu_official_legal_scan");
    const sources = [
      createSource({ id: "src-eu-commission-news-rss", sourceType: "RSS", preferredExtractionMethod: "rss" }),
      createSource({ id: "src-edpb-rss", sourceType: "RSS", preferredExtractionMethod: "rss" }),
      createSource({ id: "src-curia-rss", sourceType: "RSS", preferredExtractionMethod: "rss" }),
      createSource({ id: "src-eur-lex-proposals-rss", sourceType: "RSS", preferredExtractionMethod: "rss" }),
      createSource({ id: "src-eu-newsapi-ai", sourceType: "media_source" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "eu_official_legal_scan").map((source) => source.id),
    ).toEqual(
      expect.arrayContaining(
        euOfficialIds.filter((id) => sources.some((source) => source.id === id)),
      ),
    );
  });

  it("keeps International official scans limited to transnational governance and standards sources", () => {
    const internationalOfficialIds = getInternationalAgentSourceIds(
      "international_official_legal_scan",
    );
    const sources = [
      createSource({ id: "src-oecd-ai", region: "International", country: "International", jurisdiction: "OECD" }),
      createSource({ id: "src-unesco-ai-ethics", region: "International", country: "International", jurisdiction: "UNESCO" }),
      createSource({ id: "src-iso-42001", region: "International", country: "International", jurisdiction: "ISO" }),
      createSource({ id: "src-international-newsapi-ai", region: "International", country: "International", jurisdiction: "International", sourceType: "media_source" }),
      createSource({ id: "src-eu-ai-office", region: "Europe", country: "European Union", jurisdiction: "European Union" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "international_official_legal_scan").map(
        (source) => source.id,
      ),
    ).toEqual(
      internationalOfficialIds.filter((id) => sources.some((source) => source.id === id)),
    );
  });

  it("keeps International live scans on global discovery/news feeds", () => {
    const internationalLiveIds = getInternationalAgentSourceIds("international_live_news_scan");
    const sources = [
      createSource({ id: "src-oecd-ai", region: "International", country: "International", jurisdiction: "OECD" }),
      createSource({ id: "src-international-newsapi-ai", region: "International", country: "International", jurisdiction: "International", sourceType: "media_source" }),
      createSource({ id: "src-international-gdelt-ai", region: "International", country: "International", jurisdiction: "International", sourceType: "discovery_source" }),
      createSource({ id: "src-unesco-ai-ethics", region: "International", country: "International", jurisdiction: "UNESCO" }),
      createSource({ id: "src-eu-newsapi-ai", region: "Europe", country: "European Union", jurisdiction: "European Union", sourceType: "media_source" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "international_live_news_scan").map(
        (source) => source.id,
      ),
    ).toEqual(
      internationalLiveIds.filter((id) => sources.some((source) => source.id === id)),
    );
  });

  it("keeps Spain official scans limited to the Spain baseline sources", () => {
    const spainOfficialIds = getSpainAgentSourceIds("spain_official_legal_scan");
    const sources = [
      createSource({ id: "src-es-aepd-ai", country: "Spain", jurisdiction: "Spain" }),
      createSource({ id: "src-es-aesia-ai", country: "Spain", jurisdiction: "Spain" }),
      createSource({ id: "src-es-boe-ai", country: "Spain", jurisdiction: "Spain" }),
      createSource({ id: "src-es-moncloa-ai", country: "Spain", jurisdiction: "Spain" }),
      createSource({ id: "src-eu-ai-office", country: "European Union", jurisdiction: "European Union" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "spain_official_legal_scan").map(
        (source) => source.id,
      ),
    ).toEqual(spainOfficialIds.filter((id) => sources.some((source) => source.id === id)));
  });

  it("keeps Spain live scans limited to the lightweight Spain live source set", () => {
    const spainLiveIds = getSpainAgentSourceIds("spain_live_news_scan");
    const sources = [
      createSource({ id: "src-es-aepd-ai", country: "Spain", jurisdiction: "Spain" }),
      createSource({
        id: "src-es-major-press-newsapi-ai",
        country: "Spain",
        jurisdiction: "Spain",
        sourceType: "media_source",
      }),
      createSource({ id: "src-es-boe-ai", country: "Spain", jurisdiction: "Spain" }),
      createSource({ id: "src-es-moncloa-ai", country: "Spain", jurisdiction: "Spain" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "spain_live_news_scan").map((source) => source.id),
    ).toEqual(spainLiveIds.filter((id) => sources.some((source) => source.id === id)));
  });

  it("keeps Italy official scans limited to the Italy baseline sources", () => {
    const italyOfficialIds = getItalyAgentSourceIds("italy_official_legal_scan");
    const sources = [
      createSource({ id: "src-it-garante-ai", country: "Italy", jurisdiction: "Italy" }),
      createSource({ id: "src-it-agid-ai", country: "Italy", jurisdiction: "Italy" }),
      createSource({ id: "src-it-normattiva-ai", country: "Italy", jurisdiction: "Italy" }),
      createSource({ id: "src-it-dtd-ai", country: "Italy", jurisdiction: "Italy" }),
      createSource({ id: "src-eu-ai-office", country: "European Union", jurisdiction: "European Union" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "italy_official_legal_scan").map(
        (source) => source.id,
      ),
    ).toEqual(italyOfficialIds.filter((id) => sources.some((source) => source.id === id)));
  });

  it("keeps Italy live scans limited to the lightweight Italy live source set", () => {
    const italyLiveIds = getItalyAgentSourceIds("italy_live_news_scan");
    const sources = [
      createSource({ id: "src-it-garante-ai", country: "Italy", jurisdiction: "Italy" }),
      createSource({
        id: "src-it-major-press-newsapi-ai",
        country: "Italy",
        jurisdiction: "Italy",
        sourceType: "media_source",
      }),
      createSource({ id: "src-it-normattiva-ai", country: "Italy", jurisdiction: "Italy" }),
      createSource({ id: "src-it-dtd-ai", country: "Italy", jurisdiction: "Italy" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "italy_live_news_scan").map((source) => source.id),
    ).toEqual(italyLiveIds.filter((id) => sources.some((source) => source.id === id)));
  });

  it("keeps Germany official scans limited to the Germany baseline sources", () => {
    const germanyOfficialIds = getGermanyAgentSourceIds("germany_official_legal_scan");
    const sources = [
      createSource({ id: "src-de-bfdi-ai", country: "Germany", jurisdiction: "Germany" }),
      createSource({
        id: "src-de-bfdi-consultation-ai",
        country: "Germany",
        jurisdiction: "Germany",
      }),
      createSource({
        id: "src-de-bundesregierung-ai",
        country: "Germany",
        jurisdiction: "Germany",
      }),
      createSource({ id: "src-de-bundestag-ai", country: "Germany", jurisdiction: "Germany" }),
      createSource({ id: "src-eu-ai-office", country: "European Union", jurisdiction: "European Union" }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "germany_official_legal_scan").map(
        (source) => source.id,
      ),
    ).toEqual(
      germanyOfficialIds.filter((id) => sources.some((source) => source.id === id)),
    );
  });

  it("keeps Germany live scans limited to the lightweight Germany live source set", () => {
    const germanyLiveIds = getGermanyAgentSourceIds("germany_live_news_scan");
    const sources = [
      createSource({ id: "src-de-bfdi-ai", country: "Germany", jurisdiction: "Germany" }),
      createSource({
        id: "src-de-bfdi-consultation-ai",
        country: "Germany",
        jurisdiction: "Germany",
      }),
      createSource({
        id: "src-de-major-press-newsapi-ai",
        country: "Germany",
        jurisdiction: "Germany",
        sourceType: "media_source",
      }),
      createSource({ id: "src-de-gdelt-ai", country: "Germany", jurisdiction: "Germany" }),
      createSource({
        id: "src-de-bundesregierung-ai",
        country: "Germany",
        jurisdiction: "Germany",
      }),
    ];

    expect(
      selectSourcesForScanProfile(sources, "germany_live_news_scan").map(
        (source) => source.id,
      ),
    ).toEqual(germanyLiveIds.filter((id) => sources.some((source) => source.id === id)));
  });
});
