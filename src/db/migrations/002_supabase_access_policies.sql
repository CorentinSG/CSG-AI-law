grant usage on schema public to anon, authenticated, service_role;

grant select on table ai_regulatory_updates to anon, authenticated;

grant select, insert, update, delete on table regulation_sources to service_role;
grant select, insert, update, delete on table raw_regulatory_items to service_role;
grant select, insert, update, delete on table ai_regulatory_updates to service_role;
grant select, insert, update, delete on table regulation_scan_logs to service_role;
grant select, insert, update, delete on table ai_processing_logs to service_role;

alter table ai_regulatory_updates enable row level security;

drop policy if exists public_published_updates_select on ai_regulatory_updates;
create policy public_published_updates_select
  on ai_regulatory_updates
  for select
  to anon, authenticated
  using (status = 'published');
