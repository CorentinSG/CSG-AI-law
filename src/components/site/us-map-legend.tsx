import {
  usMapStatusColors,
  type UsStateMapStatus,
} from "@/content/ai-regulation/us-map";
import { usStateAiLawStatusTaxonomy } from "@/content/ai-regulation/us-state-ai-law-baseline";
import { cn } from "@/lib/utils";

export function UsMapLegend({ states }: { states: UsStateMapStatus[] }) {
  const counts = new Map<string, number>();
  for (const state of states) {
    counts.set(state.status, (counts.get(state.status) ?? 0) + 1);
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Object.entries(usMapStatusColors).map(([status, color]) => (
        <div
          key={status}
          className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4"
        >
          <div className="flex items-center gap-3">
            <span className={cn("h-2.5 w-2.5 rounded-full", color.dotClassName)} />
            <p className="text-sm font-medium text-zinc-100">{color.label}</p>
          </div>
          <p className="mt-2 text-xs leading-6 text-zinc-400">
            {usStateAiLawStatusTaxonomy[status as keyof typeof usMapStatusColors].description}
          </p>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            {counts.get(status) ?? 0} states / D.C.
          </p>
        </div>
      ))}
    </div>
  );
}
