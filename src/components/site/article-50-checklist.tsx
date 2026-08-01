"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Check, ChevronDown, Copy, Printer, RotateCcw } from "lucide-react";

import {
  ARTICLE_50_APPLICATION_DATE,
  ARTICLE_50_MARKING_GRACE_DATE,
  article50Groups,
  article50Items,
  article50Templates,
  type Article50GroupId,
} from "@/content/ai-regulation/article-50-checklist";

const STORAGE_KEY = "csg:article-50-checklist:v1";

type Copy = {
  progressLabel: (done: number, total: number) => string;
  allGroups: string;
  reset: string;
  print: string;
  daysLeft: (days: number) => string;
  overdue: string;
  appliesOn: string;
  markingGrace: string;
  purpose: string;
  actions: string;
  teams: string;
  evidence: string;
  timeline: string;
  priorityHigh: string;
  priorityMedium: string;
  templatesTitle: string;
  templatesIntro: string;
  copyWording: string;
  copied: string;
  done: string;
  expand: string;
};

const COPY: Record<"en" | "fr", Copy> = {
  en: {
    progressLabel: (done, total) => `${done} of ${total} controls marked done`,
    allGroups: "All",
    reset: "Reset",
    print: "Print",
    daysLeft: (days) =>
      days === 1 ? "1 day until Article 50 applies" : `${days} days until Article 50 applies`,
    overdue: "Article 50 is already applicable",
    appliesOn: "Applies from",
    markingGrace: "Art. 50(2) marking — legacy systems",
    purpose: "Why",
    actions: "Actions",
    teams: "Owners",
    evidence: "Evidence to retain",
    timeline: "Timeline",
    priorityHigh: "High",
    priorityMedium: "Medium",
    templatesTitle: "Sample disclosure wording",
    templatesIntro:
      "Article 50 does not prescribe exact wording — it requires the information to be clear, distinguishable, accessible, and given by the first interaction or exposure. These are illustrative, drafted to the legal standard rather than copied from an official EU template.",
    copyWording: "Copy",
    copied: "Copied",
    done: "Done",
    expand: "Details",
  },
  fr: {
    progressLabel: (done, total) => `${done} sur ${total} contrôles cochés`,
    allGroups: "Tous",
    reset: "Réinitialiser",
    print: "Imprimer",
    daysLeft: (days) =>
      days === 1
        ? "1 jour avant l'application de l'article 50"
        : `${days} jours avant l'application de l'article 50`,
    overdue: "L'article 50 est déjà applicable",
    appliesOn: "Applicable à partir du",
    markingGrace: "Marquage art. 50(2) — systèmes existants",
    purpose: "Pourquoi",
    actions: "Actions",
    teams: "Responsables",
    evidence: "Preuves à conserver",
    timeline: "Échéance",
    priorityHigh: "Haute",
    priorityMedium: "Moyenne",
    templatesTitle: "Exemples de mentions",
    templatesIntro:
      "L'article 50 n'impose pas de formulation précise : l'information doit être claire, distinguable, accessible et fournie au plus tard lors de la première interaction ou exposition. Ces exemples sont illustratifs, rédigés d'après le standard légal et non repris d'un modèle officiel de l'UE.",
    copyWording: "Copier",
    copied: "Copié",
    done: "Fait",
    expand: "Détails",
  },
};

/** Deterministic across server and client: fixed locale, fixed time zone. */
function formatDeadline(iso: string, lang: "en" | "fr") {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

function daysUntil(iso: string) {
  const target = new Date(`${iso}T00:00:00Z`).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / 86_400_000);
}

/**
 * Completed controls live in localStorage and are read through an external
 * store, so the server render and the first client render agree and no state
 * is set from an effect. Nothing leaves the browser.
 */
const DONE_EMPTY = "{}";
const listeners = new Set<() => void>();

function subscribeDone(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readDone() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DONE_EMPTY;
  } catch {
    // Storage disabled — the checklist still works, it just will not persist.
    return DONE_EMPTY;
  }
}

function readDoneOnServer() {
  return DONE_EMPTY;
}

function writeDone(next: Record<string, boolean>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked — nothing actionable for the user here.
  }
  listeners.forEach((listener) => listener());
}

function parseDone(raw: string): Record<string, boolean> {
  try {
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

/**
 * Reads the freshest value at write time rather than the one captured at
 * render, so two ticks in the same frame cannot overwrite each other.
 */
function toggleDone(id: string) {
  const current = parseDone(readDone());
  writeDone({ ...current, [id]: !current[id] });
}

/** Server renders `false`, client renders `true` after hydration. */
const subscribeNever = () => () => {};
const hydratedOnClient = () => true;
const hydratedOnServer = () => false;

export function Article50Checklist({ lang }: { lang: "en" | "fr" }) {
  const t = COPY[lang];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [group, setGroup] = useState<Article50GroupId | "all">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rawDone = useSyncExternalStore(
    subscribeDone,
    readDone,
    readDoneOnServer,
  );
  const done = useMemo(() => parseDone(rawDone), [rawDone]);

  const mounted = useSyncExternalStore(
    subscribeNever,
    hydratedOnClient,
    hydratedOnServer,
  );

  const toggle = useCallback((id: string) => toggleDone(id), []);

  const visible = useMemo(
    () =>
      group === "all"
        ? article50Items
        : article50Items.filter((item) => item.group === group),
    [group],
  );

  const doneCount = article50Items.filter((item) => done[item.id]).length;
  const pct = Math.round((doneCount / article50Items.length) * 100);
  const remaining = mounted ? daysUntil(ARTICLE_50_APPLICATION_DATE) : null;

  const copyWording = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard unavailable (permissions, insecure context) — the wording
      // stays selectable on screen.
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Deadline + progress */}
      <div className="rounded-[1.8rem] border border-black/6 bg-white p-6 shadow-[0_14px_40px_rgba(15,15,15,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-zinc-400">
              {t.appliesOn}
            </p>
            <p className="mt-1.5 font-display text-2xl font-medium tracking-[-0.02em] text-zinc-950">
              {formatDeadline(ARTICLE_50_APPLICATION_DATE, lang)}
            </p>
            {remaining !== null ? (
              <p
                className={`mt-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                  remaining <= 14 ? "text-amber-400" : "text-zinc-500"
                }`}
              >
                {remaining > 0 ? t.daysLeft(remaining) : t.overdue}
              </p>
            ) : null}
          </div>

          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-zinc-400">
              {t.markingGrace}
            </p>
            <p className="mt-1.5 font-display text-2xl font-medium tracking-[-0.02em] text-zinc-950">
              {formatDeadline(ARTICLE_50_MARKING_GRACE_DATE, lang)}
            </p>
            <p className="mt-1 max-w-xs text-[11px] leading-5 text-zinc-500">
              {lang === "fr"
                ? "Uniquement pour l'obligation de marquage de l'art. 50(2), et seulement pour les systèmes mis sur le marché avant le 2 août 2026."
                : "Only for the Art. 50(2) marking duty, and only for systems placed on the market before 2 August 2026."}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {t.progressLabel(doneCount, article50Items.length)}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              {pct}%
            </p>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t.progressLabel(doneCount, article50Items.length)}
          >
            <div
              className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters + tools */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setGroup("all")}
          aria-pressed={group === "all"}
          className={`rounded-full border px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] transition-colors ${
            group === "all"
              ? "border-black/15 bg-zinc-100 text-zinc-950"
              : "border-black/8 text-zinc-500 hover:border-black/15 hover:text-zinc-900"
          }`}
        >
          {t.allGroups} · {article50Items.length}
        </button>
        {article50Groups.map((g) => {
          const count = article50Items.filter((i) => i.group === g.id).length;
          const active = group === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroup(g.id)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] transition-colors ${
                active
                  ? "border-black/15 bg-zinc-100 text-zinc-950"
                  : "border-black/8 text-zinc-500 hover:border-black/15 hover:text-zinc-900"
              }`}
            >
              {g.label} · {count}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/8 px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-black/15 hover:text-zinc-900"
          >
            <Printer className="size-3" />
            {t.print}
          </button>
          <button
            type="button"
            onClick={() => writeDone({})}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/8 px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:border-black/15 hover:text-zinc-900"
          >
            <RotateCcw className="size-3" />
            {t.reset}
          </button>
        </div>
      </div>

      {/* Group description when filtered */}
      {group !== "all" ? (
        <p className="max-w-3xl text-sm leading-7 text-zinc-500">
          {article50Groups.find((g) => g.id === group)?.description}
        </p>
      ) : null}

      {/* Items */}
      <ul className="space-y-3">
        {visible.map((item) => {
          const isDone = Boolean(done[item.id]);
          const isOpen = Boolean(expanded[item.id]);
          const groupLabel = article50Groups.find((g) => g.id === item.group)?.label;

          return (
            <li
              key={item.id}
              className={`rounded-[1.6rem] border bg-white p-5 transition-colors ${
                isDone ? "border-emerald-500/30" : "border-black/6"
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  role="checkbox"
                  aria-checked={isDone}
                  aria-label={`${t.done}: ${item.title}`}
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    isDone
                      ? "border-emerald-400 bg-emerald-400 text-emerald-950"
                      : "border-black/15 hover:border-black/30"
                  }`}
                >
                  {isDone ? <Check className="size-3.5" strokeWidth={3} /> : null}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                      {groupLabel}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                      · {item.provision}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.18em] ${
                        item.priority === "high"
                          ? "bg-amber-400/12 text-amber-400"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {item.priority === "high" ? t.priorityHigh : t.priorityMedium}
                    </span>
                  </div>

                  <p
                    className={`mt-1.5 font-display text-base font-medium tracking-[-0.02em] ${
                      isDone ? "text-zinc-500 line-through" : "text-zinc-950"
                    }`}
                  >
                    {item.title}
                  </p>

                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                    {t.timeline}: {item.timeline}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                    }
                    aria-expanded={isOpen}
                    className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-zinc-900 print:hidden"
                  >
                    <ChevronDown
                      className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                    {t.expand}
                  </button>

                  <div className={isOpen ? "block" : "hidden print:block"}>
                    <div className="mt-4 space-y-4 border-t border-black/6 pt-4">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                          {t.purpose}
                        </p>
                        <p className="mt-1.5 text-sm leading-7 text-zinc-700 hyphens-auto text-justify">
                          {item.purpose}
                        </p>
                      </div>

                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                          {t.actions}
                        </p>
                        <ul className="mt-1.5 space-y-2 text-sm leading-7 text-zinc-700">
                          {item.actions.map((action) => (
                            <li key={action} className="flex gap-3">
                              <span className="mt-3 size-1 shrink-0 rounded-full bg-zinc-400" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                            {t.teams}
                          </p>
                          <p className="mt-1.5 text-sm leading-6 text-zinc-600">
                            {item.teams.join(" · ")}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                            {t.evidence}
                          </p>
                          <p className="mt-1.5 text-sm leading-6 text-zinc-600">
                            {item.evidence.join(" · ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Disclosure wording templates */}
      <section className="space-y-4 border-t border-black/6 pt-8">
        <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-zinc-950">
          {t.templatesTitle}
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-zinc-500 hyphens-auto text-justify">
          {t.templatesIntro}
        </p>
        <ul className="grid gap-3 md:grid-cols-2">
          {article50Templates.map((tpl) => (
            <li
              key={tpl.id}
              className="rounded-[1.6rem] border border-black/6 bg-white p-5"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400">
                {tpl.useCase}
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-950">
                “{tpl.wording}”
              </p>
              <p className="mt-2 text-[11px] leading-5 text-zinc-500">{tpl.note}</p>
              <button
                type="button"
                onClick={() => copyWording(tpl.id, tpl.wording)}
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-zinc-500 transition-colors hover:text-zinc-900 print:hidden"
              >
                {copiedId === tpl.id ? (
                  <Check className="size-3" />
                ) : (
                  <Copy className="size-3" />
                )}
                {copiedId === tpl.id ? t.copied : t.copyWording}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
