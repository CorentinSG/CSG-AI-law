"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";

export type StandardsInstrument = {
  id: string;
  title: string;
  institution: string;
  region: "Europe" | "United States";
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
  needs_review: { en: "Status to verify", fr: "Statut à vérifier" },
};

const ACCESS_LABEL: Record<string, { en: string; fr: string }> = {
  metadata: { en: "Metadata only", fr: "Métadonnées seules" },
  monitored: { en: "Official source monitored", fr: "Source officielle suivie" },
};

function regionLabel(region: string, fr: boolean) {
  if (region === "United States") return fr ? "États-Unis" : "United States";
  return "Europe";
}

/** A toggleable filter group: OR within the group, AND across groups. */
function FilterGroup({
  label,
  options,
  active,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string; count: number }[];
  active: Set<string>;
  onToggle: (value: string) => void;
}) {
  if (options.length <= 1) return null;
  return (
    <div className="space-y-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = active.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              aria-pressed={on}
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-strong,#c4882a)] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]",
                on
                  ? "border-[color:var(--color-accent-strong,#c4882a)]/40 bg-[color:var(--color-accent,#9a6b1f)]/[0.14] text-white"
                  : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/85",
              ].join(" ")}
            >
              {opt.label}
              <span className={on ? "text-[color:var(--color-accent-strong,#c4882a)]" : "text-white/30"}>
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>
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
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [bindings, setBindings] = useState<Set<string>>(new Set());
  const [access, setAccess] = useState<Set<string>>(new Set());
  const [institutions, setInstitutions] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void) => (value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  // Distinct filter options with live counts, derived from the data.
  const options = useMemo(() => {
    const tally = (key: (i: StandardsInstrument) => string, label: (v: string) => string) => {
      const counts = new Map<string, number>();
      for (const i of instruments) counts.set(key(i), (counts.get(key(i)) ?? 0) + 1);
      return [...counts.entries()]
        .map(([value, count]) => ({ value, label: label(value), count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    };
    const L = (m: Record<string, { en: string; fr: string }>) => (v: string) =>
      (m[v] ? (fr ? m[v].fr : m[v].en) : v.replaceAll("_", " "));
    return {
      types: tally((i) => i.type, L(TYPE_LABEL)),
      regions: tally((i) => i.region, (v) => regionLabel(v, fr)),
      bindings: tally((i) => i.binding, L(BINDING_LABEL)),
      access: tally((i) => i.access, L(ACCESS_LABEL)),
      institutions: tally((i) => i.institution, (v) => v),
    };
  }, [instruments, fr]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return instruments.filter((i) => {
      if (types.size && !types.has(i.type)) return false;
      if (regions.size && !regions.has(i.region)) return false;
      if (bindings.size && !bindings.has(i.binding)) return false;
      if (access.size && !access.has(i.access)) return false;
      if (institutions.size && !institutions.has(i.institution)) return false;
      if (q) {
        const hay = `${i.title} ${i.institution} ${i.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [instruments, query, types, regions, bindings, access, institutions]);

  const activeCount =
    types.size + regions.size + bindings.size + access.size + institutions.size + (query ? 1 : 0);

  const reset = () => {
    setQuery("");
    setTypes(new Set());
    setRegions(new Set());
    setBindings(new Set());
    setAccess(new Set());
    setInstitutions(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/[0.03] px-4 py-3">
        <Search className="size-4 shrink-0 text-white/40" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={fr ? "Rechercher un instrument, une institution…" : "Search an instrument, an institution…"}
          aria-label={fr ? "Rechercher parmi les standards" : "Search the standards"}
          className="w-full bg-transparent text-[15px] text-white placeholder:text-white/35 focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={fr ? "Effacer la recherche" : "Clear search"}
            className="shrink-0 rounded-full p-1 text-white/40 transition-colors hover:text-white/80"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Filters */}
      <div className="grid gap-5 rounded-[1.6rem] border border-white/10 bg-white/[0.02] p-5 md:grid-cols-2">
        <FilterGroup label={fr ? "Type" : "Type"} options={options.types} active={types} onToggle={toggle(types, setTypes)} />
        <FilterGroup label={fr ? "Région" : "Region"} options={options.regions} active={regions} onToggle={toggle(regions, setRegions)} />
        <FilterGroup label={fr ? "Statut contraignant" : "Binding status"} options={options.bindings} active={bindings} onToggle={toggle(bindings, setBindings)} />
        <FilterGroup label={fr ? "Niveau d'accès" : "Access level"} options={options.access} active={access} onToggle={toggle(access, setAccess)} />
        <div className="md:col-span-2">
          <FilterGroup label={fr ? "Institution" : "Institution"} options={options.institutions} active={institutions} onToggle={toggle(institutions, setInstitutions)} />
        </div>
      </div>

      {/* Result count + reset */}
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
          <motion.span key={results.length} initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease }} className="inline-block text-white/80">
            {results.length}
          </motion.span>{" "}
          {fr
            ? `instrument${results.length === 1 ? "" : "s"} sur ${instruments.length}`
            : `of ${instruments.length} instrument${instruments.length === 1 ? "" : "s"}`}
        </p>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={reset}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/80"
          >
            {fr ? "Réinitialiser" : "Reset"} ({activeCount})
          </button>
        ) : null}
      </div>

      {/* Results — animated ledger */}
      <div className="border-y border-white/8">
        <AnimatePresence mode="popLayout" initial={false}>
          {results.map((i, idx) => (
            <motion.article
              key={i.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.32, ease, delay: reduce ? 0 : Math.min(idx * 0.03, 0.24) }}
              className="border-b border-white/8 py-5 last:border-b-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="text-[16px] font-medium leading-6 tracking-[-0.01em] text-white/90">
                  {i.title}
                </h3>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/55">
                  {regionLabel(i.region, fr)}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-white/55">{i.summary}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/45">
                <span className="text-white/60">
                  {TYPE_LABEL[i.type] ? (fr ? TYPE_LABEL[i.type].fr : TYPE_LABEL[i.type].en) : i.type.replaceAll("_", " ")}
                </span>
                <span aria-hidden className="text-white/25">·</span>
                <span>{BINDING_LABEL[i.binding] ? (fr ? BINDING_LABEL[i.binding].fr : BINDING_LABEL[i.binding].en) : i.binding}</span>
                <span aria-hidden className="text-white/25">·</span>
                <span>{i.institution}</span>
                <span aria-hidden className="text-white/25">·</span>
                <span className="text-white/40">{fr ? ACCESS_LABEL[i.access].fr : ACCESS_LABEL[i.access].en}</span>
                {i.sourceUrl ? (
                  <>
                    <span aria-hidden className="text-white/25">·</span>
                    <a
                      href={i.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[color:var(--color-accent-strong,#c4882a)] transition-colors hover:text-white/80"
                    >
                      <ArrowUpRight className="size-2.5" />
                      {fr ? "source" : "source"}
                    </a>
                  </>
                ) : null}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {results.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/45">
            {fr ? "Aucun instrument ne correspond à ces filtres." : "No instrument matches these filters."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
