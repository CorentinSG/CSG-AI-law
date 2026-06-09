alter table if exists source_references
  drop constraint if exists source_references_source_type_check;

alter table if exists source_references
  add constraint source_references_source_type_check check (
    source_type in (
      'official',
      'court',
      'regulator',
      'government',
      'parliament',
      'legislation',
      'policy',
      'standards_body',
      'discovery_source',
      'media_source',
      'tracker'
    )
  );
