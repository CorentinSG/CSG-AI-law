/**
 * Find a trustworthy way to read every seeded source that still extracts with a
 * bare anchor selector.
 *
 * Those sources scrape an index page with `a[href]`, so an extracted item is as
 * likely to be a navigation link as a legal development. They are gated out of
 * automatic publication until something verified replaces the selector — and
 * neither a feed URL nor a selector may ever be guessed.
 *
 * Two phases, cheapest and most reliable first:
 *
 *   1. Feed. Honour the page's own <link rel="alternate"> declarations, then
 *      conventional paths. A candidate counts only if it parses AND carries a
 *      dated item.
 *   2. Selector. For the sources with no feed, evaluate candidate CSS selectors
 *      against the live page and keep the best one that yields something that
 *      actually looks like a list of dated publications — several distinct
 *      same-host links, real titles, and dates found on the items themselves.
 *      Navigation menus fail that bar, which is the entire point.
 *
 * A reported candidate is evidence, not a decision: it carries its item count,
 * date coverage and sample rows so a human can judge it before it is wired in.
 *
 * Must run somewhere with outbound access to the source sites — the
 * `Discover source extraction` workflow runs it on GitHub Actions. Output is a
 * report only; it changes no seed data.
 *
 *   npx tsx scripts/discover-source-extraction.ts [--limit N] [--json out.json]
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

/**
 * Candidate selectors, most specific first. These are the listing patterns the
 * common government/regulator CMSs emit (WordPress, Drupal, Typo3, GOV-style
 * templates). The first that clears the evidence bar wins, so ordering matters:
 * a precise match should beat a broad one that happens to also work.
 */
const CANDIDATE_SELECTORS = [
  "article.post, article.entry, article.node",
  "article",
  ".views-row",
  ".node--type-article, .node-teaser",
  ".news-item, .newsitem, .news-list__item",
  ".post-item, .postitem, .post-list__item",
  ".teaser, .teaser-item",
  ".list-item, .listitem, .result-item",
  ".card, .c-card",
  "main ul li:has(a[href]):has(time)",
  "main li:has(a[href])",
];

// A listing must look like publications, not a menu. These bars were chosen so
// that a navigation block cannot pass: menus have few or no dates, repeat the
// same short labels, and often point off-host.
const MIN_ITEMS = 3;
const MIN_DATED_RATIO = 0.5;
const MIN_TITLE_LENGTH = 15;

// Dates carried as text rather than <time datetime>. Deliberately narrow —
// numeric day/month/year in the orders European sites actually use, plus ISO.
const TEXT_DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/,
  /\b\d{1,2}[./]\d{1,2}[./]\d{4}\b/,
  /\b\d{1,2}\s+\p{L}{3,}\s+\d{4}\b/u,
];

type SelectorEvidence = {
  selector: string;
  itemCount: number;
  datedRatio: number;
  sampleRows: string[];
};

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
  selectorCandidate: SelectorEvidence | null;
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

function hasDate($: cheerio.CheerioAPI, element: cheerio.Cheerio<never>) {
  if (element.find("time[datetime]").length > 0) return true;
  // cheerio's .text() concatenates nodes with no separator, so a date in its own
  // element arrives glued to the previous text ("...making01.07.2026"). There is
  // no word boundary between a letter and a digit, so the patterns below would
  // miss it. Join the text nodes with a space to restore the boundaries.
  const text = element
    .find("*")
    .addBack()
    .contents()
    .filter((_, node) => node.type === "text")
    .map((_, node) => $(node).text())
    .get()
    .join(" ");
  return TEXT_DATE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Score one candidate selector against the page. Returns evidence only when the
 * extracted rows look like dated publications on the same host — enough items,
 * enough of them dated, distinct links, and titles long enough to be headlines
 * rather than menu labels.
 */
export function evaluateSelector(
  $: cheerio.CheerioAPI,
  selector: string,
  baseUrl: string,
): SelectorEvidence | null {
  let elements;
  try {
    elements = $(selector);
  } catch {
    // `:has()` is unsupported on some cheerio versions; skip rather than fail.
    return null;
  }
  if (elements.length < MIN_ITEMS) return null;

  const host = new URL(baseUrl).host;
  const rows: Array<{ title: string; href: string; dated: boolean }> = [];

  elements.each((_, node) => {
    const element = $(node) as unknown as cheerio.Cheerio<never>;
    const anchor = element.is("a[href]") ? element : element.find("a[href]").first();
    const href = anchor.attr?.("href") ?? anchor.attr("href");
    if (!href) return;

    let absolute: string;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      return;
    }
    if (new URL(absolute).host !== host) return;

    const title = (anchor.text() || element.find("h1,h2,h3,h4").first().text() || "")
      .replace(/\s+/g, " ")
      .trim();
    if (title.length < MIN_TITLE_LENGTH) return;

    rows.push({ title, href: absolute, dated: hasDate($, element) });
  });

  const distinct = new Map(rows.map((row) => [row.href, row]));
  const items = [...distinct.values()];
  if (items.length < MIN_ITEMS) return null;

  const datedRatio = items.filter((item) => item.dated).length / items.length;
  if (datedRatio < MIN_DATED_RATIO) return null;

  return {
    selector,
    itemCount: items.length,
    datedRatio: Number(datedRatio.toFixed(2)),
    sampleRows: items
      .slice(0, 3)
      .map((item) => `${item.dated ? "dated" : "undated"} · ${item.title.slice(0, 90)}`),
  };
}

export function bestSelector(html: string, baseUrl: string): SelectorEvidence | null {
  const $ = cheerio.load(html);
  for (const selector of CANDIDATE_SELECTORS) {
    const evidence = evaluateSelector($, selector, baseUrl);
    if (evidence) return evidence;
  }
  return null;
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
    selectorCandidate: null,
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

  // No feed. Fall back to finding a selector that yields dated publications on
  // the page we already fetched — no extra request, and a far better answer
  // than the bare `a[href]` these sources use today.
  const selectorCandidate = html ? bestSelector(html, source.sourceUrl) : null;
  return {
    ...base,
    selectorCandidate,
    note: selectorCandidate
      ? "no feed, but a candidate selector yields dated publications"
      : base.note || "no feed and no selector produced dated publications",
  };
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.indexOf("--limit");
  const jsonArg = args.indexOf("--json");
  const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Number.POSITIVE_INFINITY;

  const targets = regulationSourcesSeed
    .filter((source) => ANCHOR_CATCH_ALL_SELECTORS.has(String(source.config?.itemSelector ?? "")))
    .slice(0, limit);

  console.log(`Probing ${targets.length} sources that extract with a bare anchor selector.`);
  console.log("Phase 1: feed. Phase 2: candidate selector for those without one.\n");

  const findings: Finding[] = [];
  for (const [index, source] of targets.entries()) {
    const finding = await probe(source);
    findings.push(finding);
    const status = finding.feedUrl ? "FEED" : finding.selectorCandidate ? "SEL " : "none";
    console.log(
      `[${index + 1}/${targets.length}] ${status.padEnd(4)} ${finding.sourceId} — ${finding.feedUrl ?? finding.selectorCandidate?.selector ?? finding.note}`,
    );
  }

  const found = findings.filter((finding) => finding.feedUrl);
  const withSelector = findings.filter((finding) => !finding.feedUrl && finding.selectorCandidate);
  const stuck = findings.filter((finding) => !finding.feedUrl && !finding.selectorCandidate);

  console.log(`\n${found.length}/${findings.length} sources have a verified feed.`);
  console.log(`${withSelector.length}/${findings.length} have no feed but a candidate selector.`);
  console.log(`${stuck.length}/${findings.length} have neither and must stay gated.\n`);
  console.log("Nothing here is a decision. Judge each candidate before wiring it.\n");

  for (const finding of found) {
    console.log(`${finding.sourceId}  (${finding.country})`);
    console.log(`  feed    : ${finding.feedUrl}`);
    console.log(`  via     : ${finding.discoveredVia} — ${finding.note}`);
    console.log(`  items   : ${finding.itemCount}, latest ${finding.latestItemDate}`);
    for (const title of finding.sampleTitles) console.log(`  sample  : ${title}`);
    console.log("");
  }

  if (withSelector.length > 0) {
    console.log("--- candidate selectors (no feed available) ---\n");
    for (const finding of withSelector) {
      const candidate = finding.selectorCandidate!;
      console.log(`${finding.sourceId}  (${finding.country})`);
      console.log(`  page     : ${finding.sourceUrl}`);
      console.log(`  selector : ${candidate.selector}`);
      console.log(`  items    : ${candidate.itemCount}, ${Math.round(candidate.datedRatio * 100)}% dated`);
      for (const row of candidate.sampleRows) console.log(`  sample   : ${row}`);
      console.log("");
    }
  }

  if (stuck.length > 0) {
    console.log("--- neither feed nor selector ---");
    for (const finding of stuck) {
      console.log(`  ${finding.sourceId.padEnd(28)} ${finding.note}`);
    }
    console.log("");
  }

  if (jsonArg >= 0) {
    const path = args[jsonArg + 1] ?? "feed-discovery.json";
    writeFileSync(path, JSON.stringify(findings, null, 2));
    console.log(`Wrote ${path}`);
  }
}

// Guarded so the heuristic can be unit-tested by importing this module without
// firing 75 live requests.
const isEntryPoint = process.argv[1]?.includes("discover-source-extraction");

if (isEntryPoint) {
  main()
  .then(() => {
    // Probing 75 hosts leaves undici sockets and rss-parser handles open, which
    // keeps the event loop alive long after the report is written. The first run
    // finished its work in 15 minutes and was then killed by the 30-minute job
    // timeout, so the run read as `cancelled` despite having completed and
    // uploaded a full report. Exit explicitly rather than wait them out.
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
