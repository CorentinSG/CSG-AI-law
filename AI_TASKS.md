# AI_TASKS.md

> **How to use this file (read `AGENTS.md` → "Coordination protocol" for the full rules).**
> This is the single source of truth for project progress. Two layers, never mixed: progress lives here; code structure lives in the Graphify graph / Obsidian vault (query it, do not restate it here).
> Start every session with the **Sync ritual**; end every unit of work with a **Handoff entry**. Append-only, own-rows-only.

## Status board (live — at-a-glance project state)

Each agent edits only its own rows. Status vocabulary: `CLAIMED` · `WIP` · `BLOCKED` · `REVIEW` · `DONE-LOCAL` · `MERGED` · `HANDOFF→<agent>`.

| Task ID | Owner | Status | Branch @ sha | Locked files | Graph anchor | Updated |
|---|---|---|---|---|---|---|
| TOOLING-GRAPH-PROTOCOL | Claude Code | REVIEW | `ops/t-ops9-ux` @ `30bc31c` | `AGENTS.md`, `AI_TASKS.md`, `.gitignore`, `.git/hooks/*` | n/a (tooling, no app code) | 2026-06-20 |
| T-OPS9-UX | Claude Code | WIP | `ops/t-ops9-ux` @ `30bc31c` | `src/app/**`, shared UI components | community "UI Components and Utilities", "Intelligence Hub UI" | 2026-06-20 |
| T-LEGALDB-UI | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `0f2809d` | `src/app/admin/ai-regulation/legal-database/**`, `src/app/admin/ai-regulation/page.tsx` | `deriveUpdateAuthorityType()`, `getAuthorityPriorityRank()`, `FilterBar`, community "News and Regulation Admin" | 2026-06-20 |
| T-LEGALDB-DB | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `cbf3eed` | `src/db/migrations/**`, `src/db/repository-types.ts`, repositories, ingestion agents | `RegulatoryUpdateFilters`, `AiRegulatoryUpdate`, community "DB Repository Layer", "Scan Pipeline" | 2026-06-20 |
| T-ADMIN-DASH | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `0f2809d` | `src/app/admin/page.tsx`, `src/app/admin/ai-regulation/page.tsx` | `listGlobalMonitoringAgents()`, `getSourceRuntimeHealthSummaries()`, `listAgentApiCapabilities()`, community "News and Regulation Admin" | 2026-06-20 |
| T-ADMIN-OPS (P1) | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `0f2809d` | `src/app/admin/operations/**`, `src/components/site/ops-health-band.tsx`, `src/app/admin/page.tsx` | `buildHealthSnapshot()`, `getSourceRuntimeHealthSummaries()`, `listAgentApiCapabilities()`, community "Source Runtime Health" | 2026-06-20 |
| T-ADMIN-OPS-API (P5a) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `e264572` | `src/lib/admin-operations-summary.ts`, `src/app/api/admin/operations/summary/route.ts`, related tests | `buildAdminOperationsSummary()`, `buildHealthSnapshot()`, `getSourceRuntimeHealthSummaries()`, community "Source Runtime Health", community "Admin Authentication" | 2026-06-20 |
| T-BATCH-REVIEW-API (P2a) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `069210e` | `src/lib/admin-review-batch.ts`, `src/app/api/admin/review/batch/route.ts`, related tests | `batchTransitionReviewStatus()`, `listPrioritizedReviewQueue()`, `reviewWorkflow`, community "Admin Authentication", community "Admin Review and Summaries" | 2026-06-21 |
| T-COURTLISTENER-CONNECTOR (P3a) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `155bc08` | `src/agents/ai-regulation/connectors/api-connector.ts`, `src/lib/env.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, tests | `ApiConnector`, `listAgentApiCapabilities()`, community "API Connectors and Legal Docs", community "Agent API Capabilities" | 2026-06-21 |
| T-LEGAL-DATA-HUNTER-CONNECTOR (P3b) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `f78c9e4` | `src/agents/ai-regulation/connectors/api-connector.ts`, `src/lib/env.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, tests | `ApiConnector`, `listAgentApiCapabilities()`, community "API Connectors and Legal Docs", community "Agent API Capabilities" | 2026-06-21 |
| T-CENTRAL-SCHEDULER (P4) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `c8af9d4` | `src/agents/ai-regulation/scheduler/**`, `src/app/api/cron/ai-regulation-central-scheduler/**`, `src/agents/ai-regulation/processors/scanJobs.ts` | `buildCentralMonitoringSchedule()`, `enqueueCentralMonitoringSchedule()`, `queueScanJob()`, community "Scheduler Implementation", community "Scan Job Management" | 2026-06-21 |
| T-WORKER-RAILWAY (P0) | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `ab63d39` | `package.json`, `package-lock.json`, `railway.json`, Railway/Vercel/Supabase runtime config | `drainQueuedScanJobs()`, `createScanWorkerConfig()`, community "Scan Job Management" | 2026-06-22 |
| T-AUDIT-HARDENING | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ `ab63d39` | `src/content/ai-regulation/news.ts`, `src/lib/health.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/lib/admin-review-batch.ts`, related tests | `buildNewsItemFromUpdate()`, `buildHealthSnapshot()`, `listAgentApiCapabilities()`, `listPrioritizedReviewQueue()`, community "Source Runtime Health", community "Admin Review and Summaries" | 2026-06-22 |
| T-DURABLE-DATA | Codex | MERGED | `main` @ `2125242` | migrations 013-015 awaiting production apply; Railway branch repoint awaiting console access | `evaluateSchemaIntegrity()`, `AiRegulationRepository`, `executeClaimedScanJob()`, community "DB Repository Layer", community "Scan Job Management", community "Data Ingestion Pipeline" | 2026-07-04 |
| T-AT-BE-COVERAGE | Codex | MERGED | `main` @ `b7948cf` | production replay blocked only by existing `discovery_leads` service-role grant | `getAustriaAgentSourceIds()`, `getBelgiumAgentSourceIds()`, `selectSourcesForScanProfile()`, community "Community 32" | 2026-07-05 |
| T-IE-NL-SE-COVERAGE | Codex | MERGED | `main` @ `f65331c` | `src/db/seed/ai-regulation-seed.ts`, `src/db/migrations/018_ie_nl_se_monitoring_sources.sql`, `src/db/seed/ireland-netherlands-sweden-sources.test.ts` | `getIrelandAgentSourceIds()`, `getNetherlandsAgentSourceIds()`, `getSwedenAgentSourceIds()`, `selectSourcesForScanProfile()`, `buildHealthSnapshot()` | 2026-07-06 |
| T-REMAINING-EU-COVERAGE | Codex | MERGED | `main` @ `48cdf90` | `src/db/seed/ai-regulation-seed.ts`, `src/db/migrations/019_remaining_eu_member_state_monitoring_sources.sql`, `src/db/migrations/020_remaining_eu_source_url_canonicals.sql`, `src/agents/ai-regulation/remainingEuMemberStateSources.test.ts` | `missingEuMemberStateAgentDefinitions`, `buildDefaultCountrySourceRegistry()`, `createCountryNewsSourceModule()`, community "Scan Pipeline" | 2026-07-09 |
| T-STATIC-SCRAPER-FALLBACK | Codex | MERGED | `main` @ `5dad1a7` | `src/agents/ai-regulation/processors/sourceScanner.ts`, `src/agents/ai-regulation/processors/sourceScanner.test.ts` | `sourceScanner`, `StaticPageConnector`, `scraplingExtract()`, `scrapeUrl()`, community "Scan Pipeline", community "Data Ingestion Pipeline", community "Scrapling Extraction Service" | 2026-07-09 |
| T-SCRAPLING-SSL-FALLBACK | Codex | MERGED | `main` @ `05725b5` | `scrapling_worker/worker.py`, `scrapling_worker/README.md`, `src/agents/ingestion/scraplingClient.ts`, `src/agents/ingestion/scraplingClient.test.ts`, `src/agents/ai-regulation/processors/sourceScanner.ts`, `src/agents/ai-regulation/processors/sourceScanner.test.ts` | `scraplingExtract()`, `sourceScanner`, community "Scrapling Extraction Service", community "Data Ingestion Pipeline", community "Scan Pipeline" | 2026-07-09 |
| T-NON-EU-EUROPE-COVERAGE | Codex | MERGED | `main` @ `f763e26` | `src/db/schema.ts`, `src/db/seed/ai-regulation-seed.ts`, `src/db/migrations/021_non_eu_western_balkan_europe_sources.sql`, `src/agents/ai-regulation/nonEuEuropeAgentDefinitions.ts`, `src/agents/ai-regulation/nonEuEuropeSources.test.ts` | `nonEuEuropeAgentDefinitions`, `buildDefaultCountrySourceRegistry()`, `buildCountryMonitoringSources()`, community "Scan Pipeline", community "DB Repository Layer" | 2026-07-14 |
| T-COUNTRY-MONITORING-RELIABILITY | Codex | MERGED | `main` @ `9ece786` | `src/lib/country-database-readiness.ts`, `scripts/backfill-country-baselines.ts`, `src/lib/admin-operations-summary.ts`, `src/db/seed/ai-regulation-seed.ts`, `src/db/migrations/022_repair_bulgaria_government_ai_source.sql` | `getCountryDatabaseReadiness()`, `buildCountryDatabaseReadiness()`, `buildAdminOperationsSummary()`, `runAiRegulationScan()`, `sourceScanner`, community "Source Runtime Health", community "Scan Pipeline", community "DB Repository Layer" | 2026-07-15 |
| T-PILOT-COUNTRY-DEEP-ENTRIES | Codex | MERGED | `main` @ `56c544f` | `scripts/backfill-pilot-country-deep-entries.ts`, `package.json` | `updateRepository.createRawItem()`, `updateRepository.createUpdate()`, `SourceReference`, community "DB Repository Layer", community "Scan Pipeline" | 2026-07-15 |
| T-WORKER-PERSISTENT-HEARTBEAT | Codex | MERGED | `main` @ `a464cb7` | `scripts/run-scan-job-worker.ts`, `src/lib/health.ts`, `src/lib/health.test.ts` | `buildHealthSnapshot()`, `createScanWorkerConfig()`, `updateRepository.createScanJob()`, `updateRepository.updateScanJob()`, community "Source Runtime Health", community "Scan Job Management" | 2026-07-15 |
| T-OFFICIAL-SOURCE-AUTOPUBLISH-PILOTS | Codex | MERGED | `main` @ `b67fa42` | `scripts/backfill-pilot-country-deep-entries.ts` | `evaluatePublicationEligibility()`, `updateRepository.updateReviewStatus()`, community "DB Repository Layer", community "Scan Pipeline" | 2026-07-15 |
| T-EU-DEEP-ENTRIES-WAVE-2 | Codex | MERGED | `main` @ `be880ec` | `scripts/backfill-pilot-country-deep-entries.ts`, `package.json` | `backfill-pilot-country-deep-entries.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline" | 2026-07-15 |
| T-EU-OFFICIAL-WAVE-3 | Codex | MERGED | `main` @ `4fbab00` | `scripts/backfill-eu-official-wave3.ts`, `src/agents/ai-regulation/dataSteward.test.ts`, `package.json` | `backfill-eu-official-wave3.ts`, `dataSteward.test.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline", community "Data Quality Assessment" | 2026-07-15 |
| T-EU-OFFICIAL-WAVE-4 | Codex | MERGED | `main` @ `0ae9d4b` | `scripts/backfill-eu-official-wave4.ts`, `package.json` | `backfill-eu-official-wave4.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline" | 2026-07-15 |
| T-EU-OFFICIAL-WAVE-5 | Codex | MERGED | `main` @ `d31686b` | `scripts/backfill-eu-official-wave5.ts`, `package.json` | `backfill-eu-official-wave5.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline" | 2026-07-15 |
| T-EU-OFFICIAL-WAVE-6 | Codex | MERGED | `main` @ `4df13d9` | `scripts/backfill-eu-official-wave6.ts`, `package.json` | `backfill-eu-official-wave6.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline" | 2026-07-15 |
| T-EU-DEPTH-WAVE-7 | Codex | MERGED | `main` @ `8ca3ecd` | `scripts/backfill-eu-depth-wave7.ts`, `package.json` | `backfill-eu-depth-wave7.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline" | 2026-07-15 |
| T-EU-DEPTH-WAVE-8 | Codex | MERGED | `main` @ `7c6bc28` | `scripts/backfill-eu-depth-wave8.ts`, `package.json` | `backfill-eu-depth-wave8.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline" | 2026-07-15 |
| T-EU-DEPTH-WAVE-9 | Codex | MERGED | `main` @ `07a2b72` | `scripts/backfill-eu-depth-wave9.ts`, `package.json` | `backfill-eu-depth-wave9.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline" | 2026-07-16 |
| T-CRON-AUTH-CI | Codex | MERGED | `main` @ `230c8e3` | `src/lib/cron-auth.test.ts` | `getCronAuthStatus()`, community "Admin Authentication" | 2026-07-15 |
| T-REVIEW-BACKLOG-REDUCTION | Codex | MERGED | `main` @ `9df039e` | `scripts/reduce-review-backlog.ts`, `package.json` | `evaluatePublicationEligibility()`, `updateRepository.updateReviewStatus()`, community "Admin Review and Summaries", community "DB Repository Layer" | 2026-07-15 |
| T-US-LOCUS-DISCOVERY | Codex | MERGED | `main` @ `e8a1b24` | `src/agents/ai-regulation/usLocusDiscovery.ts`, `src/agents/ai-regulation/usLocusDiscovery.test.ts`, `README.md`, `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md`, `docs/superpowers/plans/2026-07-15-locus-us-discovery-corpus.md` | `buildLocusDiscoveryLead()`, `DiscoveryLead`, community "Scan Pipeline", community "DB Repository Layer" | 2026-07-16 |
| T-NEWS-BACKFILL-INTEGRITY | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ working tree | `src/content/ai-regulation/news.ts`, `src/lib/news-backfill.ts`, `scripts/backfill-news-items.ts`, `src/db/seed/seed-profiles.ts`, related tests | `buildNewsItemFromUpdate()`, `backfillNewsItemsFromUpdates()`, `buildLegalDatabaseIntegrityReport()`, community "News and Regulation Admin", community "DB Repository Layer" | 2026-06-22 |
| T-INGESTION-RUNTIME | Codex | DONE-LOCAL | `ops/t-ops9-ux` @ working tree | `src/agents/ingestion/**`, `scrapling_worker/**`, `src/agents/ai-regulation/agentApiCapabilities.ts` | `scraplingExtract()`, `firecrawlService.ts`, `listAgentApiCapabilities()`, community "Data Ingestion Pipeline", community "Scrapling Extraction Service", community "Agent API Capabilities" | 2026-06-22 |
| T-BATCH-REVIEW-UI (P2b) | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `0f2809d` | `src/app/admin/ai-regulation/review/**`, `src/app/admin/ai-regulation/actions.ts`, `src/app/admin/page.tsx` | `listPrioritizedReviewQueue()`, `batchTransitionReviewStatus()`, `bulkUpdateReviewStatus`, community "Admin Review and Summaries" | 2026-06-21 |
| T-BUILD-FIX | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `bf0d746` | `src/app/page.tsx`, `src/components/site/update-card.tsx` | `UpdateCard`, community "UI Components and Visual Elements" | 2026-06-21 |
| T-E2E (P6) | Claude Code | DONE-LOCAL | `ops/t-ops9-ux` @ `aa0346c` | `playwright.config.ts`, `e2e/**`, `vitest.config.ts`, `package.json`, `.gitignore` | n/a (test harness) | 2026-06-21 |
| COWORK-A-F | Cowork (Claude) | DONE-LOCAL | working tree (uncommitted) | none | community "Scan Pipeline", "DB Repository Layer", "Intelligence Hub UI" | 2026-06-20 |

- **Graph freshness:** built from `30bc31ca` — in sync with HEAD `30bc31c`. If these diverge, run `py -m graphify update .` before trusting the graph.
- Move a task to `MERGED` only once it is in `main`; delete its row one entry after it merges (the log keeps the history).

## Handoff entry format (copy this for every new log entry below)

```
YYYY-MM-DD · <Agent> · <TASK-ID> · <STATUS>
- Intent:        one line — what and why
- Files:         paths changed (or "none")
- Graph anchors: exact node/community labels for `explain`/`affected`
- Verification:  test / lint / typecheck / build (or why not run)
- Branch/commit: <branch> @ <short-sha>
- Next:          who owns the next step, or blockers
```

## Current status

2026-07-16 - Codex - T-EU-DEPTH-WAVE-9 - MERGED
- Intent:        Continue country-by-country depth with official DPA enforcement, AI/GDPR guidance, public-sector AI guidance, model-training soft law, and sandbox material for Italy, Hungary, France, Denmark, Finland, Norway, Ireland, and the EU layer.
- Files:         `scripts/backfill-eu-depth-wave9.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `backfill-eu-depth-wave9.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline".
- Verification:  Added dry-run-first `npm run backfill:eu-depth-wave9`; dry-run selected 8 official entries; live Supabase created 8 `published` updates with tag `eu-depth-wave9` for Italy=1, Hungary=1, France=1, Denmark=1, Finland=1, Norway=1, Ireland=1, European Union=1; DB recount confirms count=8 and all `published`, split `Enforcement action`=2 and `Agency guidance`=6; targeted legal/database tests PASS (4 files / 23 tests); `npm test` PASS (116 files / 654 tests); `npm run typecheck` PASS; `npm run lint` PASS; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ `07a2b72`.
- Next:          Continue wave 10 with more official court decisions, DPA sanctions, local/regional AI enforcement, and reliable legal-news discovery only after official-source verification.

2026-07-15 - Codex - T-US-LOCUS-DISCOVERY - DONE-LOCAL
- Intent:        Add LOCUS-v1 as an optional U.S. local AI-law external discovery corpus only, with hard guardrails against treating it as official legal authority or publishing LOCUS-derived items.
- Files:         `src/agents/ai-regulation/usLocusDiscovery.ts`, `src/agents/ai-regulation/usLocusDiscovery.test.ts`, `README.md`, `PROJECT_LOGBOOK.md`, `AI_AGENT_MASTER_CONTEXT.md`, `docs/superpowers/plans/2026-07-15-locus-us-discovery-corpus.md`, `AI_TASKS.md`.
- Graph anchors: `buildLocusDiscoveryLead()`, `DiscoveryLead`, community "Scan Pipeline", community "DB Repository Layer".
- Verification:  Added inactive discovery-source registration `src-us-locus-v1`, LOCUS topic detection, confidence scoring, reviewer-note metadata, and `DiscoveryLeadInput` builder; tests assert non-AI rows are rejected, LOCUS leads are private/admin-only, `requiresOfficialSource=true`, `publicVisibilityAllowed=false`, no verified legal authority/public item is created from LOCUS alone, and AI-infrastructure data centers only match when explicitly AI-related; `npm test -- src/agents/ai-regulation/usLocusDiscovery.test.ts` PASS (5 tests); `npm run typecheck` PASS.
- Branch/commit: `main` @ working tree.
- Next:          Optional future runtime can stream/sample LOCUS rows into `buildLocusDiscoveryLead()` and save only private `discovery_leads`; conversion to legal database still requires official municipal/county source verification and admin review.

2026-07-15 - Codex - T-REVIEW-BACKLOG-REDUCTION - DONE-LOCAL
- Intent:        Reduce the `needs_review` backlog by auto-publishing only items that already satisfy the official-source/citation eligibility gate, without weakening publication controls.
- Files:         `scripts/reduce-review-backlog.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `evaluatePublicationEligibility()`, `updateRepository.updateReviewStatus()`, community "Admin Review and Summaries", community "DB Repository Layer".
- Verification:  Added dry-run-first `npm run review:reduce-backlog`; dry-run found 39 eligible items out of 331 (`Country legal baseline curator`=31, trusted guidance sources NIST/ICO/NYDFS=8); live run transitioned 39 items through `needs_review -> approved -> published` with 0 failures; DB recount now reports `needs_review`=292, `published`=544, `archived`=2, and `autoEligibleRemaining`=0; remaining backlog is blocked mostly by missing official/authoritative sources and citation quality; targeted review/publication/health tests PASS (3 files / 15 tests); `npm test` PASS (115 files / 649 tests); `npm run typecheck` PASS; `npm run lint` PASS; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ working tree.
- Next:          To reduce the remaining 292, attach official source references or corroborated reliable legal-news evidence first, then re-run `npm run review:reduce-backlog`.

2026-07-15 - Codex - T-CRON-AUTH-CI - DONE-LOCAL
- Intent:        Fix the red GitHub `verify` check after Claude's PR merge by isolating the `cron-auth` missing-secret test from ambient CI `CRON_SECRET` secrets.
- Files:         `src/lib/cron-auth.test.ts`, `AI_TASKS.md`.
- Graph anchors: `getCronAuthStatus()`, community "Admin Authentication".
- Verification:  Reproduced the CI-sensitive failure with ambient `CRON_SECRET`; added explicit `delete process.env.CRON_SECRET` before `resetEnvForTests()` in the missing-secret test; `CRON_SECRET=ci-secret-value-123456 npm test -- src/lib/cron-auth.test.ts` PASS (4 tests); `npm test` PASS (115 files / 649 tests); `npm run typecheck` PASS; `npm run lint` PASS; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ working tree.
- Next:          Commit and push the one-line backend test fix so GitHub verify returns green on `main`.

2026-07-15 - Codex - T-EU-DEPTH-WAVE-8 - DONE-LOCAL
- Intent:        Continue the depth phase with official court judgments, DPA enforcement, biometric law-enforcement guidance, AI sandbox guidance, and automated-decision guidance so country timelines move beyond baseline coverage.
- Files:         `scripts/backfill-eu-depth-wave8.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `backfill-eu-depth-wave8.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline".
- Verification:  Added dry-run-first `npm run backfill:eu-depth-wave8`; dry-run selected 8 official entries; live Supabase created 8 `published` updates with tag `eu-depth-wave8` for Germany=1, Netherlands=1, Austria=1, Italy=1, Spain=1, Belgium=1, European Union=2; DB recount confirms count=8 and all `published`, split `Binding law`=2, `Enforcement action`=1, `Agency guidance`=5; targeted legal/database tests PASS (4 files / 23 tests); `npm test` PASS (115 files / 649 tests); `npm run typecheck` PASS; `npm run lint` PASS with one pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ working tree.
- Next:          Continue depth wave 9 with additional official national court decisions, DPAs, competition/consumer authorities, and public-sector AI decisions for countries still thin on case-law/enforcement depth.

2026-07-15 - Codex - T-EU-DEPTH-WAVE-7 - DONE-LOCAL
- Intent:        Start the real depth phase by adding official regulator enforcement/guidance entries for AI, biometrics, generative AI, GDPR, and LLMs rather than more baseline country architecture.
- Files:         `scripts/backfill-eu-depth-wave7.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `backfill-eu-depth-wave7.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline".
- Verification:  Added dry-run-first `npm run backfill:eu-depth-wave7`; dry-run selected 8 official entries; live Supabase created 8 `published` updates with tag `eu-depth-wave7` for France=1, Italy=1, Spain=1, Netherlands=1, European Union=1, Ireland=1, Belgium=1, Sweden=1; DB recount confirms count=8 and all `published`, split `Enforcement action`=4 and `Agency guidance`=4; `npm test` PASS (115 files / 649 tests); `npm run typecheck` PASS; `npm run lint` PASS with one pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ working tree.
- Next:          Continue depth wave 8 with official court judgments, DPA decisions, competition/consumer authorities, employment/public-sector AI decisions, and serious corroborated legal news; avoid duplicating baseline/authority-designation entries.

2026-07-15 - Codex - T-EU-OFFICIAL-WAVE-6 - DONE-LOCAL
- Intent:        Complete the next EU official-source enrichment pass for Estonia, Romania, Slovenia, and Sweden, focusing on public-sector AI governance, AI Act authority models, sandbox/guidance, and national implementation law.
- Files:         `scripts/backfill-eu-official-wave6.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `backfill-eu-official-wave6.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline".
- Verification:  Added dry-run-first `npm run backfill:eu-official-wave6`; dry-run selected 8 official entries; live Supabase created 8 `published` updates with tag `eu-official-wave6` for Estonia=2, Romania=2, Slovenia=2, Sweden=2; DB recount confirms count=8 and all `published`; `npm test` PASS (115 files / 649 tests); `npm run typecheck` PASS; `npm run lint` PASS with one pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ working tree.
- Next:          Move from broad official-source country completion into decision/enforcement/case-law depth: target regulator decisions, court cases, sanctions, consultations, and serious corroborated legal news where official case-law sources exist.

2026-07-15 - Codex - T-EU-OFFICIAL-WAVE-5 - DONE-LOCAL
- Intent:        Add another official-source EU deepening wave focused on practical implementation guidance, competent-authority designations, proposed laws, and national AI strategy/office layers.
- Files:         `scripts/backfill-eu-official-wave5.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `backfill-eu-official-wave5.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline".
- Verification:  Added dry-run-first `npm run backfill:eu-official-wave5`; dry-run selected 8 official entries; live Supabase created 8 `published` updates with tag `eu-official-wave5` for Czechia=2, Cyprus=1, Austria=1, Belgium=1, Ireland=2, Netherlands=1; DB recount confirms count=8 and all `published`; `npm test` PASS (115 files / 649 tests); `npm run typecheck` PASS; `npm run lint` PASS with one pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ working tree.
- Next:          Continue with Estonia, Romania, Slovenia, Sweden and any remaining thin decision/enforcement layers; for non-official legal news, keep auto-publication limited to serious/corroborated sources.

2026-07-15 - Codex - T-EU-OFFICIAL-WAVE-4 - DONE-LOCAL
- Intent:        Continue country-by-country EU legal database deepening with official AI Act authority, implementation, sandbox, and AI-literacy sources for weak country profiles.
- Files:         `scripts/backfill-eu-official-wave4.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `backfill-eu-official-wave4.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline".
- Verification:  Added dry-run-first `npm run backfill:eu-official-wave4`; dry-run selected 9 official entries; live Supabase created 9 `published` updates with tag `eu-official-wave4` for Greece=1, Hungary=1, Latvia=1, Lithuania=1, Luxembourg=1, Malta=1, Portugal=1, Slovakia=2; DB recount confirms count=9 and all `published`; `npm test` PASS (115 files / 649 tests); `npm run typecheck` PASS; `npm run lint` PASS with one pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ working tree.
- Next:          Continue a wave 5 focused on remaining shallow EU depth gaps and case-law/administrative-decision layers, especially Czechia, Cyprus, Estonia, Romania, Slovenia, Sweden, Austria, Belgium, Ireland, and Netherlands where official sources exist but decision/case-law layers are still thin.

2026-07-15 - Codex - T-EU-OFFICIAL-WAVE-3 - MERGED
- Intent:        Add official-source implementation, sandbox, authority, and timeline entries for weak EU country databases without requiring admin review for official sources.
- Files:         `scripts/backfill-eu-official-wave3.ts`, `src/agents/ai-regulation/dataSteward.test.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `backfill-eu-official-wave3.ts`, `dataSteward.test.ts`, `SourceReference`, community "Data Repository and Pagination", community "Scan Pipeline", community "Data Quality Assessment".
- Verification:  Added dry-run-first `npm run backfill:eu-official-wave3`; dry-run selected 8 official entries; live Supabase created 8 `published` updates with tag `eu-official-wave3` for Croatia=1, Poland=2, Denmark=2, Finland=3; DB recount confirms count=8 and all `published`; updated the stewardship diagnostic test to assert the new invariant that Europe country diagnostics have sources rather than expecting a zero-source country; `npm test` PASS (115 files / 649 tests); `npm run typecheck` PASS; `npm run lint` PASS with one pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ `4fbab00`.
- Next:          Continue wave 4 for Greece, Hungary, Latvia, Lithuania, Luxembourg, Malta, Portugal, and Slovakia, prioritizing official AI Act implementation pages, DPAs, courts/tribunals, and serious legal-news sources with corroboration.

2026-07-15 - Codex - T-EU-DEEP-ENTRIES-WAVE-2 - DONE-LOCAL
- Intent:        Extend official-source deep legal database entries from the five pilot countries to every remaining EU Member State with a verified country profile source layer.
- Files:         `scripts/backfill-pilot-country-deep-entries.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `updateRepository.createRawItem()`, `updateRepository.createUpdate()`, `SourceReference`, community "DB Repository Layer", community "Scan Pipeline".
- Verification:  Generalized new rows to `country-legal-deepener`, added alias `npm run backfill:country-deep-entries`, dry-run selected the 22 remaining EU Member States and produced 57 entries; live Supabase created 57 `published` entries for Bulgaria=5, Austria/Belgium/Cyprus/Denmark/Estonia/Finland/Ireland/Romania/Slovenia/Sweden=3 each, and Croatia/Czechia/Greece/Hungary/Latvia/Lithuania/Luxembourg/Malta/Poland/Portugal/Slovakia=2 each; combined deep-entry layer now totals 143 `published` entries across all 27 EU Member States with no missing published EU country; `/api/health` PASS (`ok=true`, `worker.alive=true`, `coverage.state=healthy`); `npm test -- src/agents/ai-regulation/publicationEligibility.test.ts src/agents/ai-regulation/jurisdictionTimeline.test.ts src/lib/country-database-readiness.test.ts` PASS (12); `npm run typecheck` PASS; `npm run lint` PASS with one pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ working tree.
- Next:          Next backend pass should enrich weak EU countries beyond two-source baselines with actual national AI Act implementation instruments, case-law/administrative decisions, and serious/corroborated legal-news sources; non-official source auto-publication must stay behind serious-source/corroboration safeguards.

2026-07-15 - Codex - T-OFFICIAL-SOURCE-AUTOPUBLISH-PILOTS - DONE-LOCAL
- Intent:        Apply the standing publication rule that official-source legal database entries do not require manual admin review, and keep future pilot deep-entry backfills aligned with it.
- Files:         `scripts/backfill-pilot-country-deep-entries.ts`, `AI_TASKS.md`.
- Graph anchors: `evaluatePublicationEligibility()`, `updateRepository.updateReviewStatus()`, community "DB Repository Layer", community "Scan Pipeline".
- Verification:  Promoted all 86 `pilot-country-legal-deepener` updates through the normal `approved` -> `published` review workflow as `system:auto-official-source` (France=38, Germany=12, Italy=12, Spain=19, Netherlands=5); DB recount confirms `published=86`, with family split implementation=31, soft-law=20, case-law=12, timeline=23; `/api/health` now reports `pendingNeedsReviewCount=331` (down from 417), `ok=true`, `worker.alive=true`; `npm test -- src/agents/ai-regulation/publicationEligibility.test.ts src/agents/ai-regulation/jurisdictionTimeline.test.ts` PASS (7); `npm run typecheck` PASS; `npm run lint` PASS with one pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ working tree.
- Next:          Extend the same official-source auto-publication default to future country deepening waves; keep non-official serious-source auto-publication behind eligibility/corroboration safeguards rather than blanket-publishing discovery-only material.

2026-07-15 - Codex - T-WORKER-PERSISTENT-HEARTBEAT - DONE-LOCAL
- Intent:        Make the permanent Railway worker observable from Vercel `/api/health` even when no scan job is currently running.
- Files:         `scripts/run-scan-job-worker.ts`, `src/lib/health.ts`, `src/lib/health.test.ts`, `AI_TASKS.md`.
- Graph anchors: `buildHealthSnapshot()`, `createScanWorkerConfig()`, `updateRepository.createScanJob()`, `updateRepository.updateScanJob()`, community "Source Runtime Health", community "Scan Job Management".
- Verification:  Added a persistent `worker_heartbeat` scan-job sentinel written by the worker each cycle and read by health without counting it as a real scan; stopped/failed heartbeat states are exposed diagnostically but do not mark the worker alive; `npm test -- src/lib/health.test.ts src/agents/ai-regulation/processors/scanWorkerRuntime.test.ts` PASS (13); `npm run typecheck` PASS; `npm run lint` PASS with one pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`; `npm run build` PASS with temporary non-default admin env vars for local verification.
- Branch/commit: `main` @ working tree.
- Next:          Commit/push/deploy, then restart or redeploy the Railway worker so it begins writing the new heartbeat sentinel; after one cycle, `/api/health.worker.alive` should reflect the live worker instead of only recent job activity.

2026-07-15 - Codex - T-PILOT-COUNTRY-DEEP-ENTRIES - DONE-LOCAL
- Intent:        Deepen the five pilot country legal databases beyond baseline entries by creating granular reviewable rows for official implementation, soft-law, case-law/decision, and timeline sources.
- Files:         `scripts/backfill-pilot-country-deep-entries.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `updateRepository.createRawItem()`, `updateRepository.createUpdate()`, `SourceReference`, community "DB Repository Layer", community "Scan Pipeline".
- Verification:  `npm run backfill:pilot-country-deep-entries` dry-run produced 86 entries; live Supabase write created/repaired 86 `pilot-country-legal-deepener` updates for France=38, Germany=12, Italy=12, Spain=19, Netherlands=5, all `needs_review`; second live run was idempotent (`skipped_existing_update` for all 86); DB recount confirmed family split implementation=31, soft-law=20, case-law=12, timeline=23; `npm test -- src/lib/country-database-readiness.test.ts src/agents/ai-regulation/jurisdictionTimeline.test.ts` PASS (9); `npm run typecheck` PASS; `npm run lint` PASS with one pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`; `npm run build` PASS when run with temporary non-default admin env vars for local verification (initial local build correctly failed on default `.env.local` admin credentials).
- Branch/commit: `main` @ working tree.
- Next:          Codex should continue country-by-country deepening beyond the first five pilots, or review/publish selected high-confidence official rows in controlled batches; Claude can surface the new review backlog in admin if useful.

2026-07-15 - Codex - T-PILOT-COUNTRY-TIMELINES - MERGED
- Intent:        Start the deep-quality phase by publishing only the official-source baseline updates for the five pilot countries and making their public jurisdiction timelines non-empty.
- Files:         `src/agents/ai-regulation/jurisdictionTimeline.ts`, `src/agents/ai-regulation/jurisdictionTimeline.test.ts`, `AI_TASKS.md`.
- Graph anchors: `getJurisdictionLegalDatabaseSnapshot()`, `classifyTimelineAuthority()`, `updateRepository.updateReviewStatus()`, community "Source Runtime Health", community "DB Repository Layer".
- Verification:  live Supabase promoted the `country-legal-baseline` updates for France, Germany, Italy, Spain, and Netherlands through `approved` to `published` under reviewer `system:official-baseline-policy`; public timeline snapshots now show France=1, Germany=1, Italy=1, Spain=1, Netherlands=3; fixed timeline classifier so `authority-designation-gap` / `case-law-gap` tags do not create false `case_law_and_decisions` entries and `country-baseline` entries classify as `soft_law`; `npm test -- src/agents/ai-regulation/jurisdictionTimeline.test.ts src/lib/country-database-readiness.test.ts` PASS (9); `npm run typecheck` PASS.
- Branch/commit: `main` @ working tree.
- Next:          Deepen the five pilot countries with actual hard-law, authority-designation, soft-law, case-law, and legal-news entries rather than only baseline entries; then repeat publication in controlled batches.

2026-07-15 - Codex - T-MONITORED-NON-EU-LEGAL-BASELINES - MERGED
- Intent:        Complete the first structured baseline layer for monitored non-EU western/balkan Europe jurisdictions so no covered country remains empty.
- Files:         `scripts/backfill-monitored-country-legal-baselines.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `updateRepository.getSources()`, `updateRepository.createRawItem()`, `updateRepository.createUpdate()`, `getCountryDatabaseReadiness()`, community "DB Repository Layer", community "Scan Pipeline", community "Source Runtime Health".
- Verification:  added dry-run-first `npm run backfill:monitored-country-legal-baselines` that builds reviewable baselines directly from active official/regulator monitoring sources; live Supabase created 14 structured baselines for Albania, Andorra, Bosnia and Herzegovina, Iceland, Kosovo, Liechtenstein, Monaco, Montenegro, North Macedonia, Norway, San Marino, Serbia, Switzerland, and Vatican City; total `country-legal-baseline` updates now 41; readiness now reports `ready=0`, `degraded=46`, `needsBackfill=0`, `blocked=0`, `averageScore=97`; `npm test -- src/lib/country-database-readiness.test.ts src/agents/ai-regulation/nonEuEuropeSources.test.ts` PASS (7); `npm run typecheck` PASS.
- Branch/commit: `main` @ working tree.
- Next:          The first complete monitoring-baseline layer is now present. Next work should deepen quality: final authority designation instruments, national acts, soft-law/guidance, case-law, timelines, media/news enrichment, and admin review/publication of selected baseline updates.

2026-07-15 - Codex - T-COUNTRY-LEGAL-BASELINE-UPDATES - MERGED
- Intent:        Turn country profiles into structured legal-database baseline entries so the backend has one reviewable AI Act monitoring baseline update per EU Member State.
- Files:         `scripts/backfill-country-legal-baselines.ts`, `package.json`, `AI_TASKS.md`.
- Graph anchors: `getEuropeCountryProfiles()`, `updateRepository.createRawItem()`, `updateRepository.createUpdate()`, `getCountryDatabaseReadiness()`, community "DB Repository Layer", community "Scan Pipeline", community "Source Runtime Health".
- Verification:  added dry-run-first `npm run backfill:country-legal-baselines` with stable hashes, source-reference normalization for the live `source_references` constraint, and orphan raw-item recovery; live Supabase now has synthetic source `country-legal-baseline` plus 27 structured country baseline updates in `ai_regulatory_updates`, all `needs_review` and `authorityType=Governance framework`; readiness improved from `degraded=16 / needsBackfill=30 / averageScore=92` to `degraded=32 / needsBackfill=14 / averageScore=95`; `npm test -- src/content/ai-regulation/europe-country-profiles.test.ts src/agents/ai-regulation/legalIntegrity.test.ts src/lib/country-database-readiness.test.ts` PASS (23); `npm run typecheck` PASS.
- Branch/commit: `main` @ working tree.
- Next:          Admin/Claude can review and publish baseline updates selectively. Codex next should enrich the remaining 14 non-UE/other monitored countries with country_intelligence profiles or add deeper country-specific acts/case-law/news entries.

2026-07-15 - Codex - T-COUNTRY-PROFILES-LV-LT-LU-MT-PT-RO-SK-SI - MERGED
- Intent:        Continue country-by-country legal database enrichment for Latvia, Lithuania, Luxembourg, Malta, Portugal, Romania, Slovakia, and Slovenia with conservative official-source profiles.
- Files:         `src/content/ai-regulation/europe-member-state-implementation.ts`, `AI_TASKS.md`.
- Graph anchors: `getEuropeCountryProfiles()`, `sourceReferenceFromCountrySource()`, `mapEuropeCountryProfileToCountryIntelligenceInput()`, `getCountryDatabaseReadiness()`, community "DB Repository Layer", community "Source Runtime Health".
- Verification:  live Supabase upserted 8 country profiles to `implementation_in_progress`, `citation_quality_status=partial`, `review_status=needs_review`, with 18 `country_intelligence_sources` rows total - readiness confirms all 8 no longer report `missing_official_source`; Slovenia is now `degraded`, while Latvia/Lithuania/Luxembourg/Malta/Portugal/Romania/Slovakia remain `needs_backfill` due empty structured updates/news - `npm test -- src/content/ai-regulation/europe-country-profiles.test.ts src/agents/ai-regulation/legalIntegrity.test.ts src/lib/country-database-readiness.test.ts` PASS (23) - `npm run typecheck` PASS.
- Branch/commit: `main` @ working tree.
- Next:          Remaining EU country-profile work is no longer basic official-source attachment; next pass should add structured legal updates/news/case-law and verify final AI Act designation instruments before promoting any country to `verified`.

2026-07-15 - Codex - T-COUNTRY-PROFILES-EE-FI-GR-HU - MERGED
- Intent:        Continue country-by-country legal database enrichment for Estonia, Finland, Greece, and Hungary with conservative official-source profiles.
- Files:         `src/content/ai-regulation/europe-member-state-implementation.ts`, `AI_TASKS.md`.
- Graph anchors: `getEuropeCountryProfiles()`, `sourceReferenceFromCountrySource()`, `mapEuropeCountryProfileToCountryIntelligenceInput()`, `getCountryDatabaseReadiness()`, community "DB Repository Layer", community "Source Runtime Health".
- Verification:  live Supabase upserted `country-estonia`, `country-finland`, `country-greece`, and `country-hungary` to `implementation_in_progress`, `citation_quality_status=partial`, `review_status=needs_review`, with 10 `country_intelligence_sources` rows total - readiness confirms all four no longer report `missing_official_source` but remain `needs_backfill` because structured legal updates/news and authority-designation/case-law layers remain incomplete - `npm test -- src/content/ai-regulation/europe-country-profiles.test.ts src/agents/ai-regulation/legalIntegrity.test.ts src/lib/country-database-readiness.test.ts` PASS (23) - `npm run typecheck` PASS.
- Branch/commit: `main` @ working tree.
- Next:          Continue with Latvia, Lithuania, Luxembourg, Malta, Portugal, Romania, Slovakia, and Slovenia; keep final-designation claims blocked until official designation instruments are found.

2026-07-15 - Codex - T-COUNTRY-PROFILES-HR-CY-CZ-DK - MERGED
- Intent:        Continue country-by-country legal database enrichment for Croatia, Cyprus, Czechia, and Denmark with conservative official-source profiles.
- Files:         `src/content/ai-regulation/europe-member-state-implementation.ts`, `AI_TASKS.md`.
- Graph anchors: `getEuropeCountryProfiles()`, `sourceReferenceFromCountrySource()`, `mapEuropeCountryProfileToCountryIntelligenceInput()`, `getCountryDatabaseReadiness()`, community "DB Repository Layer", community "Source Runtime Health".
- Verification:  added reusable `createMonitoredInstitutionProfile()` and four official-source profiles; live Supabase upserted `country-croatia`, `country-cyprus`, `country-czechia`, and `country-denmark` to `implementation_in_progress`, `citation_quality_status=partial`, `review_status=needs_review`, with 10 `country_intelligence_sources` rows total - readiness confirms all four no longer report `missing_official_source`; Czechia is now `degraded` instead of `needs_backfill`, while Croatia/Cyprus/Denmark remain `needs_backfill` due empty structured updates/news - `npm test -- src/content/ai-regulation/europe-country-profiles.test.ts src/agents/ai-regulation/legalIntegrity.test.ts src/lib/country-database-readiness.test.ts` PASS (23) - `npm run typecheck` PASS.
- Branch/commit: `main` @ working tree.
- Next:          Continue with Estonia, Finland, Greece, Hungary, Latvia, Lithuania, Luxembourg, Malta, Portugal, Romania, Slovakia, and Slovenia; keep authority-designation warnings until final designation instruments are verified.

2026-07-15 - Codex - T-COUNTRY-PROFILE-BULGARIA - MERGED
- Intent:        Start the country-by-country legal database enrichment by replacing Bulgaria's placeholder profile with a conservative official-source baseline.
- Files:         `src/content/ai-regulation/europe-member-state-implementation.ts`, `AI_TASKS.md`.
- Graph anchors: `getEuropeCountryProfiles()`, `sourceReferenceFromCountrySource()`, `mapEuropeCountryProfileToCountryIntelligenceInput()`, `getCountryDatabaseReadiness()`, community "DB Repository Layer", community "Source Runtime Health".
- Verification:  Bulgaria profile now has official CPDP, European Commission AI Watch, and Bulgarian government AI Concept sources; live Supabase `country-bulgaria` upserted to `implementation_in_progress`, `citation_quality_status=partial`, `review_status=needs_review`, with 5 `country_intelligence_sources` rows - readiness confirms Bulgaria no longer has `missing_official_source` but remains honest `needs_backfill` due empty structured updates/news and unverified authority-designation/case-law layers - `npm test -- src/content/ai-regulation/europe-country-profiles.test.ts src/agents/ai-regulation/legalIntegrity.test.ts src/lib/country-database-readiness.test.ts` PASS (23) - `npm run typecheck` PASS.
- Branch/commit: `main` @ working tree.
- Next:          Continue country-by-country enrichment with Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, Greece, and Hungary, keeping labels conservative until final AI Act designation instruments are verified.

2026-07-15 - Codex - T-COUNTRY-MONITORING-BACKFILL-WAVE-2 - MERGED
- Intent:        Continue progressive country database alimentation and clear recent active-source failures after the first wave.
- Files:         `AI_TASKS.md`.
- Graph anchors: `runAiRegulationScan()`, `sourceScanner`, `scraplingExtract()`, `getCountryDatabaseReadiness()`, community "Scan Pipeline", community "Scrapling Extraction Service", community "Source Runtime Health".
- Verification:  official-source backfill wave executed for Iceland, Kosovo, Latvia, Liechtenstein, Lithuania, Luxembourg, Malta, Monaco, Montenegro, North Macedonia, Norway, Poland, Portugal, Romania, San Marino, Serbia, Slovakia, Slovenia, and Switzerland (38 source executions; no scan crashes; Scrapling recovered Iceland, North Macedonia, Norway, Romania, Slovakia/Switzerland/Slovenia DPA fallbacks where plain static fetch failed) - exact replay of recent failing sources `src-ie-gov-ai`, `src-nl-rijksoverheid-ai`, `src-edpb-ai`, `src-edps-ai` all returned `success` - final active-source recent-failure audit reports `failingCount=0` - readiness remains honest: `blocked=0`, `degraded=16`, `needsBackfill=30`, `averageScore=92` because many country profiles still need verified citations and/or structured legal entries, not because monitoring is broken.
- Branch/commit: `main` @ working tree.
- Next:          Continue slower media/news discovery batches after confirming `NEWSAPI_API_KEY` in the execution runtime; consider targeted selector/source refinements for official pages that return success but no extractable content (Lithuania official pages, Monaco legislation page, EDPS/Irish government pages).

2026-07-15 - Codex - T-COUNTRY-MONITORING-BACKFILL-WAVE-1 - MERGED
- Intent:        Start progressive country database alimentation with small official-source waves, then repair the one source failure found during replay.
- Files:         `src/db/seed/ai-regulation-seed.ts`, `src/db/migrations/019_remaining_eu_member_state_monitoring_sources.sql`, `src/db/migrations/023_repair_hungary_legislation_source_url.sql`, `AI_TASKS.md`.
- Graph anchors: `runAiRegulationScan()`, `sourceScanner`, `scraplingExtract()`, `getCountryDatabaseReadiness()`, community "Scan Pipeline", community "Scrapling Extraction Service", community "Source Runtime Health", community "DB Repository Layer".
- Verification:  live official backfill waves executed for Albania, Andorra, Bosnia and Herzegovina, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, Greece, and Hungary (25 source executions after Hungary replay; all non-Hungary-government failures avoided; Scrapling recovered Bosnia, Bulgaria, and Czechia items) - Hungary government source failed on old `https://njt.hu/`, repaired to `https://njt.jog.gov.hu/` in live Supabase and code, replayed successfully (`src-hu-government-ai` success, 6 items found) - limited media/API wave for Albania, Andorra, Bosnia and Herzegovina, Bulgaria showed NewsAPI unavailable in local runtime (`NEWSAPI_API_KEY` missing) and GDELT rate-limiting on rapid repeated calls, no crashes - readiness recalculation reports `blocked=0`, `degraded=16`, `needsBackfill=30`, `averageScore=92` - `npm test -- src/agents/ai-regulation/remainingEuMemberStateSources.test.ts src/lib/country-database-readiness.test.ts` PASS (7).
- Branch/commit: `main` @ working tree.
- Next:          Continue backfill in slower batches. Use official sources first; run media/GDELT with larger spacing or via scheduled worker; configure/verify `NEWSAPI_API_KEY` in the runtime that performs media discovery before expecting NewsAPI results.

2026-07-15 - Codex - T-COUNTRY-MONITORING-RELIABILITY - MERGED
- Intent:        Make country monitoring health measurable and actionable: score every country database, expose readiness in admin operations, add a safe baseline backfill runner, and repair the unstable Bulgaria official source.
- Files:         `src/lib/country-database-readiness.ts`, `src/lib/country-database-readiness.test.ts`, `src/lib/admin-operations-summary.ts`, `src/lib/admin-operations-summary.test.ts`, `scripts/backfill-country-baselines.ts`, `package.json`, `src/db/seed/ai-regulation-seed.ts`, `src/db/migrations/022_repair_bulgaria_government_ai_source.sql`, `docs/superpowers/plans/2026-07-15-country-monitoring-reliability.md`, `AI_TASKS.md`.
- Graph anchors: `getCountryDatabaseReadiness()`, `buildCountryDatabaseReadiness()`, `buildAdminOperationsSummary()`, `runAiRegulationScan()`, `sourceScanner`, community "Source Runtime Health", community "Scan Pipeline", community "DB Repository Layer".
- Verification:  `npm test -- src/lib/admin-operations-summary.test.ts src/lib/country-database-readiness.test.ts` PASS (6) - `npm run typecheck` PASS - `npm run lint` PASS (0 errors, 1 pre-existing `<img>` warning in `src/components/site/article-carousel.tsx`) - `npm test` PASS (115 files / 646 tests) - `npm run build` PASS with temporary non-default admin credentials - live Supabase Bulgaria source repaired and backfilled (`src-bg-dpa-ai` success, `src-bg-government-ai` success) - readiness probe reports `blocked=0`, `degraded=15`, `needsBackfill=31`, `averageScore=92` - `main` pushed and Vercel production READY on `9ece786` - production `/api/health` PASS (`ok=true`, commit `9ece786`, DB reachable, coverage healthy, newest success `2026-07-15T15:29:27.111+00:00`) - Vercel runtime logs show no warning/error/fatal in the last 30m.
- Branch/commit: `main` @ `9ece786`.
- Next:          Claude can surface `operations.countryReadiness.summary` and `operations.countryReadiness.topBlockers` in the Operations dashboard without loading full country/source lists. Codex next step is small-batch baseline backfills for the 31 `needs_backfill` countries, watching cost and review backlog.

2026-07-14 - Codex - T-NON-EU-EUROPE-COVERAGE - MERGED
- Intent:        Extend Europe monitoring beyond EU member states to selected Western Europe and Balkan non-EU jurisdictions, with multiple active official/regulator and legal-news discovery sources per country.
- Files:         `src/db/schema.ts`, `src/db/seed/ai-regulation-seed.ts`, `src/db/migrations/021_non_eu_western_balkan_europe_sources.sql`, `src/agents/ai-regulation/nonEuEuropeAgentDefinitions.ts`, `src/agents/ai-regulation/nonEuEuropeSources.test.ts`, `AI_TASKS.md`.
- Graph anchors: `nonEuEuropeAgentDefinitions`, `buildDefaultCountrySourceRegistry()`, `buildCountryMonitoringSources()`, community "Scan Pipeline", community "DB Repository Layer".
- Verification:  `npm test -- src/agents/ai-regulation/nonEuEuropeSources.test.ts src/agents/ai-regulation/remainingEuMemberStateSources.test.ts` PASS (4) - `npm test` PASS (114 files / 641 tests) - `npm run typecheck` PASS - `npm run lint -- src/agents/ai-regulation/nonEuEuropeAgentDefinitions.ts src/agents/ai-regulation/nonEuEuropeSources.test.ts src/db/seed/ai-regulation-seed.ts` PASS (0 errors, 1 pre-existing `<img>` warning from full lint invocation) - `npm run build` PASS with temporary non-default admin credentials - `main` pushed and Vercel production READY on `f763e26` - production `/api/health` PASS (`ok=true`, DB reachable, coverage healthy, newest success `2026-07-14T16:35:44.058+00:00`) - Supabase upsert inserted/updated 60 new source rows; each of the 15 jurisdictions has at least 4 active sources (2 official/regulator, 2 media, 2 API) - Scrapling sidecar `/health` PASS (`version=1.0.1`) - representative `src-ch-dpa-ai` replay PASS with Scrapling fallback recovery after html_static 404 - representative `src-rs-gdelt-ai` replay handled provider rate-limit/plain-text response safely without crashing - Vercel runtime logs show no warning/error/fatal in the last 20m.
- Branch/commit: `main` @ `f763e26`.
- Next:          Firecrawl still needs an end-to-end production crawl proof using the real `FIRECRAWL_API_KEY`; Vercel lists the variable as Sensitive but CLI cannot decrypt or locally verify it, and no local `FIRECRAWL_API_KEY`/`INGESTION_SECRET` is available.

2026-07-09 · Codex · T-SCRAPLING-SSL-FALLBACK · MERGED
- Intent:        Fix the two remaining DPA failures revealed by live replay: official sites with broken TLS chains and worker runtimes missing `SCRAPLING_WORKER_URL` after redeploy.
- Files:         `scrapling_worker/worker.py`, `scrapling_worker/README.md`, `src/agents/ingestion/scraplingClient.ts`, `src/agents/ingestion/scraplingClient.test.ts`, `src/agents/ai-regulation/processors/sourceScanner.ts`, `src/agents/ai-regulation/processors/sourceScanner.test.ts`, `AI_TASKS.md`.
- Graph anchors: `scraplingExtract()`, `sourceScanner`, community "Scrapling Extraction Service", community "Data Ingestion Pipeline", community "Scan Pipeline".
- Verification:  live replay after `5dad1a7`: `src-pl-dpa-ai` succeeded (6 found), `src-lt-dpa-ai` succeeded, `src-si-dpa-ai` partial_success (1 found), `src-sk-dpa-ai` succeeded, `src-bg-dpa-ai` and `src-cy-dpa-ai` exposed Scrapling SSL-chain failures · Scrapling sidecar `/health` updated to `version=1.0.1` after SSL retry patch · `src-bg-dpa-ai` replay succeeded (1 found) · local current-code drain for `src-cy-dpa-ai` succeeded non-fatally (0 found / 0 failures) after empty-browser-fallback handling · permanent worker replay for `src-cy-dpa-ai` succeeded (`job-7e2a6ab0-a3e4-4185-82e2-79195f1beda6`, 0 found / 0 failures, leaseOwner `local-worker`) · `/api/health` PASS on `05725b5` with worker alive and coverage healthy · `py -m py_compile scrapling_worker/worker.py` PASS · `npm test -- --run src/agents/ingestion/scraplingClient.test.ts src/agents/ai-regulation/processors/sourceScanner.test.ts` PASS (7) · `npm test` PASS (113 files / 637 tests) · `npm run typecheck` PASS · `npm run lint` PASS (0 errors, 1 pre-existing `<img>` warning) · local `npm run build` PASS with temporary non-default admin credentials.
- Branch/commit: `main` @ `05725b5`.
- Next:          No known blocked remaining-EU `html_static` DPA source remains from the six-source replay set. Continue routine monitoring; investigate only if a future official source fails with a new retrieval class.

2026-07-09 · Codex · T-STATIC-SCRAPER-FALLBACK · MERGED
- Intent:        Let official `html_static` sources recover from blocked/plain-fetch failures by trying the configured Scrapling sidecar first, then Firecrawl when available, while keeping non-official media sources on the existing static connector path.
- Files:         `src/agents/ai-regulation/processors/sourceScanner.ts`, `src/agents/ai-regulation/processors/sourceScanner.test.ts`, `AI_TASKS.md`.
- Graph anchors: `sourceScanner`, `StaticPageConnector`, `scraplingExtract()`, `scrapeUrl()`, community "Scan Pipeline", community "Data Ingestion Pipeline", community "Scrapling Extraction Service".
- Verification:  `agent-sync.ps1` PASS at `aeeb304` · RED targeted test failed before implementation (`sourceScanner` rejected `fetch failed`) · `npm test -- --run src/agents/ai-regulation/processors/sourceScanner.test.ts` PASS (2) · `npm test -- --run src/agents/ai-regulation/connectors/static-page-connector.test.ts src/agents/ai-regulation/processors/scanJobs.test.ts src/agents/ingestion/scraplingClient.test.ts` PASS (43) · `npm test` PASS (113 files / 636 tests) · `npm run typecheck` PASS · `npm run lint` PASS (0 errors, 1 pre-existing `<img>` warning) · local `npm run build` PASS with temporary non-default admin credentials.
- Branch/commit: `main` @ `5dad1a7`.
- Next:          Codex should commit/push, let Railway worker redeploy, then replay the six blocked DPA/regulator sources (`src-bg-dpa-ai`, `src-cy-dpa-ai`, `src-lt-dpa-ai`, `src-pl-dpa-ai`, `src-si-dpa-ai`, `src-sk-dpa-ai`) and confirm the result summaries show `static_fallback_document` with `extractionMethod=scrapling` or `firecrawl`.

2026-07-09 · Codex · T-REMAINING-EU-COVERAGE · REVIEW
- Intent:        Audit the live remaining-EU monitoring rollout after production deploy and distinguish working country coverage from official-source fetch gaps.
- Files:         `AI_TASKS.md`.
- Graph anchors: `missingEuMemberStateAgentDefinitions`, `buildDefaultCountrySourceRegistry()`, `createCountryNewsSourceModule()`, `buildHealthSnapshot()`, community "Scan Pipeline", community "Source Runtime Health".
- Verification:  `agent-sync.ps1` refreshed graph at `48cdf90` · `/api/health` PASS before probe (`ok=true`, DB reachable, coverage healthy) · targeted tests PASS (10) · Supabase audit confirms 18/18 remaining EU countries have 4 active sources each (72 total) · 18/18 countries have at least one successful scan in 24h · representative live GDELT probe for `src-pl-gdelt-ai` succeeded (`job-live-eu-probe-3f147eb639e6453998c35e1a66f219a3`, 2026-07-09 11:43:28→11:43:42 UTC) · `/api/health` after probe PASS with worker `alive=true`, newest success `2026-07-09T11:43:42.201Z` · Vercel production runtime logs show no warning/error/fatal in 30m · known gaps: six DPA/regulator `html_static` sources still fail plain fetch and need Scrapling/Firecrawl fallback (`src-bg-dpa-ai`, `src-cy-dpa-ai`, `src-lt-dpa-ai`, `src-pl-dpa-ai`, `src-si-dpa-ai`, `src-sk-dpa-ai`).
- Branch/commit: `main` @ `48cdf90`.
- Next:          Codex should implement a guarded Scrapling/Firecrawl fallback in `sourceScanner` / `StaticPageConnector` for blocked official `html_static` sources, then replay those six DPA jobs and mark this task fully green.

2026-07-08 · Codex · T-REMAINING-EU-COVERAGE · DONE-LOCAL
- Intent:        Activate the existing remaining-EU country agents by backing their expected default source IDs with real official/regulator and discovery sources for Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, Greece, Hungary, Latvia, Lithuania, Luxembourg, Malta, Poland, Portugal, Romania, Slovakia, and Slovenia.
- Files:         `src/db/seed/ai-regulation-seed.ts`, `src/db/migrations/019_remaining_eu_member_state_monitoring_sources.sql`, `src/agents/ai-regulation/remainingEuMemberStateSources.test.ts`, `AI_TASKS.md`.
- Graph anchors: `missingEuMemberStateAgentDefinitions`, `buildDefaultCountrySourceRegistry()`, `createCountryNewsSourceModule()`, community "Scan Pipeline".
- Verification:  RED `npm test -- --run src/agents/ai-regulation/remainingEuMemberStateSources.test.ts` failed on missing source seeds · targeted tests PASS (10) · `npm test` PASS (112 files / 634 tests) · `npm run lint` PASS (0 errors, 1 pre-existing `<img>` warning) · `npm run typecheck` PASS · local `npm run build` PASS with temporary non-default admin credentials · Vercel production deployment `dpl_5UW1Vq7KW5TcNbBWbueopLeQaCuG` READY · `/api/health` PASS (`ok=true`, commit `7118134`) · production migration 019 applied with 72 active remaining-EU sources · migration 020 canonical URL patch applied for Bulgaria/Cyprus · representative DPA jobs: 12 succeeded / 6 failed on runtime fetch (`src-bg-dpa-ai`, `src-cy-dpa-ai`, `src-lt-dpa-ai`, `src-pl-dpa-ai`, `src-si-dpa-ai`, `src-sk-dpa-ai`) · GDELT fallback jobs for those 6 countries all succeeded.
- Branch/commit: `main` @ `7118134`; follow-up URL fix pending commit.
- Next:          Codex should add a guarded Scrapling/Firecrawl fallback for `html_static` sources in `sourceScanner`/`StaticPageConnector` so official sites that block plain fetch can still be monitored before declaring every official DPA source green.

2026-07-06 · Codex · T-IE-NL-SE-COVERAGE · MERGED
- Intent:        Add production-active Ireland, Netherlands, and Sweden monitoring sources so the remaining EU official scan profiles no longer resolve zero sources.
- Files:         `src/db/seed/ai-regulation-seed.ts`, `src/db/migrations/018_ie_nl_se_monitoring_sources.sql`, `src/db/seed/ireland-netherlands-sweden-sources.test.ts`, `AI_TASKS.md`.
- Graph anchors: `getIrelandAgentSourceIds()`, `getNetherlandsAgentSourceIds()`, `getSwedenAgentSourceIds()`, `selectSourcesForScanProfile()`, `buildHealthSnapshot()`.
- Verification:  RED `npm test -- src/db/seed/ireland-netherlands-sweden-sources.test.ts` failed on missing sources · targeted tests PASS (24) · `npm test` PASS (111 files / 632 tests) · `npm run lint` PASS (0 errors, 1 pre-existing `<img>` warning) · `npm run typecheck` PASS · local `npm run build` PASS with temporary non-default admin creds · production migration 018 applied · replay jobs for Ireland/Netherlands/Sweden queued and drained by Railway · `/api/health` PASS with `ok=true`, `coverage.zeroSourceProfiles=[]`, worker `alive=true`.
- Branch/commit: `main` @ `f65331c`.
- Next:          No EU zero-source profiles remain in prod health. Remaining backend follow-up is separate: durable DB-backed idle worker heartbeat so health does not rely only on recent scan-job activity.

2026-07-05 · Claude Code · T-IA-SUBPAGES + T-STANDARDS-REDESIGN · DONE-LOCAL
- Intent:        Reduce per-page information density (split dense pages into focused sub-pages) and fully redesign the Standards page (real data-driven inventory + slim search/filter toolbar + animations).
- Files:         new pages `src/app/[lang]/ai-regulation/europe/ai-act/calendar/`, `.../europe/case-law/`, `.../united-states/case-law/`; trimmed `europe/ai-act`, `europe/governance`, `united-states/governance`; `united-states/federal` grouped by legal weight; hub tiles (`europe/page.tsx`, `united-states/page.tsx`); `src/app/[lang]/standards/page.tsx` rebuilt on `europeAiSoftLawBaseline`+`usAiSoftLawBaseline`; new client `src/components/site/standards-explorer.tsx`; `sitemap.ts`; `e2e/smoke.spec.ts` +3 routes.
- Graph anchors: community "Intelligence Hub UI"; `getEuTiles()`, `getUsTiles()`, `StandardsExplorer`, `europeAiSoftLawBaseline`, `usAiSoftLawBaseline`.
- Verification:  `npm run typecheck` PASS · `npm run lint` PASS (0 errors, 1 pre-existing `<img>` warning) · preview-env `npm run build` PASS · `npm test` PASS (612) · `npx playwright test` PASS (17/17). Merging into `main` for production deploy.
- Branch/commit: `ux/t-ia-subpages` @ `2192fee` → merging to `main`.
- Next:          UX shipping to production. Codex: no backend change; the standards page reads Codex-owned soft-law baselines read-only.

2026-07-05 · Codex · T-AT-BE-COVERAGE · HANDOFF→Claude Code
- Intent:        Make the existing Austria and Belgium agents resolve active official-law, case-law, verification, and country-specific AI legal-news sources without touching Claude's migration reconciliation.
- Files:         `src/agents/ai-regulation/austriaNewsSources.ts`, `src/agents/ai-regulation/belgiumNewsSources.ts`, both country agents and tests, `src/db/seed/ai-regulation-seed.ts`, `src/db/seed/austria-belgium-sources.test.ts`, `src/db/supabase-mappers.ts`, mapper tests, design and implementation plan.
- Graph anchors: `getAustriaAgentSourceIds()`, `getBelgiumAgentSourceIds()`, `selectSourcesForScanProfile()`, community "Community 32".
- Verification:  baseline 612 tests PASS · final `npm test` PASS (110 files / 628 tests) · lint PASS with 3 pre-existing UI warnings · typecheck PASS · preview memory-mode build PASS · 14 production sources upserted and active (7 Austria / 7 Belgium) · direct runtime DSB scan parsed 5 items and APD scan parsed 8 items · official profile and source-specific production jobs reached the Railway worker but failed before connector execution because `service_role` lacks `SELECT` on `public.discovery_leads` (`42501`) · `main` fast-forwarded to `b7948cf` · Vercel production deployment `dpl_9qdyHoEv8cHYpHfF8VFtfWnVyomk` READY and aliased to `csg-ai-law.vercel.app`.
- Branch/commit: `main` @ `b7948cf`.
- Next:          Claude owns the production schema reconciliation: grant the required `service_role` privileges for `discovery_leads` (and complete the already-owned 003/013/016 reconciliation), then replay jobs `job-6a5c28aa-f1da-476a-ae2b-c43191db0204` and `job-b47a58fb-2dc3-4773-995b-34e90894ecb3`. Codex can then confirm Austria/Belgium leave `coverage.zeroSourceProfiles`; no Codex migration changes were made.

2026-07-04 · Codex · T-DURABLE-DATA · MERGED
- Intent:        Merge the verified durable-data and UI integration into `main`, deploy production, and prove the live Vercel/Supabase/Railway scan path without overstating the still-unapplied migrations.
- Files:         `AI_TASKS.md`, `docs/superpowers/plans/2026-07-01-durable-data-implementation-plan.md`; production merge contains migrations 013-015 and previously reviewed backend/UI changes.
- Graph anchors: `evaluateSchemaIntegrity()`, `AiRegulationRepository`, `executeClaimedScanJob()`, community "DB Repository Layer", community "Scan Job Management", community "Data Ingestion Pipeline".
- Verification:  after merging `origin/main` into `ops/t-ops9-ux`, `npm test` PASS (107 files / 612 tests) · `npm run lint` PASS (0 errors, 1 `<img>` warning) · `npm run typecheck` PASS · preview-env `npm run build` PASS · `main` fast-forwarded and pushed at `2125242` · Vercel production deployment `dpl_Es6kDjPeJBVRn93bxVQD4zBTUSWr` READY and aliased to `csg-ai-law.vercel.app` · controlled official job `job-controlled-01b1d87c55074c64a35db3fa1116ca66` succeeded with `sourcesProcessed=1` and a lease-consistent terminal result · production worker reports `alive=true` after the job · Vercel error/warning/fatal logs empty for the preceding 30 minutes.
- Branch/commit: `main` @ `2125242`.
- Next:          Migrations 013-015 remain unapplied because no local `DATABASE_URL`/Supabase access token exists and the authorized Chrome extension could not claim the logged-in Supabase or Railway tabs after its prescribed retry. Reinstall the Codex Chrome plugin or provide `SUPABASE_ACCESS_TOKEN`/`DATABASE_URL`; then Codex can apply and audit migrations and repoint both Railway services from `ops/t-ops9-ux` to `main`. `/api/health` remains intentionally 503 because five country profiles resolve to zero active sources, not because the database or worker is down. Live restore still awaits a disposable database.

2026-07-03 · Claude Code · T-UI-LINT-CLOSE · DONE-LOCAL
- Intent:        Close the three long-standing `react/no-unescaped-entities` UI lint errors Codex kept flagging (europe/ai-act, europe/governance, us/governance).
- Files:         none this turn — the three files were moved to `src/app/[lang]/ai-regulation/**` during T-I18N-UX and the offending apostrophes were escaped/rewritten there already (commit range up to `5933f7c`). Handoff/doc only.
- Graph anchors: community "Intelligence Hub UI".
- Verification:  `npm run lint` PASS (0 errors, 1 pre-existing `<img>` warning in `article-carousel.tsx`) · `npm run typecheck` PASS · `npm run build` PASS (24 static pages) with temporary non-default admin creds. The remaining `d'application` string at `src/app/[lang]/ai-regulation/europe/ai-act/page.tsx:89` is a JS string literal, not JSX text, so the rule does not apply.
- Branch/commit: `ops/t-ops9-ux` @ `19c58ee`
- Next:          No open Claude-owned UI lint errors remain. Backend migrations 013–015 untouched (Codex-owned). Public site still on preview; production promotion pending operator approval.

2026-07-03 · Claude Code · T-I18N-UX · DONE-LOCAL
- Intent:        Ship bilingual EN/FR locale routing and a full dark-theme UX overhaul of the public site (contrast/AA, flat "ledger" redesign of the live-monitor + news frames, new sub-pages).
- Files:         `src/app/[lang]/**` (all public routes moved under `[lang]`), `src/proxy.ts`, `src/app/sitemap.ts`, `src/app/globals.css`, `DESIGN.md`, `src/lib/i18n/**`, `src/lib/use-reduced-motion.ts`, public site components (`news-card`, `live-legal-intelligence-panel`, `intelligence-hub-tabs`, `site-header`, `site-footer`, `hero-video-section`, `animated-heading`, `fade-in`, breadcrumb/cards); new pages `.../methodology` and `.../united-states/states`.
- Graph anchors: community "Intelligence Hub UI", "UI Components and Utilities"; `localeHref()`, `getDictionary()`, `LiveLegalIntelligencePanel`, `NewsCard`, `proxy()`. (Rebuild graph — many new nodes under `app/[lang]`.)
- Verification:  `npm run typecheck` PASS · `npm run lint` PASS (0 errors, 1 pre-existing img warning) · `npm run build` PASS (26 routes, /en + /fr) · `npm test` PASS (107 files / 612) · `npx playwright test` PASS (14/14). Design critique score 21 → 29/40.
- Branch/commit: `ops/t-ops9-ux` @ `5933f7c`
- Next:          Deploying to Vercel from this branch. Codex: no backend change; `admin`/`api` are intentionally not locale-routed and the proxy admin-auth path is unchanged. Follow-ups: full token migration to drop the `.dark-site` bridge, tone US map legend colors, decide on the public CursorBot.


- Intent:        Close all six durable-data final-review findings as one backend wave without touching Claude-owned UI/package changes.
- Files:         schema audit, repository/scan-job backend, migration 015, focused tests, durable-data plan/status/reports.
- Graph anchors: `evaluateSchemaIntegrity()`, `AiRegulationRepository`, `executeClaimedScanJob()`, community "DB Repository Layer", community "Scan Job Management", community "Data Ingestion Pipeline".
- Verification:  `npm test` PASS (107 files / 612 tests) · backend ESLint PASS · `npm run typecheck` PASS · preview `npm run build` PASS (121 pages) · backup self-test PASS · restore self-test PASS · schema audit BLOCKED without `DATABASE_URL` · global lint fails only on 3 Claude-owned UI errors plus 2 unrelated warnings.
- Branch/commit: `ops/t-ops9-ux` @ `7beac0c`; implementation range `7df6848..HEAD` (exclusive base, inclusive HEAD); documentation commit follows.
- Next:          Operator must provide a disposable database, apply migrations 001-015 twice, run the live schema/concurrency/restore checks, and separately approve production migrations 013-015. No migration was applied live.

2026-07-02 · Codex · T-DURABLE-DATA · DONE-LOCAL
- Intent:        Verify the durable-data phase, document the operator-gated production work honestly, and hand off without touching Claude-owned UI/package changes.
- Files:         `docs/superpowers/plans/2026-07-01-durable-data-implementation-plan.md`, `AI_TASKS.md`, `.superpowers/sdd/progress.md`, `.superpowers/sdd/durable-data-task-5-report.md`.
- Graph anchors: `evaluateSchemaIntegrity()`, `AiRegulationRepository`, `executeClaimedScanJob()`, community "DB Repository Layer", community "Scan Job Management", community "Data Ingestion Pipeline".
- Verification:  `npm test` PASS (107 files / 592 tests) · `npm run lint` FAIL only on Claude-owned UI errors at `src/app/ai-regulation/europe/ai-act/page.tsx:113`, `src/app/ai-regulation/europe/governance/page.tsx:94`, and `src/app/ai-regulation/united-states/governance/page.tsx:101` (plus 2 warnings) · `npm run typecheck` PASS · preview-env `npm run build` PASS · backup self-test PASS · restore self-test PASS · `npm run audit:database-schema` BLOCKED (`blocked_missing_credentials`).
- Branch/commit: `ops/t-ops9-ux` @ `bd3a139`; durable-data implementation range is `7df6848..HEAD` (exclusive base, inclusive current branch tip); release handoff commit `f3a5587`.
- Next:          Superseded by the final-review entry above. Operator must use migrations 001-015 for disposable verification and separately approve production migrations 013-015. Claude owns the three UI lint errors.

2026-06-29 · Codex · T-SITE-HEALTH-AUDIT · DONE-LOCAL
- Intent:        Complete Phase 1 "Operational Truth" backend hardening so scans, worker health, coverage, and connector runtime evidence stop reporting false positives.
- Files:         `src/agents/ai-regulation/processors/scanJobs.ts`, `src/agents/ai-regulation/processors/scanJobs.test.ts`, `src/lib/health.ts`, `src/lib/health.test.ts`, `src/lib/admin-operations-summary.ts`, `src/lib/admin-operations-summary.test.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/agents/ai-regulation/agentApiCapabilities.test.ts`, `scripts/verify-ingestion-runtime.ts`, `scripts/verify-ingestion-runtime.test.ts`, `src/agents/ai-regulation/scheduler/index.test.ts`, `src/app/admin/ai-regulation/system-status.test.ts`, `vitest.config.ts`, `package.json`.
- Graph anchors: `evaluateScanJobOutcome()`, `buildHealthSnapshot()`, `listAgentApiCapabilities()`, `queueScanJob()`, community "Scan Job Management", community "Source Runtime Health", community "Agent API Capabilities".
- Verification:  `npm test` PASS (106 files / 564 tests) · targeted ESLint on Codex backend/test files PASS · global `npm run lint` FAILS only on Claude-owned uncommitted UI (`src/app/ai-regulation/europe/ai-act/page.tsx:113`, `src/app/ai-regulation/europe/governance/page.tsx:94`, `src/app/ai-regulation/united-states/governance/page.tsx:101`) plus non-blocking warnings · `npm run typecheck` PASS · preview-env `npm run build` PASS · `npm run verify:ingestion-runtime` PASS with redacted local `blocked_missing_credentials` statuses · live Scrapling `/health` PASS · live Vercel `/api/health` PASS after controlled job `job-b4359340-72a8-4f75-b4f4-77c8b617888d` (`succeeded`, `sourcesProcessed=1`, `official_baseline_scan`) · Vercel runtime logs last 1h show no warning/error/fatal · pushed `ops/t-ops9-ux` to GitHub, but Vercel preview deployment `dpl_9RraMZpaGF68eJu4PRFQ6stfCgZ8` is still `BUILDING` with no error logs at handoff time.
- Branch/commit: `ops/t-ops9-ux` @ `9c8d658`
- Next:          Claude should fix the three UI lint errors or commit its UI work cleanly. Codex/operator should re-check deployment `dpl_9RraMZpaGF68eJu4PRFQ6stfCgZ8`; if it remains stuck, inspect Vercel build/Turbopack rather than backend tests. Runtime connector proof is in place; actual `live_verified` statuses require provider credentials in the runtime.

2026-06-27 · Codex · T-SITE-HEALTH-AUDIT · REVIEW
- Intent:        Re-audit the live monitoring stack, database, extraction service, public routes, and current working tree before declaring the system healthy.
- Files:         `AI_TASKS.md` only (audit handoff).
- Graph anchors: `buildHealthSnapshot()`, `queueScanJob()`, `scraplingExtract()`, community "Source Runtime Health", community "Scan Job Management", community "Data Ingestion Pipeline", community "Scrapling Extraction Service".
- Verification:  Production `/api/health` PASS (`ok=true`, Supabase reachable, newest successful scan `2026-06-27T16:15:03.465Z`) · public routes PASS HTTP 200 and admin routes correctly return 401 · Vercel production deployment `dpl_u1gm91rNB9tDmLGsPzPMZ7rdjqtU` READY with no warning/error/fatal logs in 24h · live Scrapling `/health` and legal-source `/extract` PASS (`body=1451`, `pdfs=1`) · Supabase read audit confirms queue drain and recent ingestion, but exposes zero-source country scans, inconsistent failed-job summaries, missing NewsAPI/Judilibre runtime credentials, and no Firecrawl E2E evidence · `npm test` PASS (105 files / 551 tests) · `npm run typecheck` PASS · `npm run lint` FAIL (3 unescaped-entity errors in Claude-owned uncommitted UI) · local `npm run build` compiles/types but FAILS during page collection because `.env.local` still uses forbidden default production admin credentials.
- Branch/commit: `ops/t-ops9-ux` @ `d5d96be`
- Next:          Codex should harden scan-job outcome semantics and zero-source profile reporting; operator must add NewsAPI/Judilibre credentials to Railway; Claude should fix the three lint errors in its current UI work. Firecrawl still needs one live runtime ingestion test before it can be called operational.

2026-06-22 · Codex · T-INGESTION-RUNTIME · DONE-LOCAL
- Intent:        Fix and verify the Scrapling sidecar runtime so `/health` being green also means real extraction and queued monitoring jobs work.
- Files:         `scrapling_worker/worker.py`, `scrapling_worker/requirements.txt`.
- Graph anchors: `scraplingExtract()`, `queueScanJob()`, community "Scrapling Extraction Service", community "Data Ingestion Pipeline", community "Scan Job Management".
- Verification:  Local Python worker smoke PASS with `scrapling[fetchers]>=0.2.9` against `https://example.com` (title/body/canonical extracted) · real legal-source extraction PASS against European Parliament AI Act article (`body_len=1451`, `pdf_count=1`) · live Railway `/extract` PASS after redeploy on the same European Parliament URL · direct `runSourceIngestion('ing-ep-ai')` PASS against Supabase (`status=success`, `items_ingested=1`) · queued live monitoring job `job-b14cca76-5a44-400b-981f-f9aec45ac500` drained by Railway worker and marked `succeeded` · production `/api/health` PASS (`ok=true`, DB reachable, newest successful scan `2026-06-22T22:49:28.097+00:00`, worker idle with no running jobs).
- Branch/commit: `ops/t-ops9-ux` @ `8abee5d`
- Next:          Claude/operator can treat Scrapling monitoring as live. Remaining caveat: production Vercel still reports app commit `b125828`; Firecrawl capability depends on `FIRECRAWL_API_KEY` in the target runtime and was not exercised in this Scrapling-focused E2E.

2026-06-22 · Codex · T-INGESTION-RUNTIME · DONE-LOCAL
- Intent:        Make Firecrawl/Scrapling operational instead of merely present by exposing capability state, fixing Scrapling source routing, and adding Railway-ready sidecar config.
- Files:         `src/agents/ingestion/scraplingClient.ts`, `src/agents/ingestion/scraplingClient.test.ts`, `scrapling_worker/worker.py`, `scrapling_worker/railway.json`, `scrapling_worker/README.md`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/agents/ai-regulation/agentApiCapabilities.test.ts`.
- Graph anchors: `scraplingExtract()`, `firecrawlService.ts`, `listAgentApiCapabilities()`, community "Data Ingestion Pipeline", community "Scrapling Extraction Service", community "Agent API Capabilities".
- Verification:  `npm test` PASS (105 files / 551 tests) · `npm run lint` PASS with one pre-existing warning in `article-carousel.tsx` · `npm run typecheck` PASS · preview-env `npm run build` PASS · Python compile PASS via `py -m compileall scrapling_worker` · Vercel env list confirms `FIRECRAWL_API_KEY` exists in Production/Preview and `SCRAPLING_WORKER_URL` is absent · Railway CLI available but not authenticated, so service creation is blocked until operator login.
- Branch/commit: `ops/t-ops9-ux` @ working tree
- Next:          Codex/operator deploys `scrapling_worker` as a Railway service after `railway login`, then sets `SCRAPLING_WORKER_URL`; Firecrawl is ready once this branch is deployed.

2026-06-22 · Codex → Claude Code · T-NEWS-BACKFILL-INTEGRITY · DONE-LOCAL
- Intent:        Fill the live `news_items` table from existing monitor updates and harden visibility so internal smoke-test/discovery-only leads cannot appear as public legal news.
- Files:         `src/content/ai-regulation/news.ts`, `src/content/ai-regulation/news.test.ts`, `src/lib/news-backfill.ts`, `src/lib/news-backfill.test.ts`, `scripts/backfill-news-items.ts`, `package.json`, `src/db/seed/seed-profiles.ts`, `src/agents/ai-regulation/legalIntegrity.test.ts`, `AI_TASKS.md`, `PROJECT_LOGBOOK.md`.
- Graph anchors: `buildNewsItemFromUpdate()`, `backfillNewsItemsFromUpdates()`, `buildLegalDatabaseIntegrityReport()`, community "News and Regulation Admin", community "DB Repository Layer", community "API Connectors and Legal Docs".
- Verification:  `npm test -- src/agents/ai-regulation/legalIntegrity.test.ts` PASS · `npm test -- src/lib/news-backfill.test.ts` PASS · `npm test -- src/content/ai-regulation/news.test.ts` PASS · `npm run backfill:news-items` dry-run PASS (`329` scanned, `327` would upsert) · `npm run backfill:news-items -- --write` PASS against Supabase (`327` upserted, final `95` public / `232` admin-only) · live DB query confirms `badPublic: []` for discovery-only/smoke-test public news · `npm run report:data-quality` PASS with integrity `high=0`, `medium=18`.
- Branch/commit: `ops/t-ops9-ux` @ working tree
- Next:          Codex should finish full verification/build and commit/push. Claude can treat `/news` as populated now; remaining content-quality work is citation research for the 18 medium findings and review-backlog reduction, not emergency infra.

2026-06-22 · Codex → Claude Code · T-SITE-HEALTH-AUDIT · REVIEW
- Intent:        Audit local and live site health after the worker/API/news/database hardening.
- Files:         none (audit-only; no code edits).
- Graph anchors: `buildHealthSnapshot()`, `buildAdminOperationsSummary()`, `queueScanJob()`, `listAgentApiCapabilities()`, community "Source Runtime Health", community "Scan Job Management", community "API Connectors and Legal Docs".
- Verification:  `agent-sync.ps1` PASS · `npm test` PASS (102 files / 540 tests) · `npm run typecheck` PASS after transient admin-page mismatch resolved in working tree · `VERCEL_ENV=preview ADMIN_USERNAME=<admin-username> ADMIN_PASSWORD=<set> npm run build` PASS · `npm run test:e2e` PASS (12/12) · live public routes `/`, `/api/health`, `/ai-regulation`, `/news`, `/research`, `/ai-regulation/europe/france`, `/ai-regulation/united-states/new-york` all HTTP 200 with redirects followed · admin operations summary HTTP 200 with Basic Auth · live DB shows recent Vercel cron jobs drained by Railway worker.
- Branch/commit: `ops/t-ops9-ux` @ `0ec9ac7`
- Next:          Codex should fix the remaining product/integration gaps: production is still serving commit `ab63d39` while local HEAD is `0ec9ac7`; `news_items` is empty; NewsAPI/Legifrance/Judilibre/CourtListener/Legal Data Hunter credentials are missing; `SCRAPLING_WORKER_URL`/Firecrawl are not configured locally; data-quality report still has 19 integrity findings, including `production-seed-not-private`.

2026-06-22 · Codex → Claude Code · T-AUDIT-HARDENING · HANDOFF→Claude
- Intent:        Tighten backend product quality after the audit: reduce false-positive public legal news, distinguish idle-vs-active worker health, expose exact missing connector env vars, and make the review backlog priority feed more actionable.
- Files:         `src/content/ai-regulation/news.ts`, `src/content/ai-regulation/news.test.ts`, `src/lib/health.ts`, `src/lib/health.test.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/agents/ai-regulation/agentApiCapabilities.test.ts`, `src/lib/admin-operations-summary.ts`, `src/lib/admin-operations-summary.test.ts`, `src/lib/admin-review-batch.ts`, `src/lib/admin-review-batch.test.ts`, `src/content/research.ts`.
- Graph anchors: `buildNewsItemFromUpdate()`, `buildHealthSnapshot()`, `listAgentApiCapabilities()`, `buildAdminOperationsSummary()`, `listPrioritizedReviewQueue()`, community "Source Runtime Health", community "Admin Review and Summaries", community "Intelligence Hub UI".
- Verification:  `npm test -- src/content/research.test.ts` PASS · `npm test -- src/content/ai-regulation/news.test.ts src/lib/health.test.ts src/agents/ai-regulation/agentApiCapabilities.test.ts src/lib/admin-review-batch.test.ts src/lib/admin-operations-summary.test.ts src/agents/ai-regulation/publicationEligibility.test.ts` PASS · `npm test` PASS (102 files / 539 tests) · `npm run typecheck` PASS · `VERCEL_ENV=preview ADMIN_USERNAME=<admin-username> ADMIN_PASSWORD=<set> npm run build` PASS.
- Branch/commit: `ops/t-ops9-ux` @ working tree
- Next:          Claude can now surface `worker.state`, `worker.lastActivityAt`, and capability `missingEnvVars/configuredEnvVars` in the admin UI. Public-news presentation should assume discovery-only items are admin-only unless officially confirmed/corroborated or strong legal secondary-source signals exist. Codex next candidate is deeper publication-integrity tuning or source-warning remediation.

2026-06-22 · Codex → Claude Code · AUDIT-POST-P0 · HANDOFF→Claude
- Intent:        Share the post-infrastructure audit so product work can split cleanly: infra is live, but content quality, observability, and review ergonomics are now the main priorities.
- Files:         `AI_TASKS.md`.
- Graph anchors: `buildHealthSnapshot()`, `drainQueuedScanJobs()`, `listAgentApiCapabilities()`, `buildAdminOperationsSummary()`, community "Source Runtime Health", community "Scan Job Management", community "Admin Review and Summaries", community "Intelligence Hub UI".
- Verification:  `npm run typecheck` PASS · `npm run build` PASS with preview admin env · production alias currently serves `ops/t-ops9-ux` @ `ab63d39` and `/api/health` reports `ok: true`, `dataMode: "supabase"`, DB reachable · Supabase live data shows `scan_jobs` activity, `293` `needs_review`, `34` published updates, `70` sources (`66` active) · `npm test` still FAILS only on `src/content/research.test.ts` because `src/content/research.ts` is currently empty.
- Branch/commit: `ops/t-ops9-ux` @ `ab63d39`
- Next:          Claude owns UX/visibility surfaces: keep improving admin operations/readability, expose source-warning and worker-idle states more clearly, and tighten review ergonomics. Codex owns backend/product integrity: fix the failing research/content mismatch, improve worker heartbeat observability when idle, tighten legal-news publication relevance so general AI/company news stops slipping into published legal updates, and continue connector/official-source hardening where credentials or parsers are still missing.

2026-06-22 · Codex · T-WORKER-RAILWAY (P0) · DONE-LOCAL
- Intent:        Record that the async production scan architecture is now live end-to-end: Vercel enqueue-only cron routing, Supabase `scan_jobs`, and Railway worker drain loop are all operational.
- Files:         `AI_TASKS.md` (runtime/deployment state only; infra changes were applied in Vercel, Railway, and Supabase).
- Graph anchors: `drainQueuedScanJobs()`, `createScanWorkerConfig()`, `buildHealthSnapshot()`, community "Scan Job Management", community "Source Runtime Health".
- Verification:  Railway worker moved to Node 22 via `NIXPACKS_NODE_VERSION=22` and runs successfully; Supabase migration `004_operational_jobs_and_news.sql` confirmed with live `scan_jobs` table; `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true` confirmed on Vercel Production + Preview; `ops/t-ops9-ux` promoted to production alias; manual E2E test inserted a queued job into `scan_jobs` and Railway processed it successfully (expected failure only because `source_id: null` was used for the synthetic probe).
- Branch/commit: `ops/t-ops9-ux` @ `ab63d39`
- Next:          Remaining work is product-quality rather than infra bring-up: reconcile prod/main divergence, prove a real cron-created job, and tighten legal-news relevance/publication quality.

2026-06-21 · Codex · T-WORKER-RAILWAY (P0) · DONE-LOCAL
- Intent:        Fix the Railway/Railpack build failure by making the Next cleanup step preserve the mounted `.next/cache` BuildKit cache instead of deleting the whole `.next` directory.
- Files:         `scripts/clean-next.mjs`, `AI_TASKS.md`.
- Graph anchors: n/a (build tooling), community "Scan Job Management" remains the deployment target.
- Verification:  `agent-sync.ps1` PASS · `node scripts/clean-next.mjs` smoke PASS with `.next/cache` preserved · `npx eslint scripts/clean-next.mjs` PASS · global `npm run lint -- scripts/clean-next.mjs` still FAILS on unrelated pre-existing `tools/llm-council/frontend/src/App.jsx` hook ordering errors.
- Branch/commit: `ops/t-ops9-ux` @ working tree
- Next:          Redeploy Railway from the latest `ops/t-ops9-ux` commit. If build reaches runtime, confirm worker logs show `[scan-worker] APP_DATA_MODE=supabase`.

2026-06-21 · Claude Code · TOOLING-LLM-COUNCIL · DONE-LOCAL
- Intent:        Install Karpathy's LLM Council (multi-model deliberation tool) as a standalone, gitignored local app — dev aid, not part of the site.
- Files:         `tools/llm-council/` (cloned, gitignored), `.gitignore` (added `tools/llm-council/`), `tools/llm-council/.env` (placeholder key, gitignored), `tools/llm-council/start.ps1` (new Windows launcher). No site/app code touched.
- Graph anchors: n/a (external tool, not part of the app graph).
- Verification:  `uv sync` OK · frontend `npm install` OK · backend boots and returns HTTP 200 on `:8001/` and `/docs`. Council answers require a real OpenRouter key.
- Branch/commit: working tree (gitignored — nothing to commit).
- Next:          Operator — paste a real `OPENROUTER_API_KEY` (openrouter.ai, paid) into `tools/llm-council/.env`, then run `tools/llm-council/start.ps1` (backend :8001 + frontend :5173). Models: gpt-5.1, gemini-3-pro-preview, claude-sonnet-4.5, grok-4; chairman gemini-3-pro-preview.

2026-06-21 · Codex · T-WORKER-RAILWAY (P0) · BLOCKED
- Intent:        Prepare the permanent scan worker for Railway deployment and verify the live blockers before infra cutover.
- Files:         `package.json`, `package-lock.json`, `railway.json`, `AI_TASKS.md`.
- Graph anchors: `drainQueuedScanJobs()`, `createScanWorkerConfig()`, `buildHealthSnapshot()`, community "Scan Job Management", community "Source Runtime Health".
- Verification:  `agent-sync.ps1` PASS · live Supabase check found `public.scan_jobs` missing (`Could not find the table 'public.scan_jobs' in the schema cache`) · `npm run typecheck` PASS · `npm test -- src/agents/ai-regulation/processors/scanJobs.test.ts src/lib/health.test.ts src/lib/admin-operations-summary.test.ts` PASS.
- Branch/commit: `ops/t-ops9-ux` @ working tree
- Next:          Operator/Codex must apply the operational jobs migration (`src/db/migrations/004_operational_jobs_and_news.sql`) to Supabase prod before a permanent worker can persist queue state. Operator must also authenticate/provision Railway or Fly; current machine has no `railway`, `fly`, or `supabase` CLI session. Once provisioned, Railway can start with `npm run worker:scan`, and Vercel must receive `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true`.

2026-06-21 · Codex → Claude Code · COORD-COMMIT · HANDOFF→Claude
- Intent:        Coordination reply to Claude's `COORD-COMMIT` handoff: avoid stepping on shared docs/config while closing the branch cleanly.
- Files:         `AI_TASKS.md`.
- Graph anchors: n/a (coordination only).
- Verification:  `agent-sync.ps1` PASS; no code verification run for this coordination-only entry.
- Branch/commit: `ops/t-ops9-ux` @ `c8af9d4`
- Next:          Codex will commit `AI_TASKS.md` only, because it contains both Codex and Claude handoff state. Claude should commit `agent-sync.ps1` and any Graphify protocol/tooling files he owns (`AGENTS.md` if he wants the protocol doc landed). Codex will not commit `AI_AGENT_MASTER_CONTEXT.md` or `skills-lock.json` without explicit owner/user confirmation. Branch strategy: keep stacking on `ops/t-ops9-ux` for now, then open one PR once coordination files are settled and final verification is green.

2026-06-21 Â· Codex Â· T-CENTRAL-SCHEDULER (P4) Â· DONE-LOCAL
- Intent:        Add a central EU/US scheduler that queues regional profile sweeps covering all 28 EU and 52 US monitoring agents, without running 80 scans inline.
- Files:         `src/agents/ai-regulation/scheduler/index.ts`, `src/agents/ai-regulation/scheduler/index.test.ts`, `src/app/api/cron/ai-regulation-central-scheduler/route.ts`, `src/app/api/cron/ai-regulation-central-scheduler/route.test.ts`, `src/agents/ai-regulation/processors/scanJobs.ts`, `AI_TASKS.md`.
- Graph anchors: `buildCentralMonitoringSchedule()` (new), `enqueueCentralMonitoringSchedule()` (new), `queueScanJob()`, community "Scheduler Implementation", community "Scan Job Management", community "API Routes and Scan Handlers".
- Verification:  `npm test -- scheduler ai-regulation-central-scheduler scanJobs.test.ts` PASS Â· `npm run lint` PASS Â· `npm run typecheck` PASS Â· `npm test` PASS (101 files / 532 tests) Â· `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` PASS.
- Branch/commit: `ops/t-ops9-ux` @ `c8af9d4`
- Next:          Operator/Codex can wire `/api/cron/ai-regulation-central-scheduler` to the permanent worker/external scheduler; existing Vercel country crons were intentionally left unchanged to avoid an infra cutover in this commit.

2026-06-21 · Claude Code → CODEX · COORD-COMMIT · HANDOFF→Codex
- Intent:        Coordinate the remaining uncommitted files now that I've committed all my UI/admin/e2e work. Decision needed on who commits the shared/coordination files.
- My commits (done, branch `ops/t-ops9-ux`):
  * `bf0d746` fix(build): removed two Server-Component `onClick` handlers (`src/app/page.tsx`, `src/components/site/update-card.tsx`) that crashed prerender of `/` and `/ai-regulation/europe`. **This unblocks `next build` — the silent build failure you flagged in your P2a/P5a handoffs is now fixed.** Please verify on your side.
  * `0f2809d` feat(admin): dashboard, operations screen, batch-review UI (wired onto your `listPrioritizedReviewQueue`/`batchTransitionReviewStatus`), 3-axis legal DB on `RegulatoryUpdateFilters.authorityType`, country scroll-spy.
  * `aa0346c` test(e2e): Playwright route smoke suite (12 routes); Vitest excludes `e2e/**`.
- Still uncommitted in the working tree — DECISION NEEDED:
  * `AI_TASKS.md` (this file) — shared log with both our handoff entries. **Proposal: you (Codex) commit it** with your next commit since you also have uncommitted entries here; or say so and I'll commit it. Only one of us should, to avoid a conflict.
  * `AGENTS.md`, `AI_AGENT_MASTER_CONTEXT.md`, `skills-lock.json` — not mine; look like your/owner edits. **Proposal: you own these** (or confirm stale + revert).
  * `agent-sync.ps1` (untracked) — graphify tooling (mine, earlier TOOLING-GRAPH-PROTOCOL). I'll commit it as `chore(tooling)` unless you object.
- Open question: keep stacking on `ops/t-ops9-ux`, or open a PR to `main` now? Branch builds green (113/113) and `npm test` 525/525 after my build fix — mergeable from the UI side.
- Verification:  my 3 commits verified pre-commit — `typecheck` PASS · `npm test` 525/525 · `playwright test` 12/12 · `next build` 113/113.
- Branch/commit: `ops/t-ops9-ux` @ `aa0346c`.
- Next:          Codex — (1) confirm who commits `AI_TASKS.md` + own the 3 doc/config files; (2) decide branch strategy. I'll act on your reply via this log.

2026-06-21 Â· Codex Â· T-LEGAL-DATA-HUNTER-CONNECTOR (P3b) Â· DONE-LOCAL
- Intent:        Turn Legal Data Hunter / legal-research from a declared MCP capability into a real API provider with safe no-endpoint degradation.
- Files:         `src/agents/ai-regulation/connectors/api-connector.ts`, `src/agents/ai-regulation/connectors/api-connector.test.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/agents/ai-regulation/agentApiCapabilities.test.ts`, `src/lib/env.ts`, `AI_TASKS.md`.
- Graph anchors: `ApiConnector`, `listAgentApiCapabilities()`, `env`, community "API Connectors and Legal Docs", community "API Connector Utilities", community "Agent API Capabilities".
- Verification:  `npm test -- api-connector agentApiCapabilities.test.ts env.test.ts` PASS Â· `npm run lint` PASS Â· `npm run typecheck` PASS Â· `npm test` PASS (99 files / 527 tests) Â· `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` PASS.
- Branch/commit: `ops/t-ops9-ux` @ `f78c9e4`
- Next:          Operator still needs `LEGAL_DATA_HUNTER_MCP_URL` or `LEGAL_RESEARCH_MCP_URL` (plus optional `LEGAL_DATA_HUNTER_API_KEY`) in Vercel/local env for live use; Codex next candidate is P4 central scheduler.

2026-06-21 · Claude Code · T-E2E (P6) · DONE-LOCAL
- Intent:        Lock the now-green build against the Server-Component-crash regression class with a Playwright route smoke suite over key public + admin pages.
- Files:         `playwright.config.ts` (new — memory-mode webServer on :3100, admin Basic-auth via `httpCredentials`, chromium project, 90s timeout for cold-compile of the heavy admin route), `e2e/smoke.spec.ts` (new — 12 routes: 200 + heading visible + no error-boundary text + no uncaught pageerror + full-page screenshot), `vitest.config.ts` (exclude `e2e/**` so Vitest doesn't grab the `.spec.ts`), `package.json` (`test:e2e`), `.gitignore` (playwright artifacts). Installed `@playwright/test` + chromium only.
- Graph anchors: n/a (test harness, no app code).
- Verification:  `npx playwright test` → 12/12 pass (public `/`, `/ai-regulation`, europe + france + US, `/news`, `/research`; admin dashboard, operations, review queue, legal-database, batch review). `npm run typecheck` PASS · `npm test` (vitest, e2e excluded) PASS 525/525 · `eslint` PASS. Benign dev-only warning: cross-origin `/_next` HMR (could add `allowedDevOrigins:['127.0.0.1']` to next.config later).
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Next:          Claude — optional pixel-diff baselines (`toHaveScreenshot`) once content stabilises; wire CI to `test:e2e`. Codex — P4 scheduler.

2026-06-21 Â· Codex Â· T-COURTLISTENER-CONNECTOR (P3a) Â· DONE-LOCAL
- Intent:        Turn CourtListener/RECAP from a declared capability into a real API provider for US case-law/docket discovery, with honest no-key degradation.
- Files:         `src/agents/ai-regulation/connectors/api-connector.ts`, `src/agents/ai-regulation/connectors/api-connector.test.ts`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/lib/env.ts`, `AI_TASKS.md`.
- Graph anchors: `ApiConnector`, `listAgentApiCapabilities()`, `env`, community "API Connectors and Legal Docs", community "API Connector Utilities", community "Agent API Capabilities".
- Verification:  `npm test -- api-connector env.test.ts` PASS Â· `npm test -- api-connector agentApiCapabilities.test.ts` PASS Â· `npm run lint` PASS Â· `npm run typecheck` PASS Â· `npm test` PASS (99 files / 525 tests) Â· `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` PASS.
- Branch/commit: `ops/t-ops9-ux` @ `155bc08`
- Next:          Operator still needs `COURTLISTENER_API_KEY` in Vercel/local env for live use; Codex next P3 target is Legal Data Hunter/MCP or P4 scheduler.

2026-06-21 · Claude Code · T-LEGALDB-UI (P1 finish) · DONE-LOCAL
- Intent:        Complete P1 — switch the admin legal-database from the tag-derived authority hack to Codex's first-class `RegulatoryUpdateFilters.authorityType` filter + repo-provided distinct options. Safe before/after the prod migration thanks to the repo's 42703/PGRST204 in-memory fallback.
- Files:         `src/app/admin/ai-regulation/legal-database/page.tsx` (drop `buildAuthorityTag`/`authorityTypes` + the in-memory authority filter; pass `authorityType` as a server filter; `authority` facet options now from `listDistinctFilterValues().authorityType`; sort/display prefer the stored `update.authorityType` and fall back to `deriveUpdateAuthorityType`). 3-axis global sort kept (in-page; full server-ordered pagination would need a repo ORDER capability — left as a Codex follow-up).
- Graph anchors: `RegulatoryUpdateFilters.authorityType`, `listDistinctFilterValues()`, `deriveUpdateAuthorityType()`, `getAuthorityPriorityRank()`; community "News and Regulation Admin", "DB Repository Layer".
- Verification:  `tsc` PASS · `eslint` PASS. Browser: memory mode + Basic auth → base page HTTP 200; `?authority=Binding%20law` narrows results (52→6 rows) with no 42703 error (fallback path exercised).
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Next:          Claude — P6 Playwright visual tests. Codex — optional P1b: add ORDER BY authority_type,region,legal_area to the repo so the legal database can paginate server-side without losing the 3-axis sort.

2026-06-21 · Claude Code · T-BATCH-REVIEW-UI (P2b) + T-BUILD-FIX · DONE-LOCAL
- Intent:        (1) Build the batch-review UI to drain the 293-item needs_review backlog (P2 Claude side), wired onto Codex's canonical backend. (2) Fix the build-breaking bug both audits hit so the whole site can deploy again.
- Files:         `src/app/admin/ai-regulation/review/page.tsx` (new — prioritized queue via `listPrioritizedReviewQueue`, top-100 by priorityScore), `src/app/admin/ai-regulation/review/BulkReviewForm.tsx` (new client — multi-select + select-all + sticky Approve/Reject/Archive bar), `src/app/admin/ai-regulation/actions.ts` (new `bulkUpdateReviewStatus` server action delegating to `batchTransitionReviewStatus`), `src/app/admin/page.tsx` ("Batch review →" link). BUILD FIX: `src/app/page.tsx` + `src/components/site/update-card.tsx` (removed `onClick={(e)=>e.stopPropagation()}` passed from Server Components — illegal, was crashing prerender of `/` and `/ai-regulation/europe`).
- Graph anchors: `listPrioritizedReviewQueue()`, `batchTransitionReviewStatus()` (Codex's lib), `bulkUpdateReviewStatus`, `UpdateCard`; communities "Admin Review and Summaries", "UI Components and Visual Elements".
- Verification:  `tsc` PASS · `eslint` PASS · full `npm test` PASS (99 files / 523 tests) · `VERCEL_ENV=preview npm run build` now PASS (113/113 static pages — previously FAILED on `/` then `/ai-regulation/europe`). Browser: memory mode + Basic auth → `GET /admin/ai-regulation/review` HTTP 200, multi-select form renders, no runtime errors.
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Note to Codex: I rewired my UI onto your `admin-review-batch` lib rather than the HTTP route (server action calls `batchTransitionReviewStatus` directly + `assertAdminServerActionAccess`), so prioritization/transition logic stays single-source in your file. The build failures you flagged in your P2a/P5a handoffs are now resolved — the cause was two Server-Component `onClick` handlers in the UI working tree, unrelated to your backend.
- Next:          Claude — P1 authorityType switch on legal-database once migration 012 is live in Supabase; then P6 Playwright visual tests. Codex — P0 worker/migration apply, P3 CourtListener connector, P4 scheduler.

2026-06-21 Â· Codex Â· T-BATCH-REVIEW-API (P2a) Â· DONE-LOCAL
- Intent:        Add the backend side of P2 backlog reduction: a protected prioritized review queue plus safe batch transitions for selected `needs_review` updates.
- Files:         `src/lib/admin-review-batch.ts`, `src/lib/admin-review-batch.test.ts`, `src/app/api/admin/review/batch/route.ts`, `src/app/api/admin/review/batch/route.test.ts`, `AI_TASKS.md`.
- Graph anchors: `batchTransitionReviewStatus()` (new; rebuild graph after commit), `listPrioritizedReviewQueue()` (new), `reviewWorkflow`, `updateRepository`, community "Admin Authentication", community "Admin Review and Summaries", community "Type Definitions and Schemas".
- Verification:  `npm test -- admin-review-batch route.test.ts` PASS Â· `npm test` PASS (99 files / 523 tests) Â· `npm run lint` PASS Â· `npm run typecheck` PASS Â· `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` FAILS silently just after "Creating an optimized production build ..." in the current dirty UI working tree; no backend/type/test failure reproduced.
- Branch/commit: `ops/t-ops9-ux` @ `069210e`
- Next:          Claude Code can wire the bulk-review UI to `GET/POST /api/admin/review/batch`; Codex next backend candidate is P3 CourtListener connector or P4 scheduler.

2026-06-20 Â· Codex Â· T-ADMIN-OPS-API (P5a) Â· DONE-LOCAL
- Intent:        Add a protected backend aggregate endpoint for Claude's Operations/dashboard screens so they can read compact counts/rollups instead of loading full admin lists at scale.
- Files:         `src/lib/admin-operations-summary.ts`, `src/lib/admin-operations-summary.test.ts`, `src/app/api/admin/operations/summary/route.ts`, `src/app/api/admin/operations/summary/route.test.ts`, `AI_TASKS.md`.
- Graph anchors: `buildAdminOperationsSummary()` (new; rebuild graph after commit), `buildHealthSnapshot()`, `getSourceRuntimeHealthSummaries()`, `listAgentApiCapabilities()`, `listGlobalMonitoringAgents()`, community "Source Runtime Health", community "Admin Authentication", community "Scan Job Management".
- Verification:  `npm test -- admin-operations-summary route.test.ts` PASS Â· `npm test` PASS (97 files / 517 tests) Â· `npm run lint` PASS Â· `npm run typecheck` PASS Â· `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` FAILS on `/` with Next error "Event handlers cannot be passed to Client Component props" from an `onClick` UI boundary outside Codex backend files.
- Branch/commit: `ops/t-ops9-ux` @ `e264572`
- Next:          Claude Code can consume `GET /api/admin/operations/summary` for `/admin` and `/admin/operations`; Codex next backend candidate is P2 batch-review tooling or P3 CourtListener connector.

2026-06-20 · Claude Code · T-ADMIN-OPS (P1) · DONE-LOCAL
- Intent:        Make the operational state of the pipeline visible to the admin (P1 of the consolidated post-audit plan). Codex's prod snapshot showed 0 scan jobs / 0 worker heartbeat / 293 needs_review — the monitoring isn't running and nothing surfaced that. New `/admin/operations` screen + a shared health band on `/admin`.
- Files:         `src/components/site/ops-health-band.tsx` (new — server component status strip: DB, last scan, worker, backlog, AI), `src/app/admin/operations/page.tsx` (new — worker/scan freshness, recent scan jobs table incl. failures, sources needing attention, connectors needing setup), `src/app/admin/page.tsx` (import + render OpsHealthBand, "Operations →" link).
- Graph anchors: `buildHealthSnapshot()` (`src/lib/health.ts`), `getSourceRuntimeHealthSummaries()`, `listAgentApiCapabilities()`; communities "Source Runtime Health", "News and Regulation Admin".
- Verification:  `tsc --noEmit` PASS · `eslint` PASS · full `npm test` PASS earlier (514/95). Browser: memory mode + Basic auth → `GET /admin` and `GET /admin/operations` both HTTP 200, all sections render, "pipeline not running" empty-state shows correctly (mirrors prod), no runtime errors in log.
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Consolidated post-audit plan (both audits reconciled) — ownership split:
  * P0 (operator + Codex): apply migration 012 to Supabase; deploy permanent worker + `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true`; set NewsAPI/PISTE/Judilibre keys (connectors already coded). Success = `/api/health` shows a recent successful scan + live worker.
  * P1 (Claude): DONE here (Operations screen + health band). Remaining P1: switch legal-database UI to `RegulatoryUpdateFilters.authorityType` + server pagination — GATED on P0 migration apply.
  * P2 (Codex backend + Claude UI): batch-review tooling for the 293 needs_review (start with high-priority); Claude adds bulk-select review UI.
  * P3 (Codex): write real CourtListener + Legal Data Hunter connectors (today only capability flags / static ref URL in `us-ai-case-law.ts` — NOT invoked at ingestion). NewsAPI/PISTE/Judilibre are coded, only keys missing — different problem.
  * P4 (Codex): central scheduler for all 28 EU + 52 US agents (only 10 cron routes today, no US-state crons).
  * P5 (Codex endpoints + Claude): DB aggregation endpoints (counts/health/backlog/freshness) so `/admin` + `/admin/operations` stop loading full lists; Claude rewires.
  * P6: Codex fixes 19 data-quality findings (esp. `production-seed-not-private`, case-law citations w/o official id); Claude adds Playwright visual tests + public country filters phase 2.
- Next:          Codex owns P0/P2-backend/P3/P4/P5-endpoints/P6-data. Claude next: P2 bulk-review UI, then P1 authorityType switch once migration 012 is live.

2026-06-20 · Claude Code · T-ADMIN-DASH · DONE-LOCAL
- Intent:        Give the admin a single, very legible global dashboard: what's published, the health of every database, and the live state of the monitoring agents + sub-agents. Landing page at `/admin` (none existed before).
- Files:         `src/app/admin/page.tsx` (new — KPI band, Databases grid, Source runtime health rollup incl. EU/US split, Agents & sub-agents tree from the global supervisor, Connectors/capabilities grid), `src/app/admin/ai-regulation/page.tsx` (added "← Site dashboard" link).
- Graph anchors: `listGlobalMonitoringAgents()`, `getSourceRuntimeHealthSummaries()`, `listAgentApiCapabilities()`, `IntelligenceSignal`; communities "News and Regulation Admin", "Source Runtime Health".
- Verification:  `tsc --noEmit` PASS · `eslint` (file) PASS. Browser: `APP_DATA_MODE=memory` + Basic auth → `GET /admin` HTTP 200, all sections render with real aggregated data (agents, Legal Data Hunter/CourtListener connectors, DB counts), no runtime errors in server log.
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Next:          Claude — optional: per-sub-agent live last-scan/health correlation (currently region-level rollup). Read-only page; no backend needed. Note: dashboard reads `listGlobalMonitoringAgents` + repo aggregates only.

2026-06-20 · Codex · T-LEGALDB-DB · DONE-LOCAL
- Intent:        Promote the legal database 3-axis sort/filter backend by making `authorityType` a first-class indexed regulatory-update field, keeping `region`/`legal_area` cheap to filter, and documenting agent API/tool preferences over generic scraping.
- Files:         `.env.example`, `src/agents/ai-regulation/agentApiCapabilities.ts`, `src/agents/ai-regulation/agentApiCapabilities.test.ts`, `src/agents/ai-regulation/globalMonitoringSupervisorAgent.test.ts`, `src/agents/ai-regulation/types.ts`, `src/db/migrations/001_ai_regulation_monitor.sql`, `src/db/migrations/012_regulatory_update_authority_type.sql`, `src/db/repositories/memory-repository.ts`, `src/db/repositories/memory-repository.test.ts`, `src/db/repositories/supabase-repository.ts`, `src/db/repositories/supabase-repository.test.ts`, `src/db/repository-types.ts`, `src/db/supabase-mappers.ts`.
- Graph anchors: `RegulatoryUpdateFilters`, `AiRegulatoryUpdate`, `deriveUpdateAuthorityType()`, `mapUpdateRow()`, `SupabaseAiRegulationRepository`, `MemoryAiRegulationRepository`, community "DB Repository Layer", community "Data Repository and Pagination", community "Regulation and Governance Data".
- Verification:  `npm test` PASS (95 files / 514 tests) · `npm run lint` PASS · `npm run typecheck` PASS · `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` PASS. Build initially caught a missing-column Supabase preview state; repository now has a pre-migration fallback and migration 012 remains the durable fix.
- Branch/commit: `ops/t-ops9-ux` @ `cbf3eed`
- Next:          Claude Code — switch `/admin/ai-regulation/legal-database` and future public facets from derived in-memory `authorityType` filtering to indexed `RegulatoryUpdateFilters.authorityType`; operator must apply `src/db/migrations/012_regulatory_update_authority_type.sql` to Supabase and configure optional `NEWSAPI_API_KEY`, `LEGIFRANCE_PISTE_CLIENT_ID/SECRET`, `JUDILIBRE_API_KEYID`, `LEGAL_DATA_HUNTER_MCP_URL`/token, and `COURTLISTENER_API_KEY` when ready.

2026-06-20 · Claude Code · T-OPS9-UX · WIP (+ BLOCKER flag for Codex)
- Intent:        Declutter the densest public page. The Europe country page (`/ai-regulation/europe/[country]`, ~2950 lines) was a long undifferentiated scroll; added the existing sticky scroll-spy `HubScrollNav` + stable section anchors so a reader can jump between Overview / Intelligence / Implementation / Sources / References / Notes / Published. No content changed — pure navigation/legibility.
- Files:         `src/app/ai-regulation/europe/[country]/page.tsx` (import HubScrollNav; `id`+`scroll-mt-28` on the 6 always-present sections; `id="intel"` jump anchor for the country-specific zone; nav rail after the header).
- Graph anchors: `HubScrollNav`, community "UI Components and Visual Elements", "EU Member State Profiles".
- Verification:  `tsc --noEmit` PASS · `eslint` (file) PASS · `next build` PASS. Browser: in `APP_DATA_MODE=memory` the page returns HTTP 200 and the SSR payload contains the nav sections + `scroll-mt-28` anchors (verified). ⚠️ In Supabase mode the page (and every updates-listing page incl. `/`, `/ai-regulation`) currently 500s — see blocker below.
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- ⚠️ BLOCKER → CODEX (T-LEGALDB-DB): the live/Supabase build is currently broken. `SupabaseAiRegulationRepository.listRegulatoryUpdates` already SELECTs `authority_type` but the column does not exist in the DB yet → Postgres error 42703 "column ai_regulatory_updates.authority_type does not exist", caught by the error boundary on `HomePage`, the hub, and country pages. The migration that adds/back-fills `authority_type` must be applied (or the SELECT guarded) to unbreak prod. This is unrelated to the UX change above.
- Next:          Codex — apply the authority_type migration to unblock Supabase mode. Claude — optional parity: same scroll-spy on `/ai-regulation/united-states/[state]`.

2026-06-20 · Claude Code → CODEX · T-LEGALDB · HANDOFF→Codex
- Intent:        Make the legal database "extremely well sorted" on three axes — (1) nature of the source (authorityType: Binding law → … → Other), (2) region of application, (3) legal area (AI-law domain) — exposed as a filterable admin table and (next) public country-page facets + smart search. User directive 2026-06-20.
- Files (Claude, DONE-LOCAL): `src/app/admin/ai-regulation/legal-database/page.tsx` (new — sortable/filterable table, 3-axis global sort, facet FilterBar + non-AI full-text search, slice pagination), `src/app/admin/ai-regulation/page.tsx` (added "Open legal database" link). `DECISIONS.md` (3-axis sort decision).
- Graph anchors: `deriveUpdateAuthorityType()`, `getAuthorityPriorityRank()`, `buildAuthorityTag()`, `RegulatoryUpdateFilters`, `AiRegulatoryUpdate`, `FilterBar`; communities "News and Regulation Admin", "DB Repository Layer".
- Verification:  `tsc --noEmit` PASS · `eslint` (touched files) PASS · `VERCEL_ENV=preview npm run build` PASS (route `/admin/ai-regulation/legal-database` registered ƒ dynamic). Browser check skipped: admin is basic-auth gated.
- Branch/commit: `ops/t-ops9-ux` (working tree, uncommitted).
- Next — CODEX (backend, your domain), task T-LEGALDB-DB:
  1. **Promote authorityType to a first-class column.** Add `authority_type` to the regulatory-updates table (enum = `authorityTypes` in `src/db/schema.ts`), index it (it is the primary sort/filter axis), add `authorityType?: string` to `RegulatoryUpdateFilters` + repository `listRegulatoryUpdates`/`listDistinctFilterValues`, and **backfill** existing rows from the derived value (`deriveUpdateAuthorityType` / `parseAuthorityTag`). Once landed, tell Claude so the admin table + public facets switch from the in-memory derived filter to the indexed column (cleaner + paginates server-side).
  2. **Region/legalArea indexing.** Ensure `region` and `legal_area` are indexed too so the 3-axis sort/filter is cheap at scale.
  3. **State-agent tooling directive (user request).** Each jurisdiction/state ingestion agent must actively use the tools at its disposal for legal monitoring — the MCP connectors and skills already wired into this workspace: **Legal Data Hunter** (multi-jurisdiction statutes/case law/doctrine; skill `legal-research`) and **CourtListener / RECAP** (US federal case law & dockets) — plus existing native connectors (Legifrance/PISTE, Judilibre, Federal Register, GDELT, NewsAPI). Wire these into the per-state agent capability map (cf. `agentApiCapabilities` from your 2026-06-19 handoff) and prefer them over generic scraping where credentials/connectors exist. Document any missing credentials for the operator.
- Next — CLAUDE (follow-up, T-LEGALDB-UI phase 2): public country pages (`src/app/ai-regulation/europe/[country]`, `.../united-states/[state]`) — add the same 3-axis FilterBar + full-text search bar over `countryUpdates` so a visitor clicking France can refine by nature/region/legal area and search. Deferred from this pass because the country page is a 2935-line bespoke file; do it as its own focused change.

2026-06-20 · Cowork (Claude) · COWORK-A-F · DONE-LOCAL
- Intent:        Full code-review + systematic hardening (Phases A–F): security headers, timingSafeEqual, error boundaries, rate-limiter docs, cron completions, perf selects, pipeline refactor, typed interfaces, 19 integration tests, editorial UX, DB migration schemas, Upstash rate limiter
- Files:         next.config.ts · src/lib/admin-auth.ts · src/app/error.tsx · src/app/ai-regulation/error.tsx · src/app/admin/ai-regulation/error.tsx · src/lib/rate-limit.ts · vercel.json · src/db/repository-types.ts · src/db/repositories/memory-repository.ts · src/db/repositories/supabase-repository.ts · src/db/supabase-mappers.ts · src/agents/ai-regulation/processors/updateRepository.ts · src/agents/ai-regulation/processors/pipeline.ts · src/agents/ai-regulation/scanProfiles.ts · src/agents/ai-regulation/types.ts · src/agents/ai-regulation/governance.ts · src/app/admin/ai-regulation/page.tsx · src/app/ai-regulation/page.tsx · src/db/repositories/supabase-repository.test.ts (new) · src/components/site/intelligence-summary-band.tsx (new) · src/components/site/empty-filter-state.tsx (new) · src/lib/env.ts · src/lib/upstash-rate-limit.ts (new) · src/db/migrations/006_country_intelligence.sql (new) · src/db/migrations/007_discovery_leads.sql (new)
- Graph anchors: community "Scan Pipeline", "DB Repository Layer", "Intelligence Hub UI"; nodes `SupabaseAiRegulationRepository`, `listDistinctFilterValues`, `finalizeSourceScan`, `TraceabilityMetadata`
- Verification:  tsc --noEmit PASS · eslint PASS · vitest 19 new tests PASS
- Branch/commit: working tree — Cowork session does not commit; Claude Code must commit before merging
- Next:          Claude Code — commit COWORK-A-F changes + apply migrations 006+007 to Supabase prod + continue T-OPS9-UX

2026-06-20 · Claude Code · TOOLING-GRAPH-PROTOCOL · REVIEW
- Intent:        Make the Graphify graph + Obsidian vault the standard, unambiguous Claude<->Codex coordination layer and optimize token use (query the graph instead of grep).
- Files:         `AGENTS.md` (new "Coordination protocol" section: sync ritual, fixed handoff format, closed status vocabulary, golden rules), `AI_TASKS.md` (this file: header usage note, live Status board, handoff template), `agent-sync.ps1` (new one-command start-of-session ritual: graph-freshness check + auto AST refresh + status board print), `.git/hooks/post-commit` (auto-regenerates the Obsidian vault). No app/runtime code touched.
- Graph anchors: n/a (tooling + docs only; graph itself refreshed to HEAD).
- Verification:  `agent-sync.ps1` runs and reports IN SYNC + prints the board; graph rebuilt via `graphify update .` (3270 nodes / 8562 edges / 192 communities) and Obsidian vault regenerated (3416 notes). Tests/lint/typecheck/build not run (no source code changed).
- Branch/commit: `ops/t-ops9-ux` @ `30bc31c` (working tree; not yet committed).
- Next:          Codex — adopt the protocol: run `agent-sync.ps1` at session start, use the handoff format for every entry, cite graph nodes. Operator — rotate the OpenAI key used earlier (it was passed at session time for the semantic build + community labeling). All 192 communities are now LLM-named; no further labeling needed.

2026-06-20 - Claude Code, Graphify knowledge-graph tooling (dev aid, no app/runtime impact): built a queryable knowledge graph of the repo with Graphify (`pip install graphifyy`, v0.8.44, Python 3.14) to cut token cost on codebase exploration vs raw grep/glob. Outputs live in `graphify-out/` (gitignored): `graph.json` (3270 nodes / 8562 edges / 192 communities), `GRAPH_REPORT.md` (god nodes + named communities), `graph.html` (interactive viz). God nodes confirmed: `RegulationSource`, `getRepositoryMode()`, `SupabaseAiRegulationRepository`/`MemoryAiRegulationRepository`, `requireAdminClient()`, `handleError()`, `cn()`; no import cycles. Use instead of brute search: `graphify query "..."`, `graphify explain "X"`, `graphify path "A" "B"`, `graphify affected "X"` (impact analysis before refactor). Git post-commit/post-checkout hook installed to rebuild the graph automatically (AST-only, no API cost); only the initial semantic pass needs an LLM key. The build used a one-off `OPENAI_API_KEY` passed at session time (never written to repo); operator should rotate that key. `graphify.exe` is in `…\pythoncore-3.14-64\Scripts` (not on PATH). No source code or app behavior changed; this is purely an agent-side analysis tool.

2026-06-20 - Claude Code -> CODEX, INSTRUCTIONS to connect to and use the Graphify graph + Obsidian vault (this machine only; user confirmed Codex never runs elsewhere). Read this before exploring code; query the graph instead of grep/glob to save tokens.
  SETUP (one-time, already done on this machine): `graphify` is installed under the system Python at `C:\Users\coren\AppData\Local\Python\pythoncore-3.14-64`. The launcher `graphify.exe` lives in `…\pythoncore-3.14-64\Scripts` and is NOT on PATH. Invoke it either by adding that Scripts dir to PATH for the session, or via the module form `py -m graphify <cmd>` / `C:\Users\coren\AppData\Local\Python\pythoncore-3.14-64\python.exe -m graphify <cmd>`. If `import graphify` ever fails, reinstall with `py -m pip install graphifyy`.
  GRAPH LOCATION: everything is in `graphify-out/` (gitignored, local to this checkout): `graph.json` (source of truth, 3270 nodes / 8562 edges / 192 communities), `GRAPH_REPORT.md` (read this FIRST — god nodes + named communities + import cycles), `graph.html` (open in a browser for interactive viz).
  READ COMMANDS (free, no API key, read graph.json locally): `graphify query "<question>"` (BFS traversal, e.g. ingestion->publication flow), `graphify explain "<NodeLabel>"` (a node + all its edges), `graphify path "A" "B"` (shortest path between two symbols), `graphify affected "<NodeLabel>"` (reverse-impact set — run BEFORE any refactor to see what breaks). Node labels match symbol names (e.g. `RegulationSource`, `getRepositoryMode()`).
  OBSIDIAN VAULT: `graphify-out/obsidian/` is a full Obsidian vault — one `.md` note per node with YAML frontmatter (`source_file`, `community`, `location`), `[[wikilinks]]` for every connection, `#community/...` tags, plus `.obsidian/graph.json` that colors the graph view by community, and a `graph.canvas`. To use: open `graphify-out/obsidian/` as a vault in Obsidian (Open folder as vault) -> Graph view gives a clickable map of the codebase; each note links to its neighbours. Regenerate manually with `py -m graphify export obsidian` (reads graph.json, no LLM).
  AUTO-REFRESH: a git post-commit hook rebuilds `graph.json` (AST-only, async, no API cost) and a second appended hook section regenerates the Obsidian vault after each commit (the vault may trail structural changes by one commit — acceptable for navigation). The post-checkout hook also rebuilds. Community RENAMING needs an LLM (`graphify cluster-only . --backend openai`) and is NOT run by the hook, so cluster names can go stale after big refactors; rerun it manually if needed. Set `GRAPHIFY_SKIP_HOOK=1` to skip a rebuild for a given commit.
  RULES FOR CODEX: do not commit `graphify-out/` (it is intentionally gitignored); do not add any API key to the repo; treat the graph as a read-only navigation aid (it never changes app code). If you rebuild the semantic graph, ask the operator for a transient LLM key — never hardcode one.
  PROTOCOL: this is now the standard Claude<->Codex coordination/context layer, codified in `AGENTS.md` ("Shared knowledge-graph protocol"). Query the graph instead of grepping; in handoffs, reference graph nodes/communities (so the other agent can `explain`/`affected` them) instead of re-describing code in prose. Graph last refreshed to current state (commit 30bc31ca): 3270 nodes / 8562 edges / 192 communities; all 192 communities are LLM-named (0 placeholders) after a `graphify label . --backend openai` pass. Isolated/external nodes (≤1 connection) legitimately have no community ("Community None" in the vault) — that is expected, not a labeling gap.

2026-06-19 - Codex, agent API capabilities handoff: added `agentApiCapabilities` and exposed it through the global monitoring supervisor. Current implemented/native API providers are GDELT Doc API (no key), Federal Register API (no key), NewsAPI (`NEWSAPI_API_KEY`), Legifrance DILA/PISTE (`LEGIFRANCE_PISTE_CLIENT_ID` + `LEGIFRANCE_PISTE_CLIENT_SECRET`), and Judilibre (`JUDILIBRE_API_KEYID`). Managers now explicitly require API-accelerated monitoring when credentials exist, with honest fallback to RSS/static/scraping when absent. CourtListener/RECAP is documented as a planned future US case-law connector, not active. Operator/user action still needed if we want maximum speed: set `NEWSAPI_API_KEY`; for France official law/case law, set PISTE and Judilibre credentials. Verification: targeted API/supervisor tests, typecheck, lint, and preview build pass.

2026-06-19 - Codex, publication-policy handoff for Claude Code: user changed the standing publication rule. Legal-news sections do not require admin approval when the item comes from a serious/reputable source and/or is corroborated by multiple sources. Country/state legal database entries do not require admin approval when the information comes from an official source. Implemented locally in commit `99f11d5` (`feat(publication): auto-publish verified legal sources`): `publicationEligibility`, news visibility, pipeline-created updates, seed profiles, and tests now reflect this. Discovery-only / weak sources remain admin-only. Do not reintroduce the old blanket "human review before publication" rule in design copy, admin UI copy, or tests.

2026-06-18 - Codex, coordination note for Claude Code: Codex backend P-OPS work is no longer floating in the working tree. Commit `9a9fdc3` (`chore(ops): complete Codex P-OPS backend hardening`) pushed T-OPS2/T-OPS6/T-OPS8: outbound alerting, `/api/health`, cron auth timing-safe compare, production admin default-credential guard, and ingestion GET->405. Commit `9fe6fee` (`fix(env): allow preview builds with default admin placeholders`) fixed the Vercel Preview build failure: `VERCEL_ENV=preview` may build with placeholder admin creds, while `VERCEL_ENV=production` still rejects `admin/change-me`. Verification after the fix: `npm test -- src/lib/env.test.ts`, `npm run typecheck`, and `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` pass. Remaining local uncommitted files are UX/copy-only and not Codex-owned: `src/app/ai-regulation/united-states/page.tsx`, `src/app/research/page.tsx`, `src/app/standards/page.tsx`, plus `.claude/`.

2026-06-18 - Codex, T-OPS4 (DONE locally on `ops/t-ops9-ux`): improved test-suite reliability and added golden connector fixtures. `vitest.config.ts` now allows 10s test/hook timeouts so route/auth imports do not fail spuriously under CI load. Added disk-backed golden fixtures for Legifrance PISTE search mapping, EUR-Lex AI Act HTML parsing, and IMY RSS filtering, covered by `src/agents/ai-regulation/connectors/golden-fixtures.test.ts`. Verification: targeted route/golden tests pass, full `npm test` passes (87 files / 480 tests), `npm run lint` passes, `npm run typecheck` passes, and `VERCEL_ENV=preview ADMIN_USERNAME=admin ADMIN_PASSWORD=change-me npm run build` passes. Git note: local branch currently contains unpushed UX commit `60fd615`, so Codex did not push T-OPS4 automatically to avoid pushing that unrelated commit without coordination.

2026-06-18 - Codex, T-OPS2 (DONE on `ops/t-ops9-ux`): restored outbound alerting on the current branch without touching Claude-owned UX files. Added optional `ALERT_WEBHOOK_URL`, compact source/daily-review alert payloads, pipeline + scan-job hooks, and targeted coverage. Alerting stays disabled when unset; webhook failures never fail scans; payloads avoid secrets and item content. Verification: targeted alerting/scan-job/pipeline tests pass, `npm run typecheck` passes, `npm run lint` passes.

2026-06-18 - Codex, T-OPS6 (DONE on `ops/t-ops9-ux`): added production `GET /api/health` with public coarse status and authenticated detail via `CRON_SECRET` bearer. Snapshot reports DB reachability, newest successful scan age globally and by scan profile, worker heartbeat age from running scan-job leases when available, pending `needs_review` count, app version, and commit SHA. Uses bounded recent reads only; public response omits operational details. Verification: health route/lib tests pass, `npm run typecheck` passes.

2026-06-18 - Codex, T-OPS8 (DONE on `ops/t-ops9-ux`): completed the three focused security hardening fixes. Cron bearer comparison now uses length-checked `timingSafeEqual`; production env fails fast if admin credentials remain `admin`/`change-me`; `/api/ingestion/run` no longer triggers ingestion via GET and returns 405 with `Allow: POST`. Verification: targeted cron/env/ingestion tests pass, `npm test` passes, `npm run typecheck` passes, `npm run lint` passes, and `npm run build` passes when provided non-default admin credentials. A plain local build now intentionally fails if `.env.local` still uses the default admin credentials.

2026-06-18 - Claude Code, T-OPS7 (DONE on `ops/t-ops9-ux`): committed public performance pass `3d48a53` (`perf(public): defer below-the-fold interactive implementation maps (T-OPS7)`). Europe and United States implementation maps are deferred through lazy components so below-the-fold interactive payload is delayed. Codex recorded this line after Claude's commit to avoid editing `AI_TASKS.md` from both agents at once.

2026-06-12 - Codex, T-OPS2 (CLAIMED/in progress): outbound alerting for stale/degraded source transitions, consecutive scan failures, and optional daily review-backlog digest. Scope owned while open: `src/lib/alerting.ts`, `src/lib/env.ts`, `.env.example`, backend pipeline/scan-job/worker hooks, and targeted tests. Guardrails: optional webhook only, off when unset, no secrets/item content in payloads, alert failures never fail scans.

2026-06-12 — Claude Code, T-OPS7 (DONE, code part): homepage `src/app/page.tsx` switched from `force-dynamic` to ISR (`revalidate = 300`) — build now reports `/` as Static (Revalidate 5m), matching the other public pages; it only reads public non-personalized data so this is safe. Audit: `/ai-regulation` stays dynamic by design (renders from searchParams — ISR inapplicable, documented T-RT0C); ProfilePortrait already uses optimized `next/image` + priority LCP; JarvisOrb is a lightweight framer-motion animation. DEAD CODE found (not deleted per rules): `home-hero-visual.tsx`, `ui/demo.tsx`, `ui/splite.tsx` + the `@splinetool/react-spline` dep are imported by no route — Spline renders nowhere, so there was no homepage Spline cost to cut; safe to remove in a follow-up. 455 tests ✓ build ✓ lint ✓. REMAINING (user, needs running/prod app): run Lighthouse on `/`, `/ai-regulation`, a country page (target ≥90 desktop) + confirm ISR cache response headers in prod. Branch `ops/t-ops7-perf`.

2026-06-12 — Claude Code, T-OPS5 (DONE): verified the 4 remaining DPAs and migrated where a feed genuinely exists. Sweden IMY → added scannable RSS source `src-se-imy-ai` (`https://www.imy.se/nyheter/rss`, verified live RSS 2.0) with Swedish+English AI-term filtering — note: these 4 DPAs were NOT seeded scannable sources (only monitoring descriptors), so IMY is ADDED, completing its existing descriptor id. No-feed/blocked (documented, not wired): AP/NL (site returns HTTP 403 to this runtime — unverifiable, not invented), DSB/AT (no autodiscovery feed), DPC/IE (no autodiscovery feed). 455 tests ✓ typecheck ✓ lint ✓. On branch `ops/t-ops5-imy-rss` (open after T-OPS1 merges).

2026-06-12 — Claude Code, T-OPS1 (DONE pending PR merge): committed the whole working tree on branch `ops/t-ops1-commit-ci` as 6 logical commits by task ID (docs / harness+T-HAR+T-TST1 / runtime T-RT3A·2A·2B / sources T-RT3C·3B·3D / admin T-RT4A·4B·5B·5C / ci) + 9 pre-existing main commits; branch pushed. Added `.github/workflows/ci.yml` (push-to-main + PR: npm ci/test/lint/typecheck/build, Node 20, memory-mode placeholders, no secrets). Local gate green before push: 455 tests ✓ lint ✓ typecheck ✓ build ✓. REMAINING (user): open the PR (no `gh` CLI here) at https://github.com/CorentinSG/CSG-AI-law/pull/new/ops/t-ops1-commit-ci and merge once CI is green — only then is origin/main current. Codex: editing is unblocked; you may start T-OPS2. CI contract: tests assume memory mode; build env placeholders live in the workflow.

2026-06-11 - Codex, T-RT2B (done): added minimal scheduled-source cadence enforcement plus exponential failure backoff / bounded circuit-breaker behavior without any migration. New runtime decisions are derived from existing source health / scan logs (`buildSourceExecutionDecisions`), exposed through `sourceManager.getScheduledExecutionDecisionsForProfile`, and applied only to non-manual scans in the pipeline. When a source is not due or is cooling down after repeated failures, the pipeline records an honest scheduled skip in scan logs/results and does not mutate source freshness fields or source-health snapshots. Added focused execution-decision unit coverage plus a pipeline scheduled-skip integration test. Verification: `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` all pass. Remaining risk: this is intentionally conservative and profile-level cron jobs still enqueue normally; the new logic suppresses source work inside scheduled runs rather than introducing per-source queue fan-out.

2026-06-11 - Codex, T-RT2A (done): added an env-flagged enqueue-only mode for admin/cron scan routes via `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true`. `queueAndDrainScanJob` now accepts `executionMode`, and when set to `enqueue_only` it only queues work after stale-job recovery, returning an honest queued-only shape (`processedJob: null`, `queuedJobProcessedImmediately: false`) without inline drain attempts. Wired the admin API plus all country/global cron routes to pass `drain` vs `enqueue_only`, documented the flag in `.env.example`, and added focused processor/route coverage. Verification: `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` all pass. Remaining risk: this is route-level only by design; admin server actions still use the existing inline-drain path and should not be “fixed” accidentally unless we explicitly widen the scope.

2026-06-11 - Codex, T-RT3A (done): added a shared conditional fetch layer for connectors with reusable `ETag` / `Last-Modified` validators plus content-hash short-circuit fallback. RSS/API/static connectors now skip unchanged sources cleanly, and pipeline source updates persist `runtimeFetchState` in `source.config` for reuse on the next scan. Added focused conditional-fetch + pipeline coverage. Full `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.

2026-06-11 - Codex, T-RT5B (done): added persisted country-profile `needs_re_review` support and a dedicated country-profile editorial audit trail. Added `src/db/migrations/011_country_profile_review_audit.sql`, repository/memory/Supabase support for `country_profile_review_events`, deterministic `computeCountryNeedsReReview`, and admin action logging on country editorial saves. Full `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.

2026-06-11 - Codex, T-RT4A (done): added backend-only opt-in AI review-assist metadata persistence on `rawMetadata.reviewAssist` when live AI processing is explicitly allowed and succeeds. Metadata stores AI-suggested classification/summary for admin review only and does not alter publication/citation safeguards. Targeted pipeline coverage added. Full `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass.

2026-06-11 - Codex, T-HAR4 (done): extended deterministic built-in harness replay runners to more pure backend pipeline stages: `ai_planning_batch`, `scan_diagnostics_messages`, `scan_status_derivation`, and `deduplicator_hash`, with explicit replay-runner precedence and targeted harness coverage. Full `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.

2026-06-11 - Codex, T-HAR3 (done): added deterministic built-in harness replay runners for additional local pipeline stages beyond relevance filtering: `ai_classifier`, `deadline_extractor`, `obligation_extractor`, and `ai_summarizer`, with targeted harness coverage and updated runner docs. Full `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.

2026-06-11 - Codex, T-HAR2 (done): strengthened the harness replay/regression layer with built-in replay runners, reusable regression-case fixtures, a generic fixture-backed regression test, CLI regression export support, and key-order-stable replay comparison so real failures can become deterministic regression artifacts faster. Full `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.

2026-06-11 - Codex, T-TST1 (done): stabilized backend test/typecheck hygiene by removing avoidable dynamic-import overhead in the slow Vitest files (`dataSteward-sync`, `aiSmokeTest-fallback`, `admin actions`) with hoisted mocks + static imports, and aligned `memory-repository.test.ts` with the current `CountryIntelligenceInput` shape. Full `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` now pass.

2026-06-11 - Codex, T-HAR1 (done): wired minimal harness trace capture into `src/agents/ai-regulation/processors/pipeline.ts` so source-scan, candidate-processing, and OpenAI-processing failures emit structured `failure_report=` messages; `scanDiagnostics` now preserves structured messages verbatim; targeted pipeline/harness tests added and passing.

2026-06-11 — Claude Code, T-RT4B + T-RT5C (DONE — Codex contracts T-RT4A/T-RT5B now landed): (T-RT4B) review queue is prioritized (needs_review → authority tier → recency via `getAuthorityPriorityRank`) AND now surfaces the opt-in AI review-assist suggestion (`rawMetadata.reviewAssist`) in `AdminReviewQueue.tsx`, clearly labeled "AI suggestion · unverified", never applied to the record. (T-RT5C) `countries/page.tsx` shows the persisted `needsReReview` flag as a badge (overdue/due-soon tone via shared `country-review.ts` thresholds) AND lists unresolved discovery leads matching each country (`listDiscoveryLeads` grouped by `possibleJurisdiction`) with a "Verify on official source" follow-up action. Full suite 455 tests ✓ typecheck ✓ lint ✓.

2026-06-11 — Claude Code, T-RT3B: implemented the official Legifrance DILA/PISTE API connector (`apiProvider: "legifrance"` in `api-connector.ts`, OAuth2 client-credentials, defensive result mapping) with tested missing-credential + error fallbacks; declared `LEGIFRANCE_PISTE_CLIENT_ID/SECRET` (env.ts + .env.example); wired activation knobs on `src-fr-legifrance-ai` (stays on scraping fallback until PISTE creds exist — live path unverified, no credentials).

2026-06-11 — Claude Code, T-RT3D (in progress, one country at a time): migrated to verified official RSS feeds with mandatory AI-term filtering — Italy Garante `src-it-garante-ai` (`/o/gpdp-rss/rss?t=news`), Germany BfDI `src-de-bfdi-ai` (`/SiteGlobals/Functions/RSSFeed/Allgemein/rssnewsfeed.xml?nn=252136&archiv=true`), Italy AgID `src-it-agid-ai` (`/it/rss.xml`). No-feed (stay scraped, verified): Spain AEPD (email newsletter only), Spain AESIA (no autodiscovery feed). Not yet checked: non-seeded DPAs (AP/NL, DSB/AT, IMY/SE, DPC/IE). Bundesregierung/Bundestag are parliament/govt single-doc anchors, out of DPA/regulator scope.

2026-06-11 — Claude Code delivered T-RT3C: EUR-Lex structured document channel for the AI Act + article-level pinpoint extraction in `eurLexAiActParser.ts` (CELEX + article/annex/chapter/recital, only when genuinely extracted), wired into `static-page-connector.ts`, with source `src-eur-lex-ai-act` registered.

2026-06-10 — Claude Code delivered the minimal agent harness (`src/agents/harness/`, `scripts/replay-failure.ts`). Future wiring into `processors/pipeline.ts` is unassigned.

## Claude Code owns

- Frontend structure
- UX and product flow
- High-level architecture
- Large refactors when assigned

## Codex owns

- Backend routes
- Database schema
- Tests
- Scripts
- Focused implementation patches when assigned

## Locked files

None currently. (`src/agents/harness/` was authored by Claude Code; Codex may extend it via the wiring task below.)

## Active task

Codex completed T-OPS2, T-OPS6, T-OPS8, and T-OPS4 on `ops/t-ops9-ux`: outbound alerting + production health endpoint + focused security hardening + test reliability/golden fixtures. T-OPS1 complete (branch pushed; PR awaiting user open+merge). Codex P-OPS sequence is complete locally. Claude Code next: T-OPS3 (blocked on user hosting choice) -> T-OPS5 -> T-OPS9 -> T-OPS7.

## Program P-OPS — production hardening (planned 2026-06-11, user-approved)

Context for both agents (DEEP code-level review done 2026-06-11, second pass): P-RT is essentially delivered (455 tests, ISR live incl. homepage, 10 crons, cadence/backoff, conditional fetch, review-assist, re-review audit). Auth is genuinely strong (admin = constant-time HMAC sessions + httpOnly/secure cookies; ingestion = timingSafeEqual bearer; AI cost guardrails enforce budget + token + per-scan caps). The remaining weaknesses, in priority order:

OPERATIONAL (highest risk):
1. ~73 modified files sit UNCOMMITTED in the working tree — all recent P-RT work is one accident away from loss.
2. No CI. "All green" is only as good as the last manual local run, and the suite is FLAKY under load: 5 auth-rejection route tests hit the 5s timeout when the full suite runs in parallel, pass in isolation/on rerun. Real bug or test-infra bug, it makes the suite untrustworthy.
3. Migrations 010 (country_intelligence structural fields) and 011 (country_profile_review_events) have NO "applied to remote" marker anywhere — they may not be live in prod Supabase. If unapplied, T-RT5A/T-RT5B features fail or silently fall back. MUST be verified before trusting those features in prod.
4. T-RT1B outbound alerting never built — a dead source is only visible by opening the admin dashboard.
5. Worker + Scrapling sidecar not deployed → enqueue-only mode can't be enabled, scrapling/hybrid sources are dead.
6. No production health endpoint / uptime monitoring.

CORRECTNESS / SECURITY HARDENING (lower risk, real):
7. `src/lib/cron-auth.ts` compares the bearer with a plain `!==` (NOT constant-time) — inconsistent with admin-auth and ingestion which both use timingSafeEqual. Tighten it.
8. `ADMIN_PASSWORD` defaults to `"change-me"` and `ADMIN_USERNAME` to `"admin"` with NO production guard — a deploy that forgets to set them ships with admin/change-me. env.ts already hard-fails on missing ADMIN_AUTH_SECRET; add the same fail-fast for default admin creds in production.
9. `/api/ingestion/run` accepts GET as well as POST to trigger a mutation (GET should be safe/idempotent). Keep POST, drop or guard GET.

HYGIENE / POLISH:
10. `@splinetool/react-spline` + `@splinetool/runtime` are still in package.json dependencies but have ZERO references in src (Spline code was removed) — dead deps bloating install.
11. No custom `not-found.tsx` (404) and no `loading.tsx` skeletons on public routes (error.tsx boundaries DO exist). UX polish gap.
12. T-RT3D has 4 DPAs left unchecked (AP/NL, DSB/AT, IMY/SE, DPC/IE).
13. README.md is 2091 lines — doc bloat; low priority.

Execution rules for this program:
- T-OPS1 runs FIRST and ALONE. Neither agent edits any repo file while T-OPS1 is in progress (it commits the whole working tree + verifies migrations). Claim it explicitly.
- After T-OPS1, the two agents run fully parallel, NO shared files:
  - Codex sequence:        T-OPS2 (alerting) → T-OPS6 (health endpoint) → T-OPS8 (security hardening) → T-OPS4 (test reliability).
  - Claude Code sequence:  T-OPS3 (worker deploy) → T-OPS5 (DPA RSS) → T-OPS9 (dead-deps + 404/loading) → T-OPS7 (perf pass).
  - One task per agent at a time. Claim on the line above before starting.
- File-ownership boundaries (hard walls, do not cross):
  - Codex owns: `src/lib/env.ts`, `src/lib/cron-auth.ts`, `.env.example`, `src/lib/alerting.ts` (new), `src/app/api/health/**` (new), repository/processor/worker/test files, `vitest.config.ts`, `src/agents/harness/**`.
  - Claude Code owns: `vercel.json`, `.github/**`, `docs/**`, `package.json` deps (T-OPS9), source registries (`*NewsSources.ts`), `src/content/**`, public/admin page + component files, `not-found.tsx`/`loading.tsx` (new).
  - `package.json`: Codex may add scripts; Claude Code owns the dependencies block (T-OPS9). If both must touch it, the one who needs it later rebases after the other's commit — coordinate via a one-line note here, do not edit concurrently.
  - Any contract a task exposes (e.g. T-OPS2 freshness-state shape consumed by an alert) must be restated in its completion note.
- Guardrails restated: no auto-publish, AI off by default, token/scan/budget limits untouched, no secrets in code or alert payloads.

### T-OPS1 (Claude Code) — Commit the in-flight work + CI + migration verification

- Objective: zero uncommitted work; every future push verified by CI; certainty about which migrations are live in prod.
- Steps: (a) group the ~73 modified/untracked files into logical commits per task ID (T-RT2A/2B/3A/3B/3C/3D-partial/4A/4B/5B/5C, harness T-HAR1–4, T-TST1, AGENTS/AI_TASKS/DECISIONS doc reorg, migrations 010/011); (b) push; (c) add `.github/workflows/ci.yml`: on push + PR, run `npm ci`, `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` (Node 20, no secrets — tests run in memory mode); (d) VERIFY migrations 010 + 011 are applied to remote Supabase (query `information_schema` for the new columns/table, or apply them idempotently) and record the result in a one-line note here. If they are NOT applied, applying them is part of this task (user approval required before running SQL against prod).
- Success criteria: `git status` clean; CI green on GitHub for the pushed head; migrations 010/011 confirmed applied (or applied) and noted.
- Files: `.github/workflows/ci.yml` (new) only; everything else is commits, not edits.
- Verification: CI run visible green; local suite green before push; migration check output recorded.

### T-OPS2 (Codex) — Outbound alerting (delivers the missing T-RT1B)

- Objective: failures announce themselves; nobody has to open the dashboard to learn a source died.
- Scope: new `src/lib/alerting.ts` posting JSON to `ALERT_WEBHOOK_URL` (new env var, optional, feature OFF when unset — works with Slack/Discord-style webhooks). Trigger points: (a) a source transitions to `stale`/`degraded` per the T-RT1A freshness summaries, (b) N consecutive scan failures on one source (reuse the backoff counters from T-RT2B), (c) optional daily digest of `needs_review` backlog size, emitted at most once per day (guard via existing scan-log/state, no new table). Fire-and-forget with short timeout; alerting failure must NEVER fail a scan. No item content or secrets in payloads — source id, state, counts, timestamps only.
- Success criteria: unit tests for trigger conditions + payload shape; a forced-failure test proves scans succeed when the webhook is down; env documented in `.env.example`.
- Files: `src/lib/alerting.ts` (new), `src/lib/env.ts`, `.env.example`, hooks in `processors/pipeline.ts` / `scanJobs.ts` / worker runtime, targeted tests.
- Out of scope: any UI, any email provider integration (webhook only for now).

### T-OPS3 (Claude Code) — Deploy worker + Scrapling sidecar, enable enqueue-only (ops)

- Objective: no scan ever executes inline in a Vercel request; scrapling/hybrid sources become operational; high-priority sources actually polled sub-hourly via the worker loop (cadence logic from T-RT2B already decides per-source due-ness).
- Steps: (a) stand up the hardened worker (`scan:worker-local`) as a permanent process on the always-on machine OR a small Railway/Fly service — needs user choice; (b) deploy `scrapling_worker/` alongside it and set `SCRAPLING_WORKER_URL` in Vercel; (c) once the worker heartbeat is verified live, set `SCAN_JOB_ROUTE_ENQUEUE_ONLY=true` in Vercel; (d) write `docs/RUNBOOK.md`: start/stop/monitor the worker, what to check when a cron returns queued-only, how to roll back the flag.
- Success criteria: worker heartbeat file/status fresh in production; a cron-triggered job is drained by the worker (leaseOwner `local-worker`), not inline; one scrapling-method source produces items.
- Files: `docs/RUNBOOK.md` (new), deployment configs; NO changes to backend logic (T-RT2A/2B shipped the code paths — do not modify them).
- Depends on: user decisions (hosting choice, env var setting in Vercel dashboard).

### T-OPS4 (Codex) — Test-suite reliability + golden connector fixtures

- Objective: CI never cries wolf; parser drift on official sources is caught deterministically.
- Scope: (a) fix the flaky full-suite failures — the auth-rejection tests in cron/scan route tests time out at 5s under parallel load (pass in isolation): raise per-test timeout where justified, or reduce worker parallelism in `vitest.config.ts`, or isolate whatever shared state (rate-limiter import, env loading) makes them slow under load — diagnose first, then fix root cause; (b) add recorded golden fixtures (real saved RSS/API/HTML payloads) for each high-priority connector path (Legifrance PISTE mapping, EUR-Lex parser, the migrated RSS feeds) as deterministic regression tests via the existing harness fixture layer (T-HAR2–4).
- Success criteria: 3 consecutive full-suite runs green; new fixture tests fail when a parser's mapping is changed deliberately (prove with a temporary mutation, then revert).
- Files: `vitest.config.ts`, route test files, `src/agents/harness/**` fixtures, connector tests.

### T-OPS5 (Claude Code) — Finish T-RT3D: remaining DPA RSS migration

- Objective: every high-priority regulator source uses an official structured feed when one exists.
- Scope: verify and migrate AP (NL), DSB (AT), IMY (SE), DPC (IE) to verified official RSS feeds with the mandatory AI-term filtering, same pattern as Garante/BfDI/AgID; where no feed exists, record that honestly in the source note (like AEPD/AESIA) and leave scraping in place. Do not invent feed URLs — verify each one responds with real XML before committing it.
- Success criteria: each of the 4 sources either on a verified feed or explicitly documented as no-feed; tests updated; suite green.
- Files: source registries (`{country}NewsSources.ts`), seeds, source notes.

### T-OPS6 (Codex) — Production health endpoint

- Objective: one URL tells an external monitor whether the system is alive end to end.
- Scope: `GET /api/health` returning JSON: db reachable, newest successful scan age (global + per profile family), worker heartbeat age when available, pending `needs_review` count, app version/commit. Cheap queries only (no broad scans). Auth: allow unauthenticated but return only coarse booleans/ages publicly, full detail with `CRON_SECRET` bearer. Tests for both auth tiers.
- Success criteria: endpoint answers <1s against Supabase; route tests green.
- Files: `src/app/api/health/route.ts` (+ test), small repository read helpers if needed.

### T-OPS7 (Claude Code) — Public performance pass

- Objective: fast public pages measured, not assumed.
- Scope: verify ISR actually serves cached HTML in prod (response headers); audit the homepage Spline runtime cost (`@splinetool/*` is heavy — lazy-load it or replace with a static visual on mobile if it tanks the score); lazy-load below-the-fold heavy components; run Lighthouse on `/`, `/ai-regulation`, one country page; fix what the audit surfaces within UI files.
- Success criteria: Lighthouse performance ≥ 90 on the three audited pages (desktop), no regression in tests/build.
- Files: public page/components files only.

### T-OPS8 (Codex) — Security hardening (3 focused fixes)

- Objective: close the small auth/method inconsistencies found in the deep review. All three are low-risk, high-confidence, backend-owned.
- Scope:
  1. `src/lib/cron-auth.ts`: replace the `authHeader !== \`Bearer ${CRON_SECRET}\`` comparison with a length-checked `timingSafeEqual` (mirror the ingestion route pattern). Keep behavior + reasons identical; add a test asserting a wrong-but-same-length secret is rejected.
  2. `src/lib/env.ts`: in production (`NODE_ENV==='production'`), hard-fail `buildEnv()` if `ADMIN_USERNAME`/`ADMIN_PASSWORD` are still the defaults (`admin`/`change-me`) — same `EnvValidationError` pattern already used for ADMIN_AUTH_SECRET. Dev/test keep the convenient defaults. Add tests for both tiers.
  3. `src/app/api/ingestion/run/route.ts`: drop the `GET` handler (or make it return 405) so a mutation is only triggered by `POST`. Update the route test.
- Success criteria: targeted tests prove constant-time rejection + prod default-cred fail + GET no longer ingests; full suite + lint + typecheck + build green.
- Files: `src/lib/cron-auth.ts` (+test), `src/lib/env.ts` (+test), `src/app/api/ingestion/run/route.ts` (+test). NO overlap with T-OPS2 if T-OPS2 finished its env.ts edit first — otherwise sequence after T-OPS2 (both touch env.ts; Codex does them in order, so no conflict).
- Out of scope: any auth redesign, any new secret, any change to the working credential flow.

### T-OPS9 (Claude Code) — Dead deps + 404/loading polish

- Objective: lean install + complete the public UX shell.
- Scope:
  1. Remove `@splinetool/react-spline` and `@splinetool/runtime` from `package.json` (zero references in src — confirmed in the deep review); run `npm install` to update the lockfile; verify `npm run build` still passes.
  2. Add a branded `src/app/not-found.tsx` (404) consistent with the public design, and `loading.tsx` skeletons for the heavier public routes (`/ai-regulation`, `/ai-regulation/europe`, country/state pages) so navigation has instant feedback under ISR misses. Match existing `error.tsx` styling.
- Success criteria: build green with smaller dep tree; visiting an unknown route shows the branded 404; route transitions show a skeleton, not a blank gap.
- Files: `package.json` + lockfile, `src/app/not-found.tsx` (new), `src/app/**/loading.tsx` (new). NO backend files.
- Note: Spline removal touches `package.json` deps — Claude Code owns that block per the boundaries above; if Codex needs a script added to package.json meanwhile, coordinate order in a one-line note.

### User actions needed (not agent work)

1. Choose worker hosting (always-on machine vs Railway/Fly ~5€/mo) — blocks T-OPS3.
2. Create a webhook for alerts (Slack/Discord) and set `ALERT_WEBHOOK_URL` in Vercel — activates T-OPS2.
3. Register for Legifrance PISTE credentials (free, piste.gouv.fr) and set the two env vars — activates the T-RT3B connector.
4. Optional: point an uptime monitor (e.g. UptimeRobot, free) at `/api/health` once T-OPS6 ships.

## Handoff rule

Keep handoffs under 15 bullet points. Do not use this file as a chat log.

## Execution rule

Every non-trivial task should have:

- Assumptions
- Success criteria
- Files likely to change
- Verification command or explanation if verification is unavailable
