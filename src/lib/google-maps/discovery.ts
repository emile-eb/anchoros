import {
  buildGoogleMapsUrlFromPlaceId,
  googleFetch,
  mapGooglePlaceToImportedLead,
  normalizePriceLevel,
  type GooglePlaceCore,
} from "@/lib/google-maps/shared";
import {
  DISCOVERY_MAX_RETRIEVAL_PASSES_PER_TILE,
  DISCOVERY_MAX_NEARBY_RESULTS_PER_TILE,
} from "@/lib/discovery/config";
import { pointInRegion } from "@/lib/discovery/geometry";
import { getStrictDiscoveryTypes, scoreSubtypeMatch } from "@/lib/discovery/subtypes";
import type { DiscoveryRegionData, DiscoverySubtypeMode } from "@/lib/discovery/types";
import type { ImportedLeadDraft } from "@/lib/leads/imports";

export type DiscoveryWebsitePresence = "no_website" | "has_website" | "unknown";

type NearbySearchResponse = {
  places?: GooglePlaceCore[];
};

export type DiscoveryPlaceResult = {
  place_id: string;
  name: string;
  formatted_address: string | null;
  google_maps_url: string | null;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  primary_type: string | null;
  primary_type_label: string | null;
  website_url: string | null;
  website_presence: DiscoveryWebsitePresence;
  rating: number | null;
  review_count: number | null;
  price_level: number | null;
  business_status: string | null;
  phone: string | null;
  types: string[];
  subtype_match_reason: string | null;
  subtype_score: number;
  imported_lead: ImportedLeadDraft;
};

type PlaceDetailsResponse = GooglePlaceCore;

function deriveWebsitePresence(place: GooglePlaceCore): DiscoveryWebsitePresence {
  if (typeof place.websiteUri === "string" && place.websiteUri.length > 0) {
    return "has_website";
  }

  if (place.id || place.displayName?.text) {
    return "no_website";
  }

  return "unknown";
}

export async function searchDiscoveryTile(input: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  businessType: string;
  region: DiscoveryRegionData;
  subtype?: string | null;
  subtypeMode: DiscoverySubtypeMode;
  retrievalPasses?: number;
}) {
  const strictTypes = getStrictDiscoveryTypes(input.subtype);
  const includedPrimaryTypes =
    strictTypes.length > 0 && input.subtypeMode === "strict"
      ? strictTypes
      : [input.businessType];

  const offsets = [
    { latitudeDelta: 0, longitudeDelta: 0 },
    { latitudeDelta: input.radiusMeters * 0.28 / 111_320, longitudeDelta: 0 },
    { latitudeDelta: -(input.radiusMeters * 0.28) / 111_320, longitudeDelta: 0 },
    {
      latitudeDelta: 0,
      longitudeDelta:
        (input.radiusMeters * 0.28) /
        Math.max(1, 111_320 * Math.cos((input.latitude * Math.PI) / 180)),
    },
    {
      latitudeDelta: 0,
      longitudeDelta:
        -(input.radiusMeters * 0.28) /
        Math.max(1, 111_320 * Math.cos((input.latitude * Math.PI) / 180)),
    },
  ].slice(0, input.retrievalPasses ?? DISCOVERY_MAX_RETRIEVAL_PASSES_PER_TILE);

  const results = await Promise.all(
    offsets.map(async (offset) => {
      const response = await googleFetch<NearbySearchResponse>(
        "https://places.googleapis.com/v1/places:searchNearby",
        {
          method: "POST",
          body: JSON.stringify({
            includedPrimaryTypes,
            maxResultCount: DISCOVERY_MAX_NEARBY_RESULTS_PER_TILE,
            locationRestriction: {
              circle: {
                center: {
                  latitude: input.latitude + offset.latitudeDelta,
                  longitude: input.longitude + offset.longitudeDelta,
                },
                radius: input.radiusMeters,
              },
            },
          }),
          fieldMask:
            "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.primaryTypeDisplayName,places.websiteUri,places.rating,places.userRatingCount,places.priceLevel,places.businessStatus,places.googleMapsUri,places.nationalPhoneNumber,places.types",
        },
      );

      return response.places ?? [];
    }),
  );

  return results
    .flat()
    .filter((place) =>
      typeof place.location?.latitude === "number" &&
      typeof place.location?.longitude === "number"
        ? pointInRegion(
            {
              latitude: place.location.latitude,
              longitude: place.location.longitude,
            },
            input.region,
          )
        : true,
    );
}

export async function enrichDiscoveryPlace(placeId: string) {
  return googleFetch<PlaceDetailsResponse>(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      method: "GET",
      fieldMask:
        "id,displayName,formattedAddress,addressComponents,nationalPhoneNumber,websiteUri,rating,userRatingCount,priceLevel,businessStatus,primaryType,primaryTypeDisplayName,googleMapsUri,location,types",
    },
  );
}

export function mapDiscoveryPlace(
  place: GooglePlaceCore,
  resolvedQuery: string,
  options?: {
    subtype?: string | null;
    subtypeMode?: DiscoverySubtypeMode;
  },
): DiscoveryPlaceResult {
  const subtypeMatch = scoreSubtypeMatch(
    {
      primaryType: place.primaryType ?? null,
      primaryTypeLabel: place.primaryTypeDisplayName?.text ?? null,
      name: place.displayName?.text ?? null,
      types: place.types ?? [],
    },
    options?.subtype ?? null,
    options?.subtypeMode ?? "broad",
  );

  return {
    place_id: place.id ?? "",
    name: place.displayName?.text ?? "Unknown place",
    formatted_address: place.formattedAddress ?? null,
    google_maps_url: place.googleMapsUri ?? (place.id ? buildGoogleMapsUrlFromPlaceId(place.id) : null),
    location:
      typeof place.location?.latitude === "number" &&
      typeof place.location?.longitude === "number"
        ? {
            latitude: place.location.latitude,
            longitude: place.location.longitude,
          }
        : null,
    primary_type: place.primaryType ?? null,
    primary_type_label: place.primaryTypeDisplayName?.text ?? null,
    website_url: place.websiteUri ?? null,
    website_presence: deriveWebsitePresence(place),
    rating: place.rating ?? null,
    review_count: place.userRatingCount ?? null,
    price_level: normalizePriceLevel(place.priceLevel),
    business_status: place.businessStatus ?? null,
    phone: place.nationalPhoneNumber ?? null,
    types: place.types ?? [],
    subtype_match_reason: subtypeMatch.reason,
    subtype_score: subtypeMatch.score,
    imported_lead: mapGooglePlaceToImportedLead(place, {
      resolvedQuery,
      leadSource: "google_maps",
      mapsUrl: place.googleMapsUri ?? null,
    }),
  };
}
