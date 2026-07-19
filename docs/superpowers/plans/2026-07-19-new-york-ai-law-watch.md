# New York AI Law Watch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or inline TDD execution. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a verified New York AI-law corpus and live monitoring surface.

**Architecture:** Research agents produce non-code reports. The main agent adds tests, content, monitoring descriptors, backfill, docs, Supabase writes and verification.

**Tech Stack:** Next.js, TypeScript, Vitest, Supabase repository layer, CourtListener/RECAP API connector, static-page monitoring.

## Global Constraints

- Do not edit or revert Claude-owned Standards UI files.
- Verified entries require official or authoritative primary URLs.
- Secondary/legal press sources can be documented as discovery leads only.
- Follow existing national-depth backfill patterns.

---

### Task 1: New York Corpus

**Files:**
- Create: `src/content/ai-regulation/new-york-ai-law-depth.test.ts`
- Create: `src/content/ai-regulation/new-york-ai-law-depth.ts`

- [ ] Write failing Vitest coverage for the required New York content families.
- [ ] Run the test and confirm the missing module failure.
- [ ] Add the minimal typed corpus module.
- [ ] Re-run the test and confirm it passes.

### Task 2: Live Source Descriptors

**Files:**
- Create: `src/agents/ai-regulation/newYorkAiLawWatch.test.ts`
- Modify: `src/agents/ai-regulation/usMonitoringAgentDefinitions.ts`

- [ ] Write failing Vitest coverage for NY-specific monitoring source IDs.
- [ ] Run the test and confirm the missing descriptor failure.
- [ ] Extend only the New York state definition with focused monitoring descriptors.
- [ ] Re-run the test and confirm it passes.

### Task 3: Backfill And Docs

**Files:**
- Create: `scripts/backfill-new-york-ai-law-depth.ts`
- Modify: `package.json`
- Modify: `AI_TASKS.md`
- Modify: `PROJECT_LOGBOOK.md`
- Modify: `AI_AGENT_MASTER_CONTEXT.md`

- [ ] Add the idempotent backfill script.
- [ ] Add the package script.
- [ ] Run dry-run.
- [ ] Run live write, replay, and DB count check.
- [ ] Update project docs.
- [ ] Run targeted tests, typecheck, lint, full tests and build.
