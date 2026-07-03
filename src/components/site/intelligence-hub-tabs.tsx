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
  const activeNote = tabs.find((tab) => tab.value === activeValue)?.note;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="no-scrollbar inline-flex w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1 sm:w-auto">
        {tabs.map((tab) => {
          const active = tab.value === activeValue;

          return (
            <Link
              key={tab.value}
              href={tab.href}
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
                active ? "text-white" : "text-white/45 hover:text-white/80",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="intelligence-hub-pill"
                  className="absolute inset-0 rounded-full bg-white/[0.12]"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
              ) : null}
              <span className="relative z-10">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {activeNote ? (
        <p className="text-sm leading-6 text-white/55">{activeNote}</p>
      ) : null}
    </div>
  );
}
