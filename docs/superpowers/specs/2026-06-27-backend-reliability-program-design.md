# Backend Reliability Program

## Objective

Make the backend dependable across three dimensions:

1. No silent loss or corruption of monitoring data.
2. High legal-data accuracy with complete provenance.
3. Continuous operation with automatic recovery from ordinary failures.

The monthly infrastructure budget is USD 0 where possible and USD 5 maximum.
The system may require manual intervention when a free-tier provider suspends
or exhausts its service.

## Existing Architecture

- Next.js API and cron routes run on Vercel.
- Supabase Postgres is the system of record.
- A permanent Railway worker drains `scan_jobs`.
- Native connectors, RSS/static ingestion, Firecrawl, and a Scrapling sidecar
  collect source material.
- AI processing enriches collected material but must remain optional and
  cost-controlled.
- Public legal data and legal news are derived from reviewed or eligible
  records with source provenance.

This program preserves that architecture. It strengthens its contracts and
failure handling rather than replacing it.

## Reliability Contracts

### Job processing

- Every job has one durable identity and one authoritative final outcome.
- Claiming, retrying, and completing jobs is idempotent.
- Expired leases can be recovered without producing duplicate records.
- A successful profile must resolve to at least one active source.
- Mixed outcomes are `partial_success`, not `succeeded`.
- Summaries and persisted statuses derive from the same outcome object.
- Permanently failed work remains inspectable and manually replayable.

### Data integrity

- Every legal record includes jurisdiction, source URL, source authority,
  retrieval time, legal area, authority type, and verification status.
- Official identifiers and citations are required where the issuing authority
  provides them.
- Content and canonical identifiers prevent duplicate ingestion.
- Updates are auditable; destructive replacement is avoided.
- Database constraints enforce invariants that cannot safely depend only on
  application code.

### Connector resilience

- All network calls have explicit timeouts and bounded retries.
- Retries use backoff and respect provider rate limits.
- Repeated provider failures open a temporary circuit breaker.
- Fallback methods are recorded and never misrepresented as official API data.
- Credential readiness and quota failures are visible to operations.
- AI unavailability never prevents raw official-source collection.

### Publication integrity

- Official-source legal database records may publish automatically when
  provenance and required metadata pass validation.
- Reputable or corroborated legal news may publish according to the standing
  policy.
- Weak, discovery-only, contradictory, or incomplete material remains private.
- Every automated publication decision records the rule and evidence used.

### Health and recovery

- Health reporting separates infrastructure availability, worker activity,
  connector readiness, data freshness, and legal coverage.
- A daily audit checks stale sources, failed jobs, missing citations,
  jurisdiction gaps, and publication-policy violations.
- Free Discord or email alerts report actionable failures without secrets.
- Logical backups are generated and restoration is tested.
- Manual recovery instructions cover free-tier suspension and provider outage.

## Delivery Phases

### Phase 1: Operational truth

- Repair contradictory job statuses and summaries.
- Report zero-source profiles as configuration failures.
- Make idle worker liveness distinguishable from a dead worker.
- Establish stable operational metrics and regression tests.

### Phase 2: Durable data

- Audit migrations, constraints, indexes, RLS, and repository transactions.
- Add missing idempotency and provenance guarantees.
- Verify duplicate prevention under concurrent ingestion.
- Add a low-cost logical backup and documented restoration test.

### Phase 3: Resilient ingestion

- Standardize timeout, retry, rate-limit, and circuit-breaker behavior.
- Exercise every configured connector through its real runtime path.
- Record connector method, fallback, latency, and failure class.
- Remove unsupported readiness claims.

### Phase 4: Legal accuracy

- Validate authority type, jurisdiction, legal area, dates, official
  identifiers, citations, and source authority.
- Strengthen case-law and soft-law validation.
- Add cross-source corroboration records for news.
- Continuously measure coverage for every EU country and US jurisdiction.

### Phase 5: Security and observability

- Audit authentication, authorization, secret handling, rate limits, and audit
  logs.
- Expand health and aggregation endpoints without exposing secrets.
- Add actionable alerts and admin operational rollups.
- Keep AI budget enforcement and default-off behavior intact.

### Phase 6: Failure exercises

Automated or controlled tests will cover:

- worker interruption during a job;
- expired lease and job replay;
- duplicate concurrent ingestion;
- provider timeout, quota exhaustion, and invalid credentials;
- Scrapling or Firecrawl outage;
- database migration mismatch;
- malformed or incomplete legal source data;
- backup restoration;
- AI provider outage with continued raw ingestion.

## Ownership

### Codex

- Database and repository guarantees.
- Queue, scheduler, worker, and connector reliability.
- Backend security and observability.
- Failure-injection and recovery tests.

### Claude Code

- Admin presentation of the new health dimensions.
- Operational workflows and error visibility.
- UX for replay, remediation, and coverage gaps.

### Operator

- Create or authorize external accounts and credentials.
- Upgrade a provider only if free-tier limits become operationally unacceptable.
- Perform provider-level recovery that cannot be automated.

## Cost Controls

- Reuse Vercel, Supabase, and Railway free or existing tiers.
- Prefer scheduled audits over continuously running additional services.
- Use database-backed queueing already present in the project.
- Use Discord/email webhooks for alerts.
- Avoid new paid observability vendors.
- Preserve AI token, item, and monthly-budget limits.
- Any proposed recurring expense requires operator approval.

## Verification Gates

Every phase requires:

- focused regression tests written before behavior changes;
- full unit/integration test suite;
- lint and TypeScript checks;
- production build with safe temporary credentials;
- controlled end-to-end verification;
- updated operational documentation and coordination handoff.

The program is complete only when:

- health status cannot be green while required work is silently skipped;
- jobs recover safely from interruption;
- legal records have enforceable provenance and citation guarantees;
- every claimed connector has current live evidence or an explicit blocker;
- backup restoration has been demonstrated;
- production alerts identify actionable failures;
- all checks pass without weakening security or cost controls.

## Explicit Limitations

- A USD 5 ceiling cannot provide multi-region redundancy or guaranteed provider
  uptime.
- External API correctness and availability remain outside project control.
- Free-tier suspension may require manual intervention.
- Legal accuracy is improved through provenance and validation but does not
  replace professional legal review where judgment is required.
