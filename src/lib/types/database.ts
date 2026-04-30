export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      discovery_job_results: {
        Row: {
          already_in_crm: boolean;
          created_at: string;
          discovery_job_id: string;
          existing_lead_id: string | null;
          formatted_address: string | null;
          google_maps_url: string | null;
          google_place_id: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          matched_subtype: string | null;
          price_level: number | null;
          primary_type: string | null;
          rating: number | null;
          region_match: boolean;
          restaurant_name: string;
          review_count: number | null;
          website_status: Database["public"]["Enums"]["website_status"];
          website_url: string | null;
          workspace_id: string;
        };
        Insert: {
          already_in_crm?: boolean;
          created_at?: string;
          discovery_job_id: string;
          existing_lead_id?: string | null;
          formatted_address?: string | null;
          google_maps_url?: string | null;
          google_place_id?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          matched_subtype?: string | null;
          price_level?: number | null;
          primary_type?: string | null;
          rating?: number | null;
          region_match?: boolean;
          restaurant_name: string;
          review_count?: number | null;
          website_status?: Database["public"]["Enums"]["website_status"];
          website_url?: string | null;
          workspace_id: string;
        };
        Update: {
          already_in_crm?: boolean;
          created_at?: string;
          discovery_job_id?: string;
          existing_lead_id?: string | null;
          formatted_address?: string | null;
          google_maps_url?: string | null;
          google_place_id?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          matched_subtype?: string | null;
          price_level?: number | null;
          primary_type?: string | null;
          rating?: number | null;
          region_match?: boolean;
          restaurant_name?: string;
          review_count?: number | null;
          website_status?: Database["public"]["Enums"]["website_status"];
          website_url?: string | null;
          workspace_id?: string;
        };
        Relationships: [];
      };
      discovery_jobs: {
        Row: {
          business_type: string;
          candidates_dropped_has_website: number;
          candidates_dropped_low_reviews: number;
          candidates_dropped_subtype: number;
          candidates_passing_no_website_filter: number;
          candidates_passing_review_filter: number;
          completed_tiles: number;
          created_at: string;
          current_phase: string | null;
          debug_summary: Json | null;
          desired_final_results: number;
          error_message: string | null;
          exact_geometry: boolean;
          finished_at: string | null;
          id: string;
          minimum_reviews: number;
          no_website_places_found: number;
          no_website_only: boolean;
          query: string;
          raw_places_found: number;
          raw_query: string | null;
          region_data: Json | null;
          region_type: Database["public"]["Enums"]["discovery_region_type"];
          search_mode: Database["public"]["Enums"]["discovery_search_mode"];
          started_at: string | null;
          status: Database["public"]["Enums"]["discovery_job_status"];
          subtype: string | null;
          subtype_mode: Database["public"]["Enums"]["discovery_subtype_mode"];
          target_results: number;
          total_tiles: number;
          unique_places_found: number;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          business_type?: string;
          candidates_dropped_has_website?: number;
          candidates_dropped_low_reviews?: number;
          candidates_dropped_subtype?: number;
          candidates_passing_no_website_filter?: number;
          candidates_passing_review_filter?: number;
          completed_tiles?: number;
          created_at?: string;
          current_phase?: string | null;
          debug_summary?: Json | null;
          desired_final_results?: number;
          error_message?: string | null;
          exact_geometry?: boolean;
          finished_at?: string | null;
          id?: string;
          minimum_reviews?: number;
          no_website_places_found?: number;
          no_website_only?: boolean;
          query: string;
          raw_places_found?: number;
          raw_query?: string | null;
          region_data?: Json | null;
          region_type?: Database["public"]["Enums"]["discovery_region_type"];
          search_mode?: Database["public"]["Enums"]["discovery_search_mode"];
          started_at?: string | null;
          status?: Database["public"]["Enums"]["discovery_job_status"];
          subtype?: string | null;
          subtype_mode?: Database["public"]["Enums"]["discovery_subtype_mode"];
          target_results?: number;
          total_tiles?: number;
          unique_places_found?: number;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          business_type?: string;
          candidates_dropped_has_website?: number;
          candidates_dropped_low_reviews?: number;
          candidates_dropped_subtype?: number;
          candidates_passing_no_website_filter?: number;
          candidates_passing_review_filter?: number;
          completed_tiles?: number;
          created_at?: string;
          current_phase?: string | null;
          debug_summary?: Json | null;
          desired_final_results?: number;
          error_message?: string | null;
          exact_geometry?: boolean;
          finished_at?: string | null;
          id?: string;
          minimum_reviews?: number;
          no_website_places_found?: number;
          no_website_only?: boolean;
          query?: string;
          raw_places_found?: number;
          raw_query?: string | null;
          region_data?: Json | null;
          region_type?: Database["public"]["Enums"]["discovery_region_type"];
          search_mode?: Database["public"]["Enums"]["discovery_search_mode"];
          started_at?: string | null;
          status?: Database["public"]["Enums"]["discovery_job_status"];
          subtype?: string | null;
          subtype_mode?: Database["public"]["Enums"]["discovery_subtype_mode"];
          target_results?: number;
          total_tiles?: number;
          unique_places_found?: number;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      lead_notes: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          id: string;
          lead_id: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          id?: string;
          lead_id: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          lead_id?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          address: string | null;
          address_line_1: string | null;
          address_line_2: string | null;
          archived_at: string | null;
          assigned_to: string | null;
          borough: string | null;
          city: string | null;
          contact_name: string | null;
          created_at: string;
          created_by: string | null;
          cuisine: string | null;
          email: string | null;
          estimated_price_high: number | null;
          estimated_price_low: number | null;
          estimated_project_price: number | null;
          existing_website_url: string | null;
          google_business_status: string | null;
          google_imported_at: string | null;
          google_maps_url: string | null;
          google_place_id: string | null;
          google_price_level: number | null;
          google_primary_type: string | null;
          google_rating: number | null;
          google_review_count: number | null;
          id: string;
          instagram_handle: string | null;
          last_contacted_at: string | null;
          lead_source: Database["public"]["Enums"]["lead_source"];
          lead_stage: Database["public"]["Enums"]["lead_stage"];
          neighborhood: string | null;
          next_follow_up_at: string | null;
          phone: string | null;
          priority: Database["public"]["Enums"]["lead_priority"];
          restaurant_name: string;
          state: string | null;
          status_notes: string | null;
          updated_at: string;
          website_status: Database["public"]["Enums"]["website_status"];
          workspace_id: string;
          zip_code: string | null;
        };
        Insert: {
          address?: string | null;
          address_line_1?: string | null;
          address_line_2?: string | null;
          archived_at?: string | null;
          assigned_to?: string | null;
          borough?: string | null;
          city?: string | null;
          contact_name?: string | null;
          created_at?: string;
          created_by?: string | null;
          cuisine?: string | null;
          email?: string | null;
          estimated_price_high?: number | null;
          estimated_price_low?: number | null;
          estimated_project_price?: number | null;
          existing_website_url?: string | null;
          google_business_status?: string | null;
          google_imported_at?: string | null;
          google_maps_url?: string | null;
          google_place_id?: string | null;
          google_price_level?: number | null;
          google_primary_type?: string | null;
          google_rating?: number | null;
          google_review_count?: number | null;
          id?: string;
          instagram_handle?: string | null;
          last_contacted_at?: string | null;
          lead_source?: Database["public"]["Enums"]["lead_source"];
          lead_stage?: Database["public"]["Enums"]["lead_stage"];
          neighborhood?: string | null;
          next_follow_up_at?: string | null;
          phone?: string | null;
          priority?: Database["public"]["Enums"]["lead_priority"];
          restaurant_name: string;
          state?: string | null;
          status_notes?: string | null;
          updated_at?: string;
          website_status?: Database["public"]["Enums"]["website_status"];
          workspace_id: string;
          zip_code?: string | null;
        };
        Update: {
          address?: string | null;
          address_line_1?: string | null;
          address_line_2?: string | null;
          archived_at?: string | null;
          assigned_to?: string | null;
          borough?: string | null;
          city?: string | null;
          contact_name?: string | null;
          created_at?: string;
          created_by?: string | null;
          cuisine?: string | null;
          email?: string | null;
          estimated_price_high?: number | null;
          estimated_price_low?: number | null;
          estimated_project_price?: number | null;
          existing_website_url?: string | null;
          google_business_status?: string | null;
          google_imported_at?: string | null;
          google_maps_url?: string | null;
          google_place_id?: string | null;
          google_price_level?: number | null;
          google_primary_type?: string | null;
          google_rating?: number | null;
          google_review_count?: number | null;
          id?: string;
          instagram_handle?: string | null;
          last_contacted_at?: string | null;
          lead_source?: Database["public"]["Enums"]["lead_source"];
          lead_stage?: Database["public"]["Enums"]["lead_stage"];
          neighborhood?: string | null;
          next_follow_up_at?: string | null;
          phone?: string | null;
          priority?: Database["public"]["Enums"]["lead_priority"];
          restaurant_name?: string;
          state?: string | null;
          status_notes?: string | null;
          updated_at?: string;
          website_status?: Database["public"]["Enums"]["website_status"];
          workspace_id?: string;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      outreach_events: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          lead_id: string;
          next_follow_up_at: string | null;
          occurred_at: string;
          outcome: Database["public"]["Enums"]["outreach_outcome"] | null;
          outreach_type: Database["public"]["Enums"]["outreach_type"];
          summary: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          lead_id: string;
          next_follow_up_at?: string | null;
          occurred_at?: string;
          outcome?: Database["public"]["Enums"]["outreach_outcome"] | null;
          outreach_type: Database["public"]["Enums"]["outreach_type"];
          summary: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          lead_id?: string;
          next_follow_up_at?: string | null;
          occurred_at?: string;
          outcome?: Database["public"]["Enums"]["outreach_outcome"] | null;
          outreach_type?: Database["public"]["Enums"]["outreach_type"];
          summary?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      proposals: {
        Row: {
          amount_cents: number | null;
          created_at: string;
          id: string;
          lead_id: string;
          sent_at: string | null;
          status: string;
          summary: string | null;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          amount_cents?: number | null;
          created_at?: string;
          id?: string;
          lead_id: string;
          sent_at?: string | null;
          status?: string;
          summary?: string | null;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          amount_cents?: number | null;
          created_at?: string;
          id?: string;
          lead_id?: string;
          sent_at?: string | null;
          status?: string;
          summary?: string | null;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      route_stops: {
        Row: {
          arrived_at: string | null;
          completed_at: string | null;
          created_at: string;
          discovery_job_result_id: string | null;
          formatted_address: string | null;
          google_place_id: string | null;
          id: string;
          latitude: number | null;
          lead_id: string | null;
          longitude: number | null;
          notes: string | null;
          route_id: string;
          restaurant_name: string | null;
          status: Database["public"]["Enums"]["route_stop_status"];
          stop_order: number;
          updated_at: string;
          visit_outcome: Database["public"]["Enums"]["visit_outcome"] | null;
          workspace_id: string;
        };
        Insert: {
          arrived_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          discovery_job_result_id?: string | null;
          formatted_address?: string | null;
          google_place_id?: string | null;
          id?: string;
          latitude?: number | null;
          lead_id?: string | null;
          longitude?: number | null;
          notes?: string | null;
          route_id: string;
          restaurant_name?: string | null;
          status?: Database["public"]["Enums"]["route_stop_status"];
          stop_order: number;
          updated_at?: string;
          visit_outcome?: Database["public"]["Enums"]["visit_outcome"] | null;
          workspace_id: string;
        };
        Update: {
          arrived_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          discovery_job_result_id?: string | null;
          formatted_address?: string | null;
          google_place_id?: string | null;
          id?: string;
          latitude?: number | null;
          lead_id?: string | null;
          longitude?: number | null;
          notes?: string | null;
          route_id?: string;
          restaurant_name?: string | null;
          status?: Database["public"]["Enums"]["route_stop_status"];
          stop_order?: number;
          updated_at?: string;
          visit_outcome?: Database["public"]["Enums"]["visit_outcome"] | null;
          workspace_id?: string;
        };
        Relationships: [];
      };
      routes: {
        Row: {
          created_at: string;
          created_by: string | null;
          destination_label: string | null;
          destination_latitude: number | null;
          destination_longitude: number | null;
          estimated_distance_meters: number | null;
          estimated_duration_minutes: number | null;
          id: string;
          name: string;
          origin_label: string | null;
          origin_latitude: number | null;
          origin_longitude: number | null;
          scheduled_for: string | null;
          source_type: Database["public"]["Enums"]["route_source_type"];
          status: Database["public"]["Enums"]["route_status"];
          total_stops: number;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          destination_label?: string | null;
          destination_latitude?: number | null;
          destination_longitude?: number | null;
          estimated_distance_meters?: number | null;
          estimated_duration_minutes?: number | null;
          id?: string;
          name: string;
          origin_label?: string | null;
          origin_latitude?: number | null;
          origin_longitude?: number | null;
          scheduled_for?: string | null;
          source_type?: Database["public"]["Enums"]["route_source_type"];
          status?: Database["public"]["Enums"]["route_status"];
          total_stops?: number;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          destination_label?: string | null;
          destination_latitude?: number | null;
          destination_longitude?: number | null;
          estimated_distance_meters?: number | null;
          estimated_duration_minutes?: number | null;
          id?: string;
          name?: string;
          origin_label?: string | null;
          origin_latitude?: number | null;
          origin_longitude?: number | null;
          scheduled_for?: string | null;
          source_type?: Database["public"]["Enums"]["route_source_type"];
          status?: Database["public"]["Enums"]["route_status"];
          total_stops?: number;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      visits: {
        Row: {
          best_time_to_return: string | null;
          created_at: string;
          id: string;
          lead_id: string;
          notes: string | null;
          outcome: Database["public"]["Enums"]["visit_outcome"] | null;
          visited_at: string;
          visited_by: string | null;
          workspace_id: string;
        };
        Insert: {
          best_time_to_return?: string | null;
          created_at?: string;
          id?: string;
          lead_id: string;
          notes?: string | null;
          outcome?: Database["public"]["Enums"]["visit_outcome"] | null;
          visited_at?: string;
          visited_by?: string | null;
          workspace_id: string;
        };
        Update: {
          best_time_to_return?: string | null;
          created_at?: string;
          id?: string;
          lead_id?: string;
          notes?: string | null;
          outcome?: Database["public"]["Enums"]["visit_outcome"] | null;
          visited_at?: string;
          visited_by?: string | null;
          workspace_id?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id: string;
          workspace_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["workspace_role"];
          user_id?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      workspace_invites: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          revoked_at: string | null;
          role: Database["public"]["Enums"]["workspace_role"];
          status: Database["public"]["Enums"]["workspace_invite_status"];
          token_hash: string;
          updated_at: string;
          workspace_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["workspace_role"];
          status?: Database["public"]["Enums"]["workspace_invite_status"];
          token_hash: string;
          updated_at?: string;
          workspace_id: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          revoked_at?: string | null;
          role?: Database["public"]["Enums"]["workspace_role"];
          status?: Database["public"]["Enums"]["workspace_invite_status"];
          token_hash?: string;
          updated_at?: string;
          workspace_id?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      discovery_region_type: "rectangle" | "circle" | "polygon" | "geocoded_area";
      discovery_search_mode: "exact_region" | "quick_area";
      discovery_job_status: "queued" | "running" | "completed" | "failed";
      discovery_subtype_mode: "strict" | "broad";
      lead_priority: "low" | "medium" | "high";
      lead_source:
        | "walk_in"
        | "referral"
        | "google_maps"
        | "instagram"
        | "cold_outreach"
        | "other";
      lead_stage:
        | "new"
        | "researching"
        | "contacted"
        | "follow_up"
        | "meeting_scheduled"
        | "proposal_sent"
        | "won"
        | "lost"
        | "qualified"
        | "on_hold";
      outreach_outcome:
        | "no_response"
        | "spoke_to_staff"
        | "spoke_to_owner"
        | "interested"
        | "not_interested"
        | "follow_up_needed"
        | "meeting_booked";
      outreach_type:
        | "email"
        | "call"
        | "text"
        | "visit"
        | "social"
        | "other"
        | "in_person"
        | "instagram_dm";
      route_source_type: "crm" | "discovery" | "both" | "auto_pick";
      route_status: "draft" | "ready" | "in_progress" | "paused" | "completed" | "archived";
      route_stop_status:
        | "pending"
        | "active"
        | "skipped"
        | "visited"
        | "completed"
        | "revisit_needed";
      visit_outcome:
        | "not_open"
        | "staff_only"
        | "owner_not_there"
        | "spoke_to_owner"
        | "left_card"
        | "revisit_needed";
      website_status:
        | "no_website"
        | "outdated_website"
        | "decent_website"
        | "strong_website"
        | "unknown";
      workspace_invite_status: "pending" | "accepted" | "revoked" | "expired";
      workspace_role: "owner" | "member";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
export type DiscoveryJob = Database["public"]["Tables"]["discovery_jobs"]["Row"];
export type DiscoveryJobResult = Database["public"]["Tables"]["discovery_job_results"]["Row"];
export type DiscoveryJobStatus = Database["public"]["Enums"]["discovery_job_status"];
export type LeadStage = Database["public"]["Enums"]["lead_stage"];
export type LeadPriority = Database["public"]["Enums"]["lead_priority"];
export type LeadSource = Database["public"]["Enums"]["lead_source"];
export type WebsiteStatus = Database["public"]["Enums"]["website_status"];
export type RouteStatus = Database["public"]["Enums"]["route_status"];
export type RouteStopStatus = Database["public"]["Enums"]["route_stop_status"];
export type RouteSourceType = Database["public"]["Enums"]["route_source_type"];
export type OutreachType = Database["public"]["Enums"]["outreach_type"];
export type OutreachOutcome = Database["public"]["Enums"]["outreach_outcome"];
export type VisitOutcome = Database["public"]["Enums"]["visit_outcome"];
