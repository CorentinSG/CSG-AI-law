import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getSourceRuntimeHealthSummaries } from "@/agents/ai-regulation/sourceRuntimeHealth";
import {
  listGlobalMonitoringAgents,
} from "@/agents/ai-regulation/globalMonitoringSupervisorAgent";
import { listAgentApiCapabilities } from "@/agents/ai-regulation/agentApiCapabilities";
import { buildHealthSnapshot } from "@/lib/health";
import { env } from "@/lib/env";
import {
  drainNextQueuedJob,
  recoverStaleJobs,
  triggerSourceScan,
} from "@/app/admin/ai-regulation/actions";
import { PendingButton } from "@/app/admin/_components/action-button";
import {
  BreakdownBars,
  DonutChart,
  MonthlyBars,
  ScanStrip,
  type MonthlyPoint,
} from "@/app/admin/_components/admin-charts";
import { OpsHealthBand } from "@/components/site/ops-health-band";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent } from "@/components/ui/card";
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

function lastTwelveMonths(): Array<{ key: string; label: string }> {
  const now = new Date();
  const months: Array<{ key: string; label: string }> = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
    });
  }
  return months;
}

function toMonthKey(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const SECTION_TITLE =
  "font-mono text-xs uppercase tracking-[0.28em] text-zinc-400";

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

  // ── Rollups ──────────────────────────────────────────────────────────
  const updatesPublished = count(updates, (u) => u.status === "published");
  const updatesNeedsReview = count(updates, (u) => u.status === "needs_review");
  const newsPublished = count(news, (n) => n.publicVisibilityStatus === "public");
  const newsAdminOnly = news.length - newsPublished;
  const countriesVerified = count(countries, (c) => c.reviewStatus === "verified");
  const countriesNeedsReview = count(countries, (c) => c.reviewStatus === "needs_review");
  const countriesStaleOrFlagged = count(
    countries,
    (c) => c.reviewStatus === "stale" || c.reviewStatus === "flagged",
  );
  const sourcesActive = count(sources, (s) => s.active);
  const healthBy = (state: string) => count(health, (h) => h.state === state);
  const healthHealthy = healthBy("healthy");
  const healthDegraded = healthBy("degraded");
  const healthStale = healthBy("stale");
  const healthInactive = healthBy("inactive");
  const sourcesNeedingAttention = healthDegraded + healthStale;
  const leadsUnresolved = count(leads, (l) => l.status === "unresolved");
  const scansFailed = count(scanLogs, (s) => s.status === "failed");
  const scansSucceeded = count(scanLogs, (s) => s.status === "success");
  const lastScanAt = scanLogs[0]?.scanFinishedAt ?? scanLogs[0]?.scanStartedAt ?? null;
  const connectorsReady = count(capabilities, (c) => c.status === "available");
  const connectorsNeedSetup = capabilities.length - connectorsReady;

  // ── Monthly trend (published DB entries vs published news) ───────────
  const months = lastTwelveMonths();
  const monthIndex = new Map(months.map((m, i) => [m.key, i]));
  const monthly: MonthlyPoint[] = months.map((m) => ({ label: m.label, a: 0, b: 0 }));
  for (const u of updates) {
    if (u.status !== "published") continue;
    const key = toMonthKey(u.publishedAt ?? u.publicationDate ?? u.createdAt);
    const idx = key != null ? monthIndex.get(key) : undefined;
    if (idx != null) monthly[idx].a += 1;
  }
  for (const n of news) {
    if (n.publicVisibilityStatus !== "public") continue;
    const key = toMonthKey(n.publicationDate ?? n.detectedAt);
    const idx = key != null ? monthIndex.get(key) : undefined;
    if (idx != null) monthly[idx].b += 1;
  }

  // ── Published entries by region (top 6) ──────────────────────────────
  const regionCounts = new Map<string, number>();
  for (const u of updates) {
    if (u.status !== "published") continue;
    const region = u.region || "Unmapped";
    regionCounts.set(region, (regionCounts.get(region) ?? 0) + 1);
  }
  const regionRows = [...regionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value, color: "#a1a1aa" }));

  // ── Needs-attention list ─────────────────────────────────────────────
  const attentionItems = [
    {
      count: updatesNeedsReview,
      label: "database entries awaiting review",
      hint: "Tick the items, then approve or reject them all at once.",
      href: "/admin/ai-regulation/review",
      cta: "Open batch review",
    },
    {
      count: sourcesNeedingAttention,
      label: "sources degraded or stale",
      hint: "Open the source, check its last error, rescan or deactivate it.",
      href: "/admin/ai-regulation/sources",
      cta: "Open sources",
    },
    {
      count: countriesNeedsReview + countriesStaleOrFlagged,
      label: "country profiles to re-verify",
      hint: "Re-read the flagged profile and mark it verified.",
      href: "/admin/ai-regulation/countries",
      cta: "Open countries",
    },
    {
      count: leadsUnresolved,
      label: "discovery leads to resolve",
      hint: "Confirm an official source for each lead, or reject it.",
      href: "/admin/ai-regulation/data-quality",
      cta: "Open data governance",
    },
    {
      count: scansFailed,
      label: `failed scans in the last ${scanLogs.length}`,
      hint: "Check the error, then rerun the scan with the button above.",
      href: "/admin/operations",
      cta: "Open operations",
    },
    {
      count: connectorsNeedSetup,
      label: "connectors needing setup",
      hint: "Each one lists the exact key or account it still needs.",
      href: "#connectors",
      cta: "See connectors",
    },
  ].filter((item) => item.count > 0);
  const attentionTotal = attentionItems.reduce((acc, i) => acc + i.count, 0);

  // ── Databases overview rows ──────────────────────────────────────────
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
    {
      name: "Review queue",
      primary: String(updatesNeedsReview),
      primaryLabel: "items waiting",
      breakdown: "Approve, publish, or reject in bulk",
      tone: updatesNeedsReview > 0 ? "informative" : "positive",
      href: "/admin/ai-regulation/review",
    },
  ];

  const navLinks = [
    { label: "Review queue", href: "/admin/ai-regulation" },
    { label: "Batch review", href: "/admin/ai-regulation/review" },
    { label: "Legal database", href: "/admin/ai-regulation/legal-database" },
    { label: "News", href: "/admin/ai-regulation/news" },
    { label: "Sources", href: "/admin/ai-regulation/sources" },
    { label: "Countries", href: "/admin/ai-regulation/countries" },
    { label: "Data governance", href: "/admin/ai-regulation/data-quality" },
    { label: "Operations", href: "/admin/operations" },
  ];

  return (
    <SiteShell className="space-y-10" variant="admin" showFooter={false}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
          Admin control center
        </p>
        <h1 className="font-serif text-4xl text-white">Site dashboard</h1>
        <p className="max-w-3xl text-lg text-zinc-300">
          {attentionTotal === 0 ? (
            <>
              <span className="text-emerald-300">Everything is running normally.</span>{" "}
              Nothing needs your attention right now.
            </>
          ) : (
            <>
              <span className="text-amber-300">
                {attentionTotal} item{attentionTotal > 1 ? "s" : ""} need your attention
              </span>{" "}
              — everything else is running normally.
            </>
          )}{" "}
          <span className="text-zinc-500">
            Last scan finished {formatDateTime(lastScanAt)}.
          </span>
        </p>
        <nav className="flex flex-wrap gap-2 pt-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/10"
            >
              {link.label} →
            </Link>
          ))}
        </nav>
      </section>

      {/* ── How the site runs (3-step guide) ───────────────────────── */}
      <section className="space-y-4">
        <h2 className={SECTION_TITLE}>How the site runs — your 3-step workflow</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <p className="font-mono text-2xl text-emerald-300">1</p>
              <p className="text-sm font-medium text-zinc-100">The agents collect</p>
              <p className="text-sm leading-6 text-zinc-400">
                Monitoring agents scan official sources automatically, every day.
                You never have to do this by hand — but you can force a fresh
                pass anytime with the scan button below.
              </p>
              <Link
                href="/admin/operations"
                className="mt-auto inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-100 transition hover:bg-white/15"
              >
                Check the machines →
              </Link>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <p className="font-mono text-2xl text-emerald-300">2</p>
              <p className="text-sm font-medium text-zinc-100">You review</p>
              <p className="text-sm leading-6 text-zinc-400">
                Items from official sources publish themselves. Anything
                uncertain waits for you: open the review queue, tick the items,
                approve or reject them in bulk — a few clicks, done.
              </p>
              <Link
                href="/admin/ai-regulation/review"
                className="mt-auto inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-100 transition hover:bg-white/15"
              >
                {updatesNeedsReview > 0
                  ? `Review ${updatesNeedsReview} waiting item${updatesNeedsReview > 1 ? "s" : ""} →`
                  : "Open the review queue →"}
              </Link>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <p className="font-mono text-2xl text-emerald-300">3</p>
              <p className="text-sm font-medium text-zinc-100">The site updates itself</p>
              <p className="text-sm leading-6 text-zinc-400">
                Everything you approve appears on the public site immediately —
                news, legal database, country pages. Nothing else to do.
              </p>
              <Link
                href="/ai-regulation"
                className="mt-auto inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-100 transition hover:bg-white/15"
              >
                See the public site →
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── One-click actions ──────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className={SECTION_TITLE}>One-click actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-400/20 bg-emerald-400/[0.04]">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <form action={triggerSourceScan}>
                <PendingButton
                  pendingLabel="Scanning… (can take a minute)"
                  className="bg-emerald-400/15 hover:bg-emerald-400/25"
                >
                  ▶ Run a monitoring scan
                </PendingButton>
              </form>
              <p className="text-sm leading-6 text-zinc-400">
                <span className="text-zinc-200">Fetches the latest legal news right now</span>{" "}
                from all monitored sources instead of waiting for the daily
                automatic pass. Safe to press anytime, as often as you like.
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <form action={drainNextQueuedJob}>
                <PendingButton pendingLabel="Processing…">
                  Process next queued job
                </PendingButton>
              </form>
              <p className="text-sm leading-6 text-zinc-400">
                <span className="text-zinc-200">Runs one waiting scan by hand.</span>{" "}
                Use it if scans are piling up in the queue and you want to push
                them through without waiting for the background worker.
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <form action={recoverStaleJobs}>
                <PendingButton pendingLabel="Recovering…">
                  Unblock stuck jobs
                </PendingButton>
              </form>
              <p className="text-sm leading-6 text-zinc-400">
                <span className="text-zinc-200">Frees scans that froze mid-run</span>{" "}
                so they can be retried. Use it if a scan has looked
                &ldquo;running&rdquo; for a long time with no result. Harmless
                if nothing is stuck.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Needs your attention ───────────────────────────────────── */}
      {attentionItems.length > 0 ? (
        <section className="space-y-4">
          <h2 className={SECTION_TITLE}>Needs your attention</h2>
          <Card className="border-amber-400/20 bg-amber-400/[0.04]">
            <CardContent className="divide-y divide-white/5 p-2">
              {attentionItems.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-wrap items-center gap-3 px-3 py-3"
                >
                  <StatusDot tone="warning" />
                  <div className="min-w-0">
                    <p className="text-sm text-zinc-200">
                      <span className="font-mono text-base text-white">{item.count}</span>{" "}
                      {item.label}
                    </p>
                    <p className="text-xs text-zinc-500">{item.hint}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="ml-auto inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-100 transition hover:bg-white/15"
                  >
                    {item.cta} →
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* ── Operational health band ────────────────────────────────── */}
      <OpsHealthBand
        snapshot={healthSnapshot}
        aiEnabled={env.AI_PROCESSING_ENABLED}
        aiBudgetUsd={env.AI_MONTHLY_BUDGET_USD}
      />

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className={SECTION_TITLE}>Trends &amp; distribution</h2>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Publications per month
                </p>
                <p className="text-xs text-zinc-500">
                  Last 12 months, everything visible on the public site
                </p>
              </div>
              <MonthlyBars
                points={monthly}
                aLabel="Database entries"
                bLabel="News items"
              />
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-medium text-zinc-100">Source health</p>
                <p className="text-xs text-zinc-500">
                  Runtime state of every monitored source
                </p>
              </div>
              <DonutChart
                centerLabel="sources"
                segments={[
                  { label: "Healthy", value: healthHealthy, color: "#34d399" },
                  { label: "Degraded", value: healthDegraded, color: "#fbbf24" },
                  { label: "Stale", value: healthStale, color: "#fb7185" },
                  { label: "Inactive", value: healthInactive, color: "#71717a" },
                ]}
              />
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-medium text-zinc-100">Review pipeline</p>
                <p className="text-xs text-zinc-500">
                  Where every database entry sits right now
                </p>
              </div>
              <BreakdownBars
                rows={[
                  {
                    label: "Published",
                    value: updatesPublished,
                    color: "#34d399",
                  },
                  {
                    label: "Needs review",
                    value: updatesNeedsReview,
                    color: "#fbbf24",
                  },
                  {
                    label: "Approved",
                    value: count(updates, (u) => u.status === "approved"),
                    color: "#38bdf8",
                  },
                  {
                    label: "Rejected",
                    value: count(updates, (u) => u.status === "rejected"),
                    color: "#fb7185",
                  },
                  {
                    label: "Archived",
                    value: count(updates, (u) => u.status === "archived"),
                    color: "#71717a",
                  },
                ]}
              />
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-medium text-zinc-100">
                  Published entries by region
                </p>
                <p className="text-xs text-zinc-500">Top regions in the legal database</p>
              </div>
              <BreakdownBars rows={regionRows} />
            </CardContent>
          </Card>
        </div>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-zinc-100">
                Last {scanLogs.length} scans
              </p>
              <p className="text-xs text-zinc-500">
                {scansSucceeded} succeeded · {scansFailed} failed · newest first
              </p>
            </div>
            <ScanStrip
              scans={scanLogs.map((s) => ({
                id: s.id,
                status: s.status,
                label: `${formatDateTime(s.scanFinishedAt ?? s.scanStartedAt)} — ${s.status} · ${s.newItemsDetected} new items`,
              }))}
            />
          </CardContent>
        </Card>
      </section>

      {/* ── Databases ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className={SECTION_TITLE}>Databases</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {databases.map((db) => (
            <Card
              key={db.name}
              className="h-full border-white/10 bg-white/5 transition hover:bg-white/[0.08]"
            >
              <CardContent className="flex h-full flex-col gap-3 p-5">
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
                <Link
                  href={db.href}
                  className="mt-auto inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-100 transition hover:bg-white/15"
                >
                  Manage →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Agents (condensed) ─────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className={SECTION_TITLE}>Monitoring agents</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {agents.regionalSupervisors.map((supervisor) => (
            <Card key={supervisor.id} className="border-white/10 bg-white/5">
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center gap-2">
                  <StatusDot tone="positive" />
                  <p className="text-sm font-medium text-zinc-100">
                    {supervisor.label}
                  </p>
                  <span className="ml-auto font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
                    {supervisor.managedAgents.length} sub-agents
                  </span>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {supervisor.region}
                </p>
                <details className="group">
                  <summary className="cursor-pointer list-none text-sm text-zinc-400 transition hover:text-zinc-200">
                    <span className="group-open:hidden">Show sub-agents ▾</span>
                    <span className="hidden group-open:inline">Hide sub-agents ▴</span>
                  </summary>
                  <ul className="mt-2 divide-y divide-white/5">
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
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
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

      {/* ── Connectors ─────────────────────────────────────────────── */}
      <section id="connectors" className="space-y-4">
        <h2 className={SECTION_TITLE}>Agent connectors &amp; tools</h2>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="divide-y divide-white/5 p-2">
            {capabilities.map((cap) => {
              const ready = cap.status === "available";
              return (
                <div key={cap.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                  <StatusDot tone={ready ? "positive" : "warning"} />
                  <p className="text-sm font-medium text-zinc-100">{cap.label}</p>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                    {cap.regions.join(" · ")}
                  </span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-3 py-1 text-xs",
                      ready
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-amber-400/10 text-amber-300",
                    )}
                  >
                    {ready ? "Ready" : "Needs setup"}
                  </span>
                  {!ready && cap.userAction ? (
                    <p className="basis-full pl-5 text-sm leading-6 text-amber-300/80">
                      {cap.userAction}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
