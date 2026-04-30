import { z } from "zod";
import {
  DISCOVERY_BUSINESS_TYPE_OPTIONS,
  DISCOVERY_MIN_REVIEW_OPTIONS,
  DISCOVERY_RESULT_LIMIT_OPTIONS,
  DISCOVERY_SUBTYPE_MODE_OPTIONS,
} from "@/lib/constants";
import type { DiscoveryRegionData } from "@/lib/discovery/types";

export const discoveryJobRequestSchema = z.object({
  searchMode: z.enum(["exact_region", "quick_area"]),
  query: z.string().trim().optional(),
  businessType: z.enum(DISCOVERY_BUSINESS_TYPE_OPTIONS.map((option) => option.value) as [string, ...string[]]),
  subtype: z.string().trim().optional().transform((value) => value || ""),
  subtypeMode: z.enum(DISCOVERY_SUBTYPE_MODE_OPTIONS.map((option) => option.value) as [string, ...string[]]),
  minimumReviews: z.union(DISCOVERY_MIN_REVIEW_OPTIONS.map((option) => z.literal(option)) as [z.ZodLiteral<10>, ...z.ZodLiteral<25 | 50 | 100>[]]),
  limit: z.union(DISCOVERY_RESULT_LIMIT_OPTIONS.map((option) => z.literal(option)) as [z.ZodLiteral<20>, ...z.ZodLiteral<50 | 100 | 200 | 250 | 500 | 1000>[]]),
  noWebsiteOnly: z.literal(true).default(true),
  regionType: z.enum(["rectangle", "circle", "polygon", "geocoded_area"]),
  regionData: z.custom<DiscoveryRegionData>((value) => Boolean(value), "Select or preview a region before starting the sweep."),
}).superRefine((value, ctx) => {
  if (value.searchMode === "quick_area" && (!value.query || value.query.trim().length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["query"],
      message: "Enter an area, neighborhood, or address.",
    });
  }
});

export type DiscoveryJobRequestInput = z.input<typeof discoveryJobRequestSchema>;
export type DiscoveryJobRequestValues = z.infer<typeof discoveryJobRequestSchema>;
