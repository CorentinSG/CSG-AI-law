# Master Improvement Plan — audit 2026-07-20

> Source: full-site multi-agent audit (10 domains, 143 findings, file:line evidence; 12 critical findings adversarially confirmed). Owner directive (2026-07-20): **maximize auto-publication, site runs as automatically as possible** — fail-closed applies only to genuine error states (orphan sources, sandbox data, misconfiguration), never to legitimate official/reputable sources. See DECISIONS.md 2026-07-20 entries.

## Status legend

`DONE` (shipped on main this session) · `OPS` (needs an operator action in a console, no code) · `→CODEX` (backend/DB ownership) · `→CLAUDE` (frontend/UX ownership) · Effort S/M/L/XL.

---

## Wave 0 — shipped 2026-07-20 (Claude Code)

| # | Item | State |
|---|---|---|
| 0.1 | Worktrees excluded from vitest/eslint/tsc — test signal restored (689+ green, lint 0) | DONE |
| 0.2 | `research.test.ts` featured-entry test made invariant-based | DONE |
| 0.3 | Scrapling worker: Bearer auth, SSRF target guard, per-domain rate limit, TLS fallback opt-in; client sends `SCRAPLING_WORKER_TOKEN` | DONE |
| 0.4 | `country_intelligence` public scope = verified/stale only (`getCountryIntelligenceBySlug(slug, {scope})`) | DONE |
| 0.5 | Max-auto policy: reputable media keeps classified levels (`getMediaDomainScore` tier ≠ secondary), `media_reported` live-panel eligible with badge, single `isLivePanelEligible` gate replaces 10 inline filters | DONE |
| 0.6 | Orphan-source fail-closed: null source → `informal_discovery`, citation fallback → `media_source` | DONE |
| 0.7 | Connector fetch timeouts (25s per request, 90s per source via `withSourceScanTimeout`) | DONE |
| 0.8 | Runtime API failures (network/5xx/timeout) counted as scan errors → circuit breaker + alerting see them (`buildApiScanIssueResult`) | DONE |
| 0.9 | `official_fast_scan` profile (CNIL, CURIA, EDPB, Commission, EUR-Lex ×2, Federal Register) + scheduler item `official-fast` at hourly cadence | DONE |
| 0.10 | PISTE token cache (30min) + sandbox fallback opt-in (`PISTE_ALLOW_SANDBOX_FALLBACK`) | DONE |
| 0.11 | Dead-man switch: `/api/health?check=worker` → 503 when worker heartbeat stale; central-scheduler cron drains 2 jobs inline when worker down (`workerAlive`/`fallbackDrain` in response) | DONE |
| 0.12 | `/feed.xml` RSS 2.0 (50 latest published news, ISR 15min) + `alternates.types` announcement | DONE |
| 0.13 | Localized canonicals + hreflang (en/fr/x-default) on country/state/news/[id] templates via `pageAlternates()` (`src/lib/i18n/metadata.ts`) | DONE |
| 0.14 | JSON-LD: Person+WebSite (root), Article (research), NewsArticle with `isBasedOn` (news) | DONE |
| 0.15 | `html lang` stamped per locale (`[lang]/layout.tsx` + `LangAttribute`) | DONE |
| 0.16 | Hub region cards: real per-region DB counts (Europe/US showed the same total) | DONE |
| 0.17 | three.js loaded post-hydration (dynamic ssr:false); portrait `sizes` attr | DONE |
| 0.18 | CI: concurrency, timeouts, weekly schedule, e2e job against production build (`playwright.config` switches to `next start` on CI), `test:coverage` script | DONE |
| 0.19 | Admin copy + README aligned with auto-publication policy (4 stale "never auto-publish / human review mandatory" claims fixed) | DONE |

## Wave 0 ops actions (owner, ~15 minutes, no code)

1. **Railway (scrapling worker service)**: set `SCRAPLING_WORKER_TOKEN=<random 32+ chars>`; optionally `SCRAPLING_ALLOW_INSECURE_SSL_FALLBACK=true` only if an official source genuinely needs it.
2. **Vercel + Railway (scan worker)**: set the SAME `SCRAPLING_WORKER_TOKEN` so the Node client authenticates. Until both are set the scrapling lane 503s (scanner falls back to Firecrawl/static).
3. **Vercel**: set `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true` (crons enqueue, Railway worker drains — stops mid-scan serverless kills). Safe now that the central-scheduler cron has a fallback drain.
4. **Uptime monitor** (free UptimeRobot/BetterStack): ping `https://<site>/api/health?check=worker` hourly, alert on non-200 → silent Railway worker death now pages you.
5. **NewsAPI**: confirm `NEWSAPI_API_KEY` is set on the Railway worker env (the whole media radar is a silent no-op without it).

---

## Wave 1 — Database integrity (→CODEX, 1–2 weeks)

| # | Item | Effort | Notes |
|---|---|---|---|
| 1.1 | **Migration 031**: re-apply the widened `source_references_source_type_check` from 005 (017 recreated the pre-005 CHECK → `government/legislation/policy` inserts violate it in prod and kill the upsert RPC transaction); widen `regulation_sources_source_category_check` to include `official_legal_database` (028 inserts a value 009 forbids) | S | Add both CHECKs to `REQUIRED_SCHEMA_INVARIANTS` |
| 1.2 | **016 damage assessment**: `news_items` + `ai_processing_logs` are `on delete cascade` on raw items; 016 deleted duplicate raws without repointing them. Check prod against a pre-016 backup; write 016bis repointing ALL referencing FKs before any delete | M | Record outcome in DECISIONS.md |
| 1.3 | **Migration runner**: adopt Supabase CLI (`supabase migration up`) + baseline of current prod; migrations become immutable; `DATABASE_URL` (read-only session pooler) in envs; `npm run audit:database-schema` weekly in CI | M | Root cause of every drift so far |
| 1.4 | RLS + service-role policies on the 7 bare tables (`regulation_scan_logs`, `ai_processing_logs`, `source_references`, `verification_attempts`, `review_events`, `data_quality_findings`, `source_health_checks`) | S | Same pattern as migration 015 |
| 1.5 | **Unified dedup module**: one `normalizeUrl`, content hash normalized (case/whitespace) WITHOUT `sourceId`; cross-source index `(normalized_url, content_hash)`; index on `raw_regulatory_items(raw_url)`; table-driven tests from the historical duplicate incident | M | The ~90% dupes root cause |
| 1.6 | Apply `evaluatePublicationEligibility` at creation when `status === "published"` (pipeline + backfills currently bypass the gate that only guards transitions) | M | Keep max-auto: the gate checks citations/official source, not human review |
| 1.7 | Zod-validate `sourceReferences`/`VerificationMetadata` at read time (safe defaults; prevents `assessCitationQuality` crashes on partial JSON) | S | |
| 1.8 | Real verification events: verification record (URL fetched, HTTP status, content hash, timestamp, verifier=job) required for `verified*` labels; wire the recurring verification pass to write them | L | Until then labels overpromise |
| 1.9 | Retention: pg_cron purge (scan/ingestion/health logs 90d; `html_snapshot` after processing); lease → dedicated columns on `scan_jobs` (`lease_token`, `lease_heartbeat_at` + partial index) | M | |
| 1.10 | Bounded reads: paginate `listRegulatoryUpdates`/`listDistinctFilterValues` (PostgREST silently truncates at 1000) ; `listQueuedScanJobs` repository method (`status='queued' ORDER BY created_at ASC`) to fix queue starvation beyond the 100-job window | M | |
| 1.11 | Backups: schedule `backup-supabase.ps1` (GitHub Action + secret), extend `$CriticalTables` to audit tables, quarterly `verify-backup-restore.ps1` | S | |
| 1.12 | Single source of truth for `regulation_sources` = TS seeds + idempotent upsert script; SQL migrations reserved for schema (020/022/023/027 URL repairs currently fight the seeds) | M | Record in DECISIONS.md |
| 1.13 | OpenAI real cost accounting: read `response.usage`, set `max_tokens`, budget check on real monthly spend (today: estimate re-parsed from last 2000 log strings, no output cap) | M | |
| 1.14 | Remove (or make loudly alerting) the in-memory "legacy" fallbacks in supabase-repository that silently swallowed audit writes during the 003/007/011 drift | S | |
| 1.15 | Taxonomy: add `Court decision` to `developmentTypes`, `Case law` to `authorityTypes` (+backfill); fix Justia-sourced Park v Kim / Mata v Avianca typed `court`+`verified_official_source` → re-source to ca2.uscourts.gov or re-type `tracker` | M | |

## Wave 2 — Monitoring reach (→CODEX pipeline, →CLAUDE pages, 2–3 weeks)

| # | Item | Effort |
|---|---|---|
| 2.1 | Merge the `france-aggressive-news-radar` worktree (6 press lanes) + seed + news-sources; add AI_TASKS row | M |
| 2.2 | Wire per-country live/verification profiles into the central scheduler (start: `france_live_news_scan` + `france_verification_scan`) — today 27 profiles are never executed | M |
| 2.3 | Honor `scanFrequency` at selection time (Federal Register declared `every_6_hours`, runs daily; weekly pages rescanned daily) | S |
| 2.4 | Retry-with-jitter for transient 502/503/504/DNS before counting a failure; don't double backoff on a single blip | S |
| 2.5 | Bounded concurrency: 3–5 sources in parallel (never same hostname), batch log inserts; allow concurrent jobs with disjoint profiles | L |
| 2.6 | US states real coverage: seed 4 lanes for CO, TX, CA, IL, UT, WA, VA, CT, FL, MA; `LiveLegalIntelligencePanel` on US pages (→CLAUDE); then activate LOCUS | L |
| 2.7 | Generated `a[href]` catch-all sources (66 DPA/gov shells): route to `needs_review` until real selectors/RSS verified (config.requiresReview) — max-auto applies to *verified* lanes, not scraped nav links | M |
| 2.8 | Fix `src-council-europe-ai` vs `src-council-of-europe-ai` mismatch + test that every registry sourceId exists in seed | S |
| 2.9 | UK complete (legislation.gov.uk API, DSIT, BAILII), then Canada/Japan/Korea/Singapore/Brazil via the factory | L/XL |
| 2.10 | End-to-end latency metric (detected→published per source) surfaced in admin operations; SLO: <60min for official-fast lanes | M |
| 2.11 | Mark declarative `euMemberStateSourceMandates` entries `aspirational — not wired` in type + admin UI (or convert to real seeded sources) | S |

## Wave 3 — Scale architecture (→CODEX+CLAUDE, parallélisable)

| # | Item | Effort |
|---|---|---|
| 3.1 | Migrate the 9 hand-written country agents to the factory (decide the 2 confirmed divergences first: `assessNewsCurrentness` descriptor, scan strategy). Deletes ~2,300 duplicated lines | L |
| 3.2 | Generic per-country scan profiles (4 profiles × countrySlug param) replacing the 37-literal union; ids derived from the jurisdiction registry | L |
| 3.3 | Dynamic cron route `/api/cron/ai-regulation-scan/[country]` (replaces 9 cloned routes) + drop legacy vercel.json country crons after parity check | M |
| 3.4 | Single CLI `run-country-scan.ts --country --profile` (replaces 30 scripts); archive executed one-shot backfills out of package.json | M |
| 3.5 | Extract domain service `reviewWorkflow.transitionStatus` (publication rules coded once, repositories become CRUD; kills the memory/supabase duplication) | L |
| 3.6 | Split `supabase-repository.ts` (2,611 lines) by aggregate; drop the 292-line `updateRepository` rename façade | L |
| 3.7 | Generalize the France Country Console to all countries: `getCountryLiveIntelligence(slug)` lookup, one template, kill the 2,959-line page's 9 per-slug ternaries + legacy layout + public ops jargon ("Live target", "status 200") | L (→CLAUDE) |

## Wave 4 — Front i18n/SEO/credibility (→CLAUDE)

| # | Item | Effort |
|---|---|---|
| 4.1 | Real i18n by audience order: hub `/ai-regulation` → explorer/news cards → country/state chrome; one pattern (dictionaries); no hardcoded UI literals | XL |
| 4.2 | Sticky locale: pass `lang` through hub tabs, ⌘K search, breadcrumbs (make prop required); kill 307-per-click navigation | M |
| 4.3 | `/legal-notice` (LCEN), `/privacy` (RGPD), "Attorney Advertising" notice, `/about` (bar admission, parcours) — **content from owner, never invented**; domain email replaces Gmail | M |
| 4.4 | Dynamic sitemap (published news + updates, real lastModified); drop `/news` redirect entry; `<h1>` on the 78 country/state pages (SectionHeading `as` prop) | M |
| 4.5 | Above-the-fold content visible without JS (CSS keyframes instead of framer opacity:0); lightweight search index (~230KB of country profiles currently in every page's bundle) | M |
| 4.6 | A11y: AA contrast on legal metadata (white/60 floor), skip-link, ⌘K focus trap, ledger notes accessible on tap | M |
| 4.7 | DB explorer honesty: "searching N of M entries" + server-side search via existing cursor filters; fix 15 dead search anchors; unified nav (International + Practice Areas in header/footer, mobile hamburger on home) | M |
| 4.8 | OG images (static brand + dynamic per research/news via ImageResponse); `twitter:summary_large_image` | S |
| 4.9 | Fix mixed FR/EN hardcoded strings in `live-legal-intelligence-panel.tsx` (franglais on EN pages) | S |

## Wave 5 — Distribution & product

| # | Item | Effort |
|---|---|---|
| 5.1 | Weekly newsletter (digest of published items + editorial note; Buttondown/Resend) | M |
| 5.2 | Jurisdiction comparator (2–3 profiles side-by-side from existing baselines) | M |
| 5.3 | Per-region feeds (`/feed/europe.xml`…), CSV export of the explorer | S |
| 5.4 | Editorial cadence: publishedAt visible on /research list, dynamic "latest note" block on home, decide forthcoming notes' fate | S |
| 5.5 | Full README product rewrite (still describes an "MVP" without case law/editorial; 15+ stale human-review claims remain in low-stakes sections) | M |

## Wave 6 — Test hardening (→CODEX)

| # | Item | Effort |
|---|---|---|
| 6.1 | Postgres-éphémère integration job (service container): apply all migrations, exercise real RPCs (upsert idempotent, lease CAS, publication gate) — the incident class that already hit prod has no net today | L |
| 6.2 | pytest + ruff + CI job for scrapling_worker (auth, URL guard, rate limit, SSL fallback are now pure functions); pin requirements | S |
| 6.3 | Coverage thresholds on `src/db` + `src/agents/ai-regulation/processors` after first measurement | S |
| 6.4 | Vitest default timeout 10–15s (currently 60s hides hangs) | S |
| 6.5 | @testing-library/react for the 5–6 logic-bearing components (explorer filtering, live panel states) | M |
