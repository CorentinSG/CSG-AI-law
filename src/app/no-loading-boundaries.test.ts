import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Next 16.2.6 regression guard.
 *
 * A `loading.tsx` anywhere in the App Router creates a Suspense boundary whose
 * subtree never finishes hydrating in a production build: React keeps the
 * fallback, the streamed server HTML is left in the DOM without an owner, and
 * every interactive control below that boundary is dead. There is no console
 * error — the page looks fine and simply does not respond.
 *
 * This was live on the deployed site for days: the whole /ai-regulation
 * section (France console, hub, country pages) rendered correctly and no
 * button worked. Reproduced from a clean production build, and confirmed to be
 * general rather than route-specific by adding a trivial `loading.tsx` to a
 * healthy route, which broke that route too.
 *
 * Until Next is upgraded and the behaviour re-verified in a production build,
 * loading files stay out of the tree. Deleting this test to add one back will
 * silently break interactivity for everything underneath it.
 */
function findLoadingFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      findLoadingFiles(full, found);
    } else if (/^loading\.(tsx|ts|jsx|js)$/.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

describe("App Router loading boundaries", () => {
  it("ships no loading.tsx while the Next hydration regression is open", () => {
    const offenders = findLoadingFiles(join(process.cwd(), "src", "app")).map(
      (path) => path.replace(process.cwd(), "").replace(/\\/g, "/"),
    );

    expect(
      offenders,
      `A loading file creates a Suspense boundary that never hydrates on Next 16.2.6, killing every interactive control beneath it:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
