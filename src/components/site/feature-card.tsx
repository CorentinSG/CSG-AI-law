import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  href,
  cta,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  const content = (
    <div className="glass-panel-soft premium-sheen group h-full rounded-[1.9rem] p-6 shadow-[0_16px_48px_rgba(15,15,15,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,15,15,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-accent/20 bg-accent-soft transition group-hover:border-accent/30 group-hover:bg-accent-soft">
          <Icon className="size-5 text-accent-strong" />
        </div>
        {href ? (
          <ArrowUpRight className="size-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-900" />
        ) : null}
      </div>
      <div className="mt-4 space-y-3">
        {eyebrow ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-500">{eyebrow}</p>
        ) : null}
        <h3 className="font-display text-xl font-medium uppercase tracking-[-0.04em] text-zinc-950">{title}</h3>
        <p className="text-sm leading-7 text-zinc-700">{description}</p>
        {cta ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-strong">{cta}</p>
        ) : null}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
