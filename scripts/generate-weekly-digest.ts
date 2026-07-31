/**
 * A weekly editorial draft, assembled — never written — by the machine.
 *
 * The funnel audit showed the monitor publishes ~150 database entries and ~30
 * public news items a week, while the editorial shelf holds four articles. The
 * gap is not material, it is assembly time. This turns one week of *published*
 * monitor output into a reviewable markdown draft: grouped by jurisdiction,
 * every line carrying its real title, source and date.
 *
 * Hard rule, same as the content rules in AGENTS.md: nothing is invented. The
 * script reorganizes titles, links and dates that already passed publication
 * policy. Framing, judgement and prose are the owner's job on review — which is
 * why the output is an artifact to edit, not a page that goes live.
 *
 *   npx tsx scripts/generate-weekly-digest.ts [--days 7] [--out digest.md]
 */

import { writeFileSync } from "node:fs";

import { getSupabaseAdminClient } from "@/lib/supabase";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Sanity ceiling so a runaway week cannot produce an unreadable draft. */
const MAX_ROWS_PER_SECTION = 200;

export type DigestUpdate = {
  title: string;
  jurisdiction: string;
  legal_area: string | null;
  authority_type: string | null;
  source_name: string;
  source_url: string;
  publication_date: string | null;
  published_at: string | null;
};

export type DigestNewsItem = {
  title: string;
  jurisdiction: string;
  short_summary: string;
  source_name: string;
  slug: string;
  event_date: string | null;
  detected_at: string;
};

function byJurisdiction<T extends { jurisdiction: string }>(rows: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const key = row.jurisdiction || "Unspecified";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  // Busiest jurisdictions first — that ordering is itself information.
  return new Map([...groups.entries()].sort((a, b) => b[1].length - a[1].length));
}

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "date not stated";
}

/**
 * Pure and deterministic so it can be pinned by tests: same rows in, same
 * markdown out. All content comes from the rows; the only authored text is
 * structure (headings, counts) and the explicit review notice.
 */
export function buildWeeklyDigestMarkdown(input: {
  updates: DigestUpdate[];
  news: DigestNewsItem[];
  windowDays: number;
  generatedAtIso: string;
}): string {
  const { updates, news, windowDays, generatedAtIso } = input;
  const lines: string[] = [];

  lines.push(`# Weekly AI-law digest — draft for review`);
  lines.push("");
  lines.push(
    `> DRAFT. Assembled ${generatedAtIso.slice(0, 10)} from the last ${windowDays} days of ` +
      `published monitor output: ${updates.length} database entr${updates.length === 1 ? "y" : "ies"} ` +
      `and ${news.length} public news item${news.length === 1 ? "" : "s"}. Every line links its ` +
      `original source. Nothing below was generated — review, cut, and add your own analysis ` +
      `before publishing anything.`,
  );
  lines.push("");

  if (updates.length === 0 && news.length === 0) {
    lines.push("_Nothing was published in this window. No digest to draft._");
    return lines.join("\n");
  }

  if (news.length > 0) {
    lines.push(`## Legal news (${news.length})`);
    lines.push("");
    for (const [jurisdiction, rows] of byJurisdiction(news)) {
      lines.push(`### ${jurisdiction} (${rows.length})`);
      lines.push("");
      for (const item of rows) {
        lines.push(`- **${item.title}** — ${item.source_name}, ${formatDate(item.event_date)}`);
        if (item.short_summary) lines.push(`  ${item.short_summary}`);
        lines.push(`  Site: /news/${item.slug}`);
      }
      lines.push("");
    }
  }

  if (updates.length > 0) {
    lines.push(`## Database entries (${updates.length})`);
    lines.push("");
    for (const [jurisdiction, rows] of byJurisdiction(updates)) {
      lines.push(`### ${jurisdiction} (${rows.length})`);
      lines.push("");
      for (const row of rows) {
        const facets = [row.authority_type, row.legal_area].filter(Boolean).join(" · ");
        lines.push(
          `- **${row.title}**${facets ? ` (${facets})` : ""} — [${row.source_name}](${row.source_url}), ${formatDate(row.publication_date ?? row.published_at)}`,
        );
      }
      lines.push("");
    }
  }

  lines.push("---");
  lines.push(
    "_Draft assembled from published monitor output only. The owner's review, selection and " +
      "commentary are what turn this into an editorial piece — publish nothing from it verbatim._",
  );
  return lines.join("\n");
}

async function main() {
  const client = getSupabaseAdminClient();
  if (!client) {
    console.error(
      "No Supabase admin client: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set.",
    );
    process.exit(1);
  }

  const daysArg = process.argv.indexOf("--days");
  const windowDays = daysArg >= 0 ? Number(process.argv[daysArg + 1]) || 7 : 7;
  const sinceIso = new Date(Date.now() - windowDays * DAY_MS).toISOString();

  const { data: updates, error: updatesError } = await client
    .from("ai_regulatory_updates")
    .select("title,jurisdiction,legal_area,authority_type,source_name,source_url,publication_date,published_at")
    .eq("status", "published")
    .gte("published_at", sinceIso)
    .order("published_at", { ascending: false })
    .limit(MAX_ROWS_PER_SECTION);
  if (updatesError) {
    console.error(`Failed to read published updates: ${updatesError.message}`);
    process.exit(1);
  }

  const { data: news, error: newsError } = await client
    .from("news_items")
    .select("title,jurisdiction,short_summary,source_name,slug,event_date,detected_at")
    .eq("public_visibility_status", "public")
    .gte("detected_at", sinceIso)
    .order("detected_at", { ascending: false })
    .limit(MAX_ROWS_PER_SECTION);
  if (newsError) {
    console.error(`Failed to read public news: ${newsError.message}`);
    process.exit(1);
  }

  const markdown = buildWeeklyDigestMarkdown({
    updates: (updates ?? []) as DigestUpdate[],
    news: (news ?? []) as DigestNewsItem[],
    windowDays,
    generatedAtIso: new Date().toISOString(),
  });

  const outArg = process.argv.indexOf("--out");
  const path = outArg >= 0 ? (process.argv[outArg + 1] ?? "digest.md") : "digest.md";
  writeFileSync(path, markdown);
  console.log(
    `Wrote ${path}: ${(updates ?? []).length} published entries, ${(news ?? []).length} public news items, window ${windowDays}d.`,
  );
}

// Guarded so tests can import buildWeeklyDigestMarkdown without touching the network.
if (process.argv[1]?.includes("generate-weekly-digest")) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
