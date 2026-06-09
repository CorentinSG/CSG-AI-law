import { cn } from "@/lib/utils";

const toneClasses = {
  light: {
    neutral: "border-black/8 bg-white text-zinc-700",
    positive: "border-emerald-200 bg-emerald-50 text-emerald-900",
    informative: "border-sky-200 bg-sky-50 text-sky-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  },
  dark: {
    neutral: "border-white/10 bg-white/5 text-zinc-200",
    positive: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
    informative: "border-sky-400/25 bg-sky-500/10 text-sky-100",
    warning: "border-amber-400/25 bg-amber-500/10 text-amber-100",
  },
} as const;

export function IntelligenceSignal({
  label,
  value,
  note,
  tone = "neutral",
  theme = "light",
  className,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: keyof typeof toneClasses.light;
  theme?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.4rem] border p-4 shadow-[0_10px_30px_rgba(15,15,15,0.03)]",
        toneClasses[theme][tone],
        className,
      )}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] opacity-70">
        {label}
      </p>
      <p className="mt-2 font-display text-lg font-medium uppercase tracking-[-0.04em]">
        {value}
      </p>
      {note ? <p className="mt-2 text-sm leading-6 opacity-80">{note}</p> : null}
    </div>
  );
}
