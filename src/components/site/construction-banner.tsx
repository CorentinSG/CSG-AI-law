'use client';

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Construction, X } from "lucide-react";

import { getLocaleFromPathname } from "@/lib/i18n/href";

const COPY = {
  en: {
    label: "Work in progress",
    text: "This site is being fine-tuned and its legal database is still being built — it is not yet ready for use.",
    dismiss: "Dismiss",
  },
  fr: {
    label: "En construction",
    text: "Le site est en cours d'ajustement et sa base de données est encore en construction — il n'est pas encore utilisable.",
    dismiss: "Fermer",
  },
} as const;

const STORAGE_KEY = "csg-construction-banner-dismissed";

// Tiny external store over sessionStorage so the banner reads dismissal state
// without setState-in-effect and stays hidden during SSR (server snapshot = dismissed).
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function isDismissed() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function ConstructionBanner() {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = COPY[locale] ?? COPY.en;

  const visible = !useSyncExternalStore(subscribe, isDismissed, () => true);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage unavailable — banner simply reappears next load.
    }
    listeners.forEach((listener) => listener());
  }

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          role="status"
          initial={reduced ? false : { height: 0, opacity: 0 }}
          animate={reduced ? undefined : { height: "auto", opacity: 1 }}
          exit={reduced ? undefined : { height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-[60] overflow-hidden border-b border-accent-strong/25 bg-[linear-gradient(90deg,_rgba(196,136,42,0.14),_rgba(196,136,42,0.05))]"
        >
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-2.5">
            <Construction
              className="size-4 shrink-0 text-accent-strong"
              aria-hidden
            />
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs leading-5 text-zinc-300">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent-strong">
                {copy.label}
              </span>
              <span className="text-zinc-400">{copy.text}</span>
            </p>
            <button
              type="button"
              onClick={dismiss}
              aria-label={copy.dismiss}
              className="ml-auto grid size-6 shrink-0 place-items-center rounded-md text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
