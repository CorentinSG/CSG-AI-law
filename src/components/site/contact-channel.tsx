'use client';

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Copy, Mail } from "lucide-react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Assembled at runtime so the plain address never sits in the static markup —
// keeps it out of naive scrapers and hidden until the visitor acts.
const USER = "corentin.stigrons";
const DOMAIN = "gmail.com";
const address = `${USER}@${DOMAIN}`;

export function ContactChannel() {
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setRevealed(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked (permissions / insecure context) — at least reveal it.
      setRevealed(true);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10">
      {/* Animated accent glow */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-[radial-gradient(circle,_rgba(196,136,42,0.18),_transparent_70%)] blur-2xl"
          animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.12, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative space-y-6">
        <div className="space-y-3">
          <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            <Mail className="size-3.5 text-accent-strong" aria-hidden />
            Direct channel
          </p>
          <p className="font-display text-2xl font-medium tracking-[-0.03em] text-zinc-950 md:text-3xl">
            One inbox, read personally.
          </p>
          <p className="max-w-md text-sm leading-7 text-zinc-600">
            Write in English or French. Include who you are, the context, and
            what you have in mind — a focused paragraph beats a long brief.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <motion.a
            href={`mailto:${address}`}
            whileHover={reduced ? undefined : { y: -2 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.25, ease }}
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Write an email
            <ArrowUpRight
              className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </motion.a>

          <motion.button
            type="button"
            onClick={copy}
            whileHover={reduced ? undefined : { y: -2 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.25, ease }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white/5"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2 text-accent-strong"
                >
                  <Check className="size-4" aria-hidden />
                  Copied to clipboard
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2"
                >
                  <Copy className="size-4" aria-hidden />
                  {revealed ? "Copy again" : "Reveal & copy address"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Address stays hidden until the visitor asks for it */}
        <div className="min-h-[1.25rem]">
          <AnimatePresence>
            {revealed && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease }}
                className="select-all font-mono text-xs tracking-wide text-zinc-500"
              >
                {address}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
