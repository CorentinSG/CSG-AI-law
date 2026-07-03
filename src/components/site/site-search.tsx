'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { buildSiteSearchIndex, type SearchEntry } from "@/content/site-search-index";
import { cn } from "@/lib/utils";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Fuzzy subsequence score: higher is better, -1 = no match. */
function score(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 0;
  const idx = t.indexOf(q);
  if (idx === 0) return 1000; // prefix
  if (idx > 0) return 700 - idx; // contiguous substring
  // subsequence
  let qi = 0;
  let gaps = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
    else gaps++;
  }
  return qi === q.length ? 300 - gaps : -1;
}

const GROUP_ORDER: SearchEntry["group"][] = [
  "Page",
  "Section",
  "Country",
  "State",
  "Note",
];

export function SiteSearch() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const index = useMemo(() => buildSiteSearchIndex(), []);

  // Open on Cmd/Ctrl+K or a window event dispatched by the nav button.
  useEffect(() => {
    const reset = () => { setQuery(""); setActive(0); };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        reset();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => { reset(); setOpen(true); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("site-search:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("site-search:open", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  const results = useMemo(() => {
    const scored = index
      .map((entry) => {
        const best = Math.max(
          score(query, entry.title),
          score(query, entry.keywords ?? "") - 50,
          score(query, entry.hint ?? "") - 80,
        );
        return { entry, s: best };
      })
      .filter((r) => r.s > -1)
      .sort((a, b) => b.s - a.s)
      .slice(0, 24)
      .map((r) => r.entry);
    return scored;
  }, [index, query]);

  const safeActive = results.length > 0 ? Math.min(active, results.length - 1) : 0;

  const go = (entry: SearchEntry) => {
    setOpen(false);
    router.push(entry.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[safeActive]) {
      e.preventDefault();
      go(results[safeActive]);
    }
  };

  // Group results in a stable order while preserving relevance within a group.
  const grouped = useMemo(() => {
    const map = new Map<SearchEntry["group"], SearchEntry[]>();
    for (const r of results) {
      const arr = map.get(r.group) ?? [];
      arr.push(r);
      map.set(r.group, arr);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      group: g,
      items: map.get(g)!,
    }));
  }, [results]);

  // flat index → for keyboard highlight mapping
  let runningIndex = -1;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-zinc-900/30 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Site search"
            initial={reduce ? false : { opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.28, ease }}
            className="relative w-full max-w-xl overflow-hidden rounded-[1.6rem] border border-white/10 bg-[rgba(14,14,16,0.94)] shadow-[0_40px_120px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 border-b border-black/6 px-4 py-3.5">
              <Search className="size-4 shrink-0 text-accent-strong" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search the site — countries, states, sections, notes…"
                className="w-full bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-black/5 hover:text-zinc-700"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto py-2">
              {results.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-zinc-500">
                  {query ? `No matches for “${query}”.` : "Type to search across the site."}
                </p>
              ) : (
                grouped.map(({ group, items }) => (
                  <div key={group} className="px-2 pb-1">
                    <p className="px-2 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400">
                      {group}
                    </p>
                    {items.map((entry) => {
                      runningIndex += 1;
                      const isActive = runningIndex === safeActive;
                      const myIndex = runningIndex;
                      return (
                        <button
                          key={`${entry.group}-${entry.href}`}
                          type="button"
                          onMouseEnter={() => setActive(myIndex)}
                          onClick={() => go(entry)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                            isActive ? "bg-accent-soft" : "hover:bg-black/[0.04]",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-zinc-900">
                              {entry.title}
                            </span>
                            {entry.hint ? (
                              <span className="block truncate text-[12px] text-zinc-500">
                                {entry.hint}
                              </span>
                            ) : null}
                          </span>
                          <ArrowRight
                            className={cn(
                              "size-4 shrink-0 transition",
                              isActive ? "text-accent-strong" : "text-zinc-300",
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-black/6 px-4 py-2.5 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="size-3" /> to open
              </span>
              <span className="font-mono uppercase tracking-[0.18em]">⌘K / Ctrl K</span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
