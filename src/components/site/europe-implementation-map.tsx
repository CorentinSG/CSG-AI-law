"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  getEuropeMapTone,
  type EuropeCountryStatus,
} from "@/content/ai-regulation/europe-map";
import { europeImplementationStatusTaxonomy } from "@/content/ai-regulation/europe-country-profiles";
import type { GeoPathData } from "@/lib/geo-paths";
import { cn, formatDisplayDate } from "@/lib/utils";

// World-Atlas ISO 3166-1 numeric id → EU country code
const ISO_TO_EU: Record<string, string> = {
  "40": "AT",  "56": "BE",  "100": "BG", "196": "CY", "203": "CZ",
  "208": "DK", "233": "EE", "246": "FI", "250": "FR", "276": "DE",
  "300": "GR", "191": "HR", "348": "HU", "372": "IE", "380": "IT",
  "440": "LT", "442": "LU", "428": "LV", "470": "MT", "528": "NL",
  "616": "PL", "620": "PT", "642": "RO", "752": "SE", "705": "SI",
  "703": "SK", "724": "ES",
};

type Tone = "success" | "info" | "warning" | "neutral";

const FILLS: Record<Tone, { base: string; hover: string; active: string }> = {
  success: { base: "#bbf7d0", hover: "#86efac", active: "#4ade80" },
  info:    { base: "#bae6fd", hover: "#7dd3fc", active: "#38bdf8" },
  warning: { base: "#fef9c3", hover: "#fef08a", active: "#fde047" },
  neutral: { base: "#f1f5f9", hover: "#e2e8f0", active: "#cbd5e1" },
};

const LEGEND: { tone: Tone; label: string }[] = [
  { tone: "success", label: "Verified" },
  { tone: "info",    label: "In progress" },
  { tone: "warning", label: "Needs review" },
  { tone: "neutral", label: "Not verified" },
];

function chipClasses(tone: Tone) {
  switch (tone) {
    case "success": return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "info":    return "border-sky-200 bg-sky-50 text-sky-800";
    case "warning": return "border-amber-200 bg-amber-50 text-amber-800";
    default:        return "border-zinc-200 bg-zinc-50 text-zinc-700";
  }
}

export function EuropeImplementationMap({
  countries,
  paths,
}: {
  countries: EuropeCountryStatus[];
  paths: GeoPathData[];
}) {
  const [activeCode, setActiveCode] = useState<string>(countries[0]?.code ?? "");
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const countryMap = useMemo(
    () => new Map(countries.map((c) => [c.code, c])),
    [countries],
  );

  const activeCountry = countryMap.get(activeCode) ?? countries[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      {/* ── Map panel ──────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[2rem] border border-black/6 bg-white shadow-[0_20px_60px_rgba(15,15,15,0.06)]">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-strong">
            EU Member States · {countries.length}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            Hover · click to explore
          </p>
        </div>

        <svg
          viewBox="0 0 780 520"
          style={{ width: "100%", height: "auto" }}
          aria-label="EU member state AI Act implementation map"
        >
          {paths.map(({ id, d }) => {
            const code = ISO_TO_EU[id];
            const country = code ? countryMap.get(code) : undefined;
            const tone = (country ? getEuropeMapTone(country.status) : "neutral") as Tone;
            const isActive = code === activeCode;
            const isHovered = code === hoveredCode;

            const fill = !code
              ? "#eeecea"
              : isActive
                ? FILLS[tone].active
                : isHovered
                  ? FILLS[tone].hover
                  : FILLS[tone].base;
            const stroke = isActive ? "#9a6b1f" : code ? "#fff" : "#e4e0da";
            const strokeWidth = isActive ? 1.6 : code ? 0.65 : 0.35;

            return (
              <path
                key={id}
                d={d}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                style={{
                  cursor: code ? "pointer" : "default",
                  transition: "fill 0.15s ease",
                  outline: "none",
                }}
                onMouseEnter={
                  code
                    ? () => { setActiveCode(code); setHoveredCode(code); }
                    : undefined
                }
                onMouseLeave={code ? () => setHoveredCode(null) : undefined}
                onClick={code ? () => setActiveCode(code) : undefined}
              />
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap gap-5 border-t border-black/5 px-5 py-3.5">
          {LEGEND.map((item) => (
            <div key={item.tone} className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-full border border-black/10"
                style={{ backgroundColor: FILLS[item.tone].base }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detail panel ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeCountry ? (
          <motion.div
            key={activeCountry.code}
            initial={reduce ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-4 rounded-[2rem] border border-black/6 bg-white/95 p-6 shadow-[0_18px_40px_rgba(15,15,15,0.05)] backdrop-blur-sm"
          >
            <div>
              <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
                {activeCountry.name}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]",
                    chipClasses(getEuropeMapTone(activeCountry.status) as Tone),
                  )}
                >
                  {europeImplementationStatusTaxonomy[activeCountry.status].label}
                </span>
                <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-600">
                  {activeCountry.confidence}
                </span>
              </div>
            </div>

            <p className="text-sm leading-7 text-zinc-700">{activeCountry.note}</p>

            <p className="text-[12px] leading-6 text-zinc-500">
              {europeImplementationStatusTaxonomy[activeCountry.status].shortExplanation}
            </p>

            {activeCountry.lastReviewedDate ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                Reviewed {formatDisplayDate(activeCountry.lastReviewedDate)}
              </p>
            ) : null}

            <div className="rounded-[1.4rem] border border-black/6 bg-zinc-50/80 p-4">
              {activeCountry.officialSourceUrl ? (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-strong">
                    Official source
                  </p>
                  <a
                    href={activeCountry.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate text-sm text-zinc-900 underline decoration-black/15 underline-offset-4"
                  >
                    {activeCountry.officialSourceLabel ?? "Open source"}
                  </a>
                </>
              ) : (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                    Verification posture
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    No official national source verified yet.
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-zinc-500">
                {activeCountry.sourceCount} source
                {activeCountry.sourceCount !== 1 ? "s" : ""}
              </span>
              {activeCountry.href ? (
                <Link
                  href={activeCountry.href}
                  className="font-medium text-accent-strong underline decoration-accent/30 underline-offset-4"
                >
                  Country profile →
                </Link>
              ) : (
                <span className="text-zinc-400">Profile not yet published</span>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
