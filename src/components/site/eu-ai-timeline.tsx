"use client";

import { motion } from "framer-motion";

import type { EuTimelineEntry } from "@/content/ai-regulation/eu-timeline";
import { TimelineItem } from "@/components/site/timeline-item";

export function EuAiTimeline({ entries }: { entries: EuTimelineEntry[] }) {
  return (
    <div className="relative">
      {/* Animated vertical line that draws itself top→bottom */}
      <motion.div
        className="absolute left-[5px] top-0 w-px bg-gradient-to-b from-sky-200/60 via-sky-100/30 to-transparent origin-top"
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
          <TimelineItem
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
