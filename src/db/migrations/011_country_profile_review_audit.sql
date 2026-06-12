-- Migration 011: country-profile review audit + persisted re-review flag
--
-- PURPOSE:
-- 1. Persist whether a country profile is due for re-review based on
--    `last_reviewed_at` so admin queues and follow-up jobs can query it
--    directly.
-- 2. Add an audit trail for country-profile editorial saves without mixing
--    those events into monitor-item review events.

alter table country_intelligence
  add column if not exists needs_re_review boolean not null default false;

update country_intelligence
set needs_re_review = case
  when last_reviewed_at is null then true
  when last_reviewed_at <= now() - interval '60 days' then true
  else false
end;

create index if not exists idx_country_intelligence_needs_re_review
  on country_intelligence(needs_re_review, review_status, country_name);

create table if not exists country_profile_review_events (
  id text primary key,
  country_id text not null references country_intelligence(id) on delete cascade,
  country_slug text not null,
  event_type text not null check (
    event_type in ('editorial_saved', 'review_status_changed')
  ),
  actor text not null,
  previous_review_status text,
  next_review_status text,
  previous_needs_re_review boolean,
  next_needs_re_review boolean not null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_country_profile_review_events_country
  on country_profile_review_events(country_id, created_at desc);

alter table country_profile_review_events enable row level security;

create policy "service_role_all_country_profile_review_events"
  on country_profile_review_events
  for all
  using (auth.role() = 'service_role');

grant select, insert, update, delete
  on table country_profile_review_events
  to service_role;
