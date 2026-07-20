# DECISIONS.md

## Purpose

Record only major project decisions that future agents must know.

## Decisions

- 2026-07-20 — Max-auto publication confirmed by owner: publish as much as possible automatically; manual review is the exception, not the rule. Reputable-media items (Reuters/Politico/Le Monde tier via `getMediaDomainScore`) keep their classified importance/confidence and surface in the public live panels with the explicit "official source pending" badge (`isLivePanelEligible` in `live-intelligence.ts` is THE single live-panel gate — never re-add inline filters). Fail-closed applies only to genuine error states: unresolvable source records map to `informal_discovery` (never official), GDELT/informal lanes stay non-public. Do not propose restoring mandatory human review.

- 2026-07-20 — Connector runtime failures (network/DNS/timeout/HTTP 5xx) are scan **errors** (`buildApiScanIssueResult`), so backoff, circuit breaker, and alerting can see a dead official API; missing credentials and 4xx query rejections stay non-fatal warnings. PISTE sandbox fallback is opt-in via `PISTE_ALLOW_SANDBOX_FALLBACK=true` — DILA sandbox data must never silently enter an auto-publishing pipeline.

- 2026-07-20 — The Scrapling worker requires `SCRAPLING_WORKER_TOKEN` (Bearer, constant-time) and refuses private/loopback/internal targets; insecure-TLS fallback is opt-in. It was previously a public SSRF proxy. Ops must set the token on Railway (worker) AND on the Node side (Vercel + Railway scan worker) — until then the scrapling lane returns 503 and the scanner falls back to Firecrawl/static.

- 2026-07-20 — Git worktrees (`.worktrees/`, `.claude/worktrees/`) are permanently excluded from vitest/eslint/tsc collection. The verification sequence is trustworthy again (689+ tests, ~12s); never run it from a state where worktree files are collected.

- 2026-06-20 — Legal-database canonical sort order is three-axis: (1) nature of the source (`authorityType`: Binding law → … → Other), (2) region of application, (3) legal area (AI-law domain). Admin exposes it as a sortable/filterable table at `/admin/ai-regulation/legal-database`; public country pages will expose the same axes as facet filters + full-text (non-AI) search. `authorityType` is to become a first-class indexed DB column (Codex) instead of the derived `authority:*` tag; `deriveUpdateAuthorityType` stays the fallback until then. Smart search stays plain full-text per the "AI disabled by default" cost rule — no embeddings.

- 2026-06-19 - Publication policy changed: legal news may auto-publish from serious/reputable sources or multi-source corroboration; country/state legal database entries may auto-publish from official sources. Discovery-only or weak sources remain admin-only. Do not restore a blanket human-review gate.

- 2026-06-10 — Agent coordination moved to AGENTS.md + AI_TASKS.md + DECISIONS.md. AGENT_COORDINATION.md and PROJECT_LOGBOOK.md are frozen archives; do not append to them.
- 2026-06-10 — Agent observability uses a custom in-repo harness (`src/agents/harness/`): JSON trace schema, heuristic failure reports, side-effect-free replay, regression tests grown from real failures. Traces are local JSON under gitignored `.agent-traces/`; structured data piggybacks on existing scan-log messages (`failure_report=`), no new tables. No Opik/LangSmith/OTel for now — low call volume and legal-content privacy don't justify a third-party tracing service; revisit if AI processing is enabled at scale.
- 2026-06-10 — Fix policy for agent failures: production failures never auto-modify code. Reports are propose-only, human approval is required, and every applied fix must include verification steps and (when deterministic) a regression test.

## Rules

- Add a decision only when it affects architecture, data model, security, deployment, or product direction.
- Do not record routine progress.
- Do not record long debates.
- Keep each decision under 8 lines.
- Do not use this file to justify every implementation detail.
