# GitHub Actions Monitoring

`legal-monitoring.yml` replaces the expired Railway queue worker and Scrapling
sidecar. GitHub Actions runs it at minutes 7, 22, 37, and 52 of every hour.
Each run starts a local Scrapling worker, queues the central monitoring
schedule, drains the Supabase scan queue, and exits after its first empty
cycle. Concurrent production runs queue rather than cancel one another.

## Setup

Add these required repository secrets before enabling the workflow:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The workflow validates those names before it starts the worker and never
prints their values. These optional repository secrets enable their respective
connectors when present; leaving any of them unset is supported:

- `NEWSAPI_API_KEY`
- `FIRECRAWL_API_KEY`
- `COURTLISTENER_API_KEY`
- `LEGIFRANCE_PISTE_CLIENT_ID`
- `LEGIFRANCE_PISTE_CLIENT_SECRET`
- `JUDILIBRE_API_KEYID`
- `EURLEX_USERNAME`
- `EURLEX_PASSWORD`
- `ALERT_WEBHOOK_URL`

Do not add `OPENAI_API_KEY` to this workflow. It runs with
`AI_ENABLE_PROCESSING=false`.

The workflow generates `SCRAPLING_WORKER_TOKEN` at runtime, shares it only
with the local gunicorn process and the Node worker environment, and does not
store or print it. The token protects Scrapling's extraction endpoints; its
health endpoint remains open for startup probing. Scrapling binds only to
`127.0.0.1:8765`; the Node worker uses
`SCRAPLING_WORKER_URL=http://127.0.0.1:8765` for that run.

## Manual Dispatch

In GitHub, open **Actions**, select **Legal Monitoring**, choose **Run
workflow**, and run it from the production branch. The run uses the same
secrets and settings as the schedule.

## Health Semantics

Scheduled workers write a completed heartbeat with their expected interval.
Health reports that worker as idle and alive until the expected 15-minute
interval plus a five-minute grace period expires. A fresh heartbeat therefore
means the scheduled worker completed its latest run; it does not imply a
continuously running process. Failed runs and stale completed heartbeats are
unhealthy.

## Rollback

Disable the **Legal Monitoring** workflow in GitHub to stop new scheduled
runs. To restore a continuously running worker, deploy the previous worker
runtime with `SCAN_JOB_WORKER_MODE=continuous` and its existing persistent
worker configuration. Remove or disable the GitHub workflow before doing so
to prevent simultaneous workers from contending for queue leases.
