'use client';

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function JarvisOrb({
  className,
  label = "AI signal",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <motion.div
        className="jarvis-ring glass-panel-soft relative flex size-14 items-center justify-center rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <motion.div
          className="absolute inset-[-18%] rounded-full border border-black/6"
          animate={{ rotate: -360, opacity: [0.18, 0.36, 0.18] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[22%] rounded-full border border-black/10"
          animate={{ scale: [0.96, 1.04, 0.96], opacity: [0.45, 0.82, 0.45] }}
          transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute size-2 rounded-full bg-black/60"
          animate={{ rotate: 360 }}
          transition={{ duration: 3.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          style={{ transformOrigin: "0 24px" }}
        />
        <motion.div
          className="size-3 rounded-full bg-[radial-gradient(circle,_rgba(17,17,17,0.9),_rgba(186,176,154,0.95))]"
          animate={{ scale: [1, 1.18, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
      </motion.div>
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
          {label}
        </p>
        <p className="text-sm text-zinc-600">Human-reviewed monitoring active</p>
      </div>
    </div>
  );
}
