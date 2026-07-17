"use client";

import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

import { ImplementationProgressBar } from "@/components/site/implementation-progress-bar";
import { ConfidenceBadge, ImplementationBadge } from "@/components/site/legal-status-badge";

// ─── The Country Console ────────────────────────────────────────────────────
// Shared visual system for every jurisdiction page (EU country, U.S. state).
// See DESIGN.md §6: one glance = posture, numbers without essays, rows instead
// of cards-of-paragraphs, collapsed notes, uniform across jurisdictions.

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Counter({ value, reduce }: { value: number; reduce: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease,
      onUpdate: (v) => setProgress(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <>{reduce ? value : progress}</>;
}

const REGION_TINT = {
  europe: {
    glow: "bg-[radial-gradient(circle_at_35%_30%,rgba(129,140,248,0.28),transparent_70%)]",
    ring: "border-indigo-300/25",
    text: "text-indigo-300",
  },
  "united-states": {
    glow: "bg-[radial-gradient(circle_at_35%_30%,rgba(248,113,113,0.26),transparent_70%)]",
    ring: "border-red-300/25",
    text: "text-red-300",
  },
} as const;

export function CountryConsoleHero({
  region,
  code,
  name,
  implementationStatus,
  implementationConfidence,
  gaugeLabel,
  stats,
  lastReviewed,
}: {
  region: keyof typeof REGION_TINT;
  /** Short jurisdiction code for the roundel, e.g. "FR", "DE", "CA". */
  code: string;
  name: string;
  implementationStatus: string;
  implementationConfidence: string;
  gaugeLabel: string;
  /** 3–4 count-up stats. Labels must be self-explanatory — no footnotes. */
  stats: { value: number; label: string }[];
  lastReviewed?: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const tint = REGION_TINT[region];

  return (
    <div className="space-y-8">
      {/* Identity row: roundel + display name + live kicker */}
      <div className="flex flex-wrap items-center gap-5">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease }}
          className={`relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-white/[0.03] ${tint.ring}`}
        >
          <span aria-hidden className={`absolute inset-0 ${tint.glow}`} />
          <span className={`relative font-mono text-sm font-medium uppercase tracking-[0.18em] ${tint.text}`}>
            {code}
          </span>
        </motion.div>
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {!reduce ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              ) : null}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <p className={`font-mono text-[10px] uppercase tracking-[0.28em] ${tint.text}`}>
              Live monitoring
            </p>
          </div>
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.08 }}
            className="font-display text-5xl font-medium uppercase leading-none tracking-[-0.05em] text-zinc-950 md:text-6xl"
          >
            {name}
          </motion.h1>
        </div>
      </div>

      {/* Posture row: worded status chips + animated gauge */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.18 }}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <ImplementationBadge status={implementationStatus} />
          <ConfidenceBadge level={implementationConfidence} />
          {lastReviewed ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Reviewed {lastReviewed}
            </span>
          ) : null}
        </div>
        <ImplementationProgressBar
          status={implementationStatus}
          confidence={implementationConfidence}
          label={gaugeLabel}
          className="max-w-md"
        />
      </motion.div>

      {/* Count-up stat strip */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/8 md:grid-cols-4">
        {stats.slice(0, 4).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.25 + i * 0.1 }}
            className="flex flex-col gap-1.5 bg-[#0b0b0b] px-6 py-5"
          >
            <span className="font-display text-3xl font-medium tracking-[-0.04em] text-white">
              <Counter value={stat.value} reduce={reduce} />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Signal strip: live summary without essays ──────────────────────────────

const SIGNAL_TONE = {
  positive: "text-emerald-300",
  neutral: "text-white",
  warn: "text-amber-300",
} as const;

export function SignalStrip({
  primary,
  secondary,
}: {
  /** Big tiles: number + worded label, nothing else. */
  primary: { value: number; label: string; tone?: keyof typeof SIGNAL_TONE }[];
  /** Small inline chips: "N label". */
  secondary?: { value: number; label: string }[];
}) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/8 md:grid-cols-4">
        {primary.slice(0, 4).map((s, i) => (
          <motion.div
            key={s.label}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease, delay: i * 0.08 }}
            className="flex flex-col gap-1 bg-[#0b0b0b] px-6 py-4"
          >
            <span className={`font-display text-2xl font-medium tracking-[-0.03em] ${SIGNAL_TONE[s.tone ?? "neutral"]}`}>
              <Counter value={s.value} reduce={reduce} />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>
      {secondary && secondary.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {secondary.map((s) => (
            <span
              key={s.label}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600"
            >
              <span className="text-zinc-900">{s.value}</span> {s.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Ledger: rows instead of cards-of-paragraphs ────────────────────────────

const CHIP_TONE = {
  neutral: "border-white/10 bg-white/[0.04] text-white/55",
  info: "border-sky-300/25 bg-sky-400/[0.08] text-sky-300",
  gold: "border-accent-strong/30 bg-accent/10 text-accent-strong",
  warn: "border-amber-300/30 bg-amber-400/[0.08] text-amber-300",
} as const;

export interface LedgerEntry {
  id: string;
  chips: { label: string; tone?: keyof typeof CHIP_TONE }[];
  title: string;
  /** Collapsed by default; unfolds on hover/focus. */
  note?: string;
  meta: string;
  href?: string;
}

export function CountryLedger({ entries }: { entries: LedgerEntry[] }) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="divide-y divide-white/8 rounded-[1.8rem] border border-white/8 bg-white/[0.02]">
      {entries.map((entry, idx) => (
        <motion.article
          key={entry.id}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.4, ease, delay: reduce ? 0 : Math.min(idx * 0.05, 0.3) }}
          className="group relative px-5 py-4 transition-colors hover:bg-white/[0.02] first:rounded-t-[1.8rem] last:rounded-b-[1.8rem]"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {entry.chips.map((chip) => (
              <span
                key={chip.label}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${CHIP_TONE[chip.tone ?? "neutral"]}`}
              >
                {chip.label}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-[15px] font-medium leading-6 text-zinc-950">
              {entry.title}
            </h3>
            {entry.href ? (
              <a
                href={entry.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${entry.title} — official source`}
                className="shrink-0 rounded-full border border-white/10 p-1.5 text-white/45 transition-all duration-300 hover:border-accent-strong/40 hover:text-accent-strong group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              >
                <ArrowUpRight className="size-3.5" />
              </a>
            ) : null}
          </div>
          {entry.note ? (
            <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 group-focus-within:grid-rows-[1fr] group-hover:grid-rows-[1fr]">
              <p className="min-h-0 overflow-hidden text-sm leading-6 text-zinc-600 opacity-0 transition-opacity duration-500 group-focus-within:opacity-100 group-hover:opacity-100">
                {entry.note}
              </p>
            </div>
          ) : null}
          <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-zinc-500">
            {entry.meta}
          </p>
        </motion.article>
      ))}
    </div>
  );
}

// ─── Verification gaps: worded severity, collapsed notes ────────────────────

export function GapRows({
  gaps,
}: {
  gaps: { id: string; title: string; severity: string; note: string }[];
}) {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="divide-y divide-amber-300/10 rounded-[1.8rem] border border-amber-300/20 bg-amber-400/[0.04]">
      {gaps.map((gap, idx) => (
        <motion.article
          key={gap.id}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.4, ease, delay: reduce ? 0 : Math.min(idx * 0.05, 0.3) }}
          className="group px-5 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 text-sm font-medium leading-6 text-zinc-950">{gap.title}</h3>
            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${CHIP_TONE.warn}`}>
              {gap.severity} priority
            </span>
          </div>
          <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 group-focus-within:grid-rows-[1fr] group-hover:grid-rows-[1fr]">
            <p className="min-h-0 overflow-hidden text-sm leading-6 text-zinc-600 opacity-0 transition-opacity duration-500 group-focus-within:opacity-100 group-hover:opacity-100">
              {gap.note}
            </p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
