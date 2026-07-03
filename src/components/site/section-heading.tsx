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
        <p
          className={cn(
            "flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.35em] text-accent-strong",
            align === "center" && "justify-center",
          )}
        >
          <span className="h-px w-6 bg-accent/60" aria-hidden />
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className={cn("space-y-3", align === "center" ? "mx-auto max-w-3xl" : "max-w-3xl")}>
          <ScrollTextReveal
            as="h2"
            text={title}
            mode="words"
            stagger={0.055}
            duration={0.8}
            className="font-display text-3xl font-medium tracking-[-0.04em] text-foreground md:text-4xl"
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
