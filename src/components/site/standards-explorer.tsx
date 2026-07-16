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

function regionLabel(region: string, fr: boolean) {
  if (region === "United States") return fr ? "États-Unis" : "United States";
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
  options: { value: string; label: string }[];
  reduce: boolean;
}) {
  if (options.length === 0) return null;
  const all = [{ value: "", label }, ...options];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {all.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value || "__all"}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={[
              "relative rounded-full px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
              active ? "text-accent-strong" : "text-white/50 hover:text-white/85",
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
          </button>
        );
      })}
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
  const [type, setType] = useState("");
  const [region, setRegion] = useState("");
  const [binding, setBinding] = useState("");

  const L = (m: Record<string, { en: string; fr: string }>) => (v: string) =>
    m[v] ? (fr ? m[v].fr : m[v].en) : v.replaceAll("_", " ");
  const typeL = L(TYPE_LABEL);
  const bindingL = L(BINDING_LABEL);

  // Distinct option values present in the data (so no dead filters).
  const opts = useMemo(() => {
    const distinct = (key: (i: StandardsInstrument) => string, label: (v: string) => string) =>
      [...new Set(instruments.map(key))]
        .map((value) => ({ value, label: label(value) }))
        .sort((a, b) => a.label.localeCompare(b.label));
    return {
      type: distinct((i) => i.type, typeL),
      region: distinct((i) => i.region, (v) => regionLabel(v, fr)),
      binding: distinct((i) => i.binding, bindingL),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruments, fr]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return instruments.filter((i) => {
      if (type && i.type !== type) return false;
      if (region && i.region !== region) return false;
      if (binding && i.binding !== binding) return false;
      if (q && !`${i.title} ${i.institution} ${i.summary}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [instruments, query, type, region, binding]);

  const hasFilters = Boolean(query || type || region || binding);
  const reset = () => {
    setQuery("");
    setType("");
    setRegion("");
    setBinding("");
  };

  return (
    <div className="space-y-6">
      {/* ── Toolbar: search, then pill filter groups ── */}
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
                className="shrink-0 rounded-full p-0.5 text-white/40 transition-colors hover:text-white/80"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <PillGroup
            group="region"
            label={fr ? "Toutes régions" : "All regions"}
            value={region}
            onChange={setRegion}
            options={opts.region}
            reduce={reduce}
          />
        </div>
        <PillGroup
          group="type"
          label={fr ? "Tous types" : "All types"}
          value={type}
          onChange={setType}
          options={opts.type}
          reduce={reduce}
        />
        <PillGroup
          group="binding"
          label={fr ? "Tous statuts" : "All statuses"}
          value={binding}
          onChange={setBinding}
          options={opts.binding}
          reduce={reduce}
        />
      </div>

      {/* ── Count + reset ── */}
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
          <motion.span
            key={results.length}
            initial={reduce ? false : { opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease }}
            className="inline-block text-white/80"
          >
            {results.length}
          </motion.span>{" "}
          {fr ? `sur ${instruments.length}` : `of ${instruments.length}`}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={reset}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45 underline decoration-white/15 underline-offset-4 transition-colors hover:text-white/80"
          >
            {fr ? "Réinitialiser" : "Reset"}
          </button>
        ) : null}
      </div>

      {/* ── Results: animated glass tiles ── */}
      <motion.div layout={!reduce} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {results.map((i, idx) => (
            <motion.article
              key={i.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease, delay: reduce ? 0 : Math.min(idx * 0.04, 0.32) }}
              className="group glass-panel-soft premium-sheen relative flex h-full flex-col gap-3 rounded-[1.6rem] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-accent-strong/30 bg-accent/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-accent-strong">
                  {typeL(i.type)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-white/55">
                  {bindingL(i.binding)}
                </span>
              </div>
              <h3 className="text-[15px] font-medium leading-6 tracking-[-0.01em] text-white/90">
                {i.title}
              </h3>
              {/* Summary — collapsed by default, unfolds on hover/focus */}
              <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 group-focus-within:grid-rows-[1fr] group-hover:grid-rows-[1fr]">
                <p className="min-h-0 overflow-hidden text-sm leading-6 text-white/50 opacity-0 transition-opacity duration-500 group-focus-within:opacity-100 group-hover:opacity-100">
                  {i.summary}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/8 pt-3">
                <span className="min-w-0 truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/45">
                  {i.institution}
                  <span aria-hidden className="mx-1.5 text-white/25">·</span>
                  {regionLabel(i.region, fr)}
                </span>
                {i.sourceUrl ? (
                  <a
                    href={i.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${i.title} — source`}
                    className="shrink-0 rounded-full border border-white/10 p-1.5 text-white/45 transition-all duration-300 hover:border-accent-strong/40 hover:text-accent-strong group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    <ArrowUpRight className="size-3.5" />
                  </a>
                ) : null}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>

      {results.length === 0 ? (
        <div className="rounded-[1.6rem] border border-white/8 py-12 text-center text-sm text-white/45">
          {fr ? "Aucun instrument ne correspond." : "No instrument matches."}
        </div>
      ) : null}
    </div>
  );
}
