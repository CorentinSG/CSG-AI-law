import type { Metadata } from "next";
import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { HubOrientation } from "@/components/site/hub-orientation";
import { HubScrollNav } from "@/components/site/hub-scroll-nav";
import { LiveLegalIntelligencePanel } from "@/components/site/live-legal-intelligence-panel";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { UsAiTimeline } from "@/components/site/us-ai-timeline";
import { SiteShell } from "@/components/site/shell";
import { UsImplementationMap } from "@/components/site/us-implementation-map.lazy";
import { UpdateCard } from "@/components/site/update-card";
import { Card, CardContent } from "@/components/ui/card";
import { getSourceVerificationRecordsForHub } from "@/content/ai-regulation/source-verification";
import {
  usFederalBaselineEntries,
  usFederalTimelineEntries,
} from "@/content/ai-regulation/us-ai-legal-baseline";
import {
  usAiCaseLawEntries,
  usAiCaseLawSources,
} from "@/content/ai-regulation/us-ai-case-law";
import { usAiSoftLawBaseline } from "@/content/ai-regulation/us-ai-soft-law";
import {
  filterRegionalLiveItems,
  getRegionalLastCheckedAt,
  getRegionalSourceActivity,
} from "@/content/ai-regulation/live-intelligence";
import { normalizeNewsItemRecord } from "@/content/ai-regulation/news";
import { usStateMapStatuses } from "@/content/ai-regulation/us-map";
import { getPriorityUsStateProfiles } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { getUsGeoPaths } from "@/lib/geo-paths";

export const metadata: Metadata = {
  title: "United States Hub",
  description:
    "United States AI regulation monitoring across federal agencies, state-level regulators, official soft-law sources, and human-reviewed legal intelligence entries.",
};

// ISR (T-RT0C): serve from cache, revalidate every 5 min. Admin review/edit
// actions call revalidatePath, so published changes surface promptly.
export const revalidate = 300;

const unitedStatesFocusCards = [
  { title: "Federal", body: "Official federal AI signals." },
  { title: "States", body: "State activity, kept separate from federal." },
  { title: "What to watch", body: "Soft law and standards, clearly labeled." },
];

export default async function UnitedStatesAiRegulationPage() {
  const [updates, newsItems, sources, sourceHealthChecks] = await Promise.all([
    updateRepository.listPublicUpdates({ region: "North America" }),
    updateRepository.getPublicNewsItems(30),
    updateRepository.getSources(),
    updateRepository.getSourceHealthChecks(undefined, 30),
  ]);

  const verificationRecords = getSourceVerificationRecordsForHub("united-states", {
    sources,
    sourceHealthChecks,
  });
  const priorityStates = getPriorityUsStateProfiles();
  const regionalLiveItems = filterRegionalLiveItems(
    newsItems.map(normalizeNewsItemRecord),
    "North America",
  ).slice(0, 6);
  const liveLastCheckedAt = getRegionalLastCheckedAt(
    sourceHealthChecks,
    sources,
    "North America",
  );
  const liveActivity = getRegionalSourceActivity(
    sourceHealthChecks,
    sources,
    "North America",
  );

  return (
    <SiteShell className="space-y-10">
      {/* --- Header: brief, editorial, actionable --- */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <SectionHeading
            eyebrow="United States intelligence hub"
            title="United States"
            description="What changed federally, which states are moving."
          />
          <Link
            href="/ai-regulation/europe"
            className="mt-2 shrink-0 text-sm uppercase tracking-[0.16em] text-zinc-600 underline decoration-black/15 underline-offset-4"
          >
            Europe hub →
          </Link>
        </div>

        {/* Compact focus cards */}
        <MotionStagger className="grid gap-3 sm:grid-cols-3" stagger={0.08}>
          {unitedStatesFocusCards.map((card) => (
            <MotionStaggerItem key={card.title}>
              <div className="rounded-[1.5rem] border border-black/6 bg-white/80 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">{card.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">{card.body}</p>
              </div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </section>

      <HubScrollNav
        sections={[
          { id: "live", label: "Live" },
          { id: "federal", label: "Federal" },
          { id: "timeline", label: "Timeline" },
          { id: "states", label: "States" },
          { id: "profiles", label: "Profiles" },
          { id: "governance", label: "Governance" },
          { id: "sources", label: "Sources" },
          { id: "published", label: "Published" },
        ]}
      />

      <HubOrientation />

      {/* --- Section 1: Live intelligence FIRST --- */}
      <section id="live" className="scroll-mt-28 space-y-5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-600">
            Live U.S. monitoring
          </p>
        </div>
        <LiveLegalIntelligencePanel
          title="Latest U.S. AI law developments"
          description="Federal and state-level AI law signals."
          regionLabel="United States"
          items={regionalLiveItems}
          lastCheckedAt={liveLastCheckedAt}
          activity={liveActivity}
        />
      </section>

      <section id="federal" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Federal baseline"
          title="Federal AI legal architecture"
          description="Verified federal rulemaking, agency, and standards baseline."
        />
        <MotionStagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" stagger={0.07}>
          {usFederalBaselineEntries.slice(0, 6).map((entry) => (
            <MotionStaggerItem key={entry.id}>
              <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,15,15,0.07)]">
                <CardContent className="space-y-3 p-6">
                  <p className="font-display text-2xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                    {entry.shortTitle}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    {entry.authorityType.replaceAll("_", " ")} / {entry.bindingStatus.replaceAll("_", " ")}
                  </p>
                  <p className="text-sm leading-7 text-zinc-700">{entry.summary}</p>
                  <a
                    href={entry.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm uppercase tracking-[0.16em] text-zinc-900 underline decoration-black/15 underline-offset-4"
                  >
                    Official source
                  </a>
                </CardContent>
              </Card>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </section>

      <section id="timeline" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="U.S. timeline"
          title="U.S. AI law source timeline"
          description="Verified official-source checkpoints, not a full history."
        />
        <Card className="rounded-[2rem] border-white/10 bg-[linear-gradient(180deg,rgba(12,18,28,0.96),rgba(17,24,39,0.9))] text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
          <CardContent className="p-6 md:p-8">
            <UsAiTimeline entries={usFederalTimelineEntries} />
          </CardContent>
        </Card>
      </section>

      <section id="states" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="State-by-state baseline"
          title="U.S. state AI law map"
          description="All 50 states plus D.C. — enacted only when officially verified."
        />
        <Card className="rounded-[2rem] border-black/6 bg-white/70 shadow-[0_18px_50px_rgba(15,15,15,0.05)]">
          <CardContent className="space-y-6 p-6 md:p-8">
            <UsImplementationMap states={usStateMapStatuses} paths={getUsGeoPaths()} />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.3rem] border border-black/6 bg-zinc-50 p-4 text-sm text-zinc-600">
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
                  Needs review
                </p>
                <p className="mt-2">
                  No state-specific AI law status is asserted without official-source review.
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-black/6 bg-zinc-50 p-4 text-sm text-zinc-600">
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
                  Official source required
                </p>
                <p className="mt-2">
                  Discovery trackers can generate leads, but official state sources control.
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-black/6 bg-zinc-50 p-4 text-sm text-zinc-600">
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
                  Published-only monitor
                </p>
                <p className="mt-2">
                  Drafts, discovery leads, and unverified state claims remain private.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="profiles" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Priority states"
          title="First-wave state profiles"
          description="First pass: CA, CO, NY, IL, TX, CT, UT, VA, WA, MD."
        />
        <MotionStagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" stagger={0.07}>
          {priorityStates.map((profile) => (
            <MotionStaggerItem key={profile.slug}>
              <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,15,15,0.07)]">
                <CardContent className="space-y-3 p-6">
                  <p className="font-display text-2xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                    {profile.stateName}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    {profile.aiLawStatusLabel} / confidence {profile.confidenceLevel}
                  </p>
                  <p className="text-sm leading-7 text-zinc-700">{profile.publicSummary}</p>
                  <Link
                    href={`/ai-regulation/united-states/${profile.slug}`}
                    className="inline-block text-sm uppercase tracking-[0.16em] text-zinc-900 underline decoration-black/15 underline-offset-4"
                  >
                    Open state profile
                  </Link>
                </CardContent>
              </Card>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </section>

      <section id="governance" className="scroll-mt-28 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Case law architecture"
            title="U.S. case-law sources"
            description="Court sources only — no invented cases or holdings."
          />
          <div className="space-y-4">
            {usAiCaseLawSources.map((source) => (
              <Card
                key={source.id}
                className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]"
              >
                <CardContent className="space-y-3 p-6">
                  <p className="font-display text-2xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                    {source.name}
                  </p>
                  <p className="text-sm leading-7 text-zinc-700">{source.note}</p>
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm uppercase tracking-[0.16em] text-zinc-900 underline decoration-black/15 underline-offset-4"
                  >
                    Source reference
                  </a>
                </CardContent>
              </Card>
            ))}
            <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
              <CardContent className="p-6 text-sm leading-7 text-zinc-700">
                Verified U.S. AI case entries currently published from this baseline:{" "}
                {usAiCaseLawEntries.length}. The system prefers no case entry over an
                unsupported case summary.
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Soft law and standards"
            title="U.S. governance frameworks"
            description="Soft law and standards, classified separately from binding law."
          />
          <div className="space-y-4">
            {usAiSoftLawBaseline.slice(0, 5).map((entry) => (
              <Card
                key={entry.id}
                className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]"
              >
                <CardContent className="space-y-3 p-6">
                  <p className="font-display text-2xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                    {entry.title}
                  </p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    {entry.authorityType.replaceAll("_", " ")} / {entry.bindingStatus.replaceAll("_", " ")}
                  </p>
                  <p className="text-sm leading-7 text-zinc-700">{entry.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="sources" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Official source posture"
          title="U.S. monitoring sources"
          description="Only reachable official public sources; blocked ones stay inactive."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {verificationRecords.map((record) => (
            <Card
              key={record.sourceId}
              className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]"
            >
              <CardContent className="space-y-3 p-6">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-700">
                    {record.sourceId}
                  </span>
                  <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-700">
                    {record.responseStatus ?? "n/a"}
                  </span>
                  <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-700">
                    {record.recommendation}
                  </span>
                </div>
                <a
                  href={record.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                >
                  {record.sourceUrl}
                </a>
                <p className="text-sm leading-7 text-zinc-700">{record.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="published" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Published monitor items"
          title="Latest published U.S. entries"
          description="Only human-reviewed, published items appear here."
        />
        <Card className="rounded-[2rem] border-black/6 bg-white/70 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardContent className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
            {updates.length > 0 ? (
              updates.slice(0, 6).map((update) => (
                <UpdateCard
                  key={update.id}
                  update={update}
                  href={`/ai-regulation/${update.id}`}
                />
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-black/6 bg-white p-6 text-sm leading-7 text-zinc-700 xl:col-span-3">
                No published U.S.-specific entries are currently available. Monitoring and review can continue without exposing unpublished material.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
