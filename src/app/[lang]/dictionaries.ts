import "server-only";

import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";
import en from "./dictionaries/en.json";

export type { Dictionary };

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  en: () => Promise.resolve(en as Dictionary),
  fr: () => import("./dictionaries/fr.json").then((m) => m.default as Dictionary),
};

export const getDictionary = (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();
