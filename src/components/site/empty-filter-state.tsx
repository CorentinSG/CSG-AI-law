import Link from "next/link";

interface EmptyFilterStateProps {
  title?: string;
  body?: string;
  resetHref: string;
  resetLabel?: string;
  hasActiveFilters: boolean;
}

export function EmptyFilterState({
  title,
  body,
  resetHref,
  resetLabel = "Reset filters",
  hasActiveFilters,
}: EmptyFilterStateProps) {
  const defaultTitle = hasActiveFilters
    ? "No results match the current filters"
    : "Nothing to show yet";

  const defaultBody = hasActiveFilters
    ? "Try adjusting or clearing the filters to see more results. The underlying data is still there — the current filter combination returned nothing."
    : "There are no items to display here yet. Check back after the next monitoring cycle or remove any active filters.";

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[1.8rem] border border-black/6 bg-white/60 px-8 py-12 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
        {hasActiveFilters ? "Filters active" : "Empty"}
      </p>
      <h3 className="mt-4 font-serif text-xl text-zinc-800">
        {title ?? defaultTitle}
      </h3>
      <p className="mt-3 max-w-md text-sm leading-7 text-zinc-500">
        {body ?? defaultBody}
      </p>
      {hasActiveFilters && (
        <Link
          href={resetHref}
          className="mt-6 rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          {resetLabel}
        </Link>
      )}
    </div>
  );
}

// Helper: detect whether any filter params are active
export function hasActiveFilterParams(
  params: Record<string, string>,
  filterKeys: string[],
): boolean {
  return filterKeys.some((key) => {
    const value = params[key];
    return typeof value === "string" && value !== "" && value !== "all";
  });
}
