import { describe, expect, it } from "vitest";

import {
  buildJurisdictionLegalDatabaseSnapshot,
  classifyTimelineAuthority,
  distributeCentralLegalDatabase,
} from "@/agents/ai-regulation/jurisdictionTimeline";
import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";

function update(overrides: Partial<AiRegulatoryUpdate>): AiRegulatoryUpdate {
  return {
    id: "upd",
    sourceId: "src",
    rawItemId: "raw",
    title: "AI legal event",
    sourceName: "Official Source",
    sourceUrl: "https://example.gov/ai",
    jurisdiction: "New York",
    region: "United States",
    country: "United States",
    developmentType: "Final rule",
    legalArea: "AI governance",
    publicationDate: "2026-01-01",
    detectedDate: "2026-01-02",
    oneSentenceSummary: "A source-backed AI legal event.",
    summary: "Summary.",
    whatHappened: "What happened.",
    whyItMatters: "Why it matters.",
    practicalImpact: "Impact.",
    affectedParties: [],
    keyObligations: [],
    complianceDeadlines: [],
    enforcementRisk: "Risk.",
    importanceLevel: "medium",
    confidenceLevel: "high",
    tags: [],
    status: "published",
    reviewedBy: "system:auto-official-source",
    reviewedAt: "2026-01-02T00:00:00.000Z",
    publishedAt: "2026-01-02T00:00:00.000Z",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("jurisdiction legal database timeline", () => {
  it("classifies hard law, soft law, and case law / decisions", () => {
    expect(classifyTimelineAuthority(update({ developmentType: "Final rule" }))).toBe("hard_law");
    expect(classifyTimelineAuthority(update({ developmentType: "Agency guidance" }))).toBe("soft_law");
    expect(classifyTimelineAuthority(update({ developmentType: "Enforcement action", tags: ["court"] }))).toBe("case_law_and_decisions");
  });

  it("does not treat authority-designation gaps as case-law decisions", () => {
    expect(
      classifyTimelineAuthority(
        update({
          developmentType: "Other official regulatory development",
          authorityType: "Governance framework",
          tags: ["authority-designation-gap", "country-baseline"],
        }),
      ),
    ).toBe("soft_law");
  });

  it("builds a local timeline from the central legal database", () => {
    const snapshot = buildJurisdictionLegalDatabaseSnapshot({
      jurisdiction: "New York",
      region: "United States",
      updates: [
        update({ id: "hard", developmentType: "Final rule", publicationDate: "2026-04-01" }),
        update({ id: "soft", developmentType: "Agency guidance", publicationDate: "2026-03-01" }),
        update({ id: "case", developmentType: "Enforcement action", tags: ["court"], publicationDate: "2026-02-01" }),
        update({ id: "draft", status: "needs_review", publicationDate: "2026-05-01" }),
        update({ id: "other", jurisdiction: "California", publicationDate: "2026-06-01" }),
      ],
    });

    expect(snapshot.timeline.map((entry) => entry.updateId)).toEqual(["hard", "soft", "case"]);
    expect(snapshot.coverage).toMatchObject({
      hard_law: 1,
      soft_law: 1,
      case_law_and_decisions: 1,
    });
  });

  it("distributes central database entries into jurisdiction snapshots", () => {
    const snapshots = distributeCentralLegalDatabase({
      jurisdictions: [
        { jurisdiction: "New York", region: "United States" },
        { jurisdiction: "California", region: "United States" },
      ],
      updates: [
        update({ id: "ny", jurisdiction: "New York" }),
        update({ id: "ca", jurisdiction: "California" }),
      ],
    });

    expect(snapshots).toHaveLength(2);
    expect(snapshots[0]?.sourceUpdateIds).toEqual(["ny"]);
    expect(snapshots[1]?.sourceUpdateIds).toEqual(["ca"]);
  });
});
