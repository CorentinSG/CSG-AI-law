import type { AuthorityType } from "@/db/schema";
import { cn } from "@/lib/utils";

const toneMap: Record<AuthorityType, string> = {
  "Binding law": "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Proposed law": "border-amber-200 bg-amber-50 text-amber-900",
  Regulation: "border-sky-200 bg-sky-50 text-sky-900",
  "Agency guidance": "border-blue-200 bg-blue-50 text-blue-900",
  "Enforcement action": "border-rose-200 bg-rose-50 text-rose-900",
  "Soft law": "border-violet-200 bg-violet-50 text-violet-900",
  "Technical standard": "border-stone-200 bg-stone-50 text-stone-900",
  "Governance framework": "border-cyan-200 bg-cyan-50 text-cyan-900",
  "Policy report": "border-zinc-200 bg-zinc-50 text-zinc-700",
  "Best practice": "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
  Other: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

export function AuthorityBadge({
  label,
  authorityType,
  className,
}: {
  label: string;
  authorityType: AuthorityType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em]",
        toneMap[authorityType],
        className,
      )}
    >
      {label}
    </span>
  );
}
