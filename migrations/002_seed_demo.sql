insert into demo_sources (
  id,
  label,
  freshness,
  indexed_until_block,
  confidence,
  is_partial,
  warnings
)
values (
  'sentinel-demo-provider',
  'Sentinel demo provider',
  'demo snapshot refreshed for hackathon walkthroughs',
  70234121,
  'medium',
  true,
  array[
    'Demo data is partial and should not be treated as complete Mantle coverage.',
    'Private indexers and nodes are intentionally not exposed by this public repository.'
  ]
)
on conflict (id) do update
set
  label = excluded.label,
  freshness = excluded.freshness,
  indexed_until_block = excluded.indexed_until_block,
  confidence = excluded.confidence,
  is_partial = excluded.is_partial,
  warnings = excluded.warnings,
  updated_at = now();
