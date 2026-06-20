"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  getEuropeMapTone,
  type EuropeCountryStatus,
} from "@/content/ai-regulation/europe-map";
import { europeImplementationStatusTaxonomy } from "@/content/ai-regulation/europe-country-profiles";
import { cn, formatDisplayDate } from "@/lib/utils";

type Tone = ReturnType<typeof getEuropeMapTone>;

function nodeClasses(tone: Tone, active: boolean) {
  const base =
    "border bg-white shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition";
  const byTone =
    tone === "success"
      ? "border-emerald-300 text-emerald-800"
      : tone === "info"
        ? "border-sky-300 text-sky-800"
        : tone === "warning"
          ? "border-amber-300 text-amber-800"
          : "border-zinc-300 text-zinc-600";
  return cn(base, byTone, active && "ring-2 ring-accent ring-offset-1");
}

function dotColor(tone: Tone) {
  switch (tone) {
    case "success":
      return "#10b981";
    case "info":
      return "#0ea5e9";
    case "warning":
      return "#f59e0b";
    default:
      return "#a1a1aa";
  }
}

function chipClasses(tone: Tone) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "info":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

export function EuropeImplementationMap({
  countries,
}: {
  countries: EuropeCountryStatus[];
}) {
  const [activeCode, setActiveCode] = useState<string>(countries[0]?.code ?? "");
  const reduce = useReducedMotion();
  const activeCountry = useMemo(
    () => countries.find((country) => country.code === activeCode) ?? countries[0],
    [activeCode, countries],
  );

  // Connect each node to its 2 nearest neighbours → a quiet constellation.
  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: { a: EuropeCountryStatus; b: EuropeCountryStatus }[] = [];
    for (const a of countries) {
      const nearest = countries
        .filter((c) => c.code !== a.code)
        .map((b) => ({ b, d: Math.hypot(a.x - b.x, a.y - b.y) }))
        .sort((m, n) => m.d - n.d)
        .slice(0, 2);
      for (const { b } of nearest) {
        const key = [a.code, b.code].sort().join("-");
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ a, b });
      }
    }
    return list;
  }, [countries]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative overflow-hidden rounded-[2rem] border border-black/6 bg-[radial-gradient(circle_at_30%_20%,rgba(154,107,31,0.06),transparent_45%),linear-gradient(180deg,#ffffff,#f7f6f1)] p-6 shadow-[0_18px_50px_rgba(15,15,15,0.05)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-accent-strong">
          Member states · {countries.length}
        </p>
        <div className="relative mt-2 aspect-[1.15/1] min-h-[420px]">
          {/* constellation links */}
          <svg className="absolute inset-0 h-full w-full" aria-hidden>
            {edges.map(({ a, b }, i) => {
              const touchesActive =
                a.code === activeCode || b.code === activeCode;
              return (
                <motion.line
                  key={`${a.code}-${b.code}`}
                  x1={`${a.x}%`}
                  y1={`${a.y}%`}
                  x2={`${b.x}%`}
                  y2={`${b.y}%`}
                  stroke={touchesActive ? "#9a6b1f" : "#1e293b"}
                  strokeWidth={touchesActive ? 1.1 : 0.6}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: touchesActive ? 0.45 : 0.14 }}
                  transition={{ duration: 0.5, delay: reduce ? 0 : 0.01 * i }}
                />
              );
            })}
          </svg>

          {countries.map((country, i) => {
            const tone = getEuropeMapTone(country.status);
            const active = activeCode === country.code;
            return (
              <motion.button
                key={country.code}
                type="button"
                onMouseEnter={() => setActiveCode(country.code)}
                onFocus={() => setActiveCode(country.code)}
                onClick={() => setActiveCode(country.code)}
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: reduce ? 0 : 0.02 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ scale: 1.12 }}
                className={cn(
                  "group absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full py-1 pl-1 pr-2 text-[10px] font-semibold uppercase tracking-[0.12em]",
                  nodeClasses(tone, active),
                  active ? "z-20 scale-110" : "z-10",
                )}
                style={{ left: `${country.x}%`, top: `${country.y}%` }}
                aria-label={`${country.name}: ${europeImplementationStatusTaxonomy[country.status].label}`}
              >
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: dotColor(tone) }}
                />
                {country.code}
              </motion.button>
            );
          })}
        </div>
      </div>

      {activeCountry ? (
        <motion.div
          key={activeCountry.code}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[2rem] border border-black/6 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,15,15,0.05)] backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
              {activeCountry.name}
            </p>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.2em]",
                chipClasses(getEuropeMapTone(activeCountry.status)),
              )}
            >
              {europeImplementationStatusTaxonomy[activeCountry.status].label}
            </span>
            <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
              confidence {activeCountry.confidence}
            </span>
            {activeCountry.lastReviewedDate ? (
              <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
                reviewed {formatDisplayDate(activeCountry.lastReviewedDate)}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-7 text-zinc-700">{activeCountry.note}</p>
          <p className="mt-2 text-sm text-zinc-500">
            {europeImplementationStatusTaxonomy[activeCountry.status].shortExplanation}
          </p>
          {activeCountry.officialSourceUrl ? (
            <div className="mt-5 rounded-[1.4rem] border border-black/6 bg-zinc-50 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-accent-strong">
                Verified official source
              </p>
              <a
                href={activeCountry.officialSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-sm text-zinc-900 underline decoration-black/15 underline-offset-4"
              >
                {activeCountry.officialSourceLabel ?? activeCountry.officialSourceUrl}
              </a>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.4rem] border border-black/6 bg-zinc-50 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
                Verification posture
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                No official national implementation source is verified yet. The country
                stays visible to avoid implying a completed designation.
              </p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <span>{activeCountry.sourceCount} verified source references</span>
            {activeCountry.href ? (
              <Link
                href={activeCountry.href}
                className="text-accent-strong underline decoration-accent/30 underline-offset-4"
              >
                Open country profile
              </Link>
            ) : (
              <span className="text-zinc-400">Country profile not yet published</span>
            )}
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
