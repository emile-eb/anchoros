"use server";

import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "@/lib/data/workspace";
import {
  getAutoPickRouteCandidates,
  getRouteDetailPageData,
  resolveSelectedDiscoveryCandidates,
  resolveSelectedLeadCandidates,
  scoreRouteCandidate,
} from "@/lib/data/routes";
import { hasGoogleMapsEnv, hasSupabaseEnv } from "@/lib/env";
import { geocodeAreaQuery } from "@/lib/google-maps/geocoding";
import {
  buildGoogleMapsDirectionsUrl,
  computeOptimizedDrivingRoute,
} from "@/lib/google-maps/routes";
import { createClient } from "@/lib/supabase/server";
import type { RouteSourceType, RouteStatus, RouteStopStatus } from "@/lib/types/database";
import type { RoutePreview, RouteSavedSummary, RouteStopUpdateInput } from "@/lib/routes/types";
import { routeGenerationSchema, type RouteGenerationValues } from "@/lib/validators/routes";

type ActionState =
  | { ok: true; route?: RouteSavedSummary; preview?: RoutePreview }
  | { ok: false; error: string };

function revalidateRoutePaths(routeId?: string) {
  revalidatePath("/routes");
  revalidatePath("/leads");
  revalidatePath("/discovery");
  if (routeId) {
    revalidatePath(`/routes/${routeId}`);
  }
}

function approximateDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const dx = (a.longitude - b.longitude) * 85_000;
  const dy = (a.latitude - b.latitude) * 111_000;
  return Math.sqrt(dx * dx + dy * dy);
}

async function hydrateCandidateCoordinates<
  T extends {
    formattedAddress: string | null;
    restaurantName: string;
    latitude: number | null;
    longitude: number | null;
  },
>(candidates: T[]) {
  const hydrated: Array<T & { latitude: number; longitude: number }> = [];

  for (const candidate of candidates) {
    if (typeof candidate.latitude === "number" && typeof candidate.longitude === "number") {
      hydrated.push(candidate as T & { latitude: number; longitude: number });
      continue;
    }

    const query = candidate.formattedAddress || candidate.restaurantName;
    if (!query) {
      continue;
    }

    try {
      const geocoded = await geocodeAreaQuery(query);
      hydrated.push({
        ...candidate,
        latitude: geocoded.location.latitude,
        longitude: geocoded.location.longitude,
      });
    } catch {}
  }

  return hydrated;
}

async function buildRoutePreview(values: RouteGenerationValues): Promise<RoutePreview> {
  const sourceType: RouteSourceType =
    values.lead_ids.length > 0 && values.discovery_result_ids.length > 0
      ? "both"
      : values.discovery_result_ids.length > 0
        ? "discovery"
        : values.lead_ids.length > 0
          ? "crm"
          : "auto_pick";

  const originArea = await geocodeAreaQuery(values.start_location);
  const destinationArea = values.end_location
    ? await geocodeAreaQuery(values.end_location)
    : originArea;

  const selectedLeadCandidates = values.lead_ids.length
    ? await resolveSelectedLeadCandidates(values.lead_ids)
    : [];
  const selectedDiscoveryCandidates = values.discovery_result_ids.length
    ? await resolveSelectedDiscoveryCandidates(values.discovery_result_ids)
    : [];

  const autoCandidates =
    selectedLeadCandidates.length === 0 && selectedDiscoveryCandidates.length === 0
      ? await getAutoPickRouteCandidates({
          sourceFilter: values.source_filter,
          neighborhood: values.neighborhood_focus || undefined,
          excludeVisitedRecently: values.exclude_recently_visited,
        })
      : [];

  const pool = [...selectedLeadCandidates, ...selectedDiscoveryCandidates, ...autoCandidates];

  if (pool.length === 0) {
    throw new Error("No route candidates were found for this route.");
  }

  const hydratedPool = await hydrateCandidateCoordinates(pool);

  const recentlyVisitedCutoff = Date.now() - 1000 * 60 * 60 * 24 * 14;
  const filteredPool = hydratedPool.filter((candidate) => {
    if (candidate.onActiveRoute) {
      return false;
    }

    if (
      values.exclude_recently_visited &&
      candidate.lastVisitedAt &&
      new Date(candidate.lastVisitedAt).getTime() >= recentlyVisitedCutoff
    ) {
      return false;
    }

    return true;
  });

  if (filteredPool.length === 0) {
    throw new Error("Every candidate was excluded by the current route rules.");
  }

  const rankedPool = filteredPool
    .map((candidate) => ({
      ...candidate,
      routeScore:
        scoreRouteCandidate({
          candidate,
          neighborhood: values.neighborhood_focus || undefined,
        }) -
        approximateDistanceMeters(originArea.location, {
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        }) /
          1_000,
    }))
    .sort((a, b) => b.routeScore - a.routeScore)
    .slice(0, values.max_stops);

  const optimized = await computeOptimizedDrivingRoute({
    origin: originArea.location,
    destination: destinationArea.location,
    stops: rankedPool.map((candidate) => ({
      id: candidate.id,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
    })),
  });

  const stopMap = new Map(rankedPool.map((candidate) => [candidate.id, candidate]));
  const orderedStops = optimized.orderedStops.map((stop, index) => {
    const candidate = stopMap.get(stop.id);
    if (!candidate) {
      throw new Error("Route optimization returned an unknown stop.");
    }

    return {
      sourceType: candidate.source,
      leadId: candidate.leadId,
      discoveryJobResultId: candidate.discoveryJobResultId,
      googlePlaceId: candidate.googlePlaceId,
      restaurantName: candidate.restaurantName,
      formattedAddress: candidate.formattedAddress,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      stopOrder: index + 1,
      reason: candidate.reason,
    };
  });

  const googleMaps = buildGoogleMapsDirectionsUrl({
    origin: values.start_location,
    destination: values.end_location || values.start_location,
    waypoints: orderedStops.map((stop) => stop.formattedAddress || stop.restaurantName),
  });

  const whyTheseStops =
    sourceType === "auto_pick"
      ? [
          "No-website prospects were prioritized first.",
          values.neighborhood_focus
            ? `Stops near ${values.neighborhood_focus} were favored.`
            : "Stops near your start location were favored.",
          "Recently visited places and active-route stops were filtered out when possible.",
        ]
      : [
          "These stops came from your selected prospects.",
          "The order was optimized for one driver using Google Routes.",
          "Start and end points were kept aligned with your requested field plan.",
        ];

  return {
    routeName: values.route_name,
    sourceType,
    originLabel: values.start_location,
    destinationLabel: values.end_location || values.start_location,
    origin: originArea.location,
    destination: destinationArea.location,
    totalStops: orderedStops.length,
    estimatedDurationMinutes: optimized.estimatedDurationMinutes,
    estimatedDistanceMeters: optimized.estimatedDistanceMeters,
    whyTheseStops,
    stops: orderedStops,
    googleMapsUrl: googleMaps.ok ? googleMaps.url : null,
    googleMapsWarning: googleMaps.ok ? null : googleMaps.reason,
  };
}

export async function generateRoutePreviewAction(input: RouteGenerationValues): Promise<ActionState> {
  if (!hasSupabaseEnv() || !hasGoogleMapsEnv()) {
    return { ok: false, error: "Routing requires Supabase and Google Maps to be configured." };
  }

  const parsed = routeGenerationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid route request." };
  }

  try {
    const preview = await buildRoutePreview(parsed.data);
    return { ok: true, preview };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not generate route.",
    };
  }
}

export async function saveRouteAction(preview: RoutePreview): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to save routes." };
  }

  try {
    const { workspace, profile } = await getWorkspaceContext();
    const supabase = await createClient();

    const { data: route, error: routeError } = await supabase
      .from("routes")
      .insert({
        workspace_id: workspace.id,
        name: preview.routeName,
        status: "ready",
        source_type: preview.sourceType,
        origin_label: preview.originLabel,
        destination_label: preview.destinationLabel,
        origin_latitude: preview.origin.latitude,
        origin_longitude: preview.origin.longitude,
        destination_latitude: preview.destination.latitude,
        destination_longitude: preview.destination.longitude,
        total_stops: preview.totalStops,
        estimated_duration_minutes: preview.estimatedDurationMinutes,
        estimated_distance_meters: preview.estimatedDistanceMeters,
        created_by: profile.id,
      })
      .select("id, name, status")
      .single();

    if (routeError || !route) {
      return { ok: false, error: routeError?.message ?? "Unable to save route." };
    }

    const stopInsert = preview.stops.map((stop) => ({
      workspace_id: workspace.id,
      route_id: route.id,
      lead_id: stop.leadId,
      discovery_job_result_id: stop.discoveryJobResultId,
      google_place_id: stop.googlePlaceId,
      stop_order: stop.stopOrder,
      restaurant_name: stop.restaurantName,
      formatted_address: stop.formattedAddress,
      latitude: stop.latitude,
      longitude: stop.longitude,
      status: "pending" as RouteStopStatus,
      notes: stop.reason,
    }));

    const { error: stopError } = await supabase.from("route_stops").insert(stopInsert);
    if (stopError) {
      return { ok: false, error: stopError.message };
    }

    revalidateRoutePaths(route.id);
    return { ok: true, route: route as RouteSavedSummary };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not save route.",
    };
  }
}

export async function startRouteAction(routeId: string): Promise<ActionState> {
  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();

  const { data: routeStops, error: stopsError } = await supabase
    .from("route_stops")
    .select("id, status, stop_order")
    .eq("workspace_id", workspace.id)
    .eq("route_id", routeId)
    .order("stop_order", { ascending: true });

  if (stopsError) {
    return { ok: false, error: stopsError.message };
  }

  const activeStop = (routeStops ?? []).find((stop) => stop.status === "active");
  const nextStop = activeStop ?? (routeStops ?? []).find((stop) => stop.status === "pending");

  if (!activeStop) {
    await supabase
      .from("route_stops")
      .update({ status: "pending" as RouteStopStatus })
      .eq("workspace_id", workspace.id)
      .eq("route_id", routeId)
      .eq("status", "active");

    if (nextStop) {
      await supabase
        .from("route_stops")
        .update({ status: "active" as RouteStopStatus, arrived_at: new Date().toISOString() })
        .eq("workspace_id", workspace.id)
        .eq("id", nextStop.id);
    }
  }

  const { data, error } = await supabase
    .from("routes")
    .update({ status: "in_progress" as RouteStatus })
    .eq("workspace_id", workspace.id)
    .eq("id", routeId)
    .select("id, name, status")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not start route." };
  }

  revalidateRoutePaths(routeId);
  return { ok: true, route: data as RouteSavedSummary };
}

export async function pauseRouteAction(routeId: string): Promise<ActionState> {
  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .update({ status: "paused" as RouteStatus })
    .eq("workspace_id", workspace.id)
    .eq("id", routeId)
    .select("id, name, status")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not pause route." };
  }

  revalidateRoutePaths(routeId);
  return { ok: true, route: data as RouteSavedSummary };
}

export async function completeRouteAction(routeId: string): Promise<ActionState> {
  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();
  await supabase
    .from("route_stops")
    .update({ status: "pending" as RouteStopStatus })
    .eq("workspace_id", workspace.id)
    .eq("route_id", routeId)
    .eq("status", "active");

  const { data, error } = await supabase
    .from("routes")
    .update({ status: "completed" as RouteStatus })
    .eq("workspace_id", workspace.id)
    .eq("id", routeId)
    .select("id, name, status")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not complete route." };
  }

  revalidateRoutePaths(routeId);
  return { ok: true, route: data as RouteSavedSummary };
}

export async function archiveRouteAction(routeId: string): Promise<ActionState> {
  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routes")
    .update({ status: "archived" as RouteStatus })
    .eq("workspace_id", workspace.id)
    .eq("id", routeId)
    .select("id, name, status")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not archive route." };
  }

  revalidateRoutePaths(routeId);
  return { ok: true, route: data as RouteSavedSummary };
}

export async function deleteRouteAction(routeId: string): Promise<ActionState> {
  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();

  const { error: stopsError } = await supabase
    .from("route_stops")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("route_id", routeId);

  if (stopsError) {
    return { ok: false, error: stopsError.message };
  }

  const { data, error } = await supabase
    .from("routes")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", routeId)
    .select("id, name, status")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not delete route." };
  }

  revalidateRoutePaths(routeId);
  return { ok: true, route: data as RouteSavedSummary };
}

export async function duplicateRouteAction(routeId: string): Promise<ActionState> {
  const { route, stops } = await getRouteDetailPageData(routeId);
  const { workspace, profile } = await getWorkspaceContext();
  const supabase = await createClient();

  const { data: newRoute, error: routeError } = await supabase
    .from("routes")
    .insert({
      workspace_id: workspace.id,
      name: `${route.name} copy`,
      status: "draft",
      source_type: route.source_type,
      origin_label: route.origin_label,
      destination_label: route.destination_label,
      origin_latitude: route.origin_latitude,
      origin_longitude: route.origin_longitude,
      destination_latitude: route.destination_latitude,
      destination_longitude: route.destination_longitude,
      total_stops: route.total_stops,
      estimated_duration_minutes: route.estimated_duration_minutes,
      estimated_distance_meters: route.estimated_distance_meters,
      created_by: profile.id,
    })
    .select("id, name, status")
    .single();

  if (routeError || !newRoute) {
    return { ok: false, error: routeError?.message ?? "Could not duplicate route." };
  }

  const { error: stopError } = await supabase.from("route_stops").insert(
    stops.map((stop) => ({
      workspace_id: workspace.id,
      route_id: newRoute.id,
      lead_id: stop.lead_id,
      discovery_job_result_id: stop.discovery_job_result_id,
      google_place_id: stop.google_place_id,
      stop_order: stop.stop_order,
      restaurant_name: stop.restaurant_name,
      formatted_address: stop.formatted_address,
      latitude: stop.latitude,
      longitude: stop.longitude,
      status: "pending" as RouteStopStatus,
      notes: stop.notes,
    })),
  );

  if (stopError) {
    return { ok: false, error: stopError.message };
  }

  revalidateRoutePaths(newRoute.id);
  return { ok: true, route: newRoute as RouteSavedSummary };
}

export async function regenerateRouteAction(routeId: string): Promise<ActionState> {
  const { route, stops } = await getRouteDetailPageData(routeId);
  const unresolvedStops = stops.filter((stop) =>
    ["pending", "active"].includes(stop.status),
  );

  if (unresolvedStops.length < 2) {
    return { ok: false, error: "Need at least two unresolved stops to regenerate the route." };
  }

  const validStops = unresolvedStops.filter(
    (stop): stop is typeof stop & { latitude: number; longitude: number } =>
      typeof stop.latitude === "number" && typeof stop.longitude === "number",
  );

  if (validStops.length < 2) {
    return { ok: false, error: "Not enough route stops have coordinates to regenerate." };
  }

  const origin = route.origin_latitude != null && route.origin_longitude != null
    ? { latitude: route.origin_latitude, longitude: route.origin_longitude }
    : validStops[0];
  const destination = route.destination_latitude != null && route.destination_longitude != null
    ? { latitude: route.destination_latitude, longitude: route.destination_longitude }
    : validStops[validStops.length - 1];

  const optimized = await computeOptimizedDrivingRoute({
    origin,
    destination,
    stops: validStops.map((stop) => ({
      id: stop.id,
      latitude: stop.latitude,
      longitude: stop.longitude,
    })),
  });

  const optimizedOrder = new Map(
    optimized.orderedStops.map((stop, index) => [stop.id, index + 1]),
  );
  const resolvedStops = stops.filter((stop) => !["pending", "active"].includes(stop.status));
  const firstOptimizedStopId = optimized.orderedStops[0]?.id ?? null;
  const reorderPlan = [
    ...resolvedStops.map((stop, index) => ({ id: stop.id, stop_order: index + 1 })),
    ...validStops
      .sort((a, b) => (optimizedOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (optimizedOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER))
      .map((stop, index) => ({ id: stop.id, stop_order: resolvedStops.length + index + 1 })),
  ];

  const supabase = await createClient();
  await supabase
    .from("route_stops")
    .update({ status: "pending" as RouteStopStatus })
    .eq("workspace_id", route.workspace_id)
    .eq("route_id", route.id)
    .eq("status", "active");

  for (const stop of reorderPlan) {
    const nextStatus =
      stop.id === firstOptimizedStopId &&
      route.status === "in_progress"
        ? ("active" as RouteStopStatus)
        : undefined;

    await supabase
      .from("route_stops")
      .update({
        stop_order: stop.stop_order,
        ...(nextStatus ? { status: nextStatus } : {}),
      })
      .eq("workspace_id", route.workspace_id)
      .eq("id", stop.id);
  }

  await supabase
    .from("routes")
    .update({
      estimated_duration_minutes: optimized.estimatedDurationMinutes ?? route.estimated_duration_minutes,
      estimated_distance_meters: optimized.estimatedDistanceMeters ?? route.estimated_distance_meters,
    })
    .eq("workspace_id", route.workspace_id)
    .eq("id", route.id);

  revalidateRoutePaths(routeId);
  return { ok: true, route: { id: route.id, name: route.name, status: route.status } };
}

export async function updateRouteStopAction(input: RouteStopUpdateInput): Promise<ActionState> {
  const { workspace, profile } = await getWorkspaceContext();
  const supabase = await createClient();

  const { data: stop, error: stopError } = await supabase
    .from("route_stops")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("route_id", input.routeId)
    .eq("id", input.routeStopId)
    .single();

  if (stopError || !stop) {
    return { ok: false, error: stopError?.message ?? "Route stop not found." };
  }

  const now = new Date().toISOString();
  const resolvedStatuses: RouteStopStatus[] = ["completed", "visited", "skipped", "revisit_needed"];

  if (input.status === "active") {
    await supabase
      .from("route_stops")
      .update({ status: "pending" as RouteStopStatus })
      .eq("workspace_id", workspace.id)
      .eq("route_id", input.routeId)
      .eq("status", "active");
  }

  const { error: updateError } = await supabase
    .from("route_stops")
    .update({
      status: input.status,
      visit_outcome: input.visitOutcome ?? null,
      notes: input.notes ?? stop.notes,
      arrived_at: input.status === "active" ? stop.arrived_at ?? now : stop.arrived_at ?? now,
      completed_at: resolvedStatuses.includes(input.status) ? now : null,
    })
    .eq("workspace_id", workspace.id)
    .eq("id", input.routeStopId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  if (stop.lead_id && resolvedStatuses.includes(input.status)) {
    await supabase.from("visits").insert({
      workspace_id: workspace.id,
      lead_id: stop.lead_id,
      visited_by: profile.id,
      visited_at: now,
      outcome: input.visitOutcome ?? null,
      notes: input.notes ?? null,
    });
  }

  const { data: routeStops } = await supabase
    .from("route_stops")
    .select("id, status, stop_order")
    .eq("workspace_id", workspace.id)
    .eq("route_id", input.routeId)
    .order("stop_order", { ascending: true });

  const unresolvedStops = (routeStops ?? []).filter((item) =>
    ["pending", "active"].includes(item.status),
  );

  if (resolvedStatuses.includes(input.status)) {
    const nextStop = unresolvedStops.find((item) => item.id !== input.routeStopId && item.status === "pending");
    if (nextStop) {
      await supabase
        .from("route_stops")
        .update({ status: "active" as RouteStopStatus, arrived_at: new Date().toISOString() })
        .eq("workspace_id", workspace.id)
        .eq("id", nextStop.id);
    }
  }

  const allDone = (routeStops ?? []).every((item) =>
    ["completed", "visited", "skipped", "revisit_needed"].includes(item.status),
  );
  if (allDone) {
    await supabase
      .from("routes")
      .update({ status: "completed" as RouteStatus })
      .eq("workspace_id", workspace.id)
      .eq("id", input.routeId);
  } else if (input.status === "active" || resolvedStatuses.includes(input.status)) {
    await supabase
      .from("routes")
      .update({ status: "in_progress" as RouteStatus })
      .eq("workspace_id", workspace.id)
      .eq("id", input.routeId);
  }

  revalidateRoutePaths(input.routeId);
  return { ok: true };
}
