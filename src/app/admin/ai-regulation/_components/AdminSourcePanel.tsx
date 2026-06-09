import Link from "next/link";

import type { RegulationScanLog, RegulationSource } from "@/agents/ai-regulation/types";
import {
  buildSourceAuthoritySummary,
  buildSourceVerificationSummary,
  classifySourceHealth,
  formatDiagnosticsSummary,
} from "@/app/admin/ai-regulation/diagnostics";
import { toggleSource } from "@/app/admin/ai-regulation/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SourceHealthCheck } from "@/agents/ai-regulation/governance";

function toneClasses(tone: "success" | "warning" | "danger" | "neutral") {
  switch (tone) {
    case "success":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
    case "warning":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    case "danger":
      return "border-red-400/30 bg-red-500/10 text-red-100";
    default:
      return "border-white/10 bg-white/5 text-zinc-200";
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

interface Props {
  sources: RegulationSource[];
  latestLogBySource: Map<string, RegulationScanLog | null>;
  latestSuccessfulLogBySource: Map<string, RegulationScanLog | null>;
  scanLogs: RegulationScanLog[];
  sourceHealthChecks: SourceHealthCheck[];
}

export function AdminSourcePanel({
  sources,
  latestLogBySource,
  latestSuccessfulLogBySource,
  scanLogs,
  sourceHealthChecks,
}: Props) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <Card>
        <CardHeader>
          <CardTitle>Source quality diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sources.map((source) => {
            const latestLog = latestLogBySource.get(source.id) ?? null;
            const latestSuccess = latestSuccessfulLogBySource.get(source.id) ?? null;
            const health = classifySourceHealth(source, latestLog);
            const diagnostics = formatDiagnosticsSummary(latestLog);
            const authority = buildSourceAuthoritySummary(source);
            const verification = buildSourceVerificationSummary(source, sourceHealthChecks);

            return (
              <div
                key={source.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{source.name}</p>
                      <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-100">
                        {authority.label}
                      </span>
                      <span className={`rounded-full border px-2 py-1 text-xs ${toneClasses(health.tone)}`}>
                        {health.label}
                      </span>
                      <span className={`rounded-full border px-2 py-1 text-xs ${toneClasses(verification.tone)}`}>
                        {verification.label}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400">
                      {source.id} / {source.jurisdiction} / {source.sourceType}
                    </p>
                    <a
                      href={source.sourceUrl}
                      className="text-sm text-zinc-300 underline decoration-white/20 underline-offset-4"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.sourceUrl}
                    </a>
                    <p className="text-sm text-zinc-400">{health.detail}</p>
                    <p className="text-sm text-zinc-400">{verification.detail}</p>
                    <p className="text-sm text-zinc-500">{authority.shortNote}</p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/ai-regulation/sources/${source.id}`}
                      className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100"
                    >
                      Inspect source
                    </Link>
                    <form action={toggleSource}>
                      <input type="hidden" name="sourceId" value={source.id} />
                      <input type="hidden" name="active" value={source.active ? "false" : "true"} />
                      <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200">
                        {source.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {[
                    ["Last scanned", formatDateTime(source.lastScannedAt)],
                    ["Scan status", latestLog?.status ?? "No log"],
                    ["Items fetched", String(diagnostics.itemsFetched ?? latestLog?.itemsFound ?? 0)],
                    ["Filtered out", String(diagnostics.itemsFilteredOut ?? 0)],
                    ["New items", String(latestLog?.newItemsDetected ?? 0)],
                    ["Duplicates", String(diagnostics.duplicatesDetected ?? latestLog?.duplicatesDetected ?? 0)],
                    ["Duration", diagnostics.scanDurationMs ? `${diagnostics.scanDurationMs} ms` : "Unavailable"],
                    ["Last successful scan", formatDateTime(latestSuccess?.scanFinishedAt ?? null)],
                    ["Response status", String(diagnostics.sourceResponseStatus ?? "Unknown")],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                      <p className="mt-2 text-sm text-zinc-100">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Source verification</p>
                    <p className="mt-2 text-sm text-zinc-300">
                      {verification.record
                        ? `official=${verification.record.official ? "yes" : "no"} / public=${verification.record.public ? "yes" : "no"} / runtime_accessible=${verification.record.runtimeAccessible ? "yes" : "no"} / stable=${verification.record.stableEnoughForMonitoring ? "yes" : "no"} / dedicated_parser=${verification.record.requiresDedicatedParser ? "yes" : "no"} / recommended=${verification.record.recommendation}`
                        : "No documented verification record yet."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Authority notes</p>
                    <p className="mt-2 text-sm text-zinc-300">{authority.adminNotes.join(" ")}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Latest warnings or errors</p>
                    <p className="mt-2 text-sm text-zinc-300">
                      {diagnostics.latestWarning ??
                        diagnostics.latestError ??
                        diagnostics.zeroResultsReason ??
                        "No warnings or errors recorded on the latest scan."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3 lg:col-span-2">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Quality notes</p>
                    <p className="mt-2 text-sm text-zinc-300">{source.notes || "No internal notes yet."}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent scan diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scanLogs.slice(0, 8).map((log) => {
            const source = sources.find((entry) => entry.id === log.sourceId);
            const diagnostics = formatDiagnosticsSummary(log);
            return (
              <div key={log.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{source?.name ?? log.sourceId}</p>
                    <p className="text-sm text-zinc-400">
                      {log.status} / {log.newItemsDetected} new / {log.duplicatesDetected} duplicates
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500">{formatDateTime(log.scanStartedAt)}</p>
                </div>
                <p className="mt-2 text-sm text-zinc-300">
                  fetched={diagnostics.itemsFetched ?? log.itemsFound} filtered=
                  {diagnostics.itemsFilteredOut ?? 0} duration=
                  {diagnostics.scanDurationMs ?? "n/a"}ms response=
                  {diagnostics.sourceResponseStatus ?? "n/a"}
                </p>
                {diagnostics.latestWarning || diagnostics.latestError || diagnostics.zeroResultsReason ? (
                  <p className="mt-2 text-sm text-amber-200">
                    {diagnostics.latestWarning ?? diagnostics.latestError ?? diagnostics.zeroResultsReason}
                  </p>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
