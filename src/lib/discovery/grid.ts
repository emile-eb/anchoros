import {
  DISCOVERY_MAX_TILES_PER_JOB,
  DISCOVERY_TILE_RADIUS_METERS,
  DISCOVERY_TILE_SPACING_METERS,
} from "@/lib/discovery/config";
import {
  getRegionBounds,
  metersPerLongitudeDegree,
  pointInRegion,
} from "@/lib/discovery/geometry";
import type { DiscoveryRegionData } from "@/lib/discovery/types";

export type DiscoveryTile = {
  index: number;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

const METERS_PER_LATITUDE_DEGREE = 111_320;

export function buildDiscoveryTiles(region: DiscoveryRegionData) {
  const bounds = getRegionBounds(region);
  const centerLatitude =
    region.type === "circle"
      ? region.center.latitude
      : ((bounds.north + bounds.south) / 2);
  const latitudeStep = DISCOVERY_TILE_SPACING_METERS / METERS_PER_LATITUDE_DEGREE;
  const longitudeStep = DISCOVERY_TILE_SPACING_METERS / metersPerLongitudeDegree(centerLatitude);

  const north = Math.max(bounds.north, bounds.south);
  const south = Math.min(bounds.north, bounds.south);
  const east = Math.max(bounds.east, bounds.west);
  const west = Math.min(bounds.east, bounds.west);

  const tiles: DiscoveryTile[] = [];
  let index = 0;

  for (let latitude = south; latitude <= north; latitude += latitudeStep) {
    for (let longitude = west; longitude <= east; longitude += longitudeStep) {
      if (!pointInRegion({ latitude, longitude }, region)) {
        continue;
      }

      tiles.push({
        index,
        latitude,
        longitude,
        radiusMeters: DISCOVERY_TILE_RADIUS_METERS,
      });
      index += 1;

      if (tiles.length >= DISCOVERY_MAX_TILES_PER_JOB) {
        return tiles;
      }
    }
  }

  if (tiles.length === 0) {
    const fallbackCenter =
      region.type === "circle"
        ? region.center
        : region.type === "polygon"
          ? {
              latitude: (region.bounds.north + region.bounds.south) / 2,
              longitude: (region.bounds.east + region.bounds.west) / 2,
            }
          : region.center ?? {
              latitude: (region.bounds.north + region.bounds.south) / 2,
              longitude: (region.bounds.east + region.bounds.west) / 2,
            };

    tiles.push({
      index: 0,
      latitude: fallbackCenter.latitude,
      longitude: fallbackCenter.longitude,
      radiusMeters: DISCOVERY_TILE_RADIUS_METERS,
    });
  }

  return tiles;
}
