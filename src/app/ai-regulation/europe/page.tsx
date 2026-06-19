import type { Metadata } from "next";
import Link from "next/link";

import { getEuropeLiveLegalIntelligenceData } from "@/agents/ai-regulation/euLegalNewsAgent";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { EuAiTimeline } from "@/components/site/eu-ai-timeline";
import { EuropeImplementationMap } from "@/components/site/europe-implementation-map.lazy";
import { HubOrientation } from "@/components/site/hub-orientation";
import { HubScrollNav } from "@/components/site/hub-scroll-nav";
import { LiveLegalIntelligencePanel } from "@/components/site/live-legal-intelligence-panel";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { UpdateCard } from "@/components/site/update-card";
import { Card, CardContent } from "@/components/ui/card";
import {
  europeAiActBaseline,
  europeGovernanceActors,
} from "@/content/ai-regulation/europe-ai-legal-baseline";
import {
  europeAiCaseLawEntries,
  europeAiCaseLawSources,
} from "@/content/ai-regulation/europe-ai-case-law";
import { europeAiSoftLawBaseline } from "@/content/ai-regulation/europe-ai-soft-law";
import { getPriorityEuropeCountryProfiles } from "@/content/ai-regulation/europe-country-profiles";
import { euAiTimelineEntries } from "@/content/ai-regulation/eu-timeline";
import { europeCountryStatuses } from "@/content/ai-regulation/europe-map";
import { getSourceVerificationRecordsForHub } from "@/content/ai-regulation/source-verification";

export const metadata: Metadata = {
  title: "Europe Hub",
  description:
    "European Union and broader Europe AI regulation monitoring across official EU institutions, regulators, and carefully labeled soft-law or standards materials.",
};

// ISR (T-RT0C): serve from cache, revalidate every 5 min. Admin review/edit
// actions call revalidatePath, so published changes surface promptly.
export const revalidate = 300;

const authorityLayerLabel = {
  binding_law: "Binding EU law",
  eu_guidance: "Official guidance source",
  governance_body: "Governance body",
  technical_standard: "Technical standard",
  soft_law: "Soft law",
  case_law_source: "Case-law source",
} as const;

const governanceBindingLabel = {
  not_binding_by_itself: "Not binding law by itself",
  institutional_role_under_binding_law: "Institutional role under binding law",
  needs_article_level_review: "Needs article-level review",
} as const;

const softLawBindingLabel = {
  non_binding: "Non-binding",
  binding_if_incorporated: "Binding only if incorporated",
  needs_review: "Legal effect under review",
} as const;

const europeFocusCards = [
  { title: "EU level", body: "AI Act milestones and Union-level signals." },
  { title: "Member States", body: "Status only when officially verified." },
  { title: "What to watch", body: "Guidance, soft law, and standards, tracked separately." },
];

export default async function EuropeAiRegulationPage() {
  const [updates, sources, euLiveData, sourceHealthChecks] = await Promise.all([
    updateRepository.listPublicUpdates({ region: "Europe" }),
    updateRepository.getSources(),
    getEuropeLiveLegalIntelligenceData(6),
    updateRepository.getSourceHealthChecks(undefined, 60),
  ]);

  const countryProfiles = getPriorityEuropeCountryProfiles();
  const verificationRecords = getSourceVerificationRecordsForHub("europe", {
    sources,
    sourceHealthChecks,
  });
  const verifiedSourceIds = new Set(verificationRecords.map((record) => record.sourceId));
  const visibleSources = sources.filter((source) => verifiedSourceIds.has(source.id));

  return (
    <SiteShell className="space-y-10">
      {/* --- Header: brief, editorial, actionable --- */}
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <SectionHeading
            eyebrow="European intelligence hub"
            title="Europe"
            description="What changed, what is binding, who is moving."
          />
          <Link
            href="/ai-regulation/united-states"
            className="mt-2 shrink-0 text-sm uppercase tracking-[0.16em] text-zinc-600 underline decoration-black/15 underline-offset-4"
          >
            US hub →
          </Link>
        </div>

        {/* Compact methodology note */}
        <div className="grid gap-3 sm:grid-cols-3">
          {europeFocusCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[1.5rem] border border-black/6 bg-white/80 p-4 shadow-sm"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">{card.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <HubScrollNav
        sections={[
          { id: "live", label: "Live" },
          { id: "ai-act", label: "AI Act" },
          { id: "timeline", label: "Timeline" },
          { id: "governance", label: "Governance" },
          { id: "standards", label: "Standards" },
          { id: "map", label: "Map" },
          { id: "countries", label: "Countries" },
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
            Live EU monitoring
          </p>
        </div>
        <LiveLegalIntelligencePanel
          title="Latest Europe AI law developments"
          description="Ranked by EU legal relevance and recency."
          regionLabel="Europe"
          items={euLiveData.items.map((entry) => entry.item)}
          lastCheckedAt={euLiveData.lastCheckedAt}
          activity={euLiveData.activity}
        />
      </section>

      <section id="ai-act" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Verified legal baseline"
          title="EU AI Act baseline"
          description="Source-backed baseline for Regulation (EU) 2024/1689."
        />
        <Card className="rounded-[2rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="font-display text-3xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                {europeAiActBaseline.shortTitle}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-900">
                  {authorityLayerLabel[europeAiActBaseline.authorityLayer]}
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-sky-900">
                  {europeAiActBaseline.bindingStatusLabel.replaceAll("_", " ")}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-700">
                  Citation {europeAiActBaseline.citationQualityStatus}
                </span>
              </div>
              <p className="text-sm leading-7 text-zinc-700">
                {europeAiActBaseline.officialTitle}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-black/6 bg-zinc-50 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    CELEX
                  </p>
                  <p className="mt-2 text-sm text-zinc-900">
                    {europeAiActBaseline.celexNumber}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/6 bg-zinc-50 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    Published
                  </p>
                  <p className="mt-2 text-sm text-zinc-900">
                    {europeAiActBaseline.datePublished}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/6 bg-zinc-50 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    In force
                  </p>
                  <p className="mt-2 text-sm text-zinc-900">
                    {europeAiActBaseline.dateEnteredIntoForce}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-7 text-zinc-700">
                {europeAiActBaseline.scope}
              </p>
              <a
                href={europeAiActBaseline.eurLexUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm uppercase tracking-[0.16em] text-zinc-900 underline decoration-black/15 underline-offset-4"
              >
                Open official EUR-Lex text
              </a>
            </div>
            <div className="space-y-3">
              {europeAiActBaseline.phasedApplicationDates.map((milestone) => (
                <div
                  key={`${milestone.date}-${milestone.label}`}
                  className="rounded-2xl border border-black/6 bg-zinc-50 p-4"
                >
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    {milestone.date} / confidence {milestone.confidence}
                  </p>
                  <p className="mt-2 font-medium text-zinc-950">{milestone.label}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-700">
                    {milestone.legalEffect}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="timeline" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="EU timeline"
          title="European Union AI regulatory timeline"
          description="Verified milestones, each linked to an official source."
        />
        <Card className="rounded-[2rem] border-white/10 bg-[linear-gradient(180deg,rgba(12,18,28,0.96),rgba(17,24,39,0.9))] text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
          <CardContent className="p-6 md:p-8">
            <EuAiTimeline entries={euAiTimelineEntries} />
          </CardContent>
        </Card>
      </section>

      <section id="governance" className="scroll-mt-28 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Governance baseline"
            title="EU governance actors"
            description="Institutions and posture — shown separately from binding law."
          />
          <div className="space-y-4">
            {europeGovernanceActors.map((actor) => (
              <Card
                key={actor.id}
                className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]"
              >
                <CardContent className="space-y-3 p-6">
                  <p className="font-display text-2xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                    {actor.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-900">
                      {authorityLayerLabel[actor.authorityLayer]}
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-700">
                      {governanceBindingLabel[actor.bindingStatusLabel]}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-zinc-700">{actor.role}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    citation {actor.citationQualityStatus} / confidence {actor.confidenceLevel}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Case law architecture"
            title="European case-law sources"
            description="Conservative, source-backed CJEU entries."
          />
          <div className="space-y-4">
            {europeAiCaseLawSources.map((source) => (
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
                    Official source
                  </a>
                </CardContent>
              </Card>
            ))}
            {europeAiCaseLawEntries.map((entry) => (
              <Card
                key={entry.id}
                className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]"
              >
                <CardContent className="space-y-3 p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-display text-2xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                      {entry.title}
                    </p>
                    <span className="rounded-full border border-black/8 bg-zinc-50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-600">
                      {entry.docketOrCaseNumber}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-zinc-700">{entry.shortSummary}</p>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    {entry.date} / citation {entry.citationQualityStatus} / status{" "}
                    {entry.status.replaceAll("_", " ")}
                  </p>
                  <a
                    href={entry.officialSourceUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm uppercase tracking-[0.16em] text-zinc-900 underline decoration-black/15 underline-offset-4"
                  >
                    Official case source
                  </a>
                </CardContent>
              </Card>
            ))}
            <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
              <CardContent className="p-6 text-sm leading-7 text-zinc-700">
                Specifically verified European case-law entries currently stored in this
                baseline: {europeAiCaseLawEntries.length}. These entries remain
                conservative and reviewable; the system still prefers no case entry over
                an unsupported case summary.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="standards" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Soft law and standards"
          title="European and international governance baseline"
          description="Soft law and standards, labeled separately from binding law."
        />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.3rem] border border-black/6 bg-zinc-50 p-4 text-sm text-zinc-700">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Binding law
            </p>
            <p className="mt-2">
              EU regulations and other official legal texts that create legal obligations directly.
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-black/6 bg-zinc-50 p-4 text-sm text-zinc-700">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Guidance and governance
            </p>
            <p className="mt-2">
              Official institutions, guidance pages, and implementation materials that explain or support the legal framework but are not the same as binding law.
            </p>
          </div>
          <div className="rounded-[1.3rem] border border-black/6 bg-zinc-50 p-4 text-sm text-zinc-700">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
              Soft law and standards
            </p>
            <p className="mt-2">
              Non-binding frameworks, standards, or best-practice materials unless separately incorporated by a legal source.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {europeAiSoftLawBaseline.map((entry) => (
            <Card
              key={entry.id}
              className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]"
            >
              <CardContent className="space-y-3 p-6">
                <p className="font-display text-2xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                  {entry.title}
                </p>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  {entry.authorityType.replaceAll("_", " ")} / {softLawBindingLabel[entry.bindingStatus]}
                </p>
                <p className="text-sm leading-7 text-zinc-700">{entry.summary}</p>
                <a
                  href={entry.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm uppercase tracking-[0.16em] text-zinc-900 underline decoration-black/15 underline-offset-4"
                >
                  Official source
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="map" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Member State implementation"
          title="Europe implementation map"
          description="Status shown only when backed by an official source."
        />
        <Card className="rounded-[2rem] border-black/6 bg-white/70 shadow-[0_18px_50px_rgba(15,15,15,0.05)]">
          <CardContent className="space-y-6 p-6 md:p-8">
            <EuropeImplementationMap countries={europeCountryStatuses} />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.3rem] border border-black/6 bg-zinc-50 p-4 text-sm text-zinc-600">
                <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
                  <span className="inline-block size-2 rounded-full bg-sky-500" />
                  Implementation not yet verified
                </p>
                <p className="mt-2">
                  Official national implementation status has not yet been verified for publication.
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-black/6 bg-zinc-50 p-4 text-sm text-zinc-600">
                <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
                  <span className="inline-block size-2 rounded-full bg-amber-500" />
                  Needs review
                </p>
                <p className="mt-2">
                  A country is in the review queue because the system still needs an official national source pass.
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-black/6 bg-zinc-50 p-4 text-sm text-zinc-600">
                <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
                  <span className="inline-block size-2 rounded-full bg-zinc-400" />
                  No official source verified yet
                </p>
                <p className="mt-2">
                  No official national implementation source has yet been documented in the monitoring layer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="countries" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Priority jurisdictions"
          title="First-wave country profiles"
          description="Five priority jurisdictions with verified baselines."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {countryProfiles.map((profile) => (
            <Card
              key={profile.slug}
              className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]"
            >
              <CardContent className="space-y-3 p-6">
                <p className="font-display text-2xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
                  {profile.countryName}
                </p>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  {profile.implementationStatusLabel} / confidence {profile.implementationConfidence}
                </p>
                <p className="text-sm leading-7 text-zinc-700">{profile.publicSummary}</p>
                <Link
                  href={`/ai-regulation/europe/${profile.slug}`}
                  className="inline-block text-sm uppercase tracking-[0.16em] text-zinc-900 underline decoration-black/15 underline-offset-4"
                >
                  Open country profile
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="sources" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Official sources"
          title="Europe monitoring sources"
          description="Only official public sources; unstable ones stay inactive."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {verificationRecords.map((record) => {
            const source = visibleSources.find((entry) => entry.id === record.sourceId);
            return (
              <Card
                key={record.sourceId}
                className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]"
              >
                <CardContent className="space-y-3 p-6">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-700">
                      {source?.name ?? record.sourceId}
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
            );
          })}
        </div>
      </section>

      <section id="published" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Published monitor items"
          title="Latest published Europe entries"
          description="Only human-reviewed, published entries appear here."
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
                No published Europe-specific entries are currently available. Official source monitoring continues in the background, but public publication still requires human review.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
