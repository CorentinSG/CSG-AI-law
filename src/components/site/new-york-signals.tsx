'use client';

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function NewYorkSignals({ className }: { className?: string }) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      <motion.div
        className="absolute bottom-[12%] right-[14%] h-px w-44 bg-black/10"
        animate={{ opacity: [0.16, 0.34, 0.16], scaleX: [0.96, 1, 0.96] }}
        transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[12%] right-[14%] h-20 w-px bg-black/10"
        animate={{ opacity: [0.14, 0.28, 0.14], scaleY: [0.92, 1, 0.92] }}
        transition={{
          duration: 6.2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 0.2,
        }}
      />
      <motion.div
        className="absolute bottom-[22%] right-[19%] h-12 w-px bg-black/8"
        animate={{ opacity: [0.08, 0.22, 0.08] }}
        transition={{
          duration: 4.8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 0.4,
        }}
      />
      <motion.div
        className="absolute left-[8%] top-[18%] font-mono text-[10px] uppercase tracking-[0.34em] text-black/24"
        animate={{ opacity: [0.12, 0.3, 0.12] }}
        transition={{ duration: 7.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        Manhattan · NYC
      </motion.div>
      <motion.div
        className="absolute bottom-[18%] left-[8%] font-mono text-[10px] uppercase tracking-[0.32em] text-black/22"
        animate={{ opacity: [0.08, 0.24, 0.08] }}
        transition={{
          duration: 6.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 0.8,
        }}
      >
        40.7128° N · 74.0060° W
      </motion.div>
    </div>
  );
}
