# Country Monitoring Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every monitored country measurable through a backend readiness score, controlled backfill runner, and admin operations summary.

**Architecture:** Add a pure backend scoring module that aggregates regulation sources, source runtime health, regulatory updates, news items, and country intelligence into one per-country readiness matrix. Add a script that uses the same source data to backfill stale or empty countries with cost-safe scans. Wire the readiness matrix into `buildAdminOperationsSummary()` so Claude can render it in the admin UI without reimplementing backend logic.

**Tech Stack:** Next.js 16, TypeScript, Supabase repository layer, Vitest, existing scan pipeline.

## Global Constraints

- AI processing remains disabled by default and must be explicitly opted into.
- No secrets in repo; runtime keys stay in Vercel/Railway/Supabase env vars.
- Legal database entries can auto-publish only when backed by official sources.
- Legal news can auto-publish only for reputable/corroborated sources.
- Keep changes backend-focused; Claude owns UI rendering.

---

### Task 1: Country Readiness Scoring

**Files:**
- Create: `src/lib/country-database-readiness.ts`
- Test: `src/lib/country-database-readiness.test.ts`

**Interfaces:**
- Produces: `buildCountryDatabaseReadiness(input): CountryDatabaseReadinessReport`
- Produces: `getCountryDatabaseReadiness(options?): Promise<CountryDatabaseReadinessReport>`
- Consumes: `updateRepository.getSources()`, `getSourceRuntimeHealthSummaries()`, `updateRepository.listRegulatoryUpdates()`, `updateRepository.listNewsItems()`, `updateRepository.listCountryIntelligence()`

- [ ] Write tests for green, warning, and blocked country readiness.
- [ ] Implement source grouping and score calculation.
- [ ] Verify with targeted Vitest.

### Task 2: Admin Operations Integration

**Files:**
- Modify: `src/lib/admin-operations-summary.ts`
- Modify: `src/lib/admin-operations-summary.test.ts`

**Interfaces:**
- Consumes: `getCountryDatabaseReadiness()`
- Adds: `summary.operations.countryReadiness`

- [ ] Mock `getCountryDatabaseReadiness()` in the existing admin summary test.
- [ ] Add summary counts and top blockers.
- [ ] Verify targeted tests.

### Task 3: Controlled Country Backfill Runner

**Files:**
- Create: `scripts/backfill-country-baselines.ts`
- Modify: `package.json`

**Interfaces:**
- Uses: `getCountryDatabaseReadiness()`
- Uses: `runAiRegulationScan(sourceId, { trigger, scanProfile })`
- Env controls: `COUNTRY_BACKFILL_COUNTRIES`, `COUNTRY_BACKFILL_MAX_SOURCES`, `COUNTRY_BACKFILL_DRY_RUN`, `COUNTRY_BACKFILL_INCLUDE_MEDIA`

- [ ] Select sources from countries with low readiness.
- [ ] Default to dry-run and official/regulator/court/parliament sources.
- [ ] Respect cadence by using the existing scan pipeline.
- [ ] Verify dry-run locally.

### Task 4: Source Fix Documentation And Handoff

**Files:**
- Modify: `AI_TASKS.md`

**Interfaces:**
- Handoff references: `buildCountryDatabaseReadiness()`, `getCountryDatabaseReadiness()`, `sourceScanner`, community "Source Runtime Health", community "Scan Pipeline".

- [ ] Record known blocker `src-bg-government-ai`.
- [ ] Record missing credential blockers for NewsAPI/Firecrawl proof.
- [ ] Record verification commands.
