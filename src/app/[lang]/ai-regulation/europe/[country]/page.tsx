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
import { MotionReveal } from "@/components/site/motion-reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { pageAlternates } from "@/lib/i18n/metadata";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
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

export default async function EuropeCountryPage({
  params,
}: {
  params: Promise<{ lang: string; country: string }>;
}) {
  const { lang: langParam, country } = await params;
  const lang = isLocale(langParam) ? langParam : DEFAULT_LOCALE;
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

  if (isCountryConsole && snapshot) {

    return (
      <SiteShell className="space-y-14">
        <section id="overview" className="scroll-mt-28 space-y-8">
          <MotionReveal>
            <BreadcrumbNav
              lang={lang}
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
                href: localeHref(lang, `/ai-regulation/${update.id}`),
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

  // Console-lite for countries without a live agent/snapshot yet: same
  // visual system as the full console, built from the verified profile data.
  // Admin-editable authority lists fold into the chip row (no prose walls).
  const liteAuthorityChips = Array.from(
    new Set([
      ...authorityChips,
      ...competentAuthorities,
      ...marketSurveillanceAuthorities,
      ...notifyingAuthorities,
    ]),
  );
  const countryNotes = [
    { label: "National AI regulation", text: nationalAIRegulationNotes },
    { label: "National case law", text: nationalCaseLawNotes },
    { label: "Soft law / guidance", text: nationalSoftLawNotes },
  ].filter((note) => Boolean(note.text));
  const referenceEntries = profile.sourceReferences.map((reference) => ({
    id: `${reference.sourceRole}-${reference.url}`,
    chips: [
      { label: reference.sourceType.replaceAll("_", " ") },
      ...(reference.pinpoint?.article ? [{ label: `art. ${reference.pinpoint.article}` }] : []),
    ],
    title: `${reference.institution} — ${reference.title}`,
    note: reference.notes ?? "",
    meta: `${reference.publicationDate ? formatDisplayDate(reference.publicationDate) : "Date under review"} · verified ${formatDisplayDate(reference.lastVerifiedAt ?? null)}`,
    href: reference.url,
  }));
  const latestUpdateEntries = profile.latestRelevantUpdates.map((entry) => ({
    id: `${entry.title}-${entry.sourceUrl}`,
    chips: [{ label: "verified update", tone: "info" as const }],
    title: entry.title,
    note: entry.note,
    meta: entry.date ? formatDisplayDate(entry.date) : "Date not verified",
    href: entry.sourceUrl,
  }));

  return (
    <SiteShell className="space-y-14">
      <section id="overview" className="scroll-mt-28 space-y-8">
        <MotionReveal>
          <BreadcrumbNav
            lang={lang}
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
            { value: profile.officialSourceUrls.length, label: "Official sources" },
            { value: profile.sourceReferences.length, label: "Source references" },
            { value: liteAuthorityChips.length, label: "Authorities" },
            { value: countryUpdates.length, label: "Published entries" },
          ]}
        />
        <p className="max-w-2xl text-sm leading-7 text-zinc-700">{publicSummary}</p>
        {profile.implementationStatus === "needs_review" && profile.sourceReferences.length === 0 ? (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-600">
            Verification pending — no national source verified yet; the EU framework still applies.
          </p>
        ) : null}
      </section>

      <HubScrollNav
        sections={[
          { id: "overview", label: "Overview" },
          { id: "architecture", label: "Architecture" },
          { id: "corpus", label: "Corpus" },
          { id: "references", label: "References" },
          { id: "published", label: "Published" },
        ]}
      />

      <section id="architecture" className="scroll-mt-28 space-y-8">
        <MotionReveal>
          <SectionHeading eyebrow="Legal architecture" title="Settled and moving" />
        </MotionReveal>
        <MotionReveal delay={0.05}>
          <div className="flex flex-wrap gap-1.5">
            {liteAuthorityChips.map((label, idx) => (
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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-strong">
              Implementation
            </p>
            <p className="max-w-xl text-sm leading-7 text-zinc-700">
              {profile.aiActImplementationNotes}
            </p>
            {implementationMeasures.length > 0 ? (
              <ul className="space-y-1.5 text-sm leading-6 text-zinc-700">
                {implementationMeasures.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-zinc-300">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-strong">
              Latest verified updates
            </p>
            {latestUpdateEntries.length > 0 ? (
              <CountryLedger entries={latestUpdateEntries} />
            ) : (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                No country-level update highlighted yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section id="corpus" className="scroll-mt-28 space-y-6">
        <MotionReveal>
          <SectionHeading eyebrow="Verified corpus" title="Official sources" />
        </MotionReveal>
        <MotionReveal delay={0.05}>
          <CorpusExplorer families={corpusFamilies} />
        </MotionReveal>
      </section>

      <section id="references" className="scroll-mt-28 space-y-6">
        <MotionReveal>
          <SectionHeading eyebrow="Precise citations" title="Official source references" />
        </MotionReveal>
        {referenceEntries.length > 0 ? (
          <CountryLedger entries={referenceEntries} />
        ) : (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-600">
            No verified official reference yet — profile under review.
          </p>
        )}
        {missingSourceWarnings.length > 0 || editorialNotes.length > 0 || countryNotes.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {countryNotes.length > 0 ? (
              <details className="group rounded-[1.2rem] border border-black/6 bg-zinc-50/80 px-4 py-3 text-sm leading-6 text-zinc-700">
                <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500 transition-colors group-open:text-zinc-700">
                  Country notes · {countryNotes.length}
                </summary>
                <div className="mt-3 space-y-3">
                  {countryNotes.map((note) => (
                    <div key={note.label}>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">{note.label}</p>
                      <p className="mt-1">{note.text}</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
            {missingSourceWarnings.length > 0 ? (
              <details className="group rounded-[1.2rem] border border-black/6 bg-zinc-50/80 px-4 py-3 text-sm leading-6 text-zinc-700">
                <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500 transition-colors group-open:text-zinc-700">
                  Missing source warnings · {missingSourceWarnings.length}
                </summary>
                <ul className="mt-3 space-y-2">
                  {missingSourceWarnings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            ) : null}
            {editorialNotes.length > 0 ? (
              <details className="group rounded-[1.2rem] border border-black/6 bg-zinc-50/80 px-4 py-3 text-sm leading-6 text-zinc-700">
                <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500 transition-colors group-open:text-zinc-700">
                  Editorial notes · {editorialNotes.length}
                </summary>
                <ul className="mt-3 space-y-2">
                  {editorialNotes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
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
              href: localeHref(lang, `/ai-regulation/${update.id}`),
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
