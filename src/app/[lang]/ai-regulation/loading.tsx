import { SiteShell } from "@/components/site/shell";

// Skeleton for the AI Law hub subtree (/ai-regulation and its nested europe /
// united-states / country / state / detail routes). Keeps the header + footer
// chrome via SiteShell so navigation has instant feedback on an ISR miss or the
// dynamic hub render, instead of a blank gap.
export default function Loading() {
  return (
    <SiteShell className="space-y-8">
      <span className="sr-only">Loading…</span>
      <div className="space-y-3">
        <div className="h-3 w-40 animate-pulse rounded-full bg-black/5" />
        <div className="h-9 w-72 animate-pulse rounded-2xl bg-black/5" />
        <div className="h-4 w-full max-w-2xl animate-pulse rounded-full bg-black/5" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-[1.5rem] border border-black/5 bg-black/[0.03]"
          />
        ))}
      </div>
    </SiteShell>
  );
}
