import Link from "next/link";

import type { AiProcessingLog, RegulationSource } from "@/agents/ai-regulation/types";
import { updateSourceConfig } from "@/app/admin/ai-regulation/actions";
import { summarizeAiPlanning } from "@/app/admin/ai-regulation/ai-planning";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

interface Props {
  aiPlanning: ReturnType<typeof summarizeAiPlanning>;
  sources: RegulationSource[];
  processingLogs: AiProcessingLog[];
}

export function AdminAiPanel({ aiPlanning, sources, processingLogs }: Props) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>AI processing guardrails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">AI processing</p>
              <p className="mt-2 text-sm text-zinc-100">
                {env.AI_ENABLE_PROCESSING ? "Enabled" : "Disabled by default"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Monthly budget</p>
              <p className="mt-2 text-sm text-zinc-100">${env.AI_MONTHLY_BUDGET_USD.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Estimated monthly spend</p>
              <p className="mt-2 text-sm text-zinc-100">
                ${aiPlanning.estimatedMonthlySpendUsd.toFixed(4)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Scan item cap</p>
              <p className="mt-2 text-sm text-zinc-100">
                {env.AI_MAX_ITEMS_PER_SCAN} items / {env.AI_MAX_INPUT_TOKENS_PER_ITEM} tokens max
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Top-ranked pending AI items</p>
              <div className="mt-3 space-y-3">
                {aiPlanning.enrichedPending.length === 0 ? (
                  <p className="text-sm text-zinc-400">No pending AI-ranked items are currently queued.</p>
                ) : (
                  aiPlanning.enrichedPending.map((entry) => (
                    <div key={`${entry.rawItemId}-pending`} className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                      <p className="text-sm font-medium text-zinc-100">
                        {entry.rawItem?.rawTitle ?? entry.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-500">
                        score {entry.rankingScore} / {entry.rankingTier} / {entry.sourceName}
                      </p>
                      <p className="mt-2 text-sm text-zinc-300">{entry.decisionReason}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        est. ${entry.estimatedCostUsd.toFixed(4)} / {entry.estimatedInputTokens} in / {entry.estimatedOutputTokens} out
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">Skipped AI candidates</p>
              <div className="mt-3 space-y-3">
                {aiPlanning.enrichedSkipped.length === 0 ? (
                  <p className="text-sm text-zinc-400">No AI candidates were skipped by the current guardrails.</p>
                ) : (
                  aiPlanning.enrichedSkipped.map((entry) => (
                    <div key={`${entry.rawItemId}-skipped`} className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                      <p className="text-sm font-medium text-zinc-100">
                        {entry.rawItem?.rawTitle ?? entry.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-500">
                        {entry.decision.replaceAll("_", " ")}
                      </p>
                      <p className="mt-2 text-sm text-zinc-300">{entry.decisionReason}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-medium text-white">Recent completed AI processing</p>
            <div className="mt-3 space-y-3">
              {aiPlanning.enrichedOpenAiResults.length === 0 ? (
                <p className="text-sm text-zinc-400">No live OpenAI processing results are recorded yet.</p>
              ) : (
                aiPlanning.enrichedOpenAiResults.map((entry) => (
                  <div key={entry.logId} className="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                    <p className="text-sm font-medium text-zinc-100">
                      {entry.rawItem?.rawTitle ?? "AI processed item"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-500">
                      {entry.outcome.replaceAll("_", " ")} / {entry.modelUsed}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      est. ${entry.estimatedCostUsd.toFixed(4)} / {entry.estimatedInputTokens} in / {entry.estimatedOutputTokens} out
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configured sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sources.map((source) => (
            <div key={source.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-white">{source.name}</p>
                  <p className="text-sm text-zinc-400">
                    {source.jurisdiction} / {source.sourceType} / {source.scanFrequency}
                  </p>
                  <p className="text-xs text-zinc-500">Last scanned: {formatDateTime(source.lastScannedAt)}</p>
                </div>
                <Link
                  href={`/admin/ai-regulation/sources/${source.id}`}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100"
                >
                  Source detail
                </Link>
              </div>
              <form action={updateSourceConfig} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="sourceId" value={source.id} />
                <input name="scanFrequency" defaultValue={source.scanFrequency}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm" />
                <input name="preferredExtractionMethod" defaultValue={source.preferredExtractionMethod}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm" />
                <input name="reliabilityLevel" defaultValue={source.reliabilityLevel}
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm" />
                <input name="notes" defaultValue={source.notes} placeholder="Quality notes"
                  className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm" />
                <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100 md:col-span-2">
                  Update source configuration
                </button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Processing errors and runs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {processingLogs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-medium text-white">{log.modelUsed} / {log.promptVersion}</p>
              <p className="text-sm text-zinc-400">{log.status}</p>
              {log.errorMessage?.startsWith("ai_planning=") ? (
                (() => {
                  const parsed = aiPlanning.planningLogs.find((entry) => entry.log.id === log.id)?.plan;
                  if (!parsed) return <p className="mt-2 text-sm text-zinc-500">AI planning log</p>;
                  return (
                    <div className="mt-2 space-y-1 text-sm text-zinc-300">
                      <p>{parsed.title}</p>
                      <p className="text-zinc-500">
                        {parsed.decision.replaceAll("_", " ")} / rank {parsed.rankingScore} / est. ${parsed.estimatedCostUsd.toFixed(4)}
                      </p>
                      <p className="text-zinc-400">{parsed.decisionReason}</p>
                    </div>
                  );
                })()
              ) : log.errorMessage ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-red-200">{log.errorMessage}</p>
                  <p className="text-xs text-zinc-500">
                    Failed AI processing logs remain private and reviewable here.
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">Raw item: {log.rawItemId}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
