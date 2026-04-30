import { z } from "zod";

export const routeGenerationSchema = z.object({
  route_name: z.string().trim().min(2, "Route name is required."),
  start_location: z.string().trim().min(2, "Start location is required."),
  end_location: z.string().trim().optional().transform((value) => value || ""),
  max_stops: z
    .union([z.number(), z.string()])
    .transform((value) => Number(value))
    .refine((value) => Number.isFinite(value) && value >= 1 && value <= 12, {
      message: "Max stops must be between 1 and 12.",
    }),
  neighborhood_focus: z.string().trim().optional().transform((value) => value || ""),
  source_filter: z.enum(["crm", "discovery", "both"]),
  exclude_recently_visited: z.boolean().default(true),
  lead_ids: z.array(z.uuid()).optional().default([]),
  discovery_result_ids: z.array(z.uuid()).optional().default([]),
});

export type RouteGenerationInput = z.input<typeof routeGenerationSchema>;
export type RouteGenerationValues = z.infer<typeof routeGenerationSchema>;
