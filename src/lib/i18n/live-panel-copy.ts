import type { Locale } from "@/lib/i18n/config";

/**
 * UI copy for `LiveLegalIntelligencePanel`. These strings used to be hardcoded
 * inside the component as a mix of French and English, which rendered franglais
 * on the /en pages. English is the source of truth for the shape.
 */
const en = {
  liveMonitoring: "Live monitoring",
  corroborated: (count: number) => `Corroborated · ${count} sources`,
  published: (date: string) => `Published ${date}`,
  officialSource: "official source ↗",
  officialVerificationPending: "official verification pending",
  alsoVia: (sourceName: string) => `also via ${sourceName} ↗`,
  publicStateLabel: "Public state",
  publicStateNote:
    "Only sourced, publicly safe developments appear here — an item is shown once its source, date, and verification are ready.",
  empty: {
    noSignalsTitle: "No public signals yet",
    noSignalsBody: "Monitoring continues in the background.",
    degradedTitle: "Source access degraded",
    degradedBody:
      "Tracked sources were blocked or inaccessible; nothing shown until verified.",
    noNewTitle: "No newly visible developments",
    noNewBody: "No new public legal signals ready to show right now.",
  },
};

export type LivePanelCopy = typeof en;

export const livePanelCopy: Record<Locale, LivePanelCopy> = {
  en,
  fr: {
    liveMonitoring: "Veille en direct",
    corroborated: (count: number) => `Corroboré · ${count} sources`,
    published: (date: string) => `Publié ${date}`,
    officialSource: "source officielle ↗",
    officialVerificationPending: "vérification officielle en attente",
    alsoVia: (sourceName: string) => `aussi via ${sourceName} ↗`,
    publicStateLabel: "État public",
    publicStateNote:
      "Seuls les développements sourcés et publiquement sûrs apparaissent ici — un élément s'affiche une fois source, date et vérification prêtes.",
    empty: {
      noSignalsTitle: "Aucun signal public pour l'instant",
      noSignalsBody: "La veille se poursuit en arrière-plan.",
      degradedTitle: "Accès aux sources dégradé",
      degradedBody:
        "Les sources suivies étaient bloquées ou inaccessibles ; rien n'est affiché avant vérification.",
      noNewTitle: "Aucun développement nouvellement visible",
      noNewBody: "Aucun nouveau signal juridique public prêt à être affiché pour le moment.",
    },
  },
};
