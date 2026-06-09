import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  href,
  cta,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  href?: string;
  cta?: string;
}) {
  const content = (
    <Card className="h-full rounded-[1.9rem] border-black/6 bg-white/80 shadow-[0_16px_48px_rgba(15,15,15,0.04)]">
      <CardHeader className="space-y-4">
        <div className="flex size-11 items-center justify-center rounded-2xl border border-black/6 bg-zinc-100">
          <Icon className="size-5 text-zinc-800" />
        </div>
        {eyebrow ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-zinc-600">{eyebrow}</p>
        ) : null}
        <CardTitle className="font-display text-xl font-medium uppercase tracking-[-0.04em] text-zinc-950">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-zinc-700">
        <p>{description}</p>
        {cta ? <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-600">{cta}</p> : null}
      </CardContent>
    </Card>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
