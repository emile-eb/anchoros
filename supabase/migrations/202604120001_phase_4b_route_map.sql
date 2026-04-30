alter type public.route_status add value if not exists 'paused';

alter type public.route_stop_status add value if not exists 'active';
alter type public.route_stop_status add value if not exists 'revisit_needed';

update public.route_stops
set status = 'completed'
where status = 'visited';
