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

## Content and domain rules

- Never invent publications, speaking engagements, research, dates, achievements, or unsupported source-backed claims.
- Prefer official sources; distinguish binding law, proposed law, regulation, guidance, enforcement, soft law, standards, frameworks, policy reports, commentary.
- No auto-publishing of legal updates — human review stays in the loop; public pages expose only published items; admin/review workflows stay protected.
- AI processing stays disabled by default; never weaken cost controls, token limits, scan limits, or monthly budgets.

## Security rules

- Never expose secrets; never commit `.env` files; never add API keys or credentials to the repo.
- Never run destructive database, deployment, or filesystem commands without explicit user approval.
- Never alter production configuration unless explicitly instructed.

## Claude Code + Codex collaboration rules

- Claude Code generally owns: frontend structure, UX, high-level architecture, product flow, large refactors.
- Codex generally owns: backend implementation, APIs, database schema, scripts, tests, focused bug fixes.
- Before editing, check `AI_TASKS.md` for ownership and locked files. Do not edit files assigned to the other agent unless the user explicitly asks.
- Do not use markdown files as chat logs. Keep handoffs under 15 bullet points.
- Do not duplicate instructions already in this file.
- Prefer small, reviewable patches.
- Record major architectural decisions in `DECISIONS.md` (max 8 lines each).
- At the end of any work, summarize changed files, tests run, and remaining risks.
