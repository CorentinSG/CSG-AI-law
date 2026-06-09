"use client";

import Link from "next/link";

import {
  getUsMapColor,
  type UsStateMapStatus,
} from "@/content/ai-regulation/us-map";
import { usStateAiLawStatusTaxonomy } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { cn, formatDisplayDate } from "@/lib/utils";

export function UsStatePanel({ state }: { state: UsStateMapStatus }) {
  const color = getUsMapColor(state.status);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-white">
          {state.name}
        </p>
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.24em]",
            color.className,
          )}
        >
          {usStateAiLawStatusTaxonomy[state.status].label}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
          confidence {state.confidence}
        </span>
        {state.lastReviewedDate ? (
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
            reviewed {formatDisplayDate(state.lastReviewedDate)}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-sm leading-7 text-zinc-300">{state.note}</p>
      <p className="mt-2 text-sm text-zinc-400">
        {usStateAiLawStatusTaxonomy[state.status].description}
      </p>
      {state.officialSourceUrl ? (
        <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
            Verified official source
          </p>
          <a
            href={state.officialSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-sm text-zinc-100 underline decoration-white/15 underline-offset-4"
          >
            {state.officialSourceLabel ?? state.officialSourceUrl}
          </a>
        </div>
      ) : (
        <div className="mt-5 rounded-[1.4rem] border border-amber-300/20 bg-amber-500/10 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-amber-200">
            Verification incomplete
          </p>
          <p className="mt-2 text-sm text-zinc-300">
            No official state AI-law source is verified in this baseline yet. This is
            shown explicitly rather than hidden.
          </p>
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
        <span>{state.sourceCount} verified source references</span>
        <Link href={state.href} className="underline decoration-white/15 underline-offset-4">
          Open state profile
        </Link>
      </div>
    </div>
  );
}
