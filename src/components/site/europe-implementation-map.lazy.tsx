"use client";

import dynamic from "next/dynamic";

// T-OPS7 perf: the implementation map is an interactive client widget below the
// fold. Its substantive content (country statuses, official sources) is already
// server-rendered elsewhere on the page (profile cards + status list), so we
// defer its hydration with ssr:false and a same-height skeleton (no layout
// shift) to keep its JS off the initial route load.
const EuropeImplementationMap = dynamic(
  () =>
    import("@/components/site/europe-implementation-map").then(
      (mod) => mod.EuropeImplementationMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" aria-hidden>
        <div className="min-h-[420px] animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.05]" />
        <div className="min-h-[420px] animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
      </div>
    ),
  },
);

export { EuropeImplementationMap };
