import { Gavel, Landmark, ShieldCheck } from "lucide-react";

import { MotionReveal } from "@/components/site/motion-reveal";

const TIERS = [
  {
    icon: Gavel,
    label: "Binding law",
    gloss: "Creates legal obligations directly.",
  },
  {
    icon: Landmark,
    label: "Guidance & governance",
    gloss: "Explains or supports the law; not binding by itself.",
  },
  {
    icon: ShieldCheck,
    label: "Soft law & standards",
    gloss: "Influential, but not binding unless incorporated.",
  },
];

/**
 * "How to read this hub" — a compact orientation strip that teaches the status
 * taxonomy up front, so a reader instantly understands what each layer means
 * before scrolling the dense content. Color is always paired with a label.
 */
export function HubOrientation({ note }: { note?: string }) {
  return (
    <MotionReveal>
      <div className="rounded-[1.6rem] border border-black/6 bg-white/70 p-4 backdrop-blur-sm md:p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-strong">
          How to read this hub
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.label}
              className="group flex items-start gap-3 rounded-[1.1rem] border border-black/5 bg-white/80 px-3.5 py-3 transition hover:border-accent/30"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong transition group-hover:scale-105">
                <tier.icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-medium text-zinc-900">{tier.label}</span>
                <span className="mt-0.5 block text-[12px] leading-5 text-zinc-600">{tier.gloss}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-[12px] leading-5 text-zinc-500">
          <span className="inline-flex size-1.5 shrink-0 rounded-full bg-emerald-500" />
          {note ?? "Nothing is shown publicly unless it is backed by a verified official source."}
        </p>
      </div>
    </MotionReveal>
  );
}
