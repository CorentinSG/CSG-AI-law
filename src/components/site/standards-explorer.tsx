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

/** A compact native <select> — familiar, quiet, keyboard-accessible. */
function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  if (options.length === 0) return null;
  const active = value !== "";
  return (
    <label className="group relative inline-flex min-w-0 items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "min-w-0 cursor-pointer appearance-none rounded-full border bg-white/[0.03] py-2 pl-3.5 pr-8 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-strong,#c4882a)] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]",
          active
            ? "border-[color:var(--color-accent-strong,#c4882a)]/40 text-white"
            : "border-white/10 text-white/60 hover:border-white/20 hover:text-white/85",
        ].join(" ")}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className={`pointer-events-none absolute right-3 size-2.5 ${active ? "text-[color:var(--color-accent-strong,#c4882a)]" : "text-white/35"}`}
      >
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
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
    <div className="space-y-5">
      {/* Slim toolbar: search + compact dropdowns on one line */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[200px] flex-1 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
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
        <SelectFilter label={fr ? "Type" : "Type"} value={type} onChange={setType} options={opts.type} />
        <SelectFilter label={fr ? "Région" : "Region"} value={region} onChange={setRegion} options={opts.region} />
        <SelectFilter label={fr ? "Statut" : "Status"} value={binding} onChange={setBinding} options={opts.binding} />
      </div>

      {/* Count + reset */}
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
          {fr
            ? `sur ${instruments.length} instrument${instruments.length === 1 ? "" : "s"}`
            : `of ${instruments.length} instrument${instruments.length === 1 ? "" : "s"}`}
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
                <span className="text-white/60">{typeL(i.type)}</span>
                <span aria-hidden className="text-white/25">·</span>
                <span>{bindingL(i.binding)}</span>
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
                      source
                    </a>
                  </>
                ) : null}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {results.length === 0 ? (
          <div className="py-10 text-center text-sm text-white/45">
            {fr ? "Aucun instrument ne correspond." : "No instrument matches."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
