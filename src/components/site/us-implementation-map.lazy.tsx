"use client";

import dynamic from "next/dynamic";

// T-OPS7 perf: the state map is an interactive client widget below the fold.
// The page's substantive content (federal baseline, priority-state profiles,
// case law, soft law) is server-rendered separately, so we defer the map's
// hydration with ssr:false and a same-height skeleton (no layout shift) to keep
// its JS off the initial route load.
const UsImplementationMap = dynamic(
  () =>
    import("@/components/site/us-implementation-map").then(
      (mod) => mod.UsImplementationMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]" aria-hidden>
        <div className="min-h-[420px] animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.05]" />
        <div className="min-h-[420px] animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
      </div>
    ),
  },
);

export { UsImplementationMap };
