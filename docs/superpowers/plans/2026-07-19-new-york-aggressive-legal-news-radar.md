# New York Aggressive Legal News Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand New York AI-law monitoring into an aggressive legal/news discovery radar while keeping official New York, NYC, court, legislature, and CourtListener sources as the authority layer.

**Architecture:** Reuse the France/EU aggressive radar pattern for a state/city/federal-litigation jurisdiction. Add New York-specific media-discovery lanes to the existing New York source registry, seed rows, and public news metadata. Official New York sources remain baseline/verification authority; new media/API lanes are live-discovery only.

**Tech Stack:** Next.js, TypeScript, Vitest, Supabase seed dataset, existing NewsAPI/GDELT API connector paths.

## Global Constraints

- No changes to Claude-owned Standards UI files: `src/components/site/standards-explorer.tsx`, `src/components/site/authority-spectrum.tsx`, `src/app/[lang]/standards/page.tsx`.
- Press, law-firm, and API-discovered articles are discovery-only unless an existing publication rule explicitly allows them as news items.
- No press or commentary item can create or upgrade a legal database entry to verified authority without an official URL, CourtListener/court source, agency source, legislature source, or manual review.
- Paywalled or restricted outlets may contribute metadata leads only; do not scrape or reproduce protected article text.
- `NEWSAPI_API_KEY` improves speed; GDELT remains the keyless fallback.
- No guarantee of true real-time coverage if the deployment scheduler cannot run at five-minute cadence.
- No expansion to all US states in this implementation; New York is the state/city/federal-litigation model.

---

## File Structure

- Modify `src/agents/ai-regulation/usMonitoringAgentDefinitions.ts`: New York-specific media source descriptors.
- Modify `src/agents/ai-regulation/newYorkAiLawWatch.test.ts`: New York registry/seed tests.
- Modify `src/db/seed/ai-regulation-seed.ts`: Supabase source rows for aggressive New York discovery lanes.
- Modify `src/db/seed/seed-profiles.test.ts`: seed guardrail tests for aggressive New York rows.
- Modify `src/content/ai-regulation/news-sources.ts`: public/admin news-source metadata for New York lanes.
- Modify `src/content/ai-regulation/news.test.ts`: public source config expectations.
- Modify `AI_TASKS.md`: implementation handoff.

---

### Task 1: New York Registry Defines Aggressive Media Lanes

**Files:**
- Modify: `src/agents/ai-regulation/usMonitoringAgentDefinitions.ts`
- Test: `src/agents/ai-regulation/newYorkAiLawWatch.test.ts`

**Interfaces:**
- Consumes: `usStateMonitoringAgentDefinitions`
- Produces additional New York source IDs:
  - `src-us-ny-legal-press-newsapi-ai`
  - `src-us-ny-law-firm-commentary-newsapi-ai`
  - `src-us-ny-local-policy-newsapi-ai`
  - `src-us-ny-business-finance-newsapi-ai`
  - `src-us-ny-tech-platform-newsapi-ai`
  - `src-us-ny-aggressive-gdelt-ai`

- [ ] **Step 1: Write the failing registry test**

In `src/agents/ai-regulation/newYorkAiLawWatch.test.ts`, add:

```ts
  it("adds aggressive New York media discovery lanes without making them authority sources", () => {
    const newYork = usStateMonitoringAgentDefinitions.find(
      (definition) => definition.countryName === "New York",
    );

    const aggressiveMediaIds = [
      "src-us-ny-legal-press-newsapi-ai",
      "src-us-ny-law-firm-commentary-newsapi-ai",
      "src-us-ny-local-policy-newsapi-ai",
      "src-us-ny-business-finance-newsapi-ai",
      "src-us-ny-tech-platform-newsapi-ai",
      "src-us-ny-aggressive-gdelt-ai",
    ];

    expect(newYork?.sourceRegistry.map((source) => source.sourceId)).toEqual(
      expect.arrayContaining(aggressiveMediaIds),
    );

    for (const sourceId of aggressiveMediaIds) {
      const source = newYork?.sourceRegistry.find((entry) => entry.sourceId === sourceId);

      expect(source?.category).toBe("discovery_media_feed");
      expect(source?.recommendedCadence).toBe("every_5_minutes_when_supported");
      expect(source?.liveMonitoringEligible).toBe(true);
      expect(source?.baselineEligible).toBe(false);
      expect(source?.verificationEligible).toBe(false);
      expect(source?.freshHours).toBeLessThanOrEqual(3);
    }
  });
```

- [ ] **Step 2: Run the failing test**

Run: `npm test -- --run src/agents/ai-regulation/newYorkAiLawWatch.test.ts`

Expected: FAIL because the new source IDs are missing.

- [ ] **Step 3: Add registry descriptors**

In `src/agents/ai-regulation/usMonitoringAgentDefinitions.ts`, inside the `if (stateName === "New York")` `sourceRegistry.push(...)` block, append:

```ts
      {
        sourceId: "src-us-ny-legal-press-newsapi-ai",
        label: "New York AI legal press discovery (NewsAPI)",
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
        sourceId: "src-us-ny-law-firm-commentary-newsapi-ai",
        label: "New York AI law-firm commentary discovery (NewsAPI)",
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
        sourceId: "src-us-ny-local-policy-newsapi-ai",
        label: "New York AI local policy press discovery (NewsAPI)",
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
        sourceId: "src-us-ny-business-finance-newsapi-ai",
        label: "New York AI business and finance press discovery (NewsAPI)",
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
        sourceId: "src-us-ny-tech-platform-newsapi-ai",
        label: "New York AI tech and platform press discovery (NewsAPI)",
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
        sourceId: "src-us-ny-aggressive-gdelt-ai",
        label: "New York AI aggressive legal news discovery (GDELT)",
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

- [ ] **Step 4: Run the registry test**

Run: `npm test -- --run src/agents/ai-regulation/newYorkAiLawWatch.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/agents/ai-regulation/usMonitoringAgentDefinitions.ts src/agents/ai-regulation/newYorkAiLawWatch.test.ts
git commit -m "feat(new-york): expand live legal news source registry"
```

---

### Task 2: Seed Supabase Sources for Aggressive New York Lanes

**Files:**
- Modify: `src/db/seed/ai-regulation-seed.ts`
- Modify: `src/db/seed/seed-profiles.test.ts`
- Modify: `src/agents/ai-regulation/newYorkAiLawWatch.test.ts`

**Interfaces:**
- Produces active New York source rows with `id`, `sourceUrl`, `sourceType`, `scanFrequency`, `active`, `reliabilityLevel`, `preferredExtractionMethod`, and `config`.

- [ ] **Step 1: Write the failing seed tests**

In `src/db/seed/seed-profiles.test.ts`, add:

```ts
  it("seeds aggressive New York journalistic discovery sources as metadata-only lanes", () => {
    const dataset = buildSeedDataset("demo");
    const aggressiveNewYorkIds = [
      "src-us-ny-legal-press-newsapi-ai",
      "src-us-ny-law-firm-commentary-newsapi-ai",
      "src-us-ny-local-policy-newsapi-ai",
      "src-us-ny-business-finance-newsapi-ai",
      "src-us-ny-tech-platform-newsapi-ai",
      "src-us-ny-aggressive-gdelt-ai",
    ];

    const sources = dataset.sources.filter((source) =>
      aggressiveNewYorkIds.includes(source.id),
    );

    expect(sources.map((source) => source.id).sort()).toEqual(
      [...aggressiveNewYorkIds].sort(),
    );
    expect(sources.every((source) => source.country === "United States")).toBe(true);
    expect(sources.every((source) => source.jurisdiction === "New York")).toBe(true);
    expect(sources.every((source) => source.region === "North America")).toBe(true);
    expect(sources.every((source) => source.active)).toBe(true);
    expect(sources.every((source) => source.preferredExtractionMethod === "api")).toBe(true);
    expect(sources.every((source) => source.config?.sourceCategory === "media_discovery_source")).toBe(true);
    expect(sources.every((source) => source.config?.metadataOnly === true)).toBe(true);
    expect(sources.every((source) => source.config?.manualReviewRequired === true)).toBe(true);
    expect(sources.every((source) => source.config?.officialConfirmationRequired === true)).toBe(true);
    expect(
      sources.every((source) =>
        source.notes.toLowerCase().includes("legal authority without official-source confirmation"),
      ),
    ).toBe(true);
  });
```

In `src/agents/ai-regulation/newYorkAiLawWatch.test.ts`, update the seed ID expectation to include the six new IDs.

- [ ] **Step 2: Run the failing seed tests**

Run: `npm test -- --run src/db/seed/seed-profiles.test.ts src/agents/ai-regulation/newYorkAiLawWatch.test.ts`

Expected: FAIL because seed rows are missing.

- [ ] **Step 3: Add source seed rows**

In `src/db/seed/ai-regulation-seed.ts`, insert six source rows near the existing New York AI watch sources.

Use this NewsAPI source pattern:

```ts
{
  id: "src-us-ny-legal-press-newsapi-ai",
  name: "New York AI legal press discovery (NewsAPI)",
  jurisdiction: "New York",
  region: "North America",
  country: "United States",
  sourceUrl:
    "https://newsapi.org/v2/everything?q=(%22New%20York%22%20OR%20NYC%20OR%20NYDFS%20OR%20%22Local%20Law%20144%22%20OR%20%22Part%20161%22)%20AND%20(%22artificial%20intelligence%22%20OR%20AI%20OR%20ChatGPT%20OR%20%22automated%20employment%20decision%20tool%22)%20AND%20(court%20OR%20lawsuit%20OR%20sanctions%20OR%20privilege%20OR%20%22work%20product%22%20OR%20regulation%20OR%20guidance)&language=en&sortBy=publishedAt&pageSize=20&domains=law360.com,law.com,bloomberglaw.com,reuters.com,abajournal.com",
  sourceType: "media_source",
  scanFrequency: "hourly",
  active: true,
  lastScannedAt: "2026-07-19T13:00:00.000Z",
  notes:
    "Discovery-only New York legal press lane. Results are metadata-only leads and can never be treated as legal authority without official-source confirmation.",
  reliabilityLevel: "medium",
  preferredExtractionMethod: "api",
  config: {
    apiProvider: "newsapi",
    sourceCategory: "media_discovery_source",
    metadataOnly: true,
    manualReviewRequired: true,
    officialConfirmationRequired: true,
    maxItems: 12,
    allowedDomains: ["law360.com", "law.com", "bloomberglaw.com", "reuters.com", "abajournal.com"],
  },
  createdAt: now,
  updatedAt: now,
}
```

Repeat this pattern for:

```ts
// src-us-ny-law-firm-commentary-newsapi-ai
allowedDomains: ["jdsupra.com", "lexology.com", "natlawreview.com"]

// src-us-ny-local-policy-newsapi-ai
allowedDomains: ["cityandstateny.com", "thecity.nyc", "gothamist.com", "nydailynews.com", "nypost.com", "nytimes.com"]

// src-us-ny-business-finance-newsapi-ai
allowedDomains: ["bloomberg.com", "reuters.com", "insurancejournal.com", "americanbanker.com"]

// src-us-ny-tech-platform-newsapi-ai
allowedDomains: ["techcrunch.com", "theverge.com", "wired.com", "theinformation.com"]
```

For `src-us-ny-aggressive-gdelt-ai`, use:

```ts
sourceUrl:
  "https://api.gdeltproject.org/api/v2/doc/doc?query=(%22New%20York%22%20OR%20NYC%20OR%20NYDFS%20OR%20%22Local%20Law%20144%22%20OR%20%22Part%20161%22%20OR%20%22RAISE%20Act%22)%20near10%20(%22artificial%20intelligence%22%20OR%20AI%20OR%20ChatGPT%20OR%20%22automated%20employment%20decision%20tool%22%20OR%20AEDT%20OR%20biometric%20OR%20privilege%20OR%20%22work%20product%22%20OR%20sanctions)&mode=artlist&format=json&maxrecords=50",
sourceType: "discovery_source",
config: {
  apiProvider: "gdelt",
  sourceCategory: "media_discovery_source",
  metadataOnly: true,
  manualReviewRequired: true,
  officialConfirmationRequired: true,
  maxItems: 20,
}
```

- [ ] **Step 4: Run the seed tests**

Run: `npm test -- --run src/db/seed/seed-profiles.test.ts src/agents/ai-regulation/newYorkAiLawWatch.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/seed/ai-regulation-seed.ts src/db/seed/seed-profiles.test.ts src/agents/ai-regulation/newYorkAiLawWatch.test.ts
git commit -m "feat(db): seed aggressive New York legal news sources"
```

---

### Task 3: Public News Source Metadata Mirrors New York Runtime Sources

**Files:**
- Modify: `src/content/ai-regulation/news-sources.ts`
- Modify: `src/content/ai-regulation/news.test.ts`

**Interfaces:**
- Consumes: `aiLawNewsSourceConfigs`
- Produces public source config IDs:
  - `news-new-york-legal-press-newsapi`
  - `news-new-york-law-firm-commentary-newsapi`
  - `news-new-york-local-policy-newsapi`
  - `news-new-york-business-finance-newsapi`
  - `news-new-york-tech-platform-newsapi`
  - `news-new-york-aggressive-gdelt`

- [ ] **Step 1: Write the failing public config test**

Add a New York source expectation to `src/content/ai-regulation/news.test.ts`:

```ts
  it("includes aggressive New York legal-news source configs as non-authority metadata lanes", () => {
    const aggressiveNewYorkIds = [
      "news-new-york-legal-press-newsapi",
      "news-new-york-law-firm-commentary-newsapi",
      "news-new-york-local-policy-newsapi",
      "news-new-york-business-finance-newsapi",
      "news-new-york-tech-platform-newsapi",
      "news-new-york-aggressive-gdelt",
    ];

    const sources = aiLawNewsSourceConfigs.filter((source) =>
      aggressiveNewYorkIds.includes(source.id),
    );

    expect(sources.map((source) => source.id).sort()).toEqual([...aggressiveNewYorkIds].sort());
    expect(sources.every((source) => !source.official)).toBe(true);
    expect(sources.every((source) => source.region === "North America")).toBe(true);
    expect(sources.every((source) => source.scanFrequency === "hourly")).toBe(true);
    expect(sources.every((source) => source.active)).toBe(true);
    expect(sources.every((source) => source.manualOnly === false)).toBe(true);
    expect(sources.every((source) => source.parserStatus === "ready")).toBe(true);
    expect(
      sources.filter((source) => source.id !== "news-new-york-aggressive-gdelt").every(
        (source) =>
          source.sourceType === "legal_regulatory_press" &&
          source.reliabilityLevel === "reputable_secondary" &&
          source.paywallStatus === "mixed",
      ),
    ).toBe(true);
    expect(sources.find((source) => source.id === "news-new-york-aggressive-gdelt")).toMatchObject({
      sourceType: "informal_discovery_source",
      reliabilityLevel: "informal_discovery",
      paywallStatus: "public",
    });
    expect(
      sources.every((source) =>
        source.notes.toLowerCase().includes("never legal authority"),
      ),
    ).toBe(true);
  });
```

- [ ] **Step 2: Run the failing public config test**

Run: `npm test -- --run src/content/ai-regulation/news.test.ts`

Expected: FAIL because New York configs are missing.

- [ ] **Step 3: Add public source configs**

In `src/content/ai-regulation/news-sources.ts`, add the six public configs near the existing Reuters Legal/manual sources or before France/EU country-specific blocks. Use URLs and family names matching Task 2.

NewsAPI configs must use:

```ts
sourceType: "legal_regulatory_press",
official: false,
reliabilityLevel: "reputable_secondary",
region: "North America",
topicCoverage: ["New York", "AI law", "courts", "AEDT", "NYDFS"],
scanFrequency: "hourly",
active: true,
paywallStatus: "mixed",
scrapingAllowed: true,
manualOnly: false,
lastChecked: checkedAt,
parserStatus: "ready",
notes:
  "Discovery-only metadata lane for fast New York AI legal-news monitoring. Never legal authority without official-source confirmation.",
```

For `news-new-york-aggressive-gdelt`, use `sourceType: "informal_discovery_source"`, `reliabilityLevel: "informal_discovery"`, `paywallStatus: "public"`, and the same never-authority wording.

- [ ] **Step 4: Run the public config test**

Run: `npm test -- --run src/content/ai-regulation/news.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/content/ai-regulation/news-sources.ts src/content/ai-regulation/news.test.ts
git commit -m "feat(new-york): expose aggressive legal news sources"
```

---

### Task 4: Verify New York Source Alignment and Document Handoff

**Files:**
- Modify: `AI_TASKS.md`

**Interfaces:**
- Consumes all new New York source IDs from Tasks 1-3.
- Produces a handoff entry recording the New York aggressive legal-news radar.

- [ ] **Step 1: Run targeted verification**

Run:

```bash
npm test -- --run src/agents/ai-regulation/newYorkAiLawWatch.test.ts src/db/seed/seed-profiles.test.ts src/content/ai-regulation/news.test.ts
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
- `npm test`: PASS unless the existing unrelated `src/content/research.test.ts` featured-entry failure is still present; if present, record it exactly.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build`: PASS with complete local production-guard environment variables.

- [ ] **Step 3: Add the handoff**

Add a dated entry near the top of `AI_TASKS.md` under `## Current status`.

```md
### 2026-07-19 - Codex, New York aggressive legal-news radar
- Intent: Expand New York AI-law monitoring with aggressive legal press, local policy, law-firm commentary, business/finance, tech/platform, and GDELT discovery lanes while preserving official-only authority rules.
- Changed: Added six New York media/API lanes across state agent registry, seed sources, and public news-source metadata.
- Guardrails: All media/API/commentary lanes remain discovery-only and metadata-only; New York court, agency, legislature, CourtListener, or manual-review confirmation is required before verified legal authority use.
- Verification: targeted New York/seed/news tests PASS; full verification status recorded by implementer.
- Next: Configure/verify `NEWSAPI_API_KEY` in the production worker runtime, monitor GDELT rate limits, and do not describe the New York radar as guaranteed real-time unless the deployed scheduler actually runs the five-minute lane.
```

- [ ] **Step 4: Commit**

```bash
git add AI_TASKS.md
git commit -m "docs: hand off New York aggressive legal news radar"
```

---

## Self-Review

- Spec coverage: Tasks cover New York registry, seed data, public metadata, publication guardrails, testing, and handoff.
- Placeholder scan: no deferred-work markers or undefined future work appears in task steps.
- Type consistency: runtime/seed IDs use `src-us-ny-*`; public configs use `news-new-york-*`.
- Isolation: tasks do not touch Claude-owned Standards UI files or expand all US states.
