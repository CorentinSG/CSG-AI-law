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

/** Where each binding status sits between the two poles (percent from the left). */
const BINDING_POSITION: Record<string, number> = {
  binding: 6,
  binding_if_incorporated: 30,
  needs_review: 55,
  non_binding: 82,
};

const BINDING_DOT: Record<string, string> = {
  binding: "bg-white",
  binding_if_incorporated: "bg-white/85",
  needs_review: "bg-zinc-400",
  non_binding: "bg-accent-strong shadow-[0_0_8px_1px_rgba(196,136,42,0.35)]",
};

/** Mirrors the explorer's binding labels — hover/active caption + aria. */
const BINDING_SR_LABEL: Record<string, { en: string; fr: string }> = {
  binding: { en: "Binding", fr: "Contraignant" },
  binding_if_incorporated: { en: "Binding if incorporated", fr: "Contraignant si incorporé" },
  needs_review: { en: "Variable effect", fr: "Portée variable" },
  non_binding: { en: "Non-binding", fr: "Non contraignant" },
};

/**
 * The Standards page hero instrument: three animated counters and the
 * authority spectrum — a single animated line from binding law (white pole)
 * to standards & soft law (gold pole). Every tracked instrument sits on the
 * line as a bead, stacked by binding status; each stack is a live filter for
 * the explorer below (via the "standards:set-binding" event).
 */
export function AuthoritySpectrum({
  lang,
  instruments,
  types,
  regions,
  bindings,
}: {
  lang: Locale;
  instruments: number;
  types: number;
  regions: number;
  bindings: string[];
}) {
  const fr = lang === "fr";
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState("");

  // Stay in sync when the explorer's binding filter changes on its own.
  useEffect(() => {
    const onState = (e: Event) => setActive((e as CustomEvent<string>).detail ?? "");
    window.addEventListener("standards:binding-state", onState);
    return () => window.removeEventListener("standards:binding-state", onState);
  }, []);

  const clusters = Object.entries(
    bindings.reduce<Record<string, number>>((acc, b) => {
      acc[b] = (acc[b] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([key, count]) => ({ key, count, pos: BINDING_POSITION[key] ?? 70 }))
    .sort((a, b) => a.pos - b.pos);

  const select = (key: string) => {
    const next = active === key ? "" : key;
    setActive(next);
    window.dispatchEvent(new CustomEvent("standards:set-binding", { detail: next }));
    if (next) {
      document
        .getElementById("standards-explorer")
        ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  };

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
          className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-500"
        >
          {fr ? "Le spectre d'autorité" : "The authority spectrum"}
        </motion.p>

        {/* Bead stacks — one bead per tracked instrument, placed by binding status */}
        <div className="relative h-32">
          {clusters.map((cluster) => {
            const isActive = active === cluster.key;
            const dimmed = active !== "" && !isActive;
            const label = BINDING_SR_LABEL[cluster.key];
            const labelText = label ? (fr ? label.fr : label.en) : cluster.key;
            return (
              <button
                key={cluster.key}
                type="button"
                onClick={() => select(cluster.key)}
                aria-pressed={isActive}
                aria-label={`${cluster.count} — ${labelText}`}
                style={{ left: `${cluster.pos}%` }}
                className={[
                  "group absolute bottom-0 flex -translate-x-1/2 cursor-pointer flex-col items-center justify-end gap-[3px] rounded-t-full px-3 pt-1 transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
                  dimmed ? "opacity-35" : "opacity-100",
                ].join(" ")}
              >
                <motion.span
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: reduce ? 0 : 1.1 }}
                  className={[
                    "relative mb-1 font-mono text-[10px] tabular-nums transition-colors duration-300",
                    isActive ? "text-accent-strong" : "text-zinc-500 group-hover:text-zinc-200",
                  ].join(" ")}
                >
                  {cluster.count}
                  {/* Status caption — revealed on hover/focus, pinned while active */}
                  <span
                    aria-hidden
                    className={[
                      "pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.18em] transition-all duration-300",
                      isActive
                        ? "translate-y-0 text-accent-strong opacity-100"
                        : "translate-y-1 text-zinc-300 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
                    ].join(" ")}
                  >
                    {labelText}
                  </span>
                </motion.span>
                {Array.from({ length: cluster.count }).map((_, j) => (
                  <motion.span
                    key={j}
                    aria-hidden
                    initial={reduce ? false : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      ease,
                      delay: reduce ? 0 : 0.55 + (cluster.count - j) * 0.05,
                    }}
                    className={[
                      "size-2 rounded-full transition-transform duration-300 group-hover:scale-125",
                      BINDING_DOT[cluster.key] ?? "bg-zinc-400",
                      isActive ? "scale-110" : "",
                    ].join(" ")}
                  />
                ))}
              </button>
            );
          })}
        </div>

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
          {/* Anchor ticks — ground each bead stack on the line */}
          {clusters.map((cluster) => (
            <span
              key={cluster.key}
              aria-hidden
              style={{ left: `${cluster.pos}%` }}
              className={[
                "absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 transition-colors duration-300",
                active === cluster.key ? "bg-accent-strong" : "bg-white/25",
              ].join(" ")}
            />
          ))}
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
