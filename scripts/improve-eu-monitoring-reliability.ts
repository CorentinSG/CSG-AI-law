import { loadScriptEnv } from "@/lib/load-script-env";

loadScriptEnv();

import { getCountryDatabaseReadiness } from "@/lib/country-database-readiness";
import {
  queueAndDrainScanJob,
  queueScanJob,
} from "@/agents/ai-regulation/processors/scanJobs";
import type { ScanProfileId } from "@/agents/ai-regulation/scanProfiles";
import { getRepositoryMode } from "@/db/repository";

const EU_MEMBER_STATES = [
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czechia",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Ireland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
] as const;

const DEDICATED_PROFILE_SLUGS: Record<string, string> = {
  Austria: "austria",
  Belgium: "belgium",
  France: "france",
  Germany: "germany",
  Ireland: "ireland",
  Italy: "italy",
  Netherlands: "netherlands",
  Spain: "spain",
  Sweden: "sweden",
};

type ProfileKind = "official" | "news" | "verification";
type ExecutionMode = "dry-run" | "enqueue-only" | "run";

interface CliOptions {
  mode: ExecutionMode;
  limit: number;
  profiles: ProfileKind[];
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    mode: "dry-run",
    limit: 5,
    profiles: ["official", "news"],
  };

  for (const arg of argv) {
    if (arg === "--dry-run") options.mode = "dry-run";
    if (arg === "--enqueue-only") options.mode = "enqueue-only";
    if (arg === "--run") options.mode = "run";
    if (arg.startsWith("--limit=")) {
      const parsed = Number.parseInt(arg.slice("--limit=".length), 10);
      if (Number.isFinite(parsed) && parsed > 0) options.limit = parsed;
    }
    if (arg.startsWith("--profiles=")) {
      const parsed = arg
        .slice("--profiles=".length)
        .split(",")
        .map((value) => value.trim())
        .filter((value): value is ProfileKind =>
          ["official", "news", "verification"].includes(value),
        );
      if (parsed.length > 0) options.profiles = parsed;
    }
  }

  return options;
}

function profileFor(country: string, kind: ProfileKind): ScanProfileId {
  const slug = DEDICATED_PROFILE_SLUGS[country];
  if (!slug) {
    if (kind === "official") return "eu_official_legal_scan";
    if (kind === "news") return "eu_live_news_discovery_scan";
    return "eu_verification_scan";
  }

  if (kind === "official") return `${slug}_official_legal_scan` as ScanProfileId;
  if (kind === "news") return `${slug}_live_news_scan` as ScanProfileId;
  return `${slug}_verification_scan` as ScanProfileId;
}

function rankSeverity(status: string) {
  if (status === "blocked") return 0;
  if (status === "needs_backfill") return 1;
  if (status === "degraded") return 2;
  return 3;
}

function isEuCountry(country: string) {
  return (EU_MEMBER_STATES as readonly string[]).includes(country);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await getCountryDatabaseReadiness();
  const candidates = report.countries
    .filter((country) => isEuCountry(country.country))
    .filter((country) => country.status !== "ready")
    .sort(
      (a, b) =>
        rankSeverity(a.status) - rankSeverity(b.status) ||
        a.score - b.score ||
        b.runtime.failing - a.runtime.failing ||
        b.runtime.neverSucceeded - a.runtime.neverSucceeded ||
        a.country.localeCompare(b.country),
    )
    .slice(0, options.limit);

  const plannedCountryJobs = candidates.flatMap((country) =>
    options.profiles.map((kind) => ({
      country: country.country,
      profileKind: kind,
      scanProfile: profileFor(country.country, kind),
      status: country.status,
      score: country.score,
      blockers: country.blockers,
      failingSources: country.failingSources,
    })),
  );

  const uniqueJobs = Array.from(
    plannedCountryJobs
      .reduce((jobs, job) => {
        const key = `${job.scanProfile}:${job.profileKind}`;
        const existing = jobs.get(key);
        if (existing) {
          existing.targetCountries.push(job.country);
          existing.sourceBlockers[job.country] = job.blockers;
          return jobs;
        }
        jobs.set(key, {
          profileKind: job.profileKind,
          scanProfile: job.scanProfile,
          targetCountries: [job.country],
          sourceBlockers: { [job.country]: job.blockers },
        });
        return jobs;
      }, new Map<string, {
        profileKind: ProfileKind;
        scanProfile: ScanProfileId;
        targetCountries: string[];
        sourceBlockers: Record<string, string[]>;
      }>())
      .values(),
  );

  const executedJobs = [];
  if (options.mode !== "dry-run") {
    for (const job of uniqueJobs) {
      if (options.mode === "enqueue-only") {
        const queued = await queueScanJob({
          trigger: "manual",
          requestedBy: "codex-eu-monitoring-reliability",
          scanProfile: job.scanProfile,
          resultSummary: {
            reliabilityAction: "eu_monitoring_reliability",
            targetCountries: job.targetCountries,
            profileKind: job.profileKind,
          },
        });
        executedJobs.push({
          targetCountries: job.targetCountries,
          scanProfile: job.scanProfile,
          jobId: queued.id,
          status: queued.status,
        });
        continue;
      }

      const dispatched = await queueAndDrainScanJob({
        trigger: "manual",
        requestedBy: "codex-eu-monitoring-reliability",
        scanProfile: job.scanProfile,
        leaseOwner: "codex-eu-monitoring-reliability",
      });
      executedJobs.push({
        targetCountries: job.targetCountries,
        scanProfile: job.scanProfile,
        queuedJobId: dispatched.queuedJob.id,
        processedJobId: dispatched.processedJob?.id ?? null,
        processedStatus: dispatched.processedJob?.status ?? null,
        blockedByRunningJobs: dispatched.blockedByRunningJobs,
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: options.mode,
        dataMode: getRepositoryMode(),
        checkedAt: report.checkedAt,
        euSummary: {
          total: report.countries.filter((country) => isEuCountry(country.country)).length,
          selected: candidates.length,
          ready: report.countries.filter(
            (country) => isEuCountry(country.country) && country.status === "ready",
          ).length,
          notReady: report.countries.filter(
            (country) => isEuCountry(country.country) && country.status !== "ready",
          ).length,
        },
        selectedCountries: candidates.map((country) => ({
          country: country.country,
          status: country.status,
          score: country.score,
          blockers: country.blockers,
          sourceCoverage: country.sourceCoverage,
          runtime: country.runtime,
          content: country.content,
          failingSources: country.failingSources,
        })),
        plannedCountryJobs,
        plannedJobs: uniqueJobs,
        executedJobs,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    `[eu-monitoring-reliability] failed: ${
      error instanceof Error ? error.message : "Unknown error"
    }`,
  );
  process.exitCode = 1;
});
