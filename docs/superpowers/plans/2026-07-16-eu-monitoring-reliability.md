# EU Monitoring Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve European monitoring reliability by adding a repeatable backend audit/remediation script that ranks weak EU country datasets and selectively queues or runs their scan profiles.

**Architecture:** Reuse the existing country readiness model and scan job queue. The script will read Supabase through `updateRepository`, filter EU member states, rank countries by readiness score and blockers, then either print an action plan or enqueue/run targeted official/legal-news/verification scan profiles.

**Tech Stack:** Next.js 16 repository, TypeScript, `tsx`, Supabase repository layer, Vitest, ESLint.

## Global Constraints

- Do not touch Claude-owned frontend files currently dirty in the working tree.
- Do not weaken publication policy: official source entries may auto-publish; serious/corroborated legal news may publish live; weak discovery remains admin-only.
- Do not print secrets.
- AI processing and cost controls remain unchanged.
- Use graph anchors in handoff: `buildCountryDatabaseReadiness()`, `queueAndDrainScanJob()`, `selectSourcesForScanProfile()`, community "Source Runtime Health", community "Scan Job Management".

---

### Task 1: Add EU Reliability Audit/Remediation Script

**Files:**
- Create: `scripts/improve-eu-monitoring-reliability.ts`
- Modify: `package.json`
- Test: run script in dry-run mode against current environment.

**Interfaces:**
- Consumes: `getCountryDatabaseReadiness()`, `queueAndDrainScanJob()`, EU country names.
- Produces: CLI command `npm run ops:eu-monitoring-reliability -- --dry-run --limit=5`.

- [ ] **Step 1: Implement the script**

Create a TypeScript script that:
- loads `.env.local`;
- builds current country readiness;
- filters EU member states only;
- ranks countries by non-ready status, score, failing sources, and stale scans;
- supports `--dry-run`, `--enqueue-only`, `--run`, `--limit=N`, and `--profiles=official,news,verification`;
- maps country names to existing scan profiles where available;
- prints a compact JSON summary.

- [ ] **Step 2: Add package script**

Add:

```json
"ops:eu-monitoring-reliability": "tsx scripts/improve-eu-monitoring-reliability.ts"
```

- [ ] **Step 3: Verify dry-run**

Run:

```bash
npm run ops:eu-monitoring-reliability -- --dry-run --limit=8
```

Expected: JSON summary with selected countries and planned profiles, no DB mutation.

### Task 2: Execute Controlled Improvement Pass

**Files:**
- No code files expected beyond Task 1.

**Interfaces:**
- Consumes: CLI from Task 1.
- Produces: Supabase `scan_jobs` entries or immediate scan results for weak EU countries.

- [ ] **Step 1: Run dry-run and inspect target list**

Use:

```bash
npm run ops:eu-monitoring-reliability -- --dry-run --limit=5
```

- [ ] **Step 2: Run a conservative pass**

If the target list is coherent, run:

```bash
npm run ops:eu-monitoring-reliability -- --enqueue-only --limit=5 --profiles=official,news
```

Expected: queued jobs for weak EU countries with source-backed profiles.

- [ ] **Step 3: Re-check health**

Run:

```bash
Invoke-WebRequest -UseBasicParsing https://csg-ai-law.vercel.app/api/health
```

Expected: health remains OK; worker heartbeat alive.

### Task 3: Verification And Handoff

**Files:**
- Modify: `AI_TASKS.md`
- Optional modify: `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md`

**Interfaces:**
- Consumes: verification output.
- Produces: one Codex handoff entry.

- [ ] **Step 1: Run verification**

Run:

```bash
npm run typecheck
npm run lint
npm test -- src/lib/country-database-readiness.test.ts src/agents/ai-regulation/scheduler/index.test.ts
```

- [ ] **Step 2: Update handoff**

Add one entry to `AI_TASKS.md` describing the script, run mode, and verification.

- [ ] **Step 3: Commit**

Commit only Codex-owned backend/script/docs files.
