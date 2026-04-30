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

drop policy if exists "members can view workspace memberships" on public.workspace_members;

create policy "members can view workspace memberships"
on public.workspace_members
for select
using (
  user_id = auth.uid()
  or public.user_in_workspace(workspace_id)
);
