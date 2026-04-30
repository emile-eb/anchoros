"use server";

import { revalidatePath } from "next/cache";
import { getWorkspaceContext } from "@/lib/data/workspace";
import { hasGoogleMapsEnv, hasSupabaseEnv } from "@/lib/env";
import { importPlaceFromGoogleMapsUrl } from "@/lib/google-maps/places";
import { createClient } from "@/lib/supabase/server";
import {
  googleMapsImportSchema,
  leadFormSchema,
  leadNoteSchema,
  leadStageUpdateSchema,
  outreachEventSchema,
  visitSchema,
  type GoogleMapsImportInput,
  type LeadFormValues,
  type LeadNoteValues,
  type OutreachEventValues,
  type VisitValues,
} from "@/lib/validators/leads";

type ActionState =
  | { ok: true; id?: string }
  | { ok: false; error: string };

type BulkDiscoveryImportState =
  | { ok: true; importedCount: number; skippedCount: number }
  | { ok: false; error: string };

type ImportActionState =
  | { ok: true; data: Awaited<ReturnType<typeof importPlaceFromGoogleMapsUrl>> }
  | { ok: false; error: string };

function revalidateLeadPaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  if (id) {
    revalidatePath(`/leads/${id}`);
  }
}

function formatServerError(context: string, error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return `${context}: ${String(error.message)}`;
  }

  return `${context}: Unknown error`;
}

function normalizeLeadFormSubmission(values: LeadFormValues) {
  return {
    ...values,
    contact_name: values.contact_name ?? undefined,
    phone: values.phone ?? undefined,
    email: values.email ?? undefined,
    instagram_handle: values.instagram_handle ?? undefined,
    address: values.address ?? undefined,
    neighborhood: values.neighborhood ?? undefined,
    borough: values.borough ?? undefined,
    cuisine: values.cuisine ?? undefined,
    existing_website_url: values.existing_website_url ?? undefined,
    last_contacted_at: values.last_contacted_at ?? undefined,
    next_follow_up_at: values.next_follow_up_at ?? undefined,
    status_notes: values.status_notes ?? undefined,
    google_maps_url: values.google_maps_url ?? undefined,
    google_place_id: values.google_place_id ?? undefined,
    google_rating: values.google_rating ?? undefined,
    google_review_count: values.google_review_count ?? undefined,
    google_price_level: values.google_price_level ?? undefined,
    google_business_status: values.google_business_status ?? undefined,
    google_primary_type: values.google_primary_type ?? undefined,
    google_imported_at: values.google_imported_at ?? undefined,
  };
}

export async function importGoogleMapsLeadAction(
  values: GoogleMapsImportInput,
): Promise<ImportActionState> {
  if (!hasGoogleMapsEnv()) {
    return {
      ok: false,
      error: "Google Maps import is not configured. Add GOOGLE_MAPS_API_KEY to enable it.",
    };
  }

  const parsed = googleMapsImportSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid Google Maps link." };
  }

  try {
    const data = await importPlaceFromGoogleMapsUrl(parsed.data.maps_url);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to import that Google Maps link.",
    };
  }
}

export async function createLeadAction(values: LeadFormValues): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to create leads." };
  }

  const parsed = leadFormSchema.safeParse(normalizeLeadFormSubmission(values));
  if (!parsed.success) {
    console.error("[createLeadAction] validation failed", parsed.error.flatten());
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lead payload." };
  }

  try {
    const { workspace, profile } = await getWorkspaceContext();
    const supabase = await createClient();

    const insertPayload = {
      ...parsed.data,
      workspace_id: workspace.id,
      created_by: profile.id,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      console.error("[createLeadAction] supabase insert failed", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payload: insertPayload,
      });
      return {
        ok: false,
        error: `Lead save failed: ${error.message}${error.code ? ` (${error.code})` : ""}`,
      };
    }

    revalidateLeadPaths(data.id);
    return { ok: true, id: data.id };
  } catch (error) {
    console.error("[createLeadAction] unexpected failure", error);
    return { ok: false, error: formatServerError("Lead save failed", error) };
  }
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildLeadFallbackKey(name: string | null | undefined, address: string | null | undefined) {
  const normalizedName = normalizeText(name);
  const normalizedAddress = normalizeText(address);

  if (!normalizedName || !normalizedAddress) {
    return null;
  }

  return `${normalizedName}::${normalizedAddress}`;
}

export async function importAllDiscoveryResultsAction(
  discoveryJobId: string,
): Promise<BulkDiscoveryImportState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to import leads." };
  }

  try {
    const { workspace, profile } = await getWorkspaceContext();
    const supabase = await createClient();

    const { data: discoveryRows, error: discoveryError } = await supabase
      .from("discovery_job_results")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("discovery_job_id", discoveryJobId)
      .eq("already_in_crm", false);

    if (discoveryError) {
      return { ok: false, error: discoveryError.message };
    }

    const candidates = discoveryRows ?? [];

    if (candidates.length === 0) {
      return { ok: true, importedCount: 0, skippedCount: 0 };
    }

    const { data: existingLeads, error: leadsError } = await supabase
      .from("leads")
      .select("id, restaurant_name, address, google_place_id")
      .eq("workspace_id", workspace.id)
      .is("archived_at", null);

    if (leadsError) {
      return { ok: false, error: leadsError.message };
    }

    const leadByPlaceId = new Map(
      (existingLeads ?? [])
        .filter((lead) => lead.google_place_id)
        .map((lead) => [lead.google_place_id as string, lead]),
    );
    const leadByFallback = new Map(
      (existingLeads ?? [])
        .map((lead) => [buildLeadFallbackKey(lead.restaurant_name, lead.address), lead] as const)
        .filter((entry): entry is [string, (typeof existingLeads)[number]] => Boolean(entry[0])),
    );

    const rowsToCreate: typeof candidates = [];
    const matchedLeadIds = new Map<string, string>();

    for (const row of candidates) {
      const existingLead =
        (row.google_place_id ? leadByPlaceId.get(row.google_place_id) : undefined) ??
        leadByFallback.get(buildLeadFallbackKey(row.restaurant_name, row.formatted_address) ?? "");

      if (existingLead) {
        matchedLeadIds.set(row.id, existingLead.id);
      } else {
        rowsToCreate.push(row);
      }
    }

    const insertPayload = rowsToCreate.map((row) => ({
      workspace_id: workspace.id,
      created_by: profile.id,
      restaurant_name: row.restaurant_name,
      contact_name: null,
      phone: null,
      email: null,
      instagram_handle: null,
      address: row.formatted_address,
      neighborhood: null,
      borough: null,
      cuisine: row.primary_type,
      existing_website_url: null,
      website_status: row.website_status,
      lead_source: "google_maps" as const,
      lead_stage: "new" as const,
      estimated_project_price: null,
      estimated_price_low: null,
      estimated_price_high: null,
      last_contacted_at: null,
      next_follow_up_at: null,
      priority: "medium" as const,
      status_notes: null,
      google_maps_url: row.google_maps_url,
      google_place_id: row.google_place_id,
      google_rating: row.rating,
      google_review_count: row.review_count,
      google_price_level: row.price_level,
      google_business_status: null,
      google_primary_type: row.primary_type,
      google_imported_at: row.created_at,
    }));

    const createdLeadMap = new Map<string, string>();

    if (insertPayload.length > 0) {
      const { data: insertedLeads, error: insertError } = await supabase
        .from("leads")
        .insert(insertPayload)
        .select("id, restaurant_name, address, google_place_id");

      if (insertError) {
        return { ok: false, error: insertError.message };
      }

      for (const lead of insertedLeads ?? []) {
        if (lead.google_place_id) {
          createdLeadMap.set(`place:${lead.google_place_id}`, lead.id);
        }

        const fallbackKey = buildLeadFallbackKey(lead.restaurant_name, lead.address);
        if (fallbackKey) {
          createdLeadMap.set(`fallback:${fallbackKey}`, lead.id);
        }
      }
    }

    const updates = candidates
      .map((row) => {
        const leadId =
          matchedLeadIds.get(row.id) ??
          (row.google_place_id ? createdLeadMap.get(`place:${row.google_place_id}`) : undefined) ??
          createdLeadMap.get(`fallback:${buildLeadFallbackKey(row.restaurant_name, row.formatted_address) ?? ""}`);

        return leadId
          ? {
              id: row.id,
              existing_lead_id: leadId,
            }
          : null;
      })
      .filter((value): value is { id: string; existing_lead_id: string } => Boolean(value));

    for (const update of updates) {
      const { error } = await supabase
        .from("discovery_job_results")
        .update({
          already_in_crm: true,
          existing_lead_id: update.existing_lead_id,
        })
        .eq("workspace_id", workspace.id)
        .eq("id", update.id);

      if (error) {
        return { ok: false, error: error.message };
      }
    }

    revalidateLeadPaths();
    revalidatePath("/discovery");

    return {
      ok: true,
      importedCount: rowsToCreate.length,
      skippedCount: matchedLeadIds.size,
    };
  } catch (error) {
    return { ok: false, error: formatServerError("Bulk import failed", error) };
  }
}

export async function updateLeadAction(
  leadId: string,
  values: LeadFormValues,
): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to edit leads." };
  }

  const parsed = leadFormSchema.safeParse(normalizeLeadFormSubmission(values));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid lead payload." };
  }

  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update(parsed.data)
    .eq("workspace_id", workspace.id)
    .eq("id", leadId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateLeadPaths(leadId);
  return { ok: true, id: leadId };
}

export async function updateLeadStageAction(values: {
  lead_id: string;
  lead_stage: LeadFormValues["lead_stage"];
}): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to update stages." };
  }

  const parsed = leadStageUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid stage update." };
  }

  const { workspace } = await getWorkspaceContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ lead_stage: parsed.data.lead_stage })
    .eq("workspace_id", workspace.id)
    .eq("id", parsed.data.lead_id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateLeadPaths(parsed.data.lead_id);
  return { ok: true, id: parsed.data.lead_id };
}

export async function addLeadNoteAction(values: LeadNoteValues): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to save notes." };
  }

  const parsed = leadNoteSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  const { workspace, profile } = await getWorkspaceContext();
  const supabase = await createClient();
  const { error } = await supabase.from("lead_notes").insert({
    lead_id: parsed.data.lead_id,
    content: parsed.data.content,
    workspace_id: workspace.id,
    author_id: profile.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateLeadPaths(parsed.data.lead_id);
  return { ok: true, id: parsed.data.lead_id };
}

export async function addOutreachEventAction(
  values: OutreachEventValues,
): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to log outreach." };
  }

  const parsed = outreachEventSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid outreach event.",
    };
  }

  const { workspace, profile } = await getWorkspaceContext();
  const supabase = await createClient();
  const occurredAt = parsed.data.occurred_at ?? new Date().toISOString();

  const [{ error: insertError }, { error: leadError }] = await Promise.all([
    supabase.from("outreach_events").insert({
      lead_id: parsed.data.lead_id,
      outreach_type: parsed.data.outreach_type,
      occurred_at: occurredAt,
      summary: parsed.data.summary,
      outcome: parsed.data.outcome,
      next_follow_up_at: parsed.data.next_follow_up_at,
      workspace_id: workspace.id,
      created_by: profile.id,
    }),
    supabase
      .from("leads")
      .update({
        last_contacted_at: occurredAt,
        next_follow_up_at: parsed.data.next_follow_up_at,
      })
      .eq("workspace_id", workspace.id)
      .eq("id", parsed.data.lead_id),
  ]);

  if (insertError || leadError) {
    return { ok: false, error: insertError?.message ?? leadError?.message ?? "Unable to log outreach." };
  }

  revalidateLeadPaths(parsed.data.lead_id);
  return { ok: true, id: parsed.data.lead_id };
}

export async function addVisitAction(values: VisitValues): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to log visits." };
  }

  const parsed = visitSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid visit." };
  }

  const { workspace, profile } = await getWorkspaceContext();
  const supabase = await createClient();
  const visitedAt = parsed.data.visited_at ?? new Date().toISOString();

  const [{ error: insertError }, { error: leadError }] = await Promise.all([
    supabase.from("visits").insert({
      lead_id: parsed.data.lead_id,
      visited_at: visitedAt,
      notes: parsed.data.notes,
      outcome: parsed.data.outcome,
      best_time_to_return: parsed.data.best_time_to_return,
      workspace_id: workspace.id,
      visited_by: profile.id,
    }),
    supabase
      .from("leads")
      .update({ last_contacted_at: visitedAt })
      .eq("workspace_id", workspace.id)
      .eq("id", parsed.data.lead_id),
  ]);

  if (insertError || leadError) {
    return { ok: false, error: insertError?.message ?? leadError?.message ?? "Unable to log visit." };
  }

  revalidateLeadPaths(parsed.data.lead_id);
  return { ok: true, id: parsed.data.lead_id };
}
