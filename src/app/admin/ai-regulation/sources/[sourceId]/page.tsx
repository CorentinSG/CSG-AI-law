import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { loadDiscoveryLeadRecordsBySourceId } from "@/agents/ai-regulation/utils/discovery-lead-records";
import {
  buildDiscoveryLeadSummary,
  buildDiscoveryLeadRecordSummary,
  buildSourceVerificationSummary,
  buildRawMetadataPreview,
  classifySourceHealth,
  formatDiagnosticsSummary,
} from "@/app/admin/ai-regulation/diagnostics";
import { isDiscoveryOnlySource } from "@/agents/ai-regulation/utils/discovery";
import {
  toggleSource,
  triggerSourceScan,
  updateSourceConfig,
} from "@/app/admin/ai-regulation/actions";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

function prettyJson(value: Record<string, unknown>) {
  return JSON.stringify(value, null, 2);
}

export default async function AdminSourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  const [source, scanLogs, rawItems, sourceHealthChecks] = await Promise.all([
    updateRepository.getSource(sourceId),
    updateRepository.getScanLogsBySource(sourceId, 8),
    updateRepository.getRawItemsBySource(sourceId, 12),
    updateRepository.getSourceHealthChecks(sourceId, 8),
  ]);

  if (!source) notFound();

  const latestLog = scanLogs[0] ?? null;
  const health = classifySourceHealth(source, latestLog);
  const latestDiagnostics = formatDiagnosticsSummary(latestLog);
  const verification = buildSourceVerificationSummary(source, sourceHealthChecks);
  const latestSuccessfulScan =
    source.lastSuccessfulScanAt ??
    scanLogs.find((log) => log.status === "success")?.scanFinishedAt ??
    null;
  const discoveryOnly = isDiscoveryOnlySource(source);
  const discoveryLeadRecords = discoveryOnly
    ? await loadDiscoveryLeadRecordsBySourceId(source.id, { limit: 200 })
    : [];
  const discoveryLeads =
    discoveryLeadRecords.length > 0
      ? discoveryLeadRecords.map((record) => ({
          key: record.lead.id,
          summary: buildDiscoveryLeadRecordSummary(record),
        }))
      : rawItems
          .map((item) => ({ key: item.id, summary: buildDiscoveryLeadSummary(item) }))
          .filter(
            (entry): entry is {
              key: string;
              summary: NonNullable<ReturnType<typeof buildDiscoveryLeadSummary>>;
            } => entry.summary !== null,
          );

  return (
    <SiteShell className="space-y-8" variant="admin" showFooter={false}>
      <div className="space-y-3">
        <Link
          href="/admin/ai-regulation"
          className="text-xs uppercase tracking-[0.35em] text-zinc-500"
        >
          Back to diagnostics
        </Link>
        <h1 className="font-serif text-4xl text-white">{source.name}</h1>
        <p className="max-w-3xl text-zinc-300">
          Inspect connector quality, latest raw captures, and source-specific notes
          before enabling live AI processing.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Source overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">
                    {source.id} / {source.jurisdiction} / {source.sourceType}
                  </p>
                  <a
                    href={source.sourceUrl}
                    className="text-sm text-zinc-200 underline decoration-white/20 underline-offset-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.sourceUrl}
                  </a>
                  <p className="text-sm text-zinc-300">
                    {health.label}: {health.detail}
                  </p>
                  <p className="text-sm text-zinc-300">
                    {verification.label}: {verification.detail}
                  </p>
                  {discoveryOnly ? (
                    <p className="text-sm text-amber-200">
                      Non-official discovery source. Leads from this source require
                      official-source confirmation and cannot be published directly.
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <form action={triggerSourceScan}>
                    <input type="hidden" name="sourceId" value={source.id} />
                    <button className="rounded-xl bg-white px-3 py-2 text-sm text-zinc-950">
                      Run source scan
                    </button>
                  </form>
                  <form action={toggleSource}>
                    <input type="hidden" name="sourceId" value={source.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={source.active ? "false" : "true"}
                    />
                    <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100">
                      {source.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Active</p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {source.active ? "Yes" : "No"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Last scanned
                  </p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {formatDateTime(source.lastScannedAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Last successful scan
                  </p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {formatDateTime(latestSuccessfulScan)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Response status
                  </p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {source.latestResponseStatus ?? latestDiagnostics.sourceResponseStatus ?? "Unknown"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    Scan duration
                  </p>
                  <p className="mt-2 text-sm text-zinc-100">
                    {latestDiagnostics.scanDurationMs
                      ? `${latestDiagnostics.scanDurationMs} ms`
                      : "Unavailable"}
                  </p>
                </div>
              </div>
            </div>

            <form action={updateSourceConfig} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="sourceId" value={source.id} />
              <input
                name="scanFrequency"
                defaultValue={source.scanFrequency}
                className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
              />
              <input
                name="preferredExtractionMethod"
                defaultValue={source.preferredExtractionMethod}
                className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
              />
              <input
                name="reliabilityLevel"
                defaultValue={source.reliabilityLevel}
                className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
              />
              <input
                name="notes"
                defaultValue={source.notes}
                placeholder="Connector limitation, extraction notes, OpenAI priority, etc."
                className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
              />
              <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100 md:col-span-2">
                Save quality notes
              </button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest scan summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <p>Status: {latestLog?.status ?? "No log yet"}</p>
              <p>Items fetched: {latestDiagnostics.itemsFetched ?? latestLog?.itemsFound ?? 0}</p>
              <p>Items filtered out: {latestDiagnostics.itemsFilteredOut ?? 0}</p>
              <p>New items detected: {latestLog?.newItemsDetected ?? 0}</p>
              <p>Duplicates detected: {latestDiagnostics.duplicatesDetected ?? latestLog?.duplicatesDetected ?? 0}</p>
              <p>Processing failures: {latestDiagnostics.processingFailures ?? 0}</p>
              <p>Warnings: {latestDiagnostics.warnings.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <p className="font-medium text-white">Official-source verification</p>
              <p className="mt-2">
                {verification.record
                  ? `official=${verification.record.official ? "yes" : "no"} / public=${verification.record.public ? "yes" : "no"} / runtime_accessible=${verification.record.runtimeAccessible ? "yes" : "no"} / stable=${verification.record.stableEnoughForMonitoring ? "yes" : "no"} / dedicated_parser=${verification.record.requiresDedicatedParser ? "yes" : "no"} / recommended=${verification.record.recommendation} / publication_allowed=${verification.record.publicationAllowed === false ? "no" : "yes"}`
                  : "No documented verification record exists for this source yet."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
              <p className="font-medium text-white">Latest warning or error</p>
              <p className="mt-2">
                {source.latestAccessibilityIssue ??
                  latestDiagnostics.latestWarning ??
                  latestDiagnostics.latestError ??
                  latestDiagnostics.zeroResultsReason ??
                  "No warnings or errors recorded."}
              </p>
            </div>
            {sourceHealthChecks.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                <p className="font-medium text-white">Recent source health checks</p>
                <div className="mt-3 space-y-3">
                  {sourceHealthChecks.map((check) => (
                    <div
                      key={check.id}
                      className="rounded-xl border border-white/10 bg-zinc-950/60 p-3"
                    >
                      <p>
                        {formatDateTime(check.checkedAt)} / response{" "}
                        {check.responseStatus ?? "n/a"} / accessible{" "}
                        {check.runtimeAccessible ? "yes" : "no"}
                      </p>
                      <p>
                        parser {check.parserStatus.replaceAll("_", " ")} / recommendation{" "}
                        {check.activeRecommendation.replaceAll("_", " ")}
                      </p>
                      <p>
                        fetched={check.itemsFetched} / new={check.newItemsDetected} /
                        duplicates={check.duplicatesDetected}
                      </p>
                      {check.accessibilityIssue ? <p>{check.accessibilityIssue}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Latest scan logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scanLogs.map((log) => {
              const diagnostics = formatDiagnosticsSummary(log);
              return (
                <div key={log.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{log.status}</p>
                      <p className="text-sm text-zinc-400">
                        {formatDateTime(log.scanStartedAt)} to {formatDateTime(log.scanFinishedAt)}
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500">{log.id}</p>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <p className="text-sm text-zinc-300">
                      fetched={diagnostics.itemsFetched ?? log.itemsFound}
                    </p>
                    <p className="text-sm text-zinc-300">
                      filtered={diagnostics.itemsFilteredOut ?? 0}
                    </p>
                    <p className="text-sm text-zinc-300">
                      new={log.newItemsDetected}
                    </p>
                    <p className="text-sm text-zinc-300">
                      duplicates={diagnostics.duplicatesDetected ?? log.duplicatesDetected}
                    </p>
                    <p className="text-sm text-zinc-300">
                      duration={diagnostics.scanDurationMs ?? "n/a"}ms
                    </p>
                    <p className="text-sm text-zinc-300">
                      response={diagnostics.sourceResponseStatus ?? "unknown"}
                    </p>
                  </div>
                  {diagnostics.warnings.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
                      {diagnostics.warnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  ) : null}
                  {diagnostics.errors.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">
                      {diagnostics.errors.map((entry) => (
                        <p key={entry}>{entry}</p>
                      ))}
                    </div>
                  ) : null}
                  {diagnostics.zeroResultsReason ? (
                    <div className="mt-3 rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-sm text-zinc-300">
                      {diagnostics.zeroResultsReason}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest raw captured items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rawItems.map((item) => {
              const preview = buildRawMetadataPreview(item);
              return (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="space-y-2">
                    <p className="font-medium text-white">{item.rawTitle}</p>
                    <a
                      href={item.rawUrl}
                      className="text-sm text-zinc-300 underline decoration-white/20 underline-offset-4"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.rawUrl}
                    </a>
                    <p className="text-sm text-zinc-400">
                      detected={formatDateTime(item.detectedAt)} / status={item.processingStatus}
                    </p>
                    <p className="text-sm text-zinc-400">
                      hash={item.hash}
                    </p>
                    <p className="text-sm text-zinc-400">
                      duplicate_of={item.duplicateOf ?? "none"}
                    </p>
                    <p className="rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-sm text-zinc-300">
                      {preview.excerpt || "No raw excerpt available."}
                    </p>
                    {preview.metadataPreview.length > 0 ? (
                      <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-xs text-zinc-400">
                        {preview.metadataPreview.map((entry) => (
                          <p key={entry}>{entry}</p>
                        ))}
                      </div>
                    ) : (
                      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-xs text-zinc-500">
                        {prettyJson(item.rawMetadata)}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {discoveryOnly ? (
        <section className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Discovery lead diagnostics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {discoveryLeads.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  No parsed discovery leads are stored yet for this source.
                </p>
              ) : (
                discoveryLeads.map(({ key, summary }) => (
                  <div
                    key={`${key}-lead`}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  >
                    <p className="font-medium text-white">{summary.headline}</p>
                    <a
                      href={summary.outboundUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-300 underline decoration-white/20 underline-offset-4"
                    >
                      {summary.outboundUrl}
                    </a>
                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <p className="text-sm text-zinc-300">
                        source: {summary.discoverySourceName}
                      </p>
                      <p className="text-sm text-zinc-300">
                        detected: {formatDateTime(summary.detectedDate)}
                      </p>
                      <p className="text-sm text-zinc-300">
                        jurisdiction: {summary.possibleJurisdiction}
                      </p>
                      <p className="text-sm text-zinc-300">
                        topic: {summary.possibleTopic}
                      </p>
                      <p className="text-sm text-zinc-300">
                        legal area: {summary.possibleLegalArea}
                      </p>
                      <p className="text-sm text-zinc-300">
                        authority type: {summary.possibleAuthorityType}
                      </p>
                      <p className="text-sm text-zinc-300">
                        official source found: {summary.possibleOfficialSourceFound ? "yes" : "no"}
                      </p>
                      <p className="text-sm text-zinc-300">
                        corroborating source found: {summary.corroboratingSourceFound ? "yes" : "no"}
                      </p>
                      <p className="text-sm text-zinc-300">
                        verification: {summary.verificationStatus.replaceAll("_", " ")}
                      </p>
                      <p className="text-sm text-zinc-300">
                        conversion: {summary.conversionStatus.replaceAll("_", " ")}
                      </p>
                      <p className="text-sm text-zinc-300">
                        last verified: {summary.lastVerifiedAt ? formatDateTime(summary.lastVerifiedAt) : "not attempted yet"}
                      </p>
                      <p className="text-sm text-zinc-300">
                        next source: {summary.nextSuggestedVerificationSource}
                      </p>
                      <p className="text-sm text-zinc-300">
                        not publishable: {summary.notPublishableReason ?? "n/a"}
                      </p>
                      <p className="text-sm text-zinc-300">
                        reviewer notes: {summary.reviewerNotes}
                      </p>
                    </div>
                    {summary.possibleOfficialSourceUrl ? (
                      <a
                        href={summary.possibleOfficialSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 block text-sm text-emerald-200 underline decoration-emerald-400/40 underline-offset-4"
                      >
                        Possible official source candidate
                      </a>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </SiteShell>
  );
}
