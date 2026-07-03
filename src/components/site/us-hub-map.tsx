"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useSpring, useTransform, useReducedMotion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import { type UsStateMapStatus } from "@/content/ai-regulation/us-map";
import type { GeoPathData } from "@/lib/geo-paths";

const FIPS_TO_CODE: Record<string, string> = {
  "1":  "AL", "2":  "AK", "4":  "AZ", "5":  "AR", "6":  "CA",
  "8":  "CO", "9":  "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

const STATUS_FILLS: Record<string, { base: string; hover: string; active: string }> = {
  enacted_comprehensive_ai_law:                   { base: "#86efac", hover: "#4ade80", active: "#22c55e" },
  enacted_sector_specific_ai_law:                 { base: "#5eead4", hover: "#2dd4bf", active: "#14b8a6" },
  pending_ai_legislation:                         { base: "#93c5fd", hover: "#60a5fa", active: "#3b82f6" },
  agency_guidance_or_enforcement:                 { base: "#67e8f9", hover: "#22d3ee", active: "#06b6d4" },
  ai_related_privacy_or_automated_decision_rules: { base: "#a5b4fc", hover: "#818cf8", active: "#6366f1" },
  no_specific_ai_law_verified:                    { base: "#fcd34d", hover: "#fbbf24", active: "#f59e0b" },
  needs_review:                                   { base: "#e4e4e7", hover: "#d4d4d8", active: "#a1a1aa" },
};

const FALLBACK = { base: "#e4e4e7", hover: "#d4d4d8", active: "#a1a1aa" };

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

const LEGEND = [
  { key: "enacted_comprehensive_ai_law", color: "#86efac", label: "Enacted (comprehensive)" },
  { key: "enacted_sector_specific_ai_law", color: "#5eead4", label: "Enacted (sector)" },
  { key: "pending_ai_legislation", color: "#93c5fd", label: "Pending legislation" },
  { key: "no_specific_ai_law_verified", color: "#fcd34d", label: "No specific law" },
];

export function UsHubMap({
  states,
  paths,
}: {
  states: UsStateMapStatus[];
  paths: GeoPathData[];
}) {
  const router = useRouter();
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const stateMap = useMemo(
    () => new Map(states.map((s) => [s.code, s])),
    [states],
  );

  const hoveredState = hoveredCode ? stateMap.get(hoveredCode) : null;
  const hoveredFills = hoveredState
    ? (STATUS_FILLS[hoveredState.status] ?? FALLBACK)
    : FALLBACK;

  const enacted = states.filter(
    (s) =>
      s.status === "enacted_comprehensive_ai_law" ||
      s.status === "enacted_sector_specific_ai_law",
  ).length;
  const pending = states.filter((s) => s.status === "pending_ai_legislation").length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-black/6 bg-white shadow-[0_20px_60px_rgba(15,15,15,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400">
          States + D.C. · {states.length}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[9px] text-zinc-400"><AnimatedCount target={enacted} /> enacted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-sky-400" />
            <span className="font-mono text-[9px] text-zinc-400"><AnimatedCount target={pending} /> pending</span>
          </div>
        </div>
      </div>

      {/* SVG map */}
      <div className="relative flex-1">
        <motion.svg
          viewBox="0 0 960 600"
          style={{ width: "100%", height: "auto" }}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          aria-label="US state AI law status map"
        >
          {paths.map(({ id, d }) => {
            const code = FIPS_TO_CODE[id];
            const state = code ? stateMap.get(code) : undefined;
            const fills = state ? (STATUS_FILLS[state.status] ?? FALLBACK) : FALLBACK;
            const isHovered = code === hoveredCode;

            return (
              <path
                key={id}
                d={d}
                fill={isHovered ? fills.hover : fills.base}
                stroke={isHovered ? "#374151" : "#fff"}
                strokeWidth={isHovered ? 1.2 : 0.65}
                style={{
                  cursor: code && state?.href ? "pointer" : "default",
                  transition: "fill 0.13s ease",
                  outline: "none",
                }}
                onMouseEnter={code ? () => setHoveredCode(code) : undefined}
                onMouseLeave={code ? () => setHoveredCode(null) : undefined}
                onClick={
                  code && state?.href
                    ? () => router.push(state.href!)
                    : undefined
                }
              />
            );
          })}
        </motion.svg>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoveredState && (
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
                  style={{ background: hoveredFills.active }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-medium uppercase tracking-[-0.02em] text-zinc-950">
                    {hoveredState.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.2em] text-zinc-500">
                    {hoveredState.status.replaceAll("_", " ")}
                  </p>
                </div>
                {hoveredState.href && (
                  <ExternalLink className="size-3.5 flex-shrink-0 text-zinc-300" />
                )}
              </div>
              {hoveredState.href && (
                <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.18em] text-zinc-400">
                  Cliquer pour ouvrir le profil état →
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t border-black/5 px-5 py-3">
        {LEGEND.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span
              className="size-2 flex-shrink-0 rounded-full"
              style={{ background: item.color }}
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
