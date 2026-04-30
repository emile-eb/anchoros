do $$
begin
  if not exists (select 1 from pg_type where typname = 'discovery_job_status') then
    create type public.discovery_job_status as enum ('queued', 'running', 'completed', 'failed');
  end if;
end
$$;

create table if not exists public.discovery_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  query text not null,
  business_type text not null default 'restaurant',
  subtype text,
  target_results integer not null default 100,
  status public.discovery_job_status not null default 'queued',
  current_phase text,
  total_tiles integer not null default 0,
  completed_tiles integer not null default 0,
  raw_places_found integer not null default 0,
  unique_places_found integer not null default 0,
  no_website_places_found integer not null default 0,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.discovery_job_results (
  id uuid primary key default gen_random_uuid(),
  discovery_job_id uuid not null references public.discovery_jobs (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  google_place_id text,
  restaurant_name text not null,
  formatted_address text,
  latitude double precision,
  longitude double precision,
  primary_type text,
  rating double precision,
  review_count integer,
  price_level integer,
  website_url text,
  website_status public.website_status not null default 'no_website',
  google_maps_url text,
  already_in_crm boolean not null default false,
  existing_lead_id uuid references public.leads (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists discovery_jobs_workspace_id_idx on public.discovery_jobs (workspace_id, created_at desc);
create index if not exists discovery_job_results_job_id_idx on public.discovery_job_results (discovery_job_id, created_at desc);
create index if not exists discovery_job_results_workspace_id_idx on public.discovery_job_results (workspace_id);
create index if not exists discovery_job_results_google_place_id_idx on public.discovery_job_results (google_place_id);

drop trigger if exists set_discovery_jobs_updated_at on public.discovery_jobs;
create trigger set_discovery_jobs_updated_at
before update on public.discovery_jobs
for each row execute function public.set_updated_at();

alter table public.discovery_jobs enable row level security;
alter table public.discovery_job_results enable row level security;

drop policy if exists "members can manage discovery jobs" on public.discovery_jobs;
create policy "members can manage discovery jobs"
on public.discovery_jobs
for all
using (public.user_in_workspace(workspace_id))
with check (public.user_in_workspace(workspace_id));

drop policy if exists "members can manage discovery job results" on public.discovery_job_results;
create policy "members can manage discovery job results"
on public.discovery_job_results
for all
using (public.user_in_workspace(workspace_id))
with check (public.user_in_workspace(workspace_id));
