import type { ImportedLeadDraft } from "@/lib/leads/imports";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/workspace";
import type { Database } from "@/lib/types/database";

export type DiscoveryJobRow = Database["public"]["Tables"]["discovery_jobs"]["Row"];
export type DiscoveryJobResultRow = Database["public"]["Tables"]["discovery_job_results"]["Row"];

export type DiscoveryResultItem = {
  result_id: string;
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
  website_presence: "no_website" | "unknown";
  rating: number | null;
  review_count: number | null;
  price_level: number | null;
  business_status: string | null;
  phone: string | null;
  matched_subtype: string | null;
  already_in_crm: boolean;
  imported_lead: ImportedLeadDraft;
  existing_lead: {
    id: string;
    restaurant_name: string;
    lead_stage: string;
  } | null;
};

export function mapDiscoveryJobResultToItem(
  row: DiscoveryJobResultRow,
  existingLeadStage?: string | null,
) {
  return {
    result_id: row.id,
    place_id: row.google_place_id ?? row.id,
    name: row.restaurant_name,
    formatted_address: row.formatted_address,
    google_maps_url: row.google_maps_url,
    location:
      typeof row.latitude === "number" && typeof row.longitude === "number"
        ? { latitude: row.latitude, longitude: row.longitude }
        : null,
    primary_type: row.primary_type,
    primary_type_label: row.primary_type,
    website_url: row.website_url,
    website_presence: row.website_status === "unknown" ? "unknown" : "no_website",
    rating: row.rating,
    review_count: row.review_count,
    price_level: row.price_level,
    business_status: null,
    phone: null,
    matched_subtype: row.matched_subtype,
    already_in_crm: row.already_in_crm,
    imported_lead: {
      restaurant_name: row.restaurant_name,
      address: row.formatted_address,
      neighborhood: null,
      borough: null,
      phone: null,
      existing_website_url: row.website_url,
      website_status: row.website_status,
      lead_source: "google_maps",
      lead_stage: "new",
      priority: "medium",
      cuisine: row.primary_type,
      google_maps_url: row.google_maps_url,
      google_place_id: row.google_place_id,
      google_rating: row.rating,
      google_review_count: row.review_count,
      google_price_level: row.price_level,
      google_business_status: null,
      google_primary_type: row.primary_type,
      google_imported_at: row.created_at,
      resolved_query: null,
    },
    existing_lead: row.already_in_crm && row.existing_lead_id
      ? {
          id: row.existing_lead_id,
          restaurant_name: row.restaurant_name,
          lead_stage: existingLeadStage ?? "new",
        }
      : null,
  };
}

export async function getDiscoveryJobForWorkspace(jobId: string) {
  const { workspace } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = await createClient();
  const [{ data: job, error: jobError }, { data: results, error: resultsError }] = await Promise.all([
    supabase
      .from("discovery_jobs")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("id", jobId)
      .single(),
    supabase
      .from("discovery_job_results")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("discovery_job_id", jobId)
      .order("review_count", { ascending: false, nullsFirst: false }),
  ]);

  if (jobError || !job) {
    throw new Error(jobError?.message ?? "Discovery job not found.");
  }

  if (resultsError) {
    throw new Error(resultsError.message);
  }

  const existingLeadIds = (results ?? [])
    .map((row) => row.existing_lead_id)
    .filter((value): value is string => Boolean(value));

  const leadStageMap = new Map<string, string>();

  if (existingLeadIds.length > 0) {
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, lead_stage")
      .eq("workspace_id", workspace.id)
      .in("id", existingLeadIds);

    if (leadsError) {
      throw new Error(leadsError.message);
    }

    for (const lead of leads ?? []) {
      leadStageMap.set(lead.id, lead.lead_stage);
    }
  }

  return {
    job,
    results: (results ?? []).map((row) =>
      mapDiscoveryJobResultToItem(row, row.existing_lead_id ? leadStageMap.get(row.existing_lead_id) : null),
    ),
  };
}
