'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { JarvisOrb } from "@/components/site/jarvis-orb";
import { ScrollTextReveal } from "@/components/site/scroll-text-reveal";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function HeroIntro() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
      }}
      className="space-y-7"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 16 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.42em] text-zinc-500">
          New York attorney
        </p>
        <span className="h-px w-10 bg-black/10" />
        <p className="font-mono text-[11px] uppercase tracking-[0.36em] text-zinc-400">
          AI law
        </p>
      </motion.div>

      <div className="space-y-4">
        <ScrollTextReveal
          as="h1"
          text="AI law. Legal intelligence."
          mode="words"
          stagger={0.08}
          duration={1}
          className="font-display max-w-[17rem] text-balance text-[3rem] font-medium uppercase leading-[0.88] tracking-[-0.06em] text-zinc-950 sm:max-w-4xl sm:text-[3.7rem] md:text-[5.8rem] xl:text-[7rem]"
        />
      </div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 16 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.82, ease } },
        }}
      >
        <JarvisOrb />
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 16 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.75, ease } },
        }}
        className="flex flex-wrap gap-3"
      >
        <Link
          href="/research"
          scroll={false}
          className="group inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-white shadow-[0_12px_30px_rgba(17,17,17,0.12)] transition-shadow duration-300 hover:shadow-[0_16px_40px_rgba(17,17,17,0.22)]"
        >
          Notes
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/ai-regulation"
          scroll={false}
          className="glass-panel-soft rounded-full px-6 py-3 text-sm uppercase tracking-[0.18em] text-zinc-800"
        >
          AI law hub
        </Link>
      </motion.div>
    </motion.div>
  );
}
