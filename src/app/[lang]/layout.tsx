import { notFound } from "next/navigation";

import { isLocale } from "@/lib/i18n/config";

/**
 * Rejects an invalid `lang` segment before any route under it renders.
 *
 * The per-page `isLocale` guards are not enough on their own. `ai-regulation`
 * has a `loading.tsx`, so Next streams that segment: the shell is flushed with
 * HTTP 200 before the page function runs, and a `notFound()` raised afterwards
 * arrives in the stream as `NEXT_HTTP_ERROR_FALLBACK;404` — the client swaps in
 * the 404 UI, but the status stays 200. A crawler sees an indexable page. This
 * layout runs above that boundary, so the 404 reaches the status line.
 *
 * `proxy.ts` cannot cover this either: its matcher `/((?!_next|api|.*\..*).*)`
 * deliberately skips any path containing a dot, so `/de/contact` is redirected
 * and 404s, while `/de.foo/contact` routes straight through to the page.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return children;
}
