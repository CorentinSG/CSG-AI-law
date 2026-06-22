import { describe, expect, it } from "vitest";

import { buildLegalDatabaseIntegrityReport } from "@/agents/ai-regulation/legalIntegrity";

describe("buildLegalDatabaseIntegrityReport", () => {
  it("produces a structured integrity report with summary counts", () => {
    const report = buildLegalDatabaseIntegrityReport(
      new Date("2026-05-31T12:00:00.000Z"),
    );

    expect(report.generatedAt).toBe("2026-05-31T12:00:00.000Z");
    expect(report.summary.total).toBe(report.findings.length);
    expect(report.summary.high + report.summary.medium + report.summary.low).toBe(
      report.findings.length,
    );
  });

  it("does not report source-hierarchy publication violations for discovery sources", () => {
    const report = buildLegalDatabaseIntegrityReport();
    const violations = report.findings.filter(
      (finding) => finding.code === "non-official-publication-allowed",
    );

    expect(violations).toEqual([]);
  });

  it("flags Europe citation overprecision and topic-page overclaims conservatively", () => {
    const report = buildLegalDatabaseIntegrityReport(
      new Date("2026-06-01T12:00:00.000Z"),
    );

    expect(
      report.findings.some(
        (finding) => finding.code === "governance-complete-despite-review-note",
      ),
    ).toBe(true);
    expect(
      report.findings.some(
        (finding) => finding.code === "soft-law-complete-despite-high-level-source",
      ),
    ).toBe(true);
  });

  it("keeps the production-safe seed private", () => {
    const report = buildLegalDatabaseIntegrityReport(
      new Date("2026-06-01T12:00:00.000Z"),
    );

    expect(
      report.findings.some(
        (finding) => finding.code === "production-seed-not-private",
      ),
    ).toBe(false);
  });
});
