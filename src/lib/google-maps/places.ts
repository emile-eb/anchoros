import type { ImportedLeadDraft } from "@/lib/leads/imports";
import {
  cleanGoogleMapsText,
  googleFetch,
  mapGooglePlaceToImportedLead,
  type GooglePlaceCore,
} from "@/lib/google-maps/shared";

type PlaceDetailsResponse = GooglePlaceCore;

export type ImportedGooglePlace = ImportedLeadDraft;

async function resolveFinalGoogleMapsUrl(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });

    return response.url || url;
  } catch {
    return url;
  }
}

function extractPlaceIdFromUrl(url: URL) {
  const queryPlaceId = url.searchParams.get("query_place_id");
  if (queryPlaceId) {
    return queryPlaceId;
  }

  const q = url.searchParams.get("q");
  if (q?.startsWith("place_id:")) {
    return q.replace("place_id:", "");
  }

  const match = url.pathname.match(/!1s([^!/?]+)/);
  if (match?.[1]) {
    return match[1];
  }

  return null;
}

function extractQueryFromUrl(url: URL) {
  const queryParam =
    url.searchParams.get("q") ||
    url.searchParams.get("query") ||
    url.searchParams.get("destination");

  if (queryParam && !queryParam.startsWith("place_id:")) {
    return cleanGoogleMapsText(queryParam);
  }

  const placePathMatch = url.pathname.match(/\/place\/([^/]+)/);
  if (placePathMatch?.[1]) {
    return cleanGoogleMapsText(placePathMatch[1]);
  }

  return null;
}

async function searchTextForPlaceId(textQuery: string) {
  const response = await googleFetch<{ places?: Array<{ id?: string }> }>(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      body: JSON.stringify({
        textQuery,
        languageCode: "en",
        regionCode: "US",
      }),
      fieldMask: "places.id",
    },
  );

  return response.places?.[0]?.id ?? null;
}

async function getPlaceDetails(placeId: string) {
  return googleFetch<PlaceDetailsResponse>(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      method: "GET",
      fieldMask:
        "id,displayName,formattedAddress,addressComponents,nationalPhoneNumber,websiteUri,rating,userRatingCount,priceLevel,businessStatus,primaryType,primaryTypeDisplayName,googleMapsUri",
    },
  );
}

export async function importPlaceFromGoogleMapsUrl(
  mapsUrl: string,
): Promise<ImportedGooglePlace> {
  const resolvedUrl = await resolveFinalGoogleMapsUrl(mapsUrl);
  const parsedUrl = new URL(resolvedUrl);

  const host = parsedUrl.hostname.toLowerCase();
  if (!host.includes("google.") && !host.includes("goo.gl")) {
    throw new Error("Use a Google Maps place link.");
  }

  const placeId = extractPlaceIdFromUrl(parsedUrl);
  const resolvedQuery = extractQueryFromUrl(parsedUrl);
  let finalPlaceId: string | null = null;
  let place: PlaceDetailsResponse | null = null;

  if (placeId) {
    try {
      place = await getPlaceDetails(placeId);
      finalPlaceId = place.id ?? placeId;
    } catch {
      finalPlaceId = null;
    }
  }

  if (!place && resolvedQuery) {
    const searchedPlaceId = await searchTextForPlaceId(resolvedQuery);

    if (searchedPlaceId) {
      place = await getPlaceDetails(searchedPlaceId);
      finalPlaceId = place.id ?? searchedPlaceId;
    }
  }

  if (!place || !finalPlaceId) {
    throw new Error("Could not resolve that Google Maps link to a supported place.");
  }

  return mapGooglePlaceToImportedLead(place, {
    resolvedQuery,
    leadSource: "google_maps",
    mapsUrl: place.googleMapsUri ?? resolvedUrl,
  });
}
