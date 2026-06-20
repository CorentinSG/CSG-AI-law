alter table ai_regulatory_updates
  add column if not exists authority_type text;

update ai_regulatory_updates
set authority_type = case
  when 'authority:binding-law' = any(tags) then 'Binding law'
  when 'authority:proposed-law' = any(tags) then 'Proposed law'
  when 'authority:regulation' = any(tags) then 'Regulation'
  when 'authority:agency-guidance' = any(tags) then 'Agency guidance'
  when 'authority:enforcement-action' = any(tags) then 'Enforcement action'
  when 'authority:soft-law' = any(tags) then 'Soft law'
  when 'authority:technical-standard' = any(tags) then 'Technical standard'
  when 'authority:governance-framework' = any(tags) then 'Governance framework'
  when 'authority:policy-report' = any(tags) then 'Policy report'
  when 'authority:best-practice' = any(tags) then 'Best practice'
  when development_type in ('Statute', 'Final rule', 'Executive order', 'International treaty') then 'Binding law'
  when development_type in ('Bill', 'Proposed rule', 'Public consultation') then 'Proposed law'
  when development_type = 'Regulation' then 'Regulation'
  when development_type = 'Agency guidance' then 'Agency guidance'
  when development_type = 'Enforcement action' then 'Enforcement action'
  when development_type = 'Policy report' then 'Policy report'
  when development_type = 'Standards document' then 'Technical standard'
  when development_type = 'Code of practice' then 'Soft law'
  else 'Other'
end
where authority_type is null;

alter table ai_regulatory_updates
  alter column authority_type set default 'Other',
  alter column authority_type set not null;

alter table ai_regulatory_updates
  drop constraint if exists ai_regulatory_updates_authority_type_check;

alter table ai_regulatory_updates
  add constraint ai_regulatory_updates_authority_type_check check (
    authority_type in (
      'Binding law',
      'Proposed law',
      'Regulation',
      'Agency guidance',
      'Enforcement action',
      'Soft law',
      'Technical standard',
      'Governance framework',
      'Policy report',
      'Best practice',
      'Other'
    )
  );

create index if not exists ai_regulatory_updates_authority_type_idx
  on ai_regulatory_updates(authority_type);

create index if not exists ai_regulatory_updates_region_idx
  on ai_regulatory_updates(region);

create index if not exists ai_regulatory_updates_legal_area_idx
  on ai_regulatory_updates(legal_area);

create index if not exists ai_regulatory_updates_three_axis_idx
  on ai_regulatory_updates(authority_type, region, legal_area, publication_date desc);
