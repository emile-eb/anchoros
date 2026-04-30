import { z } from "zod";
import {
  LEAD_PRIORITY_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  LEAD_STAGE_OPTIONS,
  OUTREACH_OUTCOME_OPTIONS,
  OUTREACH_TYPE_OPTIONS,
  VISIT_OUTCOME_OPTIONS,
  WEBSITE_STATUS_OPTIONS,
} from "@/lib/constants";

const optionalString = z.string().trim().optional().transform((value) => value || null);
const optionalNumber = z
  .union([z.number(), z.nan(), z.string()])
  .optional()
  .transform((value) => {
    if (value == null || value === "") {
      return null;
    }

    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  });

const optionalDateTime = z.string().optional().transform((value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
});

export const leadFormSchema = z.object({
  restaurant_name: z.string().trim().min(2, "Restaurant name is required."),
  contact_name: optionalString,
  phone: optionalString,
  email: z.email("Enter a valid email address.").or(z.literal("")).optional().transform((value) => value || null),
  instagram_handle: optionalString,
  address: optionalString,
  neighborhood: optionalString,
  borough: optionalString,
  cuisine: optionalString,
  existing_website_url: z.url("Enter a valid URL.").or(z.literal("")).optional().transform((value) => value || null),
  website_status: z.enum(WEBSITE_STATUS_OPTIONS),
  lead_source: z.enum(LEAD_SOURCE_OPTIONS),
  lead_stage: z.enum(LEAD_STAGE_OPTIONS),
  estimated_project_price: optionalNumber,
  estimated_price_low: optionalNumber,
  estimated_price_high: optionalNumber,
  last_contacted_at: optionalDateTime,
  next_follow_up_at: optionalDateTime,
  priority: z.enum(LEAD_PRIORITY_OPTIONS),
  status_notes: optionalString,
  google_maps_url: optionalString,
  google_place_id: optionalString,
  google_rating: optionalNumber,
  google_review_count: optionalNumber,
  google_price_level: optionalNumber,
  google_business_status: optionalString,
  google_primary_type: optionalString,
  google_imported_at: optionalDateTime,
});

export const googleMapsImportSchema = z.object({
  maps_url: z.url("Paste a valid Google Maps link."),
});

export const leadNoteSchema = z.object({
  lead_id: z.uuid(),
  content: z.string().trim().min(1, "Note cannot be empty."),
});

export const outreachEventSchema = z.object({
  lead_id: z.uuid(),
  outreach_type: z.enum(OUTREACH_TYPE_OPTIONS),
  occurred_at: optionalDateTime,
  summary: z.string().trim().min(1, "Summary is required."),
  outcome: z
    .enum(OUTREACH_OUTCOME_OPTIONS)
    .or(z.literal(""))
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
  next_follow_up_at: optionalDateTime,
});

export const visitSchema = z.object({
  lead_id: z.uuid(),
  visited_at: optionalDateTime,
  notes: optionalString,
  outcome: z
    .enum(VISIT_OUTCOME_OPTIONS)
    .or(z.literal(""))
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
  best_time_to_return: optionalString,
});

export const leadStageUpdateSchema = z.object({
  lead_id: z.uuid(),
  lead_stage: z.enum(LEAD_STAGE_OPTIONS),
});

export type LeadFormInput = z.input<typeof leadFormSchema>;
export type LeadFormValues = z.infer<typeof leadFormSchema>;
export type GoogleMapsImportInput = z.input<typeof googleMapsImportSchema>;
export type LeadNoteInput = z.input<typeof leadNoteSchema>;
export type LeadNoteValues = z.infer<typeof leadNoteSchema>;
export type OutreachEventInput = z.input<typeof outreachEventSchema>;
export type OutreachEventValues = z.infer<typeof outreachEventSchema>;
export type VisitInput = z.input<typeof visitSchema>;
export type VisitValues = z.infer<typeof visitSchema>;
