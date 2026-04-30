do $$
begin
  if not exists (select 1 from pg_type where typname = 'discovery_search_mode') then
    create type public.discovery_search_mode as enum ('exact_region', 'quick_area');
  end if;

  if not exists (select 1 from pg_type where typname = 'discovery_region_type') then
    create type public.discovery_region_type as enum ('rectangle', 'circle', 'polygon', 'geocoded_area');
  end if;

  if not exists (select 1 from pg_type where typname = 'discovery_subtype_mode') then
    create type public.discovery_subtype_mode as enum ('strict', 'broad');
  end if;
end
$$;

alter table public.discovery_jobs
  add column if not exists search_mode public.discovery_search_mode not null default 'quick_area',
  add column if not exists raw_query text,
  add column if not exists region_type public.discovery_region_type not null default 'geocoded_area',
  add column if not exists region_data jsonb,
  add column if not exists minimum_reviews integer not null default 10,
  add column if not exists subtype_mode public.discovery_subtype_mode not null default 'broad',
  add column if not exists no_website_only boolean not null default true,
  add column if not exists desired_final_results integer not null default 100,
  add column if not exists exact_geometry boolean not null default false,
  add column if not exists candidates_passing_review_filter integer not null default 0,
  add column if not exists candidates_passing_no_website_filter integer not null default 0,
  add column if not exists candidates_dropped_low_reviews integer not null default 0,
  add column if not exists candidates_dropped_has_website integer not null default 0,
  add column if not exists candidates_dropped_subtype integer not null default 0,
  add column if not exists debug_summary jsonb;

update public.discovery_jobs
set
  raw_query = coalesce(raw_query, query),
  desired_final_results = coalesce(desired_final_results, target_results),
  region_data = coalesce(
    region_data,
    jsonb_build_object(
      'type', 'geocoded_area',
      'label', query
    )
  )
where true;

alter table public.discovery_job_results
  add column if not exists matched_subtype text,
  add column if not exists region_match boolean not null default true;

create index if not exists discovery_jobs_search_mode_idx on public.discovery_jobs (workspace_id, search_mode, created_at desc);
