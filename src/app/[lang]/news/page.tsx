import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { localeHref } from "@/lib/i18n/href";

export const metadata: Metadata = {
  title: "AI Law News",
  description:
    "AI law developments now live inside the unified AI Legal Intelligence Hub.",
};

export default async function NewsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await routeParams;
  if (!isLocale(lang)) notFound();
  const params = ((await searchParams) ?? {}) as Record<string, string>;
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      nextParams.set(key, value);
    }
  }

  nextParams.set("view", "news");

  // Keep the locale segment: an unprefixed target goes through `proxy.ts`,
  // which re-negotiates the locale from Accept-Language and can drop a French
  // reader onto /en.
  redirect(
    `${localeHref(isLocale(lang) ? lang : DEFAULT_LOCALE, "/ai-regulation")}?${nextParams.toString()}`,
  );
}
