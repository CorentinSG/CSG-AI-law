import type { Metadata } from "next";
import Link from "next/link";

import { updateRepository } from "@/agents/ai-regulation/processors/updateRepository";
import { getPublicResearchEntries } from "@/content/research";
import { ResearchCard } from "@/components/site/research-card";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteShell } from "@/components/site/shell";
import { UpdateCard } from "@/components/site/update-card";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Standards & Governance",
  description:
    "Public-facing explanation of the platform's treatment of influential soft law, governance frameworks, and technical standards relevant to AI compliance.",
};

const frameworkCards = [
  {
    category: "Governance framework",
    title: "NIST AI RMF",
    description:
      "Tracked as an influential governance framework for risk management, assurance, and lifecycle controls. It is not automatically binding law.",
    status: "Official source monitored",
  },
  {
    category: "Best practice",
    title: "OWASP AIMA",
    description:
      "Tracked as best-practice material relevant to AI security, governance maturity, and operational benchmarking.",
    status: "Official source monitored",
  },
  {
    category: "Technical standard",
    title: "ISO/IEC 42001",
    description:
      "Tracked through official ISO metadata only. Full standard text may be paywalled and is not reproduced by the platform.",
    status: "Metadata only",
  },
  {
    category: "Soft law",
    title: "OECD AI policy materials",
    description:
      "Tracked as international policy and governance material that may influence domestic regulatory expectations without being binding law in itself.",
    status: "Official source monitored",
  },
];

export const dynamic = "force-dynamic";

export default async function StandardsPage() {
  const publishedUpdates = await updateRepository.listPublicUpdates();
  const relatedResearch = getPublicResearchEntries().filter((entry) =>
    entry.category === "Soft Law & Standards" ||
    entry.tags.some((tag) =>
      ["NIST AI RMF", "ISO/IEC 42001", "OWASP AIMA", "Soft law"].includes(tag),
    ),
  );
  const standardsUpdates = publishedUpdates.filter((update) =>
    update.tags.some((tag) =>
      [
        "authority:soft-law",
        "authority:technical-standard",
        "authority:governance-framework",
        "authority:best-practice",
      ].includes(tag),
    ),
  );

  return (
    <SiteShell className="space-y-20">
      <section className="space-y-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-600">
          Soft law &amp; standards
        </p>
        <h1 className="max-w-4xl font-display text-5xl font-medium uppercase tracking-[-0.05em] text-zinc-950 md:text-6xl">
          Influential frameworks matter, even when they are not binding law
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-zinc-700">
          The platform tracks authoritative governance frameworks, standards,
          and policy materials that can influence compliance design, procurement
          expectations, risk management, supervisory reasoning, and internal AI
          governance decisions even when they do not operate as binding law.
        </p>
      </section>

      <Card className="rounded-[2rem] border-black/6 bg-white text-zinc-950 shadow-[0_18px_50px_rgba(15,15,15,0.04)]">
        <CardContent className="grid gap-6 p-8 md:grid-cols-2">
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-600">
              Editorial rule
            </p>
            <h2 className="font-display text-3xl font-medium uppercase tracking-[-0.05em]">
              Not automatically binding law
            </h2>
            <p className="text-base leading-7 text-zinc-800">
              Soft law, technical standards, and governance frameworks may be
              highly influential, but they are not presented here as binding law
              unless a competent legal authority incorporates or requires them.
            </p>
          </div>
          <div className="space-y-3 text-sm leading-6 text-zinc-800">
            <p>- Human review is required before publication.</p>
            <p>- ISO standard full text is not reproduced where paywalled.</p>
            <p>- Public items remain limited to reviewed and published entries.</p>
            <p>- These materials can still shape governance, procurement, risk management, and enforcement expectations.</p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-8 border-t border-black/6 pt-16">
        <SectionHeading
          eyebrow="Tracked categories"
          title="Current soft-law and standards coverage"
          description="The monitoring architecture now explicitly accommodates governance frameworks, standards, and best-practice materials as first-class research objects alongside hard law."
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {frameworkCards.map((item) => (
            <ResearchCard key={item.title} {...item} />
          ))}
        </div>
      </section>

      <section className="space-y-8 border-t border-black/6 pt-16">
        <SectionHeading
          eyebrow="Related research"
          title="Research notes on soft law and standards"
          description="These notes explain why governance frameworks and standards matter without overstating their legal force."
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {relatedResearch.map((entry) => (
            <ResearchCard
              key={entry.slug}
              href={`/research/${entry.slug}`}
              category={entry.category}
              title={entry.title}
              description={entry.summary}
              status={entry.status === "published" ? "Published" : "Research note forthcoming"}
              meta={entry.jurisdiction ?? "International / comparative"}
              tags={entry.tags}
            />
          ))}
        </div>
      </section>

      <section className="space-y-8 border-t border-black/6 pt-16">
        <SectionHeading
          eyebrow="Published items"
          title="Published standards and governance updates"
          description="Only reviewed and published items appear here. Drafts, internal notes, and unpublished review materials remain private."
          actions={
            <Link href="/ai-regulation" className="text-sm uppercase tracking-[0.16em] text-zinc-800">
              View AI law hub
            </Link>
          }
        />
        {standardsUpdates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {standardsUpdates.map((update) => (
              <UpdateCard key={update.id} update={update} href={`/ai-regulation/${update.id}`} />
            ))}
          </div>
        ) : (
          <Card className="rounded-[1.8rem] border-black/6 bg-white shadow-[0_16px_48px_rgba(15,15,15,0.04)]">
            <CardContent className="p-8 text-sm leading-7 text-zinc-700">
              No standards or soft-law items have been published publicly yet.
              The monitoring and review pipeline is in place, but public
              visibility still depends on human review and manual publication.
            </CardContent>
          </Card>
        )}
      </section>
    </SiteShell>
  );
}
