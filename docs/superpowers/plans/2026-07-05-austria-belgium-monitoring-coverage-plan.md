# Austria and Belgium Monitoring Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all six Austria and Belgium monitoring profiles resolve active, trustworthy sources for official legal data, case law, verification, and country-specific AI legal news.

**Architecture:** Extend the existing country source registries and production seed rather than adding a new ingestion system. Official sources use existing structured API/static connectors; NewsAPI and GDELT remain discovery-only; profile tests and controlled scans prove runtime behavior.

**Tech Stack:** TypeScript, Vitest, existing scan profiles/connectors, Supabase seed/upsert, Railway worker, Scrapling fallback.

## Global Constraints

- Do not modify migrations `003`, `013`, `016`, or Claude Code's deduplication work.
- Do not add a paid service or recurring infrastructure cost.
- Official legal data and media discovery must remain distinct.
- A media item cannot become legal authority without an official source.
- Preserve existing AI cost controls and publication policy.
- Write each regression test before production code and observe RED.
- Do not print or commit credentials.

---

### Task 1: Registry Contracts

**Files:**
- Modify: `src/agents/ai-regulation/austriaNewsSources.ts`
- Modify: `src/agents/ai-regulation/belgiumNewsSources.ts`
- Modify: `src/agents/ai-regulation/scanProfiles.test.ts`

**Interfaces:**
- Consumes: existing `AustriaMonitoringSourceDescriptor` and `BelgiumMonitoringSourceDescriptor`
- Produces: official/live/verification source ID sets for all six profiles

- [ ] **Step 1: Write failing profile tests**

Add tests asserting:

```ts
expect(getAustriaAgentSourceIds("austria_official_legal_scan")).toEqual(
  expect.arrayContaining([
    "src-at-dsb-ai",
    "src-at-ris-ai-law",
    "src-at-ris-ai-case-law",
    "src-at-rtr-ai",
  ]),
);
expect(getAustriaAgentSourceIds("austria_verification_scan").length).toBeGreaterThanOrEqual(2);
expect(getBelgiumAgentSourceIds("belgium_official_legal_scan")).toEqual(
  expect.arrayContaining([
    "src-be-apd-ai",
    "src-be-justel-ai-law",
    "src-be-courts-ai",
    "src-be-digitalbelgium-ai",
  ]),
);
expect(getBelgiumAgentSourceIds("belgium_verification_scan").length).toBeGreaterThanOrEqual(2);
```

Also prove official profiles exclude `newsapi` and `gdelt`.

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm test -- src/agents/ai-regulation/scanProfiles.test.ts
```

Expected: new RIS/Justel/court IDs are absent and both verification profiles are empty.

- [ ] **Step 3: Extend the registries**

Add official legislation and court descriptors and mark high-authority official
sources `verificationEligible: true`. Keep NewsAPI/GDELT
`baselineEligible: false` and `verificationEligible: true` only as
corroboration sources.

- [ ] **Step 4: Verify GREEN**

Run the focused test and expect all profile tests to pass.

- [ ] **Step 5: Commit**

```powershell
git add src/agents/ai-regulation/austriaNewsSources.ts src/agents/ai-regulation/belgiumNewsSources.ts src/agents/ai-regulation/scanProfiles.test.ts
git commit -m "feat(monitoring): complete Austria Belgium profile contracts"
```

---

### Task 2: Active Production Seed Sources

**Files:**
- Modify: `src/db/seed/ai-regulation-seed.ts`
- Create: `src/db/seed/austria-belgium-sources.test.ts`

**Interfaces:**
- Consumes: source IDs from Task 1
- Produces: active `RegulationSource` records in `regulationSourcesSeed`

- [ ] **Step 1: Write a failing seed synchronization test**

For every registry ID, require one active seed record. Assert official sources
have `reliabilityLevel: "high"` and are not `media_source` or
`discovery_source`; assert NewsAPI/GDELT sources have `apiProvider` and
discovery semantics.

- [ ] **Step 2: Verify RED**

```powershell
npm test -- src/db/seed/austria-belgium-sources.test.ts
```

Expected: registry source IDs are missing from the production seed.

- [ ] **Step 3: Add active source records**

Add:

```text
Austria: src-at-dsb-ai, src-at-ris-ai-law, src-at-ris-ai-case-law,
src-at-rtr-ai, src-at-digital-austria-ai, src-at-newsapi-ai, src-at-gdelt-ai
Belgium: src-be-apd-ai, src-be-justel-ai-law, src-be-courts-ai,
src-be-digitalbelgium-ai, src-be-ai4belgium, src-be-newsapi-ai, src-be-gdelt-ai
```

Use official URLs and existing connector modes. Each source must include
country-specific AI/legal terms, bounded `maxItems`, and editorial notes
preserving authority distinctions.

- [ ] **Step 4: Verify GREEN**

Run the seed and profile tests together.

- [ ] **Step 5: Commit**

```powershell
git add src/db/seed/ai-regulation-seed.ts src/db/seed/austria-belgium-sources.test.ts
git commit -m "feat(monitoring): seed Austria Belgium legal sources"
```

---

### Task 3: Country-Relevance and News Quality

**Files:**
- Modify: `src/agents/ai-regulation/austriaLegalNewsAgent.test.ts`
- Modify: `src/agents/ai-regulation/belgiumLegalNewsAgent.test.ts`
- Modify only if RED requires it: `src/agents/ai-regulation/austriaLegalNewsAgent.ts`
- Modify only if RED requires it: `src/agents/ai-regulation/belgiumLegalNewsAgent.ts`

**Interfaces:**
- Consumes: raw candidates from official/static/API connectors
- Produces: country-relevant AI legal candidates and rejects unrelated news

- [ ] **Step 1: Add failing relevance tests**

Test positive and negative candidates:

```text
Austria positive: KI-VO, DSGVO, AMS algorithm, DSB/RTR, RIS court decision
Belgium positive: AI Act, APD/GBA, automated decisions, Justel, Belgian courts
Negative: generic national technology/business news with no legal signal
```

Assert media candidates remain discovery-only.

- [ ] **Step 2: Verify RED**

Run both agent test files and confirm the missing terms or authority distinction
causes the expected failures.

- [ ] **Step 3: Implement minimal filter changes**

Extend only deterministic country/AI/legal term sets required by the tests.
Do not broaden publication eligibility.

- [ ] **Step 4: Verify GREEN**

Run both agent tests plus `scanProfiles.test.ts`.

- [ ] **Step 5: Commit**

```powershell
git add src/agents/ai-regulation/austriaLegalNewsAgent.ts src/agents/ai-regulation/austriaLegalNewsAgent.test.ts src/agents/ai-regulation/belgiumLegalNewsAgent.ts src/agents/ai-regulation/belgiumLegalNewsAgent.test.ts
git commit -m "test(monitoring): harden Austria Belgium relevance"
```

---

### Task 4: Release Gate and Runtime Proof

**Files:**
- Modify: `AI_TASKS.md`
- Modify: `docs/superpowers/plans/2026-07-05-austria-belgium-monitoring-coverage-plan.md`

**Interfaces:**
- Consumes: Tasks 1-3
- Produces: verified branch, production-seed instructions, and coordination handoff

- [ ] **Step 1: Run the complete local gate**

```powershell
npm test
npm run lint
npm run typecheck
$env:VERCEL_ENV="preview"
$env:ADMIN_USERNAME="build-verifier"
$env:ADMIN_PASSWORD="temporary-build-password-not-for-runtime"
npm run build
```

Expected: all commands pass, allowing only the known `<img>` lint warning.

- [ ] **Step 2: Upsert source records**

Use the repository's existing seed/upsert path with production credentials.
Do not apply or modify database migrations.

- [ ] **Step 3: Queue controlled official scans**

Queue `austria_official_legal_scan` and `belgium_official_legal_scan`. Poll
terminal rows and require:

```ts
expect(resultSummary.sourcesProcessed).toBeGreaterThan(0);
expect(configurationWarnings).not.toContain("scan_profile_resolved_zero_sources");
```

Record external 403/404/parser failures honestly. If missing
`source_references` blocks persistence, profile resolution is still proven but
the final status must remain degraded.

- [ ] **Step 4: Verify health**

Confirm Austria and Belgium are absent from `coverage.zeroSourceProfiles` and
inspect source-health rows for both countries.

- [ ] **Step 5: Handoff and commit**

Update only Codex-owned coordination rows and cite:

- `getAustriaAgentSourceIds()`
- `getBelgiumAgentSourceIds()`
- `selectSourcesForScanProfile()`
- community "Scan Profiles and Country Source Selection"
- community "Data Ingestion Pipeline"

```powershell
git add AI_TASKS.md docs/superpowers/plans/2026-07-05-austria-belgium-monitoring-coverage-plan.md
git commit -m "docs(monitoring): hand off Austria Belgium coverage"
```

## Execution Status

2026-07-05:

- [x] Registry contracts implemented for all six profiles.
- [x] Fourteen active sources added and tested: seven Austria, seven Belgium.
- [x] Official profiles exclude NewsAPI/GDELT; verification profiles combine
  authority and corroboration sources.
- [x] Country-specific AI-plus-legal relevance filters implemented in German,
  French, Dutch, and English.
- [x] DSB and APD listing selectors verified against live pages.
- [x] Production source upsert completed without migration changes.
- [x] Local direct runtime proof: DSB parsed 5 items; APD parsed 8 items.
- [x] Full local gate: 628 tests, lint without errors, typecheck, and preview
  build pass.
- [ ] Production profile proof is blocked before connector execution:
  `service_role` lacks `SELECT` on `public.discovery_leads` (`42501`). This is
  part of Claude Code's existing production schema reconciliation scope.
- [ ] Health proof must be repeated after that grant so Austria and Belgium
  disappear from `coverage.zeroSourceProfiles`.
