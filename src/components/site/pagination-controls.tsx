import Link from "next/link";

import { buildCursorHref, buildPageHref } from "@/lib/pagination";

export function PaginationControls({
  basePath,
  searchParams,
  page,
  pageSize,
  total,
  pageParamKey = "page",
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  page: number;
  pageSize: number;
  total: number;
  pageParamKey?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;

  return (
    <div className="flex flex-col gap-3 rounded-[1.6rem] border border-black/6 bg-white/70 p-4 text-sm text-zinc-700 md:flex-row md:items-center md:justify-between">
      <p>
        Page {page} of {totalPages} - {total} items
      </p>
      <div className="flex items-center gap-3">
        {prevPage ? (
          <Link
            href={buildPageHref(basePath, searchParams, prevPage, pageParamKey)}
            className="rounded-xl border border-black/8 px-4 py-2 text-zinc-900"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-xl border border-black/8 px-4 py-2 text-zinc-400">
            Previous
          </span>
        )}
        {nextPage ? (
          <Link
            href={buildPageHref(basePath, searchParams, nextPage, pageParamKey)}
            className="rounded-xl bg-zinc-950 px-4 py-2 text-white"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-xl border border-black/8 px-4 py-2 text-zinc-400">
            Next
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Forward-only cursor pagination bar for public surfaces.
 * No page numbers — no COUNT(*) query, stable under live inserts.
 */
export function CursorPaginationControls({
  basePath,
  searchParams,
  nextCursorEncoded,
  cursorParamKey = "after",
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  /** Base64url-encoded next cursor. Null when there are no more pages. */
  nextCursorEncoded: string | null;
  cursorParamKey?: string;
}) {
  const isFirstPage = !searchParams[cursorParamKey];
  const nextHref = nextCursorEncoded
    ? buildCursorHref(basePath, searchParams, nextCursorEncoded, cursorParamKey)
    : null;

  // First-page href: all existing params minus the cursor param
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    const current = Array.isArray(value) ? value[0] : value;
    if (!current || key === cursorParamKey) continue;
    params.set(key, current);
  }
  const qs = params.toString();
  const firstPageHref = qs ? `${basePath}?${qs}` : basePath;

  return (
    <div className="flex flex-col gap-3 rounded-[1.6rem] border border-black/6 bg-white/70 p-4 text-sm text-zinc-700 md:flex-row md:items-center md:justify-between">
      <p>{nextHref ? "More items available" : "End of results"}</p>
      <div className="flex items-center gap-3">
        {!isFirstPage ? (
          <Link
            href={firstPageHref}
            className="rounded-xl border border-black/8 px-4 py-2 text-zinc-900"
          >
            &larr; Back to start
          </Link>
        ) : (
          <span className="rounded-xl border border-black/8 px-4 py-2 text-zinc-400">
            &larr; Back to start
          </span>
        )}
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded-xl bg-zinc-950 px-4 py-2 text-white"
          >
            Next &rarr;
          </Link>
        ) : (
          <span className="rounded-xl border border-black/8 px-4 py-2 text-zinc-400">
            Next &rarr;
          </span>
        )}
      </div>
    </div>
  );
}
