import Link from "next/link";

import { MotionReveal } from "@/components/site/motion-reveal";

interface EmptyFilterStateProps {
  title?: string;
  body?: string;
  resetHref: string;
  resetLabel?: string;
  hasActiveFilters: boolean;
  lang?: "en" | "fr";
}

export function EmptyFilterState({
  title,
  body,
  resetHref,
  resetLabel,
  hasActiveFilters,
  lang = "en",
}: EmptyFilterStateProps) {
  const fr = lang === "fr";
  const resolvedResetLabel = resetLabel ?? (fr ? "Réinitialiser les filtres" : "Reset filters");
  const defaultTitle = hasActiveFilters
    ? fr
      ? "Aucun résultat ne correspond aux filtres actuels"
      : "No results match the current filters"
    : fr
      ? "Rien à afficher pour l'instant"
      : "Nothing to show yet";

  const defaultBody = hasActiveFilters
    ? fr
      ? "Essayez d'ajuster ou d'effacer les filtres pour voir plus de résultats. Les données sous-jacentes sont toujours là — la combinaison de filtres actuelle n'a rien renvoyé."
      : "Try adjusting or clearing the filters to see more results. The underlying data is still there — the current filter combination returned nothing."
    : fr
      ? "Aucun élément à afficher ici pour l'instant. Revenez après le prochain cycle de veille ou retirez les filtres actifs."
      : "There are no items to display here yet. Check back after the next monitoring cycle or remove any active filters.";

  return (
    <MotionReveal>
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[1.8rem] border border-black/6 bg-white/60 px-8 py-12 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-400">
          {hasActiveFilters ? (fr ? "Filtres actifs" : "Filters active") : fr ? "Vide" : "Empty"}
        </p>
        <h3 className="mt-4 font-serif text-xl text-zinc-800">
          {title ?? defaultTitle}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-7 text-zinc-500">
          {body ?? defaultBody}
        </p>
        {hasActiveFilters && (
          <Link
            href={resetHref}
            className="mt-6 rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm text-zinc-700 transition-colors duration-150 hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
          >
            {resolvedResetLabel}
          </Link>
        )}
      </div>
    </MotionReveal>
  );
}

// Helper: detect whether any filter params are active
export function hasActiveFilterParams(
  params: Record<string, string>,
  filterKeys: string[],
): boolean {
  return filterKeys.some((key) => {
    const value = params[key];
    return typeof value === "string" && value !== "" && value !== "all";
  });
}
