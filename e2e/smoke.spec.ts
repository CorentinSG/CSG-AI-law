import { test, expect, type Page } from "@playwright/test";

/**
 * Route smoke tests: every key public + admin page must respond 200, render a
 * heading, avoid the error boundary, and raise no uncaught page errors. This is
 * the regression net for the Server-Component crash class that previously 500'd
 * `/` and `/ai-regulation/europe`.
 */

const errorBoundaryMarkers = [
  "Unable to load this page",
  "Application error",
  "This page could not be displayed",
];

interface Route {
  path: string;
  // A substring expected somewhere in the rendered page (case-insensitive).
  expect: string;
}

const publicRoutes: Route[] = [
  { path: "/en", expect: "Saint-Girons" },
  { path: "/fr", expect: "Saint-Girons" },
  { path: "/en/ai-regulation", expect: "intelligence" },
  { path: "/en/ai-regulation/europe", expect: "Europe" },
  { path: "/en/ai-regulation/europe/france", expect: "France" },
  { path: "/en/ai-regulation/united-states", expect: "United States" },
  { path: "/en/ai-regulation/international", expect: "International" },
  { path: "/en/news", expect: "news" },
  { path: "/en/research", expect: "research" },
  { path: "/en/ai-regulation/europe/ai-act/calendar", expect: "calendar" },
  { path: "/en/ai-regulation/europe/case-law", expect: "case law" },
  { path: "/en/ai-regulation/united-states/case-law", expect: "case law" },
  // Locale-redirect safety net: an unprefixed path must still resolve (200
  // after redirect), not 404 — this guards the proxy.ts fallback rule.
  { path: "/ai-regulation/europe", expect: "Europe" },
];

const adminRoutes: Route[] = [
  { path: "/admin", expect: "Site dashboard" },
  { path: "/admin/operations", expect: "Operations" },
  { path: "/admin/ai-regulation", expect: "AI Regulation" },
  { path: "/admin/ai-regulation/legal-database", expect: "Legal database" },
  { path: "/admin/ai-regulation/review", expect: "Batch review" },
];

async function assertHealthyRoute(page: Page, route: Route) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
  expect(response, `no response for ${route.path}`).not.toBeNull();
  expect(response!.status(), `bad status for ${route.path}`).toBeLessThan(400);

  // A heading must render — the page got past data loading.
  await expect(page.locator("h1, h2").first()).toBeVisible();

  const body = (await page.locator("body").innerText()).toLowerCase();
  for (const marker of errorBoundaryMarkers) {
    expect(body, `${route.path} shows error boundary: ${marker}`).not.toContain(
      marker.toLowerCase(),
    );
  }
  expect(body).toContain(route.expect.toLowerCase());

  // No uncaught runtime exceptions (the Server-Component crash class).
  expect(pageErrors, `uncaught errors on ${route.path}: ${pageErrors.join("; ")}`).toEqual([]);

  await page.screenshot({
    path: `e2e/__screenshots__/${route.path.replace(/[^a-z0-9]+/gi, "_") || "home"}.png`,
    fullPage: true,
  });
}

test.describe("public routes", () => {
  for (const route of publicRoutes) {
    test(`renders ${route.path}`, async ({ page }) => {
      await assertHealthyRoute(page, route);
    });
  }
});

test.describe("admin routes", () => {
  for (const route of adminRoutes) {
    test(`renders ${route.path}`, async ({ page }) => {
      await assertHealthyRoute(page, route);
    });
  }
});
