-- 033: composite index for the per-scan identity prefetch.
--
-- Every scanned source now runs one slim query:
--   SELECT id, raw_url, raw_title, hash FROM raw_regulatory_items
--   WHERE source_id = $1 ORDER BY detected_at DESC LIMIT 200;
-- With only the single-column source_id index (001), Postgres must sort the
-- source's rows on every call. This composite index makes it an ordered index
-- scan — the same class of fix as migration 032 after the July timeout
-- cascade (57014 -> pool exhaustion -> Cloudflare 522).
--
-- CREATE INDEX CONCURRENTLY cannot run inside a transaction: run this
-- statement on its own in the Supabase SQL editor.

create index concurrently if not exists raw_regulatory_items_source_detected_idx
  on raw_regulatory_items (source_id, detected_at desc);
