# Monitoring Reliability Repair

## Goal

Make monitoring health truthful and verifiable across scheduling, queue
processing, ingestion connectors, and local release checks. A green status must
mean useful work occurred, not merely that a process returned without throwing.

## Scope

### Scan outcome semantics

- A scan job is `succeeded` only when its configured profile resolves to at
  least one active source and no material execution failure occurs.
- A profile resolving to zero active sources is reported as
  `partial_success`, with a machine-readable configuration warning.
- A job with successful ingestion plus non-fatal source failures is
  `partial_success`.
- Summary counters and the persisted job status must be derived from the same
  outcome object so they cannot contradict each other.

### Connector verification

- Run one live Firecrawl ingestion through the existing orchestration path.
- Confirm Scrapling remains operational with a legal-source extraction.
- Verify NewsAPI and Judilibre capability from the Railway worker runtime.
- Existing credentials may be propagated securely between configured runtime
  environments. Missing credentials will be reported as operator blockers and
  will never be invented, logged, or committed.

### Release hygiene

- Fix the three current JSX lint errors in Claude's uncommitted pages without
  changing layout or copy meaning.
- Run the local production build with non-default temporary admin credentials;
  do not weaken the production credential guard.

## Implementation Boundaries

- Preserve the existing Vercel cron, Supabase queue, and Railway worker
  architecture.
- Add focused regression tests before changing scan outcome behavior.
- Avoid schema changes unless investigation proves the existing job summary
  cannot represent the required warning.
- Do not modify unrelated UI work or overwrite Claude's changes.

## Verification

1. Regression tests demonstrate the old contradictory outcomes and fail before
   the fix.
2. Targeted tests pass after each minimal correction.
3. Full `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`
   pass with safe temporary build credentials.
4. Public routes and `/api/health` remain healthy.
5. A queued real-source job is drained by Railway and receives a truthful final
   status and summary.
6. Scrapling extraction succeeds live.
7. Firecrawl receives a live E2E result, or is explicitly marked blocked by a
   missing/invalid runtime credential.

## Success Criteria

- No successful scan profile silently processes zero sources.
- No persisted failed job reports zero failures without an explanatory warning.
- Connector readiness claims are backed by a live runtime test.
- The current working tree passes the complete release verification sequence,
  except for explicitly documented external credential blockers.
