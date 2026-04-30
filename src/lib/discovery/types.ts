export type DiscoverySearchMode = "exact_region" | "quick_area";
export type DiscoveryRegionType = "rectangle" | "circle" | "polygon" | "geocoded_area";
export type DiscoverySubtypeMode = "strict" | "broad";

export type DiscoveryLatLng = {
  latitude: number;
  longitude: number;
};

export type DiscoveryBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type DiscoveryRectangleRegion = {
  type: "rectangle" | "geocoded_area";
  bounds: DiscoveryBounds;
  center?: DiscoveryLatLng | null;
  label?: string | null;
};

export type DiscoveryCircleRegion = {
  type: "circle";
  center: DiscoveryLatLng;
  radiusMeters: number;
  label?: string | null;
};

export type DiscoveryPolygonRegion = {
  type: "polygon";
  points: DiscoveryLatLng[];
  bounds: DiscoveryBounds;
  label?: string | null;
};

export type DiscoveryRegionData =
  | DiscoveryRectangleRegion
  | DiscoveryCircleRegion
  | DiscoveryPolygonRegion;

export type DiscoveryDebugSummary = {
  searchMode: DiscoverySearchMode;
  regionType: DiscoveryRegionType;
  exactGeometry: boolean;
  rawQuery: string | null;
  minimumReviews: number;
  subtype: string | null;
  subtypeMode: DiscoverySubtypeMode;
  businessType: string;
  desiredFinalResults: number;
  tileRadiusMeters: number;
  tileSpacingMeters: number;
  retrievalPassesPerTile: number;
  totalTiles: number;
  rawCandidates: number;
  uniqueCandidates: number;
  droppedForWebsite: number;
  droppedForLowReviews: number;
  droppedForSubtype: number;
  passedReviewFilter: number;
  passedNoWebsiteFilter: number;
  finalSavedCandidates: number;
  safetyCapHit: boolean;
};
