# France Aggressive Legal News Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand France AI-law monitoring into an aggressive live journalistic radar while keeping official sources as the only verified legal authority layer.

**Architecture:** Add multiple France media-discovery lanes around the existing NewsAPI and GDELT connectors. The France live scan will include CNIL plus aggressive media lanes; the France official scan will remain limited to official/legal authority sources. Seed data and public news-source metadata must mirror the agent registry so runtime health, admin review, and public source lists stay aligned.

**Tech Stack:** Next.js, TypeScript, Vitest, Supabase seed dataset, existing NewsAPI/GDELT API connector paths.

## Global Constraints

- No changes to Claude-owned Standards UI files: `src/components/site/standards-explorer.tsx`, `src/components/site/authority-spectrum.tsx`, `src/app/[lang]/standards/page.tsx`.
- Press and API-discovered articles are discovery-only unless an existing publication rule explicitly allows them as news items.
- No press item can create or upgrade a legal database entry to verified authority without an official URL or manual review.
- Paywalled or restricted outlets may contribute metadata leads only; do not scrape or reproduce protected article text.
- `NEWSAPI_API_KEY` improves speed; GDELT remains the keyless fallback.
- No guarantee of true real-time coverage if the deployment scheduler cannot run at five-minute cadence.

---

## File Structure

- Modify `src/agents/ai-regulation/franceNewsSources.ts`: source-of-truth registry for France live, official, and discovery source descriptors.
- Modify `src/agents/ai-regulation/franceLegalNewsAgent.test.ts`: France-specific behavior and scheduler guidance tests.
- Modify `src/agents/ai-regulation/scanProfiles.test.ts`: source selection tests for official versus aggressive live France scans.
- Modify `src/db/seed/ai-regulation-seed.ts`: Supabase source rows for each aggressive France discovery lane.
- Modify `src/content/ai-regulation/news-sources.ts`: public/admin news-source metadata for each aggressive France lane.
- Modify `src/content/ai-regulation/news.test.ts`: public source config expectations.
- Modify `AI_TASKS.md`: handoff entry after implementation.
- Do not create a new connector unless the existing API connector cannot support the needed domain-restricted NewsAPI and broad GDELT lanes.

---

### Task 1: France Registry Defines Aggressive Media Lanes

**Files:**
- Modify: `src/agents/ai-regulation/franceNewsSources.ts`
- Test: `src/agents/ai-regulation/franceLegalNewsAgent.test.ts`

**Interfaces:**
- Consumes: `getFranceAgentSourceIds(profile: FranceAgentProfileId): string[]`
- Consumes: `getFranceSourceDescriptor(sourceId: string): FranceMonitoringSourceDescriptor | null`
- Produces: additional descriptor source IDs:
  - `src-fr-legal-press-newsapi-ai`
  - `src-fr-tech-policy-newsapi-ai`
  - `src-fr-general-press-newsapi-ai`
  - `src-fr-eu-policy-newsapi-ai`
  - `src-fr-sector-press-newsapi-ai`
  - `src-fr-aggressive-gdelt-ai`

- [ ] **Step 1: Write the failing registry test**

Add this test to `src/agents/ai-regulation/franceLegalNewsAgent.test.ts` near the existing source-cluster test:

```ts
  it("exposes aggressive France journalistic discovery lanes without making them official", () => {
    const aggressiveMediaIds = [
      "src-fr-legal-press-newsapi-ai",
      "src-fr-tech-policy-newsapi-ai",
      "src-fr-general-press-newsapi-ai",
      "src-fr-eu-policy-newsapi-ai",
      "src-fr-sector-press-newsapi-ai",
      "src-fr-aggressive-gdelt-ai",
    ];

    expect(getFranceAgentSourceIds("france_live_news_scan")).toEqual(
      expect.arrayContaining(aggressiveMediaIds),
    );

    for (const sourceId of aggressiveMediaIds) {
      const descriptor = getFranceSourceDescriptor(sourceId);

      expect(descriptor?.category).toBe("discovery_media_feed");
      expect(descriptor?.liveMonitoringEligible).toBe(true);
      expect(descriptor?.baselineEligible).toBe(false);
      expect(descriptor?.verificationEligible).toBe(false);
      expect(descriptor?.recommendedCadence).toBe("every_5_minutes_when_supported");
      expect(descriptor?.freshHours).toBeLessThanOrEqual(3);
    }

    expect(getFranceAgentSourceIds("france_official_legal_scan")).not.toEqual(
      expect.arrayContaining(aggressiveMediaIds),
    );
  });
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- --run src/agents/ai-regulation/franceLegalNewsAgent.test.ts`

Expected: FAIL because the new source IDs are not present in `franceMonitoringSourceRegistry`.

- [ ] **Step 3: Add the registry descriptors**

In `src/agents/ai-regulation/franceNewsSources.ts`, append the six new descriptors after `src-fr-major-press-newsapi-ai` and before `src-fr-gdelt-ai`:

```ts
  {
    sourceId: "src-fr-legal-press-newsapi-ai",
    label: "France AI legal specialist press (NewsAPI)",
    category: "discovery_media_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "high",
    freshHours: 3,
    watchHours: 18,
    staleHours: 48,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
  {
    sourceId: "src-fr-tech-policy-newsapi-ai",
    label: "France AI tech and digital-policy press (NewsAPI)",
    category: "discovery_media_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "high",
    freshHours: 3,
    watchHours: 18,
    staleHours: 48,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
  {
    sourceId: "src-fr-general-press-newsapi-ai",
    label: "France AI general and economic press (NewsAPI)",
    category: "discovery_media_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "high",
    freshHours: 3,
    watchHours: 18,
    staleHours: 48,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
  {
    sourceId: "src-fr-eu-policy-newsapi-ai",
    label: "France AI EU and cross-border policy press (NewsAPI)",
    category: "discovery_media_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "high",
    freshHours: 3,
    watchHours: 18,
    staleHours: 48,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
  {
    sourceId: "src-fr-sector-press-newsapi-ai",
    label: "France AI sector legal press (NewsAPI)",
    category: "discovery_media_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "medium",
    freshHours: 3,
    watchHours: 18,
    staleHours: 48,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
  {
    sourceId: "src-fr-aggressive-gdelt-ai",
    label: "France AI aggressive legal news discovery (GDELT)",
    category: "discovery_media_feed",
    recommendedCadence: "every_5_minutes_when_supported",
    priorityBand: "medium",
    freshHours: 3,
    watchHours: 18,
    staleHours: 48,
    liveMonitoringEligible: true,
    baselineEligible: false,
    verificationEligible: false,
  },
```

Update `getFranceSchedulerGuidance().notes` so one note mentions that France now has separate legal press, tech-policy, general press, EU-policy, sector press, and broad GDELT lanes.

- [ ] **Step 4: Run the registry test**

Run: `npm test -- --run src/agents/ai-regulation/franceLegalNewsAgent.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/agents/ai-regulation/franceNewsSources.ts src/agents/ai-regulation/franceLegalNewsAgent.test.ts
git commit -m "feat(france): expand live legal news source registry"
```

---

### Task 2: Scan Profiles Preserve Official/Media Separation

**Files:**
- Modify: `src/agents/ai-regulation/scanProfiles.test.ts`

**Interfaces:**
- Consumes: `selectSourcesForScanProfile(sources, "france_live_news_scan")`
- Consumes: `selectSourcesForScanProfile(sources, "france_official_legal_scan")`

- [ ] **Step 1: Write the scan profile assertions**

Update the test named `"keeps France live scans limited to the lightweight France live source set"` so its fixture includes the aggressive source IDs:

```ts
      createSource({
        id: "src-fr-legal-press-newsapi-ai",
        country: "France",
        jurisdiction: "France",
        sourceType: "media_source",
      }),
      createSource({
        id: "src-fr-tech-policy-newsapi-ai",
        country: "France",
        jurisdiction: "France",
        sourceType: "media_source",
      }),
      createSource({
        id: "src-fr-general-press-newsapi-ai",
        country: "France",
        jurisdiction: "France",
        sourceType: "media_source",
      }),
      createSource({
        id: "src-fr-eu-policy-newsapi-ai",
        country: "France",
        jurisdiction: "France",
        sourceType: "media_source",
      }),
      createSource({
        id: "src-fr-sector-press-newsapi-ai",
        country: "France",
        jurisdiction: "France",
        sourceType: "media_source",
      }),
      createSource({
        id: "src-fr-aggressive-gdelt-ai",
        country: "France",
        jurisdiction: "France",
        sourceType: "discovery_source",
      }),
```

In `"keeps France official scans limited to the France baseline sources"`, add one aggressive media source to the fixture and assert it is excluded:

```ts
      createSource({
        id: "src-fr-legal-press-newsapi-ai",
        sourceType: "media_source",
        country: "France",
        jurisdiction: "France",
      }),
```

The existing equality assertion should continue to use `franceOfficialIds.filter(...)`, which proves media lanes do not leak into official scans.

- [ ] **Step 2: Run the scan profile test**

Run: `npm test -- --run src/agents/ai-regulation/scanProfiles.test.ts`

Expected: PASS if Task 1 is already implemented; FAIL if Task 1 has not yet added the registry descriptors.

- [ ] **Step 3: Commit**

```bash
git add src/agents/ai-regulation/scanProfiles.test.ts
git commit -m "test(france): lock official and live scan source separation"
```

---

### Task 3: Seed Supabase Sources for Aggressive France Lanes

**Files:**
- Modify: `src/db/seed/ai-regulation-seed.ts`
- Test: add to existing seed tests if a suitable source test exists; otherwise modify `src/db/seed/seed-profiles.test.ts`

**Interfaces:**
- Produces source rows with `id`, `sourceUrl`, `sourceType`, `scanFrequency`, `active`, `reliabilityLevel`, `preferredExtractionMethod`, and `config`.

- [ ] **Step 1: Write the failing seed test**

Add a test to `src/db/seed/seed-profiles.test.ts`:

```ts
  it("seeds aggressive France journalistic discovery sources as non-authority lanes", () => {
    const aggressiveFranceIds = [
      "src-fr-legal-press-newsapi-ai",
      "src-fr-tech-policy-newsapi-ai",
      "src-fr-general-press-newsapi-ai",
      "src-fr-eu-policy-newsapi-ai",
      "src-fr-sector-press-newsapi-ai",
      "src-fr-aggressive-gdelt-ai",
    ];

    const sources = dataset.sources.filter((source) =>
      aggressiveFranceIds.includes(source.id),
    );

    expect(sources.map((source) => source.id).sort()).toEqual([...aggressiveFranceIds].sort());
    expect(sources.every((source) => source.country === "France")).toBe(true);
    expect(sources.every((source) => source.jurisdiction === "France")).toBe(true);
    expect(sources.every((source) => source.active)).toBe(true);
    expect(sources.every((source) => source.preferredExtractionMethod === "api")).toBe(true);
    expect(sources.every((source) => source.notes.toLowerCase().includes("discovery-only"))).toBe(true);
    expect(sources.every((source) => !source.notes.toLowerCase().includes("legal authority without official-source confirmation"))).toBe(false);
  });
```

- [ ] **Step 2: Run the failing seed test**

Run: `npm test -- --run src/db/seed/seed-profiles.test.ts`

Expected: FAIL because the aggressive France sources are missing.

- [ ] **Step 3: Add source seed rows**

In `src/db/seed/ai-regulation-seed.ts`, insert the six source objects after `src-fr-major-press-newsapi-ai` and before `src-fr-gdelt-ai`.

Use these source URLs and configs:

```ts
{
  id: "src-fr-legal-press-newsapi-ai",
  name: "France AI legal specialist press (NewsAPI)",
  jurisdiction: "France",
  region: "Europe",
  country: "France",
  sourceUrl:
    "https://newsapi.org/v2/everything?q=(%22intelligence%20artificielle%22%20OR%20%22AI%20Act%22%20OR%20algorithme)%20AND%20(droit%20OR%20juridique%20OR%20justice%20OR%20CNIL%20OR%20jurisprudence%20OR%20avocat)&language=fr&sortBy=publishedAt&pageSize=20&domains=dalloz-actualite.fr,actu-juridique.fr,gazette-du-palais.fr,lextenso.fr,village-justice.com",
  sourceType: "media_source",
  scanFrequency: "hourly",
  active: true,
  lastScannedAt: "2026-07-19T12:00:00.000Z",
  notes:
    "Discovery-only specialist legal press lane. Results are metadata-only leads and require official-source confirmation before any legal authority use.",
  reliabilityLevel: "medium",
  preferredExtractionMethod: "api",
  config: {
    apiProvider: "newsapi",
    sourceCategory: "media_discovery_source",
    maxItems: 12,
    allowedDomains: [
      "dalloz-actualite.fr",
      "actu-juridique.fr",
      "gazette-du-palais.fr",
      "lextenso.fr",
      "village-justice.com",
    ],
  },
  createdAt: now,
  updatedAt: now,
}
```

Repeat this pattern for:

```ts
// src-fr-tech-policy-newsapi-ai
allowedDomains: ["next.ink", "usine-digitale.fr", "siecledigital.fr", "zdnet.fr"]

// src-fr-general-press-newsapi-ai
allowedDomains: [
  "lemonde.fr",
  "lesechos.fr",
  "liberation.fr",
  "lefigaro.fr",
  "franceinfo.fr",
  "publicsenat.fr",
  "latribune.fr",
]

// src-fr-eu-policy-newsapi-ai
allowedDomains: ["euractiv.fr", "politico.eu", "contexte.com", "iapp.org"]

// src-fr-sector-press-newsapi-ai
allowedDomains: [
  "lagazettedescommunes.com",
  "aefinfo.fr",
  "hospimedia.fr",
  "acteurspublics.fr",
]
```

For `src-fr-aggressive-gdelt-ai`, use:

```ts
sourceUrl:
  "https://api.gdeltproject.org/api/v2/doc/doc?query=(%22intelligence%20artificielle%22%20OR%20%22AI%20Act%22%20OR%20algorithme%20OR%20IA)%20near10%20(CNIL%20OR%20droit%20OR%20justice%20OR%20regulation%20OR%20loi%20OR%20decret%20OR%20jurisprudence)&mode=artlist&format=json&maxrecords=50",
sourceType: "discovery_source",
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
git commit -m "feat(db): seed aggressive France legal news sources"
```

---

### Task 4: Public News Source Metadata Mirrors the Runtime Registry

**Files:**
- Modify: `src/content/ai-regulation/news-sources.ts`
- Modify: `src/content/ai-regulation/news.test.ts`

**Interfaces:**
- Consumes: `aiLawNewsSourceConfigs`
- Produces source config IDs:
  - `news-france-legal-press-newsapi`
  - `news-france-tech-policy-newsapi`
  - `news-france-general-press-newsapi`
  - `news-france-eu-policy-newsapi`
  - `news-france-sector-press-newsapi`
  - `news-france-aggressive-gdelt`

- [ ] **Step 1: Write the failing public config test**

In `src/content/ai-regulation/news.test.ts`, update `"includes dedicated official France news-source configs"` so `arrayContaining` includes:

```ts
        "news-france-legal-press-newsapi",
        "news-france-tech-policy-newsapi",
        "news-france-general-press-newsapi",
        "news-france-eu-policy-newsapi",
        "news-france-sector-press-newsapi",
        "news-france-aggressive-gdelt",
```

Add a second assertion inside that test:

```ts
    const aggressiveFranceSources = aiLawNewsSourceConfigs.filter((source) =>
      [
        "news-france-legal-press-newsapi",
        "news-france-tech-policy-newsapi",
        "news-france-general-press-newsapi",
        "news-france-eu-policy-newsapi",
        "news-france-sector-press-newsapi",
        "news-france-aggressive-gdelt",
      ].includes(source.id),
    );

    expect(aggressiveFranceSources.every((source) => !source.official)).toBe(true);
    expect(
      aggressiveFranceSources.every((source) =>
        source.notes.toLowerCase().includes("never legal authority"),
      ),
    ).toBe(true);
```

- [ ] **Step 2: Run the failing public config test**

Run: `npm test -- --run src/content/ai-regulation/news.test.ts`

Expected: FAIL because the new public source configs are missing.

- [ ] **Step 3: Add the public source configs**

In `src/content/ai-regulation/news-sources.ts`, add six config objects after `news-france-major-press-newsapi` and before `news-france-gdelt-discovery`. Use the same names, URLs, coverage families, and non-official metadata as Task 3.

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
  "Discovery-only metadata lane for fast France AI legal-news monitoring. Never legal authority without official-source confirmation.",
```

For `news-france-aggressive-gdelt`, use:

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
  "Broad GDELT fallback for France AI legal-news monitoring. Never legal authority without official-source confirmation.",
```

- [ ] **Step 4: Run the public config test**

Run: `npm test -- --run src/content/ai-regulation/news.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/ai-regulation/news-sources.ts src/content/ai-regulation/news.test.ts
git commit -m "feat(france): expose aggressive legal news sources"
```

---

### Task 5: Verify End-to-End Source Alignment and Document Handoff

**Files:**
- Modify: `AI_TASKS.md`

**Interfaces:**
- Consumes all new source IDs from Tasks 1-4.
- Produces a handoff entry recording the France aggressive legal-news radar.

- [ ] **Step 1: Run targeted verification**

Run:

```bash
npm test -- --run src/agents/ai-regulation/franceLegalNewsAgent.test.ts src/agents/ai-regulation/scanProfiles.test.ts src/db/seed/seed-profiles.test.ts src/content/ai-regulation/news.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm test
npm run lint
npm run typecheck
$env:ADMIN_USERNAME='local-build-admin'; $env:ADMIN_PASSWORD='local-build-password-not-default'; npm run build
```

Expected:
- `npm test`: PASS.
- `npm run lint`: PASS, except any pre-existing unrelated UI warning should be reported precisely.
- `npm run typecheck`: PASS.
- `npm run build`: PASS with non-default local admin credentials.

- [ ] **Step 3: Add the handoff**

Add a dated entry near the top of `AI_TASKS.md` under `## Current status`. Keep any existing Claude or Codex entries above or around it intact.

```md
### 2026-07-19 - Codex, France aggressive legal-news radar
- Intent: Expand France AI-law monitoring with aggressive journalistic discovery lanes while preserving official-only authority rules.
- Changed: Added legal-specialist, tech-policy, general/economic press, EU-policy, sector-press, and broad GDELT France media lanes across agent registry, seed sources, and public news-source metadata.
- Guardrails: All media/API lanes remain discovery-only; official confirmation or manual review is required before verified legal authority use.
- Verification: targeted France/scan-profile/seed/news tests PASS; full test/lint/typecheck/build status recorded by implementer.
- Next: Configure/verify `NEWSAPI_API_KEY` in the production worker runtime and monitor GDELT rate limits under the aggressive cadence.
```

- [ ] **Step 4: Commit**

```bash
git add AI_TASKS.md
git commit -m "docs: hand off France aggressive legal news radar"
```

---

## Self-Review

- Spec coverage: Tasks cover agent registry, scan selection, seed data, public metadata, scheduler guidance, publication guardrails, testing, and handoff.
- Placeholder scan: no deferred-work markers or undefined future work appears in task steps.
- Type consistency: all source IDs use `src-fr-*` in runtime/seed and `news-france-*` in public source configs; all registry descriptors use existing `FranceMonitoringSourceDescriptor` fields.
- Isolation: each task has its own tests and commit. The plan does not touch Claude-owned Standards UI files.
