do $$
begin
  if not exists (select 1 from pg_type where typname = 'route_status') then
    create type public.route_status as enum ('draft', 'ready', 'in_progress', 'completed', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'route_stop_status') then
    create type public.route_stop_status as enum ('pending', 'skipped', 'visited', 'completed');
  end if;
  if not exists (select 1 from pg_type where typname = 'route_source_type') then
    create type public.route_source_type as enum ('crm', 'discovery', 'both', 'auto_pick');
  end if;
end
$$;

alter table public.routes
  add column if not exists source_type public.route_source_type not null default 'crm',
  add column if not exists origin_label text,
  add column if not exists destination_label text,
  add column if not exists origin_latitude double precision,
  add column if not exists origin_longitude double precision,
  add column if not exists destination_latitude double precision,
  add column if not exists destination_longitude double precision,
  add column if not exists total_stops integer not null default 0,
  add column if not exists estimated_duration_minutes integer,
  add column if not exists estimated_distance_meters integer;

alter table public.routes
  alter column status drop default;

alter table public.routes
  alter column status type public.route_status using
    case
      when status = 'draft' then 'draft'::public.route_status
      when status = 'ready' then 'ready'::public.route_status
      when status = 'in_progress' then 'in_progress'::public.route_status
      when status = 'completed' then 'completed'::public.route_status
      when status = 'archived' then 'archived'::public.route_status
      else 'draft'::public.route_status
    end;

alter table public.routes
  alter column status set default 'draft'::public.route_status;

alter table public.route_stops
  rename column sequence to stop_order;

alter table public.route_stops
  add column if not exists discovery_job_result_id uuid references public.discovery_job_results (id) on delete set null,
  add column if not exists google_place_id text,
  add column if not exists restaurant_name text,
  add column if not exists formatted_address text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists visit_outcome public.visit_outcome,
  add column if not exists arrived_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.route_stops
  alter column status drop default;

alter table public.route_stops
  alter column status type public.route_stop_status using
    case
      when status = 'skipped' then 'skipped'::public.route_stop_status
      when status = 'visited' then 'visited'::public.route_stop_status
      when status = 'completed' then 'completed'::public.route_stop_status
      else 'pending'::public.route_stop_status
    end;

alter table public.route_stops
  alter column status set default 'pending'::public.route_stop_status;

drop index if exists route_stops_route_id_sequence_key;
drop index if exists route_stops_route_id_stop_order_key;
alter table public.route_stops drop constraint if exists route_stops_route_id_sequence_key;
alter table public.route_stops drop constraint if exists route_stops_route_id_stop_order_key;
alter table public.route_stops add constraint route_stops_route_id_stop_order_key unique (route_id, stop_order);

drop trigger if exists set_route_stops_updated_at on public.route_stops;
create trigger set_route_stops_updated_at
before update on public.route_stops
for each row execute function public.set_updated_at();
