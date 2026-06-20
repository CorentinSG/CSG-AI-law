"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  getUsMapTone,
  type UsStateMapStatus,
} from "@/content/ai-regulation/us-map";
import { usStateAiLawStatusTaxonomy } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { UsMapLegend } from "@/components/site/us-map-legend";
import { UsStatePanel } from "@/components/site/us-state-panel";
import { cn } from "@/lib/utils";

type Tone = ReturnType<typeof getUsMapTone>;

function nodeClasses(tone: Tone, active: boolean) {
  const byTone =
    tone === "success"
      ? "border-emerald-300 text-emerald-800"
      : tone === "info"
        ? "border-sky-300 text-sky-800"
        : tone === "warning"
          ? "border-amber-300 text-amber-800"
          : "border-zinc-300 text-zinc-600";
  return cn(
    "border bg-white shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition",
    byTone,
    active && "ring-2 ring-accent ring-offset-1",
  );
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

export function UsImplementationMap({
  states,
}: {
  states: UsStateMapStatus[];
}) {
  const [activeCode, setActiveCode] = useState<string>(states[0]?.code ?? "");
  const reduce = useReducedMotion();
  const activeState = useMemo(
    () => states.find((state) => state.code === activeCode) ?? states[0],
    [activeCode, states],
  );

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: { a: UsStateMapStatus; b: UsStateMapStatus }[] = [];
    for (const a of states) {
      const nearest = states
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
  }, [states]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="relative overflow-hidden rounded-[2rem] border border-black/6 bg-[radial-gradient(circle_at_30%_20%,rgba(154,107,31,0.06),transparent_45%),linear-gradient(180deg,#ffffff,#f7f6f1)] p-6 shadow-[0_18px_50px_rgba(15,15,15,0.05)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-accent-strong">
          States + D.C. · {states.length}
        </p>
        <div className="relative mt-2 aspect-[1.55/1] min-h-[420px]">
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
                  animate={{ opacity: touchesActive ? 0.45 : 0.12 }}
                  transition={{ duration: 0.5, delay: reduce ? 0 : 0.006 * i }}
                />
              );
            })}
          </svg>

          {states.map((state, i) => {
            const tone = getUsMapTone(state.status);
            const active = activeCode === state.code;
            return (
              <motion.button
                key={state.code}
                type="button"
                onMouseEnter={() => setActiveCode(state.code)}
                onFocus={() => setActiveCode(state.code)}
                onClick={() => setActiveCode(state.code)}
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.35,
                  delay: reduce ? 0 : 0.012 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ scale: 1.14 }}
                className={cn(
                  "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full py-0.5 pl-0.5 pr-1.5 text-[9px] font-semibold uppercase tracking-[0.1em]",
                  nodeClasses(tone, active),
                  active ? "z-20 scale-110" : "z-10",
                )}
                style={{ left: `${state.x}%`, top: `${state.y}%` }}
                aria-label={`${state.name}: ${usStateAiLawStatusTaxonomy[state.status].label}`}
              >
                <span
                  className="inline-block size-2 rounded-full"
                  style={{ backgroundColor: dotColor(tone) }}
                />
                {state.code}
              </motion.button>
            );
          })}
        </div>
      </div>

      {activeState ? <UsStatePanel state={activeState} /> : null}
      <div className="lg:col-span-2">
        <UsMapLegend states={states} />
      </div>
    </div>
  );
}
