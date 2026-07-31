/**
 * Weekly SerpAPI discovery probe — reaches sources the scan runtime cannot.
 *
 * Two kinds of target, both taken from facts already recorded in this repo:
 *  - Official domains held inactive because direct fetches return HTTP 403
 *    (FTC, SEC, Council of Europe, AP/NL). Google's index has their pages
 *    even though our runtime cannot fetch them.
 *  - Micro-state legal portals that have no scannable source at all — their
 *    only coverage today is GDELT news queries. The domains come from the
 *    verified country descriptors in the seed.
 *
 * Every hit becomes a discovery lead: status "unresolved", admin-only,
 * publicVisibilityAllowed false — a search-engine result is discovery, not
 * verification, so publication policy is untouched. This script is the first
 * caller of createDiscoveryLead; the dedicated discovery_leads table has been
 * empty since migration 007.
 *
 * Hard limits, none of them env-overridable:
 *  - QUERY_BUDGET_PER_RUN caps SerpAPI searches per run (free tier is 100/mo;
 *    the full target table weekly is ~52/mo).
 *  - RESULTS_PER_QUERY and MAX_NEW_LEADS_PER_RUN bound writes.
 *
 * Without SERPAPI_API_KEY the run skips loudly and exits 0; the "serpapi"
 * entry in agentApiCapabilities surfaces the missing key in the admin panel
 * so the skip cannot go unnoticed for weeks.
 *
 *   npx tsx scripts/serp-discovery-probe.ts [--dry-run]
 */

import { loadScriptEnv } from "@/lib/load-script-env";

import type { DiscoveryLeadInput } from "@/agents/ai-regulation/governance";

/** SerpAPI searches per run, absolute. The target table must fit inside it. */
export const QUERY_BUDGET_PER_RUN = 20;
/** Organic results kept per query. */
export const RESULTS_PER_QUERY = 10;
/** New leads written per run, across all queries. */
export const MAX_NEW_LEADS_PER_RUN = 40;

export interface ProbeTarget {
  /** Official domain for the site: restriction — recorded in the repo, never invented. */
  domain: string;
  jurisdiction: string;
  /** Seed source id when the domain maps to one, so admin can trace the 403 hold. */
  seedSourceId: string | null;
  /** Search phrase in the jurisdiction's working language. */
  phrase: string;
  /** Where in the repo the domain is recorded. */
  provenance: string;
}

// Domains only from repo-recorded, previously verified facts. The test pins
// each one to the file named in its provenance — adding a target requires the
// domain to already be recorded there.
export const PROBE_TARGETS: ProbeTarget[] = [
  {
    domain: "ftc.gov",
    jurisdiction: "United States federal",
    seedSourceId: "src-ftc-ai-press",
    phrase: '"artificial intelligence"',
    provenance: "seed src-ftc-ai-press, held inactive on HTTP 403",
  },
  {
    domain: "sec.gov",
    jurisdiction: "United States federal",
    seedSourceId: "src-sec-ai",
    phrase: '"artificial intelligence"',
    provenance: "seed src-sec-ai, held inactive on HTTP 403",
  },
  {
    domain: "coe.int",
    jurisdiction: "Council of Europe",
    seedSourceId: "src-council-europe-ai",
    phrase: '"artificial intelligence"',
    provenance: "seed src-council-europe-ai, held inactive on HTTP 403",
  },
  {
    domain: "autoriteitpersoonsgegevens.nl",
    jurisdiction: "Netherlands",
    seedSourceId: null,
    phrase: '"kunstmatige intelligentie" OR algoritmes',
    provenance: "seed T-OPS5 note (AP/NL blocked, HTTP 403) and europe-member-state-implementation.ts",
  },
  {
    domain: "legimonaco.mc",
    jurisdiction: "Monaco",
    seedSourceId: null,
    phrase: '"intelligence artificielle"',
    provenance: "seed country descriptor mc (Legimonaco official legal portal)",
  },
  {
    domain: "datenschutzstelle.li",
    jurisdiction: "Liechtenstein",
    seedSourceId: null,
    phrase: '"künstliche Intelligenz"',
    provenance: "seed country descriptor li (DPA)",
  },
  {
    domain: "gesetze.li",
    jurisdiction: "Liechtenstein",
    seedSourceId: null,
    phrase: '"künstliche Intelligenz"',
    provenance: "seed country descriptor li (legal information system)",
  },
  {
    domain: "apda.ad",
    jurisdiction: "Andorra",
    seedSourceId: null,
    phrase: '"intel·ligència artificial"',
    provenance: "seed country descriptor ad (DPA)",
  },
  {
    domain: "bopa.ad",
    jurisdiction: "Andorra",
    seedSourceId: null,
    phrase: '"intel·ligència artificial"',
    provenance: "seed country descriptor ad (official bulletin)",
  },
  {
    domain: "garanteprivacy.sm",
    jurisdiction: "San Marino",
    seedSourceId: null,
    phrase: '"intelligenza artificiale"',
    provenance: "seed country descriptor sm (DPA)",
  },
  {
    domain: "consigliograndeegenerale.sm",
    jurisdiction: "San Marino",
    seedSourceId: null,
    phrase: '"intelligenza artificiale"',
    provenance: "seed country descriptor sm (institutional legal sources)",
  },
  {
    domain: "vaticanstate.va",
    jurisdiction: "Vatican City",
    seedSourceId: null,
    phrase: '"intelligenza artificiale"',
    provenance: "seed country descriptor va (official legal sources)",
  },
];

export function buildQuery(target: ProbeTarget): string {
  return `site:${target.domain} ${target.phrase}`;
}

export interface SerpResult {
  title: string;
  link: string;
}

/**
 * Extracts organic results from a SerpAPI response. A payload-level `error`
 * throws (quota exhausted, bad key — the run must say so, not write nothing
 * silently); anything else malformed degrades to an empty list.
 */
export function parseSerpResponse(payload: unknown): SerpResult[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as { error?: unknown; organic_results?: unknown };
  if (typeof record.error === "string" && record.error.length > 0) {
    throw new Error(`SerpAPI error: ${record.error}`);
  }
  if (!Array.isArray(record.organic_results)) return [];
  return record.organic_results
    .filter(
      (row): row is { title: unknown; link: unknown } =>
        !!row && typeof row === "object" && "link" in row,
    )
    .map((row) => ({
      title: typeof row.title === "string" ? row.title : "",
      link: typeof row.link === "string" ? row.link : "",
    }))
    .filter((row) => row.link.startsWith("http") && row.title.length > 0)
    .slice(0, RESULTS_PER_QUERY);
}

/** Dedupe key: case-insensitive origin, no hash, no trailing slash. */
export function normalizeUrl(url: string): string {
  try {
    // origin + pathname + search: the hash never reaches the key, and URL
    // already lowercases the host inside origin.
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${path}${parsed.search}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

export function leadInputFromResult(
  target: ProbeTarget,
  result: SerpResult,
  detectedAt: string,
): DiscoveryLeadInput {
  const query = buildQuery(target);
  return {
    rawItemId: null,
    sourceId: target.seedSourceId,
    headline: result.title.slice(0, 300),
    discoverySourceUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    outboundUrl: result.link,
    detectedAt,
    possibleJurisdiction: target.jurisdiction,
    possibleTopic: "AI regulation",
    possibleLegalArea: null,
    possibleAuthorityType: null,
    status: "unresolved",
    officialSourceFound: false,
    officialSourceUrl: null,
    corroboratingSourceCount: 0,
    corroboratingSourceUrls: [],
    convertedUpdateId: null,
    reviewerNotes: `Search-engine discovery via ${query} (${target.provenance}). The domain is official but the hit itself is unverified — review before any use.`,
    lastVerifiedAt: null,
    staleAt: null,
    publicVisibilityAllowed: false,
  };
}

async function fetchSerp(query: string, apiKey: string): Promise<unknown> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(RESULTS_PER_QUERY));
  // Past-month window: a weekly run with monthly lookback overlaps on purpose;
  // dedupe absorbs the repeats and nothing slips between runs.
  url.searchParams.set("tbs", "qdr:m");
  url.searchParams.set("api_key", apiKey);
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    // Status only — the request URL carries the API key and must never be logged.
    throw new Error(`SerpAPI HTTP ${response.status}`);
  }
  return response.json();
}

async function main() {
  loadScriptEnv();
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) {
    console.log(
      "[serp-probe] SERPAPI_API_KEY is not set — skipping the probe. " +
        "The admin panel lists this capability as missing_credentials; " +
        "set the secret to enable weekly blocked-domain discovery.",
    );
    return;
  }
  const dryRun = process.argv.includes("--dry-run");

  // Imported only past the key check: the skip path must not require the
  // Supabase env that repository construction validates.
  const { updateRepository } = await import(
    "@/agents/ai-regulation/processors/updateRepository"
  );

  const existing = await updateRepository.listDiscoveryLeads(1000);
  const seen = new Set<string>();
  for (const lead of existing) {
    if (lead.outboundUrl) seen.add(normalizeUrl(lead.outboundUrl));
  }
  console.log(`[serp-probe] ${existing.length} existing leads loaded for dedupe`);

  const targets = PROBE_TARGETS.slice(0, QUERY_BUDGET_PER_RUN);
  const detectedAt = new Date().toISOString();
  let queries = 0;
  let hits = 0;
  let created = 0;
  let duplicates = 0;
  let failures = 0;
  let capped = 0;

  for (const target of targets) {
    const query = buildQuery(target);
    queries += 1;
    let results: SerpResult[];
    try {
      results = parseSerpResponse(await fetchSerp(query, apiKey));
    } catch (error) {
      failures += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[serp-probe] query failed for ${target.domain}: ${message}`);
      continue;
    }
    hits += results.length;

    for (const result of results) {
      const key = normalizeUrl(result.link);
      if (seen.has(key)) {
        duplicates += 1;
        continue;
      }
      if (created >= MAX_NEW_LEADS_PER_RUN) {
        capped += 1;
        continue;
      }
      seen.add(key);
      if (!dryRun) {
        await updateRepository.createDiscoveryLead(
          leadInputFromResult(target, result, detectedAt),
        );
      }
      created += 1;
    }
  }

  console.log(
    `[serp-probe] done${dryRun ? " (dry run — nothing written)" : ""}: ` +
      `${queries} queries, ${hits} results, ${created} new leads, ` +
      `${duplicates} duplicates skipped, ${failures} query failures` +
      (capped > 0 ? `, ${capped} results dropped at the per-run lead cap` : ""),
  );
  if (failures > 0 && created === 0 && hits === 0) {
    // Every query failed — surface it as a run failure instead of a quiet no-op.
    process.exitCode = 1;
  }
}

if (process.argv[1]?.includes("serp-discovery-probe")) {
  main().catch((error) => {
    console.error("[serp-probe] fatal:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
