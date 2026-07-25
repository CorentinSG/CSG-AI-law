import { cn } from "@/lib/utils";

// ─── Authority type badge ────────────────────────────────────────────────────

const authorityColors: Record<string, string> = {
  "Binding law": "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Proposed law": "border-blue-200 bg-blue-50 text-blue-900",
  Regulation: "border-emerald-200 bg-emerald-50 text-emerald-900",
  "Agency guidance": "border-sky-200 bg-sky-50 text-sky-900",
  "Enforcement action": "border-orange-200 bg-orange-50 text-orange-900",
  "Soft law": "border-purple-200 bg-purple-50 text-purple-900",
  "Technical standard": "border-violet-200 bg-violet-50 text-violet-900",
  "Governance framework": "border-indigo-200 bg-indigo-50 text-indigo-900",
  "Policy report": "border-zinc-200 bg-zinc-50 text-zinc-700",
  "Best practice": "border-zinc-200 bg-zinc-50 text-zinc-700",
  Other: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

export function AuthorityBadge({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const colors = authorityColors[type] ?? "border-zinc-200 bg-zinc-50 text-zinc-600";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em]",
        colors,
        className,
      )}
    >
      {type}
    </span>
  );
}

// ─── Verification status badge ───────────────────────────────────────────────

const verificationColors: Record<string, string> = {
  official_verified: "border-emerald-200 bg-emerald-50 text-emerald-900",
  corroborated: "border-teal-200 bg-teal-50 text-teal-900",
  published_news: "border-blue-200 bg-blue-50 text-blue-900",
  needs_review: "border-amber-200 bg-amber-50 text-amber-900",
  media_reported: "border-amber-200 bg-amber-50 text-amber-800",
  needs_official_source: "border-orange-200 bg-orange-50 text-orange-900",
  discovery_only: "border-zinc-200 bg-zinc-50 text-zinc-600",
  rejected: "border-red-200 bg-red-50 text-red-800",
  converted_to_monitor_item: "border-indigo-200 bg-indigo-50 text-indigo-900",
};

const verificationLabels: Record<string, string> = {
  official_verified: "Official verified",
  corroborated: "Corroborated",
  published_news: "Published",
  needs_review: "Needs review",
  media_reported: "Media reported",
  needs_official_source: "Needs official source",
  discovery_only: "Discovery only",
  rejected: "Rejected",
  converted_to_monitor_item: "In monitor",
};

export function VerificationBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const colors =
    verificationColors[status] ?? "border-zinc-200 bg-zinc-50 text-zinc-600";
  const label = verificationLabels[status] ?? status.replaceAll("_", " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em]",
        colors,
        className,
      )}
    >
      {label}
    </span>
  );
}

// ─── Implementation status badge (Europe) ───────────────────────────────────

const implementationColors: Record<string, string> = {
  competent_authority_designated: "border-emerald-200 bg-emerald-50 text-emerald-900",
  national_implementation_identified: "border-teal-200 bg-teal-50 text-teal-900",
  implementation_in_progress: "border-blue-200 bg-blue-50 text-blue-900",
  consultation_or_draft_identified: "border-sky-200 bg-sky-50 text-sky-900",
  eu_framework_applies: "border-indigo-200 bg-indigo-50 text-indigo-900",
  no_specific_national_implementation_verified: "border-zinc-200 bg-zinc-50 text-zinc-600",
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
  not_applicable: "border-zinc-100 bg-zinc-50 text-zinc-400",
};

const implementationLabels: Record<string, string> = {
  competent_authority_designated: "Authority designated",
  national_implementation_identified: "National law identified",
  implementation_in_progress: "In progress",
  consultation_or_draft_identified: "Consultation / draft",
  eu_framework_applies: "EU framework applies",
  no_specific_national_implementation_verified: "Not yet verified",
  needs_review: "Needs review",
  not_applicable: "Not applicable",
};

const implementationLabelsFr: Record<string, string> = {
  competent_authority_designated: "Autorité désignée",
  national_implementation_identified: "Loi nationale identifiée",
  implementation_in_progress: "En cours",
  consultation_or_draft_identified: "Consultation / projet",
  eu_framework_applies: "Cadre UE applicable",
  no_specific_national_implementation_verified: "Pas encore vérifié",
  needs_review: "À revoir",
  not_applicable: "Non applicable",
};

export function ImplementationBadge({
  status,
  className,
  lang = "en",
}: {
  status: string;
  className?: string;
  lang?: "en" | "fr";
}) {
  const colors =
    implementationColors[status] ?? "border-zinc-200 bg-zinc-50 text-zinc-600";
  const labels = lang === "fr" ? implementationLabelsFr : implementationLabels;
  const label = labels[status] ?? status.replaceAll("_", " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em]",
        colors,
        className,
      )}
    >
      {label}
    </span>
  );
}

// ─── US AI law status badge ──────────────────────────────────────────────────

const usStatusColors: Record<string, string> = {
  enacted_comprehensive_ai_law: "border-emerald-200 bg-emerald-50 text-emerald-900",
  enacted_sector_specific_ai_law: "border-teal-200 bg-teal-50 text-teal-900",
  pending_ai_legislation: "border-blue-200 bg-blue-50 text-blue-900",
  agency_guidance_or_enforcement: "border-sky-200 bg-sky-50 text-sky-900",
  ai_related_privacy_or_automated_decision_rules: "border-indigo-200 bg-indigo-50 text-indigo-900",
  no_specific_ai_law_verified: "border-zinc-200 bg-zinc-50 text-zinc-600",
  needs_review: "border-amber-200 bg-amber-50 text-amber-800",
};

const usStatusLabels: Record<string, string> = {
  enacted_comprehensive_ai_law: "Comprehensive AI law",
  enacted_sector_specific_ai_law: "Sector-specific AI law",
  pending_ai_legislation: "Pending legislation",
  agency_guidance_or_enforcement: "Agency guidance",
  ai_related_privacy_or_automated_decision_rules: "Privacy/ADM rules",
  no_specific_ai_law_verified: "Not yet verified",
  needs_review: "Needs review",
};

const usStatusLabelsFr: Record<string, string> = {
  enacted_comprehensive_ai_law: "Loi IA globale",
  enacted_sector_specific_ai_law: "Loi IA sectorielle",
  pending_ai_legislation: "Législation en cours",
  agency_guidance_or_enforcement: "Guidance d'agence",
  ai_related_privacy_or_automated_decision_rules: "Règles vie privée/DA",
  no_specific_ai_law_verified: "Pas encore vérifié",
  needs_review: "À revoir",
};

export function UsAiStatusBadge({
  status,
  className,
  lang = "en",
}: {
  status: string;
  className?: string;
  lang?: "en" | "fr";
}) {
  const colors = usStatusColors[status] ?? "border-zinc-200 bg-zinc-50 text-zinc-600";
  const labels = lang === "fr" ? usStatusLabelsFr : usStatusLabels;
  const label = labels[status] ?? status.replaceAll("_", " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em]",
        colors,
        className,
      )}
    >
      {label}
    </span>
  );
}

// ─── Confidence badge ────────────────────────────────────────────────────────

const confidenceColors: Record<string, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-red-200 bg-red-50 text-red-800",
  needs_review: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

const confidenceLabelsFr: Record<string, string> = {
  high: "confiance élevée",
  medium: "confiance moyenne",
  low: "confiance faible",
  needs_review: "à revoir",
};

export function ConfidenceBadge({
  level,
  className,
  lang = "en",
}: {
  level: string;
  className?: string;
  lang?: "en" | "fr";
}) {
  const colors = confidenceColors[level] ?? "border-zinc-200 bg-zinc-50 text-zinc-600";
  const label =
    lang === "fr" ? confidenceLabelsFr[level] ?? `confiance ${level}` : `${level} confidence`;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em]",
        colors,
        className,
      )}
    >
      {label}
    </span>
  );
}

// ─── Source type badge ───────────────────────────────────────────────────────

const sourceTypeColors: Record<string, string> = {
  official_source: "border-emerald-200 bg-emerald-50 text-emerald-900",
  legal_regulatory_press: "border-blue-200 bg-blue-50 text-blue-800",
  tracker_database: "border-purple-200 bg-purple-50 text-purple-800",
  informal_discovery_source: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

export function SourceTypeBadge({
  sourceType,
  className,
}: {
  sourceType: string;
  className?: string;
}) {
  const colors = sourceTypeColors[sourceType] ?? "border-zinc-200 bg-zinc-50 text-zinc-600";
  const label = sourceType.replaceAll("_", " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.22em]",
        colors,
        className,
      )}
    >
      {label}
    </span>
  );
}
