'use client';

import { Card } from "@/components/ui/card";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";

export function HomeHeroVisual() {
  return (
    <Card className="relative min-h-[440px] overflow-hidden rounded-[2rem] border-white/10 bg-[#050608] shadow-none">
      <Spotlight className="-top-36 left-0 md:left-24 md:-top-20" fill="white" />
      <div className="relative z-10 flex h-full min-h-[440px] flex-col justify-between p-6 md:p-8">
        <div className="max-w-md space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">
            Research platform
          </p>
          <h2 className="font-serif text-3xl text-white md:text-4xl">
            AI Law &amp; Legal Intelligence
          </h2>
          <p className="text-sm leading-6 text-zinc-300">
            Legal research, regulatory monitoring, and editorial analysis
            structured around official sources, governance frameworks, and
            comparative legal developments.
          </p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[36%] md:left-[36%] md:top-0">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full opacity-90"
          />
        </div>

        <div className="relative z-10 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Comparative AI law
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Human-reviewed monitoring
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            Soft law and standards
          </span>
        </div>
      </div>
    </Card>
  );
}
