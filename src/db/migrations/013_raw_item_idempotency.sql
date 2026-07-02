do $$
declare
  duplicate_hash text;
  duplicate_count bigint;
begin
  select hash, count(*)
    into duplicate_hash, duplicate_count
  from public.raw_regulatory_items
  where hash is not null
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
end
$$;

create unique index if not exists raw_regulatory_items_hash_unique_idx
  on public.raw_regulatory_items (hash)
  where hash is not null;
