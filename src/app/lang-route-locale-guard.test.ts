import { readFileSync } from "node:fs";
import { join } from "node:path";

import { globSync } from "tinyglobby";
import { describe, expect, it } from "vitest";

/**
 * Every page under `app/[lang]` must reject a `lang` segment that is not a real
 * locale, because `proxy.ts` cannot be relied on to do it. Its matcher —
 * `/((?!_next|api|.*\..*).*)` — deliberately skips any path containing a dot, so
 * `/de/contact` is redirected and 404s but `/de.foo/contact` reaches the route
 * directly. Pages that only branch on `lang === "fr"` then render the full
 * English page with HTTP 200, which is an indexable soft-404 at unlimited URLs.
 *
 * A static check rather than a request test: this must hold for pages that are
 * expensive or impossible to render here (they read Supabase), and the failure
 * mode is a missing line, which the source shows directly.
 */
const PAGE_GLOB = "src/app/[lang]/**/page.tsx";

// `notFound()` may be called directly or through a helper that resolves the
// locale; what matters is that an invalid lang cannot reach the render.
const GUARD = /if\s*\(\s*!isLocale\(\s*lang\s*\)\s*\)\s*\{?\s*notFound\(\)/;

function pages() {
  return globSync(PAGE_GLOB, { cwd: process.cwd() }).sort();
}

/**
 * The layout guard is the one that fixes the HTTP status, and it is the reason
 * this file exists. `ai-regulation` has a `loading.tsx`, so Next streams that
 * segment: the shell is flushed with 200 before the page function runs, and a
 * `notFound()` raised there arrives as `NEXT_HTTP_ERROR_FALLBACK;404` inside the
 * stream — the client shows the 404 UI, the status line still says 200, and a
 * crawler indexes it. Only a guard above that boundary reaches the status.
 */
describe("[lang] layout locale guard", () => {
  it("rejects a non-locale lang above every streaming boundary", () => {
    const layout = readFileSync(join(process.cwd(), "src/app/[lang]/layout.tsx"), "utf8");
    expect(GUARD.test(layout)).toBe(true);
  });
});

describe("[lang] route locale guard", () => {
  it("finds the page routes to check", () => {
    // A glob that silently matches nothing would make every assertion below
    // vacuous, which is the failure mode this suite most needs to avoid.
    expect(pages().length).toBeGreaterThan(25);
  });

  it.each(pages())("%s rejects a lang segment that is not a locale", (page) => {
    const source = readFileSync(join(process.cwd(), page), "utf8");
    expect(GUARD.test(source), `${page} renders for any lang, including "de.foo"`).toBe(true);
  });
});
