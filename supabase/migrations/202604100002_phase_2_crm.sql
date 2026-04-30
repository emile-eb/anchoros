alter type public.lead_stage add value if not exists 'researching';
alter type public.lead_stage add value if not exists 'follow_up';
alter type public.lead_stage add value if not exists 'meeting_scheduled';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'website_status') then
    create type public.website_status as enum (
      'no_website',
      'outdated_website',
      'decent_website',
      'strong_website',
      'unknown'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_source') then
    create type public.lead_source as enum (
      'walk_in',
      'referral',
      'google_maps',
      'instagram',
      'cold_outreach',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_priority') then
    create type public.lead_priority as enum ('low', 'medium', 'high');
  end if;

  if not exists (select 1 from pg_type where typname = 'outreach_outcome') then
    create type public.outreach_outcome as enum (
      'no_response',
      'spoke_to_staff',
      'spoke_to_owner',
      'interested',
      'not_interested',
      'follow_up_needed',
      'meeting_booked'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'visit_outcome') then
    create type public.visit_outcome as enum (
      'not_open',
      'staff_only',
      'owner_not_there',
      'spoke_to_owner',
      'left_card',
      'revisit_needed'
    );
  end if;
end
$$;

alter type public.outreach_type add value if not exists 'in_person';
alter type public.outreach_type add value if not exists 'instagram_dm';

alter table public.leads rename column company_name to restaurant_name;
alter table public.leads rename column contact_email to email;
alter table public.leads rename column contact_phone to phone;
alter table public.leads rename column website_url to existing_website_url;
alter table public.leads rename column stage to lead_stage;
alter table public.leads rename column source to lead_source;
alter table public.leads rename column notes to status_notes;

alter table public.leads
  add column created_by uuid references public.profiles (id) on delete set null,
  add column instagram_handle text,
  add column address text,
  add column neighborhood text,
  add column borough text,
  add column cuisine text,
  add column website_status public.website_status not null default 'unknown',
  add column estimated_project_price integer,
  add column estimated_price_low integer,
  add column estimated_price_high integer,
  add column last_contacted_at timestamptz,
  add column next_follow_up_at timestamptz,
  add column priority public.lead_priority not null default 'medium',
  add column archived_at timestamptz;

update public.leads
set lead_stage = 'researching'
where lead_stage = 'qualified';

update public.leads
set lead_stage = 'follow_up'
where lead_stage = 'on_hold';

update public.leads
set website_status = case
  when existing_website_url is null or btrim(existing_website_url) = '' then 'no_website'::public.website_status
  else 'unknown'::public.website_status
end;

update public.leads
set address = nullif(
  concat_ws(
    ', ',
    nullif(address_line_1, ''),
    nullif(address_line_2, ''),
    nullif(city, ''),
    nullif(state, ''),
    nullif(zip_code, '')
  ),
  ''
)
where address is null;

alter table public.leads
  alter column lead_stage set default 'new',
  alter column lead_source type public.lead_source
    using (
      case lower(coalesce(lead_source, ''))
        when 'walk_in' then 'walk_in'::public.lead_source
        when 'referral' then 'referral'::public.lead_source
        when 'google_maps' then 'google_maps'::public.lead_source
        when 'instagram' then 'instagram'::public.lead_source
        when 'cold_outreach' then 'cold_outreach'::public.lead_source
        else 'other'::public.lead_source
      end
    ),
  alter column lead_source set default 'other',
  alter column restaurant_name set not null;

create index if not exists leads_workspace_stage_idx on public.leads (workspace_id, lead_stage);
create index if not exists leads_workspace_updated_idx on public.leads (workspace_id, updated_at desc);
create index if not exists leads_workspace_follow_up_idx on public.leads (workspace_id, next_follow_up_at);
create index if not exists leads_workspace_priority_idx on public.leads (workspace_id, priority);
create index if not exists leads_workspace_source_idx on public.leads (workspace_id, lead_source);

update public.outreach_events
set channel = 'in_person'
where channel = 'visit';

update public.outreach_events
set channel = 'instagram_dm'
where channel = 'social';

alter table public.outreach_events rename column channel to outreach_type;
alter table public.outreach_events rename column notes to summary;

alter table public.outreach_events
  add column next_follow_up_at timestamptz;

update public.outreach_events
set summary = coalesce(summary, '');

alter table public.outreach_events
  alter column summary set not null,
  alter column outcome type public.outreach_outcome
    using (
      case lower(coalesce(outcome, ''))
        when 'no_response' then 'no_response'::public.outreach_outcome
        when 'spoke_to_staff' then 'spoke_to_staff'::public.outreach_outcome
        when 'spoke_to_owner' then 'spoke_to_owner'::public.outreach_outcome
        when 'interested' then 'interested'::public.outreach_outcome
        when 'not_interested' then 'not_interested'::public.outreach_outcome
        when 'follow_up_needed' then 'follow_up_needed'::public.outreach_outcome
        when 'meeting_booked' then 'meeting_booked'::public.outreach_outcome
        else null
      end
    );

create index if not exists outreach_events_lead_occurred_idx
  on public.outreach_events (lead_id, occurred_at desc);

alter table public.visits rename column created_by to visited_by;

alter table public.visits
  add column best_time_to_return text;

alter table public.visits
  alter column outcome type public.visit_outcome
    using (
      case lower(coalesce(outcome, ''))
        when 'not_open' then 'not_open'::public.visit_outcome
        when 'staff_only' then 'staff_only'::public.visit_outcome
        when 'owner_not_there' then 'owner_not_there'::public.visit_outcome
        when 'spoke_to_owner' then 'spoke_to_owner'::public.visit_outcome
        when 'left_card' then 'left_card'::public.visit_outcome
        when 'revisit_needed' then 'revisit_needed'::public.visit_outcome
        else null
      end
    );

create index if not exists visits_lead_visited_idx
  on public.visits (lead_id, visited_at desc);
