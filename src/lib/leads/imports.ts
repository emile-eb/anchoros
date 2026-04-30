import type { LeadFormInput, LeadFormValues } from "@/lib/validators/leads";

export type ImportedLeadDraft = Pick<
  LeadFormValues,
  | "restaurant_name"
  | "address"
  | "neighborhood"
  | "borough"
  | "phone"
  | "existing_website_url"
  | "website_status"
  | "lead_source"
  | "lead_stage"
  | "priority"
  | "cuisine"
  | "google_maps_url"
  | "google_place_id"
  | "google_rating"
  | "google_review_count"
  | "google_price_level"
  | "google_business_status"
  | "google_primary_type"
  | "google_imported_at"
> & {
  resolved_query: string | null;
};

export function getImportedLeadDefaults(imported: ImportedLeadDraft | null): LeadFormInput {
  return {
    restaurant_name: imported?.restaurant_name ?? "",
    contact_name: "",
    phone: imported?.phone ?? "",
    email: "",
    instagram_handle: "",
    address: imported?.address ?? "",
    neighborhood: imported?.neighborhood ?? "",
    borough: imported?.borough ?? "",
    cuisine: imported?.cuisine ?? "",
    existing_website_url: imported?.existing_website_url ?? "",
    website_status: imported?.website_status ?? "unknown",
    lead_source: imported?.lead_source ?? "google_maps",
    lead_stage: imported?.lead_stage ?? "new",
    estimated_project_price: undefined,
    estimated_price_low: undefined,
    estimated_price_high: undefined,
    last_contacted_at: "",
    next_follow_up_at: "",
    priority: imported?.priority ?? "medium",
    status_notes: "",
    google_maps_url: imported?.google_maps_url ?? "",
    google_place_id: imported?.google_place_id ?? "",
    google_rating: imported?.google_rating ?? undefined,
    google_review_count: imported?.google_review_count ?? undefined,
    google_price_level: imported?.google_price_level ?? undefined,
    google_business_status: imported?.google_business_status ?? "",
    google_primary_type: imported?.google_primary_type ?? "",
    google_imported_at: imported?.google_imported_at ?? "",
  };
}
