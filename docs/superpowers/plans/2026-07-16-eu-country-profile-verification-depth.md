# EU Country Profile Verification Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `country_profile_unverified` warnings country by country using official sources for competent-authority status, market surveillance, notifying authorities, case law, and AI Act implementation anchors.

**Architecture:** Update the existing static Europe country profile dataset with verified official source records and more precise caveats. Do not upgrade a country to "competent authority designated" unless an official designation source names the authority; use Commission AI Act pages to document absence/pending state where applicable.

**Tech Stack:** TypeScript content dataset, Vitest, Next.js build.

## Global Constraints

- Official-source only for durable legal database profile upgrades.
- Serious media can support live news, but not verified legal authority.
- Do not edit Claude-owned frontend files currently dirty in the working tree.
- Do not claim final AI Act national competent authority, market-surveillance authority, or notifying authority unless official sources identify it.
- Keep AI/cost controls unchanged.

---

### Task 1: Austria And Belgium Source-Depth Upgrade

**Files:**
- Modify: `src/content/ai-regulation/europe-member-state-implementation.ts`
- Test: `src/content/ai-regulation/europe-country-profiles.test.ts`

**Interfaces:**
- Consumes: `CountrySourceRecord`, `sourceReferenceFromCountrySource()`.
- Produces: updated Austria/Belgium profiles with official case-law sources and sharper authority-designation warnings.

- [x] **Step 1: Add official sources**

Add:
- Austria RIS as official legislation/case-law source.
- Belgium FPS Economy AI Act page as official implementation-coordination source.
- Belgium JUPORTAL as official public case-law source.
- European Commission market-surveillance/SPOC list as supporting source for pending/blank AI Act MSA status for Austria/Belgium.

- [x] **Step 2: Update Austria profile**

Attach RIS as a case-law source, add Commission market-surveillance list as supporting source, and replace broad "no case-law source verified" with "no AI-specific case-law item reviewed yet; official RIS case-law search source attached."

- [x] **Step 3: Update Belgium profile**

Attach FPS Economy AI Act page, JUPORTAL, and Commission market-surveillance list. Record FPS Economy as implementation coordinator, not final NCA. Replace broad warnings with precise pending-designation caveats.

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- src/content/ai-regulation/europe-country-profiles.test.ts
npm run typecheck
npm run lint
```

### Task 2: Runtime Backfill

**Files:**
- No additional code expected.

**Interfaces:**
- Consumes: existing `backfill:country-baselines` and readiness script.
- Produces: updated Supabase country profile data.

- [ ] **Step 1: Run focused backfill for Austria and Belgium**

Run:

```bash
npm run backfill:country-baselines -- --countries=austria,belgium
```

- [ ] **Step 2: Re-run readiness**

Run:

```bash
npm run ops:eu-monitoring-reliability -- --dry-run --limit=8
```

### Task 3: Handoff

**Files:**
- Modify: `AI_TASKS.md`

**Interfaces:**
- Consumes: verification output.
- Produces: one Codex handoff entry.

- [ ] **Step 1: Add handoff entry**

Record the exact files, graph anchors, tests, and remaining next countries.

- [ ] **Step 2: Commit and push**

Commit only Codex-owned content/script/docs files.
