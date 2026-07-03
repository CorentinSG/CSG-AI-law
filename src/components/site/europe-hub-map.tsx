"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import {
  getEuropeMapTone,
  type EuropeCountryStatus,
} from "@/content/ai-regulation/europe-map";
import { europeImplementationStatusTaxonomy } from "@/content/ai-regulation/europe-country-profiles";
import type { GeoPathData } from "@/lib/geo-paths";

const ISO_TO_EU: Record<string, string> = {
  "40": "AT", "56": "BE", "100": "BG", "196": "CY", "203": "CZ",
  "208": "DK", "233": "EE", "246": "FI", "250": "FR", "276": "DE",
  "300": "GR", "191": "HR", "348": "HU", "372": "IE", "380": "IT",
  "440": "LT", "442": "LU", "428": "LV", "470": "MT", "528": "NL",
  "616": "PL", "620": "PT", "642": "RO", "752": "SE", "705": "SI",
  "703": "SK", "724": "ES",
};

type Tone = "success" | "info" | "warning" | "neutral";

const FILLS: Record<Tone, { base: string; hover: string; active: string }> = {
  success: { base: "#86efac", hover: "#4ade80", active: "#22c55e" },
  info:    { base: "#93c5fd", hover: "#60a5fa", active: "#3b82f6" },
  warning: { base: "#fcd34d", hover: "#fbbf24", active: "#f59e0b" },
  neutral: { base: "#e2e8f0", hover: "#cbd5e1", active: "#94a3b8" },
};

const LEGEND = [
  { tone: "success" as Tone, label: "Verified" },
  { tone: "info" as Tone, label: "In progress" },
  { tone: "warning" as Tone, label: "Under review" },
  { tone: "neutral" as Tone, label: "Pending" },
];

const TONES: Tone[] = ["success", "info", "warning", "neutral"];

/** Animated integer counter — springs from 0 to `target` on mount. */
function AnimatedCount({ target }: { target: number }) {
  const reduced = useReducedMotion();
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toString());

  useEffect(() => {
    if (!reduced) spring.set(target);
  }, [target, spring, reduced]);

  if (reduced) return <>{target}</>;
  return <motion.span>{display}</motion.span>;
}

export function EuropeHubMap({
  countries,
  paths,
}: {
  countries: EuropeCountryStatus[];
  paths: GeoPathData[];
}) {
  const router = useRouter();
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const countryMap = useMemo(
    () => new Map(countries.map((c) => [c.code, c])),
    [countries],
  );

  const hoveredCountry = hoveredCode ? countryMap.get(hoveredCode) : null;
  const hoveredTone = hoveredCountry
    ? (getEuropeMapTone(hoveredCountry.status) as Tone)
    : "neutral";

  const stats = useMemo(() => ({
    verified:   countries.filter((c) => (getEuropeMapTone(c.status) as Tone) === "success").length,
    inProgress: countries.filter((c) => (getEuropeMapTone(c.status) as Tone) === "info").length,
    review:     countries.filter((c) => (getEuropeMapTone(c.status) as Tone) === "warning").length,
  }), [countries]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-black/6 bg-white shadow-[0_20px_60px_rgba(15,15,15,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
          EU Member States · {countries.length}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[9px] text-zinc-400"><AnimatedCount target={stats.verified} /></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sky-400" />
            <span className="font-mono text-[9px] text-zinc-400"><AnimatedCount target={stats.inProgress} /></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-amber-400" />
            <span className="font-mono text-[9px] text-zinc-400"><AnimatedCount target={stats.review} /></span>
          </div>
        </div>
      </div>

      {/* SVG map */}
      <div className="relative flex-1">
        <motion.svg
          viewBox="0 0 780 520"
          style={{ width: "100%", height: "auto" }}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          aria-label="EU member state AI Act implementation map"
        >
          <defs>
            {TONES.map((tone) => (
              <filter key={tone} id={`hub-eu-glow-${tone}`} x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow
                  dx="0" dy="0" stdDeviation="6"
                  floodColor={FILLS[tone].active}
                  floodOpacity="0.7"
                />
              </filter>
            ))}
          </defs>

          {paths.map(({ id, d }) => {
            const code = ISO_TO_EU[id];
            const country = code ? countryMap.get(code) : undefined;
            const tone = (country ? getEuropeMapTone(country.status) : "neutral") as Tone;
            const isHovered = code === hoveredCode;

            const fill = isHovered
              ? FILLS[tone].hover
              : country
                ? FILLS[tone].base
                : "#eeecea";

            return (
              <path
                key={id}
                d={d}
                fill={fill}
                stroke={isHovered && code ? "#374151" : code ? "#fff" : "#e4e0da"}
                strokeWidth={isHovered && code ? 1.2 : code ? 0.65 : 0.3}
                filter={isHovered && code ? `url(#hub-eu-glow-${tone})` : undefined}
                style={{
                  cursor: code && country?.href ? "pointer" : "default",
                  transition: "fill 0.13s ease",
                  outline: "none",
                }}
                onMouseEnter={code ? () => setHoveredCode(code) : undefined}
                onMouseLeave={code ? () => setHoveredCode(null) : undefined}
                onClick={
                  code && country?.href
                    ? () => router.push(country.href!)
                    : undefined
                }
              />
            );
          })}
        </motion.svg>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredCountry && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-[1.4rem] border border-black/8 bg-white/96 p-3.5 shadow-[0_8px_30px_rgba(15,15,15,0.12)] backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="size-3 flex-shrink-0 rounded-full"
                  style={{ background: FILLS[hoveredTone].active }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-medium uppercase tracking-[-0.02em] text-zinc-950">
                    {hoveredCountry.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-zinc-500">
                    {europeImplementationStatusTaxonomy[hoveredCountry.status]?.label ??
                      hoveredCountry.status.replaceAll("_", " ")}
                  </p>
                </div>
                {hoveredCountry.href && (
                  <ExternalLink className="size-3.5 flex-shrink-0 text-zinc-300" />
                )}
              </div>
              {hoveredCountry.href && (
                <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-400">
                  Cliquer pour ouvrir le profil pays →
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 border-t border-black/5 px-5 py-3">
        {LEGEND.map((item) => (
          <div key={item.tone} className="flex items-center gap-1.5">
            <span
              className="size-2 flex-shrink-0 rounded-full"
              style={{ background: FILLS[item.tone].base }}
            />
            <span className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-500">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
