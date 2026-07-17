import { describe, expect, it } from "vitest";

import {
  getInternationalAgentSourceIds,
  getInternationalSchedulerGuidance,
  internationalMonitoringSourceRegistry,
  isInternationalMonitoringSource,
} from "@/agents/ai-regulation/internationalNewsSources";

describe("international monitoring sources", () => {
  it("separates official international governance sources from live discovery feeds", () => {
    const official = getInternationalAgentSourceIds("international_official_legal_scan");
    const live = getInternationalAgentSourceIds("international_live_news_scan");

    expect(official).toEqual(
      expect.arrayContaining([
        "src-oecd-ai",
        "src-unesco-ai-ethics",
        "src-un-ai-advisory-body",
        "src-wipo-ai-ip",
        "src-iso-42001",
        "src-ieee-7000",
      ]),
    );
    expect(live).toEqual(
      expect.arrayContaining([
        "src-oecd-ai",
        "src-international-newsapi-ai",
        "src-international-gdelt-ai",
        "src-global-policy-watch-ai",
      ]),
    );
    expect(official).not.toContain("src-international-newsapi-ai");
    expect(official).not.toContain("src-international-gdelt-ai");
  });

  it("marks paywalled standards and soft law as non-binding by default", () => {
    const ieee = internationalMonitoringSourceRegistry.find(
      (entry) => entry.sourceId === "src-ieee-7000",
    );
    const unesco = internationalMonitoringSourceRegistry.find(
      (entry) => entry.sourceId === "src-unesco-ai-ethics",
    );

    expect(ieee).toMatchObject({
      official: true,
      category: "technical_standard",
      baselineEligible: true,
      liveMonitoringEligible: false,
    });
    expect(unesco).toMatchObject({
      official: true,
      category: "official_soft_law",
      baselineEligible: true,
    });
    expect(getInternationalSchedulerGuidance().notes.join(" ")).toContain(
      "not as binding national law by default",
    );
  });

  it("recognizes International and named international organizations as monitored sources", () => {
    expect(
      isInternationalMonitoringSource({
        id: "src-any",
        region: "International",
        country: "International",
        jurisdiction: "International",
      }),
    ).toBe(true);
    expect(
      isInternationalMonitoringSource({
        id: "src-any",
        region: "Europe",
        country: "France",
        jurisdiction: "WIPO",
      }),
    ).toBe(true);
  });
});
