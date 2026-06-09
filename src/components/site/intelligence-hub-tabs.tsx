'use client';

import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export function IntelligenceHubTabs({
  tabs,
  activeValue,
  className,
}: {
  tabs: Array<{ label: string; value: string; href: string; note?: string }>;
  activeValue: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-panel-soft flex flex-col gap-3 rounded-[1.9rem] border border-black/6 p-3 shadow-[0_18px_50px_rgba(15,15,15,0.04)]",
        className,
      )}
    >
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.value === activeValue;

          return (
            <Link
              key={tab.value}
              href={tab.href}
              scroll={false}
              className={cn(
                "relative inline-flex min-w-[10rem] flex-1 items-center justify-center overflow-hidden rounded-full px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                active ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="intelligence-hub-pill"
                  className="absolute inset-0 rounded-full border border-black/8 bg-white shadow-[0_10px_30px_rgba(15,15,15,0.08)]"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
              ) : null}
              <span className="relative z-10">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {tabs.find((tab) => tab.value === activeValue)?.note ? (
        <p className="px-2 text-sm leading-6 text-zinc-600">
          {tabs.find((tab) => tab.value === activeValue)?.note}
        </p>
      ) : null}
    </div>
  );
}
