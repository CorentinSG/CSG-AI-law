# GitHub Actions Monitoring Verification

Date: 2026-07-26
Owner: Claude Code

## Result

The GitHub Actions replacement for Railway is deployed but not operational.
This is a repository-configuration blocker, not a confirmed worker-code
failure.

## Live Evidence

- The 10 most recent `Legal Monitoring` scheduled runs inspected on
  2026-07-25 all completed with `failure`.
- Run `30169915389` failed at `Validate required Supabase secrets`.
- Its log reported all three required secrets missing:
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY`.
- Scrapling startup and production queue draining were skipped, so neither
  component has been exercised end to end in GitHub Actions yet.
- `https://csg-ai-law.vercel.app/api/health?check=worker` returned HTTP 503.
- The health payload reported `database.reachable: true`, no worker heartbeat,
  and the newest successful scan at `2026-07-22T17:05:42.866Z`.
- Verified run:
  `https://github.com/CorentinSG/CSG-AI-law/actions/runs/30169915389`.

## Recovery And Acceptance

1. Add the three required repository secrets under GitHub Actions. Copy values
   from the authoritative Supabase/Vercel configuration without printing them
   in logs, commits, issues, or chat.
2. Manually dispatch `Legal Monitoring` from `main`.
3. Confirm the secret-validation, Scrapling-startup, and queue-drain steps all
   complete successfully.
4. Confirm the run writes a fresh scheduled-worker heartbeat.
5. Confirm `/api/health?check=worker` returns HTTP 200 during the documented
   freshness window.
6. Confirm at least one successful scan timestamp advances beyond
   `2026-07-22T17:05:42.866Z`.
7. Record the successful run URL and health timestamp in `AI_TASKS.md`.

Do not mark the Railway migration operational before all seven checks pass.
Optional connector secrets can be added after the required Supabase path is
green. Keep `OPENAI_API_KEY` out of this workflow; AI processing remains
disabled.
