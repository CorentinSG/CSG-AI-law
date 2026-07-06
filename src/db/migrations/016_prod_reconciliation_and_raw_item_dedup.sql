-- 016 — Deduplicate raw_regulatory_items (provenance-preserving, transactional)
--
-- WHY THIS EXISTS
--   A live audit of production (2026-07-05) found public.raw_regulatory_items holding
--   ~12,817 rows for only ~1,255 distinct hashes (~11,562 duplicate rows across 784 hash
--   groups). Migration 013's guard therefore (correctly) refuses to build the unique index
--   on hash. This migration collapses each hash group to one canonical row.
--
-- WHAT THIS DOES
--   Canonical row = earliest (detected_at, id) per hash — matches migration 013's upsert
--   semantics (on conflict (hash) do nothing keeps the first-inserted row). FK references
--   are re-pointed to the canonical row BEFORE the duplicates are deleted, because
--   ai_regulatory_updates.raw_item_id is ON DELETE CASCADE — a naive delete would destroy
--   reviewed/published updates.
--
-- SAFETY — READ BEFORE RUNNING
--   * This migration DELETES rows. Run it against a DISPOSABLE COPY of production first,
--     confirm the counts, then run once against production.
--   * Run the whole file as a single batch so it executes in one transaction (atomic:
--     any failure rolls everything back).
--   * Run migration 017 FIRST (it backfills the tables/columns that never reached prod).
--   * After this migration succeeds, re-run migration 013 unchanged — its guard passes
--     because hashes are now unique.

-- Build the loser -> canonical map (canonical = earliest detected_at, then id, per hash).
create temporary table _dedup_losers as
with ranked as (
  select
    id,
    hash,
    first_value(id) over (partition by hash order by detected_at asc, id asc) as canonical_id,
    row_number() over (partition by hash order by detected_at asc, id asc) as rn
  from public.raw_regulatory_items
)
select id as loser_id, canonical_id
from ranked
where rn > 1;

-- Re-point AI updates off the losers (their FK is ON DELETE CASCADE — must move first).
update public.ai_regulatory_updates au
set raw_item_id = l.canonical_id,
    updated_at = now()
from _dedup_losers l
where au.raw_item_id = l.loser_id;

-- Re-point self-referential duplicate_of links off the losers (null out any self-loop).
update public.raw_regulatory_items r
set duplicate_of = case when r.id = l.canonical_id then null else l.canonical_id end,
    updated_at = now()
from _dedup_losers l
where r.duplicate_of = l.loser_id;

-- Delete the duplicate rows now that nothing references them.
delete from public.raw_regulatory_items
where id in (select loser_id from _dedup_losers);

-- Guard: fail (and roll back the whole migration) if any hash is still duplicated.
do $$
declare
  remaining bigint;
begin
  select count(*) into remaining
  from (
    select hash from public.raw_regulatory_items group by hash having count(*) > 1
  ) d;
  if remaining > 0 then
    raise exception 'Dedup incomplete: % hash group(s) still duplicated', remaining;
  end if;
end
$$;

drop table _dedup_losers;

-- After this migration succeeds, re-run migration 013 unchanged to create the unique
-- hash index and the upsert_raw_regulatory_item function.
