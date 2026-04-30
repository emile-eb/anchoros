do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_invite_status') then
    create type public.workspace_invite_status as enum (
      'pending',
      'accepted',
      'revoked',
      'expired'
    );
  end if;
end
$$;

create or replace function public.user_is_workspace_owner(target_workspace_id uuid)
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
      and wm.role = 'owner'
  );
$$;

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'member',
  status public.workspace_invite_status not null default 'pending',
  token_hash text not null,
  invited_by uuid references public.profiles (id) on delete set null,
  accepted_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspace_invites_email_not_blank check (char_length(btrim(email)) > 0),
  constraint workspace_invites_token_hash_not_blank check (char_length(btrim(token_hash)) > 0),
  constraint workspace_invites_accept_fields_check check (
    (status = 'accepted' and accepted_at is not null)
    or (status <> 'accepted' and accepted_at is null)
  ),
  constraint workspace_invites_revoke_fields_check check (
    (status = 'revoked' and revoked_at is not null)
    or (status <> 'revoked' and revoked_at is null)
  )
);

create unique index if not exists workspace_invites_token_hash_key
  on public.workspace_invites (token_hash);

create unique index if not exists workspace_invites_active_email_key
  on public.workspace_invites (workspace_id, lower(email))
  where status = 'pending';

create index if not exists workspace_invites_workspace_status_idx
  on public.workspace_invites (workspace_id, status, created_at desc);

create index if not exists workspace_invites_email_idx
  on public.workspace_invites (lower(email));

drop trigger if exists set_workspace_invites_updated_at on public.workspace_invites;
create trigger set_workspace_invites_updated_at
before update on public.workspace_invites
for each row execute function public.set_updated_at();

alter table public.workspace_invites enable row level security;

drop policy if exists "owners can manage workspace invites" on public.workspace_invites;
create policy "owners can manage workspace invites"
on public.workspace_invites
for all
using (public.user_is_workspace_owner(workspace_id))
with check (public.user_is_workspace_owner(workspace_id));
