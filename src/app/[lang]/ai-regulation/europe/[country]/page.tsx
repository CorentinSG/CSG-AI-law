import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCountryConsoleEntry } from "@/agents/ai-regulation/countryConsoleRegistry";
import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { groupCountryIntelligenceSourcesByFamily } from "@/agents/ai-regulation/utils/country-intelligence-view";
import {
  getEuropeCountryProfileBySlug,
  getEuropeCountryProfiles,
} from "@/content/ai-regulation/europe-country-profiles";
import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import {
  CorpusExplorer,
  CountryConsoleHero,
  CountryLedger,
  SignalStrip,
} from "@/components/site/country-console";
import { HubScrollNav } from "@/components/site/hub-scroll-nav";
import { ImplementationProgressBar } from "@/components/site/implementation-progress-bar";
import { ConfidenceBadge, ImplementationBadge } from "@/components/site/legal-status-badge";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { UpdateCard } from "@/components/site/update-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pageAlternates } from "@/lib/i18n/metadata";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";
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
  params: Promise<{ lang: string; country: string }>;
}): Promise<Metadata> {
  const { lang, country } = await params;
  const profile = getEuropeCountryProfileBySlug(country);
  if (!profile) return {};

  const title =
    lang === "fr"
      ? `Réglementation de l'IA en ${profile.countryName} — suivi juridique`
      : `${profile.countryName} AI Regulation — legal monitoring`;
  const description = profile.publicSummary;
  const alternates = pageAlternates(lang, `/ai-regulation/europe/${profile.slug}`);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
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

  // Country Console (DESIGN.md §6), generalized: every country with a live
  // agent + verified snapshot renders the unified console layout via the
  // registry — no per-slug branches. Countries without console data keep the
  // generic legacy layout below.
  const consoleEntry = getCountryConsoleEntry(profile.slug);
  const [updates, liveData, dbCountry, dbCountrySources] = await Promise.all([
    // Region filter pushed into the query; the country/jurisdiction match
    // stays in memory because it is an OR across two columns.
    updateRepository.listPublicUpdates({ region: "Europe" }),
    consoleEntry ? consoleEntry.getLiveData(6) : Promise.resolve(null),
    updateRepository.getCountryIntelligenceBySlug(profile.slug, { scope: "public" }),
    updateRepository.listCountryIntelligenceSources(`country-${profile.slug}`),
  ]);
  const snapshot = consoleEntry ? consoleEntry.getSnapshot() : null;
  const isCountryConsole = consoleEntry !== null && snapshot !== null;
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

  // ── Country Console (DESIGN.md §6) — France pilot ─────────────────────────
  // A complete standalone layout: one glance = posture, rows instead of
  // cards-of-paragraphs, collapsed notes, no ops copy. Other countries keep
  // the legacy layout below until rollout.
  if (isCountryConsole && snapshot) {
    const corpusFamilies = [
      { id: "regulation", label: "Regulation", items: nationalAIRegulationSources },
      { id: "case-law", label: "Case law", items: nationalCaseLawSources },
      { id: "soft-law", label: "Soft law", items: nationalSoftLawSources },
    ].map((family) => ({
      id: family.id,
      label: family.label,
      items: family.items.map((source) => ({
        label: source.label,
        institution: source.institution,
        url: source.url,
        note: source.note,
      })),
    }));

    const authorityChips = [
      profile.dataProtectionAuthority,
      ...profile.relevantMinistriesOrAgencies,
    ].filter((label): label is string => Boolean(label));

    return (
      <SiteShell className="space-y-14">
        <section id="overview" className="scroll-mt-28 space-y-8">
          <MotionReveal>
            <BreadcrumbNav
              items={[
                { label: "AI Law Hub", href: "/ai-regulation" },
                { label: "Europe", href: "/ai-regulation/europe" },
                { label: profile.countryName, href: `/ai-regulation/europe/${profile.slug}` },
              ]}
            />
          </MotionReveal>
          <CountryConsoleHero
            region="europe"
            code={profile.countryCode}
            name={profile.countryName}
            implementationStatus={profile.implementationStatus}
            implementationConfidence={profile.implementationConfidence}
            gaugeLabel="EU AI Act implementation"
            lastReviewed={formatDisplayDate(profile.lastReviewedDate)}
            stats={[
              { value: liveData?.items.length ?? 0, label: "Live signals" },
              { value: snapshot.authorityMap.length, label: "Authority signals" },
              { value: snapshot.verifiedDecisions.length, label: "Verified decisions" },
              { value: profile.officialSourceUrls.length, label: "Official sources" },
            ]}
          />
        </section>

        <HubScrollNav
          sections={[
            { id: "overview", label: "Overview" },
            { id: "live", label: "Live" },
            { id: "architecture", label: "Architecture" },
            { id: "corpus", label: "Corpus" },
            { id: "published", label: "Published" },
          ]}
        />

        {liveData ? (
          <section id="live" className="scroll-mt-28 space-y-6">
            <MotionReveal>
              <SectionHeading
                eyebrow="Ongoing monitoring"
                title={`${profile.countryName} AI law, right now`}
              />
            </MotionReveal>
            <CountryLedger
              entries={liveData.items.map(({ item, currentness }) => ({
                id: item.id,
                chips: [
                  { label: item.developmentType.replaceAll("_", " ") },
                  { label: currentness.freshnessLabel.replaceAll("_", " "), tone: "info" as const },
                  ...(item.officialSourceFound
                    ? [{ label: "official source", tone: "gold" as const }]
                    : []),
                ],
                title: item.title,
                note: item.shortSummary,
                meta: `${
                  item.publicationDate ? formatDisplayDate(item.publicationDate) : "Date under review"
                } · ${item.sourceName}`,
                href: item.officialSourceUrl ?? item.sourceUrl,
              }))}
            />
            <SignalStrip
              primary={[
                { value: liveData.summary.breakingSignals, label: "Breaking", tone: "positive" },
                { value: liveData.summary.currentSignals, label: "Current" },
                { value: liveData.summary.highUrgencySignals, label: "High urgency" },
                {
                  value: liveData.summary.watchSignals + liveData.summary.staleSignals,
                  label: "Watch / stale",
                  tone: "warn",
                },
              ]}
              secondary={[
                { value: liveData.summary.officialLike, label: "official-source" },
                {
                  value:
                    liveData.summary.hardLawSignals +
                    liveData.summary.caseLawSignals +
                    liveData.summary.enforcementSignals,
                  label: "hard law & decisions",
                },
              ]}
            />
          </section>
        ) : null}

        <section id="architecture" className="scroll-mt-28 space-y-8">
          <MotionReveal>
            <SectionHeading
              eyebrow="Legal architecture"
              title="Settled and moving"
            />
          </MotionReveal>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-strong">
                Authority map
              </p>
              <CountryLedger
                entries={snapshot.authorityMap.map((entry) => ({
                  id: entry.id,
                  chips: [
                    { label: entry.category.replaceAll("_", " ") },
                    { label: entry.statusLabel.replaceAll("_", " "), tone: "info" as const },
                  ],
                  title: entry.title,
                  note: entry.note,
                  meta: `${
                    entry.publicationDate ? formatDisplayDate(entry.publicationDate) : "Date under review"
                  } · ${entry.sourceLabel}`,
                  href: entry.sourceUrl,
                }))}
              />
            </div>
            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-strong">
                Verified decisions &amp; acts
              </p>
              <CountryLedger
                entries={snapshot.verifiedDecisions.map((entry) => ({
                  id: entry.id,
                  chips: [
                    { label: entry.authorityType.replaceAll("_", " "), tone: "gold" as const },
                    ...(entry.docketOrCaseNumber ? [{ label: entry.docketOrCaseNumber }] : []),
                  ],
                  title: entry.title,
                  note: entry.shortSummary,
                  meta: `${entry.courtOrAuthority} · ${
                    entry.date ? formatDisplayDate(entry.date) : "Date under review"
                  }`,
                  href: entry.officialSourceUrl ?? undefined,
                }))}
              />
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-strong">
              Legal timeline
            </p>
            <CountryLedger
              entries={snapshot.timeline.map((entry) => ({
                id: entry.id,
                chips: [{ label: entry.category.replaceAll("_", " ") }],
                title: entry.title,
                note: entry.note,
                meta: `${formatDisplayDate(entry.date)} · ${entry.sourceLabel}`,
                href: entry.sourceUrl,
              }))}
            />
          </div>
        </section>

        <section id="corpus" className="scroll-mt-28 space-y-6">
          <MotionReveal>
            <SectionHeading
              eyebrow="Verified corpus"
              title="Official sources"
            />
          </MotionReveal>
          <MotionReveal delay={0.05}>
            <div className="flex flex-wrap gap-1.5">
              {authorityChips.map((label, idx) => (
                <span
                  key={label}
                  className={
                    idx === 0
                      ? "rounded-full border border-accent-strong/30 bg-accent/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-accent-strong"
                      : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600"
                  }
                >
                  {label}
                </span>
              ))}
            </div>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <CorpusExplorer families={corpusFamilies} />
          </MotionReveal>
        </section>

        <section id="published" className="scroll-mt-28 space-y-6">
          <MotionReveal>
            <SectionHeading
              eyebrow="Published monitor items"
              title={`Latest entries for ${profile.countryName}`}
            />
          </MotionReveal>
          {countryUpdates.length > 0 ? (
            <CountryLedger
              entries={countryUpdates.slice(0, 6).map((update) => ({
                id: update.id,
                chips: [
                  { label: update.developmentType.replaceAll("_", " ") },
                  ...(update.importanceLevel === "critical" || update.importanceLevel === "high"
                    ? [
                        {
                          label:
                            update.importanceLevel === "critical" ? "critical" : "high importance",
                          tone: "gold" as const,
                        },
                      ]
                    : []),
                ],
                title: update.title,
                note: update.oneSentenceSummary,
                meta: `${formatDisplayDate(update.publicationDate)} · ${update.legalArea.replaceAll("_", " ")}`,
                href: localeHref(DEFAULT_LOCALE, `/ai-regulation/${update.id}`),
              }))}
            />
          ) : (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              No published entry yet — monitoring continues.
            </p>
          )}
        </section>

        <MotionReveal>
          <p className="border-t border-white/8 pt-5 font-mono text-[9.5px] uppercase tracking-[0.2em] text-zinc-500">
            Legal research &amp; monitoring only — not legal advice · Non-exhaustive profile under continuous verification
          </p>
        </MotionReveal>
      </SiteShell>
    );
  }

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
        </MotionReveal>

        <MotionReveal>
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
          { id: "implementation", label: "Implementation" },
          { id: "sources", label: "Sources" },
          { id: "references", label: "References" },
          { id: "notes", label: "Notes" },
          { id: "published", label: "Published" },
        ]}
      />

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
          description="Public monitor entries remain published-only. Country profiles do not expose private drafts or unpublished content."
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
                No published monitor item is currently available for this country. That does not imply an absence of national activity; it only means nothing has yet been published through the existing workflow.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
