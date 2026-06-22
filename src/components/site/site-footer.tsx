'use client';

import Link from "next/link";
import { motion } from "framer-motion";

const footerNav = [
  { href: "/", label: "Home" },
  { href: "/research", label: "Notes" },
  { href: "/ai-regulation", label: "AI Law Hub" },
  { href: "/standards", label: "Standards" },
  { href: "/contact", label: "Contact" },
];

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function SiteFooter() {
  return (
    <footer className="relative mt-8">
      {/* Accent rule divider */}
      <div className="accent-rule mx-6" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease }}
        className="border-t border-black/5 bg-[#f4f4f1]"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            <p className="font-display text-xl font-medium uppercase tracking-[-0.05em] text-zinc-950">
              C. Saint-Girons, Esq
            </p>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              AI Law &amp; Legal Intelligence
            </p>
            <p className="max-w-sm text-sm leading-7 text-zinc-600">
              Attorney-led AI law research, regulatory monitoring, and legal intelligence.
            </p>
            <p className="max-w-sm text-xs leading-6 text-zinc-400">
              For informational purposes only — not legal advice.
            </p>
          </div>

          <div className="grid content-start gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <p className="col-span-full font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-400 sm:col-span-2 lg:col-span-1 xl:col-span-2">
              Navigation
            </p>
            {footerNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600 transition-colors duration-200 hover:text-zinc-950"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 border-t border-black/5 px-6 py-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
            © {new Date().getFullYear()} C. Saint-Girons
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-300 transition-colors duration-200 hover:text-zinc-600"
            >
              Admin
            </Link>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              New York
            </p>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
