# DECISIONS.md

## Purpose

Record only major project decisions that future agents must know.

## Decisions

- 2026-06-10 — Agent coordination moved to AGENTS.md + AI_TASKS.md + DECISIONS.md. AGENT_COORDINATION.md and PROJECT_LOGBOOK.md are frozen archives; do not append to them.
- 2026-06-10 — Agent observability uses a custom in-repo harness (`src/agents/harness/`): JSON trace schema, heuristic failure reports, side-effect-free replay, regression tests grown from real failures. Traces are local JSON under gitignored `.agent-traces/`; structured data piggybacks on existing scan-log messages (`failure_report=`), no new tables. No Opik/LangSmith/OTel for now — low call volume and legal-content privacy don't justify a third-party tracing service; revisit if AI processing is enabled at scale.
- 2026-06-10 — Fix policy for agent failures: production failures never auto-modify code. Reports are propose-only, human approval is required, and every applied fix must include verification steps and (when deterministic) a regression test.

## Rules

- Add a decision only when it affects architecture, data model, security, deployment, or product direction.
- Do not record routine progress.
- Do not record long debates.
- Keep each decision under 8 lines.
- Do not use this file to justify every implementation detail.
