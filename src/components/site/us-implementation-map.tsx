"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  getUsMapColor,
  type UsStateMapStatus,
} from "@/content/ai-regulation/us-map";
import { usStateAiLawStatusTaxonomy } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { UsMapLegend } from "@/components/site/us-map-legend";
import { UsStatePanel } from "@/components/site/us-state-panel";
import { cn } from "@/lib/utils";

export function UsImplementationMap({
  states,
}: {
  states: UsStateMapStatus[];
}) {
  const [activeCode, setActiveCode] = useState<string>(states[0]?.code ?? "");
  const activeState = useMemo(
    () => states.find((state) => state.code === activeCode) ?? states[0],
    [activeCode, states],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.18),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute left-[10%] top-[22%] h-24 w-24 rounded-full border border-white/10" />
          <div className="absolute right-[18%] top-[20%] h-40 w-40 rounded-full border border-sky-200/10" />
          <div className="absolute bottom-[18%] left-[36%] h-44 w-44 rounded-full border border-white/10" />
        </div>
        <div className="relative aspect-[1.55/1] min-h-[420px]">
          {states.map((state) => (
            <motion.button
              key={state.code}
              type="button"
              onMouseEnter={() => setActiveCode(state.code)}
              onFocus={() => setActiveCode(state.code)}
              onClick={() => setActiveCode(state.code)}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-md transition",
                getUsMapColor(state.status).className,
                activeCode === state.code ? "scale-110" : "hover:scale-105",
              )}
              style={{ left: `${state.x}%`, top: `${state.y}%` }}
              aria-label={`${state.name}: ${usStateAiLawStatusTaxonomy[state.status].label}`}
            >
              {state.code}
            </motion.button>
          ))}
        </div>
      </div>

      {activeState ? <UsStatePanel state={activeState} /> : null}
      <div className="lg:col-span-2">
        <UsMapLegend states={states} />
      </div>
    </div>
  );
}
