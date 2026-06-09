import type { ReactNode } from "react";

import { MotionReveal } from "@/components/site/motion-reveal";
import { ScrollTextReveal } from "@/components/site/scroll-text-reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  actions?: ReactNode;
}) {
  return (
    <MotionReveal
      className={cn(
        "space-y-3",
        align === "center" ? "text-center" : "text-left",
      )}
    >
      {eyebrow ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-600">{eyebrow}</p>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className={cn("space-y-3", align === "center" ? "mx-auto max-w-3xl" : "max-w-3xl")}>
          <ScrollTextReveal
            as="h2"
            text={title}
            mode="words"
            stagger={0.055}
            duration={0.8}
            className="font-display text-3xl font-medium uppercase tracking-[-0.05em] text-zinc-950 md:text-4xl"
          />
          {description ? (
            <ScrollTextReveal
              as="p"
              text={description}
              mode="paragraph"
              duration={0.8}
              className="text-base leading-7 text-zinc-700"
            />
          ) : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
    </MotionReveal>
  );
}
