"use client";

import { motion } from "framer-motion";

import type { UsTimelineEntry } from "@/content/ai-regulation/us-ai-legal-baseline";
import { cn, formatDisplayDate } from "@/lib/utils";

const bindingColors = {
  binding: "border-red-400/30 bg-red-500/10 text-red-100",
  non_binding: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  needs_review: "border-amber-400/30 bg-amber-500/10 text-amber-100",
} as const;

const bindingLabels = {
  binding: "Binding",
  non_binding: "Non-binding",
  needs_review: "Status under review",
} as const;

function UsTimelineItem({
  entry,
  isLast,
  index = 0,
}: {
  entry: UsTimelineEntry;
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
      {/* Vertical connector */}
      <div className="absolute left-0 top-1.5 flex flex-col items-center">
        <motion.span
          className="h-3 w-3 rounded-full border border-red-300/60 bg-red-300/80 shadow-[0_0_20px_rgba(248,113,113,0.2)]"
          initial={{ scale: 0 }}
          whileInView={{ scale: [0, 1.3, 1] }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 + 0.1 }}
        />
        {!isLast ? (
          <span className="mt-2 h-full min-h-16 w-px bg-gradient-to-b from-red-200/40 to-white/5" />
        ) : null}
      </div>

      {/* Date + status */}
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">
          {formatDisplayDate(entry.date)}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.24em]",
              bindingColors[entry.bindingStatus],
            )}
          >
            {bindingLabels[entry.bindingStatus]}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
            confidence {entry.confidenceLevel}
          </span>
        </div>
      </div>

      {/* Content card */}
      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <p className="font-display text-xl font-medium uppercase tracking-[-0.04em] text-white">
          {entry.title}
        </p>
        <p className="mt-3 text-sm leading-7 text-zinc-300">{entry.description}</p>
        <p className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm leading-7 text-zinc-300">
          Legal effect: {entry.legalEffect}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-zinc-500">
          <span>{entry.sourceInstitution}</span>
          <span>{entry.authorityType.replaceAll("_", " ")}</span>
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
      </div>
    </motion.li>
  );
}

export function UsAiTimeline({ entries }: { entries: UsTimelineEntry[] }) {
  return (
    <div className="relative">
      {/* Animated vertical line that draws itself top→bottom */}
      <motion.div
        className="absolute left-[5px] top-0 w-px bg-gradient-to-b from-red-200/50 via-red-100/20 to-transparent origin-top"
        style={{ height: "100%" }}
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      />
      <motion.ol
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        className="space-y-8"
      >
        {entries.map((entry, index) => (
          <UsTimelineItem
            key={entry.id}
            entry={entry}
            index={index}
            isLast={index === entries.length - 1}
          />
        ))}
      </motion.ol>
    </div>
  );
}
