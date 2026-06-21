# DECISIONS.md

## Purpose

Record only major project decisions that future agents must know.

## Decisions

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
