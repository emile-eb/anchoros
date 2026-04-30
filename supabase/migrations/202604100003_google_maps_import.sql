alter table public.leads
  add column google_maps_url text,
  add column google_place_id text,
  add column google_rating numeric(3, 2),
  add column google_review_count integer,
  add column google_price_level integer,
  add column google_business_status text,
  add column google_primary_type text,
  add column google_imported_at timestamptz;

create index if not exists leads_google_place_id_idx on public.leads (google_place_id);
