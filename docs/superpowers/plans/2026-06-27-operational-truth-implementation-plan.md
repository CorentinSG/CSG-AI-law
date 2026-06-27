# Operational Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scan-job outcomes, worker health, and connector readiness report what the production system actually accomplished.

**Architecture:** Introduce one pure outcome evaluator used by both persisted status and result summary, then expose its machine-readable warnings through existing health/operations paths. Preserve the Vercel cron, Supabase queue, Railway worker, and current schema.

**Tech Stack:** TypeScript, Vitest, Next.js 16, Supabase/Postgres, Railway worker.

## Global Constraints

- Monthly infrastructure cost remains USD 0 where possible and USD 5 maximum.
- Do not weaken authentication, publication policy, AI defaults, or AI cost controls.
- Do not overwrite Claude Code's uncommitted UI work.
- Write each regression test first and observe the expected failure.
- Do not expose, print, or commit credentials.

---

### Task 1: Authoritative Scan Outcome

**Files:**
- Modify: `src/agents/ai-regulation/processors/scanJobs.ts`
- Test: `src/agents/ai-regulation/processors/scanJobs.test.ts`

**Interfaces:**
- Consumes: `Awaited<ReturnType<typeof runAiRegulationScan>>`
- Produces: `evaluateScanJobOutcome(result, requestedProfile)` returning `{ status, summary, errorMessage }`

- [ ] **Step 1: Write failing tests for empty and mixed results**

Add tests proving:

```ts
it("marks a profiled scan with no source results as partial_success", async () => {
  runAiRegulationScan.mockResolvedValue([]);
  // queue and process a job with scanProfile
  expect(processed?.job.status).toBe("partial_success");
  expect(processed?.job.resultSummary).toMatchObject({
    sourcesProcessed: 0,
    configurationWarnings: ["scan_profile_resolved_zero_sources"],
  });
});

it("uses partial_success when successful and failed source results are mixed", async () => {
  runAiRegulationScan.mockResolvedValue([
    makeScanResult()[0],
    { ...makeScanResult()[0], sourceId: "src-failed", status: "failed" },
  ]);
  expect(processed?.job.status).toBe("partial_success");
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/agents/ai-regulation/processors/scanJobs.test.ts
```

Expected: the empty-result job is incorrectly `succeeded`, and mixed results are incorrectly `failed`.

- [ ] **Step 3: Implement the pure evaluator**

Replace separate status/summary derivation with one evaluator:

```ts
type ScanJobOutcome = {
  status: ScanJob["status"];
  summary: Record<string, unknown>;
  errorMessage: string | null;
};

function evaluateScanJobOutcome(
  result: Awaited<ReturnType<typeof runAiRegulationScan>>,
  requestedProfile?: ScanProfileId,
): ScanJobOutcome {
  const summary = summarizeJobResult(result);
  const statuses = new Set(result.map((entry) => entry.status));
  const configurationWarnings: string[] = [];

  if (requestedProfile && result.length === 0) {
    configurationWarnings.push("scan_profile_resolved_zero_sources");
  }

  const status =
    configurationWarnings.length > 0 ||
    statuses.has("partial_success") ||
    (statuses.has("success") && statuses.has("failed"))
      ? "partial_success"
      : statuses.has("failed")
        ? "failed"
        : "succeeded";

  return {
    status,
    summary: { ...summary, configurationWarnings },
    errorMessage:
      configurationWarnings.length > 0
        ? `Scan profile ${requestedProfile} resolved to zero active sources.`
        : null,
  };
}
```

Use the returned status, summary, and error message in the single `updateScanJob` call.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/agents/ai-regulation/processors/scanJobs.test.ts
```

Expected: all scan-job tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/agents/ai-regulation/processors/scanJobs.ts src/agents/ai-regulation/processors/scanJobs.test.ts
git commit -m "fix(monitoring): make scan outcomes authoritative"
```

---

### Task 2: Explain Failed Jobs Consistently

**Files:**
- Modify: `src/agents/ai-regulation/processors/scanJobs.ts`
- Test: `src/agents/ai-regulation/processors/scanJobs.test.ts`
- Modify: `src/lib/alerting.ts`
- Test: `src/lib/alerting.test.ts`

**Interfaces:**
- Consumes: `ScanJobOutcome`
- Produces: persisted `failureReasons: string[]` and alert text using the same reasons

- [ ] **Step 1: Write a failing regression test**

```ts
it("persists at least one failure reason whenever final status is failed", async () => {
  runAiRegulationScan.mockResolvedValue([
    { ...makeScanResult()[0], status: "failed", processingFailures: 0, errors: ["HTTP 503"] },
  ]);
  expect(processed?.job.resultSummary).toMatchObject({
    failureReasons: ["HTTP 503"],
  });
  expect(processed?.job.errorMessage).toBe("HTTP 503");
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/agents/ai-regulation/processors/scanJobs.test.ts src/lib/alerting.test.ts
```

Expected: failure reason is absent from the persisted summary.

- [ ] **Step 3: Derive reasons from source outcomes**

Extend `evaluateScanJobOutcome`:

```ts
const failureReasons = result.flatMap((entry) =>
  entry.status === "failed"
    ? entry.errors.length > 0
      ? entry.errors
      : [`source_failed:${entry.sourceId}`]
    : [],
);
```

Persist `failureReasons`, use the first reason as `errorMessage`, and make alert formatting prefer this array.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/agents/ai-regulation/processors/scanJobs.test.ts src/lib/alerting.test.ts
```

Expected: both files pass.

- [ ] **Step 5: Commit**

```bash
git add src/agents/ai-regulation/processors/scanJobs.ts src/agents/ai-regulation/processors/scanJobs.test.ts src/lib/alerting.ts src/lib/alerting.test.ts
git commit -m "fix(monitoring): persist actionable scan failures"
```

---

### Task 3: Truthful Worker and Data Health

**Files:**
- Modify: `src/lib/health.ts`
- Test: `src/lib/health.test.ts`
- Modify: `src/lib/admin-operations-summary.ts`
- Test: `src/lib/admin-operations-summary.test.ts`

**Interfaces:**
- Consumes: recent `ScanJob[]`, source runtime summaries, connector capabilities
- Produces: health dimensions `infrastructure`, `worker`, `dataFreshness`, `coverage`

- [ ] **Step 1: Write failing health tests**

```ts
it("does not report healthy coverage when the newest successful profile processed zero sources", () => {
  const snapshot = buildHealthSnapshot(/* zero-source partial job */);
  expect(snapshot.ok).toBe(false);
  expect(snapshot.coverage.state).toBe("degraded");
});

it("treats a recent idle worker activity as alive without requiring an active heartbeat", () => {
  expect(snapshot.worker.state).toBe("idle");
  expect(snapshot.worker.alive).toBe(true);
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/health.test.ts src/lib/admin-operations-summary.test.ts
```

Expected: coverage/alive dimensions do not yet exist or are incorrectly derived.

- [ ] **Step 3: Add explicit dimensions**

Derive:

```ts
coverage: {
  state: zeroSourceProfiles.length > 0 ? "degraded" : "healthy",
  zeroSourceProfiles,
},
worker: {
  ...existingWorker,
  alive: existingWorker.state === "running" || recentLastActivity,
},
```

Include these fields in the existing admin operations aggregation without loading additional full tables.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/health.test.ts src/lib/admin-operations-summary.test.ts
```

Expected: health tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/health.ts src/lib/health.test.ts src/lib/admin-operations-summary.ts src/lib/admin-operations-summary.test.ts
git commit -m "feat(ops): expose truthful worker and coverage health"
```

---

### Task 4: Runtime Connector Evidence

**Files:**
- Modify: `src/agents/ai-regulation/agentApiCapabilities.ts`
- Test: `src/agents/ai-regulation/agentApiCapabilities.test.ts`
- Create: `scripts/verify-ingestion-runtime.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: configured environment variable names and existing ingestion clients
- Produces: redacted JSON verification report and `npm run verify:ingestion-runtime`

- [ ] **Step 1: Write failing capability tests**

```ts
it("distinguishes configured from live_verified connector state", () => {
  const capability = listAgentApiCapabilities(env).find((item) => item.id === "firecrawl");
  expect(capability?.verificationState).toBe("configured_unverified");
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/agents/ai-regulation/agentApiCapabilities.test.ts
```

Expected: `verificationState` is absent.

- [ ] **Step 3: Add verification metadata and script**

Add:

```ts
verificationState:
  missingEnvVars.length > 0 ? "blocked" : "configured_unverified"
```

The script must:

- test Scrapling `/health` and one legal-source extraction;
- test one Firecrawl map/crawl call with a one-page limit;
- perform credential-safe probes for NewsAPI and Judilibre;
- print only provider, status, latency, and sanitized error class;
- exit nonzero when a configured provider fails.

Add:

```json
"verify:ingestion-runtime": "tsx scripts/verify-ingestion-runtime.ts"
```

- [ ] **Step 4: Verify locally and in Railway**

Run:

```bash
npm test -- src/agents/ai-regulation/agentApiCapabilities.test.ts
npm run verify:ingestion-runtime
```

Expected: each provider is `live_verified`, `blocked_missing_credentials`, or `failed`; no secret appears in output.

- [ ] **Step 5: Commit**

```bash
git add src/agents/ai-regulation/agentApiCapabilities.ts src/agents/ai-regulation/agentApiCapabilities.test.ts scripts/verify-ingestion-runtime.ts package.json package-lock.json
git commit -m "feat(ops): verify ingestion connectors at runtime"
```

---

### Task 5: Release Gate and Controlled Production Proof

**Files:**
- Modify only if required by failures: files already owned by Tasks 1-4
- Coordination: `AI_TASKS.md`

**Interfaces:**
- Consumes: all Phase 1 deliverables
- Produces: verified release evidence and a Claude handoff

- [ ] **Step 1: Run the complete local gate**

```bash
npm test
npm run lint
npm run typecheck
$env:VERCEL_ENV="preview"
$env:ADMIN_USERNAME="build-verifier"
$env:ADMIN_PASSWORD="temporary-build-password-not-for-runtime"
npm run build
```

Expected: all commands exit 0. If Claude's uncommitted UI still fails lint, report exact files and do not rewrite the design.

- [ ] **Step 2: Deploy backend commits**

Push the current backend branch and wait for Vercel/Railway deployment readiness. Do not alter production variables except the operator-approved connector credentials.

- [ ] **Step 3: Queue one controlled real-source scan**

Queue a known official source and poll its durable job row until terminal:

```ts
expect(["succeeded", "partial_success", "failed"]).toContain(job.status);
expect(job.resultSummary.sourcesProcessed).toBeGreaterThan(0);
```

- [ ] **Step 4: Verify production surfaces**

Check:

```bash
curl -f https://csg-ai-law.vercel.app/api/health
curl -f https://fantastic-nourishment-production-6d34.up.railway.app/health
```

Confirm Vercel runtime logs contain no new error/fatal events and that the job summary matches its final status.

- [ ] **Step 5: Handoff and commit**

Update only Codex-owned status rows and add one handoff citing:

- `evaluateScanJobOutcome()`
- `buildHealthSnapshot()`
- `listAgentApiCapabilities()`
- community "Scan Job Management"
- community "Source Runtime Health"
- community "Agent API Capabilities"

Then commit:

```bash
git add AI_TASKS.md
git commit -m "docs(ops): hand off operational truth phase"
```
