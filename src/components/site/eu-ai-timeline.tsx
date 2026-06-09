"use client";

import { motion } from "framer-motion";

import type { EuTimelineEntry } from "@/content/ai-regulation/eu-timeline";
import { TimelineItem } from "@/components/site/timeline-item";

export function EuAiTimeline({ entries }: { entries: EuTimelineEntry[] }) {
  return (
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
          isLast={index === entries.length - 1}
        />
      ))}
    </motion.ol>
  );
}
