import { describe, expect, it } from "vitest";

import { newYorkAiLawDepthEntries } from "./new-york-ai-law-depth";

describe("newYorkAiLawDepthEntries", () => {
  it("covers New York AI law across courts, work product, AEDT, agencies, and legislation", () => {
    expect(newYorkAiLawDepthEntries.length).toBeGreaterThanOrEqual(15);
    expect(new Set(newYorkAiLawDepthEntries.map((entry) => entry.jurisdiction))).toEqual(
      new Set(["New York"]),
    );

    expect(Array.from(new Set(newYorkAiLawDepthEntries.map((entry) => entry.legalArea)))).toEqual(
      expect.arrayContaining([
        "Professional responsibility",
        "Automated decision-making",
        "Labor and social law",
        "Financial services",
        "Cybersecurity",
        "Public sector use of AI",
        "AI governance",
      ]),
    );

    expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes("work-product"))).toBe(
      true,
    );
    expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes("attorney-client-privilege"))).toBe(true);
    expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes("local-law-144"))).toBe(
      true,
    );
    expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes("hallucinated-authority"))).toBe(
      true,
    );
    expect(newYorkAiLawDepthEntries.some((entry) => entry.tags.includes("discovery-lead"))).toBe(
      false,
    );

    for (const entry of newYorkAiLawDepthEntries) {
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.tags).toContain("new-york-ai-law-watch");
      expect(entry.sourceReference.verificationStatus).toBe("verified_official_source");
      expect(entry.sourceReference.reliabilityLevel).toBe("high");
    }
  });

  it("pins the enacted dates and duties for the 2024 New York additions", () => {
    const loadingAct = newYorkAiLawDepthEntries.find((entry) =>
      entry.tags.includes("loading-act"),
    );
    const digitalReplicaContracts = newYorkAiLawDepthEntries.find((entry) =>
      entry.tags.includes("performers") && entry.tags.includes("voice-cloning"),
    );

    expect(loadingAct?.publicationDate).toBe("2024-12-21");
    expect(loadingAct?.whatHappened).toContain("specifically authorized in law");
    expect(loadingAct?.whatHappened).toContain("before covered use");
    expect(loadingAct?.whatHappened).not.toMatch(/meaningful human review|recurring cycle/i);

    expect(digitalReplicaContracts?.publicationDate).toBe("2024-12-13");
    expect(digitalReplicaContracts?.summary).toContain("signed December 13, 2024");
  });

  it("records the current official revision date for the statewide AI use policy", () => {
    const stateAiPolicy = newYorkAiLawDepthEntries.find((entry) =>
      entry.tags.includes("state-it-policy"),
    );

    expect(stateAiPolicy?.publicationDate).toBe("2026-06-24");
    expect(stateAiPolicy?.whatHappened).toContain("updated June 24, 2026");
  });
});
