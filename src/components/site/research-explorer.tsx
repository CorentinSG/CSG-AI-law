"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { ResearchCard } from "@/components/site/research-card";
import { MotionStagger } from "@/components/site/motion-stagger";
import type { Locale } from "@/lib/i18n/config";

export type ResearchNote = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  jurisdiction?: string;
  readingTime: string;
};

/** A compact native <select> styled for the dark site (see StandardsExplorer). */
function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  if (options.length === 0) return null;
  const active = value !== "";
  return (
    <label className="group relative inline-flex min-w-0 items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ colorScheme: "dark" }}
        className={[
          "min-w-0 cursor-pointer appearance-none rounded-full border bg-white/[0.03] py-2 pl-3.5 pr-8 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-strong,#c4882a)] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]",
          active
            ? "border-[color:var(--color-accent-strong,#c4882a)]/40 text-white"
            : "border-white/10 text-white/60 hover:border-white/20 hover:text-white/85",
        ].join(" ")}
      >
        <option value="" style={{ backgroundColor: "#141418", color: "#e9e9ea" }}>
          {label}
        </option>
        {options.map((o) => (
          <option key={o} value={o} style={{ backgroundColor: "#141418", color: "#f4f4f5" }}>
            {o}
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

export function ResearchExplorer({
  notes,
  lang,
}: {
  notes: ResearchNote[];
  lang: Locale;
}) {
  const fr = lang === "fr";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");

  // Distinct option values actually present in the notes (no dead filters).
  const opts = useMemo(() => {
    const distinct = (values: string[]) =>
      [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return {
      category: distinct(notes.map((n) => n.category)),
      topic: distinct(notes.flatMap((n) => n.tags)),
      jurisdiction: distinct(notes.map((n) => n.jurisdiction ?? "")),
    };
  }, [notes]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((n) => {
      if (category && n.category !== category) return false;
      if (topic && !n.tags.includes(topic)) return false;
      if (jurisdiction && (n.jurisdiction ?? "") !== jurisdiction) return false;
      if (q && !`${n.title} ${n.summary} ${n.tags.join(" ")}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [notes, query, category, topic, jurisdiction]);

  const hasFilters = Boolean(query || category || topic || jurisdiction);
  const reset = () => {
    setQuery("");
    setCategory("");
    setTopic("");
    setJurisdiction("");
  };
  const filterKey = `${category}|${topic}|${jurisdiction}|${query}`;

  return (
    <div className="space-y-6">
      {/* Toolbar: search + compact dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[200px] flex-1 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
          <Search className="size-4 shrink-0 text-white/40" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={fr ? "Rechercher une note…" : "Search notes…"}
            aria-label={fr ? "Rechercher parmi les notes" : "Search the notes"}
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
        <SelectFilter label={fr ? "Catégorie" : "Category"} value={category} onChange={setCategory} options={opts.category} />
        <SelectFilter label={fr ? "Sujet" : "Topic"} value={topic} onChange={setTopic} options={opts.topic} />
        <SelectFilter label={fr ? "Juridiction" : "Jurisdiction"} value={jurisdiction} onChange={setJurisdiction} options={opts.jurisdiction} />
      </div>

      {/* Count + reset */}
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
          <span className="text-white/80">{results.length}</span>{" "}
          {fr
            ? `sur ${notes.length} note${notes.length === 1 ? "" : "s"}`
            : `of ${notes.length} note${notes.length === 1 ? "" : "s"}`}
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

      {/* Results grid */}
      {results.length > 0 ? (
        <MotionStagger key={filterKey} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.map((n) => (
            <ResearchCard
              key={n.slug}
              lang={lang}
              href={`/research/${n.slug}`}
              category={n.category}
              title={n.title}
              description={n.summary}
              status="published"
              meta={n.readingTime}
              tags={n.tags}
            />
          ))}
        </MotionStagger>
      ) : (
        <div className="rounded-[1.8rem] border border-white/8 py-14 text-center text-sm text-white/45">
          {fr ? "Aucune note ne correspond." : "No note matches these filters."}
        </div>
      )}
    </div>
  );
}
