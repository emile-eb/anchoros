import { getGoogleMapsApiKey } from "@/lib/env";
import { startCase } from "@/lib/formatters";
import type { LeadSource, WebsiteStatus } from "@/lib/types/database";
import type { ImportedLeadDraft } from "@/lib/leads/imports";

export type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

export type GooglePlaceCore = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string | number;
  businessStatus?: string;
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
  googleMapsUri?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  types?: string[];
};

export function cleanGoogleMapsText(value: string) {
  return decodeURIComponent(value.replaceAll("+", " "))
    .replace(/\s*[-|]\s*Google Maps$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findAddressComponent(
  components: GoogleAddressComponent[] | undefined,
  targetTypes: string[],
) {
  if (!components) {
    return null;
  }

  return (
    components.find((component) =>
      targetTypes.every((type) => component.types?.includes(type)),
    ) ?? null
  );
}

export function deriveNeighborhood(components: GoogleAddressComponent[] | undefined) {
  const neighborhood =
    findAddressComponent(components, ["neighborhood"]) ??
    findAddressComponent(components, ["sublocality_level_2", "sublocality", "political"]) ??
    findAddressComponent(components, ["sublocality_level_3", "sublocality", "political"]);

  return neighborhood?.longText ?? null;
}

export function deriveBorough(
  components: GoogleAddressComponent[] | undefined,
  formattedAddress?: string,
) {
  const borough =
    findAddressComponent(components, ["sublocality_level_1", "sublocality", "political"]) ??
    findAddressComponent(components, ["administrative_area_level_2", "political"]);

  if (borough?.longText) {
    return borough.longText;
  }

  const possibleBorough = ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"].find(
    (value) => formattedAddress?.includes(value),
  );

  return possibleBorough ?? null;
}

export function normalizePriceLevel(priceLevel: string | number | undefined) {
  if (typeof priceLevel === "number") {
    return priceLevel;
  }

  if (!priceLevel) {
    return null;
  }

  const mapping: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };

  return mapping[priceLevel] ?? null;
}

export async function googleFetch<T>(
  url: string,
  init: RequestInit & { fieldMask: string },
) {
  const apiKey = getGoogleMapsApiKey();
  const { fieldMask, ...requestInit } = init;
  const response = await fetch(url, {
    ...requestInit,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
      ...(requestInit.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Places request failed (${response.status}): ${body}`);
  }

  return (await response.json()) as T;
}

export function buildGoogleMapsUrlFromPlaceId(placeId: string) {
  return `https://www.google.com/maps/search/?api=1&query_place_id=${placeId}`;
}

function deriveImportedWebsiteStatus(websiteUri?: string): WebsiteStatus {
  return websiteUri ? "unknown" : "no_website";
}

export function mapGooglePlaceToImportedLead(
  place: GooglePlaceCore,
  options: {
    resolvedQuery: string | null;
    leadSource?: LeadSource;
    mapsUrl?: string | null;
  },
): ImportedLeadDraft {
  const cuisine =
    place.primaryTypeDisplayName?.text ??
    (place.primaryType ? startCase(place.primaryType) : null);

  return {
    restaurant_name: place.displayName?.text ?? options.resolvedQuery ?? "Unknown place",
    address: place.formattedAddress ?? null,
    neighborhood: deriveNeighborhood(place.addressComponents),
    borough: deriveBorough(place.addressComponents, place.formattedAddress),
    phone: place.nationalPhoneNumber ?? null,
    existing_website_url: place.websiteUri ?? null,
    website_status: deriveImportedWebsiteStatus(place.websiteUri),
    lead_source: options.leadSource ?? "google_maps",
    lead_stage: "new",
    priority: "medium",
    cuisine,
    google_maps_url:
      place.googleMapsUri ??
      options.mapsUrl ??
      (place.id ? buildGoogleMapsUrlFromPlaceId(place.id) : null),
    google_place_id: place.id ?? null,
    google_rating: place.rating ?? null,
    google_review_count: place.userRatingCount ?? null,
    google_price_level: normalizePriceLevel(place.priceLevel),
    google_business_status: place.businessStatus ?? null,
    google_primary_type: place.primaryType ?? null,
    google_imported_at: new Date().toISOString(),
    resolved_query: options.resolvedQuery,
  };
}
