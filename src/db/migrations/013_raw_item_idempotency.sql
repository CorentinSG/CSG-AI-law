do $$
declare
  duplicate_hash text;
  duplicate_count bigint;
  index_is_valid boolean;
begin
  select hash, count(*)
    into duplicate_hash, duplicate_count
  from public.raw_regulatory_items
  group by hash
  having count(*) > 1
  order by count(*) desc, hash
  limit 1;

  if duplicate_hash is not null then
    raise exception
      'Cannot enforce raw item hash uniqueness: hash "%" has % rows. Resolve duplicate raw_regulatory_items without deleting provenance, then rerun migration 013.',
      duplicate_hash,
      duplicate_count;
  end if;

  if to_regclass('public.raw_regulatory_items_hash_unique_idx') is not null then
    select
      i.indisunique
      and i.indpred is null
      and i.indnkeyatts = 1
      and a.attname = 'hash'
    into index_is_valid
    from pg_index i
    join pg_class c on c.oid = i.indexrelid
    join pg_class t on t.oid = i.indrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a
      on a.attrelid = t.oid
      and a.attnum = i.indkey[0]
    where n.nspname = 'public'
      and c.relname = 'raw_regulatory_items_hash_unique_idx'
      and t.relname = 'raw_regulatory_items';

    if index_is_valid is distinct from true then
      raise exception
        'Index public.raw_regulatory_items_hash_unique_idx is incorrectly defined. Expected a non-partial unique index on public.raw_regulatory_items(hash); inspect and correct it before rerunning migration 013.';
    end if;
  else
    create unique index raw_regulatory_items_hash_unique_idx
      on public.raw_regulatory_items (hash);
  end if;
end
$$;

create or replace function public.upsert_raw_regulatory_item(
  p_item jsonb,
  p_source_references jsonb default '[]'::jsonb
)
returns table(item jsonb, inserted boolean)
language plpgsql
security invoker
set search_path = public
as $$
declare
  canonical public.raw_regulatory_items%rowtype;
  did_insert boolean := false;
  reference jsonb;
begin
  insert into public.raw_regulatory_items (
    id, source_id, raw_title, raw_url, raw_text, raw_metadata, detected_at,
    hash, duplicate_of, processing_status
  ) values (
    p_item->>'id',
    p_item->>'source_id',
    p_item->>'raw_title',
    p_item->>'raw_url',
    p_item->>'raw_text',
    coalesce(p_item->'raw_metadata', '{}'::jsonb),
    (p_item->>'detected_at')::timestamptz,
    p_item->>'hash',
    nullif(p_item->>'duplicate_of', ''),
    p_item->>'processing_status'
  )
  on conflict (hash) do nothing
  returning * into canonical;

  if found then
    did_insert := true;
  else
    select *
      into strict canonical
    from public.raw_regulatory_items
    where hash = p_item->>'hash';
  end if;

  for reference in
    select value from jsonb_array_elements(coalesce(p_source_references, '[]'::jsonb))
  loop
    insert into public.source_references (
      id, raw_item_id, regulatory_update_id, source_role, title, institution,
      url, canonical_url, source_type, authority_type, publication_date,
      detected_at, retrieved_at, last_verified_at, jurisdiction, document_type,
      excerpt, pinpoint, reliability_level, verification_status, archived_url,
      access_limitations, notes
    ) values (
      reference->>'id', canonical.id, nullif(reference->>'regulatory_update_id', ''),
      reference->>'source_role', reference->>'title', reference->>'institution',
      reference->>'url', reference->>'canonical_url', reference->>'source_type',
      reference->>'authority_type', (reference->>'publication_date')::date,
      (reference->>'detected_at')::timestamptz,
      (reference->>'retrieved_at')::timestamptz,
      (reference->>'last_verified_at')::timestamptz,
      reference->>'jurisdiction', reference->>'document_type',
      reference->>'excerpt', coalesce(reference->'pinpoint', '{}'::jsonb),
      reference->>'reliability_level', reference->>'verification_status',
      reference->>'archived_url', reference->>'access_limitations',
      reference->>'notes'
    )
    on conflict (raw_item_id, url, source_role) do nothing;
  end loop;

  return query select to_jsonb(canonical), did_insert;
end
$$;

revoke all on function public.upsert_raw_regulatory_item(jsonb, jsonb) from public;
grant execute on function public.upsert_raw_regulatory_item(jsonb, jsonb) to service_role;
