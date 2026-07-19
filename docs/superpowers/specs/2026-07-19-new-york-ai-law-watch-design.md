# New York AI Law Watch Design

Goal: build a New York-specific legal intelligence layer for AI law, including state court AI-rule/case-law developments, federal New York privilege/work-product developments, NYC AEDT law and enforcement, and live monitoring sources.

Architecture: keep the existing official-source backfill pattern. Add a typed New York corpus module, an idempotent Supabase backfill script, and source-registry extensions for live NY monitoring. CourtListener remains the federal/case-law discovery accelerator; official NY Courts, DCWP, NYC Council/Rules, NY Senate/Assembly, NYDFS and NY AG sources are the authority layer.

Scope:
- Publish only primary or authoritative sources as verified legal-database entries.
- Treat law-firm, press and social posts as discovery leads, not legal authority.
- Tag privilege/work-product, hallucinated authority, Part 161, AEDT, NYDFS AI guidance, state AI bills, public-sector automated decision-making, and employment AI distinctly.
- Keep Claude-owned Standards UI files untouched.

Testing:
- Content test proves the corpus covers court rules, NY state decisions, federal work product, AEDT, financial-services AI, and state legislation.
- Monitoring test proves New York has live source descriptors for NY Courts decisions, CourtListener NY query, DCWP AEDT, NYC Council/Rules, NY Senate/Assembly, NYDFS and NY AG.
- Backfill dry-run and live replay prove idempotence.
