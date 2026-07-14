# Non-EU Western And Balkan Europe Coverage Design

## Goal

Add a distinct “Non-EU Europe” coverage layer for Western European and Balkan countries that are not EU members, with country-level agents, source registries, monitoring seeds, and public/admin grouping separate from the existing EU member-state layer.

## Scope

Initial countries:

- Western Europe outside the EU: United Kingdom, Norway, Iceland, Switzerland, Liechtenstein, Monaco, Andorra, San Marino, Vatican City.
- Balkans outside the EU: Albania, Bosnia and Herzegovina, Kosovo, Montenegro, North Macedonia, Serbia.

Explicitly excluded for this phase:

- Ukraine, Moldova, Belarus, Russia, Turkey, Armenia, Azerbaijan, Georgia.

## Product Model

The Europe experience should distinguish:

- European Union: EU institutions and EU member states.
- Non-EU Europe: Western European and Balkan non-EU countries.
- Pan-European: Council of Europe, ECHR, Convention 108+, and other cross-border European instruments where relevant.

The first implementation should prioritize backend coverage and operational correctness. Frontend changes should be minimal: expose a separate group/section only where existing patterns make that low-risk. Larger visual design work can remain Claude-owned.

## Monitoring Requirements

Each new country profile must resolve at least three active sources:

- One official legal or government source.
- One data-protection, digital regulator, court, or institutional source when available.
- One legal-news or discovery fallback source, such as GDELT/NewsAPI-backed monitoring.

Sources should prefer APIs and official pages. Generic scraping is allowed only as a fallback through the existing guarded `sourceScanner` / Scrapling / Firecrawl path.

## Agent Requirements

Each country gets a country-specific monitoring agent/profile aligned with the existing country-agent pattern. The agent must monitor:

- AI regulation and governance.
- Data protection and privacy.
- Cloud/digital regulation where jurisdictionally relevant.
- Soft law, hard law, and case law when sources exist.

## Data Requirements

New seeds and migrations must be append-only and non-destructive. They must not alter existing EU member-state coverage. Source IDs must be stable and named consistently with current country source conventions.

## Verification Requirements

Implementation is complete only when:

- All 15 new countries have at least three active sources in seed tests.
- Source profile selection resolves non-zero sources for every new country.
- `npm test`, `npm run typecheck`, and `npm run lint` pass.
- A production or local Supabase replay confirms at least representative jobs can be queued/drained without zero-source profile failures.

