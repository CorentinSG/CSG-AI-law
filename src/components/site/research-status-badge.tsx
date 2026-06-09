import { cn } from "@/lib/utils";

export function ResearchStatusBadge({
  status,
  className,
}: {
  status: "published" | "draft" | "forthcoming";
  className?: string;
}) {
  const label =
    status === "published"
      ? "Published"
      : status === "forthcoming"
        ? "Forthcoming"
        : "Draft";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em]",
        status === "published" &&
          "border-emerald-500/15 bg-emerald-500/6 text-emerald-700",
        status === "forthcoming" &&
          "border-black/10 bg-white/70 text-zinc-700",
        status === "draft" && "border-amber-500/20 bg-amber-500/8 text-amber-700",
        className,
      )}
    >
      {label}
    </span>
  );
}
