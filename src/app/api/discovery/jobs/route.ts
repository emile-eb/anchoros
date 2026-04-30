import { after, NextResponse } from "next/server";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { hasGoogleMapsEnv, hasSupabaseEnv, hasSupabaseServiceRoleEnv } from "@/lib/env";
import { runDiscoveryJob } from "@/lib/discovery/job-runner";
import { createClient } from "@/lib/supabase/server";
import { discoveryJobRequestSchema } from "@/lib/validators/discovery";

export async function POST(request: Request) {
  if (!hasSupabaseEnv() || !hasGoogleMapsEnv() || !hasSupabaseServiceRoleEnv()) {
    return NextResponse.json(
      {
        error:
          "Discovery jobs require Supabase, Google Maps, and SUPABASE_SERVICE_ROLE_KEY to be configured.",
      },
      { status: 400 },
    );
  }

  const payload = await request.json();
  const parsed = discoveryJobRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid discovery search." },
      { status: 400 },
    );
  }

  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discovery_jobs")
    .insert({
      workspace_id: workspace.id,
      query: parsed.data.query?.trim() || parsed.data.regionData.label || "Exact region",
      business_type: parsed.data.businessType,
      subtype: parsed.data.subtype || null,
      subtype_mode: parsed.data.subtypeMode as "strict" | "broad",
      minimum_reviews: parsed.data.minimumReviews,
      no_website_only: parsed.data.noWebsiteOnly,
      desired_final_results: parsed.data.limit,
      target_results: parsed.data.limit,
      search_mode: parsed.data.searchMode,
      raw_query: parsed.data.query?.trim() || null,
      region_type: parsed.data.regionType,
      region_data: parsed.data.regionData,
      exact_geometry: parsed.data.searchMode === "exact_region",
      status: "queued",
      current_phase: "Queued",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to create discovery job." },
      { status: 500 },
    );
  }

  after(async () => {
    await runDiscoveryJob(data.id, parsed.data);
  });

  return NextResponse.json({ jobId: data.id });
}
