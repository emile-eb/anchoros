import { cache } from "react";
import { notFound } from "next/navigation";
import type {
  Database,
  RouteSourceType,
} from "@/lib/types/database";
import { hasGoogleMapsEnv, hasSupabaseEnv } from "@/lib/env";
import { geocodeAreaQuery } from "@/lib/google-maps/geocoding";
import { buildGoogleMapsDirectionsUrl, computeRouteMapSegments } from "@/lib/google-maps/routes";
import type { RouteCoordinate } from "@/lib/google-maps/routes";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/workspace";
import type { DiscoveryJobResultRow } from "@/lib/data/discovery-jobs";
import type { RouteMapSegment } from "@/lib/routes/types";

export type RouteListItem = Database["public"]["Tables"]["routes"]["Row"] & {
  creator: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email"> | null;
};

export type RouteStopDetail = Database["public"]["Tables"]["route_stops"]["Row"] & {
  lead: Pick<
    Database["public"]["Tables"]["leads"]["Row"],
    "id" | "restaurant_name" | "lead_stage" | "phone" | "website_status"
  > | null;
  latestVisit: Pick<
    Database["public"]["Tables"]["visits"]["Row"],
    "id" | "visited_at" | "outcome" | "notes"
  > | null;
};

export type RouteDetail = Database["public"]["Tables"]["routes"]["Row"] & {
  creator: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email"> | null;
};

export type RouteMapData = {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  segments: RouteMapSegment[];
  googleMapsUrl: string | null;
  googleMapsWarning: string | null;
};

export type RouteCandidate = {
  id: string;
  source: RouteSourceType;
  leadId: string | null;
  discoveryJobResultId: string | null;
  googlePlaceId: string | null;
  restaurantName: string;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  primaryType: string | null;
  websiteStatus: Database["public"]["Enums"]["website_status"];
  lastVisitedAt: string | null;
  leadStage: Database["public"]["Enums"]["lead_stage"] | null;
  onActiveRoute: boolean;
  reason: string;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function resolveCoordinateFromRouteLabel(
  label: string | null,
  latitude: number | null,
  longitude: number | null,
) {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return { latitude, longitude };
  }

  if (!label) {
    return null;
  }

  try {
    const geocoded = await geocodeAreaQuery(label);
    return geocoded.location;
  } catch {
    return null;
  }
}

async function hydrateRouteStopCoordinates(stops: Database["public"]["Tables"]["route_stops"]["Row"][]) {
  const hydrated = [];

  for (const stop of stops) {
    if (typeof stop.latitude === "number" && typeof stop.longitude === "number") {
      hydrated.push(stop);
      continue;
    }

    const query = stop.formatted_address || stop.restaurant_name;
    if (!query) {
      hydrated.push(stop);
      continue;
    }

    try {
      const geocoded = await geocodeAreaQuery(query);
      hydrated.push({
        ...stop,
        latitude: geocoded.location.latitude,
        longitude: geocoded.location.longitude,
      });
    } catch {
      hydrated.push(stop);
    }
  }

  return hydrated;
}

export async function getRouteMapData(
  route: Database["public"]["Tables"]["routes"]["Row"],
  stops: Database["public"]["Tables"]["route_stops"]["Row"][],
): Promise<RouteMapData | null> {
  if (!hasGoogleMapsEnv()) {
    return null;
  }

  const hydratedStops = await hydrateRouteStopCoordinates(stops);
  const origin = await resolveCoordinateFromRouteLabel(
    route.origin_label,
    route.origin_latitude,
    route.origin_longitude,
  );
  const destination = await resolveCoordinateFromRouteLabel(
    route.destination_label,
    route.destination_latitude,
    route.destination_longitude,
  );

  if (!origin || !destination) {
    return null;
  }

  const routeStops = hydratedStops
    .filter(
      (stop): stop is typeof stop & { latitude: number; longitude: number } =>
        typeof stop.latitude === "number" && typeof stop.longitude === "number",
    )
    .map((stop) => ({
      id: stop.id,
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));

  const segments = routeStops.length
    ? await computeRouteMapSegments({
        origin,
        destination,
        stops: routeStops,
      })
    : [];

  const googleMaps = buildGoogleMapsDirectionsUrl({
    origin: route.origin_label ?? route.destination_label ?? "Start location",
    destination: route.destination_label ?? route.origin_label ?? "End location",
    waypoints: stops
      .map((stop) => stop.formatted_address || stop.restaurant_name)
      .filter((value): value is string => Boolean(value))
      .slice(0, 25),
  });

  return {
    origin,
    destination,
    segments,
    googleMapsUrl: googleMaps.ok ? googleMaps.url : null,
    googleMapsWarning: googleMaps.ok ? null : googleMaps.reason,
  };
}

export function scoreRouteCandidate(input: {
  candidate: RouteCandidate;
  neighborhood?: string;
}) {
  let score = 0;

  if (input.candidate.websiteStatus === "no_website") score += 50;
  if (input.candidate.leadStage && !["won", "lost"].includes(input.candidate.leadStage)) score += 20;
  if (!input.candidate.lastVisitedAt) score += 15;
  if (input.candidate.onActiveRoute) score -= 50;
  if (
    input.neighborhood &&
    normalizeText(input.candidate.formattedAddress).includes(normalizeText(input.neighborhood))
  ) {
    score += 10;
  }

  return score;
}

export async function getRoutesPageData() {
  const { workspace } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    return {
      workspace,
      routes: [] as RouteListItem[],
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const creatorIds = Array.from(
    new Set(
      (data ?? [])
        .map((route) => route.created_by)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const creatorsResponse = creatorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", creatorIds)
    : { data: [], error: null };

  if (creatorsResponse.error) throw new Error(creatorsResponse.error.message);

  const creatorMap = new Map((creatorsResponse.data ?? []).map((profile) => [profile.id, profile]));

  return {
    workspace,
    routes: (data ?? []).map((route) => ({
      ...route,
      creator: route.created_by ? creatorMap.get(route.created_by) ?? null : null,
    })) as RouteListItem[],
  };
}

export const getRouteDetailPageData = cache(async (routeId: string) => {
  const { workspace } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    notFound();
  }

  const supabase = await createClient();

  const { data: routeData, error: routeError } = await supabase
    .from("routes")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("id", routeId)
    .single();

  if (routeError || !routeData) {
    notFound();
  }

  const [creatorResponse, stopsResponse] = await Promise.all([
    routeData.created_by
      ? supabase.from("profiles").select("id, full_name, email").eq("id", routeData.created_by).single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("route_stops")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("route_id", routeId)
      .order("stop_order", { ascending: true }),
  ]);

  if (stopsResponse.error) throw new Error(stopsResponse.error.message);

  const leadIds = (stopsResponse.data ?? []).map((stop) => stop.lead_id).filter(Boolean) as string[];
  const stopRows = stopsResponse.data ?? [];
  const hydratedStopRows = await hydrateRouteStopCoordinates(stopRows);
  const leadsResponse = leadIds.length
    ? await supabase
        .from("leads")
        .select("id, restaurant_name, lead_stage, phone, website_status")
        .in("id", leadIds)
    : { data: [], error: null };

  if (leadsResponse.error) throw new Error(leadsResponse.error.message);

  const leadMap = new Map((leadsResponse.data ?? []).map((lead) => [lead.id, lead]));
  const visitsResponse = leadIds.length
    ? await supabase
        .from("visits")
        .select("id, lead_id, visited_at, outcome, notes")
        .eq("workspace_id", workspace.id)
        .in("lead_id", leadIds)
        .order("visited_at", { ascending: false })
    : { data: [], error: null };

  if (visitsResponse.error) throw new Error(visitsResponse.error.message);

  const latestVisitMap = new Map<string, (typeof visitsResponse.data)[number]>();
  for (const visit of visitsResponse.data ?? []) {
    if (visit?.lead_id && !latestVisitMap.has(visit.lead_id)) {
      latestVisitMap.set(visit.lead_id, visit);
    }
  }

  const mapData = await getRouteMapData(routeData, hydratedStopRows);

  return {
    route: {
      ...routeData,
      creator: creatorResponse.data ?? null,
    } as RouteDetail,
    stops: hydratedStopRows.map((stop) => ({
      ...stop,
      lead: stop.lead_id ? leadMap.get(stop.lead_id) ?? null : null,
      latestVisit: stop.lead_id ? latestVisitMap.get(stop.lead_id) ?? null : null,
    })) as RouteStopDetail[],
    mapData,
  };
});

export async function resolveSelectedLeadCandidates(leadIds: string[]) {
  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", workspace.id)
    .in("id", leadIds)
    .is("archived_at", null);

  if (error) throw new Error(error.message);

  const { data: visits } = await supabase
    .from("visits")
    .select("lead_id, visited_at")
    .eq("workspace_id", workspace.id)
    .in("lead_id", leadIds)
    .order("visited_at", { ascending: false });

  const latestVisitByLead = new Map<string, string>();
  for (const visit of visits ?? []) {
    if (!latestVisitByLead.has(visit.lead_id)) {
      latestVisitByLead.set(visit.lead_id, visit.visited_at);
    }
  }

  return (leads ?? []).map((lead) => ({
    id: `lead:${lead.id}`,
    source: "crm" as RouteSourceType,
    leadId: lead.id,
    discoveryJobResultId: null,
    googlePlaceId: lead.google_place_id,
    restaurantName: lead.restaurant_name,
    formattedAddress: lead.address,
    latitude: null,
    longitude: null,
    primaryType: lead.google_primary_type ?? lead.cuisine,
    websiteStatus: lead.website_status,
    lastVisitedAt: latestVisitByLead.get(lead.id) ?? null,
    leadStage: lead.lead_stage,
    onActiveRoute: false,
    reason: "Selected from CRM leads",
  }));
}

export async function resolveSelectedDiscoveryCandidates(resultIds: string[]) {
  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("discovery_job_results")
    .select("*")
    .eq("workspace_id", workspace.id)
    .in("id", resultIds);

  if (error) throw new Error(error.message);

  return ((data ?? []) as DiscoveryJobResultRow[]).map((row) => ({
    id: `discovery:${row.id}`,
    source: "discovery" as RouteSourceType,
    leadId: row.existing_lead_id,
    discoveryJobResultId: row.id,
    googlePlaceId: row.google_place_id,
    restaurantName: row.restaurant_name,
    formattedAddress: row.formatted_address,
    latitude: row.latitude,
    longitude: row.longitude,
    primaryType: row.primary_type,
    websiteStatus: row.website_status,
    lastVisitedAt: null,
    leadStage: null,
    onActiveRoute: false,
    reason: "Selected from Discovery results",
  }));
}

export async function getAutoPickRouteCandidates(input: {
  sourceFilter: RouteSourceType;
  neighborhood?: string;
  excludeVisitedRecently?: boolean;
}) {
  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();

  const [leadsResponse, discoveryResponse, activeStopsResponse, visitsResponse] = await Promise.all([
    input.sourceFilter === "discovery"
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("leads")
          .select("*")
          .eq("workspace_id", workspace.id)
          .is("archived_at", null)
          .neq("lead_stage", "won")
          .neq("lead_stage", "lost"),
    input.sourceFilter === "crm"
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from("discovery_job_results")
          .select("*")
          .eq("workspace_id", workspace.id),
    supabase
      .from("route_stops")
      .select("lead_id, discovery_job_result_id, routes!inner(status)")
      .eq("workspace_id", workspace.id)
      .in("routes.status", ["draft", "ready", "in_progress"]),
    supabase
      .from("visits")
      .select("lead_id, visited_at")
      .eq("workspace_id", workspace.id)
      .order("visited_at", { ascending: false }),
  ]);

  if (leadsResponse.error) throw new Error(leadsResponse.error.message);
  if (discoveryResponse.error) throw new Error(discoveryResponse.error.message);
  if (activeStopsResponse.error) throw new Error(activeStopsResponse.error.message);
  if (visitsResponse.error) throw new Error(visitsResponse.error.message);

  const activeStops = (activeStopsResponse.data ?? []) as Array<{
    lead_id: string | null;
    discovery_job_result_id: string | null;
  }>;
  const activeLeadIds = new Set(
    activeStops.map((stop) => stop.lead_id).filter((value): value is string => Boolean(value)),
  );
  const activeDiscoveryIds = new Set(
    activeStops
      .map((stop) => stop.discovery_job_result_id)
      .filter((value): value is string => Boolean(value)),
  );
  const latestVisitByLead = new Map<string, string>();
  for (const visit of visitsResponse.data ?? []) {
    if (!latestVisitByLead.has(visit.lead_id)) {
      latestVisitByLead.set(visit.lead_id, visit.visited_at);
    }
  }

  const crmCandidates = (leadsResponse.data ?? []).map((lead) => ({
    id: `lead:${lead.id}`,
    source: "crm" as RouteSourceType,
    leadId: lead.id,
    discoveryJobResultId: null,
    googlePlaceId: lead.google_place_id,
    restaurantName: lead.restaurant_name,
    formattedAddress: lead.address,
    latitude: null,
    longitude: null,
    primaryType: lead.google_primary_type ?? lead.cuisine,
    websiteStatus: lead.website_status,
    lastVisitedAt: latestVisitByLead.get(lead.id) ?? null,
    leadStage: lead.lead_stage,
    onActiveRoute: activeLeadIds.has(lead.id),
    reason: "Auto-picked from CRM",
  }));

  const discoveryCandidates = ((discoveryResponse.data ?? []) as DiscoveryJobResultRow[])
    .filter((row) => row.website_status === "no_website")
    .map((row) => ({
      id: `discovery:${row.id}`,
      source: "discovery" as RouteSourceType,
      leadId: row.existing_lead_id,
      discoveryJobResultId: row.id,
      googlePlaceId: row.google_place_id,
      restaurantName: row.restaurant_name,
      formattedAddress: row.formatted_address,
      latitude: row.latitude,
      longitude: row.longitude,
      primaryType: row.primary_type,
      websiteStatus: row.website_status,
      lastVisitedAt: row.existing_lead_id ? latestVisitByLead.get(row.existing_lead_id) ?? null : null,
      leadStage: null,
      onActiveRoute: activeDiscoveryIds.has(row.id),
      reason: "Auto-picked from Discovery",
    }));

  return [...crmCandidates, ...discoveryCandidates];
}
