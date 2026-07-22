# Wave 1 Database Integrity Tranche A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assess the 016 data-loss risk without writes, establish an immutable Supabase CLI deployment path from the actual production baseline, then preserve raw-item provenance and enforce the missing RLS contract.

**Architecture:** Tasks 1 and 2 are independently executable without production credentials: a read-only forensic query plus runner, CI, and env scaffolding. Gate A manually applies existing 031; Gate B links and pulls production, which records the baseline as applied. Only after Gate B does Task 3 create CLI-managed logical 032 preservation and then 033 RLS migrations.

**Tech Stack:** PostgreSQL/Supabase, Supabase CLI, TypeScript, `pg`, Zod, Vitest, GitHub Actions, npm.

## Global Constraints

- Do not touch Claude-owned frontend paths.
- Max auto-publication: no mandatory human review; this publication policy does not remove the database operator gates or code-review gates in this plan.
- Existing migrations are immutable.
- No production mutation without explicit operator action and operator-held secrets.
- `AI_TASKS.md` changes are own-row plus append-only handoff entry only; `DECISIONS.md` entries are at most 8 lines.
- Baseline verification is 128 files / 695 tests plus lint, typecheck, and build passing.
- Apply 031 manually before linking or pulling production; never fabricate a production baseline when credentials are absent.
- `DATABASE_URL` is an audit/backup-only read-only session-pooler URL, never a Supabase CLI deployment credential. `SUPABASE_DISPOSABLE_SCHEMA_AUDIT_DATABASE_URL` and `SUPABASE_PRODUCTION_SCHEMA_AUDIT_DATABASE_URL` are separate operator environment variables; assign either to `DATABASE_URL` only for its corresponding audit.
- `src/db/migrations/001...031` remains immutable archive. After Gate B, `supabase/migrations/` is the single CLI-managed deployment lineage, with 032 before 033.
- Never run `supabase db reset --linked`.

---

## File Map

- `scripts/run-readonly-psql.ts`, `scripts/run-readonly-psql.test.ts` - credential-safe psql wrapper that validates a named audit URL and passes only libpq environment settings to the child.
- `scripts/audit-016-dedup-integrity.sql` — psql-gated, CTE-only loser-to-canonical forensic JSONL report, complete raw-item ID inventory, and loser-only child impact counts.
- `supabase/config.toml`, `package.json`, `package-lock.json` — credential-free CLI runner configuration.
- `scripts/check-migration-immutability.mjs`, `scripts/check-migration-immutability.test.ts` — immutable migration guard.
- `src/lib/env.ts`, `src/lib/env.test.ts`, `.env.example`, `.github/workflows/ci.yml` — read-only audit credential contract and weekly CI audit.
- `src/db/repositories/supabase-migration-contract.test.ts` — dedicated CLI migration SQL contract test, following `src/db/repositories/supabase-repository.test.ts` migration-source assertions.
- `supabase/tests/fixtures/032_raw_item_provenance.sql`, `supabase/tests/032_raw_item_provenance.pgtap.sql` — Gate-B-only pre-032 duplicate fixtures and post-migration database tests against Supabase local.
- `supabase/migrations/` — after Gate B only: CLI-generated baseline, then generated-version files ending `032_preserve_raw_item_provenance.sql` and `033_enable_audit_table_rls.sql`.
- `src/db/schema-integrity.ts`, `src/db/schema-integrity.test.ts`, `scripts/audit-database-schema.ts` — all-table schema/RLS contract and read-only catalog audit.
- `DECISIONS.md`, `AI_TASKS.md` — scoped decision and new Codex-owned handoff.

### Task 1: Create the 016 Forensic Query and Damage Assessment

**Files:**
- Create: `scripts/audit-016-dedup-integrity.sql`

**Interfaces:**
- Consumes: a read-only `DATABASE_URL` and the current production schema; the query itself makes no mutation or runner assumption.
- Produces: JSONL records for the exact raw-item FK inventory, all current `raw_regulatory_items` IDs, `_dedup_losers(loser_id, canonical_id)`, and counts of child rows referencing loser IDs only. The script never creates a relation.

- [ ] **Step 1: Write the read-only forensic SQL**

Create `scripts/audit-016-dedup-integrity.sql`:

```sql
\set ON_ERROR_STOP on
\pset tuples_only on
\pset format unaligned
begin transaction isolation level repeatable read read only;

-- The CTE is repeated below because a READ ONLY transaction cannot CREATE TEMP TABLE.
with expected(child_table, child_column) as (
  values ('ai_regulatory_updates', 'raw_item_id'), ('ai_processing_logs', 'raw_item_id'),
    ('source_references', 'raw_item_id'), ('verification_attempts', 'raw_item_id'),
    ('review_events', 'raw_item_id'), ('news_items', 'raw_item_id'),
    ('discovery_leads', 'raw_item_id'), ('raw_regulatory_items', 'duplicate_of')
), actual as (
  select child.relname child_table, attribute.attname child_column
  from pg_constraint fk join pg_class child on child.oid = fk.conrelid
  join pg_namespace schema_name on schema_name.oid = child.relnamespace
  join unnest(fk.conkey) with ordinality as key(attnum, ordinal) on true
  join pg_attribute attribute on attribute.attrelid = child.oid and attribute.attnum = key.attnum
  where fk.contype = 'f' and fk.confrelid = 'public.raw_regulatory_items'::regclass
    and schema_name.nspname = 'public'
), inventory as (
  select coalesce(expected.child_table, actual.child_table) child_table,
    coalesce(expected.child_column, actual.child_column) child_column,
    case when expected.child_table is null then 'UNEXPECTED'
         when actual.child_table is null then 'MISSING' else 'EXPECTED' end inventory_status
  from expected full join actual using (child_table, child_column)
)
select jsonb_build_object('kind', 'fk_inventory', 'relations',
  jsonb_agg(to_jsonb(inventory) order by child_table, child_column)) from inventory;

with expected(child_table, child_column) as (
  values ('ai_regulatory_updates', 'raw_item_id'), ('ai_processing_logs', 'raw_item_id'),
    ('source_references', 'raw_item_id'), ('verification_attempts', 'raw_item_id'),
    ('review_events', 'raw_item_id'), ('news_items', 'raw_item_id'),
    ('discovery_leads', 'raw_item_id'), ('raw_regulatory_items', 'duplicate_of')
), actual as (
  select child.relname child_table, attribute.attname child_column
  from pg_constraint fk join pg_class child on child.oid = fk.conrelid
  join pg_namespace schema_name on schema_name.oid = child.relnamespace
  join unnest(fk.conkey) with ordinality as key(attnum, ordinal) on true
  join pg_attribute attribute on attribute.attrelid = child.oid and attribute.attnum = key.attnum
  where fk.contype = 'f' and fk.confrelid = 'public.raw_regulatory_items'::regclass
    and schema_name.nspname = 'public'
)
select (count(*) = 8 and bool_and((child_table, child_column) in (select * from expected)))::text
  as fk_inventory_ok from actual \gset

\if :fk_inventory_ok
  with ranked as (
    select id, first_value(id) over (partition by hash order by detected_at asc, id asc) canonical_id,
      row_number() over (partition by hash order by detected_at asc, id asc) position
    from public.raw_regulatory_items
  ), dedup_losers as (select id loser_id, canonical_id from ranked where position > 1)
  select jsonb_build_object('kind', 'dedup_losers', 'count', count(*), 'rows',
    coalesce(jsonb_agg(to_jsonb(dedup_losers) order by canonical_id, loser_id), '[]'::jsonb)) from dedup_losers;

  select jsonb_build_object('kind', 'raw_item_ids', 'count', count(*), 'ids',
    coalesce(jsonb_agg(id order by id), '[]'::jsonb)) from public.raw_regulatory_items;

  with ranked as (
    select id, first_value(id) over (partition by hash order by detected_at asc, id asc) canonical_id,
      row_number() over (partition by hash order by detected_at asc, id asc) position
    from public.raw_regulatory_items
  ), dedup_losers as (select id loser_id, canonical_id from ranked where position > 1), counts as (
    select 'ai_regulatory_updates.raw_item_id' child, count(*) loser_references from public.ai_regulatory_updates child join dedup_losers map on child.raw_item_id = map.loser_id
    union all select 'ai_processing_logs.raw_item_id', count(*) from public.ai_processing_logs child join dedup_losers map on child.raw_item_id = map.loser_id
    union all select 'source_references.raw_item_id', count(*) from public.source_references child join dedup_losers map on child.raw_item_id = map.loser_id
    union all select 'verification_attempts.raw_item_id', count(*) from public.verification_attempts child join dedup_losers map on child.raw_item_id = map.loser_id
    union all select 'review_events.raw_item_id', count(*) from public.review_events child join dedup_losers map on child.raw_item_id = map.loser_id
    union all select 'news_items.raw_item_id', count(*) from public.news_items child join dedup_losers map on child.raw_item_id = map.loser_id
    union all select 'discovery_leads.raw_item_id', count(*) from public.discovery_leads child join dedup_losers map on child.raw_item_id = map.loser_id
    union all select 'raw_regulatory_items.duplicate_of', count(*) from public.raw_regulatory_items child join dedup_losers map on child.duplicate_of = map.loser_id
  ) select jsonb_build_object('kind', 'loser_impact_counts', 'rows', jsonb_agg(to_jsonb(counts) order by child)) from counts;
\else
  \warn 'FK inventory is incomplete or unexpected; child impact queries were not executed.'
\endif
commit;
```

- [ ] **Step 2: Verify local no-credential behavior and operator evidence**

Run: `npm run audit:database-schema`

Expected: exit `2` with `[audit:database-schema] blocked_missing_credentials DATABASE_URL` when no readonly secret exists.

The operator first restores a pre-016 backup into an isolated database and sets its read-only session-pooler URL in `$env:PRE_016_BACKUP_DATABASE_URL`; this URL must point at a state before 016 ran. Then run the following from PowerShell, keeping all outputs outside the repository:

```powershell
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$evidenceDir = Join-Path $env:USERPROFILE "csg-db-evidence\\016-$stamp"
New-Item -ItemType Directory -Force $evidenceDir | Out-Null
npm run --silent psql:readonly -- PRE_016_BACKUP_DATABASE_URL -X -q -v ON_ERROR_STOP=1 -f scripts/audit-016-dedup-integrity.sql > (Join-Path $evidenceDir 'pre-016.jsonl')
if ($LASTEXITCODE -ne 0) { throw 'Pre-016 forensic audit failed.' }
if (-not $env:SUPABASE_PRODUCTION_SCHEMA_AUDIT_DATABASE_URL) { throw 'SUPABASE_PRODUCTION_SCHEMA_AUDIT_DATABASE_URL is required.' }
npm run --silent psql:readonly -- SUPABASE_PRODUCTION_SCHEMA_AUDIT_DATABASE_URL -X -q -v ON_ERROR_STOP=1 -f scripts/audit-016-dedup-integrity.sql > (Join-Path $evidenceDir 'current-production.jsonl')
if ($LASTEXITCODE -ne 0) { throw 'Current-production forensic audit failed.' }
$pre = Get-Content (Join-Path $evidenceDir 'pre-016.jsonl') | ForEach-Object { $_ | ConvertFrom-Json }
$current = Get-Content (Join-Path $evidenceDir 'current-production.jsonl') | ForEach-Object { $_ | ConvertFrom-Json }
$expectedFkRelations = @(
  'ai_regulatory_updates.raw_item_id', 'ai_processing_logs.raw_item_id',
  'source_references.raw_item_id', 'verification_attempts.raw_item_id',
  'review_events.raw_item_id', 'news_items.raw_item_id',
  'discovery_leads.raw_item_id', 'raw_regulatory_items.duplicate_of'
)
foreach ($audit in @(
  [pscustomobject]@{ name = 'pre-016'; records = @($pre) }
  [pscustomobject]@{ name = 'current-production'; records = @($current) }
)) {
  $inventory = @($audit.records | Where-Object kind -eq 'fk_inventory')
  if ($inventory.Count -ne 1) { throw "$($audit.name) JSONL must contain exactly one fk_inventory record." }
  $actualFkRelations = @($inventory[0].relations | ForEach-Object { "$($_.child_table).$($_.child_column)" })
  $inventoryOk = $actualFkRelations.Count -eq $expectedFkRelations.Count -and
    @($actualFkRelations | Sort-Object -Unique).Count -eq $expectedFkRelations.Count -and
    @($actualFkRelations | Where-Object { $_ -notin $expectedFkRelations }).Count -eq 0 -and
    @($inventory[0].relations | Where-Object inventory_status -ne 'EXPECTED').Count -eq 0
  $inventory[0] | Add-Member -NotePropertyName inventory_ok -NotePropertyValue $inventoryOk
  if ($inventory[0].inventory_ok -ne $true) { throw "$($audit.name) JSONL fk_inventory is not complete and expected." }
  foreach ($kind in @('dedup_losers', 'raw_item_ids', 'loser_impact_counts')) {
    if (@($audit.records | Where-Object kind -eq $kind).Count -ne 1) { throw "$($audit.name) JSONL must contain exactly one $kind record." }
  }
}
$preLosers = @($pre | Where-Object kind -eq 'dedup_losers').rows.loser_id
$currentRawItemIds = @($current | Where-Object kind -eq 'raw_item_ids').ids
$currentLosers = @($current | Where-Object kind -eq 'dedup_losers').rows.loser_id
$destroyed = @($preLosers | Where-Object { $_ -notin $currentRawItemIds })
[pscustomobject]@{ backup_id = $env:PRE_016_BACKUP_ID; assessed_at_utc = $stamp; pre_016_loser_count = @($preLosers).Count; current_raw_item_count = @($currentRawItemIds).Count; current_loser_count = @($currentLosers).Count; destroyed_loser_count = $destroyed.Count; destroyed_loser_ids = $destroyed } | ConvertTo-Json -Depth 4 | Set-Content (Join-Path $evidenceDir 'damage-assessment.json')
```

Expected: both JSONL files have a single `fk_inventory` record whose eight relations are `EXPECTED`; only then do they contain `dedup_losers`, `raw_item_ids`, and `loser_impact_counts`. The JSON assessment derives destroyed IDs only from pre-016 loser IDs absent from all current raw-item IDs, and records the exact count and IDs. Any `MISSING` or `UNEXPECTED` result blocks Task 3. When no restorable pre-016 backup exists, do not manufacture an assessment; instead run the exact command below and record that unknown outcome in Task 4:

```powershell
[pscustomobject]@{ backup_available = $false; assessed_at_utc = (Get-Date).ToUniversalTime().ToString('o'); destroyed_loser_count = $null; outcome = 'No restorable pre-016 backup was available; destroyed counts are unknown.' } | ConvertTo-Json | Set-Content (Join-Path $evidenceDir 'damage-assessment.json')
```

- [ ] **Step 3: Commit the forensic deliverable**

```bash
git add scripts/audit-016-dedup-integrity.sql
git commit -m "docs(db): add raw item dedup forensic audit"
```

### Task 2: Establish the Runner, Immutability Policy, and Operator Gates

**Files:**
- Create: `supabase/config.toml`
- Create: `scripts/check-migration-immutability.mjs`
- Create: `scripts/check-migration-immutability.test.ts`
- Create: `scripts/run-readonly-psql.ts`
- Create: `scripts/run-readonly-psql.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `.env.example`
- Modify: `src/lib/env.ts`
- Modify: `src/lib/env.test.ts`

**Interfaces:**
- Consumes: operator-only `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, and `SUPABASE_DB_PASSWORD` for CLI actions; separately, disposable and production audit URLs that are mapped into `DATABASE_URL` only for their respective audits.
- Produces: local runner/CI/env scaffolding and Gate A/B procedures. Gate B alone creates the CLI baseline; without it 032/033 cannot be created.

- [ ] **Step 1: Write failing env and immutability tests**

Create checker fixtures accepting only a new versioned `.sql` under `supabase/migrations/` and rejecting all additions in `src/db/migrations/` plus every modification, deletion, or rename in either lineage. Add environment tests:

```ts
expect(() => parseDatabaseUrl("postgresql://postgres:pw@db.example.com:5432/postgres"))
  .toThrow("DATABASE_URL must use the read-only Supabase session pooler");
expect(parseDatabaseUrl(
  "postgresql://csg_schema_auditor.abcdefghijklmnopqrst:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&options=-c%20default_transaction_read_only%3Don",
)).toBeDefined();
```

- [ ] **Step 2: Run focused tests to verify failure**

Run: `npx vitest run src/lib/env.test.ts scripts/check-migration-immutability.test.ts`

Expected: FAIL because neither parser nor checker exists and `DATABASE_URL` is an unrestricted optional string.

- [ ] **Step 3: Implement runner, env validation, and CI**

Run `npm install --save-dev --save-exact supabase@2.109.1`. Add npm scripts `db:pull`, `db:push:dry-run`, `db:push`, `migration:new`, `check:migrations`, and `psql:readonly`. `db:push:dry-run` runs `supabase db push --linked --dry-run`; `db:push` runs `supabase db push --linked`; neither reads `DATABASE_URL`. `psql:readonly` runs the tested TypeScript wrapper, which accepts only a named environment variable, validates it with `parseDatabaseUrl`, derives libpq `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGSSLMODE`, and `PGOPTIONS`, and never places the URL in child arguments or logs. Do not add any reset script.

The checker evaluates migration paths only. Locally, without `--base`, combine `git diff --cached --name-status --find-renames HEAD`, `git diff --name-status --find-renames`, and `git ls-files --others --exclude-standard`; this inspects staged, unstaged, and untracked changes. In CI, require `--base $mergeBase` and combine `git diff --name-status --find-renames $mergeBase...HEAD` with `git ls-files --others --exclude-standard`, so an untracked migration is never invisible. Only an added versioned `.sql` under `supabase/migrations/` passes after the baseline commit. All historical-path additions and every modification, deletion, or rename in either lineage fail. Never default to `HEAD...HEAD`.

Implement optional `parseDatabaseUrl`: host ends `.pooler.supabase.com`, port is exactly session-pooler `5432`, username is `csg_schema_auditor.<project-ref>` where the project ref matches `[a-z0-9]{20}`, `sslmode=require` exists, and decoded `options` contains `default_transaction_read_only=on`. Document separate operator variables for disposable and production audits, each mapped to the runtime audit variable only immediately before its corresponding schema audit:

```dotenv
# Read-only session-pooler audit accounts; never use either for CLI deployment.
SUPABASE_DISPOSABLE_SCHEMA_AUDIT_DATABASE_URL=postgresql://csg_schema_auditor.abcdefghijklmnopqrst:readonly-audit-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&options=-c%20default_transaction_read_only%3Don
SUPABASE_PRODUCTION_SCHEMA_AUDIT_DATABASE_URL=postgresql://csg_schema_auditor.abcdefghijklmnopqrst:readonly-audit-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require&options=-c%20default_transaction_read_only%3Don
```

In `scripts/audit-database-schema.ts`, call `parseDatabaseUrl(process.env.DATABASE_URL)` and use its returned connection string before constructing `new pg.Client(...)`; a missing or invalid URL must exit before `pg.Client` is created.

Add a pull-request/push `migration-integrity` job with `actions/checkout@v4` configured as `fetch-depth: 0`. Its PowerShell step selects the base exactly as follows, then passes the computed merge-base to the checker:

```powershell
if ('${{ github.event_name }}' -eq 'pull_request') {
  $parent = '${{ github.event.pull_request.base.sha }}'
} elseif ('${{ github.event.before }}' -match '^0+$') {
  $parent = git rev-list --max-parents=0 --reverse HEAD | Select-Object -First 1
} else {
  $parent = '${{ github.event.before }}'
}
$mergeBase = git merge-base $parent HEAD
node scripts/check-migration-immutability.mjs --base $mergeBase
```

Preserve every existing top-level workflow trigger and add this exact weekly trigger under the existing `on:` mapping:

```yaml
on:
  schedule:
    - cron: "0 6 * * 1"
```

Add this scheduled-only job; the production-audit secret is intentionally mapped to the runtime name `DATABASE_URL` only on the final audit step:

```yaml
  database-schema-audit:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run audit:database-schema
        env:
          DATABASE_URL: ${{ secrets.SUPABASE_PRODUCTION_SCHEMA_AUDIT_DATABASE_URL }}
```

- [ ] **Step 4: Verify the complete local deliverable**

Run: `npx vitest run src/lib/env.test.ts scripts/check-migration-immutability.test.ts && npm run check:migrations && npm run audit:database-schema`

Expected: focused tests and migration check PASS; audit exits `2` without a readonly credential. Tasks 1 and 2 are now locally deliverable; no CLI baseline, 032, or 033 file exists.

- [ ] **Step 5: Execute binding Gate A and Gate B only with the operator**

Gate A: manually execute immutable `src/db/migrations/031_repair_check_constraint_drift.sql` in Supabase SQL Editor and verify both repaired CHECK constraints plus `src-eur-lex-ai`.

Gate B, after Gate A passes:

```powershell
npx supabase login
if (-not $env:SUPABASE_PROJECT_REF -or -not $env:SUPABASE_DB_PASSWORD) { throw 'SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD are required for production db pull.' }
npx supabase link --project-ref $env:SUPABASE_PROJECT_REF --password $env:SUPABASE_DB_PASSWORD
if ($LASTEXITCODE -ne 0) { throw 'Production Supabase link failed.' }
if ((Get-Content -Raw supabase/.temp/project-ref).Trim() -ne $env:SUPABASE_PROJECT_REF) { throw 'Supabase CLI is not linked to SUPABASE_PROJECT_REF.' }
npx supabase db pull --linked --schema public
if ($LASTEXITCODE -ne 0) { throw 'Production Supabase db pull failed.' }
npx supabase migration list --linked
if ($LASTEXITCODE -ne 0) { throw 'Production Supabase migration list failed.' }
```

Expected: Gate B links production only to execute `db pull`; the official pull records its production-derived baseline as applied and `migration list --linked` displays matching local/remote history. Review and commit the generated baseline unchanged. Do not dry-run or push while linked to production in Gate B. Do not copy historical migrations, fabricate a baseline, create 032/033, or run `supabase db reset --linked`.

Without operator credentials, Gate B blocks CLI-managed 032/033. Commit the Task 1/2 local deliverable and mark the task blocked; do not claim Tasks 3 or 4 finish locally.

- [ ] **Step 6: Commit runner and, after Gate B, the generated baseline**

```bash
git add supabase/config.toml scripts/check-migration-immutability.mjs scripts/check-migration-immutability.test.ts package.json package-lock.json .github/workflows/ci.yml .env.example src/lib/env.ts src/lib/env.test.ts
git commit -m "build(db): add immutable Supabase migration runner"
```

After Gate B:

```bash
git add supabase/migrations
git commit -m "chore(db): record production Supabase baseline"
```

### Task 3: After Gate B, Create 032 Preservation Then 033 RLS and Audit Them

**Files:**
- Create: CLI-generated versioned SQL ending `032_preserve_raw_item_provenance.sql`
- Create: CLI-generated later versioned SQL ending `033_enable_audit_table_rls.sql`
- Create: `src/db/repositories/supabase-migration-contract.test.ts`
- Create: `supabase/tests/fixtures/032_raw_item_provenance.sql`
- Create: `supabase/tests/032_raw_item_provenance.pgtap.sql`
- Modify: `src/db/schema-integrity.ts`
- Modify: `src/db/schema-integrity.test.ts`
- Modify: `scripts/audit-database-schema.ts`

**Interfaces:**
- Consumes: the Gate-B-generated baseline and Task 1's confirmed FK inventory.
- Produces: 032 provenance-safe dedup with immutable full-row archival and a post-dedup hash uniqueness index, 033 exact RLS policies, and a read-only audit derived from `Object.keys(REQUIRED_SCHEMA_INVARIANTS)`.

- [ ] **Step 1: Write and run the failing dedicated migration contract test**

Create `src/db/repositories/supabase-migration-contract.test.ts`, resolving exactly one filename ending `032_preserve_raw_item_provenance.sql` inside `supabase/migrations/`. Assert the dynamic FK guard, eight child names, `first_value(id)`, `winner_id`, `to_jsonb(loser)`, `verification_attempts`, source-reference deletion, source-reference reparenting, raw-item deletion, `raw_regulatory_item_dedup_archive`, and `raw_regulatory_items_hash_unique_idx`. Also resolve the Gate-B-pulled baseline and assert that it contains the same `public.upsert_raw_regulatory_item` RPC contract as immutable migration 013: compare the function name, `pg_get_function_identity_arguments`, return type, and normalized `pg_get_functiondef` text extracted from 013 with the baseline definition. This is a baseline contract assertion, not a filename-only assertion.

```ts
it("032 preserves every raw-item child and source-reference evidence", () => {
  const sql = readSingleMigration("032_preserve_raw_item_provenance.sql");
  expect(sql).toContain("Unexpected raw_regulatory_items FK target");
  expect(sql).toContain("first_value(id)");
  expect(sql).toContain("winner_id");
  expect(sql).toContain("to_jsonb(loser)");
  expect(sql).toContain("update public.verification_attempts");
  expect(sql).toContain("raw_regulatory_item_dedup_archive");
  expect(sql).toContain("raw_regulatory_items_hash_unique_idx");
});
```

Run: `npx vitest run src/db/repositories/supabase-migration-contract.test.ts`

Expected: FAIL because Gate B has completed but 032 has not been created.

- [ ] **Step 2: Create and implement CLI migration 032**

Run: `npx supabase migration new 032_preserve_raw_item_provenance`

Expected: one generated versioned SQL file ending `032_preserve_raw_item_provenance.sql`.

Build `_dedup_losers` as Task 1 does. Before mutation, inspect `pg_constraint`; for any FK outside these exact pairs, raise `format('Unexpected raw_regulatory_items FK target: %I.%I', child_table, child_column)`, and raise if any expected pair is missing: `ai_regulatory_updates.raw_item_id`, `ai_processing_logs.raw_item_id`, `source_references.raw_item_id`, `verification_attempts.raw_item_id`, `review_events.raw_item_id`, `news_items.raw_item_id`, `discovery_leads.raw_item_id`, `raw_regulatory_items.duplicate_of`.

For source-reference collisions, materialize all loser-row candidates and any existing canonical-row candidate per `(canonical_id, url, source_role)`. Select `winner_id` with `first_value(id)` ordered by canonical row first, greatest `last_verified_at`, greatest `retrieved_at`, earliest `created_at`, lowest `id`. Append every discarded `to_jsonb(loser)` to the winner's `notes`, reparent verification attempts to `winner_id`, delete discarded references, and then update the winner's `raw_item_id` to `canonical_id`. This works when no source reference began at the canonical raw ID.

```sql
create temporary table _source_reference_candidates on commit drop as
with affected_keys as (
  select distinct map.canonical_id, reference.url, reference.source_role
  from public.source_references reference
  join _dedup_losers map on reference.raw_item_id = map.loser_id
), ranked as (
  select key.canonical_id, reference.*,
         first_value(reference.id) over (
           partition by key.canonical_id, reference.url, reference.source_role
           order by (reference.raw_item_id = key.canonical_id) desc,
             reference.last_verified_at desc nulls last,
             reference.retrieved_at desc nulls last,
             reference.created_at asc, reference.id asc
         ) as winner_id
  from affected_keys key
  join public.source_references reference
    on reference.url = key.url and reference.source_role = key.source_role
   and (reference.raw_item_id = key.canonical_id or exists (
     select 1 from _dedup_losers map
     where map.canonical_id = key.canonical_id and map.loser_id = reference.raw_item_id
   ))
)
select * from ranked;

update public.source_references winner
set notes = concat_ws(E'\n', winner.notes,
  '[raw-item-dedup source_references] ' || discarded.rows::text)
from (
  select winner_id, jsonb_agg(to_jsonb(loser) order by loser.id) as rows
  from _source_reference_candidates loser
  where loser.id <> loser.winner_id
  group by winner_id
) discarded
where winner.id = discarded.winner_id;

update public.verification_attempts attempt
set source_reference_id = loser.winner_id
from _source_reference_candidates loser
where loser.id <> loser.winner_id and attempt.source_reference_id = loser.id;

delete from public.source_references reference
using _source_reference_candidates loser
where loser.id <> loser.winner_id and reference.id = loser.id;

update public.source_references winner
set raw_item_id = candidate.canonical_id
from _source_reference_candidates candidate
where candidate.id = candidate.winner_id and winner.id = candidate.winner_id;
```

Then repoint `ai_regulatory_updates`, `ai_processing_logs`, `verification_attempts`, `review_events`, `news_items`, `discovery_leads`, and `raw_regulatory_items.duplicate_of`; null self-loops. Guard zero loser references, zero source-reference uniqueness collisions, and zero duplicate hashes before deleting raw losers.

Immediately after `_dedup_losers` is built, and before any update to `public.raw_regulatory_items` (including `duplicate_of` reparenting), create the dedicated append-only archive and insert every loser exactly once. It has no foreign key to a row that will be deleted:

```sql
create table public.raw_regulatory_item_dedup_archive (
  original_raw_id uuid primary key,
  canonical_id uuid not null,
  raw_row jsonb not null,
  archived_at timestamptz not null,
  migration_id text not null check (migration_id = '032_preserve_raw_item_provenance'),
  check (raw_row ->> 'id' = original_raw_id::text)
);

insert into public.raw_regulatory_item_dedup_archive
  (original_raw_id, canonical_id, raw_row, archived_at, migration_id)
select loser.id, map.canonical_id, to_jsonb(loser), transaction_timestamp(),
  '032_preserve_raw_item_provenance'
from public.raw_regulatory_items loser
join _dedup_losers map on map.loser_id = loser.id;

create function public.reject_raw_regulatory_item_dedup_archive_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'raw_regulatory_item_dedup_archive is immutable';
end;
$$;
create trigger raw_regulatory_item_dedup_archive_immutable
before update or delete on public.raw_regulatory_item_dedup_archive
for each row execute function public.reject_raw_regulatory_item_dedup_archive_mutation();
```

After all eight FK updates but before deleting from `raw_regulatory_items`, assert that the archive row count equals `_dedup_losers` count and that no archived `original_raw_id` remains referenced. Delete only archived loser IDs. Then assert no duplicate non-null hashes remain and create `create unique index raw_regulatory_items_hash_unique_idx on public.raw_regulatory_items (hash);` after the deduplication; this index creation must be part of 032, never deferred to an application change.

- [ ] **Step 3: Write failing full-invariant tests and implement migration 033**

Extend `completeSnapshot()` and `REQUIRED_SCHEMA_INVARIANTS` with complete columns, indexes, constraints, RLS state, and exact policy definitions from migrations 001, 003, and 004 for `regulation_scan_logs`, `ai_processing_logs`, `source_references`, `verification_attempts`, `review_events`, `data_quality_findings`, and `source_health_checks`, plus the 032 `raw_regulatory_item_dedup_archive` table. Require: `regulation_scan_logs_source_id_idx` / `regulation_scan_logs_status_check`; `ai_processing_logs_raw_item_id_idx`, `ai_processing_logs_regulatory_update_id_idx` / `ai_processing_logs_status_check`; `source_references_raw_item_url_role_idx`, `source_references_update_idx` / source-role, source-type, reliability checks; `verification_attempts_raw_item_idx`, `verification_attempts_attempted_at_idx`; `review_events_update_idx` / `review_events_event_type_check`; `data_quality_findings_dedup_idx`, `data_quality_findings_status_idx` / `data_quality_findings_severity_check`; `source_health_checks_source_idx`; and archive primary key `raw_regulatory_item_dedup_archive_pkey`, its immutability trigger, RLS enabled, and its exact service-role policy below.

Run: `npx vitest run src/db/schema-integrity.test.ts`

Expected: FAIL because the seven existing-table invariant entries and the new archive invariant entry are absent.

Run: `npx supabase migration new 033_enable_audit_table_rls`

Expected: a later generated file ending `033_enable_audit_table_rls.sql`. For every table/policy pair below, enable RLS and create exactly one `for all to service_role` policy using and checking `auth.role() = 'service_role'`:

```text
regulation_scan_logs    service_role_all_regulation_scan_logs
ai_processing_logs      service_role_all_ai_processing_logs
source_references       service_role_all_source_references
verification_attempts   service_role_all_verification_attempts
review_events           service_role_all_review_events
data_quality_findings   service_role_all_data_quality_findings
source_health_checks    service_role_all_source_health_checks
raw_regulatory_item_dedup_archive service_role_all_raw_regulatory_item_dedup_archive
```

For each listed table, including the archive, assert exactly one policy with the listed name, command `ALL`, role `{service_role}`, and both `qual` and `with_check` exactly `(auth.role() = 'service_role'::text)`. The 033 SQL must contain `alter table public.raw_regulatory_item_dedup_archive enable row level security;` and create that policy; the schema-invariant test must query and compare it, not merely search its migration text.

- [ ] **Step 4: Run fixture-based migration tests on Supabase local after Gate B**

Create `supabase/tests/fixtures/032_raw_item_provenance.sql` with two duplicate-hash fixture groups and their dependent records, and create `supabase/tests/032_raw_item_provenance.pgtap.sql` to assert the resulting state. This is an execution test, not a substring test: load the fixtures after the Gate-B baseline but before 032 is applied, then apply 032 and 033 and assert all of the following with pgTAP:

- a canonical raw row remains the source-reference winner when it already exists;
- a loser raw row becomes the winner when it is the only source reference for a canonical key, then its `raw_item_id` becomes the canonical ID;
- competing source references leave exactly one `(canonical_id, url, source_role)` row and append every discarded raw JSON payload to that winner's `notes`;
- every `verification_attempts.source_reference_id` formerly targeting a discarded reference targets `winner_id`, and every `verification_attempts.raw_item_id` formerly targeting a loser targets its canonical ID;
- all eight FK pairs (`ai_regulatory_updates`, `ai_processing_logs`, `source_references`, `verification_attempts`, `review_events`, `news_items`, `discovery_leads`, and `raw_regulatory_items.duplicate_of`) have zero references to a loser and the expected number of canonical references;
- the archive contains one immutable row per deleted loser, with matching `original_raw_id`, `canonical_id`, complete `to_jsonb` payload, non-null `archived_at`, and migration ID `032_preserve_raw_item_provenance`; an `UPDATE` and a `DELETE` against it each fail with `raw_regulatory_item_dedup_archive is immutable`;
- `raw_regulatory_items_hash_unique_idx` exists and a duplicate-hash insert fails; and
- `pg_proc` shows that the installed `public.upsert_raw_regulatory_item` identity arguments, result, and normalized definition equal the 013 contract captured from the Gate-B baseline.

Docker is required only for this local preflight and test database. Run these commands locally, never with `--linked` and never against a hosted project:

```powershell
docker info
npx supabase start
$baselineVersion = '<baseline_version>'
npx supabase db reset --local --version $baselineVersion --no-seed
if ($LASTEXITCODE -ne 0) { throw 'Local baseline reset failed.' }
$localDatabaseUrl = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
$hasBaselineHashUniqueIndex = psql $localDatabaseUrl -X -q -tAc "select to_regclass('public.raw_regulatory_items_hash_unique_idx') is not null"
if ($LASTEXITCODE -ne 0) { throw 'Local unique-index inspection failed.' }
if ($hasBaselineHashUniqueIndex.Trim() -eq 't') {
  psql $localDatabaseUrl -X -q -v ON_ERROR_STOP=1 -c 'drop index public.raw_regulatory_items_hash_unique_idx'
  if ($LASTEXITCODE -ne 0) { throw 'Local baseline unique-index removal failed.' }
}
psql $localDatabaseUrl -X -q -v ON_ERROR_STOP=1 -f supabase/tests/fixtures/032_raw_item_provenance.sql
if ($LASTEXITCODE -ne 0) { throw 'Local duplicate fixture load failed.' }
npx supabase migration up --local --include-all
if ($LASTEXITCODE -ne 0) { throw 'Local 032/033 migration application failed.' }
npx supabase test db --local
```

Expected: Docker is available; the official local reset applies only the Gate-B baseline; any baseline unique hash index is removed solely to recreate the pre-016 duplicate state; duplicate fixtures exist before 032; `migration up --local --include-all` applies 032 then 033; and all pgTAP assertions pass. `supabase db reset --linked` is prohibited.

- [ ] **Step 5: Make the catalog audit contract-driven and transactionally read-only**

Replace the handwritten table list in `scripts/audit-database-schema.ts` with:

```ts
const TABLES = Object.keys(REQUIRED_SCHEMA_INVARIANTS);
```

Write mocked-client tests proving the five catalog queries run after `BEGIN TRANSACTION READ ONLY`, success commits, and failure rolls back. Implement:

```ts
await client.connect();
await client.query("BEGIN TRANSACTION READ ONLY");
try {
  const report = evaluateSchemaIntegrity(await loadSnapshot(client));
  await client.query("COMMIT");
  // retain current report output and exit behavior
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
}
```

- [ ] **Step 6: Verify pending order and disposable deployment**

Run: `npx vitest run src/db/repositories/supabase-migration-contract.test.ts src/db/schema-integrity.test.ts`

Then link a disposable hosted project explicitly, assert its link file, dry-run, and push. This is the only hosted deployment permitted before the production operator step:

```powershell
if (-not $env:SUPABASE_DISPOSABLE_PROJECT_REF -or -not $env:SUPABASE_DISPOSABLE_DB_PASSWORD) { throw 'Disposable Supabase project credentials are required.' }
if (-not $env:SUPABASE_DISPOSABLE_SCHEMA_AUDIT_DATABASE_URL) { throw 'Disposable schema-audit URL is required.' }
npx supabase link --project-ref $env:SUPABASE_DISPOSABLE_PROJECT_REF --password $env:SUPABASE_DISPOSABLE_DB_PASSWORD
if ($LASTEXITCODE -ne 0) { throw 'Disposable Supabase link failed.' }
if ((Get-Content -Raw supabase/.temp/project-ref).Trim() -ne $env:SUPABASE_DISPOSABLE_PROJECT_REF) { throw 'Supabase CLI is not linked to SUPABASE_DISPOSABLE_PROJECT_REF.' }
npm run db:push:dry-run
if ($LASTEXITCODE -ne 0) { throw 'Disposable Supabase dry run failed.' }
npm run db:push
if ($LASTEXITCODE -ne 0) { throw 'Disposable Supabase push failed.' }
$env:DATABASE_URL = $env:SUPABASE_DISPOSABLE_SCHEMA_AUDIT_DATABASE_URL
npm run audit:database-schema
npm run --silent psql:readonly -- SUPABASE_DISPOSABLE_SCHEMA_AUDIT_DATABASE_URL -X -q -v ON_ERROR_STOP=1 -f scripts/audit-016-dedup-integrity.sql
```

Expected: focused contracts pass; the disposable dry run lists only pending 032 then 033 after the pulled baseline; its audit prints `ok`; all eight service-role policies exist; zero children reference losers; each deleted loser has a complete immutable archive row; serialized discarded source-reference evidence is on each winner; and `raw_regulatory_items_hash_unique_idx` exists with no duplicate hash. Never use `db reset --linked`.

- [ ] **Step 7: Commit implementation**

```bash
git add supabase/migrations supabase/tests/032_raw_item_provenance.pgtap.sql src/db/repositories/supabase-migration-contract.test.ts src/db/schema-integrity.ts src/db/schema-integrity.test.ts scripts/audit-database-schema.ts
git commit -m "fix(db): preserve provenance and enforce audit RLS"
```

### Task 4: Add the Scoped Handoff and Verify the Final State

**Files:**
- Modify: `DECISIONS.md`
- Modify: `AI_TASKS.md`

**Interfaces:**
- Consumes: committed Tasks 1-3, disposable verification, and the Task 1 operator evidence archive.
- Produces: a maximum-eight-line decision, new Codex row `T-DB-INTEGRITY-W1A`, one append-only handoff entry, and an operator-only production checklist.

- [ ] **Step 1: Add bounded decision and new Codex-owned row**

Add a `DECISIONS.md` block of at most eight lines stating: manual-first 031; Gate-B `db pull` baseline; immutable history; pending CLI migrations; dry-run before push; 032 before 033; and audit-only `DATABASE_URL`. Its final line records the actual Task 1 damage-assessment outcome from the external `damage-assessment.json`: either the backup identifier, UTC assessment time, and exact `destroyed_loser_count`, or the explicit fact that no restorable pre-016 backup was available and destroyed counts are unknown. Do not write a predicted, generic, or placeholder outcome. Validate only that new block with `($newDecisionBlock -split "`n").Count -le 8`.

Do not edit the Claude-authored `T-DB-INTEGRITY-W1` `HANDOFF→Codex` row. Add a separate Codex-owned `T-DB-INTEGRITY-W1A` row: `BLOCKED` if Gate B credentials are absent, otherwise `DONE-LOCAL` after Task 3 commits and before operator production deployment.

- [ ] **Step 2: Append one coordination handoff entry**

Append one `AI_TASKS.md` entry in the `AGENTS.md` field order. Include `evaluateSchemaIntegrity()` and `REQUIRED_SCHEMA_INVARIANTS` as graph anchors, all commits and changed files, fixture and disposable verification results, no production mutation from the agent session, and the operator sequence: manual 031, Gate-B production link/pull, disposable link/dry-run/push, then the explicit production re-link/dry-run/push below.

- [ ] **Step 3: Run full verification and report the remaining gate honestly**

Run: `npm test && npm run lint && npm run typecheck && npm run build && npm run check:migrations`

Expected: PASS with at least the 128-file / 695-test baseline, zero historical migration edits, and no frontend changes. If Gate B remains unavailable, stop after Task 1/2 commits and mark Task 3/4 blocked; do not claim local completion.

After Task 3, the operator alone explicitly re-links production before any deploy command; do not trust the prior disposable link:

```powershell
if (-not $env:SUPABASE_PROJECT_REF -or -not $env:SUPABASE_DB_PASSWORD) { throw 'Production Supabase credentials are required.' }
if (-not $env:SUPABASE_PRODUCTION_SCHEMA_AUDIT_DATABASE_URL) { throw 'Production schema-audit URL is required.' }
npx supabase link --project-ref $env:SUPABASE_PROJECT_REF --password $env:SUPABASE_DB_PASSWORD
if ($LASTEXITCODE -ne 0) { throw 'Production Supabase link failed.' }
if ((Get-Content -Raw supabase/.temp/project-ref).Trim() -ne $env:SUPABASE_PROJECT_REF) { throw 'Supabase CLI is not linked to SUPABASE_PROJECT_REF.' }
npm run db:push:dry-run
if ($LASTEXITCODE -ne 0) { throw 'Production Supabase dry run failed.' }
npm run db:push
if ($LASTEXITCODE -ne 0) { throw 'Production Supabase push failed.' }
npx supabase migration list --linked
if ($LASTEXITCODE -ne 0) { throw 'Production Supabase migration list failed.' }
$env:DATABASE_URL = $env:SUPABASE_PRODUCTION_SCHEMA_AUDIT_DATABASE_URL
npm run audit:database-schema
npm run --silent psql:readonly -- SUPABASE_PRODUCTION_SCHEMA_AUDIT_DATABASE_URL -X -q -v ON_ERROR_STOP=1 -f scripts/audit-016-dedup-integrity.sql
```

Production passes when history is baseline then 032 then 033, audit prints `ok`, all eight exact RLS policies exist, and there are no unexpected/missing FK rows or loser references. This remains an operator/code-review gate; the publication no-human-review policy does not waive it.

- [ ] **Step 4: Commit the handoff**

```bash
git add DECISIONS.md AI_TASKS.md
git commit -m "docs: hand off Wave 1 database integrity tranche A"
```

## Self-Review

- Task ordering: Task 1 is forensic-only; Task 2 completes locally and contains Gate A/B; Task 3 begins only after Gate B and creates 032 before 033; Task 4 never edits the Claude-authored row.
- Forensic accuracy: a catalog-only `\gset`/`\if` proves the exact eight relations before any hard-coded child query executes; repeated CTE maps drive every child count, the JSONL records every raw-item ID, and READ ONLY never creates a temp relation.
- Damage assessment: restored pre-016 and current-production JSONL evidence are compared outside the repository; destroyed IDs are only pre-016 loser IDs absent from all current raw-item IDs, with either exact IDs/counts or an explicit no-backup/unknown result required in the eight-line decision.
- Merge correctness: `first_value(id)` materializes `winner_id`; discarded JSON is appended to that winner; verification attempts are repointed; discarded references are deleted; every full loser raw row is archived immutably before deletion; then the winner is moved to canonical, including the no-canonical-reference case.
- Constraints/interfaces: all eight FK children, eight exact service-role-only policies including the archive, the post-dedup unique hash index, the 013 RPC baseline contract, separate disposable/production schema-audit URLs, and parse-before-`pg.Client` audit validation are explicit and fixture-tested.
- Deployment: Gate B links production only for `db pull`; disposable and production links are separately asserted with PowerShell, every mutation-gating external command checks `$LASTEXITCODE`, every hosted deployment dry-runs first, production explicitly remaps `DATABASE_URL` from `SUPABASE_PRODUCTION_SCHEMA_AUDIT_DATABASE_URL` before audit, Docker/reset are local only, and neither operator nor code-review gates are waived.
- Placeholder scan: no deferred markers, fabricated baseline instructions, or unspecified code paths remain. Gate B is acknowledged as the unavoidable external blocker.

## Execution Handoff

Subagent-Driven execution is already selected by validated user direction. Use one fresh subagent per task, review each task before the next, and stop after Task 2 when Gate B credentials are unavailable.
