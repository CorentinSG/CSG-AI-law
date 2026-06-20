import Link from "next/link";

const defaultFilters = [
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "region", label: "Region" },
  { key: "legalArea", label: "Legal area" },
  { key: "developmentType", label: "Development type" },
  { key: "importanceLevel", label: "Importance" },
  { key: "publicationDate", label: "Date" },
  { key: "tag", label: "Tag" },
  { key: "sourceName", label: "Source" },
];

/** Builds a URL that removes a single filter key from the current params. */
function removeFilterUrl(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  removeKey: string,
  persistentParams?: Record<string, string>,
) {
  const params = new URLSearchParams();
  // Keep persistent params
  for (const [k, v] of Object.entries(persistentParams ?? {})) {
    params.set(k, v);
  }
  // Keep all other active filters except the one being removed
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === removeKey || k === "page") continue;
    if (v && v !== "all") {
      params.set(k, String(v));
    }
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function FilterBar({
  searchParams,
  options,
  basePath,
  filters = defaultFilters,
  persistentParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
  options: Record<string, string[]>;
  basePath: string;
  filters?: Array<{ key: string; label: string }>;
  persistentParams?: Record<string, string>;
}) {
  const resetParams = new URLSearchParams(persistentParams);

  // Active filters: params that are set and not "all", excluding persistent params and pagination
  const persistentKeys = new Set(Object.keys(persistentParams ?? {}));
  const activeFilters = filters
    .map((f) => {
      const value = searchParams[f.key];
      if (!value || value === "all" || persistentKeys.has(f.key)) return null;
      return { key: f.key, label: f.label, value: String(value) };
    })
    .filter(Boolean) as { key: string; label: string; value: string }[];

  return (
    <div className="space-y-3">
      {/* Active filter chips */}
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
            Active filters
          </p>
          {activeFilters.map((f) => (
            <Link
              key={f.key}
              href={removeFilterUrl(basePath, searchParams, f.key, persistentParams)}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800 transition hover:bg-indigo-100"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] opacity-70">{f.label}:</span>
              {f.value}
              <span aria-hidden className="ml-0.5 opacity-60">×</span>
            </Link>
          ))}
          <Link
            href={resetParams.size > 0 ? `${basePath}?${resetParams.toString()}` : basePath}
            className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs text-zinc-500 transition hover:bg-zinc-50"
          >
            Clear all
          </Link>
        </div>
      ) : null}

      {/* Filter form */}
      <form
        action={basePath}
        className="glass-panel noise-overlay grid gap-4 rounded-[1.8rem] p-5 md:grid-cols-3 xl:grid-cols-8"
      >
        {Object.entries(persistentParams ?? {}).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        {filters.map((filter) => (
          <label key={filter.key} className="text-sm text-zinc-700">
            <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-600">
              {filter.label}
            </span>
            <select
              name={filter.key}
              defaultValue={String(searchParams[filter.key] ?? "all")}
              className="w-full rounded-xl border border-black/8 bg-white/70 px-3 py-2 text-sm text-zinc-900 backdrop-blur-sm transition-colors duration-150 hover:border-black/16 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              <option value="all">All</option>
              {(options[filter.key] ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="rounded-xl bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-zinc-800 active:scale-[0.98]"
          >
            Apply
          </button>
          <Link
            href={resetParams.size > 0 ? `${basePath}?${resetParams.toString()}` : basePath}
            className="rounded-xl border border-black/8 px-4 py-2 text-sm text-zinc-800 transition-colors duration-150 hover:bg-zinc-50 active:scale-[0.98]"
          >
            Reset
          </Link>
        </div>
      </form>
    </div>
  );
}
