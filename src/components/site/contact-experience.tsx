'use client';

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  Globe2,
  Mic,
  Scale,
} from "lucide-react";
import { motion, useReducedMotion, useSpring } from "framer-motion";

import { SpotlightHover } from "@/components/ui/spotlight-hover";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const INQUIRY_TYPES = [
  {
    icon: Scale,
    index: "01",
    title: "Research collaborations",
    desc: "Comparative AI law, regulatory monitoring, and legal intelligence systems.",
  },
  {
    icon: FileText,
    index: "02",
    title: "Writing & commentary",
    desc: "Editorial contributions, legal analysis, and co-authored notes.",
  },
  {
    icon: Mic,
    index: "03",
    title: "Speaking & teaching",
    desc: "Panels, seminars, and guest lectures on AI regulation and legal technology.",
  },
];

/* ── Hero title — word-by-word reveal ─────────────────────────── */

function StaggeredTitle({ text }: { text: string }) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  return (
    <h1 className="max-w-4xl font-display text-5xl font-medium tracking-[-0.05em] text-zinc-950 md:text-7xl">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: "110%", opacity: 0 }}
            animate={reduced ? undefined : { y: 0, opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.08 * i, ease }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

/* ── Live Paris clock — rendered after mount to avoid hydration drift ── */

function ParisClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Europe/Paris",
      }).format(new Date());
    const first = setTimeout(() => setTime(format()), 0);
    const id = setInterval(() => setTime(format()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 tabular-nums">
      <Globe2 className="size-3 text-accent-strong" aria-hidden />
      Paris {time ?? "--:--:--"}
    </span>
  );
}

/* ── Copy-email button — copies the address without displaying it ─── */

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — the primary
      // "Write to me" mailto action remains as the fallback.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Email address copied to clipboard" : "Copy email address to clipboard"}
      className="group inline-flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-medium text-zinc-700 transition hover:border-white/20 hover:text-zinc-900 active:scale-[0.98]"
    >
      <motion.span
        key={copied ? "check" : "copy"}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease }}
        className="inline-flex"
      >
        {copied ? (
          <Check className="size-4 text-emerald-400" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
      </motion.span>
      {copied ? "Address copied" : "Copy address"}
    </button>
  );
}

/* ── Magnetic CTA — drifts a few px toward the cursor ─────────── */

function MagneticCta({ email }: { email: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 18 });
  const y = useSpring(0, { stiffness: 220, damping: 18 });

  const onMove = (event: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * 0.18);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.28);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={`mailto:${email}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y }}
      className="premium-sheen group inline-flex items-center gap-2.5 rounded-xl bg-accent-strong px-7 py-3.5 text-sm font-semibold text-[#0a0a0a] shadow-[0_8px_30px_rgba(196,136,42,0.25)] transition hover:bg-[#d69a3f] active:scale-[0.98]"
    >
      Write to me
      <ArrowUpRight
        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden
      />
    </motion.a>
  );
}

/* ── Portrait — frameless, dissolves into the page background ──── */

function PortraitFigure() {
  const reduced = useReducedMotion();

  return (
    <div className="group relative flex min-h-[26rem] items-end justify-center lg:min-h-full">
      {/* Ambient light living in the page — no card. A warm gold spotlight
          behind the head, plus a cool base wash, so the figure reads as lit
          by the environment rather than pasted onto a panel. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(42%_38%_at_50%_24%,rgba(196,136,42,0.20),transparent_70%)]"
        animate={reduced ? undefined : { opacity: [0.75, 1, 0.75], scale: [1, 1.04, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(70%_80%_at_50%_110%,rgba(30,41,59,0.4),transparent_72%)]"
      />

      {/* The subject. object-contain keeps the whole figure; the mask fades
          the lower body straight into the background so there is no edge. */}
      <motion.div
        className="relative aspect-[3/4] w-full max-w-[26rem]"
        animate={reduced ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/images/profile/corentin-saint-girons-cutout.png"
          alt="Portrait of Corentin Saint-Girons"
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          priority
          style={{
            maskImage:
              "linear-gradient(to bottom, black 62%, transparent 90%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 62%, transparent 90%)",
          }}
          className="object-contain object-bottom brightness-[0.98] contrast-[1.03] grayscale-[0.12] drop-shadow-[0_35px_60px_rgba(0,0,0,0.55)] transition-[filter,transform] duration-700 group-hover:brightness-100 group-hover:grayscale-0 group-hover:scale-[1.015]"
        />
      </motion.div>

      {/* Floating identity — sits over the dissolve, no chip behind the name. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-xl font-medium tracking-[-0.02em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
            C. Saint-Girons, Esq
          </p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/60">
            AI Law &amp; Legal Intelligence
          </p>
        </div>
        <span className="mb-0.5 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/30 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-white/70 backdrop-blur-sm">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          Open to inquiries
        </span>
      </div>
    </div>
  );
}

/* ── Ambient background — slow gold orbs + faint grid ─────────── */

function AmbientBackdrop() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
      <motion.div
        className="absolute -top-32 right-[-10%] size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(196,136,42,0.10),transparent_65%)] blur-2xl"
        animate={reduced ? undefined : { y: [0, 26, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[38rem] left-[-12%] size-[28rem] rounded-full bg-[radial-gradient(circle,rgba(30,41,59,0.35),transparent_65%)] blur-2xl"
        animate={reduced ? undefined : { y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ── Page experience ──────────────────────────────────────────── */

export function ContactExperience({ email }: { email: string }) {
  const reduced = useReducedMotion();

  const fadeUp = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 18 },
    animate: reduced ? undefined : { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease },
  });

  return (
    <div className="relative space-y-16 md:space-y-20">
      <AmbientBackdrop />

      {/* ── Hero ── */}
      <section className="space-y-6 pt-2 md:pt-6">
        <motion.p
          {...fadeUp(0)}
          className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.35em] text-accent-strong"
        >
          <span className="accent-rule w-10" aria-hidden />
          Contact
        </motion.p>
        <StaggeredTitle text="Start a conversation" />
        <motion.p {...fadeUp(0.35)} className="max-w-2xl text-lg leading-8 text-zinc-600">
          For professional inquiries at the intersection of artificial
          intelligence, law, and legal intelligence — research, writing,
          speaking, and collaborations.
        </motion.p>
      </section>

      {/* ── Channel + portrait ── */}
      <motion.section
        {...fadeUp(0.45)}
        className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch"
      >
        {/* Direct channel console */}
        <div className="glass-panel noise-overlay relative flex flex-col justify-between gap-10 overflow-hidden rounded-[2rem] p-8 md:p-10">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 size-64 rounded-full bg-[radial-gradient(circle,rgba(196,136,42,0.12),transparent_70%)] blur-xl"
          />
          <div className="space-y-4">
            <p className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-strong/60" />
                <span className="relative inline-flex size-2 rounded-full bg-accent-strong" />
              </span>
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

          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
              A good first email
            </p>
            <ul className="space-y-2.5 border-l border-white/8 pl-5">
              {["Who you are", "The context", "What you have in mind"].map((line) => (
                <li key={line} className="flex items-center gap-3 text-sm text-zinc-600">
                  <span
                    aria-hidden
                    className="size-1.5 rotate-45 bg-accent-strong/70"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <MagneticCta email={email} />
              <CopyEmailButton email={email} />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Replies within a few days · EN / FR
              </span>
              <ParisClock />
            </div>
          </div>
        </div>

        <PortraitFigure />
      </motion.section>

      {/* ── What this covers ── */}
      <section className="space-y-8">
        <motion.div {...fadeUp(0.1)} className="flex items-center gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-accent-strong">
            What this covers
          </p>
          <span className="accent-rule flex-1" aria-hidden />
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-3">
          {INQUIRY_TYPES.map((item, i) => (
            <motion.div
              key={item.title}
              initial={reduced ? false : { opacity: 0, y: 22 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2 + i * 0.12, ease }}
            >
              <div className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02] p-7 transition-colors duration-300 hover:border-accent-strong/30">
                <SpotlightHover
                  size={260}
                  className="from-[#c4882a]/20 via-[#c4882a]/8 to-transparent"
                />
                <div className="flex items-start justify-between">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-accent-strong transition-transform duration-300 group-hover:-translate-y-0.5">
                    <item.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-300">
                    {item.index}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-medium text-zinc-950">{item.title}</p>
                  <p className="text-sm leading-6 text-zinc-600">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <motion.p
        {...fadeUp(0.15)}
        className="border-t border-white/8 pt-8 text-xs leading-6 text-zinc-500"
      >
        Contacting this address does not create an attorney–client
        relationship. Content on this site is provided for research and
        informational purposes only and does not constitute legal advice.
      </motion.p>
    </div>
  );
}
