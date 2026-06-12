# Agent harness

Minimal self-repair loop for agent runs:
**failure -> trace -> root cause -> proposed fix -> replay -> regression test.**

- `trace.ts` - `AgentRunTrace` schema + `createTrace`/`addStep`/`finishTrace`. Secrets are redacted by key name. Save traces as JSON under `.agent-traces/` (gitignored) when debugging.
- `failure.ts` - `buildFailureReport(trace)` returns a structured report (kind, root-cause hypothesis, impacted step, next action). `failure_report=` log messages follow the existing `ai_result=` scan-log convention. Fix policy is hard-coded: propose only, human approval required, every fix needs verification steps.
- `replay.ts` - `replayTrace(trace, runner)` reruns the recorded input through a caller-supplied, side-effect-free runner and reports `fixed | still-failing | output-changed | unchanged`. Output comparison is key-order-stable so harmless object-order drift does not create false deltas.
- `runners.ts` - built-in deterministic replay runners. Today: `relevance_filter`, `ai_classifier`, `deadline_extractor`, `obligation_extractor`, `ai_summarizer`, `ai_planning_batch`, `scan_diagnostics_messages`, `scan_status_derivation`, and `deduplicator_hash`. Future deterministic runners should register here.
- `regression.ts` - reusable regression-case schema + executor. Real failures can now become JSON fixtures tied to a built-in runner instead of only ad hoc hand-written tests.
- `regressions/` - regression coverage. `fixtures/*.json` are replayable deterministic cases; `harness-regressions.test.ts` executes them. The older example in `relevance-misclassification.regression.test.ts` still documents the narrative format when a hand-written test is clearer.

CLI: `npx tsx scripts/replay-failure.ts <trace.json> [--write-regression <path>] [--title <title>]`

- Prints the failure report.
- Auto-selects a built-in deterministic replay runner when available.
- Can emit a reusable regression fixture JSON for future deterministic replay.

Future work (not built, by design):

- additional deterministic replay runners beyond the current local heuristic stages
- replay adapters for more parser/classification stages
- any external observability tool (see `DECISIONS.md`)
