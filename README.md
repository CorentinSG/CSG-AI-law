# C. Saint-Girons, Esq - AI Law & Legal Intelligence

This repository contains the AI Regulation Monitor MVP for a legal intelligence platform focused on official AI regulatory developments.

The current system supports:

- a seed-backed in-memory repository for controlled local demo use
- a Supabase/PostgreSQL-backed repository for real persistence
- a protected admin review workflow
- a public monitor that only displays published items
- append-only review-event persistence and normalized source-reference / verification tables
- durable scan-job persistence, source-health snapshots, and persisted AI Law News items
- regional Live Legal Intelligence panels inside the Europe and United States hubs

The app is designed for legal research and legal intelligence, not legal advice.

## Legal database reliability architecture

The legal database now includes an explicit reliability-and-integrity layer designed to favor:

- accuracy over volume
- official sources over commentary
- precise citations over vague links
- reviewability over automation
- traceability over speed
- recurring verification over one-time import

Core reliability components:

- `src/agents/ai-regulation/citations.ts`
- `src/agents/ai-regulation/publicationEligibility.ts`
- `src/agents/ai-regulation/dataQuality.ts`
- `src/agents/ai-regulation/dataSteward.ts`
- `src/agents/ai-regulation/legalIntegrity.ts`
- `scripts/report-data-quality.ts`

### Source hierarchy

The platform distinguishes:

- official legal and legislative sources
- official institutional/regulator/court sources
- standards and governance bodies
- secondary trackers
- media / legal press
- informal discovery sources

Only official or authoritative sources can support legal authority publication. Secondary trackers, media, and informal discovery sources can generate leads, but they cannot support publication by themselves.

### Publication eligibility guardrail

Public legal-intelligence publication is blocked unless the item:

- has completed human review
- has at least one official or authoritative primary source
- has structured citation metadata
- has clear jurisdiction and authority/development type
- is not discovery-only
- is not missing official-source confirmation

The central guardrail lives in:

- `src/agents/ai-regulation/publicationEligibility.ts`

Repository publication transitions call this guardrail before allowing `published`.

### Citation validation

Structured source references support:

- `sourceRole`
- `title`
- `institution`
- `url`
- `canonicalUrl`
- `sourceType`
- `authorityType`
- `publicationDate`
- `retrievedAt`
- `lastVerifiedAt`
- pinpoint metadata including `article`, `section`, `paragraph`, `page`, `annex`, `docket`, `billNumber`, `ruleNumber`, `CELEX`, `ECLI`, and `caseNumber`
- reliability and verification fields

Citation quality statuses now include:

- `complete`
- `partial`
- `missing_official_source`
- `missing_pinpoint`
- `vague_source`
- `inaccessible_source`
- `discovery_only`
- `needs_manual_verification`

Pinpoints are never invented. If a pinpoint is not detected, the field stays blank and the system records a warning rather than fabricating precision.

For the Europe baseline specifically, the EU AI Act entry is now intentionally conservative:

- the baseline no longer claims `complete` citation quality unless exact official pinpoints are actually extracted
- a dedicated EUR-Lex AI Act parser lives in `src/agents/ai-regulation/eurLexAiActParser.ts`
- the Europe baseline now uses verified EUR-Lex article / annex pinpoints for core AI Act structural references
- the entry remains `partial` until broader article-level extraction is fully automated and verified

The source-verification layer is also now runtime-aware:

- Europe and admin surfaces prefer persisted `source_health_checks` when available
- the static verification registry remains a documented fallback, not the primary live truth
- country-level Europe citations now preserve more exact official authority types such as `government`, `parliament`, `legislation`, and `policy` instead of flattening everything into `regulator`
- the legal-integrity layer now explicitly flags Europe overprecision risks such as:
  - governance actors marked `complete` even though their notes still require more precise legal review
  - topic-page or metadata-page soft-law entries marked too strongly
  - stronger Member State implementation labels without dated official implementation sources

### Discovery lead separation

Discovery, tracker, and media leads remain structurally distinct from publishable legal authority. They may inform verification work, but they must not appear publicly as confirmed law unless an official source is attached and a human reviewer approves publication.

### Data quality and integrity reporting

The repository now supports a CLI reliability report:

```bash
npm run report:data-quality
```

The report summarizes:

- source health attention
- citation warnings
- stale or due baseline entries
- discovery backlog
- high-priority review queue volume
- integrity audit findings across Europe, U.S., case-law, source hierarchy, and seed safety

### Legacy Supabase compatibility

The repository now includes a controlled compatibility path for remote Supabase instances that still have the earlier legal-monitor schema but have not yet received:

- `src/db/migrations/003_foundation_hardening.sql`
- `src/db/migrations/004_operational_jobs_and_news.sql`

Behavior in that situation:

- `seed:supabase` downgrades `regulation_sources` rows to the legacy column/check-constraint shape
- governance tables introduced later, such as `news_items`, `scan_jobs`, and `source_health_checks`, are skipped with explicit warnings instead of crashing the seed
- `scan:sample` and `scan:scheduled-test` keep running by falling back to process-local compatibility storage for non-critical governance writes

This compatibility layer is a resilience bridge, not a substitute for migrations. The preferred state remains applying migrations `003` and `004` to the remote Supabase project so governance data is fully persisted.

## Product scope

This project is intentionally limited to the **AI Regulation Monitoring Agent** and the public/admin infrastructure needed to review and publish regulatory updates.

It does **not** yet include:

- newsletter generation
- case law tracking
- article generation
- broader site expansion

## Public site structure

The public-facing site is no longer framed only as a regulatory database.

Current public routes:

- `/`
- `/research`
- `/research/[slug]`
- `/news`
- `/news/[slug]`
- `/ai-regulation`
- `/standards`
- `/contact`

Current positioning:

- the homepage introduces the broader platform identity
- the AI Regulation Monitor is presented as one important feature of the site
- notes & commentary, standards, and future editorial directions are visible in the public architecture
- admin review remains separate and protected
- the public shell now reads more like an authored research desk and less like a placeholder or database front end

The current public shell is intentionally restrained:

- premium, editorial, and technology-oriented
- minimal navigation
- human-reviewed legal intelligence positioning
- no claim that published content is legal advice

The current public copy is also intentionally structured around:

- an authored homepage rather than an anonymous landing page
- a notes-and-commentary section with credible preview notes rather than an empty blog shell
- a standards page that explains why soft law and technical standards matter
- a contact page framed for professional inquiries without prematurely adding backend messaging infrastructure

## AI Law News / Legal Developments

The site now includes a separate AI Law News layer:

- public feed: `/news`
- public detail pages: `/news/[slug]`
- admin review surface: `/admin/ai-regulation/news`
- source configuration: `src/content/ai-regulation/news-sources.ts`
- news item model and mapping helpers: `src/content/ai-regulation/news.ts`
- persisted news storage: `news_items`

AI Law News is intentionally different from the AI Regulation Monitor.

The AI Regulation Monitor remains the curated legal database for verified, human-reviewed, manually published legal intelligence items. AI Law News is a broader source-aware developments feed that can surface:

- recent legal and regulatory developments
- agency activity
- legislative developments
- case-law alerts
- policy and standards updates
- media or tracker-reported developments requiring verification

### News source hierarchy

News sources are classified as:

- `official_source`
- `legal_regulatory_press`
- `tracker_database`
- `informal_discovery_source`

Reliability labels include:

- `official_authority`
- `reputable_secondary`
- `tracker_secondary`
- `informal_discovery`

Official sources can support legal authority after citation review and human publication.

Non-official sources can support news/discovery only. They must not be presented as final legal authority and must be verified against official sources before conversion into monitor items.

### Persisted news behavior

The news layer is now persisted separately from the core monitor update rows.

- `ai_regulatory_updates` remains the legal-intelligence review object
- `news_items` stores the broader feed representation
- public `/news` reads from `news_items`
- published monitor items sync into public news automatically
- admin-only or discovery-oriented items can stay private in `news_items` without becoming public legal authority

### News date and citation requirements

Each news item model supports:

- source name
- source URL
- source type
- source reliability
- publication date
- event date / exact date of information when detected
- detected date
- last verified date
- jurisdiction and region
- verification status
- official source URL if found
- corroborating sources
- citation quality
- reviewer notes

If the exact event date is not available, the public UI says so instead of inventing one.

### Verification statuses

The AI Law News layer supports:

- `official_verified`
- `corroborated`
- `needs_official_source`
- `discovery_only`
- `media_reported`
- `needs_review`
- `rejected`
- `converted_to_monitor_item`
- `published_news`

## Live Legal Intelligence panels

The Europe and United States regional hubs now include dedicated live intelligence panels directly inside:

- `/ai-regulation/europe`
- `/ai-regulation/united-states`

These panels are not replacements for the curated AI Regulation Monitor. They are a live legal-intelligence layer designed to make the monitoring system feel active while preserving conservative legal posture.

### Public display requirements

Every visible live item must show:

- source name
- source URL
- publication date or detected date
- verification status
- source type

The public regional panels are intentionally conservative:

- they show region-relevant items only
- they foreground source, date, and verification posture
- they do not auto-publish legal authority
- they do not present non-official discovery leads as settled law

### Regional placement

- Europe hub shows Europe-only live legal developments
- United States hub shows U.S.-only live legal developments
- France country page now adds a France-only live legal-intelligence panel at:
  - `/ai-regulation/europe/france`
- each regional panel includes:
  - a live monitoring status indicator
  - exact last-checked timestamp when available
  - recent source-health activity
  - recent public, source-backed signals
  - links to original sources
  - links to verified monitor items when available

### France continuous monitoring layer

France now has a dedicated continuous-monitoring layer built around:

- `src/agents/ai-regulation/franceLegalNewsAgent.ts`
- `src/agents/ai-regulation/franceNewsSources.ts`

Current France monitoring structure:

- lightweight frequent live loop:
  - CNIL RSS / AI materials
- slower official baseline loop:
  - Legifrance AI legal texts
  - Conseil d'Etat AI materials
  - Cour de cassation AI materials
  - Defender of Rights AI materials
- France-only recurring verification loop:
  - reverification can now be restricted to France monitoring sources instead of running only as a global undifferentiated pass
- France news currentness layer:
  - `src/agents/ai-regulation/newsCurrentness.ts`
  - each France source now carries explicit cadence windows:
    - `freshHours`
    - `watchHours`
    - `staleHours`
    - `priorityBand`
  - France live/admin views now distinguish:
    - `breaking`
    - `current`
    - `watch`
    - `stale`
  - source-health snapshots now distinguish:
    - `fresh`
    - `due_for_refresh`
    - `stale`
    - `source_inaccessible`

France-specific scripts:

- `npm run scan:france-official-legal`
- `npm run scan:france-legal-news`
- `npm run scan:france-verification`

France live API layer now also includes first-class connector support for:

- `CNIL RSS`
- `Judilibre API`
- `NewsAPI`
- `France AI legal major press (NewsAPI)`
- `GDELT DOC API`

Current operational posture:

- `CNIL RSS` remains the strongest lightweight official France live source
- `Judilibre API` is implemented as an official case-law connector, but it requires a configured `JUDILIBRE_API_KEYID`
- `NewsAPI` is implemented as a fast discovery connector, but it requires a configured `NEWSAPI_API_KEY`
- `France AI legal major press (NewsAPI)` is implemented as a dedicated metadata-only discovery lane restricted to large newspaper and policy-press domains
- `GDELT` is implemented as a fast discovery connector and can be queried without credentials, but runtime rate limiting may occur and must be surfaced honestly
- `NewsAPI` and `GDELT` are discovery-only inputs and must never be treated as legal authority without official confirmation
- the France major-press lane is also discovery-only and must never be treated as legal authority without official confirmation
- NewsAPI-based media lanes now require a deterministic `AI + legal/regulatory` filter rather than AI-only matching
- admin review now also applies a media-domain score so major outlets such as Reuters or Politico Europe sort ahead of weaker secondary media domains when multiple discovery leads share similar legal priority
- direct connector and memory-mode validation now degrade safely on missing credentials, invalid credentials, or rate limits by returning explicit warnings rather than inventing results
- the current Supabase-backed scheduled runtime may still surface some provider-level failures directly in scan logs when upstream APIs reject requests; this should be treated as an honest operational constraint, not hidden as success
- the France live runtime is now hardened so that `NewsAPI`, `GDELT`, `Judilibre`, and `Legifrance` degrade into explicit warning states and `zeroResultsReason` messages instead of crashing scans when credentials are missing, invalid, rate-limited, blocked, or challenged

### Spain continuous monitoring layer

Spain now also has a dedicated continuous-monitoring layer built around:

- `src/agents/ai-regulation/spainLegalNewsAgent.ts`
- `src/agents/ai-regulation/spainNewsSources.ts`
- `src/content/ai-regulation/spain-ai-intelligence.ts`

Current Spain monitoring structure:

- lightweight frequent live loop:
  - AEPD AI and Innovation
- slower official baseline loop:
  - AESIA official materials
  - BOE AI legal texts
  - La Moncloa AI governance materials
- Spain-only recurring verification loop:
  - reverification can now be restricted to Spain monitoring sources instead of running only as a global undifferentiated pass
- Spain news currentness layer:
  - `src/agents/ai-regulation/newsCurrentness.ts`
  - each Spain source now carries explicit cadence windows:
    - `freshHours`
    - `watchHours`
    - `staleHours`
    - `priorityBand`
  - Spain live/admin views now distinguish:
    - `breaking`
    - `current`
    - `watch`
    - `stale`
  - source-health snapshots now distinguish:
    - `fresh`
    - `due_for_refresh`
    - `stale`
    - `source_inaccessible`

Spain-specific scripts:

- `npm run scan:spain-official-legal`
- `npm run scan:spain-legal-news`
- `npm run scan:spain-verification`

Spain live API layer now also includes first-class connector support for:

- `AEPD AI and Innovation`
- `AESIA official materials`
- `BOE AI legal texts`
- `La Moncloa AI governance materials`
- `Spain AI legal news discovery (NewsAPI)`
- `Spain AI legal major press (NewsAPI)`
- `Spain AI legal news discovery (GDELT)`

Current Spain operational posture:

- `AEPD` is the strongest lightweight official Spain live source today
- `AESIA`, `BOE`, and `La Moncloa` are tracked as official higher-authority Spain sources, but remain on a slower cadence than AEPD
- Spain now has a dedicated country page layer at `/ai-regulation/europe/spain` with:
  - a Spain-only live legal-intelligence panel
  - a Spain authority map
  - a Spain AI legal timeline
  - a first verified Spain administrative-decision layer
  - explicit verification gaps
- Spain now has a first conservative verified decision layer built from official AEPD legal-criteria pages, and those entries remain clearly treated as summary-backed administrative-decision signals rather than full pinned-resolution replacements
- `NewsAPI` and `GDELT` remain discovery-only inputs and must never be treated as legal authority without official confirmation
- the Spain major-press lane is metadata-only and restricted to major newspapers / policy press domains
- the Spain live runtime is now designed to degrade honestly rather than crash when discovery sources are unavailable or when no unresolved Spain leads require reverification

Europe live API layer now also includes first-class connector support for:

- `European AI legal news discovery (NewsAPI)`
- `Europe AI legal major press (NewsAPI)`
- `European AI legal news discovery (GDELT)`
- `European Commission Highlighted News RSS`
- `EDPB official RSS`
- `CURIA press releases RSS`
- `EUR-Lex Commission proposals RSS`
- `EUR-Lex Parliament and Council legislation RSS`

Current Europe operational posture:

- these Europe API sources are discovery-only and never authoritative by themselves
- they are intended to accelerate detection of EU AI Act, EU AI Office, Commission, EDPB, EDPS, and broader European AI-law signals
- the Europe major-press NewsAPI lane is metadata-only and restricted to major newspapers / policy press domains
- `scan:eu-legal-news` is now Europe-scoped and no longer reuses the France-specific discovery sources
- Europe now also has a faster official-feed confirmation layer behind:
  - `scan:eu-official-legal`
  - `src/agents/ai-regulation/euNewsSources.ts`
  - `src/agents/ai-regulation/connectors/rss-connector.ts`
- this official-feed layer is intentionally different from Europe discovery APIs:
  - it uses structured official feeds where available
  - it accelerates official confirmation closer to real time
  - it still does not auto-publish anything
  - it still relies on deterministic AI-law term filtering for broad official feeds
- both Europe and France NewsAPI media lanes now also require a deterministic AI-plus-legal-regulatory filter:
  - AI-only product or model-launch coverage should be filtered out
  - only items with both an AI signal and a legal/regulatory signal should pass
  - allowed-domain filtering narrows results to major newspapers and policy press only
- the current official fast-feed set includes:
  - Commission highlighted news RSS
  - EDPB RSS
  - CURIA RSS
  - EUR-Lex Commission proposals RSS
  - EUR-Lex Parliament and Council legislation RSS
- official fast-feed items can automatically create or update review objects only as `needs_review` / `verified_for_review`, never as final published legal conclusions
- the same runtime-hardening rule applies:
  - missing credentials
  - invalid credentials
  - rate limits
  - malformed upstream responses
  all degrade into explicit warning states and `zeroResultsReason`, not hard scan failures
- the RSS connector is now hardened for richer XML feeds that expose structured category objects, so official Commission-style feeds do not crash scans

France-specific implementation detail:

- `src/agents/ai-regulation/legifranceAiParser.ts` now provides a dedicated Legifrance parser for AI-related French legal texts and jurisprudence metadata
- `src/agents/ai-regulation/franceOfficialPageParser.ts` now provides targeted parsing for French institutional AI pages
- the Cour de cassation path now follows the site’s JavaScript redirect shell before parsing the underlying publication page
- current runtime reality remains conservative:
  - Legifrance may still return a Cloudflare challenge from the current scan runtime
  - the parser is ready for allowed access paths, but blocked scans must stay flagged as manual-review or constrained-access situations

France verified case-law baseline:

- the Europe case-law layer now includes a first verified France-specific judicial baseline from official sources only
- current French entries include:
  - Conseil d'Etat `427916`
  - Conseil d'Etat `417906`
  - Conseil d'Etat `451653`
  - Cour de cassation `16-27.866`
- these entries remain conservative, source-backed, and `needs_review`; they are not a claim of exhaustive French AI case-law coverage

Important limitation:

- the architecture is designed to support a near-real-time France signal layer
- CNIL is currently the only France source explicitly marked as lightweight enough for a more frequent loop
- heavier French legal-text and judicial pages remain on a slower recurring cadence
- France “live” is now more operationally current because items are scored by freshness and review urgency, but that does not mean every official France source is scanned continuously or in real time
- Conseil d'Etat, Cour de cassation, and Defender of Rights listing pages still rely on generic static parsing and may legitimately return zero parsed items until dedicated listing parsers are added
- the system must not be described as guaranteed real time if the deployed scheduler cannot support five-minute execution

### Source hierarchy for live news

Live news/intelligence can ingest or prepare ingestion from:

- official sources
- trackers / secondary databases
- legal / regulatory press
- informal discovery sources

But the authority rule does not change:

- official sources can support legal authority after citation review and human review
- trackers, media, and discovery sources are leads only
- non-official items require official-source confirmation before conversion into legal-database authority

### Automatic conversion rule

When a non-official development is corroborated by:

- at least one official source; and
- preferably one additional reliable corroborating source

the system may create or update a structured legal-database item only as:

- `needs_review`
- `verified_for_review`

It must never auto-publish.

## Scan profiles and scheduling posture

The monitoring architecture now distinguishes four scan profiles:

- `official_baseline_scan`
- `live_news_discovery_scan`
- `verification_scan`
- `source_health_scan`

It also now includes three France-specific profiles:

- `france_official_legal_scan`
- `france_live_news_scan`
- `france_verification_scan`

Supporting code:

- `src/agents/ai-regulation/scanProfiles.ts`
- `src/agents/ai-regulation/processors/pipeline.ts`
- `src/agents/ai-regulation/processors/scanJobs.ts`

### Intended cadence

- official baseline scan: daily or hourly depending on source and infrastructure
- live news discovery scan: target every 5 minutes when infrastructure safely allows it
- verification scan: frequent rechecks for unresolved discovery leads
- source health scan: daily accessibility and parser-health pass

### Current Vercel scheduler limitation

The current repository still ships with a daily Vercel cron in `vercel.json`.

As of Vercel's official cron documentation and usage/pricing documentation:

- Hobby cron jobs are limited to once per day
- hourly or every-5-minute cron expressions on Hobby fail deployment
- Pro and Enterprise support per-minute scheduling

Official references:

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel Cron Jobs Usage and Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

Practical interpretation for this repository:

- the architecture is five-minute ready
- the current deployed fallback remains daily on-platform unless the project runs on higher scheduler capability or an external scheduler is added
- local/manual scripts exist for safe testing of the live-news and verification profiles
- France now has a dedicated protected cron route and a Hobby-safe daily fallback:
  - `/api/cron/ai-regulation-france-scan`
  - `vercel.json` keeps this on a daily schedule rather than pretending five-minute Hobby support exists

### Scan scripts

Available scan commands now include:

- `npm run scan:sample`
- `npm run scan:live-news`
- `npm run scan:verification`
- `npm run scan:scheduled-test`
- `npm run scan:france-official-legal`
- `npm run scan:france-legal-news`
- `npm run scan:france-verification`

These scripts do not weaken existing publication, citation, or review rules.

## EU AI Legal News Agent

The repository now includes a dedicated Europe-first live legal-news layer for AI law monitoring:

- `src/agents/ai-regulation/euLegalNewsAgent.ts`
- `src/agents/ai-regulation/euNewsSources.ts`
- `src/agents/ai-regulation/euNewsClassification.ts`
- `src/agents/ai-regulation/euNewsVerification.ts`
- `src/agents/ai-regulation/euNewsToDatabase.ts`

This agent is designed to keep the Europe hub feeling alive and current while preserving conservative legal posture.

### What the EU agent does

- watches Europe-relevant official and discovery sources
- classifies EU legal developments
- distinguishes hard law, soft law, case law, enforcement, guidance, and discovery
- cross-checks source posture
- ranks Europe live-panel items by legal significance
- prepares official developments for structured database conversion
- never auto-publishes final legal conclusions

### EU source hierarchy

The EU agent recognizes several layers:

- official EU sources
- official Member State sources
- soft-law / standards / governance sources
- secondary trackers
- legal and regulatory press
- informal discovery sources

Official sources can support database conversion. Non-official sources remain leads only until official confirmation is found.

### Live news vs. discovery vs. database conversion

The EU agent keeps these layers distinct:

- live legal news detection
- discovery lead storage
- verification and corroboration
- legal database conversion
- final reviewed publication

If an official-source EU development is detected and classified as hard law, guidance, case law, or enforcement material, it can support automatic creation or linkage of a legal-database item only as:

- `needs_review`
- `verified_for_review`

It must not be auto-published.

### Europe hub behavior

The Europe hub now uses the EU agent to rank live legal-news items by:

- official-source status
- hard-law weight
- AI Act relevance
- Member State implementation relevance
- case law / enforcement significance
- recency

Only clearly sourced and dated items are shown publicly.

### EU scripts

Additional EU-specific scripts are now available:

- `npm run scan:eu-legal-news`
- `npm run scan:eu-verification`

These are wrappers over the shared scan architecture, but they make the Europe-specific monitoring intent explicit.

Public labels intentionally distinguish source posture, for example:

- “Official source”
- “Reported by [source] - official source pending”
- “Discovery lead - requires verification”
- “Corroborated by official source”

### Paywalled and media-source rule

Paywalled or restricted media/legal press sources are manual or metadata-only references.

Do not:

- scrape paywalled full text
- bypass paywalls
- reproduce copyrighted article text
- treat media or trackers as legal authority

The system may store public metadata such as headline, source name, URL, detected date, topic, and jurisdiction hints when lawful and available.

### Scheduled update behavior

The existing scheduled scan path continues to check active official and approved discovery sources. New discovery/media leads can be captured privately, deduplicated, and flagged for verification, but they must not be auto-published as legal authority.

If uncertain, items should remain admin-only until official-source confirmation and human review.

## Notes and commentary structure

The site now includes a lightweight editorial layer for notes, commentary, and legal analysis built on a TypeScript content registry rather than a full CMS.

Current content architecture:

- content registry: `src/content/research.ts`
- notes landing page: `/research`
- individual public note pages: `/research/[slug]`

This approach was chosen deliberately because it is:

- simple to maintain
- easy to review in Git
- compatible with the current App Router architecture
- safer than adding CMS complexity too early

### Supported note metadata

Each research entry can include:

- `title`
- `subtitle`
- `slug`
- `author`
- `status`
- `publishedAt`
- `updatedAt`
- `category`
- `tags`
- `jurisdiction`
- `readingTime`
- `summary`
- `abstract`
- `body`
- `references`
- `relatedSlugs`

### Publication statuses

The editorial registry supports:

- `published`
- `forthcoming`
- `draft`

Public behavior:

- `published` entries are publicly visible
- `forthcoming` entries are publicly visible as clearly marked previews
- `draft` entries are intentionally hidden from public routes

### How to add a note or commentary piece

1. Open `src/content/research.ts`
2. Add a new entry to `researchEntries`
3. Choose a status:
   - `published` for live public notes that are actually written in the content system
   - `forthcoming` for public editorial previews or notes in development
   - `draft` for internal non-public content
4. Add metadata, body sections, tags, and optional references
5. If needed, link related notes through `relatedSlugs`
6. Run:

```bash
npm run lint
npm run typecheck
npm run build
```

### Categories and tags

The current editorial taxonomy includes:

- AI Regulation
- AI Litigation
- AI Governance
- AI & Legal Ethics
- Legal Technology
- Access to Justice
- Comparative AI Law
- EU AI Law
- U.S. AI Law
- Soft Law & Standards
- Legal Intelligence Systems
- Research Notes

Tags are intentionally flexible and allow narrower thematic linking between notes, monitor items, and standards coverage.

## shadcn and component paths

This project already supports:

- TypeScript
- Tailwind CSS
- shadcn-style component structure

The configured default paths are:

- UI components: `src/components/ui`
- shared components: `src/components`
- global styles: `src/app/globals.css`

Because the project uses a `src/` structure and the `@/components/...` alias,
the correct place for shadcn-style UI components is `src/components/ui`.
Do not create a top-level `/components/ui` folder unless the aliasing strategy changes.

## Hard law and soft law coverage

The AI Regulation Monitor is designed to track both:

- binding and proposed legal materials such as statutes, regulations, rulemakings, agency guidance, and enforcement actions
- influential soft law, technical standards, and governance frameworks that matter for AI compliance and legal intelligence

Examples now covered include:

- EUR-Lex AI-related EU legal materials
- NIST AI RMF resources
- OWASP AIMA
- ISO/IEC 42001 official metadata
- OECD AI policy and governance materials

Important editorial rule:

- soft law, standards, and governance frameworks are not automatically binding law
- technical standards may be paywalled; only official public metadata should be stored or displayed
- every item still requires human review before publication

## Europe and United States intelligence hubs

The public AI Regulation Monitor is now split into distinct regional intelligence hubs:

- `/ai-regulation/europe`
- `/ai-regulation/united-states`

Europe is the current priority hub.

The Europe page is designed to separate:

- EU-level legal framework
- Member State implementation
- European regulator guidance
- broader European soft law or standards signals

The United States page is designed to separate:

- U.S. federal developments
- state-level developments
- U.S.-relevant soft law and standards materials

This separation is intentional. EU and U.S. developments should not be blended into a single undifferentiated public stream when the legal architecture, institutions, and implementation posture differ materially.

## Europe legal baseline architecture

The Europe hub now includes a conservative legal-baseline layer. The purpose is not to claim exhaustive coverage; it is to give the platform a verified starting point for the current European AI-law architecture.

Baseline files:

- `src/content/ai-regulation/europe-ai-legal-baseline.ts`
- `src/content/ai-regulation/europe-member-state-implementation.ts`
- `src/content/ai-regulation/europe-ai-case-law.ts`
- `src/content/ai-regulation/europe-ai-soft-law.ts`
- `src/content/ai-regulation/eu-timeline.ts`
- `src/content/ai-regulation/europe-map.ts`

The baseline distinguishes:

- EU hard law, including Regulation (EU) 2024/1689
- EU implementation and governance materials
- EU and European case-law source architecture
- Member State implementation status
- national competent-authority and DPA verification posture
- European and international soft law, standards, and governance frameworks

### EU AI Act baseline

The AI Act baseline currently covers:

- official title and short title
- CELEX number where available
- Official Journal / EUR-Lex source reference
- adoption, publication, and entry-into-force dates
- phased application-date milestones
- governance and implementation topic structure
- source references and citation-quality status

The Europe hub now makes the legal layers more explicit:

- `EU AI Act baseline` = binding EU law
- `EU governance actors` = governance bodies or official guidance sources, not automatically standalone legal obligations
- `Soft law and standards` = non-binding or conditionally binding materials unless incorporated by law
- `Case law` = court decisions and court-source architecture, kept separate from legislative/governance materials

The baseline does **not** invent article, recital, chapter, or annex pinpoints. If article-level extraction has not been performed, the data says so directly and leaves the pinpoint blank or under review.

### Member State implementation methodology

All 27 EU Member States are represented in the country-profile layer.

The first deeper country pass currently covers:

- France
- Germany
- Spain
- Italy
- Netherlands

Current conservative first-wave posture after the latest deep pass:

- France: `competent_authority_designated` based on a substantially stronger official-source baseline, including CNIL AI Act materials, multiple CNIL recommendation publications, a Legifrance AI-governance decree, parliamentary AI reports, and the CNIL 2025 annual report statement that CNIL was designated in 2025 as an authority for protection of fundamental rights under the AI Act
- Germany: `implementation_in_progress` based on an official Federal Government implementation page dated 11 February 2026
- Spain: `implementation_in_progress` based on official AESIA / BOE materials and the 26 May 2026 Council of Ministers draft-law milestone
- Italy: `national_implementation_identified` based on official Law No. 132 of 23 September 2025
- Netherlands: `consultation_or_draft_identified` based on the official 20 April 2026 consultation milestone

For each country profile, the system tracks:

- implementation status
- implementation confidence
- official source references
- competent-authority verification status
- market-surveillance and notifying-authority verification status
- DPA or regulator source posture where verified
- case-law source posture
- soft-law or guidance source posture
- missing-source warnings
- citation quality

Countries without verified national implementation sources are labeled `needs_review`. This is intentional. The absence of a verified source in the platform does not mean absence of national law, policy, or institutional activity.

### France baseline note

France now has a dedicated deeper official-source baseline across:

- CNIL AI Act questions and answers
- direct legislative and parliamentary AI Act adaptation instruments, including the 10 November 2025 government adaptation bill and Senate amendments nos. 442 and 444 of 12 February 2026
- CNIL recommendation series and sandbox/reporting materials
- CNIL's 2026 work programme and 2026 healthcare AI guidance layer
- Legifrance AI-governance decree material
- parliamentary AI reports from the Assemblee nationale and the Senat
- official judicial-institution AI governance materials from the Conseil d'Etat and the Cour de cassation
- Defender of Rights AI and fundamental-rights materials
- a broader first verified French AI-related decision layer covering Conseil d'Etat decisions `427916`, `417906`, `451653`, `506370`, Cour de cassation `16-27.866`, and official CNIL decisions `2025-108` and `DR-2024-184`

This is a substantially stronger France baseline, not a claim of exhaustive completeness.

Important France-specific guardrails:

- the profile can now support `competent_authority_designated` for at least one AI Act-related French authority role
- the direct final promulgated instrument for every French AI Act designation is still not fully pinned article by article
- official French judicial-institution AI materials are not the same thing as verified French AI case-law holdings
- French live-news and database items should remain source-backed, dated, and conservative
- the direct-source baseline is materially stronger, but it still does not amount to a complete final national authority map

France page readability is now more structured:

- France live legal-intelligence panel
- France authority map
- France AI legal timeline
- verified decisions and acts section
- explicit verification-gap section

This should help users distinguish:

- live signal
- direct legal authority
- verified decisions / administrative acts
- unresolved verification work

### Europe map methodology

The Europe map consumes the Member State profile data.

Map status rules:

- do not color or label a country as implemented unless an official source supports it
- if no official national source is verified, the country remains `needs_review`
- confidence level and source count are shown separately from legal status
- map entries link to country profiles, including incomplete profiles, so missing verification is visible rather than hidden

### Case-law baseline methodology

The case-law layer now combines:

- official European court source architecture
- a first conservative wave of specifically verified CJEU entries

Prepared official sources include:

- CURIA / InfoCuria for CJEU and General Court materials
- HUDOC for European Court of Human Rights materials

Currently verified example entries include:

- `C-634/21` `OQ v Land Hessen (SCHUFA Holding (Scoring))`
- `C-203/22` `CK v Magistrat der Stadt Wien (Dun & Bradstreet Austria)`

No case facts, holdings, procedural posture, or outcomes are added unless a specific official source is verified at case level. Even verified entries remain conservative and reviewable, and are stored as `needs_review` rather than treated as final-published legal conclusions.

### Soft law and standards methodology

The Europe baseline tracks soft law, standards, and governance frameworks separately from binding law.

Current baseline examples include:

- General-Purpose AI Code of Practice
- European Commission GPAI provider guidelines
- EDPB AI topic materials
- EDPS AI topic materials
- ISO/IEC 42001 official metadata
- OWASP AI Maturity Assessment
- OECD AI Principles
- Council of Europe AI materials, currently marked with runtime-access limitations

Soft law and technical standards are not presented as binding law unless an official legal source clearly incorporates them. Paywalled standards text must not be reproduced.

### Recurring baseline verification

The scheduled scan continues to update active monitoring sources. Baseline source references also carry verification metadata such as:

- last verified date
- response status where checked
- parser status
- monitoring recommendation
- citation quality
- access limitations

If a baseline source becomes inaccessible, the item should not be deleted. It should be flagged as stale, inaccessible, or needing manual review, while preserving prior verified context with a caution note.

Europe now uses a tighter freshness posture for public baseline stewardship:

- stronger Member State implementation statuses are reviewed on a shorter cycle than placeholder statuses
- governance actors and soft-law / guidance entries are reviewed more frequently than stable hard-law baseline entries
- the EU AI Act hard-law baseline remains on a longer review horizon than country implementation, consultations, or guidance pages

### Europe maintenance loop

The admin data-governance dashboard now exposes a dedicated Europe maintenance queue.

This queue is meant to prioritize:

- inaccessible or unstable Europe sources
- Member State implementation statuses needing refreshed official confirmation
- Europe citation warnings on monitor items
- timeline and governance entries with overprecision risk
- Europe case-law items that remain narrow or review-dependent

### Europe baseline limitations

The current Europe baseline is intentionally incomplete.

Known limitations:

- Member State implementation is not complete across all 27 Member States
- many national competent-authority designations still require official-source review
- case-law coverage is still narrow and not comprehensive; the current layer is a first verified wave rather than a complete European AI case-law database
- article, recital, chapter, and annex pinpoints require parser or manual legal review
- source references are currently stored in TypeScript content and JSON metadata rather than a dedicated relational `source_references` table

The platform should prefer a smaller verified baseline over broad but unreliable coverage.

## Legal Intelligence Data Steward

The project now includes a read-only data governance layer for keeping the legal intelligence database structured, current, source-backed, and reviewable as Europe and U.S. coverage grows.

Core files:

- `src/agents/ai-regulation/freshness.ts`
- `src/agents/ai-regulation/dataQuality.ts`
- `src/agents/ai-regulation/coverageDiagnostics.ts`
- `src/agents/ai-regulation/dataSteward.ts`
- admin dashboard: `/admin/ai-regulation/data-quality`

The data steward evaluates:

- source health and runtime accessibility
- source freshness and scan posture
- citation quality and missing official-source warnings
- verification status and cross-source corroboration posture
- Europe Member State coverage completeness
- U.S. state coverage completeness
- timeline milestone citation support
- case-law source readiness
- soft-law classification and access limitations
- discovery leads that still need official-source verification

### Data quality statuses

The stewardship layer uses conservative status labels such as:

- `complete`
- `partial`
- `needs_review`
- `stale`
- `missing_official_source`
- `missing_citation`
- `inaccessible_source`
- `discovery_only`
- `verified_for_review`
- `ready_for_publication`

These statuses are review aids only. They never publish content, change public visibility, or bypass admin review.

### Freshness policy

Freshness is evaluated by data type:

- active official sources are expected to be checked through the daily scheduled scan
- country and state implementation profiles become stale after the configured review window
- timeline milestones are rechecked regularly, especially around upcoming dates
- case-law source architecture is marked for recurring or manual review depending on parser posture
- soft-law and standards entries are rechecked for version or source changes
- discovery leads remain higher-priority until verified, rejected, or marked stale

Freshness statuses:

- `fresh`
- `due_for_review`
- `stale`
- `source_inaccessible`
- `needs_manual_review`

Stale data is not deleted automatically. It is flagged for admin review.

### Review priority queue

The admin data-quality dashboard produces a read-only review queue.

High-priority examples:

- active official source suddenly inaccessible
- public-facing or publishable item with weak citation metadata
- verified source item waiting for human review
- country or state status stale or missing official sources
- discovery lead without official-source confirmation

Medium-priority examples:

- soft-law item needing classification review
- case-law source needing dedicated parser
- discovery lead with a possible official source
- baseline entry with partial citation quality

Low-priority examples:

- duplicate-heavy but healthy source
- unchanged source recheck
- incomplete non-public baseline item

## Operational scan jobs and source health

The scanning system now persists operational job and health data:

- `scan_jobs` stores queued, running, succeeded, partial-success, and failed scans
- `source_health_checks` stores per-source runtime accessibility and parser health snapshots
- `regulation_sources` now retains the latest response status, counts, parser warnings, and recent accessibility note

This means scans are no longer only ephemeral request events. Even though execution still happens inline today, every manual or cron-triggered run now leaves durable operational state for later admin review.

The steward loop is now tighter:

- each scan job also triggers a stewardship sync pass
- stewardship findings are persisted to `data_quality_findings`
- recurring verification now checks both official-source candidates and corroborating URLs when available
- admin data-governance views can show both live diagnostics and persisted findings from prior scan cycles

### Citation and corroboration enforcement

The data steward integrates the precise citation policy:

- official or authoritative source references are required for publication eligibility
- vague source labels are flagged
- missing institution, URL, publication/retrieval/verification date, or authority type is flagged
- discovery and media sources are never treated as legal authority
- cross-source corroboration improves confidence but does not replace human review

Publication still requires:

- official or authoritative source
- precise citation metadata
- suitable verification status
- human approval
- `published` status

The steward does not change those workflow rules.

## Pagination and production checks

The highest-volume list surfaces now support server-side pagination through the repository layer instead of always loading full result sets first.

Current paged surfaces:

- public `/ai-regulation`
- public `/news`
- admin `/admin/ai-regulation`
- admin `/admin/ai-regulation/news`
- admin `/admin/ai-regulation/data-quality`

Implementation notes:

- repository pagination contracts now support `limit` and `offset`
- memory and Supabase repositories both expose paged list methods for monitor items, news items, scan jobs, and data-quality findings
- page navigation preserves active filters through URL query params
- pagination is conservative and cursor-free for now, but already removes the need for unbounded list reads on the main review/public pages

The automated test suite now also covers:

- pagination helper behavior
- paged memory-repository listings
- stewardship sync persistence
- recurring verification with corroboration checks

## United States legal baseline architecture

The United States hub now includes a conservative U.S. AI-law baseline layer. The goal is to establish a reliable source-backed foundation for federal and state AI-law monitoring without pretending that the platform has exhaustive coverage.

Baseline files:

- `src/content/ai-regulation/us-ai-legal-baseline.ts`
- `src/content/ai-regulation/us-state-ai-law-baseline.ts`
- `src/content/ai-regulation/us-ai-case-law.ts`
- `src/content/ai-regulation/us-ai-soft-law.ts`
- `src/content/ai-regulation/us-map.ts`

The U.S. baseline distinguishes:

- federal rulemaking and Federal Register monitoring
- federal legislative activity and Congress.gov posture
- federal agency guidance, enforcement, and policy sources
- state-by-state AI-law status
- U.S. case-law source architecture
- soft law, standards, and governance frameworks
- secondary/media/discovery sources, which remain non-authoritative

### Federal source methodology

Federal baseline entries store:

- title and short title
- source institution
- official source URL
- authority type
- binding / non-binding / needs-review status
- legal area
- source health
- expected document types
- source references
- citation quality
- last verified date

Verified or evaluated federal sources currently include:

- Federal Register AI query
- NIST AI RMF
- NIST Trustworthy and Responsible AI Resource Center
- EEOC AI and ADA materials
- CFPB AI materials
- U.S. Copyright Office AI materials
- USPTO AI materials
- SEC AI page
- Congress.gov AI legislation search posture

Blocked or unstable sources are not treated as healthy. For example, the current Congress.gov search URL returned `403` from the runtime and remains inactive/manual-review until an official accessible method is configured.

### State-by-state methodology

All 50 states plus the District of Columbia are represented in the U.S. state baseline.

The first priority state pass covers:

- California
- Colorado
- New York
- Illinois
- Texas
- Connecticut
- Utah
- Virginia
- Washington
- Maryland

Each state profile supports:

- AI-law status
- confidence level
- enacted AI statutes
- pending AI bills
- state government-use rules
- private-sector rules
- employment AI rules
- biometric rules
- deepfake / synthetic-media rules
- consumer-protection activity
- privacy / automated-decision-making rules
- state AG, privacy-agency, labor, and civil-rights activity
- official legislature, governor, AG, court, and agency URLs
- source references
- citation quality
- missing-source warnings

If a state has not received sufficient official-source review, it remains `needs_review`. This is intentional. Absence of a verified source in the platform does not mean absence of state law, bills, enforcement, or litigation.

### U.S. map methodology

The U.S. map consumes the state baseline data.

State status taxonomy:

- `enacted_comprehensive_ai_law`
- `enacted_sector_specific_ai_law`
- `pending_ai_legislation`
- `agency_guidance_or_enforcement`
- `ai_related_privacy_or_automated_decision_rules`
- `no_specific_ai_law_verified`
- `needs_review`

Do not mark a state as enacted unless an official state source supports the claim. Discovery trackers can generate leads, but official state sources control publication eligibility.

Current U.S. map components:

- `src/components/site/us-implementation-map.tsx`
- `src/components/site/us-map-legend.tsx`
- `src/components/site/us-state-panel.tsx`

Color-code methodology:

- strongest green tones are reserved for officially verified enacted comprehensive or sector-specific AI laws
- blue/cyan tones identify pending official legislation or agency activity
- indigo identifies AI-related privacy, automated-decision, profiling, biometric, or similar rules when supported by an official source
- amber identifies official sources where no specific AI law has yet been verified
- neutral gray identifies `needs_review`

The map intentionally shows incomplete data instead of hiding it. Hover/focus updates the state panel with state name, status label, confidence level, last reviewed date, source count, and official source reference where available. Clicking through opens the state detail page.

### U.S. case-law methodology

The U.S. case-law layer currently prepares source architecture rather than inventing cases.

Prepared sources include:

- Supreme Court official opinions page
- CourtListener / RECAP as a non-official secondary reference only

CourtListener returned `403` from the runtime and is not treated as an official authority. Specific case facts, holdings, procedural posture, docket numbers, and citations must be verified from official court records or other permissible reliable legal databases before publication.

### U.S. soft law and standards methodology

The U.S. soft-law baseline includes:

- NIST AI RMF
- NIST AI Resource Center
- EEOC AI and ADA resources
- CFPB AI materials
- OWASP AI Maturity Assessment
- ISO/IEC 42001 official metadata

Soft law, agency guidance, standards, and best-practice materials are classified separately from binding law. They are not presented as binding unless a legal source clearly incorporates them.

### U.S. recurring update strategy

Active U.S. sources should be rechecked through the scheduled scan path. Candidate and manual-review sources should not be activated until runtime accessibility, parser posture, source reliability, and citation mapping are verified.

For U.S. legal items, publication remains blocked unless:

- at least one official or authoritative source is verified
- precise citation fields are present
- the item has passed human review
- the item has `published` status

### U.S. baseline limitations

The U.S. baseline is intentionally incomplete.

Known limitations:

- no exhaustive state-by-state legal survey has been completed
- most state statutes, pending bills, agency guidance, and case law still require item-level official-source review
- case-law entries remain empty until specific cases are verified
- Congress.gov runtime access is currently blocked for the tested search URL
- some federal and state sources need dedicated parsers before recurring activation

Accuracy and traceability remain more important than volume.

## Official source accessibility policy

Every monitored source should be:

- official
- public
- reachable from the scan runtime
- stable enough for repeated monitoring
- transparent about whether a dedicated parser is required

The source verification registry currently lives in:

- `src/content/ai-regulation/source-verification.ts`

For each monitored source, the registry documents:

- the source URL
- the runtime accessibility result
- the most recent response status used for this verification layer
- whether the source is official
- whether the source is public
- whether the source is stable enough for monitoring
- whether a dedicated parser is required
- whether the source should remain active or inactive

Important policy:

- inaccessible official sources are not treated as healthy
- blocked sources should remain inactive until access is restored
- unstable official endpoints should be flagged accurately rather than treated as reliable
- unofficial mirrors should not be used as substitutes for official inaccessible sources

## Source hierarchy and cross-verification methodology

The monitor uses a source hierarchy. The hierarchy is intentionally conservative because official sources control legal authority.

Source tiers:

- official primary sources, including EUR-Lex, Federal Register, official government pages, and official legal texts
- official court or legislative databases, including CURIA/InfoCuria, HUDOC, Congress.gov, national parliaments, and official court databases
- official regulator or agency sources, including the EU AI Office, European Commission, EDPB, EDPS, CNIL, FTC, EEOC, CFPB, SEC, NIST, and state regulators
- standards bodies and governance frameworks, including NIST AI RMF, OWASP AIMA, ISO official metadata, OECD, Council of Europe, GPAI Code of Practice, and CEN/CENELEC where official and accessible
- reputable secondary trackers and policy resources, including NCSL, IAPP trackers, MultiState, White & Case, BCLP, Steptoe, Orrick, American Action Forum, and similar resources
- informal discovery sources, including AI Weekly and Global Policy Watch category pages
- media or specialist press discovery references, including Bloomberg Law, Law360, MLex, Reuters, Politico, Euractiv, Tech Policy Press, and other legal/regulatory/business/technology press

Only official or authoritative primary sources can support a published legal intelligence item. Soft law and standards can support publication only when they are accurately labeled as soft law, technical standards, governance frameworks, policy frameworks, best practices, or similar non-binding materials unless an official legal source incorporates them.

Secondary, informal, and media sources are used only for discovery, alerting, cross-checking, or lead generation. They cannot support publication alone.

If a development is first detected through a non-official source, the reviewer must:

- keep the item private as `discovery_only` or `needs_verification`
- identify the claimed legal development
- verify it against at least one official source whenever available
- preferably corroborate it with at least one additional reliable source
- avoid treating blogs, newsletters, Reddit, LinkedIn, media articles, or law firm summaries as legal authority
- publish only after official-source verification, human review, and manual admin publication

Verification status taxonomy:

- `discovery_only`
- `needs_official_source`
- `official_source_found`
- `corroborated`
- `verified_for_review`
- `rejected`
- `published`

For every detected development, the system records verification metadata in `raw_metadata.verification`, including:

- initial detection source
- whether the initial source was official
- source URL
- detected date
- last verified date
- verification status
- official source found: yes/no
- official source URL where available
- corroborating source count and URLs
- confidence level
- reviewer notes
- public visibility allowed: yes/no
- next suggested verification source
- reason the item is not publishable yet

Recurring verification:

- scheduled scans continue to scan all active sources
- discovery/media sources remain lower-priority lead generators
- scheduled scans also revisit unresolved discovery leads
- verification attempts are logged through `ai_processing_logs` with `promptVersion=cross-source-verification.v1`
- unresolved leads remain private and can become stale if official confirmation is not found
- no recurring verification path auto-publishes content

The source strategy registry lives in:

- `src/content/ai-regulation/source-discovery-registry.ts`

This registry includes active official sources, future candidate official sources, secondary trackers, informal discovery sources, and media/specialist press references. Candidate and media sources are not automatically active scan sources unless they have been separately verified for runtime accessibility, stability, robots/terms posture, and parser safety.

Media and specialist press handling:

- do not scrape paywalled content
- do not bypass paywalls or restrictive terms
- do not reproduce article text
- store only public metadata when appropriate, such as headline, source name, public URL, detected date, possible jurisdiction/topic, and official links if visible
- show the admin warning: `Media discovery lead - not legal authority. Requires official verification.`

## Precise citation policy

Every public legal intelligence item must be traceable to a precise source trail. The platform should never display a legal claim publicly without a verifiable source reference.

Citation references are stored in structured metadata:

- `raw_metadata.sourceReferences`

Each source reference can include:

- `sourceRole`: `primary`, `supporting`, `discovery`, or `official_confirmation`
- source title
- source institution or publisher
- source type: official, court, regulator, standards body, discovery source, media source, or tracker
- source URL and canonical URL where available
- publication date
- detected date
- retrieved date
- last verified date
- jurisdiction
- document type
- authority type
- excerpt when legally and technically appropriate
- pinpoint references such as article, recital, section, paragraph, page, or annex when actually detected
- reliability level
- verification status
- archived URL where available
- notes on access limitations

Citation quality statuses:

- `complete`
- `partial`
- `missing_official_source`
- `vague_source`
- `needs_manual_verification`

Publication eligibility requires at minimum:

- one official or authoritative source URL
- source title
- source institution
- publication or retrieval date
- authority type
- last verified date

If a source is non-official, media, tracker, newsletter, blog, or discovery-only, the item must remain private until an official source is attached and reviewed.

Public citation display:

- public detail pages include an `Official sources` section
- citations show institution, document title, publication date, official URL, authority type, last verified date, and pinpoint fields where available
- vague labels such as only `European Commission` or `CNIL` are not sufficient for citation quality

Admin citation workflow:

- admin detail pages show citation quality, publication eligibility, missing-citation warnings, primary/supporting/discovery source references, last verified date, and access notes
- publication is blocked when precise official citation requirements are not met

No hallucinated citations:

- OpenAI prompts must require the model to rely only on provided source text and metadata
- OpenAI must not invent article numbers, recital numbers, paragraph numbers, dates, institutions, or URLs
- if a citation field is not present, it must be left blank or treated as not detected
- citation precision is more important than volume

## Secondary discovery-source policy

The system may also use a **secondary discovery source** when that source is clearly
treated as non-authoritative and non-publishable.

Current discovery-source evaluation:

- `AI Weekly / AI News Today`
- URL: `https://aiweekly.co/ai-news-today`
- runtime accessibility check: `200`
- public page: yes
- official legal source: no
- authority level: non-official
- publication allowed: no
- requires official-source confirmation: yes
- requires cross-source verification: yes

- `Global Policy Watch EU`
- URL: `https://www.globalpolicywatch.com/category/european-union/`
- runtime accessibility check: `200`
- robots posture: crawl allowed with `Crawl-delay: 30`
- public page: yes
- official legal source: no
- authority level: non-official
- publication allowed: no
- requires official-source confirmation: yes
- requires cross-source verification: yes

- `Global Policy Watch AI`
- URL: `https://www.globalpolicywatch.com/category/artificial-intelligence/`
- runtime accessibility check: `200`
- robots posture: crawl allowed with `Crawl-delay: 30`
- public page: yes
- official legal source: no
- authority level: non-official
- publication allowed: no
- requires official-source confirmation: yes
- requires cross-source verification: yes

Important rules:

- discovery sources are not legal authority
- discovery sources cannot be published directly as legal updates
- discovery leads must remain private and `needs_review`
- reviewers must identify and verify an official source before a development is treated as established
- reviewers should look for at least one additional reliable corroborating source where appropriate before converting a lead
- in practice, verified publication should come from an official-source-backed item or workflow, not from the discovery lead itself

The current discovery-source policy is implemented through source configuration and admin diagnostics rather than by relaxing the official-source-first monitor architecture.

### Discovery-source posture

`AI Weekly / AI News Today` and the Global Policy Watch category pages are used only to generate leads such as:

- possible EU AI Act developments
- possible EU AI Office updates
- possible Member State implementation signals
- possible enforcement activity
- possible case-law signals
- possible soft-law and standards developments

If a lead is captured from an informal discovery source, the system stores:

- headline
- discovery source name
- discovery source URL
- outbound URL
- detected date
- possible jurisdiction
- possible topic
- possible legal area
- possible authority type
- possible official source found: yes/no
- corroborating source found: yes/no
- verification status
- conversion status
- reviewer notes

The admin UI marks these as:

- `Non-official discovery lead - requires verification`

and the workflow blocks direct approval/publication from this source.

### U.S. LOCUS local-law discovery corpus

LOCUS-v1 may be registered as an optional external research corpus for U.S. local AI-law discovery only.

- corpus: `LOCUS-v1`
- URL: `https://huggingface.co/datasets/davidyinyan/LOCUS-v1`
- scope: U.S. city/county/local ordinance discovery
- authority level: research corpus, non-official
- publication allowed: no
- verified legal authority: no
- full dataset import into the legal database: no

LOCUS can be used to surface possible local-law leads involving:

- facial recognition
- automated decision systems
- algorithmic decision-making
- AI procurement
- predictive policing
- surveillance technology
- biometric systems
- automated license plate readers
- autonomous delivery robots
- smart city systems
- tenant screening algorithms
- employment screening algorithms
- AI-infrastructure data centers

LOCUS-derived hits must be stored only as admin-only discovery leads. A LOCUS lead must include corpus source, city/county, state, text excerpt, topic, confidence score, detected terms, LOCUS metadata, any candidate official municipal-code URL, verification status, citation quality, `requiresOfficialSource=true`, and `publicVisibilityAllowed=false`.

LOCUS-derived leads must not be converted into verified legal database items unless an official municipal/county ordinance source is found, accessible, and verified against the LOCUS text; jurisdiction, date, citation, and pinpoint are verified; the provision is classified as AI-related; and admin review remains possible. LOCUS alone is never sufficient legal authority.

As of the latest verification pass from the scan runtime:

- `src-council-europe-ai` remains inactive because the official endpoint returned `403`
- `src-ftc-ai-press` is currently marked inactive because the official feed returned `403`
- `src-sec-ai` is currently marked inactive because the official endpoint returned `403`
- `src-eur-lex-ai` is currently marked inactive because the official search endpoint remains unstable for automated monitoring despite being publicly reachable
- `src-ai-weekly-news-today` is publicly reachable with `200`, but is intentionally classified as a non-official discovery source only
- `src-global-policy-watch-eu` is publicly reachable with `200`, but is intentionally classified as a non-official discovery source only
- `src-global-policy-watch-ai` is publicly reachable with `200`, but is intentionally classified as a non-official discovery source only

## Continuous monitoring architecture

The monitoring system is designed for recurring legal intelligence, not one-time data import.

Active sources are expected to be rechecked automatically through the daily Vercel Cron path:

- cron route: `/api/cron/ai-regulation-scan`
- scheduled trigger: `scheduled`
- local scheduled simulation: `npm run scan:scheduled-test`

The scheduled scan runs the same guarded pipeline as the manual scan. When no specific `sourceId` is provided, the pipeline loads all active sources and skips inactive sources.

For each active source, the system preserves operational evidence through:

- `active` / inactive status on `regulation_sources`
- `last_scanned_at` on the source record
- latest successful scan derived from `regulation_scan_logs`
- latest response status in scan diagnostics
- items fetched
- new items detected
- duplicates detected
- parser warnings
- accessibility issues
- source reliability notes

Daily scan behavior:

- scan all active sources
- skip inactive sources
- detect new official items
- ignore duplicates through stable hashing
- persist new raw items and draft updates to Supabase
- mark new updates as `needs_review`
- never auto-publish
- keep OpenAI disabled unless explicitly enabled
- preserve scan logs and admin diagnostics

Unstable or inaccessible official sources should stay in the source registry. They should be documented, marked inactive or as needing a dedicated parser, and revisited later rather than silently removed.

Non-official discovery sources follow the same recurring monitoring idea, but with stricter publication limits. Their leads are marked `discovery_only` / `requires_official_verification`, require official-source confirmation and cross-source verification where appropriate, and cannot be approved or published directly.

## Europe timeline and map methodology

The Europe hub includes:

- an EU AI timeline based only on verified official sources
- a Member State implementation map that is intentionally conservative

Timeline source data currently lives in:

- `src/content/ai-regulation/eu-timeline.ts`

Map data currently lives in:

- `src/content/ai-regulation/europe-map.ts`

Methodology:

- no EU milestone is included unless it has a verified official source URL
- no Member State implementation status is asserted without official verification
- where the official position is still unclear, the UI should say:
  - `needs review`
  - `implementation not yet verified`
  - `no official source verified yet`

No-hallucination rule:

- do not invent Member State implementation
- do not invent competent authorities
- do not invent cases
- do not invent dates
- do not invent adoption status
- do not invent official source URLs

## Europe Member State coverage methodology

Europe country profiles now live in:

- `src/content/ai-regulation/europe-country-profiles.ts`

This phase introduces a first verified country-profile wave for:

- France
- Germany
- Spain
- Italy
- Netherlands

The goal is not to claim complete Europe-wide implementation coverage yet.
The goal is to build a reliable architecture that can be expanded country by country.

### Country profile structure

Each country profile can store:

- country metadata
- implementation status
- implementation confidence
- implementation notes
- competent authority placeholders
- data protection authority
- government / regulator / legislative / court source lists
- case-law source posture
- soft-law source posture
- latest relevant updates
- official source URLs
- source verification status
- editorial notes
- a concise public summary

Important rule:

- if a field cannot be verified from an official accessible source, it should remain empty, null, or clearly marked as needing verification

### Implementation status taxonomy

The current taxonomy includes:

- `eu_framework_applies`
- `national_implementation_identified`
- `implementation_in_progress`
- `competent_authority_designated`
- `consultation_or_draft_identified`
- `no_specific_national_implementation_verified`
- `needs_review`
- `not_applicable`

This taxonomy is intentionally conservative.

Examples:

- `consultation_or_draft_identified` should only be used where an official source confirms a draft or consultation step
- `competent_authority_designated` should only be used where an official source clearly verifies the designation
- `needs_review` should be used whenever the implementation posture is still too uncertain for a stronger public label

### Current first-wave profile posture

Current first-wave outcomes are intentionally cautious:

- France: a substantially stronger official-source baseline now supports `competent_authority_designated` for at least one AI Act-related French authority role, while the complete French authority map and direct designation instruments still remain under review
- Germany: verified official AI-relevant sources, but implementation and authority posture still needs review
- Spain: a materially stronger official-source baseline now supports `implementation_in_progress`, with AEPD competence and guidance material, AESIA legal basis and leadership milestones, and the 26 May 2026 draft-law signal, while the final authority map, enacted-text posture, and broader Spanish decision layer still remain under review
- Italy: verified official AI-relevant governance sources, but no specific national implementation measure verified in this phase
- Netherlands: official consultation/draft signal verified through a Dutch government source, but final authority designation still remains unverified

### Europe map methodology

The Europe map now derives country status from the country-profile layer.

This means:

- color reflects the implementation taxonomy
- confidence is tied to the country profile
- last reviewed date can be shown
- first-wave countries link to country detail pages
- non-profiled Member States remain visible with conservative placeholders rather than guessed implementation claims

### Country source accessibility policy

For each country-level source used in a profile, the project now tracks:

- source URL
- institution
- official/public status
- runtime accessibility when checked
- response status when checked
- last checked date
- parser status
- active/inactive/manual-review recommendation
- short note

If a country-level official source is inaccessible, blocked, or unstable:

- it should not be treated as an active monitored source
- it may still be documented as a reference point if clearly labeled for manual review or inactive use

### Case law limitations

This phase does not attempt to scrape or summarize European AI case law comprehensively.

Instead, it provides:

- verified official court/judiciary source placeholders where safely identified
- notes on whether case-law coverage remains incomplete
- a structure that can later support verified case entries

No holdings, facts, or case outcomes should be invented.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase / PostgreSQL
- Vitest

## Data mode

The application now uses an explicit data mode:

- `APP_DATA_MODE=memory`
- `APP_DATA_MODE=supabase`

### Local memory mode

Use `memory` mode for:

- local demos
- UI work
- safe development without a database

Behavior:

- data is loaded from the seed-backed in-memory repository
- changes are not durable
- this mode is acceptable locally

### Supabase mode

Use `supabase` mode for:

- real persistence
- production deployments
- actual review and publication workflows

Behavior:

- the app reads and writes through the Supabase repository
- scan results persist to the database
- public pages read published items from the database

### Production safety

Memory mode must not be used silently in production.

Rules:

- if `NODE_ENV=production` and `APP_DATA_MODE` is missing, the app fails with a clear error
- if `APP_DATA_MODE=supabase` and required Supabase variables are missing, the app fails with a clear error
- if `APP_DATA_MODE=memory` in production, it is blocked unless `ALLOW_MEMORY_MODE_IN_PRODUCTION=true`

This is intentional. Production should not silently fall back to demo storage.

## Required environment variables

Copy `.env.example` to `.env.local` and fill in values as needed.

Core:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
APP_DATA_MODE=memory
ALLOW_MEMORY_MODE_IN_PRODUCTION=false
ADMIN_AUTH_SECRET=replace-with-a-long-random-secret-at-least-24-characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
CRON_SECRET=replace-with-a-separate-random-secret-for-scheduled-scans
```

Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
```

OpenAI:

```bash
AI_ENABLE_PROCESSING=false
# Optional backward-compatible alias:
AI_PROCESSING_ENABLED=false
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
AI_MONTHLY_BUDGET_USD=20
AI_MAX_INPUT_TOKENS_PER_ITEM=12000
AI_MAX_ITEMS_PER_SCAN=10
AI_MODEL_RELEVANCE=gpt-5.4-nano
AI_MODEL_CLASSIFICATION=gpt-5.4-nano
AI_MODEL_SUMMARY=gpt-5.4-mini
AI_MODEL_DEEP_ANALYSIS=gpt-5.4
AI_COST_GUARDRAILS_ENABLED=true
```

Validation behavior:

- `ADMIN_AUTH_SECRET` is required
- `APP_DATA_MODE=supabase` requires the Supabase URL, anon key, and service role key
- `AI_PROCESSING_ENABLED=true` is also accepted as a backward-compatible alias
- AI processing remains disabled by default even when ranking and cost planning are active
- if `AI_ENABLE_PROCESSING=true` but `OPENAI_API_KEY` is missing, the planner skips live AI safely and records the reason in `ai_processing_logs`

## AI processing guardrails

Live OpenAI processing is still disabled by default in this project.

Phase 6A adds a ranking and cost-control layer so the system can safely decide which items would be worth AI processing later, without sending anything to OpenAI now.

### What happens now

- the scan still creates raw items and heuristic draft updates
- every relevant non-duplicate item is ranked before any hypothetical AI call
- the system estimates token usage and cost for future AI relevance, classification, summary, and deep-analysis steps
- items are marked internally as:
  - `pending_ai_processing`
  - `skipped_due_to_budget`
  - `skipped_due_to_token_limit`
  - `skipped_due_to_missing_api_key`
  - `skipped_due_to_scan_limit`
- these AI planning decisions are logged in `ai_processing_logs`
- the admin page shows:
  - whether AI is enabled
  - the monthly budget
  - estimated monthly spend
  - top-ranked pending items
  - skipped items and reasons

### Ranking logic

The pre-AI ranking layer favors:

- high-reliability official sources
- high-priority jurisdictions
- statutes, regulations, final rules, proposed rules, guidance, enforcement, standards, and major soft law
- AI-specific legal keywords
- recent items
- items with publication dates
- new unique items instead of duplicates

Lower priority is assigned to:

- generic announcements
- broad policy pages with little new legal content
- stale items
- items that are already duplicated or already processed

### Cost controls

The AI planner enforces:

- `AI_MAX_INPUT_TOKENS_PER_ITEM`
- `AI_MAX_ITEMS_PER_SCAN`
- `AI_MONTHLY_BUDGET_USD`
- `OPENAI_API_KEY` presence when live AI is enabled

This is intentional. Not every official item should be sent to OpenAI, especially when the legal value is low or the source is duplicate-heavy.

### Safe future enablement

To enable live AI later, do all of the following deliberately:

1. set `AI_ENABLE_PROCESSING=true`
2. provide `OPENAI_API_KEY`
3. review budget and per-scan caps
4. review the admin AI planning section
5. confirm the high-priority pending items match your legal-review expectations

This should be done only after cost-control validation and human review of source quality.

### Dry-run mode

Dry-run mode is already available without an extra flag:

- leave `AI_ENABLE_PROCESSING=false`
- run `npm run scan:sample`

In this mode:

- no OpenAI API calls are made
- ranking still runs
- token and cost estimation still run
- planner outcomes are still logged
- admin diagnostics still show pending or skipped AI candidates when new relevant items appear

## Supabase setup

### 1. Create the Supabase project

1. Create a new Supabase project.
2. Copy the project URL.
3. Copy the anon key.
4. Copy the service role key.

### 2. Run the SQL migration

Run:

- [001_ai_regulation_monitor.sql](/C:/Users/coren/OneDrive/Documents/CSG%20Law/c-saint-girons-ai-law-intelligence/src/db/migrations/001_ai_regulation_monitor.sql)
- [002_supabase_access_policies.sql](/C:/Users/coren/OneDrive/Documents/CSG%20Law/c-saint-girons-ai-law-intelligence/src/db/migrations/002_supabase_access_policies.sql)
- [003_foundation_hardening.sql](/C:/Users/coren/OneDrive/Documents/CSG%20Law/c-saint-girons-ai-law-intelligence/src/db/migrations/003_foundation_hardening.sql)
- [004_operational_jobs_and_news.sql](/C:/Users/coren/OneDrive/Documents/CSG%20Law/c-saint-girons-ai-law-intelligence/src/db/migrations/004_operational_jobs_and_news.sql)

Important schema notes:

- IDs are stored as text consistently across the app and database
- the schema now includes workflow and enum-like check constraints
- indexes are included for common monitor queries
- `002_supabase_access_policies.sql` adds the required grants for `service_role`
- `002_supabase_access_policies.sql` also enables public read access for `published` updates only via RLS
- `003_foundation_hardening.sql` adds normalized `source_references`, `verification_attempts`, `review_events`, and `data_quality_findings`
- `004_operational_jobs_and_news.sql` adds `scan_jobs`, `news_items`, `source_health_checks`, expanded source types, and richer source-health fields on `regulation_sources`

### 3. Seed the database

After the migration is applied and environment variables are configured, run:

```bash
npm run seed:supabase
```

The seed script:

- uses upserts so it is safe to run multiple times
- defaults to the `production_safe` seed profile
- keeps seeded legal items private as `needs_review`
- logs the tables and row counts it upserts
- fails clearly if Supabase configuration is incomplete
- loads `.env.local`, `.env`, and the standard local env chain automatically for standalone `tsx` execution
- prints Supabase error message, details, hint, and code without exposing secrets

For a controlled local/demo dataset that preserves showcase `published` states, run:

```bash
npm run seed:supabase:demo
```

Do not use the demo seed profile for production or legal-review environments.

## Admin protection

Admin routes:

- `/admin/ai-regulation`
- `/admin/ai-regulation/[id]`

Current MVP hardening:

- `/admin/*` is protected at the proxy layer
- valid Basic Auth credentials create a signed, HTTP-only admin session cookie
- server actions verify the signed admin session before mutating data
- the scan API verifies admin authorization before running
- admin secrets are never exposed to the frontend

This is still intentionally lightweight, but it is stronger than a placeholder-only gate.

## Public visibility rules

Public routes:

- `/ai-regulation`
- `/ai-regulation/[id]`

Public behavior:

- only `published` items are visible publicly
- `needs_review` items are never visible publicly
- `approved` but unpublished items are never visible publicly
- `rejected` items are never visible publicly
- `archived` items are never visible publicly

## Review workflow

Allowed transitions:

- `needs_review -> approved`
- `needs_review -> rejected`
- `needs_review -> archived`
- `approved -> published`
- `approved -> archived`
- `published -> archived`
- `rejected -> archived`

Not allowed:

- `needs_review -> published`
- `rejected -> published`
- `archived -> published`

## Running locally

Install dependencies:

```bash
npm install
```

Start development:

```bash
npm run dev:stable
```

Open:

- home: `http://127.0.0.1:3001`
- public monitor: `http://127.0.0.1:3001/ai-regulation`
- admin review: `http://127.0.0.1:3001/admin/ai-regulation`

If local previews look stale or routes seem inconsistent, run:

```bash
npm run dev:doctor
```

This checks the common local Next.js ports and helps detect stale background servers before you relaunch `npm run dev:stable`.

## Triggering a sample scan

Run:

```bash
npm run scan:sample
```

The scan command now logs:

- which data mode is active
- whether AI processing is enabled
- whether results are going to memory or Supabase
- per-source totals for found, new, duplicates, and errors
- per-source AI pending/skipped counts and estimated AI cost

When `APP_DATA_MODE=supabase`, the sample scan persists:

- scan logs
- raw regulatory items
- AI regulatory updates
- AI processing logs
- source `last_scanned_at`

When `AI_ENABLE_PROCESSING=false`, the scan acts as a planning dry run only.
When `AI_ENABLE_PROCESSING=true`, only planner-approved items inside the existing budget and token guardrails may call OpenAI.

## Scheduled daily scans

The project is now prepared for a safe automatic daily scan using:

- Vercel Cron
- a dedicated protected route: `/api/cron/ai-regulation-scan`
- a separate secret: `CRON_SECRET`
- persisted `scan_jobs`

### Chosen scheduler approach

This project uses the Vercel-style approach because it fits the existing Next.js App Router architecture cleanly:

- the cron job calls a route handler
- the route handler queues and runs a persisted scan job
- results are persisted through the same Supabase-backed repository path
- no publication behavior changes

### Cron route security

The scheduled route expects:

```http
Authorization: Bearer <CRON_SECRET>
```

Security behavior:

- missing or invalid bearer token returns `401`
- missing `CRON_SECRET` returns a safe misconfiguration response
- the route does not expose secrets
- the route does not auto-publish anything

### Vercel cron configuration

The project now includes:

- `vercel.json`

Current schedule:

```json
{
  "path": "/api/cron/ai-regulation-scan",
  "schedule": "0 12 * * *"
}
```

This is `12:00 UTC` daily, which is roughly:

- `8:00 AM` in New York during EDT

Because Vercel cron is configured in UTC and timing precision can vary by plan, treat this as a daily morning run rather than a second-perfect guarantee.

### Local scheduled-scan testing

Keep:

```bash
npm run scan:sample
```

For a local scheduled-scan simulation, run:

```bash
npm run scan:scheduled-test
```

This uses the existing scan pipeline with a `scheduled_local_test` trigger and does not require Vercel.

### How to verify scheduled scans

After deployment:

1. Configure `CRON_SECRET` in Vercel.
2. Deploy with `vercel.json`.
3. Confirm the cron route exists at:
   - `/api/cron/ai-regulation-scan`
4. Inspect:
   - `regulation_scan_logs`
   - `scan_jobs`
   - `source_health_checks`
   - source `last_scanned_at`
   - admin diagnostics
5. Look for diagnostic markers such as:
   - `scan_trigger=scheduled`

### Important AI safety note

Scheduled scans do not override AI safety.

- `AI_ENABLE_PROCESSING=false` remains the default
- scheduled scans do not enable OpenAI automatically
- if AI is enabled intentionally later, all existing budget and token guardrails still apply

## How to verify Supabase persistence

With your own Supabase credentials:

1. Set `APP_DATA_MODE=supabase`
2. Configure Supabase env vars
3. Run the migration
4. Run `npm run seed:supabase`
5. Run `npm run scan:sample`
6. Check the Supabase tables:
   - `regulation_sources`
   - `raw_regulatory_items`
   - `ai_regulatory_updates`
   - `regulation_scan_logs`
   - `ai_processing_logs`

Live Supabase credentials were present during local verification of the script loading path, and the app successfully reached the real Supabase project.
The remaining live blocker was a database permission error on existing tables, which indicates the grants/policies patch still needs to be applied in that Supabase project.
If your Supabase project was created before the latest grants/policies patch, apply
[002_supabase_access_policies.sql](/C:/Users/coren/OneDrive/Documents/CSG%20Law/c-saint-girons-ai-law-intelligence/src/db/migrations/002_supabase_access_policies.sql)
before running the seed or sample scan.

## Live Supabase Verification

Use these exact steps locally with your own Supabase credentials.

### 1. Configure environment variables

Set:

```bash
APP_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_AUTH_SECRET=replace-with-a-long-random-secret
AI_ENABLE_PROCESSING=false
```

### 2. Apply the migration

Apply:

```bash
src/db/migrations/001_ai_regulation_monitor.sql
src/db/migrations/002_supabase_access_policies.sql
```

If the project already existed before the latest hardening pass, re-run
`002_supabase_access_policies.sql` in the Supabase SQL editor before seeding.

### 3. Seed Supabase

Run:

```bash
npm run seed:supabase
```

Expected result:

- the script logs each table it upserts
- rerunning the script should not create uncontrolled duplicates
- if you see `permission denied for table ...`, apply `src/db/migrations/002_supabase_access_policies.sql` and rerun

### 4. Run the sample scan in Supabase mode

Run:

```bash
npm run scan:sample
```

Expected result:

- the command logs `APP_DATA_MODE=supabase`
- the target logs the Supabase project URL
- raw items, updates, scan logs, processing logs, and source timestamps are persisted
- if you see `permission denied for table regulation_sources`, the database grants patch has not been applied yet

### 5. Start the app locally

Run:

```bash
npm run dev
```

### 6. Verify public visibility

1. Open `/ai-regulation`
2. Confirm only `published` items appear
3. Confirm `needs_review`, `approved`, `rejected`, and `archived` items do not appear publicly

### 7. Verify admin review workflow

1. Open `/admin/ai-regulation`
2. Confirm all statuses are visible
3. Edit an item
4. Approve a `needs_review` item
5. Publish an `approved` item
6. Archive a `published` or `rejected` item
7. Confirm the public monitor only changes when an item reaches `published`

## How to verify public visibility

To confirm public pages only show published items:

1. Open the admin review page
2. Confirm some items are `needs_review`, `approved`, `rejected`, or `archived`
3. Open `/ai-regulation`
4. Verify only `published` items appear
5. Publish an approved item
6. Refresh `/ai-regulation`
7. Confirm the newly published item appears publicly

## How to verify admin review works

1. Open `/admin/ai-regulation`
2. Review a `needs_review` item
3. Approve it
4. Publish it
5. Archive it if needed
6. Confirm invalid transitions are not allowed

## Before Deploying to Vercel

1. Create the Supabase project
2. Run the SQL migration
3. Run `npm run seed:supabase`
4. Set Vercel environment variables
5. Set `APP_DATA_MODE=supabase`
6. Set `ADMIN_AUTH_SECRET`
7. Set `OPENAI_API_KEY` if AI processing is enabled
8. Run a local build
9. Test admin access
10. Trigger the sample scan
11. Review an item
12. Publish an item
13. Verify public visibility

## Production deployment on Vercel

Use the first production deployment in a conservative configuration:

- `APP_DATA_MODE=supabase`
- `AI_ENABLE_PROCESSING=false`
- Vercel Cron enabled
- Supabase grants/policies applied
- admin access tested manually before public launch

### Required production environment variables

Set these in the Vercel project environment:

```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.example

APP_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

ADMIN_AUTH_SECRET=replace-with-a-long-random-secret-at-least-24-characters
CRON_SECRET=replace-with-a-separate-random-secret-for-scheduled-scans

AI_ENABLE_PROCESSING=false
```

Optional future AI variables:

```bash
OPENAI_API_KEY=
AI_COST_GUARDRAILS_ENABLED=true
AI_MAX_ITEMS_PER_SCAN=10
AI_MONTHLY_BUDGET_USD=20
AI_MAX_INPUT_TOKENS_PER_ITEM=12000
AI_MODEL_RELEVANCE=gpt-5.4-nano
AI_MODEL_CLASSIFICATION=gpt-5.4-nano
AI_MODEL_SUMMARY=gpt-5.4-mini
AI_MODEL_DEEP_ANALYSIS=gpt-5.4
```

Important production rules:

- do not commit `.env.local`
- do not put real secrets in `.env.example`
- keep `SUPABASE_SERVICE_ROLE_KEY` server-side only
- keep `CRON_SECRET` private and separate from `ADMIN_AUTH_SECRET`
- leave `AI_ENABLE_PROCESSING=false` for the first production deployment

### Safe deployment checklist

Before promoting the app to production, confirm all of the following:

1. `npm run test` passes
2. `npm run lint` passes
3. `npm run typecheck` passes
4. `npm run build` passes
5. `npm run seed:supabase` succeeds against the real Supabase project
6. `npm run scan:sample` succeeds in Supabase mode
7. `npm run scan:scheduled-test` succeeds locally
8. unpublished AI Regulation items do not appear on `/ai-regulation`
9. `/admin/ai-regulation` rejects unauthenticated access
10. the cron route rejects missing or invalid bearer tokens
11. `AI_ENABLE_PROCESSING` is still `false`

### Scheduled scans in production

`vercel.json` schedules a daily call to:

- `/api/cron/ai-regulation-scan`

Current cron expression:

- `0 12 * * *`

That is a UTC schedule and should be understood as approximately `8:00 AM` New York time during EDT. Adjust it later if a different operational window is preferred.

Cron security:

- the route requires `Authorization: Bearer <CRON_SECRET>`
- missing or invalid secrets return a safe error response
- the route does not expose secrets
- the route does not auto-publish
- the route does not enable AI by default

### Local production simulation

To simulate the production build locally:

```bash
npm run build
npm run start
```

Then verify:

1. public homepage loads
2. `/ai-regulation` only shows published items
3. `/research`, `/standards`, and `/contact` render correctly
4. `/admin/ai-regulation` requires valid admin auth
5. Supabase-backed items still render correctly

To simulate the scheduled path locally:

```bash
npm run scan:scheduled-test
```

Expected local scheduled-test behavior:

- logs `APP_DATA_MODE=supabase`
- logs `AI_ENABLE_PROCESSING=false` unless explicitly changed
- persists scan results to Supabase
- records scheduled trigger context in scan diagnostics

### Troubleshooting

- If `APP_DATA_MODE=supabase` fails at startup, verify `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- If the cron route returns `401`, check the bearer token and `CRON_SECRET`.
- If the cron route returns a misconfiguration error, confirm `CRON_SECRET` is set in the deployment environment.
- If public pages show nothing unexpectedly, confirm there are actually `published` items in Supabase.
- If admin login fails, verify `ADMIN_AUTH_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`.
- If scheduled scans run but do not create new items, inspect source diagnostics and duplicate counts in admin.

## Validation commands

Run:

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npm run seed:supabase
npm run scan:sample
npm run scan:scheduled-test
```

## Current limitations

- OpenAI processing is still scaffolded and heuristic-heavy in the MVP
- live OpenAI processing is now implemented but remains disabled by default
- production usage should start with a very low cap and explicit budget review
- source-specific extraction still needs more per-jurisdiction tuning
- admin auth is intentionally simple and does not yet include full user management
- a durable background job system is not yet in place

## Known technical debt and improvement roadmap (reviewed 2026-06-04)

A full codebase review was completed on 2026-06-04. The following is the prioritized improvement plan. Full detail is in `PROJECT_LOGBOOK.md` and `AI_AGENT_MASTER_CONTEXT.md`.

### Phase A — Security and reliability (do first, no migration needed)

- **A1** — `next.config.ts` is empty. Add HTTP security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- **A2** — `isValidAdminCredentials()` uses `===` string comparison. Replace with `timingSafeEqual` for both username and password.
- **A3** — No `error.tsx` boundary pages exist. Add top-level and route-level error boundaries so DB errors don't crash public pages with a raw 500.
- **A4** — In-memory rate limiter (`src/lib/rate-limit.ts`) is stateless across serverless cold starts. Document or replace with Upstash Redis.
- **A5** — `vercel.json` only registers the global scan and France cron. Add Germany, Italy, Spain cron entries for their dedicated routes.

### Phase B — Performance (no migration needed)

- **B1** — `collectOptions()` and `collectDatabaseOptions()` fetch all records then derive filter values in memory. Replace with dedicated `SELECT DISTINCT` repository methods.
- **B2** — Pipeline calls `updateRawItemMetadata` 3–4 times per candidate. Merge into a single batched write per item.
- **B3** — All Supabase list queries use `select("*")`. Use column-specific selects, especially for list views that load large `rawMetadata` JSONB blobs.

### Phase C — Architecture

- **C1** — `pipeline.ts` is an 839-line God function. Decompose `runAiRegulationScan` into single-responsibility stage functions.
- **C2** — Country scan profile routing is hard-coded in `pipeline.ts`. Move to a data-driven `sourceFilter` predicate on each `ScanProfileDefinition` in `scanProfiles.ts`.
- **C3** — `Record<string, unknown>` is used 18+ times in processors for `rawMetadata`/`traceability`. Add a typed `TraceabilityMetadata` interface.
- **C4** — `admin/page.tsx` is 1437 lines. Split into focused sub-components (review queue, source panel, discovery panel, AI panel, coverage panel).

### Phase D — Test coverage and data integrity

- **D1** — `supabase-repository.ts` (1252 lines, the sole production persistence layer) has zero tests. Add integration tests.
- **D2** — `transitionReviewStatus` + `createReviewEvent` are two separate DB calls. Wrap in a Supabase RPC for atomic execution.

### Phase E — Editorial and intelligence expansion

- **E1** — Add an editorial summary band to `/ai-regulation` overview (top developments, what changed, top official signals by region).
- **E2** — Add explicit empty states with "Reset filters" CTAs on all filtered views.
- **E3** — Move `europe-member-state-implementation.ts` (1951 lines) toward database-backed storage to enable updates without redeployment.

### Phase F — Long-horizon (roadmap)

- F1 — Cursor-based pagination
- F2 — Dedicated `discovery_leads` relational table
- F3 — Detached durable worker for scan job execution
- F4 — Deprecate `AI_PROCESSING_ENABLED` legacy alias
- F5 — Country coverage expansion: Netherlands, Poland, Sweden, Ireland
- F6 — Upstash Redis rate limiting

## Safe Live OpenAI Smoke Test

Standalone scripts now load `.env.local` automatically, so the smoke-test command and the seed/scan commands all read the same local configuration chain without requiring manual PowerShell env export first.

Use a deliberately narrow config for the first manual live test:

```bash
AI_ENABLE_PROCESSING=true
AI_MAX_ITEMS_PER_SCAN=1
AI_MONTHLY_BUDGET_USD=5
AI_MAX_INPUT_TOKENS_PER_ITEM=6000
```

Required variables for this smoke test:

- `AI_ENABLE_PROCESSING=true`
- `AI_MAX_ITEMS_PER_SCAN=1`
- `AI_MONTHLY_BUDGET_USD=5`
- `AI_MAX_INPUT_TOKENS_PER_ITEM=6000`
- `AI_COST_GUARDRAILS_ENABLED=true`
- `OPENAI_API_KEY`
- `AI_MODEL_RELEVANCE`
- `AI_MODEL_CLASSIFICATION`
- `AI_MODEL_SUMMARY`
- `AI_MODEL_DEEP_ANALYSIS`

Recommended steps:

1. confirm `OPENAI_API_KEY` is set locally
2. keep the scan cap at `1`
3. seed a safe unpublished smoke-test draft:

```bash
npm run seed:ai-smoke-draft
```

4. run:

```bash
npm run scan:sample:ai-test
```

5. inspect the command output for:
   - whether AI is enabled
   - max items per scan
   - estimated cost
   - eligible items
   - processed items
   - skipped items and reasons
   - whether a live OpenAI call was actually made
6. inspect the admin page and `ai_processing_logs`
7. confirm generated content remains `needs_review`
8. confirm nothing is auto-published

Important debugging note:

- if the command output shows `AI enabled=false`, the script will not enter the live fallback processing branch at all
- in that situation, `openAiCallMade` will remain `false` even if the seeded draft exists and is otherwise eligible
- if you need to verify the seeded fallback target itself before spending tokens, run:

```bash
npm run seed:ai-smoke-draft
```

and then confirm the draft exists in admin as:

- `upd-smoke-001`
- `status=needs_review`
- `published_at=null`

Smoke-test behavior:

- it runs the normal guarded sample scan first
- it does not bypass budget, token, or per-scan limits
- if the database is duplicate-heavy and the scan produces no eligible new live-AI item, it can safely fall back to one existing unpublished `needs_review` draft
- `npm run seed:ai-smoke-draft` creates or resets one dedicated internal draft for that fallback path
- it never targets `published` items
- it never publishes anything automatically
- it keeps public visibility rules unchanged
- if the seeded draft falls outside the limited `rawItems` batch window, the fallback now performs a direct targeted fetch for `raw-smoke-001` / `upd-smoke-001` instead of incorrectly concluding that no eligible draft exists

Expected result when the one-item live smoke test succeeds:

- `openAiCallMade=true`
- `processedItems=1`
- estimated cost is logged
- the target draft remains `needs_review`
- the target draft appears in admin review
- the target draft does not appear on `/ai-regulation` until manually approved and published

After a successful smoke test, verify all of the following in admin:

- the draft still has `status=needs_review`
- `published_at` is still `null`
- AI processing metadata shows the model used, estimated cost, confidence level, and prompt/version
- AI-generated fields are visible for review and can be edited before saving

If a smoke test fails with an authentication error such as `401 Incorrect API key provided`:

1. replace `OPENAI_API_KEY` in `.env.local`
2. keep the one-item safety caps in place
3. run `npm run seed:ai-smoke-draft` again so the dedicated draft is cleanly reset
4. rerun `npm run scan:sample:ai-test`

Do not treat the new key as verified until `ai_processing_logs` shows a successful `completed_ai_processing` result for `raw-smoke-001` / `upd-smoke-001`.

Do not enable broad live AI processing without first reviewing:

- monthly budget
- per-item token cap
- per-scan item cap
- current source quality
- admin review workload

## Included UI integration

The requested Spline-related component integration remains in place under:

- `src/components/ui/splite.tsx`
- `src/components/ui/demo.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/spotlight.tsx`
- `src/components/ui/spotlight-hover.tsx`

Notes:

- the Spline dependencies are already installed:
  - `@splinetool/runtime`
  - `@splinetool/react-spline`
  - `framer-motion`
- the Spline scene is used as an optional premium visual layer rather than as a structural dependency
- the site remains readable and usable while the Spline scene loads
- the visual integration is currently concentrated in the homepage hero layer

## Germany country-specific legal intelligence

Germany now has a country-specific monitoring layer broadly mirroring the France, Spain, and Italy architecture, but tuned to Germany's current official-source landscape.

Core files:

- `src/agents/ai-regulation/germanyNewsSources.ts`
- `src/agents/ai-regulation/germanyLegalNewsAgent.ts`
- `src/content/ai-regulation/germany-ai-intelligence.ts`
- `src/app/api/cron/ai-regulation-germany-scan/route.ts`
- `scripts/run-germany-official-legal-scan.ts`
- `scripts/run-germany-legal-news-scan.ts`
- `scripts/run-germany-verification-scan.ts`

Public behavior on `/ai-regulation/europe/germany`:

- Germany-only live legal-intelligence panel
- Germany authority map
- Germany AI legal timeline
- first conservative verified Germany decisions and acts layer
- explicit verification gaps and monitoring notes

Germany official monitoring posture:

- lightweight official live anchors:
  - `BfDI AI unit`
  - `BfDI consultation on personal data in AI models`
- slower official baseline sources:
  - `Federal Government implementation page`
  - `Bundestag implementation materials`
- discovery acceleration only:
  - `src-de-newsapi-ai`
  - `src-de-major-press-newsapi-ai`
  - `src-de-gdelt-ai`

Germany-specific scan profiles:

- `germany_official_legal_scan`
- `germany_live_news_scan`
- `germany_verification_scan`

Germany-specific scripts:

- `npm run scan:germany-official-legal`
- `npm run scan:germany-legal-news`
- `npm run scan:germany-verification`

Important Germany rules:

- Germany discovery/media items remain non-authoritative until official confirmation is present
- official Germany implementation milestones and decisions can automatically create structured database items only as reviewable content, never as auto-published final legal conclusions
- the current Germany baseline is materially stronger, but not exhaustive
- the final Germany AI Act authority map still requires fuller article-level confirmation before stronger definitive claims are made

## Italy country-specific legal intelligence

Italy now has a country-specific monitoring layer broadly mirroring the France and Spain architecture, but tuned to Italy's current official-source landscape.

Core files:

- `src/agents/ai-regulation/italyNewsSources.ts`
- `src/agents/ai-regulation/italyLegalNewsAgent.ts`
- `src/content/ai-regulation/italy-ai-intelligence.ts`
- `src/app/api/cron/ai-regulation-italy-scan/route.ts`
- `scripts/run-italy-official-legal-scan.ts`
- `scripts/run-italy-legal-news-scan.ts`
- `scripts/run-italy-verification-scan.ts`

Public behavior on `/ai-regulation/europe/italy`:

- Italy-only live legal-intelligence panel
- Italy authority map
- Italy AI legal timeline
- first conservative verified Italy decisions and acts layer
- explicit verification gaps and monitoring notes

Italy official monitoring posture:

- lightweight official live anchor:
  - `Garante`
- slower official baseline sources:
  - `AgID`
  - `Normattiva`
  - `Dipartimento per la trasformazione digitale`
- discovery acceleration only:
  - `src-it-newsapi-ai`
  - `src-it-major-press-newsapi-ai`
  - `src-it-gdelt-ai`

Italy-specific scan profiles:

- `italy_official_legal_scan`
- `italy_live_news_scan`
- `italy_verification_scan`

Italy-specific scripts:

- `npm run scan:italy-official-legal`
- `npm run scan:italy-legal-news`
- `npm run scan:italy-verification`

Important Italy rules:

- Italy discovery/media items remain non-authoritative until official confirmation is present
- official Italy decisions and acts can automatically create structured database items only as reviewable content, never as auto-published final legal conclusions
- the current Italy baseline is materially stronger, but not exhaustive
- the final Italy AI Act authority map still requires fuller article-level confirmation before stronger definitive claims are made
