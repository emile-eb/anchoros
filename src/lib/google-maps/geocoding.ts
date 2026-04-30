import { getGoogleMapsApiKey } from "@/lib/env";

export type GeocodedArea = {
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  viewport: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
};

type GeocodingResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
      viewport?: {
        northeast?: {
          lat?: number;
          lng?: number;
        };
        southwest?: {
          lat?: number;
          lng?: number;
        };
      };
    };
  }>;
};

export async function geocodeAreaQuery(query: string): Promise<GeocodedArea> {
  const apiKey = getGoogleMapsApiKey();
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Geocoding request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as GeocodingResponse;

  if (data.status !== "OK" || !data.results?.[0]) {
    throw new Error(data.error_message ?? "Could not geocode that area.");
  }

  const result = data.results[0];
  const location = result.geometry?.location;
  const viewport = result.geometry?.viewport;

  if (
    typeof location?.lat !== "number" ||
    typeof location?.lng !== "number"
  ) {
    throw new Error("Geocoding did not return coordinates for that area.");
  }

  return {
    formattedAddress: result.formatted_address ?? query,
    location: {
      latitude: location.lat,
      longitude: location.lng,
    },
    viewport: {
      north: viewport?.northeast?.lat ?? location.lat + 0.04,
      south: viewport?.southwest?.lat ?? location.lat - 0.04,
      east: viewport?.northeast?.lng ?? location.lng + 0.04,
      west: viewport?.southwest?.lng ?? location.lng - 0.04,
    },
  };
}
