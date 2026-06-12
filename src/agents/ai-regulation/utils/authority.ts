import type {
  AiRegulatoryUpdate,
  ExtractedCandidateItem,
  RegulationSource,
} from "@/agents/ai-regulation/types";
import type { AuthorityType, DevelopmentType } from "@/db/schema";

export function buildAuthorityTag(authorityType: AuthorityType) {
  return `authority:${authorityType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function parseAuthorityTag(tags: string[]): AuthorityType | null {
  const authorityTag = tags.find((tag) => tag.startsWith("authority:"));
  if (!authorityTag) return null;

  const value = authorityTag.slice("authority:".length);
  const normalized = value.replace(/-/g, " ");

  const matchingAuthority = authorityTypesByLabel.find(
    (label) => label.toLowerCase() === normalized,
  );

  return matchingAuthority ?? null;
}

const authorityTypesByLabel: AuthorityType[] = [
  "Binding law",
  "Proposed law",
  "Regulation",
  "Agency guidance",
  "Enforcement action",
  "Soft law",
  "Technical standard",
  "Governance framework",
  "Policy report",
  "Best practice",
  "Other",
];

export function inferAuthorityType(input: {
  developmentType: DevelopmentType;
  title: string;
  text: string;
  sourceName: string;
  authorityTypeHint?: AuthorityType;
}) {
  if (input.authorityTypeHint) return input.authorityTypeHint;

  const combined = `${input.sourceName} ${input.title} ${input.text}`.toLowerCase();

  if (/owasp|maturity assessment|best practice|playbook/i.test(combined)) {
    return "Best practice" as const;
  }

  if (/iso\/iec 42001|international standard|management system standard/i.test(combined)) {
    return "Technical standard" as const;
  }

  if (/nist ai rmf|risk management framework|profile|governance framework/i.test(combined)) {
    return "Governance framework" as const;
  }

  if (/oecd ai principles|oecd recommendation|principles for trustworthy ai/i.test(combined)) {
    return "Soft law" as const;
  }

  switch (input.developmentType) {
    case "Statute":
    case "Final rule":
    case "Executive order":
    case "International treaty":
      return "Binding law";
    case "Bill":
    case "Proposed rule":
    case "Public consultation":
      return "Proposed law";
    case "Regulation":
      return "Regulation";
    case "Agency guidance":
      return "Agency guidance";
    case "Enforcement action":
      return "Enforcement action";
    case "Policy report":
      return "Policy report";
    case "Standards document":
      return /framework/i.test(combined)
        ? "Governance framework"
        : "Technical standard";
    case "Code of practice":
      return "Soft law";
    default:
      if (/guideline|recommendation|principles|soft law/i.test(combined)) {
        return "Soft law";
      }
      if (/framework|maturity|assurance|governance/i.test(combined)) {
        return "Governance framework";
      }
      return "Other";
  }
}

/**
 * Priority rank for an authority type — lower means higher legal authority
 * (Binding law = 0 … Other = last). Used to order the admin review queue so
 * the most authoritative items surface first.
 */
export function getAuthorityPriorityRank(authorityType: AuthorityType): number {
  const index = authorityTypesByLabel.indexOf(authorityType);
  return index === -1 ? authorityTypesByLabel.length : index;
}

export function getAuthorityPresentation(authorityType: AuthorityType) {
  switch (authorityType) {
    case "Binding law":
      return {
        label: "Binding Law",
        shortNote: "Binding legal source",
        adminNotes: [
          "Treat as binding law if the official source text confirms adoption and applicability.",
          "Requires legal/editorial review before publication.",
        ],
      };
    case "Proposed law":
      return {
        label: "Proposed Law",
        shortNote: "Not yet binding",
        adminNotes: [
          "Proposal or consultation stage only.",
          "Not binding law unless later adopted.",
        ],
      };
    case "Regulation":
      return {
        label: "Regulation",
        shortNote: "Regulatory legal material",
        adminNotes: [
          "Review whether the item is adopted, proposed, consolidated, or implementing material.",
        ],
      };
    case "Agency guidance":
      return {
        label: "Agency Guidance",
        shortNote: "Regulatory guidance",
        adminNotes: [
          "Guidance may be influential without being directly binding.",
        ],
      };
    case "Enforcement action":
      return {
        label: "Enforcement Action",
        shortNote: "Regulatory enforcement signal",
        adminNotes: [
          "Treat as an enforcement signal, not a generally binding rule text.",
        ],
      };
    case "Soft law":
      return {
        label: "Soft Law",
        shortNote: "Influential soft law",
        adminNotes: [
          "Not binding law unless incorporated by another authority.",
          "Requires legal/editorial review before publication.",
        ],
      };
    case "Technical standard":
      return {
        label: "Technical Standard",
        shortNote: "Technical standard; official metadata only",
        adminNotes: [
          "Technical standard; official metadata only.",
          "Paywalled full standard text may exist and should not be reproduced.",
        ],
      };
    case "Governance framework":
      return {
        label: "Governance Framework",
        shortNote: "AI governance framework",
        adminNotes: [
          "Not automatically binding law.",
          "Useful for compliance program design and benchmarking.",
        ],
      };
    case "Policy report":
      return {
        label: "Policy Report",
        shortNote: "Policy/reporting material",
        adminNotes: [
          "Policy or analytical material, not automatically binding law.",
        ],
      };
    case "Best practice":
      return {
        label: "Best Practice",
        shortNote: "Best-practice material",
        adminNotes: [
          "Best-practice material, not binding law.",
        ],
      };
    default:
      return {
        label: "Other",
        shortNote: "Other official material",
        adminNotes: [
          "Requires legal/editorial review before publication.",
        ],
      };
  }
}

export function inferSourceAuthorityType(source: RegulationSource): AuthorityType {
  const configuredHint = source.config?.authorityTypeHint;
  if (typeof configuredHint === "string") {
    const matching = authorityTypesByLabel.find((value) => value === configuredHint);
    if (matching) return matching;
  }

  return inferAuthorityType({
    developmentType: source.sourceType === "legislative_database"
      ? "Regulation"
      : source.sourceType === "RSS"
        ? "Agency guidance"
        : "Other official regulatory development",
    title: source.name,
    text: `${source.notes} ${source.sourceUrl}`,
    sourceName: source.name,
  });
}

export function deriveCandidateAuthorityType(
  source: RegulationSource,
  candidate: ExtractedCandidateItem,
  developmentType: DevelopmentType,
) {
  return inferAuthorityType({
    developmentType,
    title: candidate.title,
    text: `${candidate.excerpt ?? ""} ${candidate.text}`,
    sourceName: source.name,
    authorityTypeHint: candidate.authorityTypeHint,
  });
}

export function deriveUpdateAuthorityType(update: Pick<
  AiRegulatoryUpdate,
  "developmentType" | "title" | "summary" | "sourceName" | "tags"
>) {
  const fromTags = parseAuthorityTag(update.tags);
  if (fromTags) return fromTags;

  return inferAuthorityType({
    developmentType: update.developmentType,
    title: update.title,
    text: update.summary,
    sourceName: update.sourceName,
  });
}
