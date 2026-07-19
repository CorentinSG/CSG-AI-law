# EU Aggressive Legal News Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand European Union AI-law monitoring into an aggressive live journalistic and policy-press radar while keeping official EU sources as the only verified legal authority layer.

**Architecture:** Reuse the France aggressive radar pattern at EU level. Add multiple EU media-discovery lanes around existing NewsAPI and GDELT connectors. The EU live discovery scan will include the new media lanes; official EU scans will remain limited to official/institutional authority sources.

**Tech Stack:** Next.js, TypeScript, Vitest, Supabase seed dataset, existing NewsAPI/GDELT API connector paths.

## Global Constraints

- No changes to Claude-owned Standards UI files: `src/components/site/standards-explorer.tsx`, `src/components/site/authority-spectrum.tsx`, `src/app/[lang]/standards/page.tsx`.
- Press and API-discovered articles are discovery-only unless an existing publication rule explicitly allows them as news items.
- No press item can create or upgrade a legal database entry to verified authority without an official URL or manual review.
- Paywalled or restricted outlets may contribute metadata leads only; do not scrape or reproduce protected article text.
- `NEWSAPI_API_KEY` improves speed; GDELT remains the keyless fallback.
- No guarantee of true real-time coverage if the deployment scheduler cannot run at five-minute cadence.
- No country-specific source expansion beyond existing country lanes; this implementation is for supranational EU coverage.

---

## File Structure

- Modify `src/agents/ai-regulation/euNewsSources.ts`: EU source-of-truth registry and profile source IDs.
- Modify `src/agents/ai-regulation/euNewsSources.test.ts`: EU registry tests.
- Modify `src/agents/ai-regulation/scanProfiles.test.ts`: EU live/official scan separation tests.
- Modify `src/db/seed/ai-regulation-seed.ts`: Supabase source rows for aggressive EU discovery lanes.
- Modify `src/db/seed/seed-profiles.test.ts`: seed guardrail tests for aggressive EU rows.
- Modify `src/content/ai-regulation/news-sources.ts`: public/admin news-source metadata.
- Modify `src/content/ai-regulation/news.test.ts`: public source config expectations.
- Modify `AI_TASKS.md`: implementation handoff.
- Do not create a new connector unless existing NewsAPI/GDELT connector behavior cannot support the required domain-restricted and broad-discovery queries.

---

### Task 1: EU Registry Defines Aggressive Media Lanes

**Files:**
- Modify: `src/agents/ai-regulation/euNewsSources.ts`
- Test: `src/agents/ai-regulation/euNewsSources.test.ts`

**Interfaces:**
- Consumes: `getEuAgentSourceIds(profileId: EuAgentProfileId): string[]`
- Consumes: `getEuSourceDescriptor(source): descriptor | null`
- Produces additional descriptor source IDs:
  - `src-eu-brussels-policy-newsapi-ai`
  - `src-eu-privacy-ai-governance-newsapi-ai`
  - `src-eu-tech-regulation-newsapi-ai`
  - `src-eu-legal-competition-newsapi-ai`
  - `src-eu-general-international-newsapi-ai`
  - `src-eu-aggressive-gdelt-ai`

- [ ] **Step 1: Write the failing registry test**

Add this test to `src/agents/ai-regulation/euNewsSources.test.ts`:

```ts
  it("exposes aggressive EU journalistic discovery lanes without making them official", () => {
    const aggressiveMediaIds = [
      "src-eu-brussels-policy-newsapi-ai",
      "src-eu-privacy-ai-governance-newsapi-ai",
      "src-eu-tech-regulation-newsapi-ai",
      "src-eu-legal-competition-newsapi-ai",
      "src-eu-general-international-newsapi-ai",
      "src-eu-aggressive-gdelt-ai",
    ];

    expect(getEuAgentSourceIds("eu_live_news_discovery_scan")).toEqual(
      expect.arrayContaining(aggressiveMediaIds),
    );

    expect(getEuAgentSourceIds("eu_official_legal_scan")).not.toEqual(
      expect.arrayContaining(aggressiveMediaIds),
    );

    for (const sourceId of aggressiveMediaIds) {
      const descriptor = getEuSourceDescriptor({
        id: sourceId,
        name: sourceId,
        region: "Europe",
        sourceType: sourceId.endsWith("gdelt-ai") ? "discovery_source" : "media_source",
      });

      expect(descriptor?.official).toBe(false);
      expect(descriptor?.sourceAuthorityLevel).toMatch(/media_legal_press|informal_discovery/);
    }
  });
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- --run src/agents/ai-regulation/euNewsSources.test.ts`

Expected: FAIL because the new EU source IDs are missing from `euNewsSourceRegistry`.

- [ ] **Step 3: Add the registry descriptors**

In `src/agents/ai-regulation/euNewsSources.ts`, add the six new non-official registry entries near the existing `eu-major-press-newsapi` entry:

```ts
  {
    id: "eu-brussels-policy-newsapi",
    sourceId: "src-eu-brussels-policy-newsapi-ai",
    name: "EU AI Brussels policy press (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "eu-privacy-ai-governance-newsapi",
    sourceId: "src-eu-privacy-ai-governance-newsapi-ai",
    name: "EU AI privacy and governance press (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "eu-tech-regulation-newsapi",
    sourceId: "src-eu-tech-regulation-newsapi-ai",
    name: "EU AI tech regulation press (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "eu-legal-competition-newsapi",
    sourceId: "src-eu-legal-competition-newsapi-ai",
    name: "EU AI legal and competition press (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "eu-general-international-newsapi",
    sourceId: "src-eu-general-international-newsapi-ai",
    name: "EU AI general international press (NewsAPI)",
    sourceAuthorityLevel: "media_legal_press",
    official: false,
    region: "Europe",
    category: "media",
  },
  {
    id: "eu-aggressive-gdelt",
    sourceId: "src-eu-aggressive-gdelt-ai",
    name: "EU AI aggressive legal news discovery (GDELT)",
    sourceAuthorityLevel: "informal_discovery",
    official: false,
    region: "Europe",
    category: "discovery",
  },
```

- [ ] **Step 4: Run the registry test**

Run: `npm test -- --run src/agents/ai-regulation/euNewsSources.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/agents/ai-regulation/euNewsSources.ts src/agents/ai-regulation/euNewsSources.test.ts
git commit -m "feat(eu): expand live legal news source registry"
```

---

### Task 2: EU Scan Profiles Preserve Official/Media Separation

**Files:**
- Modify: `src/agents/ai-regulation/scanProfiles.test.ts`

**Interfaces:**
- Consumes: `selectSourcesForScanProfile(sources, "eu_live_news_discovery_scan")`
- Consumes: `selectSourcesForScanProfile(sources, "eu_official_legal_scan")`

- [ ] **Step 1: Update live scan fixture**

Update the test named `"keeps Europe live scans limited to the Europe discovery source set"` so its fixture includes:

```ts
      createSource({ id: "src-eu-brussels-policy-newsapi-ai", sourceType: "media_source" }),
      createSource({ id: "src-eu-privacy-ai-governance-newsapi-ai", sourceType: "media_source" }),
      createSource({ id: "src-eu-tech-regulation-newsapi-ai", sourceType: "media_source" }),
      createSource({ id: "src-eu-legal-competition-newsapi-ai", sourceType: "media_source" }),
      createSource({ id: "src-eu-general-international-newsapi-ai", sourceType: "media_source" }),
      createSource({ id: "src-eu-aggressive-gdelt-ai", sourceType: "discovery_source" }),
```

In `"keeps Europe official scans aligned with the expanded official fast-feed set"`, add:

```ts
      createSource({ id: "src-eu-brussels-policy-newsapi-ai", sourceType: "media_source" }),
```

The existing official assertion should continue to exclude this media source.

- [ ] **Step 2: Run the scan profile test**

Run: `npm test -- --run src/agents/ai-regulation/scanProfiles.test.ts`

Expected: PASS if Task 1 is complete; otherwise FAIL because source IDs are absent from `getEuAgentSourceIds`.

- [ ] **Step 3: Commit**

```bash
git add src/agents/ai-regulation/scanProfiles.test.ts
git commit -m "test(eu): lock official and live scan source separation"
```

---

### Task 3: Seed Supabase Sources for Aggressive EU Lanes

**Files:**
- Modify: `src/db/seed/ai-regulation-seed.ts`
- Modify: `src/db/seed/seed-profiles.test.ts`

**Interfaces:**
- Produces active source rows with `id`, `sourceUrl`, `sourceType`, `scanFrequency`, `active`, `reliabilityLevel`, `preferredExtractionMethod`, and `config`.

- [ ] **Step 1: Write the failing seed test**

Add a test to `src/db/seed/seed-profiles.test.ts`:

```ts
  it("seeds aggressive EU journalistic discovery sources as non-authority lanes", () => {
    const aggressiveEuIds = [
      "src-eu-brussels-policy-newsapi-ai",
      "src-eu-privacy-ai-governance-newsapi-ai",
      "src-eu-tech-regulation-newsapi-ai",
      "src-eu-legal-competition-newsapi-ai",
      "src-eu-general-international-newsapi-ai",
      "src-eu-aggressive-gdelt-ai",
    ];

    const sources = dataset.sources.filter((source) =>
      aggressiveEuIds.includes(source.id),
    );

    expect(sources.map((source) => source.id).sort()).toEqual([...aggressiveEuIds].sort());
    expect(sources.every((source) => source.country === "European Union")).toBe(true);
    expect(sources.every((source) => source.jurisdiction === "European Union")).toBe(true);
    expect(sources.every((source) => source.region === "Europe")).toBe(true);
    expect(sources.every((source) => source.active)).toBe(true);
    expect(sources.every((source) => source.preferredExtractionMethod === "api")).toBe(true);
    expect(sources.every((source) => source.notes.toLowerCase().includes("discovery-only"))).toBe(true);
    expect(
      sources.every((source) =>
        source.notes.toLowerCase().includes("legal authority without official-source confirmation"),
      ),
    ).toBe(true);
  });
```

- [ ] **Step 2: Run the failing seed test**

Run: `npm test -- --run src/db/seed/seed-profiles.test.ts`

Expected: FAIL because the aggressive EU sources are missing.

- [ ] **Step 3: Add source seed rows**

In `src/db/seed/ai-regulation-seed.ts`, insert the six source objects after `src-eu-major-press-newsapi-ai` and before `src-eu-gdelt-ai`.

Use this pattern for NewsAPI rows:

```ts
{
  id: "src-eu-brussels-policy-newsapi-ai",
  name: "EU AI Brussels policy press (NewsAPI)",
  jurisdiction: "European Union",
  region: "Europe",
  country: "European Union",
  sourceUrl:
    "https://newsapi.org/v2/everything?q=(%22AI%20Act%22%20OR%20%22EU%20AI%20Office%22%20OR%20GPAI%20OR%20%22high-risk%20AI%22)%20AND%20(Commission%20OR%20Parliament%20OR%20Council%20OR%20Brussels%20OR%20enforcement%20OR%20guidance)&language=en&sortBy=publishedAt&pageSize=20&domains=euractiv.com,politico.eu,mlex.com,contexte.com",
  sourceType: "media_source",
  scanFrequency: "hourly",
  active: true,
  lastScannedAt: "2026-07-19T12:20:00.000Z",
  notes:
    "Discovery-only EU Brussels policy press lane. Results are metadata-only leads and require official-source confirmation before any legal authority use.",
  reliabilityLevel: "medium",
  preferredExtractionMethod: "api",
  config: {
    apiProvider: "newsapi",
    sourceCategory: "media_discovery_source",
    maxItems: 12,
    allowedDomains: ["euractiv.com", "politico.eu", "mlex.com", "contexte.com"],
  },
  createdAt: now,
  updatedAt: now,
}
```

Repeat this pattern for:

```ts
// src-eu-privacy-ai-governance-newsapi-ai
allowedDomains: ["iapp.org", "techpolicy.press", "fpf.org"]

// src-eu-tech-regulation-newsapi-ai
allowedDomains: ["techcrunch.com", "theregister.com", "euronews.com", "sifted.eu"]

// src-eu-legal-competition-newsapi-ai
allowedDomains: ["lexology.com", "jdsupra.com", "globalcompetitionreview.com"]

// src-eu-general-international-newsapi-ai
allowedDomains: ["reuters.com", "apnews.com", "ft.com", "theguardian.com", "bloomberg.com"]
```

For `src-eu-aggressive-gdelt-ai`, use:

```ts
sourceUrl:
  "https://api.gdeltproject.org/api/v2/doc/doc?query=(%22AI%20Act%22%20OR%20%22EU%20AI%20Office%22%20OR%20GPAI%20OR%20%22high-risk%20AI%22%20OR%20biometric%20OR%20%22general-purpose%20AI%22)%20near10%20(Commission%20OR%20Parliament%20OR%20Council%20OR%20EDPB%20OR%20EDPS%20OR%20Curia%20OR%20CJEU%20OR%20standard%20OR%20enforcement%20OR%20guidance)&mode=artlist&format=json&maxrecords=50",
sourceType: "discovery_source",
scanFrequency: "hourly",
active: true,
lastScannedAt: "2026-07-19T12:25:00.000Z",
notes:
  "Discovery-only aggressive GDELT query used to spot EU AI legal and regulatory media signals quickly. Items require official-source confirmation before any legal authority use.",
reliabilityLevel: "medium",
preferredExtractionMethod: "api",
config: {
  apiProvider: "gdelt",
  sourceCategory: "media_discovery_source",
  maxItems: 20,
}
```

- [ ] **Step 4: Run the seed test**

Run: `npm test -- --run src/db/seed/seed-profiles.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/seed/ai-regulation-seed.ts src/db/seed/seed-profiles.test.ts
git commit -m "feat(db): seed aggressive EU legal news sources"
```

---

### Task 4: Public News Source Metadata Mirrors the EU Runtime Registry

**Files:**
- Modify: `src/content/ai-regulation/news-sources.ts`
- Modify: `src/content/ai-regulation/news.test.ts`

**Interfaces:**
- Consumes: `aiLawNewsSourceConfigs`
- Produces public source config IDs:
  - `news-europe-brussels-policy-newsapi`
  - `news-europe-privacy-ai-governance-newsapi`
  - `news-europe-tech-regulation-newsapi`
  - `news-europe-legal-competition-newsapi`
  - `news-europe-general-international-newsapi`
  - `news-europe-aggressive-gdelt`

- [ ] **Step 1: Write the failing public config test**

In `src/content/ai-regulation/news.test.ts`, update the Europe source expectation so `arrayContaining` includes:

```ts
        "news-europe-brussels-policy-newsapi",
        "news-europe-privacy-ai-governance-newsapi",
        "news-europe-tech-regulation-newsapi",
        "news-europe-legal-competition-newsapi",
        "news-europe-general-international-newsapi",
        "news-europe-aggressive-gdelt",
```

Add this assertion to the same test or a new adjacent test:

```ts
    const aggressiveEuropeSources = aiLawNewsSourceConfigs.filter((source) =>
      [
        "news-europe-brussels-policy-newsapi",
        "news-europe-privacy-ai-governance-newsapi",
        "news-europe-tech-regulation-newsapi",
        "news-europe-legal-competition-newsapi",
        "news-europe-general-international-newsapi",
        "news-europe-aggressive-gdelt",
      ].includes(source.id),
    );

    expect(aggressiveEuropeSources.every((source) => !source.official)).toBe(true);
    expect(
      aggressiveEuropeSources.every((source) =>
        source.notes.toLowerCase().includes("never legal authority"),
      ),
    ).toBe(true);
```

- [ ] **Step 2: Run the failing public config test**

Run: `npm test -- --run src/content/ai-regulation/news.test.ts`

Expected: FAIL because the new public EU source configs are missing.

- [ ] **Step 3: Add public source configs**

In `src/content/ai-regulation/news-sources.ts`, add six config objects after `news-europe-major-press-newsapi` and before `news-europe-gdelt-discovery`. Use the same names, URLs, coverage families, and non-official metadata as Task 3.

Each NewsAPI object must use:

```ts
sourceType: "legal_regulatory_press",
official: false,
reliabilityLevel: "reputable_secondary",
region: "Europe",
scanFrequency: "hourly",
active: true,
paywallStatus: "mixed",
scrapingAllowed: true,
manualOnly: false,
lastChecked: checkedAt,
parserStatus: "ready",
notes:
  "Discovery-only metadata lane for fast EU AI legal-news monitoring. Never legal authority without official-source confirmation.",
```

For `news-europe-aggressive-gdelt`, use:

```ts
sourceType: "informal_discovery_source",
official: false,
reliabilityLevel: "informal_discovery",
region: "Europe",
scanFrequency: "hourly",
active: true,
paywallStatus: "public",
scrapingAllowed: true,
manualOnly: false,
lastChecked: checkedAt,
parserStatus: "ready",
notes:
  "Broad GDELT fallback for EU AI legal-news monitoring. Never legal authority without official-source confirmation.",
```

- [ ] **Step 4: Run the public config test**

Run: `npm test -- --run src/content/ai-regulation/news.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/ai-regulation/news-sources.ts src/content/ai-regulation/news.test.ts
git commit -m "feat(eu): expose aggressive legal news sources"
```

---

### Task 5: Verify EU Source Alignment and Document Handoff

**Files:**
- Modify: `AI_TASKS.md`

**Interfaces:**
- Consumes all new EU source IDs from Tasks 1-4.
- Produces a handoff entry recording the EU aggressive legal-news radar.

- [ ] **Step 1: Run targeted verification**

Run:

```bash
npm test -- --run src/agents/ai-regulation/euNewsSources.test.ts src/agents/ai-regulation/scanProfiles.test.ts src/db/seed/seed-profiles.test.ts src/content/ai-regulation/news.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run lint
npm run typecheck
$env:ADMIN_USERNAME='local-build-admin'; $env:ADMIN_PASSWORD='local-build-password-not-default'; $env:APP_DATA_MODE='memory'; $env:ALLOW_MEMORY_MODE_IN_PRODUCTION='true'; $env:ADMIN_AUTH_SECRET='local-build-admin-secret-32chars'; npm run build
```

Expected:
- `npm test`: PASS unless the existing unrelated `src/content/research.test.ts` featured-entry failure is still present; if present, record it exactly and do not hide it.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS with complete local production-guard environment variables.

- [ ] **Step 3: Add the handoff**

Add a dated entry near the top of `AI_TASKS.md` under `## Current status`.

```md
### 2026-07-19 - Codex, EU aggressive legal-news radar
- Intent: Expand supranational EU AI-law monitoring with aggressive journalistic and Brussels policy discovery lanes while preserving official-only authority rules.
- Changed: Added Brussels-policy, privacy/AI-governance, tech-regulation, legal/competition, general international press, and broad GDELT EU media lanes across agent registry, seed sources, and public news-source metadata.
- Guardrails: All media/API lanes remain discovery-only; official EU confirmation or manual review is required before verified legal authority use.
- Verification: targeted EU/scan-profile/seed/news tests PASS; full verification status recorded by implementer.
- Next: Configure/verify `NEWSAPI_API_KEY` in the production worker runtime, monitor GDELT rate limits, and do not describe the EU radar as guaranteed real-time unless the deployed scheduler actually runs the five-minute lane.
```

- [ ] **Step 4: Commit**

```bash
git add AI_TASKS.md
git commit -m "docs: hand off EU aggressive legal news radar"
```

---

## Self-Review

- Spec coverage: Tasks cover EU registry, scan selection, seed data, public metadata, scheduler/currentness posture, publication guardrails, testing, and handoff.
- Placeholder scan: no deferred-work markers or undefined future work appears in task steps.
- Type consistency: runtime/seed IDs use `src-eu-*`; public source configs use `news-europe-*`; registry IDs use `eu-*`.
- Isolation: each task has its own tests and commit. The plan does not touch Claude-owned Standards UI files or country-specific source lanes.
