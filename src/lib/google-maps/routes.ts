import { getGoogleMapsApiKey } from "@/lib/env";
import type { RouteMapSegment } from "@/lib/routes/types";

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type RouteOptimizationStop = {
  id: string;
  latitude: number;
  longitude: number;
};

type ComputeRoutesResponse = {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    optimizedIntermediateWaypointIndex?: number[];
    polyline?: {
      encodedPolyline?: string;
    };
  }>;
};

const GOOGLE_MAPS_MAX_INTERMEDIATE_WAYPOINTS = 25;

function toWaypoint(location: RouteCoordinate) {
  return {
    location: {
      latLng: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
    },
  };
}

function parseDurationToMinutes(duration: string | undefined) {
  if (!duration) {
    return null;
  }

  const seconds = Number(duration.replace("s", ""));
  if (!Number.isFinite(seconds)) {
    return null;
  }

  return Math.max(1, Math.round(seconds / 60));
}

function decodePolyline(encoded: string) {
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const coordinates: RouteCoordinate[] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
}

async function requestRoute(input: {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  stops: RouteOptimizationStop[];
  fieldMask: string;
  optimizeWaypointOrder?: boolean;
}) {
  const apiKey = getGoogleMapsApiKey();
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": input.fieldMask,
    },
    body: JSON.stringify({
      origin: toWaypoint(input.origin),
      destination: toWaypoint(input.destination),
      intermediates: input.stops.map((stop) =>
        toWaypoint({ latitude: stop.latitude, longitude: stop.longitude }),
      ),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
      optimizeWaypointOrder: input.optimizeWaypointOrder ?? false,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Routes request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as ComputeRoutesResponse;
  const route = data.routes?.[0];

  if (!route) {
    throw new Error("Google Routes did not return a route.");
  }

  return route;
}

export async function computeOptimizedDrivingRoute(input: {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  stops: RouteOptimizationStop[];
}) {
  const route = await requestRoute({
    origin: input.origin,
    destination: input.destination,
    stops: input.stops,
    fieldMask: "routes.distanceMeters,routes.duration,routes.optimizedIntermediateWaypointIndex",
    optimizeWaypointOrder: true,
  });

  const order = route.optimizedIntermediateWaypointIndex ?? input.stops.map((_, index) => index);
  const orderedStops = order.map((index) => input.stops[index]).filter(Boolean);

  return {
    orderedStops,
    estimatedDistanceMeters: route.distanceMeters ?? null,
    estimatedDurationMinutes: parseDurationToMinutes(route.duration),
  };
}

async function computeRoutePolylineSegment(input: {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  stops: RouteOptimizationStop[];
}) {
  const route = await requestRoute({
    origin: input.origin,
    destination: input.destination,
    stops: input.stops,
    fieldMask: "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
  });

  if (!route.polyline?.encodedPolyline) {
    throw new Error("Google Routes did not return route geometry.");
  }

  return {
    distanceMeters: route.distanceMeters ?? null,
    durationMinutes: parseDurationToMinutes(route.duration),
    path: decodePolyline(route.polyline.encodedPolyline),
  };
}

export async function computeRouteMapSegments(input: {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  stops: Array<RouteOptimizationStop>;
}) {
  const points = [
    { id: "origin", latitude: input.origin.latitude, longitude: input.origin.longitude, stopId: null as string | null },
    ...input.stops.map((stop) => ({
      id: stop.id,
      latitude: stop.latitude,
      longitude: stop.longitude,
      stopId: stop.id,
    })),
    {
      id: "destination",
      latitude: input.destination.latitude,
      longitude: input.destination.longitude,
      stopId: null as string | null,
    },
  ];

  const segments: RouteMapSegment[] = [];
  let cursor = 0;

  while (cursor < points.length - 1) {
    const endIndex = Math.min(cursor + GOOGLE_MAPS_MAX_INTERMEDIATE_WAYPOINTS + 1, points.length - 1);
    const slice = points.slice(cursor, endIndex + 1);
    const segment = await computeRoutePolylineSegment({
      origin: { latitude: slice[0].latitude, longitude: slice[0].longitude },
      destination: {
        latitude: slice[slice.length - 1].latitude,
        longitude: slice[slice.length - 1].longitude,
      },
      stops: slice.slice(1, -1).map((point) => ({
        id: point.id,
        latitude: point.latitude,
        longitude: point.longitude,
      })),
    });

    segments.push({
      id: `segment-${segments.length + 1}`,
      startStopId: slice[1]?.stopId ?? null,
      endStopId: slice[slice.length - 2]?.stopId ?? null,
      distanceMeters: segment.distanceMeters,
      durationMinutes: segment.durationMinutes,
      path: segment.path,
    });

    cursor = endIndex;
  }

  return segments;
}

export function buildGoogleMapsDirectionsUrl(input: {
  origin: string;
  destination: string;
  waypoints: string[];
}) {
  if (input.waypoints.length > GOOGLE_MAPS_MAX_INTERMEDIATE_WAYPOINTS) {
    return {
      ok: false as const,
      reason: `Google Maps fallback was limited to the active route segment because the full route exceeds ${GOOGLE_MAPS_MAX_INTERMEDIATE_WAYPOINTS} intermediate waypoints.`,
    };
  }

  const params = new URLSearchParams({
    api: "1",
    travelmode: "driving",
    origin: input.origin,
    destination: input.destination,
  });

  if (input.waypoints.length > 0) {
    params.set("waypoints", input.waypoints.join("|"));
  }

  return {
    ok: true as const,
    url: `https://www.google.com/maps/dir/?${params.toString()}`,
  };
}
