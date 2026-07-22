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
