"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check } from "lucide-react";

import {
  article50Groups,
  article50ScenarioCategories,
  article50Scenarios,
  article50Situations,
  getArticle50DutiesForSituations,
  type Article50ScenarioCategory,
} from "@/content/ai-regulation/article-50-checklist";

type TriageCopy = {
  intro: string;
  resultTitle: string;
  resultEmpty: string;
  resultNone: string;
  workThrough: string;
  indicative: string;
};

const TRIAGE_COPY: Record<"en" | "fr", TriageCopy> = {
  en: {
    intro:
      "Tick every statement that describes your organisation. The applicable obligations appear below, with the checklist groups to work through.",
    resultTitle: "What applies to you",
    resultEmpty:
      "Nothing selected yet — tick the situations above to see which obligations apply.",
    resultNone:
      "Based on your answers, no Article 50 duty is triggered. Re-run this whenever you launch a new AI feature — and remember other AI Act chapters, and the GDPR, may still apply.",
    workThrough: "Work through",
    indicative:
      "Indicative mapping only — not legal advice. Borderline situations turn on specific facts and belong with counsel.",
  },
  fr: {
    intro:
      "Cochez chaque affirmation qui décrit votre organisation. Les obligations applicables s'affichent en dessous, avec les groupes de la checklist à traiter.",
    resultTitle: "Ce qui s'applique à vous",
    resultEmpty:
      "Rien de sélectionné pour l'instant — cochez les situations ci-dessus pour voir les obligations applicables.",
    resultNone:
      "D'après vos réponses, aucune obligation de l'article 50 n'est déclenchée. Refaites ce triage à chaque nouvelle fonctionnalité d'IA — et gardez en tête que d'autres chapitres du règlement, et le RGPD, peuvent s'appliquer.",
    workThrough: "Groupes à traiter",
    indicative:
      "Correspondance purement indicative — pas un conseil juridique. Les situations limites dépendent des faits et relèvent d'un avocat.",
  },
};

export function Article50Triage({ lang }: { lang: "en" | "fr" }) {
  const t = TRIAGE_COPY[lang];
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const selectedIds = useMemo(
    () => article50Situations.filter((s) => selected[s.id]).map((s) => s.id),
    [selected],
  );
  const duties = useMemo(
    () => getArticle50DutiesForSituations(selectedIds),
    [selectedIds],
  );

  return (
    <div className="space-y-5">
      <p className="max-w-3xl text-sm leading-7 text-zinc-500 hyphens-auto text-justify">
        {t.intro}
      </p>

      <ul className="grid gap-2.5 md:grid-cols-2">
        {article50Situations.map((situation) => {
          const isOn = Boolean(selected[situation.id]);
          return (
            <li key={situation.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isOn}
                onClick={() =>
                  setSelected((prev) => ({
                    ...prev,
                    [situation.id]: !prev[situation.id],
                  }))
                }
                className={`flex w-full items-start gap-3 rounded-[1.4rem] border p-4 text-left transition-colors ${
                  isOn
                    ? "border-emerald-500/35 bg-emerald-400/[0.05]"
                    : "border-black/6 bg-white hover:border-black/15"
                }`}
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    isOn
                      ? "border-emerald-400 bg-emerald-400 text-emerald-950"
                      : "border-black/15"
                  }`}
                >
                  {isOn ? <Check className="size-3.5" strokeWidth={3} /> : null}
                </span>
                <span className="text-sm leading-6 text-zinc-700">
                  {situation.statement}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="rounded-[1.8rem] border border-black/6 bg-zinc-50 p-6">
        <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-zinc-400">
          {t.resultTitle}
        </p>

        {selectedIds.length === 0 ? (
          <p className="mt-3 text-sm leading-7 text-zinc-500">{t.resultEmpty}</p>
        ) : duties.length === 0 ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-700 hyphens-auto text-justify">
            {t.resultNone}
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {duties.map((duty) => (
              <li key={duty.id} className="rounded-[1.4rem] border border-black/6 bg-white p-5">
                <p className="font-display text-base font-medium tracking-[-0.02em] text-zinc-950">
                  {duty.label}
                </p>
                <p className="mt-1.5 text-sm leading-7 text-zinc-700 hyphens-auto text-justify">
                  {duty.summary}
                </p>
                <p className="mt-2.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-zinc-500">
                  {t.workThrough}:{" "}
                  {duty.groups
                    .map(
                      (id) =>
                        article50Groups.find((group) => group.id === id)?.label,
                    )
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-zinc-500">
          <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-400" />
          {t.indicative}
        </p>
      </div>
    </div>
  );
}

type ScenarioCopy = {
  all: string;
  applies: string;
  traps: string;
};

const SCENARIO_COPY: Record<"en" | "fr", ScenarioCopy> = {
  en: { all: "All", applies: "What applies", traps: "Common traps" },
  fr: { all: "Tous", applies: "Ce qui s'applique", traps: "Pièges fréquents" },
};

export function Article50Scenarios({ lang }: { lang: "en" | "fr" }) {
  const t = SCENARIO_COPY[lang];
  const [category, setCategory] = useState<Article50ScenarioCategory | "all">(
    "all",
  );

  const visible = useMemo(
    () =>
      category === "all"
        ? article50Scenarios
        : article50Scenarios.filter((s) => s.category === category),
    [category],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setCategory("all")}
          aria-pressed={category === "all"}
          className={`rounded-full border px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] transition-colors ${
            category === "all"
              ? "border-black/15 bg-zinc-100 text-zinc-950"
              : "border-black/8 text-zinc-500 hover:border-black/15 hover:text-zinc-900"
          }`}
        >
          {t.all} · {article50Scenarios.length}
        </button>
        {article50ScenarioCategories.map((cat) => {
          const count = article50Scenarios.filter(
            (s) => s.category === cat.id,
          ).length;
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] transition-colors ${
                active
                  ? "border-black/15 bg-zinc-100 text-zinc-950"
                  : "border-black/8 text-zinc-500 hover:border-black/15 hover:text-zinc-900"
              }`}
            >
              {cat.label} · {count}
            </button>
          );
        })}
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {visible.map((scenario) => (
          <li
            key={scenario.id}
            className="rounded-[1.6rem] border border-black/6 bg-white p-5"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
              {
                article50ScenarioCategories.find(
                  (cat) => cat.id === scenario.category,
                )?.label
              }
            </p>
            <p className="mt-1.5 font-display text-base font-medium tracking-[-0.02em] text-zinc-950">
              {scenario.title}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-zinc-500 hyphens-auto text-justify">
              {scenario.situation}
            </p>

            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
              {t.applies}
            </p>
            <ul className="mt-1.5 space-y-1.5 text-sm leading-6 text-zinc-700">
              {scenario.applies.map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="mt-2.5 size-1 shrink-0 rounded-full bg-emerald-400" />
                  <span className="hyphens-auto text-justify">{line}</span>
                </li>
              ))}
            </ul>

            {scenario.traps?.length ? (
              <>
                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                  {t.traps}
                </p>
                <ul className="mt-1.5 space-y-1.5 text-sm leading-6 text-zinc-700">
                  {scenario.traps.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span className="mt-2.5 size-1 shrink-0 rounded-full bg-amber-400" />
                      <span className="hyphens-auto text-justify">{line}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
