import type {
  DiscoveryBounds,
  DiscoveryLatLng,
  DiscoveryRegionData,
} from "@/lib/discovery/types";

const METERS_PER_LATITUDE_DEGREE = 111_320;

export function metersPerLongitudeDegree(latitude: number) {
  return Math.max(1, METERS_PER_LATITUDE_DEGREE * Math.cos((latitude * Math.PI) / 180));
}

export function distanceMeters(a: DiscoveryLatLng, b: DiscoveryLatLng) {
  const latDeltaMeters = (a.latitude - b.latitude) * METERS_PER_LATITUDE_DEGREE;
  const longitudeMeters = metersPerLongitudeDegree((a.latitude + b.latitude) / 2);
  const lngDeltaMeters = (a.longitude - b.longitude) * longitudeMeters;
  return Math.sqrt(latDeltaMeters ** 2 + lngDeltaMeters ** 2);
}

export function deriveBoundsFromPoints(points: DiscoveryLatLng[]): DiscoveryBounds {
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);

  return {
    north: Math.max(...latitudes),
    south: Math.min(...latitudes),
    east: Math.max(...longitudes),
    west: Math.min(...longitudes),
  };
}

export function getRegionBounds(region: DiscoveryRegionData): DiscoveryBounds {
  if (region.type === "circle") {
    const latitudeDelta = region.radiusMeters / METERS_PER_LATITUDE_DEGREE;
    const longitudeDelta =
      region.radiusMeters / metersPerLongitudeDegree(region.center.latitude);

    return {
      north: region.center.latitude + latitudeDelta,
      south: region.center.latitude - latitudeDelta,
      east: region.center.longitude + longitudeDelta,
      west: region.center.longitude - longitudeDelta,
    };
  }

  return region.bounds;
}

function pointInPolygon(point: DiscoveryLatLng, polygon: DiscoveryLatLng[]) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude <
        ((xj - xi) * (point.latitude - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function pointInRegion(point: DiscoveryLatLng, region: DiscoveryRegionData) {
  if (region.type === "circle") {
    return distanceMeters(point, region.center) <= region.radiusMeters;
  }

  if (region.type === "polygon") {
    return pointInPolygon(point, region.points);
  }

  return (
    point.latitude <= region.bounds.north &&
    point.latitude >= region.bounds.south &&
    point.longitude <= region.bounds.east &&
    point.longitude >= region.bounds.west
  );
}
