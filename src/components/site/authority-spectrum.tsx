"use client";

import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";

import type { Locale } from "@/lib/i18n/config";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Counter({ value, reduce }: { value: number; reduce: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease,
      onUpdate: (v) => setProgress(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <>{reduce ? value : progress}</>;
}

/**
 * The Standards page hero instrument: three animated counters and the
 * authority spectrum — a single animated line from binding law (white pole)
 * to standards & soft law (gold pole). Replaces two bullet-list cards with
 * one glanceable visual.
 */
export function AuthoritySpectrum({
  lang,
  instruments,
  types,
  regions,
}: {
  lang: Locale;
  instruments: number;
  types: number;
  regions: number;
}) {
  const fr = lang === "fr";
  const reduce = useReducedMotion() ?? false;

  const stats = [
    { value: instruments, label: fr ? "Instruments suivis" : "Instruments tracked" },
    { value: types, label: fr ? "Types d'autorité" : "Authority types" },
    { value: regions, label: fr ? "Régions" : "Regions" },
  ];

  return (
    <div className="space-y-14">
      {/* ── Animated counters ── */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 + i * 0.12 }}
            className="flex flex-col gap-1.5 bg-[#0b0b0b] px-6 py-6 md:px-8"
          >
            <span className="font-display text-3xl font-medium tracking-[-0.04em] text-white md:text-4xl">
              <Counter value={stat.value} reduce={reduce} />
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500 md:text-[10px]">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── The spectrum ── */}
      <div className="px-1">
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-8 text-center font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-500"
        >
          {fr ? "Le spectre d'autorité" : "The authority spectrum"}
        </motion.p>

        <div className="relative">
          {/* The line — sweeps in from the left */}
          <motion.div
            aria-hidden
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.3, ease, delay: 0.35 }}
            style={{ transformOrigin: "left" }}
            className="h-px w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.7),rgba(255,255,255,0.18)_45%,rgba(196,136,42,0.35)_65%,#c4882a)]"
          />
          {/* Traveling pulse */}
          {!reduce ? (
            <motion.span
              aria-hidden
              className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-accent-strong shadow-[0_0_12px_2px_rgba(196,136,42,0.45)]"
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: ["0%", "99%"], opacity: [0, 0.9, 0.9, 0] }}
              transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.2, delay: 1.7 }}
            />
          ) : null}
          {/* Poles */}
          <span aria-hidden className="absolute left-0 top-1/2 size-2.5 -translate-y-1/2 rounded-full border border-white/70 bg-[#0a0a0a]" />
          <span aria-hidden className="absolute right-0 top-1/2 size-2.5 -translate-y-1/2 rounded-full border border-accent-strong bg-accent/20" />
        </div>

        <div className="mt-6 flex items-start justify-between gap-6">
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.7 }}
            className="max-w-[46%]"
          >
            <p className="font-display text-lg font-medium tracking-[-0.02em] text-white md:text-xl">
              {fr ? "Droit contraignant" : "Binding law"}
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {fr ? "Obligatoire. Fixé par les législateurs." : "Mandatory. Set by legislatures."}
            </p>
          </motion.div>
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.85 }}
            className="max-w-[46%] text-right"
          >
            <p className="font-display text-lg font-medium tracking-[-0.02em] text-accent-strong md:text-xl">
              {fr ? "Standards & soft law" : "Standards & soft law"}
            </p>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {fr
                ? "Volontaire — jusqu'à adoption par une autorité."
                : "Voluntary — until an authority adopts it."}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
