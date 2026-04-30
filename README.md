# Anchor Studios OS

Anchor Studios OS is an internal sales operating system for Anchor Studios. The current build includes the authenticated shell, workspace-aware CRM foundation, an import-first lead creation flow based on Google Maps links, a job-based discovery workflow for sweeping large areas and finding restaurants without websites, smart route planning for in-person field prospecting, and an in-app interactive route map for running field sessions inside the OS.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui-style component setup
- Supabase auth + Postgres
- React Hook Form + Zod
- Lucide icons

## Current features

- Email/password sign up and sign in with Supabase
- Protected app routes for authenticated users only
- Seeded `Anchor Studios` workspace
- Automatic user provisioning into the shared workspace on signup
- CRM schema for `workspaces`, `workspace_members`, `profiles`, `leads`, `lead_notes`, `outreach_events`, `visits`, `proposals`, `routes`, and `route_stops`
- Working dashboard, leads list, lead detail, notes, outreach, visits, and stage management
- Primary lead creation via Google Maps import with manual entry as a fallback
- Exact-region discovery jobs using a directly drawn rectangle or center-radius region
- Quick-area discovery as a secondary geocoded preview mode
- Search progress tracking with persisted jobs, geometry-aware sweeps, and final no-website discovery results
- Persistent Discovery map workspace with final result markers after each sweep
- CRM dedupe and direct import from discovery results
- Smart route generation from CRM leads, Discovery results, or auto-pick rules
- Google Routes optimization for one-driver field plans
- Saved route detail pages with in-progress stop tracking and visit logging back into the CRM
- In-app Google Maps JavaScript route view with numbered stop markers, synced stop list, and mobile route workflow

## Local setup

1. Install dependencies with `npm install`.
2. Create a Supabase project.
3. Run the SQL migrations in order:
   - [supabase/migrations/202604100001_phase_1.sql](/C:/Users/Cheic/anchoros/supabase/migrations/202604100001_phase_1.sql)
   - [supabase/migrations/202604100002_phase_2_crm.sql](/C:/Users/Cheic/anchoros/supabase/migrations/202604100002_phase_2_crm.sql)
   - [supabase/migrations/202604100003_google_maps_import.sql](/C:/Users/Cheic/anchoros/supabase/migrations/202604100003_google_maps_import.sql)
   - [supabase/migrations/202604100004_fix_workspace_rls_recursion.sql](/C:/Users/Cheic/anchoros/supabase/migrations/202604100004_fix_workspace_rls_recursion.sql)
   - [supabase/migrations/202604100005_discovery_jobs.sql](/C:/Users/Cheic/anchoros/supabase/migrations/202604100005_discovery_jobs.sql)
   - [supabase/migrations/202604100006_phase_4_routes.sql](/C:/Users/Cheic/anchoros/supabase/migrations/202604100006_phase_4_routes.sql)
   - [supabase/migrations/202604120001_phase_4b_route_map.sql](/C:/Users/Cheic/anchoros/supabase/migrations/202604120001_phase_4b_route_map.sql)
   - [supabase/migrations/202604130001_discovery_exact_regions.sql](/C:/Users/Cheic/anchoros/supabase/migrations/202604130001_discovery_exact_regions.sql)
4. Optional for local development: seed a few realistic leads with [supabase/seeds/phase_2_demo_leads.sql](/C:/Users/Cheic/anchoros/supabase/seeds/phase_2_demo_leads.sql).
5. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_MAPS_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`
6. For this build, use one shared Google Maps key across the app:
   - set `GOOGLE_MAPS_API_KEY` to your shared key
   - set `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` to that same exact key
7. Enable Google Places API, Geocoding API, Google Routes API, and Maps JavaScript API for the Google Maps project that owns that shared key.
8. Create a JavaScript Map ID in Google Cloud, apply your Anchor Studios map style to it, and set that value in `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`.
9. This shared-key setup is intended only for local testing. You can split browser/server keys later without changing the feature architecture.
10. For the smoothest local flow, disable email confirmation in Supabase Auth while testing sign-up. If confirmation stays enabled, users must confirm email before logging in.
11. Start the app with `npm run dev` and open `http://localhost:3000`.

## Auth and workspace behavior

- Every new user gets a `profiles` row from the `auth.users` trigger.
- Every new user is automatically added to the seeded `Anchor Studios` workspace.
- The first user added becomes `owner`; later users become `member`.
- RLS policies scope business tables by `workspace_id`.
- Google Maps imports run server-side through Google Places and save place metadata like Maps URL, place ID, rating, review count, price level, and business status on the lead.
- Discovery jobs support two modes:
  - `Exact region`: use the in-app map to draw a rectangle directly with click-and-drag or use a center + radius region, then sweep only that geometry.
  - `Quick area`: geocode a typed area, preview the resolved region on the map, and then run the sweep from that approved geometry.
- Rectangle drawing is implemented directly on top of the Google Maps JavaScript API. It does not use the deprecated Google Drawing Library.
- Discovery jobs use Google Geocoding plus Places Nearby Search, persist progress, enforce a minimum review threshold, recheck website presence with detail enrichment, and store final no-website prospects in `discovery_jobs` and `discovery_job_results`.
- The default Discovery minimum review threshold is `10`, and subtype input now affects backend filtering and ranking through strict or broad subtype modes.
- After a Discovery job completes, final saved prospects remain visible on the Discovery map as interactive markers that stay in sync with the result list.
- Smart routes use Google Geocoding for origin/destination resolution and Google Routes for stop-order optimization, while route progress and stop outcomes persist in `routes` and `route_stops`.
- The in-app route page uses the Maps JavaScript API plus your Map ID to render branded route geometry, numbered stop markers, and synced stop interactions inside the OS.
- For the current local-testing setup, both server-side Google features and the in-app browser map use the same shared key value through `GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`.

## Commands

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Notes

- This build still does not include proposal generation, lead scoring, website audits, open-now logic, or photo-based opportunity analysis.
- If Supabase env vars are missing, the app falls back to a no-auth preview shell so the interface can still be viewed locally.
- The primary lead creation path is now Google Maps import, discovery job results can feed directly into the same review-and-save flow, and routes can be generated from leads, discovery results, or auto-pick defaults without manual stop ordering.
- If `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` or `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` is missing, the route page still works, but the in-app map falls back to a non-interactive placeholder and Google Maps handoff remains available as the backup path.
