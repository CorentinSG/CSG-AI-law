'use client';

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

// Maps implementation status to a 0-100 progress value and visual tier.
const statusProgress: Record<string, { value: number; tier: "none" | "early" | "mid" | "advanced" | "complete" }> = {
  needs_review: { value: 5, tier: "none" },
  not_applicable: { value: 0, tier: "none" },
  eu_framework_applies: { value: 20, tier: "early" },
  consultation_or_draft_identified: { value: 40, tier: "early" },
  implementation_in_progress: { value: 60, tier: "mid" },
  national_implementation_identified: { value: 80, tier: "advanced" },
  competent_authority_designated: { value: 100, tier: "complete" },
  // US statuses
  no_specific_ai_law_verified: { value: 5, tier: "none" },
  agency_guidance_or_enforcement: { value: 35, tier: "early" },
  ai_related_privacy_or_automated_decision_rules: { value: 50, tier: "mid" },
  pending_ai_legislation: { value: 55, tier: "mid" },
  enacted_sector_specific_ai_law: { value: 80, tier: "advanced" },
  enacted_comprehensive_ai_law: { value: 100, tier: "complete" },
};

const tierColors = {
  none: "bg-zinc-200",
  early: "bg-sky-400",
  mid: "bg-blue-500",
  advanced: "bg-indigo-500",
  complete: "bg-emerald-500",
};

const confidenceOpacity = {
  high: "opacity-100",
  medium: "opacity-70",
  low: "opacity-45",
  needs_review: "opacity-30",
};

interface ImplementationProgressBarProps {
  status: string;
  confidence: string;
  label?: string;
  showLabel?: boolean;
  className?: string;
  lang?: "en" | "fr";
}

const confidenceLabelFr: Record<string, string> = {
  high: "confiance élevée",
  medium: "confiance moyenne",
  low: "confiance faible",
  needs_review: "à revoir",
};

/**
 * Visual progress bar for AI Act / AI law implementation status.
 * Derived from official-source data only — never invented.
 * Confidence level affects opacity to signal reliability.
 * Animates from 0 to target width on scroll-into-view.
 */
export function ImplementationProgressBar({
  status,
  confidence,
  label,
  showLabel = true,
  className,
  lang = "en",
}: ImplementationProgressBarProps) {
  const fr = lang === "fr";
  const confidenceText = fr
    ? confidenceLabelFr[confidence] ?? `confiance ${confidence}`
    : `${confidence} confidence`;
  const { value, tier } = statusProgress[status] ?? { value: 0, tier: "none" as const };
  const barColor = tierColors[tier];
  const opacity = confidenceOpacity[confidence as keyof typeof confidenceOpacity] ?? "opacity-60";
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel ? (
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
            {label ?? (fr ? "Mise en œuvre du règlement IA" : "AI Act implementation")}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400">
            {confidenceText}
          </p>
        </div>
      ) : null}
      <div ref={ref} className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <motion.div
          className={cn("h-full rounded-full", barColor, opacity)}
          initial={{ width: reduced ? `${value}%` : "0%" }}
          animate={{ width: inView || reduced ? `${value}%` : "0%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label ?? "Implementation"}: ${value}% (${confidenceText})`}
        />
      </div>
      {value === 0 || value === 5 ? (
        <p className="text-xs text-zinc-400">
          {fr
            ? "Statut pas encore vérifiable à partir de sources officielles."
            : "Status not yet verifiable from official sources."}
        </p>
      ) : null}
    </div>
  );
}
