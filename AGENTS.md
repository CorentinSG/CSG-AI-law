<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes, APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — shared rules for Claude Code and Codex

Single source of truth for all coding agents. CLAUDE.md imports this file.
Before non-trivial work: check `AI_TASKS.md` (ownership/locks) and `DECISIONS.md` (standing decisions).
`AI_AGENT_MASTER_CONTEXT.md` is the deep architecture reference — consult it when touching unfamiliar areas.
`AGENT_COORDINATION.md` and `PROJECT_LOGBOOK.md` are historical archives; do not append to them.

## Project purpose

Professional site for `C. Saint-Girons, Esq — AI Law & Legal Intelligence`:
professional identity, blog/editorial legal-AI analysis, and an AI Regulation
Monitor (multi-country legal/news ingestion with human review before
publication). The monitor is one feature among others — the site must not be
centered on it alone.

## Tech stack and commands

- Next.js 16 (App Router) + React 19 + TypeScript, Tailwind 4, Framer Motion
- Supabase (Postgres), Zod, Vitest, ESLint 9
- Ingestion: rss-parser, cheerio, Firecrawl; AI processing via OpenAI SDK

```bash
npm run dev          # dev server (dev:stable = 127.0.0.1:3001)
npm test             # vitest run
npm run lint         # eslint .
npm run typecheck    # next typegen && tsc --noEmit
npm run build        # next build
```

Default verification sequence for meaningful code changes: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

## Core coding principles

### Think before coding
- Do not silently assume unclear requirements; state assumptions explicitly.
- If multiple valid interpretations exist, surface them.
- Push back if the requested approach is risky, overcomplicated, or inconsistent with the project.
- Stop and ask if confusion would materially affect implementation.

### Simplicity first
- Minimum code that solves the task; prefer 50 lines over 200.
- No speculative features, no abstractions for one-off logic, no unrequested configurability.

### Surgical changes
- Touch only files and lines required by the task; match existing style.
- Do not refactor, rename, reformat, or "improve" adjacent code.
- Mention discovered dead code in the summary; do not delete it.
- Remove only unused imports/variables/functions created by your own changes.

### Goal-driven execution
- Convert requests into verifiable success criteria.
- Bug fixes: reproduce first when practical. New behavior: define verification. Refactors: verify behavior before and after.
- Run relevant tests/lint/typecheck/build; if verification cannot run, explain why.

## Current publication policy

This section supersedes any older blanket "human review before publication" wording.

- Legal-news sections may auto-publish when the item comes from a serious/reputable legal-regulatory source, an official authority, or is corroborated by multiple sources.
- Country/state legal database entries may auto-publish when the underlying information comes from an official source.
- Discovery-only, weak, informal, or unverified sources stay admin-only until verification.
- Do not reintroduce blanket human-review copy in public pages, admin UI text, tests, or seed data.

## Content and domain rules

- Never invent publications, speaking engagements, research, dates, achievements, or unsupported source-backed claims.
- Prefer official sources; distinguish binding law, proposed law, regulation, guidance, enforcement, soft law, standards, frameworks, policy reports, commentary.
- No auto-publishing of legal updates — human review stays in the loop; public pages expose only published items; admin/review workflows stay protected.
- AI processing stays disabled by default; never weaken cost controls, token limits, scan limits, or monthly budgets.

## Security rules

- Never expose secrets; never commit `.env` files; never add API keys or credentials to the repo.
- Never run destructive database, deployment, or filesystem commands without explicit user approval.
- Never alter production configuration unless explicitly instructed.

## Shared knowledge-graph protocol (Graphify + Obsidian)

This is the default coordination and context layer between Claude Code and Codex. Its purpose is token economy: query the compressed graph instead of grepping raw files, and reference graph nodes in handoffs instead of re-describing code in prose. Local to this machine only (the graph is gitignored); both agents run on the same checkout.

- **Read the graph before exploring code.** Start any non-trivial task by reading `graphify-out/GRAPH_REPORT.md` (god nodes, named communities, import cycles), then narrow with the read commands below. Do not grep/glob the whole repo when the graph can answer — reserve raw search for exact-pattern needs or files newer than the last graph build.
- **Read commands (free, no API key):** `graphify query "<question>"`, `graphify explain "<Node>"`, `graphify path "A" "B"`, `graphify affected "<Node>"` (run before any refactor to see the blast radius). Invoke via `py -m graphify <cmd>` if `graphify` is not on PATH.
- **Reference nodes, not prose.** In `AI_TASKS.md` handoffs and `DECISIONS.md` entries, name the graph nodes/communities you touched (e.g. `getRepositoryMode()`, community "Scan Job Management") so the other agent can `explain`/`affected` them instead of re-reading files. This keeps handoffs short and cheap to act on.
- **Obsidian vault** (`graphify-out/obsidian/`) is the human/visual view of the same graph — one note per node with `[[wikilinks]]`, community tags, and a colored graph view. Open the folder as a vault in Obsidian to navigate visually. Regenerate with `py -m graphify export obsidian` (no LLM).
- **Freshness is automatic.** A git post-commit hook rebuilds `graph.json` (AST-only, async, no cost) and regenerates the Obsidian vault; post-checkout rebuilds too. The vault may trail by one commit — acceptable. Community **renaming** needs an LLM (`graphify cluster-only . --backend openai`) and is NOT automatic; rerun it manually after large refactors if cluster names drift. `GRAPHIFY_SKIP_HOOK=1` skips a rebuild.
- **Rules:** never commit `graphify-out/` (gitignored on purpose); never put an API key in the repo — a semantic rebuild uses a transient key supplied by the operator at run time; treat the graph as read-only navigation, it never changes app code.

## Claude Code + Codex collaboration rules

- Claude Code generally owns: frontend structure, UX, high-level architecture, product flow, large refactors.
- Codex generally owns: backend implementation, APIs, database schema, scripts, tests, focused bug fixes.
- Before editing, check `AI_TASKS.md` for ownership and locked files. Do not edit files assigned to the other agent unless the user explicitly asks.
- Do not use markdown files as chat logs. Keep handoffs under 15 bullet points.
- Do not duplicate instructions already in this file.
- Prefer small, reviewable patches.
- Record major architectural decisions in `DECISIONS.md` (max 8 lines each).
- At the end of any work, summarize changed files, tests run, and remaining risks.

## Coordination protocol (how the two agents stay in sync)

Two separate layers — never mix them. **Code context** = the Graphify graph + Obsidian vault (read-only, navigation, token-cheap). **Project progress** = `AI_TASKS.md` (the single source of truth for who-does-what/status) + `DECISIONS.md` (standing decisions). Do not record progress inside the graph, and do not re-describe code structure in `AI_TASKS.md` when a graph node reference will do.

### Sync ritual — run at the START of every session (≈30s, before touching anything)
0. One-command version: run `pwsh -File agent-sync.ps1` (or `powershell -File agent-sync.ps1`) from the repo root — it does steps 1–2 for you (checks graph freshness, auto-refreshes the AST graph if stale, prints the Status board, and reminds you of the handoff format). Steps 1–2 below are the manual fallback.
1. `git rev-parse --short HEAD` → compare to the "Built from commit" line in `graphify-out/GRAPH_REPORT.md`. If they differ, the graph is stale: run `py -m graphify update .` (free) before relying on it.
2. Read the **Status board** at the top of `AI_TASKS.md` — see open tasks, their owner, and locked files. Do not start work that another agent has `CLAIMED`/`WIP` unless the user reassigns it.
3. For the area you will touch, query the graph (`explain`/`affected`/`path`) instead of grepping.

### Handoff — at the END of every unit of work (mandatory, no exceptions)
1. Update **only your own row(s)** in the Status board (status + branch + date).
2. Add ONE new entry at the top of the `## Current status` log, using the **Handoff entry format** below. Append-only: never edit or delete the other agent's entries.
3. Run the verification sequence and record the result in the entry.

### Handoff entry format (fixed fields, in this order)
```
YYYY-MM-DD · <Agent> · <TASK-ID> · <STATUS>
- Intent: one line — what and why
- Files: paths changed (or "none")
- Graph anchors: exact node/community labels the other agent can `explain`/`affected`
- Verification: test / lint / typecheck / build results (or why not run)
- Branch/commit: <branch> @ <short-sha>
- Next: who owns the next step, or blockers (be explicit)
```

### Status vocabulary (closed set — use these words exactly)
`CLAIMED` (scope reserved, not started) · `WIP` (in progress, working tree) · `BLOCKED` (waiting on something — name it) · `REVIEW` (done locally, awaiting verification/PR) · `DONE-LOCAL` (committed to a branch, not merged) · `MERGED` (in main) · `HANDOFF→<agent>` (explicitly passing the baton).

### Golden rules (these make communication unambiguous)
- One source of truth per fact: progress lives in `AI_TASKS.md`, decisions in `DECISIONS.md`, code structure in the graph. Never duplicate a fact across them.
- Append-only + own-rows-only: you may only change entries/rows you authored.
- Always cite graph nodes by their exact label; if a node does not exist yet (brand-new code), say so and rebuild the graph.
- If you could not run the graph or verification, state it explicitly — silence reads as "done".
- `HANDOFF→` is the only way to pass work; an unstated assumption that the other agent will pick something up does not count.
