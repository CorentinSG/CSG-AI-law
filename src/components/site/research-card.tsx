import Link from "next/link";

import { MotionStaggerItem } from "@/components/site/motion-stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResearchCard({
  category,
  title,
  description,
  href,
  status,
  meta,
  tags,
}: {
  category: string;
  title: string;
  description: string;
  href?: string;
  status?: string;
  meta?: string;
  tags?: string[];
}) {
  const content = (
    <MotionStaggerItem className="h-full">
      <Card className="glass-panel-soft h-full rounded-[1.9rem] text-zinc-900">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">{category}</p>
            {status ? (
              <span className="rounded-full border border-black/8 bg-zinc-50 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">
                {status}
              </span>
            ) : null}
          </div>
          <CardTitle className="font-display text-xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
            {title}
          </CardTitle>
          {meta ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">{meta}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-zinc-700">
          <p>{description}</p>
          {tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-black/8 bg-white/55 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </MotionStaggerItem>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
