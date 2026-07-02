alter table public.regulation_sources enable row level security;
alter table public.raw_regulatory_items enable row level security;
alter table public.scan_jobs enable row level security;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'regulation_sources'
      and policyname = 'service_role_all_regulation_sources'
  ) then
    alter policy service_role_all_regulation_sources
      on public.regulation_sources
      to service_role
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  else
    create policy service_role_all_regulation_sources
      on public.regulation_sources
      for all
      to service_role
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'raw_regulatory_items'
      and policyname = 'service_role_all_raw_regulatory_items'
  ) then
    alter policy service_role_all_raw_regulatory_items
      on public.raw_regulatory_items
      to service_role
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  else
    create policy service_role_all_raw_regulatory_items
      on public.raw_regulatory_items
      for all
      to service_role
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'scan_jobs'
      and policyname = 'service_role_all_scan_jobs'
  ) then
    alter policy service_role_all_scan_jobs
      on public.scan_jobs
      to service_role
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  else
    create policy service_role_all_scan_jobs
      on public.scan_jobs
      for all
      to service_role
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;

create or replace function public.update_raw_regulatory_item_metadata(
  p_id text,
  p_raw_metadata jsonb,
  p_source_references jsonb default '[]'::jsonb
)
returns setof public.raw_regulatory_items
language plpgsql
security invoker
set search_path = public
as $$
declare
  canonical public.raw_regulatory_items%rowtype;
  reference jsonb;
  linked_update_id text;
begin
  update public.raw_regulatory_items
  set raw_metadata = coalesce(p_raw_metadata, '{}'::jsonb),
      updated_at = now()
  where id = p_id
  returning * into canonical;

  if not found then
    return;
  end if;

  select id
    into linked_update_id
  from public.ai_regulatory_updates
  where raw_item_id = p_id
  order by created_at
  limit 1;

  for reference in
    select value
    from jsonb_array_elements(coalesce(p_source_references, '[]'::jsonb))
  loop
    insert into public.source_references (
      id, raw_item_id, regulatory_update_id, source_role, title, institution,
      url, canonical_url, source_type, authority_type, publication_date,
      detected_at, retrieved_at, last_verified_at, jurisdiction, document_type,
      excerpt, pinpoint, reliability_level, verification_status, archived_url,
      access_limitations, notes
    ) values (
      reference->>'id',
      canonical.id,
      coalesce(nullif(reference->>'regulatory_update_id', ''), linked_update_id),
      reference->>'source_role',
      reference->>'title',
      reference->>'institution',
      reference->>'url',
      reference->>'canonical_url',
      reference->>'source_type',
      reference->>'authority_type',
      nullif(reference->>'publication_date', '')::date,
      nullif(reference->>'detected_at', '')::timestamptz,
      nullif(reference->>'retrieved_at', '')::timestamptz,
      nullif(reference->>'last_verified_at', '')::timestamptz,
      reference->>'jurisdiction',
      reference->>'document_type',
      reference->>'excerpt',
      coalesce(reference->'pinpoint', '{}'::jsonb),
      reference->>'reliability_level',
      reference->>'verification_status',
      reference->>'archived_url',
      reference->>'access_limitations',
      reference->>'notes'
    )
    on conflict (raw_item_id, url, source_role) do nothing;
  end loop;

  return next canonical;
end
$$;

create or replace function public.heartbeat_scan_job(
  p_id text,
  p_lease_token text,
  p_heartbeat_at timestamptz
)
returns setof public.scan_jobs
language sql
security invoker
set search_path = public
as $$
  update public.scan_jobs
  set result_summary = jsonb_set(
        result_summary,
        '{leaseHeartbeatAt}',
        to_jsonb(p_heartbeat_at::text),
        true
      ),
      updated_at = now()
  where id = p_id
    and status = 'running'
    and result_summary->>'leaseToken' = p_lease_token
  returning *;
$$;

create or replace function public.recover_stale_scan_job(
  p_id text,
  p_lease_token text,
  p_expected_heartbeat_at text,
  p_finished_at timestamptz,
  p_result_summary jsonb,
  p_error_message text
)
returns setof public.scan_jobs
language sql
security invoker
set search_path = public
as $$
  update public.scan_jobs
  set status = 'failed',
      finished_at = p_finished_at,
      result_summary = p_result_summary,
      error_message = p_error_message,
      updated_at = now()
  where id = p_id
    and status = 'running'
    and result_summary->>'leaseToken' = p_lease_token
    and result_summary->>'leaseHeartbeatAt'
      is not distinct from p_expected_heartbeat_at
  returning *;
$$;

revoke all on function public.update_raw_regulatory_item_metadata(text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.update_raw_regulatory_item_metadata(text, jsonb, jsonb)
  to service_role;

revoke all on function public.heartbeat_scan_job(text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.heartbeat_scan_job(text, text, timestamptz)
  to service_role;

revoke all on function public.recover_stale_scan_job(
  text, text, text, timestamptz, jsonb, text
) from public, anon, authenticated;
grant execute on function public.recover_stale_scan_job(
  text, text, text, timestamptz, jsonb, text
) to service_role;
