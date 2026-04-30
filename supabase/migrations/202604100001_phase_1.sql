create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type public.workspace_role as enum ('owner', 'member');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_stage') then
    create type public.lead_stage as enum ('new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost', 'on_hold');
  end if;
  if not exists (select 1 from pg_type where typname = 'outreach_type') then
    create type public.outreach_type as enum ('email', 'call', 'text', 'visit', 'social', 'other');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create or replace function public.user_in_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  assigned_to uuid references public.profiles (id) on delete set null,
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  website_url text,
  source text,
  stage public.lead_stage not null default 'new',
  notes text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  zip_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.outreach_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  channel public.outreach_type not null,
  outcome text,
  notes text,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  outcome text,
  notes text,
  visited_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  lead_id uuid not null references public.leads (id) on delete cascade,
  amount_cents integer,
  status text not null default 'draft',
  summary text,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  name text not null,
  scheduled_for date,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  route_id uuid not null references public.routes (id) on delete cascade,
  lead_id uuid references public.leads (id) on delete set null,
  sequence integer not null,
  status text not null default 'planned',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (route_id, sequence)
);

create index if not exists leads_workspace_id_idx on public.leads (workspace_id);
create index if not exists outreach_events_workspace_id_idx on public.outreach_events (workspace_id);
create index if not exists visits_workspace_id_idx on public.visits (workspace_id);
create index if not exists proposals_workspace_id_idx on public.proposals (workspace_id);
create index if not exists routes_workspace_id_idx on public.routes (workspace_id);
create index if not exists route_stops_workspace_id_idx on public.route_stops (workspace_id);

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at before update on public.workspaces for each row execute function public.set_updated_at();
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
drop trigger if exists set_lead_notes_updated_at on public.lead_notes;
create trigger set_lead_notes_updated_at before update on public.lead_notes for each row execute function public.set_updated_at();
drop trigger if exists set_proposals_updated_at on public.proposals;
create trigger set_proposals_updated_at before update on public.proposals for each row execute function public.set_updated_at();
drop trigger if exists set_routes_updated_at on public.routes;
create trigger set_routes_updated_at before update on public.routes for each row execute function public.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_members enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.outreach_events enable row level security;
alter table public.visits enable row level security;
alter table public.proposals enable row level security;
alter table public.routes enable row level security;
alter table public.route_stops enable row level security;

create policy "workspace members can view workspaces" on public.workspaces for select using (public.user_in_workspace(id));
create policy "users can view own profile" on public.profiles for select using (id = auth.uid());
create policy "users can update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "members can view workspace memberships" on public.workspace_members for select using (public.user_in_workspace(workspace_id));
create policy "members can manage leads" on public.leads for all using (public.user_in_workspace(workspace_id)) with check (public.user_in_workspace(workspace_id));
create policy "members can manage lead notes" on public.lead_notes for all using (public.user_in_workspace(workspace_id)) with check (public.user_in_workspace(workspace_id));
create policy "members can manage outreach events" on public.outreach_events for all using (public.user_in_workspace(workspace_id)) with check (public.user_in_workspace(workspace_id));
create policy "members can manage visits" on public.visits for all using (public.user_in_workspace(workspace_id)) with check (public.user_in_workspace(workspace_id));
create policy "members can manage proposals" on public.proposals for all using (public.user_in_workspace(workspace_id)) with check (public.user_in_workspace(workspace_id));
create policy "members can manage routes" on public.routes for all using (public.user_in_workspace(workspace_id)) with check (public.user_in_workspace(workspace_id));
create policy "members can manage route stops" on public.route_stops for all using (public.user_in_workspace(workspace_id)) with check (public.user_in_workspace(workspace_id));

insert into public.workspaces (id, name, slug)
values ('11111111-1111-1111-1111-111111111111', 'Anchor Studios', 'anchor-studios')
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    updated_at = timezone('utc', now());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      updated_at = timezone('utc', now());

  insert into public.workspace_members (workspace_id, user_id, role)
  values (
    '11111111-1111-1111-1111-111111111111',
    new.id,
    case
      when not exists (
        select 1 from public.workspace_members where workspace_id = '11111111-1111-1111-1111-111111111111'
      ) then 'owner'::public.workspace_role
      else 'member'::public.workspace_role
    end
  )
  on conflict (workspace_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
