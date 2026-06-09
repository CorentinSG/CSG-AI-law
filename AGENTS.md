<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes, APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Agent Working Rules

## Mandatory first step

Before making any non-trivial change, read:

- `AI_AGENT_MASTER_CONTEXT.md`
- `PROJECT_LOGBOOK.md`
- `AGENT_COORDINATION.md` before any multi-agent or overlapping work
- relevant README or docs for the touched area

Do not start coding before understanding the current architecture, constraints, and recent phase history.

For concurrent or sequential multi-agent work, agents must read and obey `AGENT_COORDINATION.md` before claiming or starting a non-trivial task.

## Core behavior

Follow these principles:

1. Think before coding.
   - State assumptions.
   - Surface ambiguity.
   - Do not silently choose an interpretation when the request is unclear.
   - Push back if the requested implementation is risky, overbroad, or inconsistent with the project.

2. Simplicity first.
   - Implement the smallest correct solution.
   - Do not add speculative features.
   - Do not create abstractions unless they are clearly needed.
   - Avoid overengineering.

3. Surgical changes.
   - Touch only files directly relevant to the task.
   - Do not refactor unrelated code.
   - Do not change formatting, comments, naming, or architecture outside the scope of the request.
   - Every changed line must be traceable to the user’s task.

4. Goal-driven execution.
   - Convert the task into clear success criteria.
   - Prefer tests or verification commands whenever possible.
   - Loop until the criteria are satisfied or clearly explain what blocks completion.

## Project-specific rules

This project is `C. Saint-Girons, Esq — AI Law & Legal Intelligence`.

The site must not be centered only around the AI Regulation Monitor. The monitor is one feature among others. The broader site includes Corentin’s professional identity, blog/editorial analysis, legal AI commentary, and future educational/training sections.

Do not invent:

- academic publications
- speaking engagements
- legal research
- publication dates
- professional achievements
- source-backed claims that are not actually supported

For legal/news/regulatory content:

- Prefer official sources.
- Distinguish binding law, proposed law, regulation, agency guidance, enforcement action, soft law, technical standard, governance framework, policy report, best practice, commentary, and other.
- Do not auto-publish legal updates.
- Preserve human review before public publication.
- Public pages must only expose published items.
- Admin/review workflows must remain protected.
- Current legal/news claims must be source-backed and should not be fabricated.

For AI processing:

- AI processing must remain disabled by default unless explicitly instructed otherwise.
- Do not weaken cost controls.
- Do not remove token limits, scan limits, or monthly budget limits.
- Never expose API keys or secrets.

## Verification

Before declaring completion, run the relevant verification commands.

Default project verification sequence when code changes are meaningful:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```
