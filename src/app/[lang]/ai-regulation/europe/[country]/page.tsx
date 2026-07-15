import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getFranceLiveLegalIntelligenceData } from "@/agents/ai-regulation/franceLegalNewsAgent";
import { getGermanyLiveLegalIntelligenceData } from "@/agents/ai-regulation/germanyLegalNewsAgent";
import { getNetherlandsLiveLegalIntelligenceData } from "@/agents/ai-regulation/netherlandsLegalNewsAgent";
import { getBelgiumLiveLegalIntelligenceData } from "@/agents/ai-regulation/belgiumLegalNewsAgent";
import { getAustriaLiveLegalIntelligenceData } from "@/agents/ai-regulation/austriaLegalNewsAgent";
import { getSwedenLiveLegalIntelligenceData } from "@/agents/ai-regulation/swedenLegalNewsAgent";
import { getIrelandLiveLegalIntelligenceData } from "@/agents/ai-regulation/irelandLegalNewsAgent";
import { getItalyLiveLegalIntelligenceData } from "@/agents/ai-regulation/italyLegalNewsAgent";
import { getSpainLiveLegalIntelligenceData } from "@/agents/ai-regulation/spainLegalNewsAgent";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { groupCountryIntelligenceSourcesByFamily } from "@/agents/ai-regulation/utils/country-intelligence-view";
import { IntelligenceSignal } from "@/components/site/intelligence-signal";
import { LiveLegalIntelligencePanel } from "@/components/site/live-legal-intelligence-panel";
import { getFranceAiIntelligenceSnapshot } from "@/content/ai-regulation/france-ai-intelligence";
import { getGermanyAiIntelligenceSnapshot } from "@/content/ai-regulation/germany-ai-intelligence";
import { getNetherlandsAiIntelligenceSnapshot } from "@/content/ai-regulation/netherlands-ai-intelligence";
import { getBelgiumAiIntelligenceSnapshot } from "@/content/ai-regulation/belgium-ai-intelligence";
import { getAustriaAiIntelligenceSnapshot } from "@/content/ai-regulation/austria-ai-intelligence";
import { getSwedenAiIntelligenceSnapshot } from "@/content/ai-regulation/sweden-ai-intelligence";
import { getIrelandAiIntelligenceSnapshot } from "@/content/ai-regulation/ireland-ai-intelligence";
import { getItalyAiIntelligenceSnapshot } from "@/content/ai-regulation/italy-ai-intelligence";
import { getSpainAiIntelligenceSnapshot } from "@/content/ai-regulation/spain-ai-intelligence";
import {
  getEuropeCountryProfileBySlug,
  getEuropeCountryProfiles,
} from "@/content/ai-regulation/europe-country-profiles";
import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { HubScrollNav } from "@/components/site/hub-scroll-nav";
import { ImplementationProgressBar } from "@/components/site/implementation-progress-bar";
import { ConfidenceBadge, ImplementationBadge } from "@/components/site/legal-status-badge";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { UpdateCard } from "@/components/site/update-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";
import { formatDisplayDate } from "@/lib/utils";

// ISR (T-RT0C): serve from cache, revalidate every 5 min. The F8 country-editor
// actions call revalidatePath(`/ai-regulation/europe/${slug}`), so admin edits
// to a profile or its sources surface promptly instead of waiting for the window.
export const revalidate = 300;

export async function generateStaticParams() {
  return getEuropeCountryProfiles().map((profile) => ({
    country: profile.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const profile = getEuropeCountryProfileBySlug(country);
  if (!profile) return {};

  const title = `${profile.countryName} | Europe AI Regulation`;
  const description = profile.publicSummary;
  const canonical = `${env.NEXT_PUBLIC_SITE_URL}/ai-regulation/europe/${profile.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "C. Saint-Girons, Esq - AI Law & Legal Intelligence",
      type: "article",
    },
  };
}

function SourceList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: {
    label: string;
    url: string;
    institution: string;
    responseStatus: number | null;
    runtimeAccessible: boolean | null;
    note: string;
  }[];
  emptyMessage: string;
}) {
  return (
    <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.url}
              className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
            >
              <p className="font-medium text-zinc-950">{item.label}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">
                {item.institution} / status {item.responseStatus ?? "n/a"} / accessible{" "}
                {item.runtimeAccessible === null ? "unchecked" : item.runtimeAccessible ? "yes" : "no"}
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
              >
                {item.url}
              </a>
              <p className="mt-2 text-sm leading-7 text-zinc-700">{item.note}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function EuropeCountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const profile = getEuropeCountryProfileBySlug(country);
  if (!profile) notFound();

  const [updates, franceLiveData, germanyLiveData, spainLiveData, italyLiveData, netherlandsLiveData, belgiumLiveData, austriaLiveData, swedenLiveData, irelandLiveData, dbCountry, dbCountrySources] =
    await Promise.all([
    updateRepository.listPublicUpdates(),
    profile.slug === "france" ? getFranceLiveLegalIntelligenceData(6) : Promise.resolve(null),
    profile.slug === "germany" ? getGermanyLiveLegalIntelligenceData(6) : Promise.resolve(null),
    profile.slug === "spain" ? getSpainLiveLegalIntelligenceData(6) : Promise.resolve(null),
    profile.slug === "italy" ? getItalyLiveLegalIntelligenceData(6) : Promise.resolve(null),
    profile.slug === "netherlands" ? getNetherlandsLiveLegalIntelligenceData(6) : Promise.resolve(null),
    profile.slug === "belgium" ? getBelgiumLiveLegalIntelligenceData(6) : Promise.resolve(null),
    profile.slug === "austria" ? getAustriaLiveLegalIntelligenceData(6) : Promise.resolve(null),
    profile.slug === "sweden" ? getSwedenLiveLegalIntelligenceData(6) : Promise.resolve(null),
    profile.slug === "ireland" ? getIrelandLiveLegalIntelligenceData(6) : Promise.resolve(null),
    updateRepository.getCountryIntelligenceBySlug(profile.slug),
    updateRepository.listCountryIntelligenceSources(`country-${profile.slug}`),
    ]);
  const franceSnapshot =
    profile.slug === "france" ? getFranceAiIntelligenceSnapshot() : null;
  const germanySnapshot =
    profile.slug === "germany" ? getGermanyAiIntelligenceSnapshot() : null;
  const spainSnapshot =
    profile.slug === "spain" ? getSpainAiIntelligenceSnapshot() : null;
  const italySnapshot =
    profile.slug === "italy" ? getItalyAiIntelligenceSnapshot() : null;
  const netherlandsSnapshot =
    profile.slug === "netherlands" ? getNetherlandsAiIntelligenceSnapshot() : null;
  const belgiumSnapshot =
    profile.slug === "belgium" ? getBelgiumAiIntelligenceSnapshot() : null;
  const austriaSnapshot =
    profile.slug === "austria" ? getAustriaAiIntelligenceSnapshot() : null;
  const swedenSnapshot =
    profile.slug === "sweden" ? getSwedenAiIntelligenceSnapshot() : null;
  const irelandSnapshot =
    profile.slug === "ireland" ? getIrelandAiIntelligenceSnapshot() : null;
  const countryUpdates = updates.filter(
    (update) =>
      update.country === profile.countryName ||
      update.jurisdiction === profile.countryName,
  );



  // F8: prefer the editable DB editorial fields when present, falling back to
  // the verified TypeScript baseline. Blank/empty DB fields keep the baseline,
  // so an admin edit on /admin/ai-regulation/countries reflects here without a
  // redeployment, and structural content is never lost.
  const publicSummary = dbCountry?.publicSummary ?? profile.publicSummary;
  const editorialNotes = dbCountry?.editorialNotes
    ? dbCountry.editorialNotes
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : profile.editorialNotes;
  const missingSourceWarnings =
    dbCountry?.missingSourceWarnings && dbCountry.missingSourceWarnings.length > 0
      ? dbCountry.missingSourceWarnings
      : profile.missingSourceWarnings;

  // F8C: render the three source families from the normalized
  // `country_intelligence_sources` table when present, falling back per family
  // to the verified TypeScript baseline. The DB rows were seeded from the TS
  // layer, so the displayed content is identical until an admin edits sources.
  const dbSources = groupCountryIntelligenceSourcesByFamily(dbCountrySources);
  const nationalAIRegulationSources =
    dbSources.regulation.length > 0
      ? dbSources.regulation
      : profile.nationalAIRegulationSources;
  const nationalCaseLawSources =
    dbSources.caseLaw.length > 0
      ? dbSources.caseLaw
      : profile.nationalCaseLawSources;
  const nationalSoftLawSources =
    dbSources.softLaw.length > 0
      ? dbSources.softLaw
      : profile.nationalSoftLawSources;

  // F8C-3b: structural content (authority maps, measures, per-category notes)
  // from the DB when present, per-field TS fallback. Arrays fall back when
  // empty; notes fall back when null/blank.
  const implementationMeasures = dbCountry?.implementationMeasures.length
    ? dbCountry.implementationMeasures
    : profile.nationalImplementationMeasures;
  const competentAuthorities = dbCountry?.competentAuthorities.length
    ? dbCountry.competentAuthorities
    : profile.nationalCompetentAuthorities;
  const marketSurveillanceAuthorities = dbCountry?.marketSurveillanceAuthorities.length
    ? dbCountry.marketSurveillanceAuthorities
    : profile.marketSurveillanceAuthorities;
  const notifyingAuthorities = dbCountry?.notifyingAuthorities.length
    ? dbCountry.notifyingAuthorities
    : profile.notifyingAuthorities;
  const nationalAIRegulationNotes =
    dbCountry?.nationalAIRegulationNotes ?? profile.nationalAIRegulationNotes;
  const nationalCaseLawNotes =
    dbCountry?.nationalCaseLawNotes ?? profile.nationalCaseLawNotes;
  const nationalSoftLawNotes =
    dbCountry?.nationalSoftLawNotes ?? profile.nationalSoftLawNotes;

  return (
    <SiteShell className="space-y-10">
      <section id="overview" className="scroll-mt-28 space-y-5">
        <MotionReveal>
        <BreadcrumbNav
          items={[
            { label: "AI Law Hub", href: "/ai-regulation" },
            { label: "Europe", href: "/ai-regulation/europe" },
            { label: profile.countryName, href: `/ai-regulation/europe/${profile.slug}` },
          ]}
        />
        <div className="flex flex-wrap items-start gap-3">
          <SectionHeading
            eyebrow="Country profile"
            title={profile.countryName}
            description={publicSummary}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <ImplementationBadge status={profile.implementationStatus} />
          <ConfidenceBadge level={profile.implementationConfidence} />
        </div>
        <ImplementationProgressBar
          status={profile.implementationStatus}
          confidence={profile.implementationConfidence}
          label="EU AI Act implementation"
          className="max-w-sm"
        />

        {/* Verification pending notice for stub profiles */}
        {profile.implementationStatus === "needs_review" && profile.sourceReferences.length === 0 ? (
          <div className="rounded-[1.4rem] border border-amber-100 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
              <div className="space-y-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-700">
                  Verification pending
                </p>
                <p className="text-sm text-amber-800">
                  No official national AI Act implementation source has been verified for {profile.countryName} yet. This profile is a placeholder — the EU framework applies to all Member States. Absence of a verified source here does not mean absence of national law or institutional activity.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        </MotionReveal>

        <MotionStagger className="grid gap-4 md:grid-cols-3" stagger={0.09}>
          <MotionStaggerItem>
          <Card className="rounded-[1.7rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,15,15,0.07)]">
            <CardContent className="space-y-2 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                Implementation status
              </p>
              <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
                {profile.implementationStatusLabel}
              </p>
            </CardContent>
          </Card>
          </MotionStaggerItem>
          <MotionStaggerItem>
          <Card className="rounded-[1.7rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,15,15,0.07)]">
            <CardContent className="space-y-2 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                Confidence
              </p>
              <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
                {profile.implementationConfidence}
              </p>
            </CardContent>
          </Card>
          </MotionStaggerItem>
          <MotionStaggerItem>
          <Card className="rounded-[1.7rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,15,15,0.07)]">
            <CardContent className="space-y-2 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                Last reviewed
              </p>
              <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
                {formatDisplayDate(profile.lastReviewedDate)}
              </p>
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                {profile.sourceVerificationStatus.replaceAll("_", " ")}
              </p>
            </CardContent>
          </Card>
          </MotionStaggerItem>
        </MotionStagger>
      </section>

      <HubScrollNav
        sections={[
          { id: "overview", label: "Overview" },
          { id: "intel", label: "Intelligence" },
          { id: "implementation", label: "Implementation" },
          { id: "sources", label: "Sources" },
          { id: "references", label: "References" },
          { id: "notes", label: "Notes" },
          { id: "published", label: "Published" },
        ]}
      />

      {/* Jump target for the country-specific intelligence zone below. */}
      <div id="intel" aria-hidden className="-mt-6 scroll-mt-28" />

      {profile.slug === "germany" && germanyLiveData ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Germany live legal intelligence"
            title="Monitoring German AI law now"
            description="This Germany-only panel surfaces recent official and reviewed German AI-law developments visible to the public layer, with dates, source attribution, and verification signals shown directly."
          />
          <LiveLegalIntelligencePanel
            title="Germany AI legal developments"
            description="Germany live monitoring prioritises BfDI and other official German legal or institutional sources. The architecture is built for frequent refresh, but only lightweight approved sources should be treated as near-real-time candidates."
            regionLabel="Germany"
            items={germanyLiveData.items.map((entry) => entry.item)}
            lastCheckedAt={germanyLiveData.lastCheckedAt}
            activity={germanyLiveData.activity}
            itemFreshnessById={Object.fromEntries(
              germanyLiveData.items.map((entry) => [entry.item.id, entry.currentness.freshnessLabel]),
            )}
          />
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Live target
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {germanyLiveData.schedulerGuidance.liveTarget}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Safe fallback
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {germanyLiveData.schedulerGuidance.safeFallback}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Monitoring note
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  BfDI AI-unit and consultation materials are the current lightweight Germany live sources. Federal Government and Bundestag implementation materials remain on a slower cadence to preserve source respect and parser reliability.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            <IntelligenceSignal
              label="Breaking"
              value={String(germanyLiveData.summary.breakingSignals)}
              note="Very recent Germany legal signals that deserve immediate attention."
              tone="positive"
            />
            <IntelligenceSignal
              label="Current"
              value={String(germanyLiveData.summary.currentSignals)}
              note="Recently published or detected Germany signals that still read as current."
              tone="informative"
            />
            <IntelligenceSignal
              label="High urgency"
              value={String(germanyLiveData.summary.highUrgencySignals)}
              note="Germany items that combine legal weight with a strong need for prompt review."
              tone="informative"
            />
            <IntelligenceSignal
              label="Watch / stale"
              value={String(
                germanyLiveData.summary.watchSignals + germanyLiveData.summary.staleSignals,
              )}
              note="Germany signals that remain useful but should be refreshed, revisited, or deprioritised soon."
              tone="warning"
            />
          </div>
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Official-like signals
                </p>
                <p className="mt-2 text-2xl text-zinc-950">{germanyLiveData.summary.officialLike}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Public Germany items backed by an official source or an official-like verification posture.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Hard law + decisions
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {germanyLiveData.summary.hardLawSignals +
                    germanyLiveData.summary.caseLawSignals +
                    germanyLiveData.summary.enforcementSignals}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  These signals are the most likely to affect obligations, litigation posture, or supervisory expectations.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Awaiting official source
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {germanyLiveData.summary.awaitingOfficialSource}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Discovery or partially verified Germany signals remain clearly marked until stronger official confirmation is found.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {profile.slug === "germany" && germanySnapshot ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Germany legal architecture"
            title="What is settled, what is moving, and what still needs verification"
            description="This Germany-only layer separates direct authority signals, verified decisions, current official milestones, and unresolved verification gaps so the legal posture stays readable."
          />
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Germany authority map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {germanySnapshot.authorityMap.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.category.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-sky-900">
                        {entry.statusLabel.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.publicationDate ? formatDisplayDate(entry.publicationDate) : "Date under review"} / {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>What still needs verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {germanySnapshot.verificationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4"
                  >
                    <p className="font-medium text-amber-950">{gap.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-700">
                      {gap.severity} priority
                    </p>
                    <p className="mt-2 text-sm leading-7 text-amber-900">{gap.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Germany AI legal timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {germanySnapshot.timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      {formatDisplayDate(entry.date)} / {entry.category.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Verified decisions and acts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {germanySnapshot.verifiedDecisions.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.authorityType.replaceAll("_", " ")}
                      </span>
                      {entry.docketOrCaseNumber ? (
                        <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                          {entry.docketOrCaseNumber}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.shortSummary}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.courtOrAuthority} / {entry.date ? formatDisplayDate(entry.date) : "Date under review"}
                    </p>
                    <a
                      href={entry.officialSourceUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {profile.slug === "netherlands" && netherlandsLiveData ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Netherlands live legal intelligence"
            title="Monitoring Dutch AI law now"
            description="This Netherlands-only panel surfaces recent official and reviewed Dutch AI-law developments visible to the public layer, with dates, source attribution, and verification signals shown directly."
          />
          <LiveLegalIntelligencePanel
            title="Netherlands AI legal developments"
            description="Netherlands live monitoring prioritises AP and RDI official Dutch sources. The architecture is built for frequent refresh, but only lightweight approved sources should be treated as near-real-time candidates."
            regionLabel="Netherlands"
            items={netherlandsLiveData.items.map((entry) => entry.item)}
            lastCheckedAt={netherlandsLiveData.lastCheckedAt}
            activity={netherlandsLiveData.activity}
            itemFreshnessById={Object.fromEntries(
              netherlandsLiveData.items.map((entry) => [entry.item.id, entry.currentness.freshnessLabel]),
            )}
          />
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Live target
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {netherlandsLiveData.schedulerGuidance.liveTarget}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Safe fallback
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {netherlandsLiveData.schedulerGuidance.safeFallback}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Monitoring note
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  AP and RDI are the current lightweight Netherlands live sources. Rijksoverheid policy materials remain on a slower daily cadence to preserve source respect and parser reliability.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            <IntelligenceSignal
              label="Breaking"
              value={String(netherlandsLiveData.summary.breakingSignals)}
              note="Very recent Netherlands legal signals that deserve immediate attention."
              tone="positive"
            />
            <IntelligenceSignal
              label="Current"
              value={String(netherlandsLiveData.summary.currentSignals)}
              note="Recently published or detected Netherlands signals that still read as current."
              tone="informative"
            />
            <IntelligenceSignal
              label="High urgency"
              value={String(netherlandsLiveData.summary.highUrgencySignals)}
              note="Netherlands items that combine legal weight with a strong need for prompt review."
              tone="informative"
            />
            <IntelligenceSignal
              label="Watch / stale"
              value={String(
                netherlandsLiveData.summary.watchSignals + netherlandsLiveData.summary.staleSignals,
              )}
              note="Netherlands signals that remain useful but should be refreshed, revisited, or deprioritised soon."
              tone="warning"
            />
          </div>
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Official-like signals
                </p>
                <p className="mt-2 text-2xl text-zinc-950">{netherlandsLiveData.summary.officialLike}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Public Netherlands items backed by an official source or an official-like verification posture.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Hard law + decisions
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {netherlandsLiveData.summary.hardLawSignals +
                    netherlandsLiveData.summary.caseLawSignals +
                    netherlandsLiveData.summary.enforcementSignals}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  These signals are the most likely to affect obligations, litigation posture, or supervisory expectations.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Awaiting official source
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {netherlandsLiveData.summary.awaitingOfficialSource}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Discovery or partially verified Netherlands signals remain clearly marked until stronger official confirmation is found.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {profile.slug === "netherlands" && netherlandsSnapshot ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Netherlands legal architecture"
            title="What is settled, what is moving, and what still needs verification"
            description="This Netherlands-only layer separates direct authority signals, verified decisions, current official milestones, and unresolved verification gaps so the legal posture stays readable."
          />
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Netherlands authority map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {netherlandsSnapshot.authorityMap.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.category.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-sky-900">
                        {entry.statusLabel.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.publicationDate ? formatDisplayDate(entry.publicationDate) : "Date under review"} / {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>What still needs verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {netherlandsSnapshot.verificationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4"
                  >
                    <p className="font-medium text-amber-950">{gap.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-700">
                      {gap.severity} priority
                    </p>
                    <p className="mt-2 text-sm leading-7 text-amber-900">{gap.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Netherlands AI legal timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {netherlandsSnapshot.timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      {formatDisplayDate(entry.date)} / {entry.category.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Verified decisions and acts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {netherlandsSnapshot.verifiedDecisions.length > 0 ? (
                  netherlandsSnapshot.verifiedDecisions.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                          {entry.authorityType.replaceAll("_", " ")}
                        </span>
                        {entry.docketOrCaseNumber ? (
                          <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                            {entry.docketOrCaseNumber}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.shortSummary}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {entry.courtOrAuthority} / {entry.date ? formatDisplayDate(entry.date) : "Date under review"}
                      </p>
                      <a
                        href={entry.officialSourceUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                      >
                        Official source
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700">
                    No Dutch AI enforcement decisions or court acts have been reviewed into the public baseline in this phase.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {profile.slug === "belgium" && belgiumLiveData ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Belgium live legal intelligence"
            title="Monitoring Belgian AI law now"
            description="This Belgium-only panel surfaces recent official and reviewed Belgian AI-law developments visible to the public layer, with dates, source attribution, and verification signals shown directly."
          />
          <LiveLegalIntelligencePanel
            title="Belgium AI legal developments"
            description="Belgium live monitoring prioritises APD/GBA official Belgian sources. The architecture is built for frequent refresh, but only lightweight approved sources should be treated as near-real-time candidates."
            regionLabel="Belgium"
            items={belgiumLiveData.items.map((entry) => entry.item)}
            lastCheckedAt={belgiumLiveData.lastCheckedAt}
            activity={belgiumLiveData.activity}
            itemFreshnessById={Object.fromEntries(
              belgiumLiveData.items.map((entry) => [entry.item.id, entry.currentness.freshnessLabel]),
            )}
          />
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Live target
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {belgiumLiveData.schedulerGuidance.liveTarget}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Safe fallback
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {belgiumLiveData.schedulerGuidance.safeFallback}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Monitoring note
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  The APD/GBA is the current lightweight Belgium live source. Digital Belgium and AI4Belgium policy materials remain on a slower daily cadence to preserve source respect and parser reliability.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            <IntelligenceSignal
              label="Breaking"
              value={String(belgiumLiveData.summary.breakingSignals)}
              note="Very recent Belgian legal signals that deserve immediate attention."
              tone="positive"
            />
            <IntelligenceSignal
              label="Current"
              value={String(belgiumLiveData.summary.currentSignals)}
              note="Recently published or detected Belgian signals that still read as current."
              tone="informative"
            />
            <IntelligenceSignal
              label="High urgency"
              value={String(belgiumLiveData.summary.highUrgencySignals)}
              note="Belgian items that combine legal weight with a strong need for prompt review."
              tone="informative"
            />
            <IntelligenceSignal
              label="Watch / stale"
              value={String(
                belgiumLiveData.summary.watchSignals + belgiumLiveData.summary.staleSignals,
              )}
              note="Belgian signals that remain useful but should be refreshed, revisited, or deprioritised soon."
              tone="warning"
            />
          </div>
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Official-like signals
                </p>
                <p className="mt-2 text-2xl text-zinc-950">{belgiumLiveData.summary.officialLike}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Public Belgian items backed by an official source or an official-like verification posture.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Hard law + decisions
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {belgiumLiveData.summary.hardLawSignals +
                    belgiumLiveData.summary.caseLawSignals +
                    belgiumLiveData.summary.enforcementSignals}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  These signals are the most likely to affect obligations, litigation posture, or supervisory expectations.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Awaiting official source
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {belgiumLiveData.summary.awaitingOfficialSource}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Discovery or partially verified Belgian signals remain clearly marked until stronger official confirmation is found.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {profile.slug === "belgium" && belgiumSnapshot ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Belgium legal architecture"
            title="What is settled, what is moving, and what still needs verification"
            description="This Belgium-only layer separates direct authority signals, verified decisions, current official milestones, and unresolved verification gaps so the legal posture stays readable."
          />
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Belgium authority map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {belgiumSnapshot.authorityMap.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.category.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-sky-900">
                        {entry.statusLabel.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.publicationDate ? formatDisplayDate(entry.publicationDate) : "Date under review"} / {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>What still needs verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {belgiumSnapshot.verificationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4"
                  >
                    <p className="font-medium text-amber-950">{gap.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-700">
                      {gap.severity} priority
                    </p>
                    <p className="mt-2 text-sm leading-7 text-amber-900">{gap.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Belgium AI legal timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {belgiumSnapshot.timeline.length > 0 ? (
                  belgiumSnapshot.timeline.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                        {formatDisplayDate(entry.date)} / {entry.category.replaceAll("_", " ")}
                      </p>
                      <p className="mt-2 font-medium text-zinc-950">{entry.title}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {entry.sourceLabel}
                      </p>
                      <a
                        href={entry.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                      >
                        Official source
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700">
                    No verified Belgian AI legal timeline milestones have been reviewed into the public baseline in this phase.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Verified decisions and acts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {belgiumSnapshot.verifiedDecisions.length > 0 ? (
                  belgiumSnapshot.verifiedDecisions.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                          {entry.authorityType.replaceAll("_", " ")}
                        </span>
                        {entry.docketOrCaseNumber ? (
                          <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                            {entry.docketOrCaseNumber}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.shortSummary}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {entry.courtOrAuthority} / {entry.date ? formatDisplayDate(entry.date) : "Date under review"}
                      </p>
                      <a
                        href={entry.officialSourceUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                      >
                        Official source
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700">
                    No Belgian AI enforcement decisions or court acts have been reviewed into the public baseline in this phase.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {profile.slug === "austria" && austriaLiveData ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Austria live legal intelligence"
            title="Monitoring Austrian AI law now"
            description="This Austria-only panel surfaces recent official and reviewed Austrian AI-law developments visible to the public layer, with dates, source attribution, and verification signals shown directly."
          />
          <LiveLegalIntelligencePanel
            title="Austria AI legal developments"
            description="Austria live monitoring prioritises DSB official Austrian sources. The architecture is built for frequent refresh, but only lightweight approved sources should be treated as near-real-time candidates."
            regionLabel="Austria"
            items={austriaLiveData.items.map((entry) => entry.item)}
            lastCheckedAt={austriaLiveData.lastCheckedAt}
            activity={austriaLiveData.activity}
            itemFreshnessById={Object.fromEntries(
              austriaLiveData.items.map((entry) => [entry.item.id, entry.currentness.freshnessLabel]),
            )}
          />
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Live target
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {austriaLiveData.schedulerGuidance.liveTarget}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Safe fallback
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {austriaLiveData.schedulerGuidance.safeFallback}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Monitoring note
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  The DSB is the current lightweight Austria live source. Digital Austria and RTR materials remain on a slower daily cadence to preserve source respect and parser reliability.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            <IntelligenceSignal
              label="Breaking"
              value={String(austriaLiveData.summary.breakingSignals)}
              note="Very recent Austrian legal signals that deserve immediate attention."
              tone="positive"
            />
            <IntelligenceSignal
              label="Current"
              value={String(austriaLiveData.summary.currentSignals)}
              note="Recently published or detected Austrian signals that still read as current."
              tone="informative"
            />
            <IntelligenceSignal
              label="High urgency"
              value={String(austriaLiveData.summary.highUrgencySignals)}
              note="Austrian items that combine legal weight with a strong need for prompt review."
              tone="informative"
            />
            <IntelligenceSignal
              label="Watch / stale"
              value={String(
                austriaLiveData.summary.watchSignals + austriaLiveData.summary.staleSignals,
              )}
              note="Austrian signals that remain useful but should be refreshed, revisited, or deprioritised soon."
              tone="warning"
            />
          </div>
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Official-like signals
                </p>
                <p className="mt-2 text-2xl text-zinc-950">{austriaLiveData.summary.officialLike}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Public Austrian items backed by an official source or an official-like verification posture.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Hard law + decisions
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {austriaLiveData.summary.hardLawSignals +
                    austriaLiveData.summary.caseLawSignals +
                    austriaLiveData.summary.enforcementSignals}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  These signals are the most likely to affect obligations, litigation posture, or supervisory expectations.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Awaiting official source
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {austriaLiveData.summary.awaitingOfficialSource}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Discovery or partially verified Austrian signals remain clearly marked until stronger official confirmation is found.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {profile.slug === "austria" && austriaSnapshot ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Austria legal architecture"
            title="What is settled, what is moving, and what still needs verification"
            description="This Austria-only layer separates direct authority signals, verified decisions, current official milestones, and unresolved verification gaps so the legal posture stays readable."
          />
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Austria authority map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {austriaSnapshot.authorityMap.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.category.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-sky-900">
                        {entry.statusLabel.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.publicationDate ? formatDisplayDate(entry.publicationDate) : "Date under review"} / {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>What still needs verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {austriaSnapshot.verificationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4"
                  >
                    <p className="font-medium text-amber-950">{gap.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-700">
                      {gap.severity} priority
                    </p>
                    <p className="mt-2 text-sm leading-7 text-amber-900">{gap.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Austria AI legal timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {austriaSnapshot.timeline.length > 0 ? (
                  austriaSnapshot.timeline.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                        {formatDisplayDate(entry.date)} / {entry.category.replaceAll("_", " ")}
                      </p>
                      <p className="mt-2 font-medium text-zinc-950">{entry.title}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {entry.sourceLabel}
                      </p>
                      <a
                        href={entry.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                      >
                        Official source
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700">
                    No verified Austrian AI legal timeline milestones have been reviewed into the public baseline in this phase.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Verified decisions and acts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {austriaSnapshot.verifiedDecisions.length > 0 ? (
                  austriaSnapshot.verifiedDecisions.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                          {entry.authorityType.replaceAll("_", " ")}
                        </span>
                        {entry.docketOrCaseNumber ? (
                          <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                            {entry.docketOrCaseNumber}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.shortSummary}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {entry.courtOrAuthority} / {entry.date ? formatDisplayDate(entry.date) : "Date under review"}
                      </p>
                      <a
                        href={entry.officialSourceUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                      >
                        Official source
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700">
                    No Austrian AI enforcement decisions or court acts have been reviewed into the public baseline in this phase.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {profile.slug === "sweden" && swedenLiveData ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Sweden live legal intelligence"
            title="Monitoring Swedish AI law now"
            description="This Sweden-only panel surfaces recent official and reviewed Swedish AI-law developments visible to the public layer, with dates, source attribution, and verification signals shown directly."
          />
          <LiveLegalIntelligencePanel
            title="Sweden AI legal developments"
            description="Sweden live monitoring prioritises IMY official Swedish sources. The architecture is built for frequent refresh, but only lightweight approved sources should be treated as near-real-time candidates."
            regionLabel="Sweden"
            items={swedenLiveData.items.map((entry) => entry.item)}
            lastCheckedAt={swedenLiveData.lastCheckedAt}
            activity={swedenLiveData.activity}
            itemFreshnessById={Object.fromEntries(
              swedenLiveData.items.map((entry) => [entry.item.id, entry.currentness.freshnessLabel]),
            )}
          />
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Live target
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {swedenLiveData.schedulerGuidance.liveTarget}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Safe fallback
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {swedenLiveData.schedulerGuidance.safeFallback}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Monitoring note
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  IMY is the current lightweight Sweden live source. DIGG and Regeringen materials remain on a slower daily cadence to preserve source respect and parser reliability.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            <IntelligenceSignal
              label="Breaking"
              value={String(swedenLiveData.summary.breakingSignals)}
              note="Very recent Swedish legal signals that deserve immediate attention."
              tone="positive"
            />
            <IntelligenceSignal
              label="Current"
              value={String(swedenLiveData.summary.currentSignals)}
              note="Recently published or detected Swedish signals that still read as current."
              tone="informative"
            />
            <IntelligenceSignal
              label="High urgency"
              value={String(swedenLiveData.summary.highUrgencySignals)}
              note="Swedish items that combine legal weight with a strong need for prompt review."
              tone="informative"
            />
            <IntelligenceSignal
              label="Watch / stale"
              value={String(
                swedenLiveData.summary.watchSignals + swedenLiveData.summary.staleSignals,
              )}
              note="Swedish signals that remain useful but should be refreshed, revisited, or deprioritised soon."
              tone="warning"
            />
          </div>
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Official-like signals
                </p>
                <p className="mt-2 text-2xl text-zinc-950">{swedenLiveData.summary.officialLike}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Public Swedish items backed by an official source or an official-like verification posture.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Hard law + decisions
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {swedenLiveData.summary.hardLawSignals +
                    swedenLiveData.summary.caseLawSignals +
                    swedenLiveData.summary.enforcementSignals}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  These signals are the most likely to affect obligations, litigation posture, or supervisory expectations.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Awaiting official source
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {swedenLiveData.summary.awaitingOfficialSource}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Discovery or partially verified Swedish signals remain clearly marked until stronger official confirmation is found.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {profile.slug === "sweden" && swedenSnapshot ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Sweden legal architecture"
            title="What is settled, what is moving, and what still needs verification"
            description="This Sweden-only layer separates direct authority signals, verified decisions, current official milestones, and unresolved verification gaps so the legal posture stays readable."
          />
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Sweden authority map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {swedenSnapshot.authorityMap.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.category.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-sky-900">
                        {entry.statusLabel.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.publicationDate ? formatDisplayDate(entry.publicationDate) : "Date under review"} / {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>What still needs verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {swedenSnapshot.verificationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4"
                  >
                    <p className="font-medium text-amber-950">{gap.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-700">
                      {gap.severity} priority
                    </p>
                    <p className="mt-2 text-sm leading-7 text-amber-900">{gap.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Sweden AI legal timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {swedenSnapshot.timeline.length > 0 ? (
                  swedenSnapshot.timeline.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                        {formatDisplayDate(entry.date)} / {entry.category.replaceAll("_", " ")}
                      </p>
                      <p className="mt-2 font-medium text-zinc-950">{entry.title}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {entry.sourceLabel}
                      </p>
                      <a
                        href={entry.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                      >
                        Official source
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700">
                    No verified Swedish AI legal timeline milestones have been reviewed into the public baseline in this phase.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Verified decisions and acts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {swedenSnapshot.verifiedDecisions.length > 0 ? (
                  swedenSnapshot.verifiedDecisions.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                          {entry.authorityType.replaceAll("_", " ")}
                        </span>
                        {entry.docketOrCaseNumber ? (
                          <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                            {entry.docketOrCaseNumber}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.shortSummary}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {entry.courtOrAuthority} / {entry.date ? formatDisplayDate(entry.date) : "Date under review"}
                      </p>
                      <a
                        href={entry.officialSourceUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                      >
                        Official source
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700">
                    No Swedish AI enforcement decisions or court acts have been reviewed into the public baseline in this phase.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {profile.slug === "ireland" && irelandLiveData ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Ireland live legal intelligence"
            title="Monitoring Irish AI law now"
            description="This Ireland-only panel surfaces recent official and reviewed Irish AI-law developments visible to the public layer, with dates, source attribution, and verification signals shown directly."
          />
          <LiveLegalIntelligencePanel
            title="Ireland AI legal developments"
            description="Ireland live monitoring prioritises DPC guidance and official Irish sources. The DPC is the primary live anchor given its role as lead supervisory authority for many major AI and technology companies established in Ireland. The architecture is built for frequent refresh, but only lightweight approved sources should be treated as near-real-time candidates."
            regionLabel="Ireland"
            items={irelandLiveData.items.map((entry) => entry.item)}
            lastCheckedAt={irelandLiveData.lastCheckedAt}
            activity={irelandLiveData.activity}
            itemFreshnessById={Object.fromEntries(
              irelandLiveData.items.map((entry) => [entry.item.id, entry.currentness.freshnessLabel]),
            )}
          />
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Live target
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {irelandLiveData.schedulerGuidance.liveTarget}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Safe fallback
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {irelandLiveData.schedulerGuidance.safeFallback}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Monitoring note
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  The DPC is the primary Ireland live source. DETE and gov.ie remain on a daily cadence as authoritative government-context anchors not suited to aggressive polling.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            <IntelligenceSignal
              label="Breaking"
              value={String(irelandLiveData.summary.breakingSignals)}
              note="Very recent Ireland legal signals that deserve immediate attention."
              tone="positive"
            />
            <IntelligenceSignal
              label="Current"
              value={String(irelandLiveData.summary.currentSignals)}
              note="Recently published or detected Ireland signals that still read as current."
              tone="informative"
            />
            <IntelligenceSignal
              label="High urgency"
              value={String(irelandLiveData.summary.highUrgencySignals)}
              note="Ireland items that combine legal weight with a strong need for prompt review."
              tone="informative"
            />
            <IntelligenceSignal
              label="Watch / stale"
              value={String(
                irelandLiveData.summary.watchSignals + irelandLiveData.summary.staleSignals,
              )}
              note="Ireland signals that remain useful but should be refreshed, revisited, or deprioritised soon."
              tone="warning"
            />
          </div>
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Official-like signals
                </p>
                <p className="mt-2 text-2xl text-zinc-950">{irelandLiveData.summary.officialLike}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Public Ireland items backed by an official source or an official-like verification posture.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Hard law + decisions
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {irelandLiveData.summary.hardLawSignals +
                    irelandLiveData.summary.caseLawSignals +
                    irelandLiveData.summary.enforcementSignals}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  These signals are the most likely to affect obligations, litigation posture, or supervisory expectations.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Awaiting official source
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {irelandLiveData.summary.awaitingOfficialSource}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Discovery or partially verified Ireland signals remain clearly marked until stronger official confirmation is found.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {profile.slug === "ireland" && irelandSnapshot ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Ireland legal architecture"
            title="What is settled, what is moving, and what still needs verification"
            description="This Ireland-only layer separates direct authority signals, verified decisions, current official milestones, and unresolved verification gaps so the legal posture stays readable."
          />
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Ireland authority map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {irelandSnapshot.authorityMap.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.category.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-sky-900">
                        {entry.statusLabel.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.publicationDate ? formatDisplayDate(entry.publicationDate) : "Date under review"} / {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>What still needs verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {irelandSnapshot.verificationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4"
                  >
                    <p className="font-medium text-amber-950">{gap.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-700">
                      {gap.severity} priority
                    </p>
                    <p className="mt-2 text-sm leading-7 text-amber-900">{gap.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Ireland AI legal timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {irelandSnapshot.timeline.length > 0 ? (
                  irelandSnapshot.timeline.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                        {formatDisplayDate(entry.date)} / {entry.category.replaceAll("_", " ")}
                      </p>
                      <p className="mt-2 font-medium text-zinc-950">{entry.title}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {entry.sourceLabel}
                      </p>
                      <a
                        href={entry.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                      >
                        Official source
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700">
                    No verified Irish AI legal timeline milestones have been reviewed into the public baseline in this phase.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Verified decisions and acts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {irelandSnapshot.verifiedDecisions.length > 0 ? (
                  irelandSnapshot.verifiedDecisions.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                          {entry.authorityType.replaceAll("_", " ")}
                        </span>
                        {entry.docketOrCaseNumber ? (
                          <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                            {entry.docketOrCaseNumber}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.shortSummary}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                        {entry.courtOrAuthority} / {entry.date ? formatDisplayDate(entry.date) : "Date under review"}
                      </p>
                      <a
                        href={entry.officialSourceUrl ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                      >
                        Official source
                      </a>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4 text-sm leading-7 text-zinc-700">
                    No Irish AI enforcement decisions or court acts have been reviewed into the public baseline in this phase.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {profile.slug === "france" && franceLiveData ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="France live legal intelligence"
            title="Monitoring French AI law now"
            description="This France-only panel surfaces recent official and reviewed French AI-law developments visible to the public layer, with dates, source attribution, and verification signals shown directly."
          />
          <LiveLegalIntelligencePanel
            title="France AI legal developments"
            description="France live monitoring prioritises CNIL and other official French legal or institutional sources. The architecture is built for frequent refresh, but only lightweight approved sources should be treated as near-real-time candidates."
            regionLabel="France"
            items={franceLiveData.items.map((entry) => entry.item)}
            lastCheckedAt={franceLiveData.lastCheckedAt}
            activity={franceLiveData.activity}
            itemFreshnessById={Object.fromEntries(
              franceLiveData.items.map((entry) => [entry.item.id, entry.currentness.freshnessLabel]),
            )}
          />
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Live target
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {franceLiveData.schedulerGuidance.liveTarget}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Safe fallback
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {franceLiveData.schedulerGuidance.safeFallback}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Monitoring note
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  CNIL is the current lightweight France live source. Heavier legal-text and judicial sources remain on a slower cadence to preserve source respect and parser reliability.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            <IntelligenceSignal
              label="Breaking"
              value={String(franceLiveData.summary.breakingSignals)}
              note="Very recent France legal signals that deserve immediate attention."
              tone="positive"
            />
            <IntelligenceSignal
              label="Current"
              value={String(franceLiveData.summary.currentSignals)}
              note="Recently published or detected France signals that still read as current."
              tone="informative"
            />
            <IntelligenceSignal
              label="High urgency"
              value={String(franceLiveData.summary.highUrgencySignals)}
              note="France items that combine legal weight with a strong need for prompt review."
              tone="informative"
            />
            <IntelligenceSignal
              label="Watch / stale"
              value={String(
                franceLiveData.summary.watchSignals + franceLiveData.summary.staleSignals,
              )}
              note="France signals that remain useful but should be refreshed, revisited, or deprioritised soon."
              tone="warning"
            />
          </div>
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Official-like signals
                </p>
                <p className="mt-2 text-2xl text-zinc-950">{franceLiveData.summary.officialLike}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Public France items backed by an official source or an official-like verification posture.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Hard law + decisions
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {franceLiveData.summary.hardLawSignals +
                    franceLiveData.summary.caseLawSignals +
                    franceLiveData.summary.enforcementSignals}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  These signals are the most likely to affect obligations, litigation posture, or enforcement expectations.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Awaiting official source
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {franceLiveData.summary.awaitingOfficialSource}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Discovery or partially verified France signals remain clearly marked until stronger official confirmation is found.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {profile.slug === "france" && franceSnapshot ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="France legal architecture"
            title="What is settled, what is moving, and what still needs verification"
            description="This France-only layer separates direct authority signals, verified decisions, current official milestones, and unresolved verification gaps so the legal posture stays readable."
          />
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>France authority map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {franceSnapshot.authorityMap.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.category.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-sky-900">
                        {entry.statusLabel.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.publicationDate ? formatDisplayDate(entry.publicationDate) : "Date under review"} / {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>What still needs verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {franceSnapshot.verificationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4"
                  >
                    <p className="font-medium text-amber-950">{gap.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-700">
                      {gap.severity} priority
                    </p>
                    <p className="mt-2 text-sm leading-7 text-amber-900">{gap.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>France AI legal timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {franceSnapshot.timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      {formatDisplayDate(entry.date)} / {entry.category.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Verified decisions and acts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {franceSnapshot.verifiedDecisions.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.authorityType.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.docketOrCaseNumber}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.shortSummary}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.courtOrAuthority} / {entry.date ? formatDisplayDate(entry.date) : "Date under review"}
                    </p>
                    <a
                      href={entry.officialSourceUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {profile.slug === "spain" && spainLiveData ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Spain live legal intelligence"
            title="Monitoring Spanish AI law now"
            description="This Spain-only panel surfaces recent official and reviewed Spanish AI-law developments visible to the public layer, with dates, source attribution, and verification signals shown directly."
          />
          <LiveLegalIntelligencePanel
            title="Spain AI legal developments"
            description="Spain live monitoring prioritises AEPD and other official Spanish legal or institutional sources. The architecture is built for frequent refresh, but only lightweight approved sources should be treated as near-real-time candidates."
            regionLabel="Spain"
            items={spainLiveData.items.map((entry) => entry.item)}
            lastCheckedAt={spainLiveData.lastCheckedAt}
            activity={spainLiveData.activity}
            itemFreshnessById={Object.fromEntries(
              spainLiveData.items.map((entry) => [entry.item.id, entry.currentness.freshnessLabel]),
            )}
          />
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Live target
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {spainLiveData.schedulerGuidance.liveTarget}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Safe fallback
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {spainLiveData.schedulerGuidance.safeFallback}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Monitoring note
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  AEPD is the current lightweight Spain live source. AESIA, BOE, and La Moncloa remain on a slower cadence to preserve source respect and parser reliability.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            <IntelligenceSignal
              label="Breaking"
              value={String(spainLiveData.summary.breakingSignals)}
              note="Very recent Spain legal signals that deserve immediate attention."
              tone="positive"
            />
            <IntelligenceSignal
              label="Current"
              value={String(spainLiveData.summary.currentSignals)}
              note="Recently published or detected Spain signals that still read as current."
              tone="informative"
            />
            <IntelligenceSignal
              label="High urgency"
              value={String(spainLiveData.summary.highUrgencySignals)}
              note="Spain items that combine legal weight with a strong need for prompt review."
              tone="informative"
            />
            <IntelligenceSignal
              label="Watch / stale"
              value={String(spainLiveData.summary.watchSignals + spainLiveData.summary.staleSignals)}
              note="Spain signals that remain useful but should be refreshed, revisited, or deprioritised soon."
              tone="warning"
            />
          </div>
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Official-like signals
                </p>
                <p className="mt-2 text-2xl text-zinc-950">{spainLiveData.summary.officialLike}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Public Spain items backed by an official source or an official-like verification posture.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Hard law + decisions
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {spainLiveData.summary.hardLawSignals +
                    spainLiveData.summary.caseLawSignals +
                    spainLiveData.summary.enforcementSignals}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  These signals are the most likely to affect obligations, litigation posture, or supervisory expectations in Spain.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Awaiting official source
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {spainLiveData.summary.awaitingOfficialSource}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Discovery or partially verified Spain signals remain clearly marked until stronger official confirmation is found.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {profile.slug === "spain" && spainSnapshot ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Spain legal architecture"
            title="What is settled, what is moving, and what still needs verification"
            description="This Spain-only layer separates direct authority signals, verified decisions, current official milestones, and unresolved verification gaps so the legal posture stays readable."
          />
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Spain authority map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {spainSnapshot.authorityMap.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.category.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-sky-900">
                        {entry.statusLabel.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.publicationDate ? formatDisplayDate(entry.publicationDate) : "Date under review"} / {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>What still needs verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {spainSnapshot.verificationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4"
                  >
                    <p className="font-medium text-amber-950">{gap.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-700">
                      {gap.severity} priority
                    </p>
                    <p className="mt-2 text-sm leading-7 text-amber-900">{gap.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Spain AI legal timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {spainSnapshot.timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      {formatDisplayDate(entry.date)} / {entry.category.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Verified decisions and acts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {spainSnapshot.verifiedDecisions.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.authorityType.replaceAll("_", " ")}
                      </span>
                      {entry.docketOrCaseNumber ? (
                        <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                          {entry.docketOrCaseNumber}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.shortSummary}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.courtOrAuthority} / {entry.date ? formatDisplayDate(entry.date) : "Date under review"}
                    </p>
                    <a
                      href={entry.officialSourceUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {profile.slug === "italy" && italyLiveData ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Italy live legal intelligence"
            title="Monitoring Italian AI law now"
            description="This Italy-only panel surfaces recent official and reviewed Italian AI-law developments visible to the public layer, with dates, source attribution, and verification signals shown directly."
          />
          <LiveLegalIntelligencePanel
            title="Italy AI legal developments"
            description="Italy live monitoring prioritises the Garante and other official Italian legal or institutional sources. The architecture is built for frequent refresh, but only lightweight approved sources should be treated as near-real-time candidates."
            regionLabel="Italy"
            items={italyLiveData.items.map((entry) => entry.item)}
            lastCheckedAt={italyLiveData.lastCheckedAt}
            activity={italyLiveData.activity}
            itemFreshnessById={Object.fromEntries(
              italyLiveData.items.map((entry) => [entry.item.id, entry.currentness.freshnessLabel]),
            )}
          />
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Live target
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {italyLiveData.schedulerGuidance.liveTarget}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Safe fallback
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  {italyLiveData.schedulerGuidance.safeFallback}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Monitoring note
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  The Garante is the current lightweight Italy live source. AgID, Normattiva, and the Digital Transformation Department remain on a slower cadence to preserve source respect and parser reliability.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-4">
            <IntelligenceSignal
              label="Breaking"
              value={String(italyLiveData.summary.breakingSignals)}
              note="Very recent Italy legal signals that deserve immediate attention."
              tone="positive"
            />
            <IntelligenceSignal
              label="Current"
              value={String(italyLiveData.summary.currentSignals)}
              note="Recently published or detected Italy signals that still read as current."
              tone="informative"
            />
            <IntelligenceSignal
              label="High urgency"
              value={String(italyLiveData.summary.highUrgencySignals)}
              note="Italy items that combine legal weight with a strong need for prompt review."
              tone="informative"
            />
            <IntelligenceSignal
              label="Watch / stale"
              value={String(italyLiveData.summary.watchSignals + italyLiveData.summary.staleSignals)}
              note="Italy signals that remain useful but should be refreshed, revisited, or deprioritised soon."
              tone="warning"
            />
          </div>
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Official-like signals
                </p>
                <p className="mt-2 text-2xl text-zinc-950">{italyLiveData.summary.officialLike}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Public Italy items backed by an official source or an official-like verification posture.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Hard law + decisions
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {italyLiveData.summary.hardLawSignals +
                    italyLiveData.summary.caseLawSignals +
                    italyLiveData.summary.enforcementSignals}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  These signals are the most likely to affect obligations, litigation posture, or enforcement expectations.
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Awaiting official source
                </p>
                <p className="mt-2 text-2xl text-zinc-950">
                  {italyLiveData.summary.awaitingOfficialSource}
                </p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">
                  Discovery or partially verified Italy signals remain clearly marked until stronger official confirmation is found.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {profile.slug === "italy" && italySnapshot ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow="Italy legal architecture"
            title="What is settled, what is moving, and what still needs verification"
            description="This Italy-only layer separates direct authority signals, verified decisions, current official milestones, and unresolved verification gaps so the legal posture stays readable."
          />
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Italy authority map</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {italySnapshot.authorityMap.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.category.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-sky-900">
                        {entry.statusLabel.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.publicationDate ? formatDisplayDate(entry.publicationDate) : "Date under review"} / {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>What still needs verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {italySnapshot.verificationGaps.map((gap) => (
                  <div
                    key={gap.id}
                    className="rounded-[1.4rem] border border-amber-200 bg-amber-50/80 p-4"
                  >
                    <p className="font-medium text-amber-950">{gap.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-700">
                      {gap.severity} priority
                    </p>
                    <p className="mt-2 text-sm leading-7 text-amber-900">{gap.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Italy AI legal timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {italySnapshot.timeline.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      {formatDisplayDate(entry.date)} / {entry.category.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.sourceLabel}
                    </p>
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
              <CardHeader>
                <CardTitle>Verified decisions and acts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {italySnapshot.verifiedDecisions.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                        {entry.authorityType.replaceAll("_", " ")}
                      </span>
                      {entry.docketOrCaseNumber ? (
                        <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-700">
                          {entry.docketOrCaseNumber}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 font-medium text-zinc-950">{entry.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{entry.shortSummary}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {entry.courtOrAuthority} / {entry.date ? formatDisplayDate(entry.date) : "Date under review"}
                    </p>
                    <a
                      href={entry.officialSourceUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      Official source
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      <section id="implementation" className="scroll-mt-28 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardHeader>
            <CardTitle>AI Act implementation notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-sm leading-7 text-zinc-700">
            <p>{profile.aiActImplementationNotes}</p>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                National implementation measures
              </p>
              {implementationMeasures.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {implementationMeasures.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">No specific national implementation measure verified yet.</p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Competent authorities
                </p>
                {competentAuthorities.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {competentAuthorities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2">Needs verification.</p>
                )}
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  Market surveillance / notifying
                </p>
                {marketSurveillanceAuthorities.length > 0 ||
                notifyingAuthorities.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {marketSurveillanceAuthorities.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                    {notifyingAuthorities.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2">No official designation verified yet.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardHeader>
            <CardTitle>Editorial posture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-zinc-700">
            <p>
              This country profile is intentionally conservative. The absence of a
              verified national source does not mean the absence of law, policy work,
              or institutional preparation.
            </p>
            <p>
              Public content here is presented for legal research and legal intelligence
              purposes only. It does not constitute legal advice.
            </p>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                Missing source warnings
              </p>
              <ul className="mt-2 space-y-2">
                {missingSourceWarnings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                Editorial notes
              </p>
              <ul className="mt-2 space-y-2">
                {editorialNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="sources" className="scroll-mt-28 grid gap-6 lg:grid-cols-3">
        <SourceList
          title="National AI regulation sources"
          items={nationalAIRegulationSources}
          emptyMessage="No official national AI regulation source verified yet."
        />
        <SourceList
          title="Case-law source posture"
          items={nationalCaseLawSources}
          emptyMessage="No official national case-law source verified yet."
        />
        <SourceList
          title="Soft law and guidance sources"
          items={nationalSoftLawSources}
          emptyMessage="No official soft-law or guidance source verified yet."
        />
      </section>

      <section id="references" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Precise citations"
          title="Official source references"
          description="Country status should remain conservative unless supported by official source references."
        />
        <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardContent className="space-y-4 p-6">
            {profile.sourceReferences.length > 0 ? (
              profile.sourceReferences.map((reference) => (
                <div
                  key={`${reference.sourceRole}-${reference.url}`}
                  className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                >
                  <p className="font-medium text-zinc-950">
                    {reference.institution}, <span>&ldquo;{reference.title}&rdquo;</span>
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-zinc-500">
                    {reference.sourceRole.replaceAll("_", " ")} /{" "}
                    {reference.sourceType.replaceAll("_", " ")} /{" "}
                    {reference.authorityType ?? "authority type not detected"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-zinc-700">
                    Last verified: {formatDisplayDate(reference.lastVerifiedAt ?? null)}.
                  </p>
                  {reference.publicationDate ? (
                    <p className="mt-1 text-sm leading-7 text-zinc-700">
                      Publication date: {formatDisplayDate(reference.publicationDate)}.
                    </p>
                  ) : null}
                  {reference.pinpoint &&
                  Object.values(reference.pinpoint).some((value) => Boolean(value)) ? (
                    <p className="mt-1 text-sm leading-7 text-zinc-700">
                      Pinpoint:{" "}
                      {[
                        reference.pinpoint.article
                          ? `article ${reference.pinpoint.article}`
                          : null,
                        reference.pinpoint.section
                          ? `section ${reference.pinpoint.section}`
                          : null,
                        reference.pinpoint.page ? `page ${reference.pinpoint.page}` : null,
                        reference.pinpoint.caseNumber
                          ? `case ${reference.pinpoint.caseNumber}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      .
                    </p>
                  ) : null}
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                  >
                    {reference.url}
                  </a>
                  {reference.notes ? (
                    <p className="mt-2 text-sm leading-7 text-zinc-700">
                      {reference.notes}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-amber-300/40 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                No official source reference has been verified for this country profile yet.
                The profile remains non-exhaustive and under review.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section id="notes" className="scroll-mt-28 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardHeader>
            <CardTitle>Country notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-zinc-700">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                National AI regulation notes
              </p>
              <p className="mt-2">{nationalAIRegulationNotes}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                National case law notes
              </p>
              <p className="mt-2">{nationalCaseLawNotes}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                National soft law / guidance notes
              </p>
              <p className="mt-2">{nationalSoftLawNotes}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardHeader>
            <CardTitle>Latest relevant updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-zinc-700">
            {profile.latestRelevantUpdates.length > 0 ? (
              profile.latestRelevantUpdates.map((entry) => (
                <div
                  key={`${entry.title}-${entry.sourceUrl}`}
                  className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4"
                >
                  <p className="font-medium text-zinc-950">{entry.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-500">
                    {entry.date ? formatDisplayDate(entry.date) : "Date not verified"}
                  </p>
                  <p className="mt-2">{entry.note}</p>
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block underline decoration-black/15 underline-offset-4"
                  >
                    Official source
                  </a>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4">
                No specific country-level update is highlighted yet in this profile.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section id="published" className="scroll-mt-28 space-y-6">
        <SectionHeading
          eyebrow="Published monitor items"
          title={`Latest published entries for ${profile.countryName}`}
          description="Public monitor entries remain published-only. Country profiles do not expose private drafts or unreviewed content."
        />
        <Card className="rounded-[2rem] border-black/6 bg-white/70 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardContent className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
            {countryUpdates.length > 0 ? (
              countryUpdates.slice(0, 6).map((update) => (
                <UpdateCard
                  key={update.id}
                  update={update}
                  href={`/ai-regulation/${update.id}`}
                />
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-black/6 bg-white p-6 text-sm leading-7 text-zinc-700 xl:col-span-3">
                No published monitor item is currently available for this country. That does not imply an absence of national activity; it only means nothing has yet been reviewed and published through the existing workflow.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
