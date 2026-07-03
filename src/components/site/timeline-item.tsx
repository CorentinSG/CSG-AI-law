"use client";

import { motion } from "framer-motion";

import type { EuTimelineEntry } from "@/content/ai-regulation/eu-timeline";
import { cn, formatDisplayDate } from "@/lib/utils";

const statusLabels: Record<EuTimelineEntry["status"], string> = {
  proposal: "Proposal",
  political_agreement: "Political agreement",
  adopted: "Adopted",
  in_force: "In force",
  upcoming: "Upcoming",
  guidance: "Guidance",
  implementation: "Implementation",
};

export function TimelineItem({
  entry,
  isLast,
  index = 0,
}: {
  entry: EuTimelineEntry;
  isLast: boolean;
  index?: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      className="relative grid gap-4 pl-10 md:grid-cols-[160px_1fr]"
    >
      <div className="absolute left-0 top-1.5 flex flex-col items-center">
        <motion.span
          className="h-3 w-3 rounded-full border border-sky-300/60 bg-sky-300/80 shadow-[0_0_20px_rgba(148,163,184,0.25)]"
          initial={{ scale: 0 }}
          whileInView={{ scale: [0, 1.3, 1] }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 + 0.1 }}
        />
        {!isLast ? (
          <span className="mt-2 h-full min-h-16 w-px bg-gradient-to-b from-sky-200/50 to-white/10" />
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">
          {formatDisplayDate(entry.date)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.24em]",
              entry.status === "upcoming"
                ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                : "border-sky-400/30 bg-sky-500/10 text-sky-100",
            )}
          >
            {statusLabels[entry.status]}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
            confidence {entry.confidence}
          </span>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <p className="font-display text-xl font-medium uppercase tracking-[-0.04em] text-white">
          {entry.title}
        </p>
        <p className="mt-3 text-sm leading-7 text-zinc-300">{entry.description}</p>
        <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-7 text-zinc-300">
          Legal effect: {entry.legalEffect}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-zinc-500">
          <span>{entry.institution}</span>
          <span>{entry.authorityType}</span>
          <span>verified {formatDisplayDate(entry.lastVerifiedAt)}</span>
          <a
            href={entry.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-zinc-300 underline decoration-white/15 underline-offset-4"
          >
            Official source
          </a>
        </div>
        <div className="mt-3 space-y-2">
          {entry.sourceReferences.map((reference) => (
            <p key={`${entry.id}-${reference.url}`} className="text-xs leading-6 text-zinc-500">
              Source: {reference.institution}, {reference.title}
            </p>
          ))}
        </div>
      </div>
    </motion.li>
  );
}
