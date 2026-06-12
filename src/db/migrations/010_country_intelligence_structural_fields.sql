-- Migration 010: country_intelligence structural content columns (F8C-3 / T-RT5A)
--
-- PURPOSE: Continue moving `europe-member-state-implementation.ts` to DB-backed
-- storage. F8A/F8B/F8C-1/F8C-2 moved editorial fields and the source lists to
-- the database. This migration adds the remaining SCALAR/ARRAY structural
-- content so the public country page can render authority maps, implementation
-- measures, and per-category notes from `country_intelligence` instead of the
-- TypeScript layer.
--
-- All columns are additive and nullable / default empty so existing rows and
-- the conservative content posture are preserved. Apply AFTER migration 006.
-- Run in the Supabase SQL editor.

alter table country_intelligence
  add column if not exists implementation_measures        text[] not null default '{}',
  add column if not exists competent_authorities          text[] not null default '{}',
  add column if not exists market_surveillance_authorities text[] not null default '{}',
  add column if not exists notifying_authorities           text[] not null default '{}',
  add column if not exists relevant_ministries             text[] not null default '{}',
  add column if not exists national_ai_regulation_notes    text,
  add column if not exists national_case_law_notes         text,
  add column if not exists national_soft_law_notes         text;
