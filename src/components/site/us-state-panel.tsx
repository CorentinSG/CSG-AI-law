"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import {
  getUsMapTone,
  type UsStateMapStatus,
} from "@/content/ai-regulation/us-map";
import { usStateAiLawStatusTaxonomy } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { cn, formatDisplayDate } from "@/lib/utils";

function chipClasses(tone: ReturnType<typeof getUsMapTone>) {
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

export function UsStatePanel({ state }: { state: UsStateMapStatus }) {
  const tone = getUsMapTone(state.status);
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={state.code}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[2rem] border border-black/6 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,15,15,0.05)] backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
          {state.name}
        </p>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.2em]",
            chipClasses(tone),
          )}
        >
          {usStateAiLawStatusTaxonomy[state.status].label}
        </span>
        <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
          confidence {state.confidence}
        </span>
        {state.lastReviewedDate ? (
          <span className="rounded-full border border-black/8 bg-zinc-50 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
            reviewed {formatDisplayDate(state.lastReviewedDate)}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-sm leading-7 text-zinc-700">{state.note}</p>
      <p className="mt-2 text-sm text-zinc-500">
        {usStateAiLawStatusTaxonomy[state.status].description}
      </p>
      {state.officialSourceUrl ? (
        <div className="mt-5 rounded-[1.4rem] border border-black/6 bg-zinc-50 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-accent-strong">
            Verified official source
          </p>
          <a
            href={state.officialSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-sm text-zinc-900 underline decoration-black/15 underline-offset-4"
          >
            {state.officialSourceLabel ?? state.officialSourceUrl}
          </a>
        </div>
      ) : (
        <div className="mt-5 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-amber-700">
            Verification incomplete
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            No official state AI-law source is verified in this baseline yet. This is
            shown explicitly rather than hidden.
          </p>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
        <span>{state.sourceCount} verified source references</span>
        <Link
          href={state.href}
          className="text-accent-strong underline decoration-accent/30 underline-offset-4"
        >
          Open state profile
        </Link>
      </div>
    </motion.div>
  );
}
