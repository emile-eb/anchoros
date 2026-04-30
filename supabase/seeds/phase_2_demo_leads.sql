with workspace_owner as (
  select wm.user_id
  from public.workspace_members wm
  where wm.workspace_id = '11111111-1111-1111-1111-111111111111'
  order by wm.created_at asc
  limit 1
)
insert into public.leads (
  workspace_id,
  created_by,
  restaurant_name,
  contact_name,
  phone,
  email,
  instagram_handle,
  address,
  neighborhood,
  borough,
  cuisine,
  existing_website_url,
  website_status,
  lead_source,
  lead_stage,
  estimated_project_price,
  estimated_price_low,
  estimated_price_high,
  last_contacted_at,
  next_follow_up_at,
  priority,
  status_notes
)
select
  '11111111-1111-1111-1111-111111111111',
  workspace_owner.user_id,
  seed.restaurant_name,
  seed.contact_name,
  seed.phone,
  seed.email,
  seed.instagram_handle,
  seed.address,
  seed.neighborhood,
  seed.borough,
  seed.cuisine,
  seed.existing_website_url,
  seed.website_status::public.website_status,
  seed.lead_source::public.lead_source,
  seed.lead_stage::public.lead_stage,
  seed.estimated_project_price,
  seed.estimated_price_low,
  seed.estimated_price_high,
  seed.last_contacted_at,
  seed.next_follow_up_at,
  seed.priority::public.lead_priority,
  seed.status_notes
from workspace_owner
cross join (
  values
    (
      'Franklin Oven',
      'Marco Silva',
      '(718) 555-0124',
      'marco@franklinoven.com',
      '@franklinoven',
      '212 Franklin St, Brooklyn, NY',
      'Greenpoint',
      'Brooklyn',
      'Wood-fired pizza',
      '',
      'no_website',
      'walk_in',
      'new',
      9000,
      7000,
      12000,
      null::timestamptz,
      now() + interval '2 day',
      'high',
      'Strong food and traffic. Owner mentioned needing a cleaner online presence before patio season.'
    ),
    (
      'Aster Cafe',
      'Nina Patel',
      '(646) 555-0191',
      'nina@astercafe.com',
      '@astercafenyc',
      '44 Orchard St, New York, NY',
      'Lower East Side',
      'Manhattan',
      'Cafe',
      'https://astercafe.co',
      'outdated_website',
      'instagram',
      'follow_up',
      null,
      6000,
      9500,
      now() - interval '3 day',
      now() + interval '1 day',
      'medium',
      'Spoke with owner on Instagram. Interested after brunch photo shoot wraps next week.'
    ),
    (
      'Sora Handroll',
      'Devin Chen',
      '(917) 555-0177',
      'hello@sorahandroll.com',
      '@sorahandroll',
      '88 Vernon Blvd, Queens, NY',
      'Long Island City',
      'Queens',
      'Japanese',
      'https://sorahandroll.com',
      'decent_website',
      'referral',
      'meeting_scheduled',
      15000,
      13000,
      18000,
      now() - interval '1 day',
      now() + interval '4 day',
      'high',
      'Referral from existing client. Meeting booked to review menu refresh and online ordering flow.'
    )
) as seed (
  restaurant_name,
  contact_name,
  phone,
  email,
  instagram_handle,
  address,
  neighborhood,
  borough,
  cuisine,
  existing_website_url,
  website_status,
  lead_source,
  lead_stage,
  estimated_project_price,
  estimated_price_low,
  estimated_price_high,
  last_contacted_at,
  next_follow_up_at,
  priority,
  status_notes
)
where not exists (
  select 1
  from public.leads l
  where l.workspace_id = '11111111-1111-1111-1111-111111111111'
);
