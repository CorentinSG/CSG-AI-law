# Austria and Belgium Monitoring Coverage

## Objective

Make the existing Austria and Belgium jurisdiction agents operational across
official legal data, case law, soft law, AI-policy implementation, and
country-specific AI legal news.

The agents already exist. The delivery gap is that their source identifiers
are declared in agent registries but do not resolve to active persisted
`RegulationSource` records, so scheduled official profiles process zero
sources.

## Scope

This change covers:

- `austria_official_legal_scan`, `austria_live_news_scan`, and
  `austria_verification_scan`;
- `belgium_official_legal_scan`, `belgium_live_news_scan`, and
  `belgium_verification_scan`;
- official legislation, regulatory guidance, decisions and case law;
- reputable country-specific AI legal news;
- source-level runtime health and controlled production proof.

It does not modify migrations `003`, `013`, `016`, or Claude Code's production
deduplication work.

## Architecture

Use the existing hybrid ingestion pipeline:

1. Prefer official APIs, RSS feeds, and structured databases.
2. Use the existing static/conditional fetch connector for stable HTML pages.
3. Use Scrapling only when an official or reputable source cannot be consumed
   reliably through a structured method.
4. Use NewsAPI and GDELT for discovery, never as legal authority.
5. Persist every source as an active `RegulationSource` with a stable ID that
   exactly matches the country registry.

No new service or paid dependency is introduced. Existing Vercel, Supabase,
Railway, NewsAPI, GDELT, and Scrapling infrastructure is reused.

## Austria Sources

### Official legal database

- `src-at-dsb-ai`: Austrian Data Protection Authority AI/data-protection
  guidance and current notices, including its AI and GDPR materials.
- `src-at-ris-ai-law`: RIS federal legislation search for AI-related hard law,
  amendments, consolidated provisions, and official identifiers.
- `src-at-ris-ai-case-law`: RIS judicial and DSB decision monitoring,
  including automated decision-making and AI-assisted filing decisions.
- `src-at-rtr-ai`: RTR AI Service Desk, AI advisory board, implementation
  guidance, and communications-sector supervision.
- `src-at-digital-austria-ai`: federal AI strategy and implementation
  materials.

The existing registry IDs remain stable where already declared. New RIS IDs
are added because legislation and case law require distinct source contracts.

### Legal news

- `src-at-newsapi-ai`: NewsAPI discovery constrained to Austria, AI, and legal
  terms, with a reputable-domain allowlist.
- `src-at-gdelt-ai`: GDELT corroboration and discovery with the same topic and
  jurisdiction filters.
- Direct lightweight monitoring of ORF, Der Standard, and Futurezone is
  allowed only for relevant legal-policy reporting and only when robots/access
  behavior permits it.

## Belgium Sources

### Official legal database

- `src-be-apd-ai`: Belgian DPA/APD/GBA AI guidance, news, recommendations, and
  Contentious Chamber decisions.
- `src-be-justel-ai-law`: Justel/Belgian Official Gazette monitoring for
  enacted and proposed AI-related national law.
- `src-be-courts-ai`: Constitutional Court, Court of Cassation, and other
  official Belgian judicial publications relevant to AI, algorithms,
  automated decisions, and data protection.
- `src-be-digitalbelgium-ai`: BOSA/Digital Belgium AI Act implementation and
  federal digital-policy materials.
- `src-be-ai4belgium`: AI4Belgium strategy and government coordination
  materials.

### Legal news

- `src-be-newsapi-ai`: NewsAPI discovery constrained to Belgium, AI, and law,
  with a reputable-domain allowlist.
- `src-be-gdelt-ai`: GDELT corroboration and discovery.
- Direct monitoring may cover RTBF, VRT, L'Echo, De Tijd, and Data News when
  relevant and technically permitted.

## Profile Contracts

For each country:

- `official_legal_scan` resolves only active official authority, legislation,
  regulatory, and court sources. It must resolve at least three sources.
- `live_news_scan` resolves reputable media discovery plus fast-moving
  official news sources. It must resolve at least two sources.
- `verification_scan` resolves official and corroboration sources used to
  validate candidate news. It must resolve at least two sources.

A scheduled profile resolving zero sources remains `partial_success` with
`scan_profile_resolved_zero_sources`; this guard is not weakened.

## Filtering and Classification

Country relevance requires both:

- a country/jurisdiction signal; and
- an AI plus legal/regulatory signal.

Supported signals include AI Act implementation, artificial intelligence,
automated decision-making, algorithms, profiling, biometric systems,
foundation/generative models, enforcement, legislation, regulation,
government guidance, court decisions, data protection, cloud, and personal
data.

Media discovery results remain `discovery_source` until an official source is
found or at least two reputable independent sources corroborate the event.

## Publication Policy

- Official-source legal records may publish automatically only when required
  provenance and legal metadata pass existing validation.
- Reputable or corroborated legal news follows the existing automatic
  publication policy.
- Single-source weak media signals, incomplete records, and contradictory
  reports remain private.
- Discovery APIs never become the cited legal authority when an official
  document exists.

## Failure Handling

- Explicit connector timeouts and existing bounded retry behavior remain in
  force.
- HTTP 403/404, parser drift, empty extraction, and quota/credential failures
  are persisted in source health.
- Structured retrieval falls back to Scrapling only for an eligible source;
  the fallback method is recorded.
- A failed source produces `partial_success` when other sources succeed.
- AI processing failure never blocks collection of raw official materials.

## Testing

Automated tests must prove:

1. all six profiles resolve non-empty active sources from the production seed;
2. official profiles exclude NewsAPI/GDELT;
3. news profiles include discovery sources but preserve discovery-only
   authority;
4. verification profiles combine official and corroboration sources;
5. Austria and Belgium relevance filters reject unrelated national news;
6. source IDs in registries and seeds remain synchronized;
7. source URLs and connector modes map into valid `RegulationSource` records.

Runtime verification must:

- seed/upsert the new sources without destructive changes;
- run one controlled Austria official scan;
- run one controlled Belgium official scan;
- confirm each processes at least one source;
- inspect source-health results and record any external blockers;
- avoid claiming full success while Claude's missing
  `source_references`/deduplication work still blocks provenance persistence.

## Success Criteria

- Austria and Belgium disappear from `coverage.zeroSourceProfiles`.
- Each official scan processes at least one source and reports an honest final
  outcome.
- Legal-news scans have active discovery and corroboration paths.
- Source runtime failures are visible and actionable.
- No changes are made to Claude Code's migration reconciliation work.
- No new recurring infrastructure cost is introduced.
