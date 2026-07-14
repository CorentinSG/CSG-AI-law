# Non-EU Western And Balkan Europe Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add country-level monitoring coverage for Western European and Balkan non-EU countries as a distinct “Non-EU Europe” layer.

**Architecture:** Follow the existing EU country-source pattern: seed source definitions, migration inserts, country-agent source IDs, selection tests, and a handoff entry in `AI_TASKS.md`. Keep frontend changes minimal unless existing country grouping code already supports a low-risk section.

**Tech Stack:** Next.js, TypeScript, Vitest, Supabase migrations, existing `sourceScanner`, Scrapling/Firecrawl fallback, Graphify coordination protocol.

## Global Constraints

- Initial countries are United Kingdom, Norway, Iceland, Switzerland, Liechtenstein, Monaco, Andorra, San Marino, Vatican City, Albania, Bosnia and Herzegovina, Kosovo, Montenegro, North Macedonia, Serbia.
- Exclude Ukraine, Moldova, Belarus, Russia, Turkey, Armenia, Azerbaijan, Georgia in this phase.
- Every new country must have at least three active monitoring sources.
- Changes must be append-only and non-destructive.
- No new paid dependency or API requirement.
- Keep design/frontend work minimal and compatible with Claude-owned UI work.

---

### Task 1: Discover Existing Country Coverage Patterns

**Files:**
- Read: `src/db/seed/ai-regulation-seed.ts`
- Read: `src/agents/ai-regulation/remainingEuMemberStateSources.test.ts`
- Read: country source selection helpers found via `rg "AgentSourceIds|selectSourcesForScanProfile|country" src/agents src/db -g "*.ts"`

**Interfaces:**
- Consumes: existing source seed shape and country-agent source ID naming.
- Produces: exact list of functions/files to modify for non-EU countries.

- [ ] **Step 1: Query graph and source patterns**

Run:

```powershell
py -m graphify query "Where are country monitoring source IDs and EU country source registries defined?"
rg -n "AgentSourceIds|selectSourcesForScanProfile|missingEuMemberStateAgentDefinitions|createCountryNewsSourceModule" src/agents src/db -g "*.ts"
```

Expected: paths and function names for source registry and scan profile resolution.

- [ ] **Step 2: Inspect seed structure**

Run:

```powershell
Select-String -Path src\db\seed\ai-regulation-seed.ts -Pattern "src-gb|src-no|src-ch|remaining|Bulgaria|Austria" -Context 3,8
```

Expected: existing source object conventions for IDs, `sourceCategory`, `ingestionMethod`, `preferredExtractionMethod`, `config`, and `scraplingConfig`.

### Task 2: Add Non-EU Europe Source Seeds And Migration

**Files:**
- Modify: `src/db/seed/ai-regulation-seed.ts`
- Create: `src/db/migrations/021_non_eu_western_balkan_europe_sources.sql`

**Interfaces:**
- Produces: stable source IDs for the 15 new countries.
- Produces: each country has at least three active sources.

- [ ] **Step 1: Write a failing coverage test first**

Create:

```typescript
// src/db/seed/non-eu-europe-sources.test.ts
import { describe, expect, it } from "vitest";

import { regulationSourcesSeed } from "@/db/seed/ai-regulation-seed";

const countries = [
  "United Kingdom",
  "Norway",
  "Iceland",
  "Switzerland",
  "Liechtenstein",
  "Monaco",
  "Andorra",
  "San Marino",
  "Vatican City",
  "Albania",
  "Bosnia and Herzegovina",
  "Kosovo",
  "Montenegro",
  "North Macedonia",
  "Serbia",
];

describe("non-EU Western and Balkan Europe source coverage", () => {
  it.each(countries)("%s has at least three active sources", (country) => {
    const sources = regulationSourcesSeed.filter(
      (source) => source.country === country && source.region === "Europe" && source.active,
    );

    expect(sources, country).toHaveLength(3);
    expect(sources.some((source) => source.sourceCategory !== "media")).toBe(true);
    expect(sources.some((source) => source.sourceCategory === "media" || source.sourceType === "discovery_source")).toBe(true);
  });
});
```

Run:

```powershell
npm test -- --run src/db/seed/non-eu-europe-sources.test.ts
```

Expected: FAIL because new sources are not yet seeded.

- [ ] **Step 2: Add source seed objects**

Add three active sources per country in `regulationSourcesSeed` using existing source object shape:

```typescript
{
  id: "src-gb-legislation-ai",
  name: "UK Legislation AI and digital regulation monitoring",
  jurisdiction: "United Kingdom",
  region: "Europe",
  country: "United Kingdom",
  sourceUrl: "https://www.legislation.gov.uk/",
  sourceType: "legislative_database",
  scanFrequency: "daily",
  active: true,
  lastScannedAt: null,
  notes: "Official UK legislation database monitored for AI, data protection, cloud, digital regulation, and related legal updates.",
  reliabilityLevel: "high",
  preferredExtractionMethod: "html_static",
  config: {
    authorityTypeHint: "Binding law",
    legalAreaHint: "AI governance",
    maxItems: 12,
  },
  ingestionMethod: "existing",
  sourceCategory: "official",
}
```

Use the same pattern for other countries, replacing source IDs, names, URLs, and source type. Prefer official gazettes/parliament/government/data protection authority pages. Use `discovery_source` plus GDELT/NewsAPI-style config only for the third fallback source where direct reliable legal news feeds are unavailable.

- [ ] **Step 3: Add SQL migration**

Create migration `021_non_eu_western_balkan_europe_sources.sql` that inserts the same source rows with `on conflict (id) do update` for non-destructive upsert. Follow the column order and JSON formatting used in migrations `018` and `019`.

- [ ] **Step 4: Run the test**

Run:

```powershell
npm test -- --run src/db/seed/non-eu-europe-sources.test.ts
```

Expected: PASS.

### Task 3: Add Country-Agent Source Resolution

**Files:**
- Modify: country source registry/helper file identified in Task 1.
- Test: create or extend `src/agents/ai-regulation/nonEuEuropeSources.test.ts`.

**Interfaces:**
- Consumes: source IDs created in Task 2.
- Produces: agent/profile source ID helpers for each new country.

- [ ] **Step 1: Write failing agent-resolution test**

Create a test that imports the country source ID registry and asserts every new country resolves at least three source IDs present in `regulationSourcesSeed`.

Run:

```powershell
npm test -- --run src/agents/ai-regulation/nonEuEuropeSources.test.ts
```

Expected: FAIL before helper implementation.

- [ ] **Step 2: Add helpers**

Add helper functions following existing naming, for example:

```typescript
export function getUnitedKingdomAgentSourceIds() {
  return [
    "src-gb-legislation-ai",
    "src-gb-ico-ai",
    "src-gb-gdelt-ai",
  ];
}
```

Repeat for all 15 countries.

- [ ] **Step 3: Run agent-resolution test**

Run:

```powershell
npm test -- --run src/agents/ai-regulation/nonEuEuropeSources.test.ts
```

Expected: PASS.

### Task 4: Minimal Public/Admin Grouping Support

**Files:**
- Inspect/modify only if existing data grouping supports this safely:
  - `src/app/[lang]/ai-regulation/europe/page.tsx`
  - `src/app/[lang]/ai-regulation/europe/[country]/page.tsx`
  - shared country dataset files found in Task 1.

**Interfaces:**
- Consumes: new country metadata.
- Produces: distinct label/group `Non-EU Europe` without major redesign.

- [ ] **Step 1: Identify country-list data source**

Run:

```powershell
rg -n "European Union|EU member|countryProfiles|countries|Europe" src/app src/components src/content -g "*.ts" -g "*.tsx"
```

Expected: exact file where Europe country lists/groups are defined.

- [ ] **Step 2: Add non-EU group only if low-risk**

If the list is data-driven, add:

```typescript
regionGroup: "Non-EU Europe"
```

or equivalent existing field. If the page is heavily design-owned, skip implementation and record a Claude handoff in `AI_TASKS.md`.

- [ ] **Step 3: Run targeted UI tests if modified**

Run:

```powershell
npm run typecheck
npm run lint
```

Expected: PASS with only pre-existing warnings.

### Task 5: Verification, Handoff, And Commit

**Files:**
- Modify: `AI_TASKS.md`

**Interfaces:**
- Produces: coordination handoff for Claude and future Codex sessions.

- [ ] **Step 1: Run full verification**

Run:

```powershell
npm test
npm run typecheck
npm run lint
$env:ADMIN_USERNAME='codex-admin'; $env:ADMIN_PASSWORD='codex-password-2026'; $env:ADMIN_AUTH_SECRET='codex-local-build-secret-2026-07-14'; npm run build
```

Expected:

- Vitest passes.
- Typecheck passes.
- Lint has 0 errors.
- Build passes.

- [ ] **Step 2: Update `AI_TASKS.md`**

Add a Codex row:

```markdown
| T-NON-EU-EUROPE-COVERAGE | Codex | DONE-LOCAL | `main` @ working tree | `src/db/seed/ai-regulation-seed.ts`, `src/db/migrations/021_non_eu_western_balkan_europe_sources.sql`, non-EU source tests | `sourceScanner`, `selectSourcesForScanProfile()`, community "Scan Pipeline" | 2026-07-14 |
```

Add a top handoff entry with verification commands and any skipped UI work.

- [ ] **Step 3: Commit**

Run:

```powershell
git add docs/superpowers/specs/2026-07-14-non-eu-western-balkan-europe-coverage-design.md docs/superpowers/plans/2026-07-14-non-eu-western-balkan-europe-coverage.md src AI_TASKS.md
git commit -m "feat(europe): add non-eu western balkan monitoring coverage"
git push origin main
```

Expected: commit and push succeed.

## Self-Review

- Spec coverage: all requested countries in Western Europe and Balkans outside the EU are represented; excluded countries are explicit.
- Placeholder scan: no `TBD`, `TODO`, or open-ended placeholder remains.
- Type consistency: source IDs and helper function names must be finalized during Task 2/3 from existing repo conventions before code implementation.

