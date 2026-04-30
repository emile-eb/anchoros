import { NextResponse } from "next/server";
import { hasGoogleMapsEnv } from "@/lib/env";
import { geocodeAreaQuery } from "@/lib/google-maps/geocoding";
import { z } from "zod";

const previewSchema = z.object({
  query: z.string().trim().min(2, "Enter an area, neighborhood, or address."),
});

export async function POST(request: Request) {
  if (!hasGoogleMapsEnv()) {
    return NextResponse.json(
      { error: "Google Maps is not configured." },
      { status: 400 },
    );
  }

  const payload = await request.json();
  const parsed = previewSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid preview query." },
      { status: 400 },
    );
  }

  try {
    const area = await geocodeAreaQuery(parsed.data.query);
    return NextResponse.json({
      label: area.formattedAddress,
      regionType: "geocoded_area",
      regionData: {
        type: "geocoded_area",
        label: area.formattedAddress,
        center: area.location,
        bounds: area.viewport,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not preview that area." },
      { status: 400 },
    );
  }
}
