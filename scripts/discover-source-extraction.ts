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
  /** Set when a listing was found somewhere other than the seeded URL. */
  recoveredUrl?: string;
  /** Set only when the seeded page did not yield HTML — the fix-or-drop evidence. */
  pageStatus?: number | null;
  pageFinalUrl?: string | null;
  rootStatus?: number | null;
  verdict?: string;
};

const parser = new Parser({
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "User-Agent": USER_AGENT },
});

type PageFetch = {
  html: string | null;
  status: number | null;
  finalUrl: string | null;
  errorName: string | null;
  /** undici's underlying cause — `ENOTFOUND`, `ECONNRESET`, `CERT_HAS_EXPIRED`… */
  errorCode: string | null;
};

// Node reports every fetch failure as a bare `TypeError`; the discriminating
// detail is on `cause.code`. Only a DNS failure says the host is actually gone —
// a reset, a refusal or a TLS rejection means the name still resolves and
// something is deliberately turning this client away.
const DNS_FAILURE_CODES = new Set(["ENOTFOUND", "EAI_AGAIN"]);

async function fetchPage(url: string): Promise<PageFetch> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "follow",
    });
    return {
      html: response.ok ? await response.text() : null,
      status: response.status,
      finalUrl: response.url || url,
      errorName: null,
      errorCode: null,
    };
  } catch (error) {
    const cause = (error as { cause?: { code?: string } }).cause;
    return {
      html: null,
      status: null,
      finalUrl: null,
      errorName: (error as Error).name,
      errorCode: cause?.code ?? null,
    };
  }
}

/**
 * Turn a failed page fetch into a verdict a human can act on. The distinction
 * that matters is fixable versus dead, and the first probe run could not draw
 * it: every failure was reported as "unreachable" or "non-OK status", which put
 * a live regulator refusing datacenter traffic in the same bucket as a URL that
 * no longer exists. Deactivating a source on that evidence would drop a working
 * lane, so the verdict is deliberately conservative — only `dead_path` and
 * `dead_host` license removing anything, and both require the site to have said
 * so explicitly.
 *
 * `rootStatus` is the status of the source's own origin, fetched only after the
 * seeded URL failed: a live root behind a dead path means the authority moved
 * its newsroom, which is a URL fix rather than a deactivation.
 */
export function diagnosePageFailure(page: PageFetch, rootStatus: number | null) {
  if (page.errorName === "TimeoutError") {
    return { verdict: "timeout" as const, note: "timed out — slow host, not proof of a dead source" };
  }
  if (page.status === null) {
    // No HTTP response at all, so there is no evidence about the *path* — the
    // root shares this hostname, so a root that answers proves DNS works and the
    // failure was transient. Only a DNS failure with a dead root says the source
    // is gone. Ireland's DPC failed a previous run here with a connection reset:
    // a live regulator whose WAF refuses datacenter clients, which must never
    // read as death.
    if (rootStatus !== null && rootStatus < 500) {
      return {
        verdict: "unreachable" as const,
        note: `${page.errorCode ?? page.errorName ?? "no response"}, but the site root answers ${rootStatus} — transient`,
      };
    }
    if (page.errorCode && !DNS_FAILURE_CODES.has(page.errorCode)) {
      return {
        verdict: "unreachable" as const,
        note: `${page.errorCode} — the connection was refused, not proof of a dead source`,
      };
    }
    return {
      verdict: "dead_host" as const,
      note: `${page.errorCode ?? page.errorName ?? "unknown error"} — the hostname does not resolve`,
    };
  }
  if (page.status === 403 || page.status === 401 || page.status === 429) {
    return {
      verdict: "blocked" as const,
      note: `${page.status} — the site is up and refusing this client, not a dead source`,
    };
  }
  if (page.status === 404 || page.status === 410) {
    const alive = rootStatus !== null && rootStatus < 400;
    return alive
      ? { verdict: "dead_path" as const, note: `${page.status}, but the site root answers ${rootStatus}` }
      : { verdict: "dead_host" as const, note: `${page.status} and the site root answers ${rootStatus ?? "nothing"}` };
  }
  if (page.status >= 500) {
    return { verdict: "server_error" as const, note: `${page.status} — server-side, retry before judging` };
  }
  return { verdict: "other" as const, note: `unexpected status ${page.status}` };
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

/** Derived candidates tried per page, after the curated list. */
const MAX_DERIVED_SELECTORS = 25;

/**
 * An upper bound on how many elements a listing repeats. Past this the
 * signature is structural chrome (every `div`, every `li` in the page), not a
 * publication list, and testing it wastes a pass.
 */
const MAX_LISTING_REPEATS = 200;

/**
 * Reads candidate selectors off the page instead of guessing them.
 *
 * The curated list covers the CMSs these authorities mostly run, but 35 of the
 * gated lanes load a page it does not match — their listing markup simply is not
 * in it, and no amount of adding patterns by hand converges. A listing is a
 * repeated structure containing a link, so this groups elements by tag and class
 * signature and returns the signatures that repeat like a list.
 *
 * This does not loosen anything: every derived candidate still has to clear the
 * same evidence bar as a curated one. It only widens what gets *offered* to that
 * bar.
 */
export function derivedSelectors(html: string): string[] {
  const $ = cheerio.load(html);
  const counts = new Map<string, number>();

  $("body *").each((_, element) => {
    // Only containers that hold a link can be a publication row.
    if ($(element).find("a[href]").length === 0) return;

    const tag = (element as { tagName?: string }).tagName;
    if (!tag) return;
    const classes = ($(element).attr("class") ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      // Utility and state classes vary per row and would fragment the signature.
      .filter((name) => !/^(is-|has-|js-)/.test(name) && !/\d{3,}/.test(name));
    if (classes.length === 0) return;

    // Two granularities: the full class set, and the first class alone. The
    // first is precise when rows are uniform; the second survives rows that
    // carry an extra modifier class. Deduped, because a single-class element
    // yields the same string twice and would otherwise be counted double —
    // which would misreport how often the signature actually repeats.
    const signatures = new Set([`${tag}.${classes.join(".")}`, `${tag}.${classes[0]}`]);
    for (const signature of signatures) {
      counts.set(signature, (counts.get(signature) ?? 0) + 1);
    }
  });

  return [...counts.entries()]
    .filter(([, count]) => count >= MIN_ITEMS && count <= MAX_LISTING_REPEATS)
    .sort((a, b) => {
      // More classes first: a specific signature beats a broad one that happens
      // to also repeat. Then fewer repeats first, because a publication listing
      // is short and page chrome is long.
      const specificity = b[0].split(".").length - a[0].split(".").length;
      return specificity !== 0 ? specificity : a[1] - b[1];
    })
    .slice(0, MAX_DERIVED_SELECTORS)
    .map(([signature]) => signature);
}

export function bestSelector(html: string, baseUrl: string): SelectorEvidence | null {
  const $ = cheerio.load(html);
  // Curated patterns first: they are precise and their names are meaningful to
  // whoever reads the report. Derived ones only get a turn once those fail.
  for (const selector of CANDIDATE_SELECTORS) {
    const evidence = evaluateSelector($, selector, baseUrl);
    if (evidence) return evidence;
  }
  for (const selector of derivedSelectors(html)) {
    const evidence = evaluateSelector($, selector, baseUrl);
    if (evidence) return evidence;
  }
  return null;
}

/**
 * Words that name a publication listing across the languages these authorities
 * publish in. Matched against both the href and the link text, so a Slovenian
 * site linking "Novice" and an Icelandic one linking "Fréttir" both surface.
 * Deliberately broad: a wrong candidate costs one request and is then rejected
 * by the same evidence bar as everything else, while a missing language costs a
 * whole lane.
 */
const LISTING_LINK_HINTS =
  /news|nyhet|nyhed|nyheter|aktuel|aktualit|actualit|aktualn|aktuality|presse|press|media|medij|frett|fr[ée]ttir|uutis|nieuws|notic|vijesti|novosti|novice|h[ií]rek|naujien|jaunumi|uudised|stiri|obvestila|communiqu|publicat|publikac|mitteilung|meldung|pressemitteilung|announcement|blog/i;

/**
 * A seeded URL that yields nothing is not the end of the story: these lanes were
 * seeded with topic and landing pages, and the authority's actual listing is
 * usually one link away from its own root. Collecting those links is discovery,
 * not guessing — every candidate still has to clear the same evidence bar.
 */
export function listingCandidates(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return [];
  }

  const candidates: string[] = [];
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") ?? "";
    const text = $(element).text().trim();
    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.origin !== origin) return;
      // The root itself is already probed by the caller, and a fragment or a
      // query-only link is the same page again.
      resolved.hash = "";
      if (resolved.pathname === "/" || resolved.pathname === "") return;
      if (!LISTING_LINK_HINTS.test(resolved.pathname) && !LISTING_LINK_HINTS.test(text)) return;
      candidates.push(resolved.toString());
    } catch {
      // Ignore an unparseable href rather than failing the whole probe.
    }
  });

  return [...new Set(candidates)];
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

  const page = await fetchPage(source.sourceUrl);
  const html = page.html;

  const candidates: Array<{ url: string; via: Finding["discoveredVia"] }> = [];
  // `!== null`, not truthiness: a 200 with an empty body is a page that loaded
  // and yielded nothing, not a load failure. Treating "" as failure reported
  // src-ie-dete-ai as "unexpected status 200".
  if (html !== null) {
    for (const url of declaredFeedUrls(html, source.sourceUrl)) {
      candidates.push({ url, via: "link-rel" });
    }
  } else {
    // Only now is the extra request justified: the root tells fix-the-URL apart
    // from the source being gone.
    let rootStatus: number | null = null;
    try {
      const origin = new URL(source.sourceUrl).origin;
      if (origin !== source.sourceUrl.replace(/\/$/, "")) {
        rootStatus = (await fetchPage(origin)).status;
      }
    } catch {
      // Unparseable source URL — handled below.
    }
    const diagnosis = diagnosePageFailure(page, rootStatus);
    base.pageStatus = page.status;
    base.pageFinalUrl = page.finalUrl;
    base.rootStatus = rootStatus;
    base.verdict = diagnosis.verdict;
    base.note = diagnosis.note;
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
  if (selectorCandidate) {
    return {
      ...base,
      selectorCandidate,
      note: "no feed, but a candidate selector yields dated publications",
    };
  }

  // Last resort: the seeded URL gave nothing, but these lanes were seeded with
  // topic and landing pages, so the authority's real listing is usually one link
  // from its own root. Search there before concluding the source is unusable.
  const recovered = await recoverFromRoot(source.sourceUrl);
  if (recovered) {
    return {
      ...base,
      selectorCandidate: recovered.evidence,
      recoveredUrl: recovered.url,
      note: `the seeded URL yields nothing, but ${recovered.url} does — the source URL should move there`,
    };
  }

  return {
    ...base,
    selectorCandidate: null,
    note:
      base.note ||
      (html !== null && html.trim().length === 0
        ? "page returned 200 with an empty body — client-side rendered, needs a browser renderer not a selector"
        : "no feed and no selector produced dated publications"),
  };
}

/** Candidate listing pages tried per source. Bounds the request budget. */
const MAX_RECOVERY_CANDIDATES = 8;

async function recoverFromRoot(sourceUrl: string) {
  let origin: string;
  try {
    origin = new URL(sourceUrl).origin;
  } catch {
    return null;
  }

  const root = await fetchPage(origin);
  if (!root.html) return null;

  // The root may itself be the listing.
  const rootEvidence = bestSelector(root.html, origin);
  if (rootEvidence) return { url: origin, evidence: rootEvidence };

  for (const candidate of listingCandidates(root.html, origin).slice(0, MAX_RECOVERY_CANDIDATES)) {
    if (candidate === sourceUrl) continue;
    const page = await fetchPage(candidate);
    if (!page.html) continue;
    const evidence = bestSelector(page.html, candidate);
    if (evidence) return { url: candidate, evidence };
  }

  return null;
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
  const recovered = findings.filter((finding) => !finding.feedUrl && finding.recoveredUrl);
  const withSelector = findings.filter(
    (finding) => !finding.feedUrl && !finding.recoveredUrl && finding.selectorCandidate,
  );
  const stuck = findings.filter((finding) => !finding.feedUrl && !finding.selectorCandidate);

  console.log(`\n${found.length}/${findings.length} sources have a verified feed.`);
  console.log(`${withSelector.length}/${findings.length} have no feed but a candidate selector.`);
  console.log(`${recovered.length}/${findings.length} yield nothing at the seeded URL but do elsewhere on the site.`);
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

  if (recovered.length > 0) {
    // These need a source URL change as well as a selector, so they are reported
    // apart from the plain selector candidates — wiring only the selector would
    // point it at a page that still yields nothing.
    console.log("--- listing found elsewhere on the site (seeded URL is wrong) ---\n");
    for (const finding of recovered) {
      const candidate = finding.selectorCandidate!;
      console.log(`${finding.sourceId}  (${finding.country})`);
      console.log(`  seeded   : ${finding.sourceUrl}`);
      console.log(`  found at : ${finding.recoveredUrl}`);
      console.log(`  selector : ${candidate.selector}`);
      console.log(`  items    : ${candidate.itemCount}, ${Math.round(candidate.datedRatio * 100)}% dated`);
      for (const row of candidate.sampleRows) console.log(`  sample   : ${row}`);
      console.log("");
    }
  }

  if (stuck.length > 0) {
    // Sources whose page never loaded are a different problem from sources whose
    // page loaded but yielded nothing: the first is a broken URL or a blocked
    // client, the second is genuinely hard extraction. Reporting them together
    // is what made the last run's "19 dead sources" unactionable.
    const unloadable = stuck.filter((finding) => finding.verdict);
    const extractionless = stuck.filter((finding) => !finding.verdict);

    if (unloadable.length > 0) {
      console.log(`--- page never loaded (${unloadable.length}) ---`);
      for (const finding of [...unloadable].sort((a, b) =>
        (a.verdict ?? "").localeCompare(b.verdict ?? ""),
      )) {
        console.log(`  ${finding.sourceId.padEnd(28)} ${(finding.verdict ?? "").padEnd(13)} ${finding.note}`);
        console.log(`  ${" ".repeat(28)} ${finding.sourceUrl}`);
      }
      console.log("");
    }

    if (extractionless.length > 0) {
      console.log(`--- page loaded, no feed and no selector (${extractionless.length}) ---`);
      for (const finding of extractionless) {
        console.log(`  ${finding.sourceId.padEnd(28)} ${finding.note}`);
      }
      console.log("");
    }
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
