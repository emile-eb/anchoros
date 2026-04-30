import type {
  RouteSourceType,
  RouteStatus,
  RouteStopStatus,
  VisitOutcome,
} from "@/lib/types/database";

export type RoutePreviewStop = {
  sourceType: RouteSourceType;
  leadId: string | null;
  discoveryJobResultId: string | null;
  googlePlaceId: string | null;
  restaurantName: string;
  formattedAddress: string | null;
  latitude: number;
  longitude: number;
  stopOrder: number;
  reason: string;
};

export type RoutePreview = {
  routeName: string;
  sourceType: RouteSourceType;
  originLabel: string;
  destinationLabel: string;
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  totalStops: number;
  estimatedDurationMinutes: number | null;
  estimatedDistanceMeters: number | null;
  whyTheseStops: string[];
  stops: RoutePreviewStop[];
  googleMapsUrl: string | null;
  googleMapsWarning: string | null;
};

export type RouteSavedSummary = {
  id: string;
  name: string;
  status: RouteStatus;
};

export type RouteStopUpdateInput = {
  routeId: string;
  routeStopId: string;
  status: RouteStopStatus;
  visitOutcome?: VisitOutcome | null;
  notes?: string;
};

export type RouteMapSegment = {
  id: string;
  startStopId: string | null;
  endStopId: string | null;
  distanceMeters: number | null;
  durationMinutes: number | null;
  path: Array<{
    latitude: number;
    longitude: number;
  }>;
};
