"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  getEuropeMapTone,
  type EuropeCountryStatus,
} from "@/content/ai-regulation/europe-map";
import { europeImplementationStatusTaxonomy } from "@/content/ai-regulation/europe-country-profiles";
import { cn, formatDisplayDate } from "@/lib/utils";

function statusClasses(tone: ReturnType<typeof getEuropeMapTone>) {
  switch (tone) {
    case "success":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-100";
    case "info":
      return "border-sky-400/40 bg-sky-500/15 text-sky-100";
    case "warning":
      return "border-amber-400/40 bg-amber-500/15 text-amber-100";
    default:
      return "border-white/15 bg-white/10 text-zinc-200";
  }
}

export function EuropeImplementationMap({
  countries,
}: {
  countries: EuropeCountryStatus[];
}) {
  const [activeCode, setActiveCode] = useState<string>(countries[0]?.code ?? "");
  const activeCountry = useMemo(
    () => countries.find((country) => country.code === activeCode) ?? countries[0],
    [activeCode, countries],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.18),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute left-[8%] top-[18%] h-24 w-24 rounded-full border border-white/10" />
          <div className="absolute right-[14%] top-[24%] h-32 w-32 rounded-full border border-sky-200/10" />
          <div className="absolute bottom-[18%] left-[32%] h-40 w-40 rounded-full border border-white/10" />
        </div>
        <div className="relative aspect-[1.15/1] min-h-[420px]">
          {countries.map((country) => (
            <motion.button
              key={country.code}
              type="button"
              onMouseEnter={() => setActiveCode(country.code)}
              onFocus={() => setActiveCode(country.code)}
              onClick={() => setActiveCode(country.code)}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-md transition",
                statusClasses(getEuropeMapTone(country.status)),
                activeCode === country.code ? "scale-110" : "hover:scale-105",
              )}
              style={{ left: `${country.x}%`, top: `${country.y}%` }}
              aria-label={`${country.name}: ${europeImplementationStatusTaxonomy[country.status].label}`}
            >
              {country.code}
            </motion.button>
          ))}
        </div>
      </div>

      {activeCountry ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-display text-2xl font-medium uppercase tracking-[-0.04em] text-white">
              {activeCountry.name}
            </p>
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.24em]",
                statusClasses(getEuropeMapTone(activeCountry.status)),
              )}
            >
              {europeImplementationStatusTaxonomy[activeCountry.status].label}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
              confidence {activeCountry.confidence}
            </span>
            {activeCountry.lastReviewedDate ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300">
                reviewed {formatDisplayDate(activeCountry.lastReviewedDate)}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-7 text-zinc-300">{activeCountry.note}</p>
          <p className="mt-2 text-sm text-zinc-400">
            {europeImplementationStatusTaxonomy[activeCountry.status].shortExplanation}
          </p>
          {activeCountry.officialSourceUrl ? (
            <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
                Verified official source
              </p>
              <a
                href={activeCountry.officialSourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block text-sm text-zinc-100 underline decoration-white/15 underline-offset-4"
              >
                {activeCountry.officialSourceLabel ?? activeCountry.officialSourceUrl}
              </a>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-zinc-500">
                Verification posture
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                No official national implementation source is verified in the system yet.
                The country remains visible here to avoid implying silent compliance or a
                completed national designation that has not yet been confirmed.
              </p>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <span>{activeCountry.sourceCount} verified source references</span>
            {activeCountry.href ? (
              <Link
                href={activeCountry.href}
                className="underline decoration-white/15 underline-offset-4"
              >
                Open country profile
              </Link>
            ) : (
              <span className="text-zinc-500">Country profile not yet published</span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
