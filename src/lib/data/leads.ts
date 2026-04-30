import { cache } from "react";
import { notFound } from "next/navigation";
import {
  BOROUGH_OPTIONS,
  type LeadSortOption,
  LEAD_SORT_OPTIONS,
} from "@/lib/constants";
import type {
  Database,
  LeadPriority,
  LeadSource,
  LeadStage,
  WebsiteStatus,
} from "@/lib/types/database";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/workspace";

export type LeadListFilters = {
  q?: string;
  leadStage?: LeadStage | "";
  websiteStatus?: WebsiteStatus | "";
  priority?: LeadPriority | "";
  leadSource?: LeadSource | "";
  borough?: string;
  sort?: LeadSortOption;
};

export type LeadListItem = Pick<
  Database["public"]["Tables"]["leads"]["Row"],
  | "id"
  | "restaurant_name"
  | "neighborhood"
  | "borough"
  | "cuisine"
  | "google_maps_url"
  | "website_status"
  | "lead_stage"
  | "estimated_project_price"
  | "estimated_price_low"
  | "estimated_price_high"
  | "next_follow_up_at"
  | "last_contacted_at"
  | "priority"
  | "updated_at"
  | "lead_source"
>;

export type LeadDetail = Database["public"]["Tables"]["leads"]["Row"] & {
  creator: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email"> | null;
};

export type LeadNoteItem = Database["public"]["Tables"]["lead_notes"]["Row"] & {
  author: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email"> | null;
};

export type OutreachEventItem = Database["public"]["Tables"]["outreach_events"]["Row"] & {
  author: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email"> | null;
};

export type VisitItem = Database["public"]["Tables"]["visits"]["Row"] & {
  author: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email"> | null;
};

export function getLeadFiltersFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>,
): LeadListFilters {
  const read = (key: string) => {
    const value = searchParams?.[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const sortValue = read("sort");

  return {
    q: read("q")?.trim() ?? "",
    leadStage: (read("leadStage") as LeadStage | "") ?? "",
    websiteStatus: (read("websiteStatus") as WebsiteStatus | "") ?? "",
    priority: (read("priority") as LeadPriority | "") ?? "",
    leadSource: (read("leadSource") as LeadSource | "") ?? "",
    borough: read("borough") ?? "",
    sort: LEAD_SORT_OPTIONS.includes(sortValue as LeadSortOption)
      ? (sortValue as LeadSortOption)
      : "recently_updated",
  };
}

export async function getLeadsPageData(filters: LeadListFilters) {
  const { workspace } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    return {
      workspace,
      filters,
      leads: [] as LeadListItem[],
      boroughOptions: BOROUGH_OPTIONS,
    };
  }

  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select(
      "id, restaurant_name, neighborhood, borough, cuisine, google_maps_url, website_status, lead_stage, estimated_project_price, estimated_price_low, estimated_price_high, next_follow_up_at, last_contacted_at, priority, updated_at, lead_source",
    )
    .eq("workspace_id", workspace.id)
    .is("archived_at", null);

  if (filters.q) {
    query = query.or(
      `restaurant_name.ilike.%${filters.q}%,contact_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%,phone.ilike.%${filters.q}%,neighborhood.ilike.%${filters.q}%`,
    );
  }

  if (filters.leadStage) query = query.eq("lead_stage", filters.leadStage);
  if (filters.websiteStatus) query = query.eq("website_status", filters.websiteStatus);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.leadSource) query = query.eq("lead_source", filters.leadSource);
  if (filters.borough) query = query.eq("borough", filters.borough);

  switch (filters.sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "price_high_to_low":
      query = query.order("estimated_price_high", { ascending: false, nullsFirst: false });
      break;
    case "most_reviews":
      query = query.order("google_review_count", { ascending: false, nullsFirst: false });
      break;
    case "restaurant_price_high_to_low":
      query = query.order("google_price_level", { ascending: false, nullsFirst: false });
      break;
    case "restaurant_price_low_to_high":
      query = query.order("google_price_level", { ascending: true, nullsFirst: false });
      break;
    case "next_follow_up":
      query = query.order("next_follow_up_at", { ascending: true, nullsFirst: false });
      break;
    default:
      query = query.order("updated_at", { ascending: false });
      break;
  }

  const [{ data, error }, boroughsResponse] = await Promise.all([
    query,
    supabase
      .from("leads")
      .select("borough")
      .eq("workspace_id", workspace.id)
      .is("archived_at", null)
      .not("borough", "is", null),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const boroughOptions = Array.from(
    new Set([
      ...BOROUGH_OPTIONS,
      ...((boroughsResponse.data ?? []).map((row) => row.borough).filter(Boolean) as string[]),
    ]),
  );

  return {
    workspace,
    filters,
    leads: (data ?? []) as LeadListItem[],
    boroughOptions,
  };
}

export const getLeadDetailPageData = cache(async (leadId: string) => {
  const { workspace } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    notFound();
  }

  const supabase = await createClient();

  const { data: leadData, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("id", leadId)
    .single();

  if (leadError || !leadData) {
    notFound();
  }

  const lead = leadData as Database["public"]["Tables"]["leads"]["Row"];

  const [creatorResponse, notesResponse, outreachResponse, visitsResponse] = await Promise.all([
    lead.created_by
      ? supabase.from("profiles").select("id, full_name, email").eq("id", lead.created_by).single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("lead_notes")
      .select("id, workspace_id, lead_id, author_id, content, created_at, updated_at")
      .eq("workspace_id", workspace.id)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false }),
    supabase
      .from("outreach_events")
      .select(
        "id, workspace_id, lead_id, created_by, outreach_type, occurred_at, summary, outcome, next_follow_up_at, created_at",
      )
      .eq("workspace_id", workspace.id)
      .eq("lead_id", leadId)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("visits")
      .select(
        "id, workspace_id, lead_id, visited_by, visited_at, notes, outcome, best_time_to_return, created_at",
      )
      .eq("workspace_id", workspace.id)
      .eq("lead_id", leadId)
      .order("visited_at", { ascending: false }),
  ]);

  if (notesResponse.error) throw new Error(notesResponse.error.message);
  if (outreachResponse.error) throw new Error(outreachResponse.error.message);
  if (visitsResponse.error) throw new Error(visitsResponse.error.message);

  const authorIds = Array.from(
    new Set([
      ...((notesResponse.data ?? []).map((note) => note.author_id)),
      ...((outreachResponse.data ?? []).map((event) => event.created_by).filter(Boolean) as string[]),
      ...((visitsResponse.data ?? []).map((visit) => visit.visited_by).filter(Boolean) as string[]),
    ]),
  );

  const authorsResponse = authorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", authorIds)
    : { data: [], error: null };

  if (authorsResponse.error) throw new Error(authorsResponse.error.message);

  const authorMap = new Map((authorsResponse.data ?? []).map((author) => [author.id, author]));

  const notes: LeadNoteItem[] = (notesResponse.data ?? []).map((note) => ({
    ...note,
    author: authorMap.get(note.author_id) ?? null,
  }));

  const outreachEvents: OutreachEventItem[] = (outreachResponse.data ?? []).map((event) => ({
    ...event,
    author: event.created_by ? authorMap.get(event.created_by) ?? null : null,
  })) as OutreachEventItem[];

  const visits: VisitItem[] = (visitsResponse.data ?? []).map((visit) => ({
    ...visit,
    author: visit.visited_by ? authorMap.get(visit.visited_by) ?? null : null,
  })) as VisitItem[];

  return {
    workspace,
    lead: {
      ...lead,
      creator: creatorResponse.data ?? null,
    } as LeadDetail,
    notes,
    outreachEvents,
    visits,
  };
});
