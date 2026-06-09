import type { AiLawNewsItem } from "@/content/ai-regulation/news";

export interface MediaDomainScore {
  score: number;
  tier: "major_global" | "major_regional" | "secondary";
  matchedDomain: string | null;
  label: string;
}

const domainScores = [
  { domain: "reuters.com", score: 100, tier: "major_global", label: "Reuters" },
  { domain: "politico.eu", score: 96, tier: "major_regional", label: "Politico Europe" },
  { domain: "ft.com", score: 94, tier: "major_global", label: "Financial Times" },
  { domain: "wsj.com", score: 92, tier: "major_global", label: "Wall Street Journal" },
  { domain: "euractiv.com", score: 88, tier: "major_regional", label: "Euractiv" },
  { domain: "iapp.org", score: 86, tier: "major_regional", label: "IAPP" },
  { domain: "technologyreview.com", score: 84, tier: "major_global", label: "MIT Technology Review" },
  { domain: "theverge.com", score: 80, tier: "major_global", label: "The Verge" },
  { domain: "wired.com", score: 80, tier: "major_global", label: "Wired" },
  { domain: "lemonde.fr", score: 90, tier: "major_regional", label: "Le Monde" },
  { domain: "lesechos.fr", score: 88, tier: "major_regional", label: "Les Echos" },
  { domain: "liberation.fr", score: 82, tier: "major_regional", label: "Liberation" },
  { domain: "latribune.fr", score: 80, tier: "major_regional", label: "La Tribune" },
] satisfies Array<{
  domain: string;
  score: number;
  tier: MediaDomainScore["tier"];
  label: string;
}>;

const sortedDomainScores = [...domainScores].sort(
  (left, right) => right.domain.length - left.domain.length,
);

function getHostname(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function getMediaDomainScore(
  item: Pick<AiLawNewsItem, "sourceType" | "sourceUrl" | "sourceName">,
): MediaDomainScore {
  if (item.sourceType === "official_source") {
    return {
      score: 0,
      tier: "secondary",
      matchedDomain: null,
      label: "Official source",
    };
  }

  const hostname = getHostname(item.sourceUrl);
  const match = hostname
    ? sortedDomainScores.find(
        (entry) => hostname === entry.domain || hostname.endsWith(`.${entry.domain}`),
      ) ?? null
    : null;

  if (match) {
    return {
      score: match.score,
      tier: match.tier,
      matchedDomain: match.domain,
      label: match.label,
    };
  }

  return {
    score: 50,
    tier: "secondary",
    matchedDomain: hostname,
    label: item.sourceName,
  };
}
