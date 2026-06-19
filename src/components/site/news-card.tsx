import Link from "next/link";

import {
  getNewsVerificationLabel,
  type AiLawNewsItem,
} from "@/content/ai-regulation/news";
import { MotionStaggerItem } from "@/components/site/motion-stagger";
import { formatDisplayDate } from "@/lib/utils";

export function NewsCard({ item }: { item: AiLawNewsItem }) {
  return (
    <MotionStaggerItem className="h-full">
      <article className="glass-panel-soft h-full rounded-[1.9rem] p-6 shadow-[0_18px_45px_rgba(15,15,15,0.05)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(15,15,15,0.08)]">
        <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          <span>{item.region}</span>
          <span>{item.sourceType.replaceAll("_", " ")}</span>
          <span>{item.verificationStatus.replaceAll("_", " ")}</span>
        </div>
        <h2 className="mt-4 font-display text-xl font-medium uppercase tracking-[-0.04em] text-zinc-950">
          <Link href={`/news/${item.slug}`}>{item.title}</Link>
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-700">{item.shortSummary}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.4rem] border border-black/6 bg-white/60 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Published
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-950">
              {formatDisplayDate(item.publicationDate)}
            </p>
            <p className="mt-2 text-xs leading-6 text-zinc-500">
              {item.exactDateOfInformation
                ? `Event date: ${formatDisplayDate(item.exactDateOfInformation)}`
                : "Exact event date not detected."}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-black/6 bg-white/60 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              Source
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-950">{item.sourceName}</p>
            <p className="mt-2 text-xs leading-6 text-zinc-500">
              {getNewsVerificationLabel(item)}
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-[1.4rem] border border-black/6 bg-white/60 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            At a glance
          </p>
          <div className="mt-3 grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
            <p>
              <span className="font-medium text-zinc-950">Jurisdiction:</span> {item.jurisdiction}
            </p>
            <p>
              <span className="font-medium text-zinc-950">Legal area:</span> {item.legalArea}
            </p>
            <p>
              <span className="font-medium text-zinc-950">Authority signal:</span> {item.authorityType.replaceAll("_", " ")}
            </p>
            <p>
              <span className="font-medium text-zinc-950">Source link:</span>{" "}
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-black/15 underline-offset-4"
              >
                open source
              </a>
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {item.topicTags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-black/6 bg-zinc-50 px-2 py-1 text-xs text-zinc-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </article>
    </MotionStaggerItem>
  );
}
