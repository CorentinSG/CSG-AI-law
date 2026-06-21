"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { type UsStateMapStatus } from "@/content/ai-regulation/us-map";
import type { GeoPathData } from "@/lib/geo-paths";
import { UsMapLegend } from "@/components/site/us-map-legend";
import { UsStatePanel } from "@/components/site/us-state-panel";

// us-atlas FIPS numeric id → state code
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

// SVG hex fills per AI-law status
const STATUS_FILLS: Record<string, { base: string; hover: string; active: string }> = {
  enacted_comprehensive_ai_law:                    { base: "#bbf7d0", hover: "#86efac", active: "#4ade80" },
  enacted_sector_specific_ai_law:                  { base: "#99f6e4", hover: "#5eead4", active: "#2dd4bf" },
  pending_ai_legislation:                          { base: "#bae6fd", hover: "#7dd3fc", active: "#38bdf8" },
  agency_guidance_or_enforcement:                  { base: "#a5f3fc", hover: "#67e8f9", active: "#22d3ee" },
  ai_related_privacy_or_automated_decision_rules:  { base: "#c7d2fe", hover: "#a5b4fc", active: "#818cf8" },
  no_specific_ai_law_verified:                     { base: "#fef9c3", hover: "#fef08a", active: "#fde047" },
  needs_review:                                    { base: "#f4f4f5", hover: "#e4e4e7", active: "#d4d4d8" },
};

const FALLBACK = { base: "#f4f4f5", hover: "#e4e4e7", active: "#d4d4d8" };

export function UsImplementationMap({
  states,
  paths,
}: {
  states: UsStateMapStatus[];
  paths: GeoPathData[];
}) {
  const [activeCode, setActiveCode] = useState<string>(states[0]?.code ?? "");
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const stateMap = useMemo(
    () => new Map(states.map((s) => [s.code, s])),
    [states],
  );

  const activeState = stateMap.get(activeCode) ?? states[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      {/* ── Map panel ──────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[2rem] border border-black/6 bg-white shadow-[0_20px_60px_rgba(15,15,15,0.06)]">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-strong">
            States + D.C. · {states.length}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            Hover · click to explore
          </p>
        </div>

        <svg
          viewBox="0 0 960 600"
          style={{ width: "100%", height: "auto" }}
          aria-label="US state AI law status map"
        >
          {paths.map(({ id, d }) => {
            const code = FIPS_TO_CODE[id];
            const state = code ? stateMap.get(code) : undefined;
            const fills = state ? (STATUS_FILLS[state.status] ?? FALLBACK) : FALLBACK;
            const isActive = code === activeCode;
            const isHovered = code === hoveredCode;

            const fill = isActive
              ? fills.active
              : isHovered
                ? fills.hover
                : fills.base;
            const stroke = isActive ? "#9a6b1f" : "#fff";
            const strokeWidth = isActive ? 1.5 : 0.6;

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
      </div>

      {/* ── Detail panel ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeState ? (
          <UsStatePanel key={activeState.code} state={activeState} />
        ) : null}
      </AnimatePresence>

      {/* ── Legend ─────────────────────────────────────────── */}
      <div className="lg:col-span-2">
        <UsMapLegend states={states} />
      </div>
    </div>
  );
}
