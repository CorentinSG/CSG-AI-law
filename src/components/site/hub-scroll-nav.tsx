'use client';

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export type HubNavSection = { id: string; label: string };

/**
 * Sticky in-page scroll-spy nav for the dense regulation hubs.
 * Tells the reader where they are and lets them jump anywhere — the single
 * biggest legibility win on a long, section-heavy page. Active section is
 * tracked with IntersectionObserver; clicks smooth-scroll (sections carry
 * scroll-margin so they land below the sticky bars).
 */
export function HubScrollNav({ sections }: { sections: HubNavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const reduce = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    // Pick the section whose top is closest to just under the sticky bars.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  // Keep the active pill scrolled into view in the horizontal rail.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !active) return;
    const btn = rail.querySelector<HTMLElement>(`[data-id="${active}"]`);
    btn?.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
  }, [active, reduce]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="sticky top-[60px] z-30 -mx-6 px-6 py-2 md:top-[68px]">
      <div
        ref={railRef}
        className="glass-panel-soft no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full px-2 py-1.5"
      >
        {sections.map((s) => {
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              data-id={s.id}
              onClick={() => handleClick(s.id)}
              className={cn(
                "relative shrink-0 rounded-full px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                isActive ? "text-accent-strong" : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="hub-nav-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-accent-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
