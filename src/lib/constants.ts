import type { LucideIcon } from "lucide-react";
import {
  Compass,
  FileText,
  LayoutDashboard,
  Route,
  Settings,
  Users,
} from "lucide-react";
import type {
  LeadPriority,
  LeadSource,
  LeadStage,
  OutreachOutcome,
  OutreachType,
  VisitOutcome,
  WebsiteStatus,
} from "@/lib/types/database";

export const APP_NAME = "Anchor Studios OS";
export const SEEDED_WORKSPACE_ID = "11111111-1111-1111-1111-111111111111";

export type AppNavItem = {
  href: "/dashboard" | "/leads" | "/discovery" | "/routes" | "/proposals" | "/settings";
  label: string;
  icon: LucideIcon;
  description: string;
};

export const APP_NAV: AppNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Daily pipeline overview",
  },
  {
    href: "/leads",
    label: "Leads",
    icon: Users,
    description: "Sales pipeline and notes",
  },
  {
    href: "/discovery",
    label: "Discovery",
    icon: Compass,
    description: "No-website prospect sweeps",
  },
  {
    href: "/routes",
    label: "Routes",
    icon: Route,
    description: "Field plans and stop lists",
  },
  {
    href: "/proposals",
    label: "Proposals",
    icon: FileText,
    description: "Quote pipeline and outcomes",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    description: "Workspace and member access",
  },
];

export const LEAD_STAGE_OPTIONS: LeadStage[] = [
  "new",
  "researching",
  "contacted",
  "follow_up",
  "meeting_scheduled",
  "proposal_sent",
  "won",
  "lost",
];

export const WEBSITE_STATUS_OPTIONS: WebsiteStatus[] = [
  "no_website",
  "outdated_website",
  "decent_website",
  "strong_website",
  "unknown",
];

export const LEAD_SOURCE_OPTIONS: LeadSource[] = [
  "walk_in",
  "referral",
  "google_maps",
  "instagram",
  "cold_outreach",
  "other",
];

export const LEAD_PRIORITY_OPTIONS: LeadPriority[] = ["low", "medium", "high"];

export const OUTREACH_TYPE_OPTIONS: OutreachType[] = [
  "in_person",
  "call",
  "text",
  "email",
  "instagram_dm",
  "other",
];

export const OUTREACH_OUTCOME_OPTIONS: OutreachOutcome[] = [
  "no_response",
  "spoke_to_staff",
  "spoke_to_owner",
  "interested",
  "not_interested",
  "follow_up_needed",
  "meeting_booked",
];

export const VISIT_OUTCOME_OPTIONS: VisitOutcome[] = [
  "not_open",
  "staff_only",
  "owner_not_there",
  "spoke_to_owner",
  "left_card",
  "revisit_needed",
];

export const BOROUGH_OPTIONS = [
  "Bronx",
  "Brooklyn",
  "Manhattan",
  "Queens",
  "Staten Island",
];

export const LEAD_SORT_OPTIONS = [
  "newest",
  "oldest",
  "recently_updated",
  "price_high_to_low",
  "most_reviews",
  "restaurant_price_high_to_low",
  "restaurant_price_low_to_high",
  "next_follow_up",
] as const;

export type LeadSortOption = (typeof LEAD_SORT_OPTIONS)[number];

export const DISCOVERY_BUSINESS_TYPE_OPTIONS = [
  { value: "restaurant", label: "Restaurants" },
  { value: "coffee_shop", label: "Coffee shops" },
  { value: "cafe", label: "Cafes" },
  { value: "pizza_restaurant", label: "Pizza" },
  { value: "bakery", label: "Bakeries" },
  { value: "bar", label: "Bars" },
] as const;

export const DISCOVERY_RESULT_LIMIT_OPTIONS = [20, 50, 100, 200, 250, 500, 1000] as const;
export const DISCOVERY_MIN_REVIEW_OPTIONS = [10, 25, 50, 100] as const;
export const DISCOVERY_SUBTYPE_MODE_OPTIONS = [
  { value: "broad", label: "Broad" },
  { value: "strict", label: "Strict" },
] as const;

export const DISCOVERY_SORT_OPTIONS = [
  "most_reviews",
  "highest_rating",
  "price_high_to_low",
  "price_low_to_high",
  "alphabetical",
] as const;

export const DISCOVERY_MIN_RATING_OPTIONS = [
  { value: "", label: "Any rating" },
  { value: "4", label: "4.0+" },
  { value: "4.5", label: "4.5+" },
] as const;

export const DISCOVERY_PRICE_LEVEL_OPTIONS = [
  { value: "", label: "Any price" },
  { value: "1", label: "$" },
  { value: "2", label: "$$" },
  { value: "3", label: "$$$" },
  { value: "4", label: "$$$$" },
] as const;

export const DISCOVERY_SUGGESTED_SEARCHES = [
  { label: "Restaurants in Williamsburg", query: "Williamsburg Brooklyn", businessType: "restaurant" },
  { label: "Coffee shops in Brooklyn", query: "Brooklyn", businessType: "coffee_shop" },
  { label: "Pizza in Park Slope", query: "Park Slope Brooklyn", businessType: "pizza_restaurant" },
  { label: "Cafes in Ditmas Park", query: "Ditmas Park Brooklyn", businessType: "cafe" },
] as const;

export type DiscoveryBusinessType = (typeof DISCOVERY_BUSINESS_TYPE_OPTIONS)[number]["value"];
export type DiscoverySortOption = (typeof DISCOVERY_SORT_OPTIONS)[number];
