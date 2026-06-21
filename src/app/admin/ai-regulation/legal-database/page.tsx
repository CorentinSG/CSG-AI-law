import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import {
  deriveUpdateAuthorityType,
  getAuthorityPresentation,
  getAuthorityPriorityRank,
} from "@/agents/ai-regulation/utils/authority";
import type { AiRegulatoryUpdate } from "@/agents/ai-regulation/types";
import { FilterBar } from "@/components/site/filter-bar";
import { PaginationControls } from "@/components/site/pagination-controls";
import { SiteShell } from "@/components/site/shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RegulatoryUpdateFilters } from "@/db/repository-types";
import { getOffsetFromPage, parsePageParam } from "@/lib/pagination";

export const dynamic = "force-dynamic";

const pageSize = 30;

// The legal database is sorted on three axes, in this order:
//   1. Nature of the source (authorityType: Binding law -> ... -> Other)
//   2. Region where it applies
//   3. Legal area (the AI-law domain it concerns)
const legalDatabaseFilters = [
  { key: "authority", label: "Nature" },
  { key: "region", label: "Region" },
  { key: "legalArea", label: "Legal area" },
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "developmentType", label: "Development type" },
  { key: "importanceLevel", label: "Importance" },
  { key: "status", label: "Status" },
  { key: "sourceName", label: "Source" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    dateStyle: "medium",
  });
}

export default async function LegalDatabasePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = ((await searchParams) ?? {}) as Record<string, string>;
  const page = parsePageParam(params.page, 1);
  const query = (params.q ?? "").trim().toLowerCase();

  // The "Nature" facet is now a first-class indexed DB filter (Codex migration
  // 012). The repository applies it server-side when the column exists and
  // transparently falls back to deriving authority in-memory if the migration
  // is not yet applied — so this is safe before/after the prod migration.
  const repoFilters: RegulatoryUpdateFilters = {
    status: params.status,
    jurisdiction: params.jurisdiction,
    region: params.region,
    legalArea: params.legalArea,
    developmentType: params.developmentType,
    importanceLevel: params.importanceLevel,
    sourceName: params.sourceName,
    authorityType: params.authority,
  };

  const [allUpdates, baseOptions] = await Promise.all([
    updateRepository.listUpdates(repoFilters),
    updateRepository.listDistinctFilterValues("admin"),
  ]);

  // Prefer the stored authority_type column; fall back to derivation only when
  // a row predates the backfill.
  const authorityOf = (update: AiRegulatoryUpdate) =>
    update.authorityType ?? deriveUpdateAuthorityType(update);

  // Only the free-text query stays in-memory; every facet is a server filter.
  const filtered = allUpdates.filter((update) => {
    if (!query) return true;
    const haystack = [
      update.title,
      update.oneSentenceSummary,
      update.summary,
      update.country,
      update.region,
      update.legalArea,
      ...update.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  // Three-axis global sort: nature -> region -> legal area, then newest first.
  const sorted = [...filtered].sort((a, b) => {
    const authorityDelta =
      getAuthorityPriorityRank(authorityOf(a)) -
      getAuthorityPriorityRank(authorityOf(b));
    if (authorityDelta !== 0) return authorityDelta;

    const regionDelta = a.region.localeCompare(b.region);
    if (regionDelta !== 0) return regionDelta;

    const legalAreaDelta = a.legalArea.localeCompare(b.legalArea);
    if (legalAreaDelta !== 0) return legalAreaDelta;

    return (
      new Date(b.detectedDate).getTime() - new Date(a.detectedDate).getTime()
    );
  });

  const total = sorted.length;
  const offset = getOffsetFromPage(page, pageSize);
  const pageItems = sorted.slice(offset, offset + pageSize);

  const options: Record<string, string[]> = {
    ...baseOptions,
    authority: baseOptions.authorityType ?? [],
  };

  const basePath = "/admin/ai-regulation/legal-database";

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Admin · AI Regulation
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              Legal database
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-400">
              Every legal-intelligence entry, sorted by nature of the source
              (binding law → guidance → soft law → other), then by region, then
              by legal area. Filter on any axis or search across titles,
              summaries, and tags.
            </p>
          </div>
          <Link
            href="/admin/ai-regulation"
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-white/10"
          >
            ← Review queue
          </Link>
        </div>

        <form method="get" action={basePath} className="flex gap-2">
          {/* Preserve active filters when submitting a new text query. */}
          {Object.entries(params).map(([key, value]) =>
            key === "q" || key === "page" ? null : (
              <input key={key} type="hidden" name={key} value={value} />
            ),
          )}
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search titles, summaries, tags…"
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Search
          </button>
        </form>

        <FilterBar
          searchParams={params}
          options={options}
          basePath={basePath}
          filters={legalDatabaseFilters}
          persistentParams={params.q ? { q: params.q } : undefined}
        />

        <Card>
          <CardHeader>
            <CardTitle>
              {total} {total === 1 ? "entry" : "entries"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pageItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">
                No entries match the current filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                      <th className="py-2 pr-3 font-medium">Nature</th>
                      <th className="py-2 pr-3 font-medium">Region</th>
                      <th className="py-2 pr-3 font-medium">Legal area</th>
                      <th className="py-2 pr-3 font-medium">Title</th>
                      <th className="py-2 pr-3 font-medium">Type</th>
                      <th className="py-2 pr-3 font-medium">Importance</th>
                      <th className="py-2 pr-3 font-medium">Date</th>
                      <th className="py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((update) => {
                      const authority = getAuthorityPresentation(
                        authorityOf(update),
                      );
                      return (
                        <tr
                          key={update.id}
                          className="border-b border-white/5 align-top transition hover:bg-white/5"
                        >
                          <td className="py-2 pr-3">
                            <span className="inline-block rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-zinc-200">
                              {authority.label}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-zinc-300">
                            {update.region}
                          </td>
                          <td className="py-2 pr-3 text-zinc-300">
                            {update.legalArea}
                          </td>
                          <td className="py-2 pr-3 text-zinc-100">
                            <Link
                              href={`/admin/ai-regulation/${update.id}`}
                              className="hover:underline"
                            >
                              {update.title}
                            </Link>
                            <span className="block text-xs text-zinc-500">
                              {update.country} · {update.sourceName}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-zinc-400">
                            {update.developmentType}
                          </td>
                          <td className="py-2 pr-3 text-zinc-400">
                            {update.importanceLevel}
                          </td>
                          <td className="py-2 pr-3 text-zinc-400">
                            {formatDate(update.publicationDate)}
                          </td>
                          <td className="py-2 text-zinc-400">
                            {update.status.replaceAll("_", " ")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4">
              <PaginationControls
                basePath={basePath}
                searchParams={params}
                page={page}
                pageSize={pageSize}
                total={total}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
