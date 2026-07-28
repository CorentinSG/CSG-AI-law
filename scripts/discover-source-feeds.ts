/**
 * Probe every seeded source that still extracts with a bare anchor selector and
 * report whether the site publishes a real RSS/Atom feed.
 *
 * Why this exists: those sources scrape an index page with `a[href]`, so an
 * extracted item is as likely to be a navigation link as a legal development.
 * They are gated out of automatic publication until a verified feed replaces
 * the selector — but a feed URL must never be guessed. This script does the
 * verification, and only reports a candidate that actually parses as a feed
 * with at least one dated item.
 *
 * It must run somewhere with outbound network access to the source sites; the
 * `Discover source feeds` workflow runs it on GitHub Actions. Output is a
 * report only — it changes no seed data.
 *
 *   npx tsx scripts/discover-source-feeds.ts [--limit N] [--json out.json]
 */
import { writeFileSync } from "node:fs";

import * as cheerio from "cheerio";
import Parser from "rss-parser";

import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";
import type { RegulationSource } from "@/agents/ai-regulation/types";

const ANCHOR_CATCH_ALL_SELECTORS = new Set([
  "main a[href], article a[href], a[href]",
  "main a[href]",
]);

// Conventional feed locations, tried only after the page's own <link rel>
// declarations. Ordered cheapest-first; the probe stops at the first that
// parses as a feed with a dated item.
const CONVENTIONAL_FEED_PATHS = [
  "/rss",
  "/rss.xml",
  "/feed",
  "/feed/",
  "/feed.xml",
  "/atom.xml",
  "/index.xml",
  "/en/rss",
  "/en/feed",
  "/actualites/rss",
  "/aktuelles/rss",
];

const REQUEST_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "C-Saint-Girons-AI-Regulation-Monitor/0.1 (feed-discovery; official-source-monitoring)";

type Finding = {
  sourceId: string;
  country: string;
  sourceUrl: string;
  currentSelector: string;
  feedUrl: string | null;
  discoveredVia: "link-rel" | "conventional-path" | null;
  itemCount: number;
  latestItemDate: string | null;
  sampleTitles: string[];
  note: string;
};

const parser = new Parser({
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "User-Agent": USER_AGENT },
});

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    redirect: "follow",
  });
  if (!response.ok) return null;
  return response.text();
}

/**
 * A candidate only counts if it parses AND carries at least one item with a
 * usable date. A feed of undated links is the same problem we are escaping.
 */
async function validateFeed(url: string) {
  try {
    const feed = await parser.parseURL(url);
    const items = feed.items ?? [];
    const dated = items.filter((item) => item.isoDate || item.pubDate);
    if (dated.length === 0) return null;

    const latest = dated
      .map((item) => item.isoDate ?? item.pubDate ?? "")
      .filter(Boolean)
      .sort()
      .at(-1);

    return {
      itemCount: items.length,
      datedCount: dated.length,
      latestItemDate: latest ?? null,
      sampleTitles: items.slice(0, 3).map((item) => (item.title ?? "").trim()),
    };
  } catch {
    return null;
  }
}

function declaredFeedUrls(html: string, baseUrl: string) {
  const $ = cheerio.load(html);
  const urls: string[] = [];
  $('link[rel="alternate"]').each((_, element) => {
    const type = ($(element).attr("type") ?? "").toLowerCase();
    const href = $(element).attr("href");
    if (!href) return;
    if (type.includes("rss") || type.includes("atom") || type.includes("xml")) {
      try {
        urls.push(new URL(href, baseUrl).toString());
      } catch {
        // Ignore an unparseable href rather than failing the whole probe.
      }
    }
  });
  return [...new Set(urls)];
}

async function probe(source: RegulationSource): Promise<Finding> {
  const base: Finding = {
    sourceId: source.id,
    country: source.country ?? source.jurisdiction,
    sourceUrl: source.sourceUrl,
    currentSelector: String(source.config?.itemSelector ?? ""),
    feedUrl: null,
    discoveredVia: null,
    itemCount: 0,
    latestItemDate: null,
    sampleTitles: [],
    note: "",
  };

  let html: string | null = null;
  try {
    html = await fetchText(source.sourceUrl);
  } catch (error) {
    base.note = `page unreachable: ${(error as Error).message}`;
  }

  const candidates: Array<{ url: string; via: Finding["discoveredVia"] }> = [];
  if (html) {
    for (const url of declaredFeedUrls(html, source.sourceUrl)) {
      candidates.push({ url, via: "link-rel" });
    }
  } else if (!base.note) {
    base.note = "page returned a non-OK status";
  }

  try {
    const origin = new URL(source.sourceUrl).origin;
    for (const path of CONVENTIONAL_FEED_PATHS) {
      candidates.push({ url: `${origin}${path}`, via: "conventional-path" });
    }
  } catch {
    base.note ||= "source URL is not parseable";
  }

  for (const candidate of candidates) {
    const result = await validateFeed(candidate.url);
    if (!result) continue;
    return {
      ...base,
      feedUrl: candidate.url,
      discoveredVia: candidate.via,
      itemCount: result.itemCount,
      latestItemDate: result.latestItemDate,
      sampleTitles: result.sampleTitles,
      note:
        candidate.via === "link-rel"
          ? "declared by the page itself"
          : "found at a conventional path, not declared by the page",
    };
  }

  return { ...base, note: base.note || "no parseable feed with dated items found" };
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.indexOf("--limit");
  const jsonArg = args.indexOf("--json");
  const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Number.POSITIVE_INFINITY;

  const targets = regulationSourcesSeed
    .filter((source) => ANCHOR_CATCH_ALL_SELECTORS.has(String(source.config?.itemSelector ?? "")))
    .slice(0, limit);

  console.log(`Probing ${targets.length} sources that extract with a bare anchor selector.\n`);

  const findings: Finding[] = [];
  for (const [index, source] of targets.entries()) {
    const finding = await probe(source);
    findings.push(finding);
    const status = finding.feedUrl ? "FEED" : "none";
    console.log(
      `[${index + 1}/${targets.length}] ${status.padEnd(4)} ${finding.sourceId} — ${finding.feedUrl ?? finding.note}`,
    );
  }

  const found = findings.filter((finding) => finding.feedUrl);
  console.log(`\n${found.length}/${findings.length} sources have a verified feed.`);
  console.log("Only these may replace a catch-all selector; the rest keep requiresReview.\n");

  for (const finding of found) {
    console.log(`${finding.sourceId}  (${finding.country})`);
    console.log(`  feed    : ${finding.feedUrl}`);
    console.log(`  via     : ${finding.discoveredVia} — ${finding.note}`);
    console.log(`  items   : ${finding.itemCount}, latest ${finding.latestItemDate}`);
    for (const title of finding.sampleTitles) console.log(`  sample  : ${title}`);
    console.log("");
  }

  if (jsonArg >= 0) {
    const path = args[jsonArg + 1] ?? "feed-discovery.json";
    writeFileSync(path, JSON.stringify(findings, null, 2));
    console.log(`Wrote ${path}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
