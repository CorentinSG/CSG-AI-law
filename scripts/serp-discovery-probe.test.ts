import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  MAX_NEW_LEADS_PER_RUN,
  PROBE_TARGETS,
  QUERY_BUDGET_PER_RUN,
  RESULTS_PER_QUERY,
  buildQuery,
  leadInputFromResult,
  normalizeUrl,
  parseSerpResponse,
  type ProbeTarget,
} from "./serp-discovery-probe";

const TARGET: ProbeTarget = {
  domain: "ftc.gov",
  jurisdiction: "United States federal",
  seedSourceId: "src-ftc-ai-press",
  phrase: '"artificial intelligence"',
  provenance: "seed src-ftc-ai-press, held inactive on HTTP 403",
};

describe("probe budget", () => {
  it("keeps the whole target table inside the per-run query budget", () => {
    expect(PROBE_TARGETS.length).toBeGreaterThan(0);
    expect(PROBE_TARGETS.length).toBeLessThanOrEqual(QUERY_BUDGET_PER_RUN);
  });

  // Weekly cadence on the SerpAPI free tier (100 searches/month): the full
  // table must fit ~4.35 runs a month with headroom for manual reruns.
  it("stays within the free-tier monthly quota at weekly cadence", () => {
    expect(Math.ceil(PROBE_TARGETS.length * 4.35)).toBeLessThanOrEqual(90);
  });

  it("bounds writes as well as reads", () => {
    expect(MAX_NEW_LEADS_PER_RUN).toBeLessThanOrEqual(50);
    expect(RESULTS_PER_QUERY).toBeLessThanOrEqual(10);
  });
});

describe("probe targets", () => {
  // Every domain must already be recorded in this repository — the probe reaches
  // for sources we could not fetch, it does not get to invent official domains.
  it("uses only domains recorded in the seed or the member-state content", () => {
    const recorded = [
      readFileSync("src/db/seed/ai-regulation-seed.ts", "utf8"),
      readFileSync("src/content/ai-regulation/europe-member-state-implementation.ts", "utf8"),
    ].join("\n");

    for (const target of PROBE_TARGETS) {
      expect(recorded, `domain ${target.domain} is not recorded in the repo`).toContain(
        target.domain,
      );
    }
  });

  it("names a seed source id only for the 403-held seeded sources", () => {
    const withSeedId = PROBE_TARGETS.filter((target) => target.seedSourceId !== null).map(
      (target) => target.seedSourceId,
    );
    expect(withSeedId).toEqual(["src-ftc-ai-press", "src-sec-ai", "src-council-europe-ai"]);
  });

  it("restricts every query to its target domain", () => {
    for (const target of PROBE_TARGETS) {
      expect(buildQuery(target)).toBe(`site:${target.domain} ${target.phrase}`);
    }
  });
});

describe("parseSerpResponse", () => {
  it("maps organic results to title/link pairs", () => {
    const results = parseSerpResponse({
      organic_results: [
        { title: "FTC announces AI enforcement action", link: "https://www.ftc.gov/news/a" },
        { title: "Second item", link: "https://www.ftc.gov/news/b" },
      ],
    });

    expect(results).toEqual([
      { title: "FTC announces AI enforcement action", link: "https://www.ftc.gov/news/a" },
      { title: "Second item", link: "https://www.ftc.gov/news/b" },
    ]);
  });

  // Quota exhaustion or a bad key must fail the query loudly, not read as
  // "the official site published nothing this month".
  it("throws on a payload-level error", () => {
    expect(() => parseSerpResponse({ error: "Your account has run out of searches." })).toThrow(
      /run out of searches/,
    );
  });

  it("degrades malformed payloads to an empty list", () => {
    expect(parseSerpResponse(null)).toEqual([]);
    expect(parseSerpResponse({})).toEqual([]);
    expect(parseSerpResponse({ organic_results: "nope" })).toEqual([]);
  });

  it("drops results without an http link or a title", () => {
    const results = parseSerpResponse({
      organic_results: [
        { title: "No link" },
        { title: "", link: "https://example.com/untitled" },
        { title: "Good", link: "https://example.com/good" },
      ],
    });

    expect(results).toEqual([{ title: "Good", link: "https://example.com/good" }]);
  });

  it("caps results per query", () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({
      title: `Item ${i}`,
      link: `https://example.com/${i}`,
    }));

    expect(parseSerpResponse({ organic_results: rows })).toHaveLength(RESULTS_PER_QUERY);
  });
});

describe("leadInputFromResult", () => {
  const lead = leadInputFromResult(
    TARGET,
    { title: "FTC announces AI enforcement action", link: "https://www.ftc.gov/news/a" },
    "2026-07-31T06:30:00.000Z",
  );

  // Publication policy: a search-engine hit is discovery, never verification.
  it("always stays admin-only and unresolved", () => {
    expect(lead.publicVisibilityAllowed).toBe(false);
    expect(lead.status).toBe("unresolved");
    expect(lead.officialSourceFound).toBe(false);
  });

  it("carries the result and the traceable query", () => {
    expect(lead.headline).toBe("FTC announces AI enforcement action");
    expect(lead.outboundUrl).toBe("https://www.ftc.gov/news/a");
    expect(lead.sourceId).toBe("src-ftc-ai-press");
    expect(lead.possibleJurisdiction).toBe("United States federal");
    expect(lead.discoverySourceUrl).toContain("google.com/search");
    expect(lead.reviewerNotes).toContain("site:ftc.gov");
  });

  it("is detached from the raw-item pipeline", () => {
    expect(lead.rawItemId).toBeNull();
    expect(lead.convertedUpdateId).toBeNull();
  });
});

describe("normalizeUrl", () => {
  it("treats hash, trailing slash and host case as the same page", () => {
    const a = normalizeUrl("https://WWW.FTC.gov/news/a/#section");
    const b = normalizeUrl("https://www.ftc.gov/news/a");

    expect(a).toBe(b);
  });

  it("keeps meaningful query strings distinct", () => {
    expect(normalizeUrl("https://x.sm/doc?id=1")).not.toBe(
      normalizeUrl("https://x.sm/doc?id=2"),
    );
  });

  it("falls back to trimmed lowercase for unparseable input", () => {
    expect(normalizeUrl("  Not A Url ")).toBe("not a url");
  });
});
