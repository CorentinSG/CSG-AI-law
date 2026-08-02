/**
 * Runtime verification for U.S. state baseline sources.
 *
 * The populated state review names statutes whose codified text was confirmed
 * in the Legal Data Hunter corpus, but the baseline also records whether each
 * official URL is reachable from *this* runtime (`runtimeAccessible`). This
 * script produces that evidence: it fetches every state-profile source still
 * marked `needs_manual_verification`, records HTTP status, and checks that
 * the page actually contains the content markers the profile relies on.
 *
 * Informational by design: it always exits 0 unless it could not run at all.
 * The report is the deliverable — flags in the baseline are flipped by hand,
 * with this run as the cited evidence.
 *
 *   npx tsx scripts/verify-us-baseline-sources.ts [--out report.md]
 */

import { writeFileSync } from "node:fs";

import { getUsStateAiLawProfiles } from "@/content/ai-regulation/us-state-ai-law-baseline";

/** Case-insensitive content markers, keyed by a stable URL fragment. */
const CONTENT_MARKERS: Array<{ urlIncludes: string; markers: string[] }> = [
  { urlIncludes: "statutes.capitol.texas.gov/Docs/BC/htm/BC.552", markers: ["artificial intelligence", "552"] },
  { urlIncludes: "le.utah.gov/xcode/Title13", markers: ["artificial intelligence"] },
  { urlIncludes: "leginfo.legislature.ca.gov", markers: ["frontier artificial intelligence", "22757"] },
  { urlIncludes: "cga.ct.gov/current/pub/chap_870", markers: ["51-10e", "artificial intelligence"] },
  { urlIncludes: "leg.colorado.gov/bills/sb25b-004", markers: ["artificial intelligence"] },
];

function markersFor(url: string): string[] {
  return CONTENT_MARKERS.find((entry) => url.includes(entry.urlIncludes))?.markers ?? [];
}

interface CheckResult {
  state: string;
  title: string;
  url: string;
  status: number | null;
  ok: boolean;
  markerHits: string[];
  markerMisses: string[];
  error: string | null;
}

async function checkUrl(state: string, title: string, url: string): Promise<CheckResult> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
      headers: { "user-agent": "csg-ai-law-baseline-verification/1.0 (+https://github.com/CorentinSG/CSG-AI-law)" },
    });
    const body = (await response.text()).toLowerCase();
    const markers = markersFor(url);
    const markerHits = markers.filter((marker) => body.includes(marker.toLowerCase()));
    const markerMisses = markers.filter((marker) => !body.includes(marker.toLowerCase()));
    return {
      state,
      title,
      url,
      status: response.status,
      ok: response.ok && markerMisses.length === 0,
      markerHits,
      markerMisses,
      error: null,
    };
  } catch (error) {
    return {
      state,
      title,
      url,
      status: null,
      ok: false,
      markerHits: [],
      markerMisses: markersFor(url),
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  }
}

async function main() {
  const targets: Array<{ state: string; title: string; url: string }> = [];
  const seen = new Set<string>();
  for (const profile of getUsStateAiLawProfiles()) {
    for (const reference of profile.sourceReferences) {
      if (reference.verificationStatus !== "needs_manual_verification") continue;
      if (seen.has(reference.url)) continue;
      seen.add(reference.url);
      targets.push({ state: profile.stateCode, title: reference.title, url: reference.url });
    }
  }

  console.log(`[us-baseline-verify] ${targets.length} unverified sources to check`);
  const results: CheckResult[] = [];
  for (const target of targets) {
    const result = await checkUrl(target.state, target.title, target.url);
    results.push(result);
    console.log(
      `[us-baseline-verify] ${result.ok ? "OK " : "FAIL"} ${result.state} ${result.status ?? "ERR"} ${result.url}` +
        (result.error ? ` (${result.error})` : "") +
        (result.markerMisses.length > 0 ? ` missing markers: ${result.markerMisses.join(", ")}` : ""),
    );
  }

  const lines = [
    "# U.S. state baseline source verification",
    "",
    `Checked ${results.length} sources still marked needs_manual_verification.`,
    "",
    "| State | Status | Markers | URL |",
    "| --- | --- | --- | --- |",
    ...results.map(
      (result) =>
        `| ${result.state} | ${result.status ?? result.error} | ${
          result.markerMisses.length === 0
            ? `all ${result.markerHits.length} hit`
            : `missing: ${result.markerMisses.join("; ")}`
        } | ${result.url} |`,
    ),
    "",
    "OK means HTTP 2xx and every expected content marker found in the page body.",
  ];

  const outArg = process.argv.indexOf("--out");
  const path = outArg >= 0 ? (process.argv[outArg + 1] ?? "us-baseline-verification.md") : "us-baseline-verification.md";
  writeFileSync(path, lines.join("\n"));
  console.log(`[us-baseline-verify] report written to ${path}`);
}

if (process.argv[1]?.includes("verify-us-baseline-sources")) {
  main().catch((error) => {
    console.error("[us-baseline-verify] fatal:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
