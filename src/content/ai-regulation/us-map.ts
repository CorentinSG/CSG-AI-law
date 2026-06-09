import {
  getUsStateAiLawProfiles,
  usStateAiLawStatusTaxonomy,
  type UsStateAiLawStatus,
  type UsStateConfidence,
} from "@/content/ai-regulation/us-state-ai-law-baseline";

export const usMapStatusColors: Record<
  UsStateAiLawStatus,
  {
    label: string;
    className: string;
    dotClassName: string;
  }
> = {
  enacted_comprehensive_ai_law: {
    label: usStateAiLawStatusTaxonomy.enacted_comprehensive_ai_law.label,
    className: "border-emerald-300/60 bg-emerald-400/25 text-emerald-50",
    dotClassName: "bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.45)]",
  },
  enacted_sector_specific_ai_law: {
    label: usStateAiLawStatusTaxonomy.enacted_sector_specific_ai_law.label,
    className: "border-teal-300/50 bg-teal-400/20 text-teal-50",
    dotClassName: "bg-teal-300 shadow-[0_0_18px_rgba(94,234,212,0.4)]",
  },
  pending_ai_legislation: {
    label: usStateAiLawStatusTaxonomy.pending_ai_legislation.label,
    className: "border-sky-300/50 bg-sky-400/20 text-sky-50",
    dotClassName: "bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.4)]",
  },
  agency_guidance_or_enforcement: {
    label: usStateAiLawStatusTaxonomy.agency_guidance_or_enforcement.label,
    className: "border-cyan-300/45 bg-cyan-400/15 text-cyan-50",
    dotClassName: "bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.35)]",
  },
  ai_related_privacy_or_automated_decision_rules: {
    label:
      usStateAiLawStatusTaxonomy.ai_related_privacy_or_automated_decision_rules.label,
    className: "border-indigo-300/45 bg-indigo-400/15 text-indigo-50",
    dotClassName: "bg-indigo-300 shadow-[0_0_18px_rgba(165,180,252,0.35)]",
  },
  no_specific_ai_law_verified: {
    label: usStateAiLawStatusTaxonomy.no_specific_ai_law_verified.label,
    className: "border-amber-300/45 bg-amber-400/15 text-amber-50",
    dotClassName: "bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.3)]",
  },
  needs_review: {
    label: usStateAiLawStatusTaxonomy.needs_review.label,
    className: "border-white/15 bg-white/10 text-zinc-200",
    dotClassName: "bg-zinc-300 shadow-[0_0_16px_rgba(212,212,216,0.22)]",
  },
};

export interface UsStateMapStatus {
  code: string;
  slug: string;
  name: string;
  x: number;
  y: number;
  status: UsStateAiLawStatus;
  confidence: UsStateConfidence;
  note: string;
  officialSourceLabel?: string;
  officialSourceUrl?: string;
  lastReviewedDate: string | null;
  sourceCount: number;
  href: string;
}

const baseStatePositions = [
  ["WA", 11, 18],
  ["OR", 8, 30],
  ["CA", 9, 51],
  ["NV", 16, 45],
  ["ID", 19, 28],
  ["MT", 29, 18],
  ["WY", 31, 34],
  ["UT", 27, 47],
  ["AZ", 25, 62],
  ["CO", 38, 48],
  ["NM", 36, 64],
  ["ND", 45, 19],
  ["SD", 45, 32],
  ["NE", 48, 43],
  ["KS", 51, 55],
  ["OK", 53, 66],
  ["TX", 50, 80],
  ["MN", 56, 23],
  ["IA", 58, 39],
  ["MO", 60, 53],
  ["AR", 61, 66],
  ["LA", 62, 80],
  ["WI", 64, 29],
  ["IL", 65, 45],
  ["MS", 66, 75],
  ["MI", 70, 33],
  ["IN", 70, 47],
  ["KY", 72, 56],
  ["TN", 72, 64],
  ["AL", 72, 75],
  ["OH", 76, 45],
  ["GA", 77, 75],
  ["FL", 83, 88],
  ["WV", 80, 53],
  ["VA", 84, 57],
  ["NC", 85, 65],
  ["SC", 83, 72],
  ["PA", 84, 41],
  ["NY", 88, 32],
  ["VT", 91, 21],
  ["NH", 94, 22],
  ["ME", 96, 13],
  ["MA", 95, 30],
  ["RI", 96, 34],
  ["CT", 94, 36],
  ["NJ", 90, 43],
  ["DE", 91, 48],
  ["MD", 89, 51],
  ["DC", 91, 55],
  ["AK", 12, 84],
  ["HI", 24, 88],
] as const;

const profileByCode = new Map(
  getUsStateAiLawProfiles().map((profile) => [profile.stateCode, profile]),
);

export const usStateMapStatuses: UsStateMapStatus[] = baseStatePositions.map(
  ([code, x, y]) => {
    const profile = profileByCode.get(code);
    if (!profile) {
      throw new Error(`Missing U.S. state profile for ${code}`);
    }
    const firstSource = profile.sourceReferences[0];
    return {
      code,
      slug: profile.slug,
      name: profile.stateName,
      x,
      y,
      status: profile.aiLawStatus,
      confidence: profile.confidenceLevel,
      note: profile.publicSummary,
      officialSourceLabel: firstSource?.title,
      officialSourceUrl: firstSource?.url,
      lastReviewedDate: profile.lastReviewedDate,
      sourceCount: profile.sourceReferences.length,
      href: `/ai-regulation/united-states/${profile.slug}`,
    };
  },
);

export function getUsMapTone(status: UsStateAiLawStatus) {
  return usStateAiLawStatusTaxonomy[status].mapTone;
}

export function getUsMapColor(status: UsStateAiLawStatus) {
  return usMapStatusColors[status];
}
