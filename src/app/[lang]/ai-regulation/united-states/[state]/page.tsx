import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { buildLiveStoryFeed } from "@/agents/ai-regulation/storyClustering";
import { BreadcrumbNav } from "@/components/site/breadcrumb-nav";
import { CompactNewsCard } from "@/components/site/compact-news-card";
import { ImplementationProgressBar } from "@/components/site/implementation-progress-bar";
import { ConfidenceBadge, UsAiStatusBadge } from "@/components/site/legal-status-badge";
import { MotionReveal } from "@/components/site/motion-reveal";
import { MotionStagger, MotionStaggerItem } from "@/components/site/motion-stagger";
import { normalizeNewsItemRecord } from "@/content/ai-regulation/news";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { UpdateCard } from "@/components/site/update-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getUsStateAiLawProfileBySlug,
  getUsStateAiLawProfiles,
} from "@/content/ai-regulation/us-state-ai-law-baseline";
import { env } from "@/lib/env";
import { formatDisplayDate } from "@/lib/utils";

// ISR (T-RT0C): serve from cache, revalidate every 5 min. Admin review/edit
// actions call revalidatePath, so published changes surface promptly.
export const revalidate = 300;

export async function generateStaticParams() {
  return getUsStateAiLawProfiles().map((profile) => ({
    state: profile.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; lang: string }>;
}): Promise<Metadata> {
  const { state, lang } = await params;
  const profile = getUsStateAiLawProfileBySlug(state);
  if (!profile) return {};

  const title = `${profile.stateName} | ${lang === "fr" ? "Droit de l'IA aux États-Unis" : "U.S. AI Law"}`;
  const description = profile.publicSummary;
  const canonical = `${env.NEXT_PUBLIC_SITE_URL}/ai-regulation/united-states/${profile.slug}`;

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

function ListSection({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2">{empty}</p>
      )}
    </div>
  );
}

export default async function UsStatePage({
  params,
}: {
  params: Promise<{ state: string; lang: string }>;
}) {
  const { state, lang } = await params;
  const fr = lang === "fr";
  const profile = getUsStateAiLawProfileBySlug(state);
  if (!profile) notFound();

  // Window widened from 30 so story clustering sees enough items to group
  // cross-source duplicates instead of a thin top-of-feed slice.
  const [allUpdates, newsItems] = await Promise.all([
    updateRepository.listPublicUpdates(),
    updateRepository.getPublicNewsItems(120),
  ]);
  const updates = allUpdates.filter(
    (update) =>
      update.country === "United States" &&
      (update.jurisdiction === profile.stateName || update.title.includes(profile.stateName)),
  );
  // Clustered into cross-source stories before the display cap: only the most
  // authoritative report of each development is rendered, instead of one card
  // per source repeating the same story.
  const stateNews = buildLiveStoryFeed(
    newsItems
      .map(normalizeNewsItemRecord)
      .filter(
        (item) =>
          item.jurisdiction === profile.stateName ||
          item.countryOrState === profile.stateName ||
          item.title.toLowerCase().includes(profile.stateName.toLowerCase()),
      ),
    { limit: 5 },
  ).map((story) => story.primary);

  return (
    <SiteShell className="space-y-10">
      <section className="space-y-5">
        <MotionReveal>
          <BreadcrumbNav
            lang={fr ? "fr" : "en"}
            items={[
              { label: fr ? "Hub Droit de l'IA" : "AI Law Hub", href: "/ai-regulation" },
              { label: fr ? "États-Unis" : "United States", href: "/ai-regulation/united-states" },
              { label: profile.stateName, href: `/ai-regulation/united-states/${profile.slug}` },
            ]}
          />
          <SectionHeading
            as="h1"
            eyebrow={fr ? "Profil d'État" : "State profile"}
            title={profile.stateName}
            description={profile.publicSummary}
          />
          <div className="flex flex-wrap gap-2 pt-2">
            <UsAiStatusBadge status={profile.aiLawStatus} lang={fr ? "fr" : "en"} />
            <ConfidenceBadge level={profile.confidenceLevel} lang={fr ? "fr" : "en"} />
          </div>
          <ImplementationProgressBar
            status={profile.aiLawStatus}
            confidence={profile.confidenceLevel}
            label={fr ? "Statut du droit de l'IA" : "AI law status"}
            lang={fr ? "fr" : "en"}
            className="max-w-sm pt-2"
          />
        </MotionReveal>
        <MotionStagger className="grid gap-4 md:grid-cols-3" stagger={0.09}>
          <MotionStaggerItem>
            <Card className="rounded-[1.7rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,15,15,0.07)]">
              <CardContent className="space-y-2 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                  {fr ? "Statut du droit de l'IA" : "AI law status"}
                </p>
                <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
                  {profile.aiLawStatusLabel}
                </p>
              </CardContent>
            </Card>
          </MotionStaggerItem>
          <MotionStaggerItem>
            <Card className="rounded-[1.7rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,15,15,0.07)]">
              <CardContent className="space-y-2 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                  {fr ? "Confiance" : "Confidence"}
                </p>
                <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
                  {profile.confidenceLevel}
                </p>
              </CardContent>
            </Card>
          </MotionStaggerItem>
          <MotionStaggerItem>
            <Card className="rounded-[1.7rem] border-black/6 bg-white shadow-[0_14px_40px_rgba(15,15,15,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,15,15,0.07)]">
              <CardContent className="space-y-2 p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">
                  {fr ? "Dernière revue" : "Last reviewed"}
                </p>
                <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
                  {formatDisplayDate(profile.lastReviewedDate)}
                </p>
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {profile.citationQualityStatus.replaceAll("_", " ")}
                </p>
              </CardContent>
            </Card>
          </MotionStaggerItem>
        </MotionStagger>
      </section>

      {/* Live news panel for this state */}
      <MotionReveal delay={0.1}>
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-red-600">
              {profile.stateName} · {fr ? "Veille en direct" : "Live monitoring"}
            </p>
          </div>

          {stateNews.length > 0 ? (
            <div className="grid gap-3">
              {stateNews.map((item) => (
                <CompactNewsCard key={item.id} item={item} horizontal />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.6rem] border border-black/6 bg-white/80 p-5">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-zinc-200" />
                <p className="text-sm text-zinc-500">
                  {fr
                    ? `Aucun développement juridique public actuellement visible pour ${profile.stateName}. La veille continue — les éléments apparaîtront ici une fois sourcés et rendus publics.`
                    : `No public legal developments currently visible for ${profile.stateName}. Monitoring continues — items will appear here once source-backed and publicly visible.`}
                </p>
              </div>
            </div>
          )}
        </section>
      </MotionReveal>

      <MotionReveal delay={0.15}>
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
            <CardHeader>
              <CardTitle>{fr ? "Posture du droit de l\u2019IA de l\u2019État" : "State AI-law posture"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-7 text-zinc-700">
              <ListSection
                title={fr ? "Lois IA promulguées" : "Enacted AI statutes"}
                items={profile.enactedAIStatutes}
                empty={fr ? "Aucune loi IA promulguée n\u2019a encore été vérifiée dans ce profil de base." : "No enacted AI statute has been verified into this baseline profile yet."}
              />
              <ListSection
                title={fr ? "Projets de loi IA en cours" : "Pending AI bills"}
                items={profile.pendingAIBills}
                empty={fr ? "Aucun projet de loi IA en cours n\u2019a encore été vérifié dans ce profil de base." : "No pending AI bill has been verified into this baseline profile yet."}
              />
              <ListSection
                title={fr ? "Activité des agences" : "Agency activity"}
                items={[
                  ...profile.stateAGActivity,
                  ...profile.statePrivacyAgencyActivity,
                  ...profile.laborCivilRightsAgencyActivity,
                ]}
                empty={fr ? "Aucune activité IA d\u2019une agence d\u2019État n\u2019a encore été vérifiée dans ce profil." : "No state agency AI activity has been verified into this profile yet."}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.9rem] border-black/6 bg-white shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
            <CardHeader>
              <CardTitle>{fr ? "Posture éditoriale" : "Editorial posture"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-zinc-700">
              <p>
                {fr
                  ? "Ce profil d\u2019État ne constitue qu\u2019une couverture de base. L\u2019absence d\u2019un élément vérifié ici ne signifie pas l\u2019absence de loi d\u2019État, de projets de loi, de contentieux ou d\u2019activité d\u2019agence."
                  : "This state profile is baseline coverage only. The absence of a verified item here does not mean the absence of state law, bills, litigation, or agency activity."}
              </p>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  {fr ? "Avertissements de sources manquantes" : "Missing source warnings"}
                </p>
                <ul className="mt-2 space-y-2">
                  {profile.missingSourceWarnings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>
      </MotionReveal>

      <MotionReveal delay={0.2}>
        <section className="space-y-6">
          <SectionHeading
            eyebrow={fr ? "Citations précises" : "Precise citations"}
            title={fr ? "Références de sources officielles" : "Official source references"}
            description={fr ? "Les affirmations de droit d\u2019État doivent rester prudentes sauf appui par des références de sources officielles." : "State-law claims should remain conservative unless supported by official source references."}
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
                      {reference.authorityType ?? (fr ? "type d\u2019autorité non détecté" : "authority type not detected")}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">
                      {fr ? "Dernière vérification\u00a0: " : "Last verified: "}{formatDisplayDate(reference.lastVerifiedAt ?? null)}.
                    </p>
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm text-zinc-800 underline decoration-black/15 underline-offset-4"
                    >
                      {reference.url}
                    </a>
                    {reference.notes ? (
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{reference.notes}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-amber-300/40 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                  {fr
                    ? "Aucune référence de source officielle d\u2019État n\u2019a encore été vérifiée pour ce profil. Le profil reste en cours de revue."
                    : "No official state source reference has been verified for this profile yet. The profile remains under review."}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </MotionReveal>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Published monitor items"
          title={fr ? `Dernières entrées publiées pour ${profile.stateName}` : `Latest published entries for ${profile.stateName}`}
          description={fr ? "Les entrées publiques du monitor restent réservées au publié. Les profils d'État n'exposent pas les brouillons privés ni les pistes de découverte." : "Public monitor entries remain published-only. State profiles do not expose private drafts or discovery leads."}
        />
        <Card className="rounded-[2rem] border-black/6 bg-white/70 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
          <CardContent className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
            {updates.length > 0 ? (
              updates.slice(0, 6).map((update) => (
                <UpdateCard key={update.id} update={update} href={`/ai-regulation/${update.id}`} />
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-black/6 bg-white p-6 text-sm leading-7 text-zinc-700 xl:col-span-3">
                {fr ? "Aucun élément publié du monitor n\u2019est actuellement disponible pour cet État." : "No published monitor item is currently available for this state."}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
