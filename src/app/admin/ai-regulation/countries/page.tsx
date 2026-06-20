import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { COUNTRY_REVIEW_OVERDUE_DAYS } from "@/agents/ai-regulation/country-review";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  });
}

const reviewStatusTone: Record<string, string> = {
  verified: "text-emerald-200",
  needs_review: "text-amber-200",
  stale: "text-orange-200",
  flagged: "text-red-200",
};

// T-RT5C (consumes T-RT5B): surface the persisted needs_re_review flag as a
// badge. The flag itself is computed/persisted by the backend; here we only
// present it, using the shared thresholds to choose tone/wording.
function getReReviewBadge(country: {
  needsReReview: boolean;
  lastReviewedAt?: string | null;
}) {
  if (!country.needsReReview) return null;

  if (!country.lastReviewedAt) {
    return { label: "Never reviewed", className: "border-red-400/40 bg-red-500/10 text-red-200" };
  }

  const reviewedAt = new Date(country.lastReviewedAt).getTime();
  const days = Number.isNaN(reviewedAt)
    ? null
    : Math.floor((Date.now() - reviewedAt) / (1000 * 60 * 60 * 24));
  const suffix = days === null ? "" : ` · ${days}d`;

  if (days !== null && days >= COUNTRY_REVIEW_OVERDUE_DAYS) {
    return {
      label: `Re-review overdue${suffix}`,
      className: "border-red-400/40 bg-red-500/10 text-red-200",
    };
  }
  return {
    label: `Needs re-review${suffix}`,
    className: "border-orange-400/40 bg-orange-500/10 text-orange-200",
  };
}

export default async function AdminCountryProfilesPage() {
  const [countries, unresolvedLeads] = await Promise.all([
    updateRepository.listCountryIntelligence(),
    // T-RT5C cross-corroboration: pull unresolved discovery leads so each country
    // can surface its own "verify on official source" follow-ups instead of
    // leaving matching leads sitting in a parallel global list.
    updateRepository.listDiscoveryLeads(200, "unresolved"),
  ]);
  const sorted = [...countries].sort((a, b) =>
    a.countryName.localeCompare(b.countryName),
  );

  const leadsByJurisdiction = new Map<string, typeof unresolvedLeads>();
  for (const lead of unresolvedLeads) {
    const key = (lead.possibleJurisdiction ?? "").trim().toLowerCase();
    if (!key) continue;
    const bucket = leadsByJurisdiction.get(key) ?? [];
    bucket.push(lead);
    leadsByJurisdiction.set(key, bucket);
  }
  const leadsForCountry = (country: { countryName: string }) =>
    leadsByJurisdiction.get(country.countryName.trim().toLowerCase()) ?? [];

  return (
    <SiteShell className="space-y-8" variant="admin" showFooter={false}>
      <div className="space-y-3">
        <Link
          href="/admin/ai-regulation"
          className="text-xs uppercase tracking-[0.35em] text-zinc-500"
        >
          Back to diagnostics
        </Link>
        <h1 className="font-serif text-4xl text-white">Country profiles</h1>
        <p className="max-w-3xl text-zinc-300">
          Edit the editorial fields of each country profile (public summary,
          editorial notes, missing-source warnings, review status) directly in
          the database. Saved edits appear on the public country page without a
          redeployment. Structural content (authority maps, source lists) stays
          sourced from the verified content layer.
        </p>
        {sorted.length === 0 ? (
          <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            No country_intelligence rows found. Run{" "}
            <code>npm run seed:country-intelligence</code> after applying
            migration 006 to populate this table.
          </p>
        ) : null}
      </div>

      <section className="grid gap-4">
        {sorted.map((country) => (
          <Card key={country.id} className="transition-colors duration-150 hover:bg-white/5">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  {country.countryName}{" "}
                  <span className="text-sm font-normal text-zinc-500">
                    ({country.countryCode})
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const badge = getReReviewBadge(country);
                    return badge ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    ) : null;
                  })()}
                  <span
                    className={`text-xs uppercase tracking-[0.24em] ${
                      reviewStatusTone[country.reviewStatus] ?? "text-zinc-400"
                    }`}
                  >
                    {country.reviewStatus.replaceAll("_", " ")}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-300">
                {country.publicSummary ?? "No public summary stored."}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                  reviewed {formatDateTime(country.lastReviewedAt)} by{" "}
                  {country.reviewedBy ?? "unknown"}
                </p>
                <Link
                  href={`/admin/ai-regulation/countries/${country.slug}`}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100 transition-colors duration-150 hover:border-white/20 hover:bg-white/8 active:scale-[0.98]"
                >
                  Edit profile
                </Link>
              </div>
              {(() => {
                const leads = leadsForCountry(country);
                if (leads.length === 0) return null;
                return (
                  <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-200">
                      {leads.length} discovery lead{leads.length > 1 ? "s" : ""} to corroborate
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Verify each on an official source before it can support this profile — not
                      legal authority on its own.
                    </p>
                    <ul className="mt-2 space-y-2">
                      {leads.slice(0, 4).map((lead) => {
                        const verifyUrl =
                          lead.officialSourceUrl ?? lead.outboundUrl ?? lead.discoverySourceUrl;
                        return (
                          <li key={lead.id} className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-zinc-200">{lead.headline}</span>
                            {verifyUrl ? (
                              <a
                                href={verifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-amber-100"
                              >
                                Verify on official source
                              </a>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                    {leads.length > 4 ? (
                      <Link
                        href="/admin/ai-regulation?tag=official_source_not_yet_identified"
                        className="mt-2 inline-flex text-[11px] text-amber-200 underline"
                      >
                        View all {leads.length} in the discovery queue
                      </Link>
                    ) : null}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        ))}
      </section>
    </SiteShell>
  );
}
