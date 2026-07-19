'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import type { AuthorityType } from "@/db/schema";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Slim, serializable projection of a database entry built server-side. */
export interface ExplorerEntry {
  id: string;
  href: string;
  title: string;
  summary: string;
  region: string;
  country: string;
  jurisdiction: string;
  legalArea: string;
  authorityType: AuthorityType;
  authorityLabel: string;
  importance: "critical" | "high" | "medium" | "low";
  date: string | null;
  sourceName: string;
  sourceUrl: string;
}

const authorityDot: Record<AuthorityType, string> = {
  "Binding law": "#34d399",
  "Proposed law": "#fbbf24",
  Regulation: "#38bdf8",
  "Agency guidance": "#60a5fa",
  "Enforcement action": "#fb7185",
  "Soft law": "#a78bfa",
  "Technical standard": "#a8a29e",
  "Governance framework": "#22d3ee",
  "Policy report": "#a1a1aa",
  "Best practice": "#e879f9",
  Other: "#a1a1aa",
};

/** Hard-to-soft ordering — drives the spectrum bars and the authority filter row. */
const authorityOrder: AuthorityType[] = [
  "Binding law",
  "Regulation",
  "Enforcement action",
  "Proposed law",
  "Agency guidance",
  "Governance framework",
  "Technical standard",
  "Soft law",
  "Policy report",
  "Best practice",
  "Other",
];

const periodOptions = [
  { key: "all", label: "All time", days: null },
  { key: "30d", label: "30 days", days: 30 },
  { key: "6m", label: "6 months", days: 183 },
  { key: "1y", label: "1 year", days: 365 },
] as const;

type PeriodKey = (typeof periodOptions)[number]["key"];
type Mode = "atlas" | "timeline";

const regionOrder = ["Europe", "North America", "International"];

function monthKey(date: string | null) {
  return date ? date.slice(0, 7) : "undated";
}

function monthLabel(key: string) {
  if (key === "undated") return "Undated";
  return new Date(`${key}-01T00:00:00`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function Pill({
  active,
  onClick,
  children,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dotColor?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-200 ${
        active
          ? "border-[color:var(--accent-strong)]/60 bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
          : "border-white/10 bg-white/[0.03] text-zinc-500 hover:border-white/20 hover:text-zinc-800"
      }`}
    >
      {dotColor ? (
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dotColor, opacity: active ? 1 : 0.6 }}
        />
      ) : null}
      {children}
    </motion.button>
  );
}

/** Thin stacked bar showing a jurisdiction's authority mix, hard-to-soft. */
function SpectrumBar({ mix, total }: { mix: Map<AuthorityType, number>; total: number }) {
  return (
    <span aria-hidden className="flex h-[3px] w-full overflow-hidden rounded-full bg-white/6">
      {authorityOrder.map((type) => {
        const n = mix.get(type);
        if (!n) return null;
        return (
          <span
            key={type}
            className="h-full"
            style={{ width: `${(n / total) * 100}%`, backgroundColor: authorityDot[type] }}
          />
        );
      })}
    </span>
  );
}

/** Month-grouped ledger of expandable one-line rows (shared by all list views). */
function Ledger({
  entries,
  reduced,
  openRow,
  setOpenRow,
  showJurisdiction,
}: {
  entries: ExplorerEntry[];
  reduced: boolean;
  openRow: string | null;
  setOpenRow: (id: string | null) => void;
  showJurisdiction: boolean;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, ExplorerEntry[]>();
    for (const e of entries) {
      const key = monthKey(e.date);
      const list = map.get(key);
      if (list) list.push(e);
      else map.set(key, [e]);
    }
    return Array.from(map.entries());
  }, [entries]);

  return (
    <div className="space-y-9">
      <AnimatePresence mode="popLayout" initial={false}>
        {groups.map(([key, items]) => (
          <motion.section
            key={key}
            layout={!reduced}
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="mb-1 flex items-baseline gap-2.5">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                {monthLabel(key)}
              </h3>
              <span className="font-mono text-[10px] tabular-nums text-[color:var(--accent-strong)]/80">
                {items.length}
              </span>
              <span aria-hidden className="h-px flex-1 self-center bg-white/8" />
            </div>
            <ul className="divide-y divide-white/8">
              {items.map((entry, idx) => {
                const expanded = openRow === entry.id;
                const dot = authorityDot[entry.authorityType];
                return (
                  <motion.li
                    key={entry.id}
                    layout={!reduced}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      ease,
                      delay: reduced ? 0 : Math.min(idx * 0.04, 0.24),
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOpenRow(expanded ? null : entry.id)}
                        aria-expanded={expanded}
                        className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3.5 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
                      >
                        <span
                          aria-hidden
                          className="size-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
                          style={{ backgroundColor: dot }}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-[15px] font-medium leading-6 tracking-[-0.01em] transition-colors duration-200 ${
                              expanded ? "text-zinc-950" : "text-zinc-800 group-hover:text-zinc-950"
                            }`}
                          >
                            {entry.title}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-zinc-400">
                            {showJurisdiction ? entry.jurisdiction : entry.legalArea}
                            {entry.date ? (
                              <>
                                <span aria-hidden className="mx-1.5 text-zinc-300">·</span>
                                {new Date(entry.date).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </>
                            ) : null}
                            {entry.importance === "critical" || entry.importance === "high" ? (
                              <>
                                <span aria-hidden className="mx-1.5 text-zinc-300">·</span>
                                <span className="text-[color:var(--accent-strong)]">
                                  {entry.importance === "critical" ? "Critical" : "High"}
                                </span>
                              </>
                            ) : null}
                          </span>
                        </span>
                        <span
                          className="hidden shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] sm:inline-flex"
                          style={{
                            color: dot,
                            borderColor: `${dot}4d`,
                            backgroundColor: `${dot}14`,
                          }}
                        >
                          {entry.authorityLabel}
                        </span>
                        <ChevronDown
                          aria-hidden
                          className={`size-3.5 shrink-0 transition-transform duration-200 ease-out ${
                            expanded
                              ? "rotate-180 text-[color:var(--accent-strong)]"
                              : "text-zinc-400 group-hover:text-zinc-600"
                          }`}
                        />
                      </button>
                      {entry.sourceUrl ? (
                        <a
                          href={entry.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${entry.title} — source`}
                          className="shrink-0 rounded-full border border-white/10 p-1.5 text-zinc-400 transition-colors duration-200 hover:border-[color:var(--accent-strong)]/40 hover:text-[color:var(--accent-strong)]"
                        >
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      ) : null}
                    </div>
                    <AnimatePresence initial={false}>
                      {expanded ? (
                        <motion.div
                          key="detail"
                          initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                          exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 pl-[22px] pr-10">
                            <p className="max-w-[70ch] text-sm leading-6 text-zinc-600">
                              {entry.summary}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <Link
                                href={entry.href}
                                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)] transition-transform hover:translate-x-0.5"
                              >
                                Open entry →
                              </Link>
                              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400">
                                {entry.legalArea}
                                <span aria-hidden className="mx-1.5 text-zinc-300">·</span>
                                {entry.sourceName}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          </motion.section>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function LegalDatabaseExplorer({
  entries,
  regionHubs,
  loadMoreHref,
  todayIso,
}: {
  entries: ExplorerEntry[];
  regionHubs: Array<{ label: string; kicker: string; href: string }>;
  loadMoreHref: string | null;
  todayIso: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("atlas");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  const [authority, setAuthority] = useState<AuthorityType | null>(null);
  const [legalArea, setLegalArea] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [highSignalOnly, setHighSignalOnly] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const authorities = useMemo(() => {
    const present = new Set(entries.map((e) => e.authorityType));
    return authorityOrder.filter((t) => present.has(t));
  }, [entries]);

  // Legal areas present in the data, most-frequent first (no dead filters).
  const legalAreas = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries) {
      if (e.legalArea) counts.set(e.legalArea, (counts.get(e.legalArea) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name);
  }, [entries]);

  // Panel filters (authority / period / high-signal) apply everywhere —
  // they shape the atlas tiles as much as the ledgers.
  const baseFiltered = useMemo(() => {
    const periodDays = periodOptions.find((p) => p.key === period)?.days ?? null;
    const cutoff = periodDays
      ? new Date(new Date(todayIso).getTime() - periodDays * 86400000)
      : null;

    return entries
      .filter((e) => {
        if (authority && e.authorityType !== authority) return false;
        if (legalArea && e.legalArea !== legalArea) return false;
        if (highSignalOnly && e.importance !== "critical" && e.importance !== "high") {
          return false;
        }
        if (cutoff) {
          if (!e.date) return false;
          if (new Date(e.date) < cutoff) return false;
        }
        return true;
      })
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [entries, authority, legalArea, period, highSignalOnly, todayIso]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return baseFiltered.filter((e) =>
      `${e.title} ${e.summary} ${e.jurisdiction} ${e.country} ${e.legalArea} ${e.sourceName}`
        .toLowerCase()
        .includes(q),
    );
  }, [baseFiltered, query]);

  // Atlas: jurisdictions clustered by region, each with count + authority mix.
  const atlasClusters = useMemo(() => {
    const byJurisdiction = new Map<
      string,
      { count: number; mix: Map<AuthorityType, number>; region: string }
    >();
    for (const e of baseFiltered) {
      let tile = byJurisdiction.get(e.jurisdiction);
      if (!tile) {
        tile = { count: 0, mix: new Map(), region: e.region };
        byJurisdiction.set(e.jurisdiction, tile);
      }
      tile.count += 1;
      tile.mix.set(e.authorityType, (tile.mix.get(e.authorityType) ?? 0) + 1);
    }
    const clusters = new Map<string, Array<{ name: string; count: number; mix: Map<AuthorityType, number> }>>();
    for (const [name, tile] of byJurisdiction) {
      const list = clusters.get(tile.region);
      const item = { name, count: tile.count, mix: tile.mix };
      if (list) list.push(item);
      else clusters.set(tile.region, [item]);
    }
    for (const list of clusters.values()) {
      list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }
    return Array.from(clusters.entries()).sort(
      (a, b) =>
        (regionOrder.indexOf(a[0]) + 1 || 99) - (regionOrder.indexOf(b[0]) + 1 || 99),
    );
  }, [baseFiltered]);

  const jurisdictionEntries = useMemo(
    () =>
      selectedJurisdiction
        ? baseFiltered.filter((e) => e.jurisdiction === selectedJurisdiction)
        : [],
    [baseFiltered, selectedJurisdiction],
  );

  const panelFilterCount =
    (authority ? 1 : 0) +
    (legalArea ? 1 : 0) +
    (period !== "all" ? 1 : 0) +
    (highSignalOnly ? 1 : 0);
  const hasActiveFilters = query.trim() !== "" || panelFilterCount > 0;

  const clearAll = () => {
    setQuery("");
    setAuthority(null);
    setLegalArea(null);
    setPeriod("all");
    setHighSignalOnly(false);
  };

  // Which view is on screen?
  const view: "search" | "jurisdiction" | "atlas" | "timeline" = searchResults
    ? "search"
    : selectedJurisdiction
      ? "jurisdiction"
      : mode;

  const visibleCount =
    view === "search"
      ? searchResults!.length
      : view === "jurisdiction"
        ? jurisdictionEntries.length
        : baseFiltered.length;

  return (
    <div className="space-y-8">
      {/* ── Region hub strip — compact portals ── */}
      <motion.div
        className="grid gap-3 sm:grid-cols-3"
        initial={reduced ? false : "hidden"}
        animate="visible"
        transition={{ staggerChildren: 0.08 }}
        variants={{ hidden: {}, visible: {} }}
      >
        {regionHubs.map((hub) => (
          <motion.div
            key={hub.href}
            variants={{
              hidden: { opacity: 0, y: 14 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
            }}
          >
            <Link
              href={hub.href}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--accent-strong)]/40 hover:bg-white/[0.05]"
            >
              <div className="min-w-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500">
                  {hub.kicker}
                </p>
                <p className="mt-1 truncate font-display text-lg font-medium tracking-[-0.02em] text-zinc-950">
                  {hub.label}
                </p>
              </div>
              <span
                aria-hidden
                className="shrink-0 text-zinc-400 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[color:var(--accent-strong)]"
              >
                →
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Toolbar: search + mode switch + filters toggle ── */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.1 }}
        className="space-y-3"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the database…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-11 pr-4 text-sm text-zinc-950 placeholder:text-zinc-400 transition-colors duration-200 focus:border-[color:var(--accent-strong)]/50 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode switch — shared animated indicator */}
            <div className="relative flex rounded-full border border-white/10 bg-white/[0.03] p-0.5">
              {(
                [
                  { key: "atlas", label: "Jurisdictions" },
                  { key: "timeline", label: "Timeline" },
                ] as const
              ).map((m) => {
                const active = mode === m.key && !selectedJurisdiction && !searchResults;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setMode(m.key);
                      setSelectedJurisdiction(null);
                      setQuery("");
                    }}
                    className={`relative cursor-pointer rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-200 ${
                      active ? "text-[color:var(--accent-strong)]" : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="mode-indicator"
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-[color:var(--accent-soft)]"
                        transition={{ duration: 0.35, ease }}
                      />
                    ) : null}
                    <span className="relative">{m.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(!panelOpen)}
              aria-expanded={panelOpen}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-200 ${
                panelOpen || panelFilterCount > 0
                  ? "border-[color:var(--accent-strong)]/60 bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                  : "border-white/10 bg-white/[0.03] text-zinc-500 hover:border-white/20 hover:text-zinc-800"
              }`}
            >
              <SlidersHorizontal aria-hidden className="size-3" />
              Filters
              {panelFilterCount > 0 ? (
                <span className="tabular-nums">{panelFilterCount}</span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Collapsible filter panel */}
        <AnimatePresence initial={false}>
          {panelOpen ? (
            <motion.div
              key="panel"
              initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="overflow-hidden"
            >
              <div className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                    Authority
                  </span>
                  {authorities.map((type) => (
                    <Pill
                      key={type}
                      active={authority === type}
                      onClick={() => setAuthority(authority === type ? null : type)}
                      dotColor={authorityDot[type]}
                    >
                      {type}
                    </Pill>
                  ))}
                </div>
                {legalAreas.length > 1 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                      Legal area
                    </span>
                    <div className="relative">
                      <select
                        value={legalArea ?? "all"}
                        onChange={(e) =>
                          setLegalArea(e.target.value === "all" ? null : e.target.value)
                        }
                        style={{ colorScheme: "dark" }}
                        aria-label="Filter by legal area"
                        className={`cursor-pointer appearance-none rounded-full border py-1.5 pl-3 pr-8 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-200 focus:outline-none ${
                          legalArea
                            ? "border-[color:var(--accent-strong)]/60 bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]"
                            : "border-white/10 bg-white/[0.03] text-zinc-500 hover:border-white/20 hover:text-zinc-800"
                        }`}
                      >
                        <option value="all" style={{ backgroundColor: "#141418", color: "#e9e9ea" }}>
                          All areas
                        </option>
                        {legalAreas.map((area) => (
                          <option
                            key={area}
                            value={area}
                            style={{ backgroundColor: "#141418", color: "#f4f4f5" }}
                          >
                            {area}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        aria-hidden
                        className={`pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 ${
                          legalArea ? "text-[color:var(--accent-strong)]" : "text-zinc-500"
                        }`}
                      />
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                    Period
                  </span>
                  {periodOptions.map((p) => (
                    <Pill key={p.key} active={period === p.key} onClick={() => setPeriod(p.key)}>
                      {p.label}
                    </Pill>
                  ))}
                  <span aria-hidden className="mx-1 h-4 w-px bg-white/10" />
                  <Pill
                    active={highSignalOnly}
                    onClick={() => setHighSignalOnly(!highSignalOnly)}
                    dotColor="#c4882a"
                  >
                    High signal
                  </Pill>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Result line */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            <motion.span
              key={visibleCount}
              initial={reduced ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease }}
              className="inline-block tabular-nums text-[color:var(--accent-strong)]"
            >
              {visibleCount}
            </motion.span>{" "}
            {visibleCount === 1 ? "entry" : "entries"}
            {view === "search" ? " · search" : ""}
            {view === "jurisdiction" ? ` · ${selectedJurisdiction}` : ""}
            {entries.length !== visibleCount ? ` · of ${entries.length} loaded` : ""}
          </p>
          <AnimatePresence>
            {hasActiveFilters ? (
              <motion.button
                type="button"
                onClick={clearAll}
                initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-white/25 hover:text-zinc-900"
              >
                Clear all
                <X aria-hidden className="size-3" />
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Main view — atlas / jurisdiction drill-down / timeline / search ── */}
      <AnimatePresence mode="wait" initial={false}>
        {view === "search" ? (
          <motion.div
            key="search"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
          >
            {searchResults!.length > 0 ? (
              <Ledger
                entries={searchResults!}
                reduced={reduced}
                openRow={openRow}
                setOpenRow={setOpenRow}
                showJurisdiction
              />
            ) : (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-10 text-center">
                <p className="font-display text-lg text-zinc-800">No entries match</p>
                <p className="mt-2 text-sm text-zinc-500">
                  Try another term or clear the filters.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 cursor-pointer rounded-full border border-[color:var(--accent-strong)]/40 bg-[color:var(--accent-soft)] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)] transition-transform hover:scale-[1.03]"
                >
                  Clear all
                </button>
              </div>
            )}
          </motion.div>
        ) : view === "jurisdiction" ? (
          <motion.div
            key={`jurisdiction-${selectedJurisdiction}`}
            initial={reduced ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: 24 }}
            transition={{ duration: 0.35, ease }}
            className="space-y-5"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedJurisdiction(null);
                  setOpenRow(null);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-white/25 hover:text-zinc-900"
              >
                <ArrowLeft aria-hidden className="size-3" />
                All jurisdictions
              </button>
              <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-zinc-950">
                {selectedJurisdiction}
              </h3>
            </div>
            {jurisdictionEntries.length > 0 ? (
              <Ledger
                entries={jurisdictionEntries}
                reduced={reduced}
                openRow={openRow}
                setOpenRow={setOpenRow}
                showJurisdiction={false}
              />
            ) : (
              <p className="rounded-2xl border border-white/8 bg-white/[0.02] p-8 text-center text-sm text-zinc-500">
                No entries for {selectedJurisdiction} with these filters.
              </p>
            )}
          </motion.div>
        ) : view === "timeline" ? (
          <motion.div
            key="timeline"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
          >
            <Ledger
              entries={baseFiltered}
              reduced={reduced}
              openRow={openRow}
              setOpenRow={setOpenRow}
              showJurisdiction
            />
          </motion.div>
        ) : (
          /* ── Atlas: jurisdiction tiles clustered by region ── */
          <motion.div
            key="atlas"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
            className="space-y-9"
          >
            {atlasClusters.map(([regionName, tiles]) => (
              <section key={regionName}>
                <div className="mb-3 flex items-baseline gap-2.5">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    {regionName}
                  </h3>
                  <span className="font-mono text-[10px] tabular-nums text-[color:var(--accent-strong)]/80">
                    {tiles.length}
                  </span>
                  <span aria-hidden className="h-px flex-1 self-center bg-white/8" />
                </div>
                <motion.div
                  className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"
                  initial={reduced ? false : "hidden"}
                  animate="visible"
                  transition={{ staggerChildren: 0.03 }}
                  variants={{ hidden: {}, visible: {} }}
                >
                  {tiles.map((tile) => (
                    <motion.button
                      key={tile.name}
                      type="button"
                      onClick={() => setSelectedJurisdiction(tile.name)}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
                      }}
                      whileTap={{ scale: 0.97 }}
                      className="group cursor-pointer space-y-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--accent-strong)]/40 hover:bg-white/[0.05]"
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="min-w-0 truncate text-[13.5px] font-medium tracking-[-0.01em] text-zinc-900 transition-colors group-hover:text-zinc-950">
                          {tile.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-400 transition-colors group-hover:text-[color:var(--accent-strong)]">
                          {tile.count}
                        </span>
                      </span>
                      <SpectrumBar mix={tile.mix} total={tile.count} />
                    </motion.button>
                  ))}
                </motion.div>
              </section>
            ))}
            {atlasClusters.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-10 text-center">
                <p className="font-display text-lg text-zinc-800">No entries match these filters</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 cursor-pointer rounded-full border border-[color:var(--accent-strong)]/40 bg-[color:var(--accent-soft)] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)] transition-transform hover:scale-[1.03]"
                >
                  Clear all
                </button>
              </div>
            ) : null}
            {/* Legend — the color language, once, quietly */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/6 pt-4">
              {authorities.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: authorityDot[type] }}
                  />
                  {type}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Load more (server cursor) ── */}
      {loadMoreHref && !hasActiveFilters && view !== "jurisdiction" ? (
        <div className="flex justify-center">
          <Link
            href={loadMoreHref}
            className="rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color:var(--accent-strong)]/40 hover:text-zinc-900"
          >
            Load next entries →
          </Link>
        </div>
      ) : null}
      {loadMoreHref && (hasActiveFilters || view === "jurisdiction") ? (
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          Showing the {entries.length} loaded entries — load more from the unfiltered view to widen the set.
        </p>
      ) : null}
    </div>
  );
}
