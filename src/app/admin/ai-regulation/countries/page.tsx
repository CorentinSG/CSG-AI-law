import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
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

export default async function AdminCountryProfilesPage() {
  const countries = await updateRepository.listCountryIntelligence();
  const sorted = [...countries].sort((a, b) =>
    a.countryName.localeCompare(b.countryName),
  );

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
          <Card key={country.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  {country.countryName}{" "}
                  <span className="text-sm font-normal text-zinc-500">
                    ({country.countryCode})
                  </span>
                </span>
                <span
                  className={`text-xs uppercase tracking-[0.24em] ${
                    reviewStatusTone[country.reviewStatus] ?? "text-zinc-400"
                  }`}
                >
                  {country.reviewStatus.replaceAll("_", " ")}
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
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-100"
                >
                  Edit profile
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </SiteShell>
  );
}
