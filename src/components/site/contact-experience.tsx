"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Copy, FileText, Mic, Scale } from "lucide-react";

import type { Locale } from "@/lib/i18n/config";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const INQUIRIES = [
  {
    icon: Scale,
    title: { en: "Research collaborations", fr: "Collaborations de recherche" },
    desc: {
      en: "Comparative AI law, regulatory monitoring, and legal intelligence systems.",
      fr: "Droit comparé de l'IA, veille réglementaire et systèmes d'intelligence juridique.",
    },
  },
  {
    icon: FileText,
    title: { en: "Writing & commentary", fr: "Écriture & commentaire" },
    desc: {
      en: "Editorial contributions, legal analysis, and co-authored notes.",
      fr: "Contributions éditoriales, analyses juridiques et notes co-écrites.",
    },
  },
  {
    icon: Mic,
    title: { en: "Speaking & teaching", fr: "Interventions & enseignement" },
    desc: {
      en: "Panels, seminars, and guest lectures on AI regulation and legal technology.",
      fr: "Panels, séminaires et conférences sur la régulation de l'IA et la legal tech.",
    },
  },
];

export function ContactExperience({ lang, email }: { lang: Locale; email: string }) {
  const fr = lang === "fr";
  const reduce = useReducedMotion() ?? false;
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the mailto action remains.
    }
  };

  const title = fr ? "Une conversation directe." : "Start a conversation.";
  const words = title.split(" ");

  return (
    <div className="space-y-16">
      {/* ── Hero: word-masked headline + quiet portrait ── */}
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-strong"
          >
            Contact
          </motion.p>
          <h1 className="max-w-xl font-display text-5xl font-medium leading-[0.97] tracking-[-0.04em] text-white md:text-6xl xl:text-7xl">
            {words.map((word, i) => (
              <span key={i} className="mr-[0.28em] inline-block overflow-hidden pb-[0.08em] align-top">
                <motion.span
                  className="inline-block"
                  initial={reduce ? false : { y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.75, ease, delay: 0.12 + i * 0.08 }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.45 }}
            className="max-w-md text-base leading-7 text-white/60"
          >
            {fr
              ? "Recherche, écriture, interventions — à l'intersection de l'intelligence artificielle et du droit."
              : "Research, writing, speaking — at the intersection of artificial intelligence and the law."}
          </motion.p>
        </div>

        <motion.div
          initial={reduce ? false : { clipPath: "inset(100% 0 0 0)" }}
          animate={{ clipPath: "inset(0% 0 0 0)" }}
          transition={{ duration: 1, ease, delay: 0.3 }}
          className="group relative aspect-[4/5] max-h-[430px] w-full justify-self-end overflow-hidden rounded-[2rem] border border-white/10 lg:max-w-sm"
        >
          <Image
            src="/images/profile/corentin-saint-girons-hero-v2.png"
            alt={fr ? "Portrait de Corentin Saint-Girons" : "Portrait of Corentin Saint-Girons"}
            fill
            sizes="(max-width: 1024px) 100vw, 24rem"
            className="object-cover object-top grayscale transition-[filter] duration-700 group-hover:grayscale-0"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-6 pt-14">
            <p className="font-display text-lg font-medium tracking-[-0.02em] text-white">
              C. Saint-Girons, Esq
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
              AI Law &amp; Legal Intelligence
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── The channel: one address, copy on click ── */}
      <section className="relative border-t border-white/8 pt-12">
        {!reduce ? (
          <motion.span
            aria-hidden
            className="absolute top-0 size-1 -translate-y-1/2 rounded-full bg-accent-strong shadow-[0_0_10px_2px_rgba(196,136,42,0.4)]"
            initial={{ left: "0%", opacity: 0 }}
            animate={{ left: ["0%", "100%"], opacity: [0, 0.8, 0.8, 0] }}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatDelay: 3, delay: 1.6 }}
          />
        ) : null}

        <a
          href={`mailto:${email}`}
          className="group block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a0a]"
        >
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.55 }}
            className="flex items-baseline gap-4 font-display text-4xl font-medium tracking-[-0.03em] text-white/90 transition-colors duration-300 group-hover:text-white md:text-5xl"
          >
            {fr ? "Écrivez-moi." : "Write to me."}
            <ArrowUpRight
              aria-hidden
              className="size-7 shrink-0 self-center text-white/30 transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:translate-x-1.5 group-hover:text-accent-strong md:size-8"
            />
          </motion.span>
          <motion.span
            aria-hidden
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.1, ease, delay: 0.75 }}
            style={{ transformOrigin: "left" }}
            className="mt-5 block h-px w-full max-w-2xl bg-[linear-gradient(90deg,rgba(255,255,255,0.55),rgba(196,136,42,0.9))]"
          />
          <motion.span
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-3 block font-mono text-[10px] uppercase tracking-[0.22em] text-white/40 transition-colors duration-300 group-hover:text-white/70"
          >
            {fr ? "Ouvre votre messagerie" : "Opens your mail app"}
          </motion.span>
        </a>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.9 }}
          className="mt-8 flex flex-wrap items-center gap-4"
        >
          <button
            type="button"
            onClick={copy}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/80 transition-[transform,color,border-color] duration-200 ease-out hover:border-accent-strong/40 hover:text-white active:scale-[0.97]"
          >
            {copied ? (
              <Check className="size-4 text-accent-strong" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copied ? (fr ? "Copié" : "Copied") : fr ? "Copier l'adresse" : "Copy address"}
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 sm:ml-auto">
            EN · FR — {fr ? "réponse sous quelques jours" : "replies within a few days"}
          </span>
        </motion.div>
      </section>

      {/* ── What this covers: three quiet rows, each a prefilled mailto ── */}
      <section className="border-t border-white/8">
        <ul className="divide-y divide-white/8">
          {INQUIRIES.map((item, i) => (
            <motion.li
              key={item.title.en}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 1 + i * 0.1 }}
            >
              <a
                href={`mailto:${email}?subject=${encodeURIComponent(fr ? item.title.fr : item.title.en)}`}
                className="group flex items-center gap-5 py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a0a0a] md:py-7"
              >
                <item.icon
                  className="size-[18px] shrink-0 text-accent-strong transition-transform duration-300 group-hover:scale-110"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-medium tracking-[-0.02em] text-white/85 transition-colors duration-300 group-hover:text-white md:text-2xl">
                    {fr ? item.title.fr : item.title.en}
                  </span>
                  <span className="mt-1 block max-w-xl text-sm leading-6 text-white/45 transition-colors duration-300 group-hover:text-white/65">
                    {fr ? item.desc.fr : item.desc.en}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="size-5 shrink-0 text-white/30 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent-strong"
                />
              </a>
            </motion.li>
          ))}
        </ul>
      </section>

      {/* ── Disclaimer ── */}
      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="border-t border-white/8 pt-8 text-xs leading-6 text-white/40"
      >
        {fr
          ? "Contacter cette adresse ne crée pas de relation avocat-client. Le contenu de ce site est fourni à des fins de recherche et d'information et ne constitue pas un conseil juridique."
          : "Contacting this address does not create an attorney–client relationship. Content on this site is provided for research and informational purposes only and does not constitute legal advice."}
      </motion.p>
    </div>
  );
}
