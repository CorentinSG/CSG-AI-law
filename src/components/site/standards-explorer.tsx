"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ChevronDown, Search, X } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";

export type StandardsInstrument = {
  id: string;
  title: string;
  institution: string;
  region: "Europe" | "United States" | "International";
  type: string;
  binding: string;
  access: "metadata" | "monitored";
  summary: string;
  sourceUrl: string;
};

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const TYPE_LABEL: Record<string, { en: string; fr: string }> = {
  technical_standard: { en: "Technical standard", fr: "Standard technique" },
  governance_framework: { en: "Governance framework", fr: "Framework de gouvernance" },
  soft_law: { en: "Soft law", fr: "Droit souple" },
  policy_framework: { en: "Policy framework", fr: "Cadre politique" },
  best_practice: { en: "Best practice", fr: "Bonne pratique" },
  agency_guidance: { en: "Agency guidance", fr: "Guidance d'agence" },
  enforcement_signal: { en: "Enforcement signal", fr: "Signal d'enforcement" },
};

const BINDING_LABEL: Record<string, { en: string; fr: string }> = {
  non_binding: { en: "Non-binding", fr: "Non contraignant" },
  binding_if_incorporated: { en: "Binding if incorporated", fr: "Contraignant si incorporé" },
  needs_review: { en: "Variable effect", fr: "Portée variable" },
};

/** Ledger group order — from hard technical instruments toward softer material. */
const TYPE_ORDER = [
  "technical_standard",
  "governance_framework",
  "soft_law",
  "policy_framework",
  "agency_guidance",
  "best_practice",
  "enforcement_signal",
];

/** Row chip styling per binding status — same color language as the hero spectrum. */
const BINDING_CHIP: Record<string, { chip: string; dot: string }> = {
  non_binding: {
    chip: "border-accent-strong/30 bg-accent/10 text-accent-strong",
    dot: "bg-accent-strong",
  },
  binding_if_incorporated: {
    chip: "border-white/25 bg-white/10 text-white/85",
    dot: "bg-white/85",
  },
  needs_review: {
    chip: "border-dashed border-white/20 bg-transparent text-white/55",
    dot: "bg-zinc-500",
  },
};

/** Spectrum-bar segment colors, hard-to-soft — mirrors BINDING_CHIP dots. */
const BINDING_BAR_ORDER = ["binding_if_incorporated", "non_binding", "needs_review"];
const BINDING_BAR_COLOR: Record<string, string> = {
  binding_if_incorporated: "rgba(255,255,255,0.85)",
  non_binding: "#c4882a",
  needs_review: "#71717a",
};

const REGION_ORDER = ["International", "Europe", "United States"];

function regionLabel(region: string, fr: boolean) {
  if (region === "United States") return fr ? "États-Unis" : "United States";
  if (region === "International") return "International";
  return "Europe";
}

/** One pill filter group with a spring-animated active indicator. */
function PillGroup({
  group,
  label,
  value,
  onChange,
  options,
  reduce,
}: {
  group: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; count: number }[];
  reduce: boolean;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {[{ value: "", label, count: -1 }, ...options].map((o) => {
        const active = value === o.value;
        const empty = o.count === 0 && !active;
        return (
          <button
            key={o.value || "__all"}
            type="button"
            onClick={() => onChange(active ? "" : o.value)}
            aria-pressed={active}
            className={[
              "relative cursor-pointer rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
              active ? "text-accent-strong" : "text-white/50 hover:text-white/85",
              empty ? "opacity-35" : "opacity-100",
            ].join(" ")}
          >
            {active ? (
              <motion.span
                layoutId={`pill-${group}`}
                aria-hidden
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 rounded-full border border-accent-strong/40 bg-accent/10"
              />
            ) : (
              <span aria-hidden className="absolute inset-0 rounded-full border border-white/8" />
            )}
            <span className="relative">{o.label}</span>
            {o.count >= 0 ? (
              <span
                className={[
                  "relative ml-1.5 tabular-nums transition-colors",
                  active ? "text-accent-strong/70" : "text-white/30",
                ].join(" ")}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Thin stacked bar showing an institution's binding mix, hard-to-soft. */
function BindingBar({ mix, total }: { mix: Map<string, number>; total: number }) {
  return (
    <span aria-hidden className="flex h-[3px] w-full overflow-hidden rounded-full bg-white/6">
      {BINDING_BAR_ORDER.map((b) => {
        const n = mix.get(b);
        if (!n) return null;
        return (
          <span
            key={b}
            className="h-full"
            style={{ width: `${(n / total) * 100}%`, backgroundColor: BINDING_BAR_COLOR[b] }}
          />
        );
      })}
    </span>
  );
}

/** Type-grouped ledger of expandable one-line rows (shared by all list views). */
function Ledger({
  items,
  fr,
  reduce,
  open,
  setOpen,
  showInstitution,
  typeL,
  bindingL,
}: {
  items: StandardsInstrument[];
  fr: boolean;
  reduce: boolean;
  open: string | null;
  setOpen: (id: string | null) => void;
  showInstitution: boolean;
  typeL: (v: string) => string;
  bindingL: (v: string) => string;
}) {
  const groups = useMemo(() => {
    const byType = new Map<string, StandardsInstrument[]>();
    for (const i of items) {
      const bucket = byType.get(i.type);
      if (bucket) bucket.push(i);
      else byType.set(i.type, [i]);
    }
    return [...byType.entries()].sort(([a], [b]) => {
      const ia = TYPE_ORDER.indexOf(a);
      const ib = TYPE_ORDER.indexOf(b);
      return (ia === -1 ? TYPE_ORDER.length : ia) - (ib === -1 ? TYPE_ORDER.length : ib);
    });
  }, [items]);

  return (
    <div className="space-y-9">
      <AnimatePresence mode="popLayout" initial={false}>
        {groups.map(([groupType, groupItems]) => (
          <motion.section
            key={groupType}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="mb-1 flex items-baseline gap-2.5">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                {typeL(groupType)}
              </h3>
              <span className="font-mono text-[10px] tabular-nums text-accent-strong/80">
                {groupItems.length}
              </span>
              <span aria-hidden className="h-px flex-1 self-center bg-white/8" />
            </div>
            <ul className="divide-y divide-white/8">
              {groupItems.map((i, idx) => {
                const expanded = open === i.id;
                const chip = BINDING_CHIP[i.binding] ?? BINDING_CHIP.needs_review;
                return (
                  <motion.li
                    key={i.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease, delay: reduce ? 0 : Math.min(idx * 0.04, 0.24) }}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOpen(expanded ? null : i.id)}
                        aria-expanded={expanded}
                        className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3.5 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
                      >
                        <span
                          aria-hidden
                          className={[
                            "size-2 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125",
                            chip.dot,
                          ].join(" ")}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={[
                              "block truncate text-[15px] font-medium leading-6 tracking-[-0.01em] transition-colors duration-200",
                              expanded ? "text-white" : "text-white/85 group-hover:text-white",
                            ].join(" ")}
                          >
                            {i.title}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/40">
                            {showInstitution ? i.institution : regionLabel(i.region, fr)}
                            {showInstitution ? (
                              <>
                                <span aria-hidden className="mx-1.5 text-white/25">·</span>
                                {regionLabel(i.region, fr)}
                              </>
                            ) : null}
                          </span>
                        </span>
                        <span
                          className={[
                            "hidden shrink-0 items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] sm:inline-flex",
                            chip.chip,
                          ].join(" ")}
                        >
                          {bindingL(i.binding)}
                        </span>
                        <ChevronDown
                          aria-hidden
                          className={[
                            "size-3.5 shrink-0 transition-transform duration-200 ease-out",
                            expanded ? "rotate-180 text-accent-strong" : "text-white/35 group-hover:text-white/70",
                          ].join(" ")}
                        />
                      </button>
                      {i.sourceUrl ? (
                        <a
                          href={i.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${i.title} — source`}
                          className="shrink-0 rounded-full border border-white/10 p-1.5 text-white/45 transition-colors duration-200 hover:border-accent-strong/40 hover:text-accent-strong"
                        >
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      ) : null}
                    </div>
                    <AnimatePresence initial={false}>
                      {expanded ? (
                        <motion.div
                          key="summary"
                          initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                          exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease }}
                          className="overflow-hidden"
                        >
                          <div className="pb-4 pl-[22px] pr-10">
                            <p className="max-w-[70ch] text-sm leading-6 text-white/60">{i.summary}</p>
                            <span
                              className={[
                                "mt-2.5 inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] sm:hidden",
                                chip.chip,
                              ].join(" ")}
                            >
                              {bindingL(i.binding)}
                            </span>
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

export function StandardsExplorer({
  instruments,
  lang,
}: {
  instruments: StandardsInstrument[];
  lang: Locale;
}) {
  const fr = lang === "fr";
  const reduce = useReducedMotion() ?? false;
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"institutions" | "registry">("institutions");
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const [binding, setBinding] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  // Two-way sync with the hero spectrum: it sets the binding filter here,
  // and mirrors whatever this component's binding state becomes.
  useEffect(() => {
    const onSet = (e: Event) => setBinding((e as CustomEvent<string>).detail ?? "");
    window.addEventListener("standards:set-binding", onSet);
    return () => window.removeEventListener("standards:set-binding", onSet);
  }, []);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("standards:binding-state", { detail: binding }));
  }, [binding]);

  const L = (m: Record<string, { en: string; fr: string }>) => (v: string) =>
    m[v] ? (fr ? m[v].fr : m[v].en) : v.replaceAll("_", " ");
  const typeL = L(TYPE_LABEL);
  const bindingL = L(BINDING_LABEL);

  // Binding filter shapes everything — the atlas tiles as much as the ledgers.
  const baseFiltered = useMemo(
    () => instruments.filter((i) => !binding || i.binding === binding),
    [instruments, binding],
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return baseFiltered.filter((i) =>
      `${i.title} ${i.institution} ${i.summary}`.toLowerCase().includes(q),
    );
  }, [baseFiltered, query]);

  // Atlas: institutions clustered by region, each with count + binding mix.
  const atlasClusters = useMemo(() => {
    const byInstitution = new Map<
      string,
      { count: number; mix: Map<string, number>; region: string }
    >();
    for (const i of baseFiltered) {
      let tile = byInstitution.get(i.institution);
      if (!tile) {
        tile = { count: 0, mix: new Map(), region: i.region };
        byInstitution.set(i.institution, tile);
      }
      tile.count += 1;
      tile.mix.set(i.binding, (tile.mix.get(i.binding) ?? 0) + 1);
    }
    const clusters = new Map<
      string,
      Array<{ name: string; count: number; mix: Map<string, number> }>
    >();
    for (const [name, tile] of byInstitution) {
      const list = clusters.get(tile.region);
      const item = { name, count: tile.count, mix: tile.mix };
      if (list) list.push(item);
      else clusters.set(tile.region, [item]);
    }
    for (const list of clusters.values()) {
      list.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }
    return [...clusters.entries()].sort(
      (a, b) =>
        (REGION_ORDER.indexOf(a[0]) + 1 || 99) - (REGION_ORDER.indexOf(b[0]) + 1 || 99),
    );
  }, [baseFiltered]);

  const institutionItems = useMemo(
    () =>
      selectedInstitution
        ? baseFiltered.filter((i) => i.institution === selectedInstitution)
        : [],
    [baseFiltered, selectedInstitution],
  );

  const bindingOpts = useMemo(
    () =>
      [...new Set(instruments.map((i) => i.binding))]
        .map((value) => ({
          value,
          label: bindingL(value),
          count: instruments.filter((i) => i.binding === value).length,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [instruments, fr],
  );

  const view: "search" | "institution" | "institutions" | "registry" = searchResults
    ? "search"
    : selectedInstitution
      ? "institution"
      : mode;

  const visibleCount =
    view === "search"
      ? searchResults!.length
      : view === "institution"
        ? institutionItems.length
        : baseFiltered.length;

  const hasFilters = Boolean(query || binding);
  const reset = () => {
    setQuery("");
    setBinding("");
  };

  return (
    <div id="standards-explorer" className="scroll-mt-24 space-y-6">
      {/* ── Toolbar: search + mode switch, then the binding row (hero-synced) ── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[220px] flex-1 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5">
            <Search className="size-4 shrink-0 text-white/40" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={fr ? "Rechercher…" : "Search…"}
              aria-label={fr ? "Rechercher parmi les standards" : "Search the standards"}
              className="w-full bg-transparent text-[14px] text-white placeholder:text-white/35 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={fr ? "Effacer" : "Clear"}
                className="shrink-0 cursor-pointer rounded-full p-0.5 text-white/40 transition-colors hover:text-white/80"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          {/* Mode switch — shared animated indicator */}
          <div className="relative flex rounded-full border border-white/10 bg-white/[0.03] p-0.5">
            {(
              [
                { key: "institutions", label: "Institutions" },
                { key: "registry", label: fr ? "Registre" : "Registry" },
              ] as const
            ).map((m) => {
              const active = mode === m.key && !selectedInstitution && !searchResults;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setMode(m.key);
                    setSelectedInstitution(null);
                    setQuery("");
                  }}
                  className={[
                    "relative cursor-pointer rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-200",
                    active ? "text-accent-strong" : "text-white/50 hover:text-white/85",
                  ].join(" ")}
                >
                  {active ? (
                    <motion.span
                      layoutId="standards-mode"
                      aria-hidden
                      className="absolute inset-0 rounded-full border border-accent-strong/40 bg-accent/10"
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <PillGroup
          group="binding"
          label={fr ? "Tous statuts" : "All statuses"}
          value={binding}
          onChange={setBinding}
          options={bindingOpts}
          reduce={reduce}
        />
      </div>

      {/* ── Count + reset ── */}
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
          <motion.span
            key={visibleCount}
            initial={reduce ? false : { opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease }}
            className="inline-block tabular-nums text-white/80"
          >
            {visibleCount}
          </motion.span>{" "}
          {fr ? `sur ${instruments.length}` : `of ${instruments.length}`}
          {view === "institution" ? ` · ${selectedInstitution}` : ""}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/80"
          >
            {fr ? "Réinitialiser" : "Reset"}
          </button>
        ) : null}
      </div>

      {/* ── Main view — atlas / institution drill-down / registry / search ── */}
      <AnimatePresence mode="wait" initial={false}>
        {view === "search" ? (
          <motion.div
            key="search"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
          >
            {searchResults!.length > 0 ? (
              <Ledger
                items={searchResults!}
                fr={fr}
                reduce={reduce}
                open={open}
                setOpen={setOpen}
                showInstitution
                typeL={typeL}
                bindingL={bindingL}
              />
            ) : (
              <div className="space-y-4 rounded-[1.6rem] border border-white/8 py-12 text-center text-sm text-white/45">
                <p>{fr ? "Aucun instrument ne correspond." : "No instrument matches."}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.2em] text-accent-strong underline decoration-accent-strong/30 underline-offset-4 transition-colors hover:text-white"
                >
                  {fr ? "Réinitialiser" : "Reset"}
                </button>
              </div>
            )}
          </motion.div>
        ) : view === "institution" ? (
          <motion.div
            key={`institution-${selectedInstitution}`}
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: 24 }}
            transition={{ duration: 0.35, ease }}
            className="space-y-5"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedInstitution(null);
                  setOpen(null);
                }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50 transition-colors hover:border-white/25 hover:text-white/85"
              >
                <ArrowLeft aria-hidden className="size-3" />
                {fr ? "Toutes institutions" : "All institutions"}
              </button>
              <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-white">
                {selectedInstitution}
              </h3>
            </div>
            {institutionItems.length > 0 ? (
              <Ledger
                items={institutionItems}
                fr={fr}
                reduce={reduce}
                open={open}
                setOpen={setOpen}
                showInstitution={false}
                typeL={typeL}
                bindingL={bindingL}
              />
            ) : (
              <p className="rounded-[1.6rem] border border-white/8 p-8 text-center text-sm text-white/45">
                {fr
                  ? `Aucun instrument pour ${selectedInstitution} avec ces filtres.`
                  : `No instruments for ${selectedInstitution} with these filters.`}
              </p>
            )}
          </motion.div>
        ) : view === "registry" ? (
          <motion.div
            key="registry"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
          >
            {baseFiltered.length > 0 ? (
              <Ledger
                items={baseFiltered}
                fr={fr}
                reduce={reduce}
                open={open}
                setOpen={setOpen}
                showInstitution
                typeL={typeL}
                bindingL={bindingL}
              />
            ) : (
              <div className="space-y-4 rounded-[1.6rem] border border-white/8 py-12 text-center text-sm text-white/45">
                <p>{fr ? "Aucun instrument ne correspond." : "No instrument matches."}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.2em] text-accent-strong underline decoration-accent-strong/30 underline-offset-4 transition-colors hover:text-white"
                >
                  {fr ? "Réinitialiser" : "Reset"}
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Atlas: institution tiles clustered by region ── */
          <motion.div
            key="atlas"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
            className="space-y-9"
          >
            {atlasClusters.map(([regionName, tiles]) => (
              <section key={regionName}>
                <div className="mb-3 flex items-baseline gap-2.5">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                    {regionLabel(regionName, fr)}
                  </h3>
                  <span className="font-mono text-[10px] tabular-nums text-accent-strong/80">
                    {tiles.length}
                  </span>
                  <span aria-hidden className="h-px flex-1 self-center bg-white/8" />
                </div>
                <motion.div
                  className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"
                  initial={reduce ? false : "hidden"}
                  animate="visible"
                  transition={{ staggerChildren: 0.03 }}
                  variants={{ hidden: {}, visible: {} }}
                >
                  {tiles.map((tile) => (
                    <motion.button
                      key={tile.name}
                      type="button"
                      onClick={() => setSelectedInstitution(tile.name)}
                      variants={{
                        hidden: { opacity: 0, y: 10 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
                      }}
                      whileTap={{ scale: 0.97 }}
                      className="group cursor-pointer space-y-2.5 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-strong/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="min-w-0 truncate text-[13.5px] font-medium tracking-[-0.01em] text-white/85 transition-colors group-hover:text-white">
                          {tile.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/35 transition-colors group-hover:text-accent-strong">
                          {tile.count}
                        </span>
                      </span>
                      <BindingBar mix={tile.mix} total={tile.count} />
                    </motion.button>
                  ))}
                </motion.div>
              </section>
            ))}
            {atlasClusters.length === 0 ? (
              <div className="space-y-4 rounded-[1.6rem] border border-white/8 py-12 text-center text-sm text-white/45">
                <p>{fr ? "Aucun instrument ne correspond." : "No instrument matches."}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.2em] text-accent-strong underline decoration-accent-strong/30 underline-offset-4 transition-colors hover:text-white"
                >
                  {fr ? "Réinitialiser" : "Reset"}
                </button>
              </div>
            ) : null}
            {/* Legend — the binding color language, once, quietly */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/6 pt-4">
              {BINDING_BAR_ORDER.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: BINDING_BAR_COLOR[b] }}
                  />
                  {bindingL(b)}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
