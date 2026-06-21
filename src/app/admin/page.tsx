import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getSourceRuntimeHealthSummaries } from "@/agents/ai-regulation/sourceRuntimeHealth";
import {
  listGlobalMonitoringAgents,
} from "@/agents/ai-regulation/globalMonitoringSupervisorAgent";
import { listAgentApiCapabilities } from "@/agents/ai-regulation/agentApiCapabilities";
import { buildHealthSnapshot } from "@/lib/health";
import { env } from "@/lib/env";
import { IntelligenceSignal } from "@/components/site/intelligence-signal";
import { OpsHealthBand } from "@/components/site/ops-health-band";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tone = "positive" | "informative" | "warning" | "neutral";

function StatusDot({ tone }: { tone: Tone }) {
  const color =
    tone === "positive"
      ? "bg-emerald-400"
      : tone === "warning"
        ? "bg-amber-400"
        : tone === "informative"
          ? "bg-sky-400"
          : "bg-zinc-500";
  return <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", color)} />;
}

function count<T>(arr: T[], predicate: (item: T) => boolean) {
  return arr.filter(predicate).length;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

export default async function AdminDashboardPage() {
  const [updates, news, countries, sources, health, leads, scanLogs] =
    await Promise.all([
      updateRepository.listUpdates(),
      updateRepository.getNewsItems(),
      updateRepository.listCountryIntelligence(),
      updateRepository.getSources(),
      getSourceRuntimeHealthSummaries(),
      updateRepository.listDiscoveryLeads(500),
      updateRepository.getScanLogs(50),
    ]);

  const agents = listGlobalMonitoringAgents();
  const capabilities = listAgentApiCapabilities();
  const healthSnapshot = await buildHealthSnapshot({ access: "authenticated" });

  // ── Legal database (regulatory updates) ──────────────────────────────
  const updatesPublished = count(updates, (u) => u.status === "published");
  const updatesNeedsReview = count(updates, (u) => u.status === "needs_review");

  // ── AI Law News ──────────────────────────────────────────────────────
  const newsPublished = count(news, (n) => n.publicVisibilityStatus === "public");
  const newsAdminOnly = news.length - newsPublished;

  // ── Country intelligence ─────────────────────────────────────────────
  const countriesVerified = count(countries, (c) => c.reviewStatus === "verified");
  const countriesNeedsReview = count(countries, (c) => c.reviewStatus === "needs_review");
  const countriesStaleOrFlagged = count(
    countries,
    (c) => c.reviewStatus === "stale" || c.reviewStatus === "flagged",
  );

  // ── Sources + runtime health ─────────────────────────────────────────
  const sourcesActive = count(sources, (s) => s.active);
  const healthBy = (state: string) => count(health, (h) => h.state === state);
  const healthHealthy = healthBy("healthy");
  const healthDegraded = healthBy("degraded");
  const healthStale = healthBy("stale");
  const healthInactive = healthBy("inactive");
  const sourcesNeedingAttention = healthDegraded + healthStale;

  // ── Discovery leads ──────────────────────────────────────────────────
  const leadsUnresolved = count(leads, (l) => l.status === "unresolved");

  // ── Recent scan activity ─────────────────────────────────────────────
  const scansSucceeded = count(scanLogs, (s) => s.status === "success");
  const scansFailed = count(scanLogs, (s) => s.status === "failed");
  const lastScanAt = scanLogs[0]?.scanFinishedAt ?? scanLogs[0]?.scanStartedAt ?? null;

  // Region rollup for source health: join health summaries to source region.
  const regionBySource = new Map(sources.map((s) => [s.id, s.region]));
  const healthInRegion = (regionMatch: (region: string) => boolean) =>
    health.filter((h) => {
      const region = regionBySource.get(h.sourceId) ?? "";
      return regionMatch(region);
    });
  const euHealth = healthInRegion((r) => /europe/i.test(r));
  const usHealth = healthInRegion((r) => /united states|north america/i.test(r));
  const regionHealthLabel = (rows: typeof health) => {
    if (rows.length === 0) return "no sources mapped";
    const ok = rows.filter((h) => h.state === "healthy").length;
    const bad = rows.filter((h) => h.state === "degraded" || h.state === "stale").length;
    return `${ok}/${rows.length} healthy · ${bad} need attention`;
  };

  // Databases overview rows.
  const databases: Array<{
    name: string;
    primary: string;
    primaryLabel: string;
    breakdown: string;
    tone: Tone;
    href: string;
  }> = [
    {
      name: "Legal database",
      primary: String(updatesPublished),
      primaryLabel: "published entries",
      breakdown: `${updates.length} total · ${updatesNeedsReview} awaiting review`,
      tone: updatesNeedsReview > 0 ? "informative" : "positive",
      href: "/admin/ai-regulation/legal-database",
    },
    {
      name: "AI Law News",
      primary: String(newsPublished),
      primaryLabel: "published news",
      breakdown: `${news.length} total · ${newsAdminOnly} admin-only`,
      tone: news.length === 0 ? "neutral" : "positive",
      href: "/admin/ai-regulation/news",
    },
    {
      name: "Country intelligence",
      primary: `${countriesVerified}/${countries.length}`,
      primaryLabel: "verified profiles",
      breakdown: `${countriesNeedsReview} need review · ${countriesStaleOrFlagged} stale/flagged`,
      tone: countriesNeedsReview > 0 || countriesStaleOrFlagged > 0 ? "warning" : "positive",
      href: "/admin/ai-regulation/countries",
    },
    {
      name: "Source registry",
      primary: `${sourcesActive}/${sources.length}`,
      primaryLabel: "active sources",
      breakdown: `${sourcesNeedingAttention} need attention · ${healthInactive} inactive`,
      tone: sourcesNeedingAttention > 0 ? "warning" : "positive",
      href: "/admin/ai-regulation/sources",
    },
    {
      name: "Discovery leads",
      primary: String(leadsUnresolved),
      primaryLabel: "unresolved leads",
      breakdown: `${leads.length} total tracked`,
      tone: leadsUnresolved > 0 ? "informative" : "neutral",
      href: "/admin/ai-regulation/data-quality",
    },
  ];

  return (
    <SiteShell className="space-y-10" variant="admin" showFooter={false}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
          Admin control center
        </p>
        <h1 className="font-serif text-4xl text-white">Site dashboard</h1>
        <p className="max-w-3xl text-zinc-300">
          One-glance view of the whole site: what is published, the health of
          every database, and the live state of the monitoring agents and their
          sub-agents. Last scan finished {formatDateTime(lastScanAt)}.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/admin/ai-regulation"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
          >
            Review queue →
          </Link>
          <Link
            href="/admin/ai-regulation/review"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
          >
            Batch review →
          </Link>
          <Link
            href="/admin/ai-regulation/legal-database"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
          >
            Legal database →
          </Link>
          <Link
            href="/admin/ai-regulation/data-quality"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
          >
            Data governance →
          </Link>
          <Link
            href="/admin/operations"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
          >
            Operations →
          </Link>
        </div>
      </section>

      {/* ── Operational health band ────────────────────────────────── */}
      <OpsHealthBand
        snapshot={healthSnapshot}
        aiEnabled={env.AI_PROCESSING_ENABLED}
        aiBudgetUsd={env.AI_MONTHLY_BUDGET_USD}
      />

      {/* ── KPI band ───────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <IntelligenceSignal theme="dark" tone="positive" label="Published news" value={String(newsPublished)} note={`${news.length} tracked in total`} />
        <IntelligenceSignal theme="dark" tone="positive" label="Published DB entries" value={String(updatesPublished)} note={`${updatesNeedsReview} awaiting review`} />
        <IntelligenceSignal theme="dark" tone={sourcesNeedingAttention > 0 ? "warning" : "positive"} label="Active sources" value={`${sourcesActive}/${sources.length}`} note={`${sourcesNeedingAttention} need attention`} />
        <IntelligenceSignal theme="dark" tone={countriesNeedsReview > 0 ? "warning" : "positive"} label="Verified countries" value={`${countriesVerified}/${countries.length}`} note={`${countriesNeedsReview} need review`} />
        <IntelligenceSignal theme="dark" tone="neutral" label="Monitoring agents" value={String(agents.regionalSupervisors.reduce((acc, r) => acc + r.managedAgents.length, 0))} note={`${agents.regionalSupervisors.length} regional supervisors`} />
        <IntelligenceSignal theme="dark" tone={scansFailed > 0 ? "warning" : "positive"} label="Recent scans" value={`${scansSucceeded} ok`} note={`${scansFailed} failed of last ${scanLogs.length}`} />
        <IntelligenceSignal theme="dark" tone={leadsUnresolved > 0 ? "informative" : "neutral"} label="Open discovery leads" value={String(leadsUnresolved)} note={`${leads.length} tracked`} />
        <IntelligenceSignal theme="dark" tone="neutral" label="Connectors" value={`${count(capabilities, (c) => c.status === "available")}/${capabilities.length}`} note="API / MCP capabilities ready" />
      </section>

      {/* ── Databases ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-400">
          Databases
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {databases.map((db) => (
            <Link key={db.name} href={db.href} className="group">
              <Card className="h-full border-white/10 bg-white/5 transition group-hover:bg-white/10">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center gap-2">
                    <StatusDot tone={db.tone} />
                    <p className="text-sm font-medium text-zinc-100">{db.name}</p>
                  </div>
                  <p className="font-display text-3xl font-medium uppercase tracking-[-0.05em] text-white">
                    {db.primary}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {db.primaryLabel}
                  </p>
                  <p className="text-sm text-zinc-400">{db.breakdown}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Source health ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-400">
          Source runtime health
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <IntelligenceSignal theme="dark" tone="positive" label="Healthy" value={String(healthHealthy)} />
          <IntelligenceSignal theme="dark" tone="warning" label="Degraded" value={String(healthDegraded)} />
          <IntelligenceSignal theme="dark" tone="warning" label="Stale" value={String(healthStale)} />
          <IntelligenceSignal theme="dark" tone="neutral" label="Inactive" value={String(healthInactive)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <p className="text-sm text-zinc-200">Europe sources</p>
              <p className="text-sm text-zinc-400">{regionHealthLabel(euHealth)}</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <p className="text-sm text-zinc-200">United States sources</p>
              <p className="text-sm text-zinc-400">{regionHealthLabel(usHealth)}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Agents & sub-agents ────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-400">
          Agents &amp; sub-agents
        </h2>

        {/* Global supervisor */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <StatusDot tone="positive" />
              {agents.supervisor.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-7 text-zinc-300">
            {agents.supervisor.role}
          </CardContent>
        </Card>

        {/* Regional supervisors + their sub-agents */}
        <div className="grid gap-4 lg:grid-cols-2">
          {agents.regionalSupervisors.map((supervisor) => (
            <Card key={supervisor.id} className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-white">
                  <span className="flex items-center gap-2">
                    <StatusDot tone="positive" />
                    {supervisor.label}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
                    {supervisor.managedAgents.length} sub-agents
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {supervisor.region} ·{" "}
                  {regionHealthLabel(
                    /europe/i.test(supervisor.region) ? euHealth : usHealth,
                  )}
                </p>
                <ul className="divide-y divide-white/5">
                  {supervisor.managedAgents.map((agent) => (
                    <li
                      key={agent.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span className="text-sm text-zinc-200">{agent.label}</span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                        {"country" in agent && agent.country
                          ? agent.country
                          : "jurisdiction" in agent && agent.jurisdiction
                            ? agent.jurisdiction
                            : agent.scope}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cross-functional agents */}
        {agents.crossFunctionalAgents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {agents.crossFunctionalAgents.map((agent) => (
              <Card key={agent.id} className="border-white/10 bg-white/5">
                <CardContent className="space-y-1 p-5">
                  <div className="flex items-center gap-2">
                    <StatusDot tone="informative" />
                    <p className="text-sm font-medium text-zinc-100">{agent.label}</p>
                    <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                      {agent.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{agent.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>

      {/* ── Connectors / capabilities ──────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.28em] text-zinc-400">
          Agent connectors &amp; tools
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {capabilities.map((cap) => {
            const ready = cap.status === "available";
            return (
              <Card key={cap.id} className="border-white/10 bg-white/5">
                <CardContent className="space-y-2 p-5">
                  <div className="flex items-center gap-2">
                    <StatusDot tone={ready ? "positive" : "warning"} />
                    <p className="text-sm font-medium text-zinc-100">{cap.label}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    {cap.regions.join(" · ")} · {ready ? "ready" : "needs setup"}
                  </p>
                  {!ready && cap.userAction ? (
                    <p className="text-sm leading-6 text-amber-300/80">{cap.userAction}</p>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}
