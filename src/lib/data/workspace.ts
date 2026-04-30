import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/types/database";

type WorkspaceMembershipRow = Database["public"]["Tables"]["workspace_members"]["Row"] & {
  workspace: Database["public"]["Tables"]["workspaces"]["Row"] | null;
};

type ProposalListItem = Pick<
  Database["public"]["Tables"]["proposals"]["Row"],
  "id" | "status" | "amount_cents" | "sent_at" | "created_at"
> & {
  leads: {
    restaurant_name: string;
  } | null;
};

export type WorkspaceMemberListItem = Pick<
  Database["public"]["Tables"]["workspace_members"]["Row"],
  "id" | "role" | "created_at"
> & {
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
};

export type CommandPaletteLeadItem = {
  id: string;
  restaurant_name: string;
  updated_at: string;
};

export type CommandPaletteRouteItem = {
  id: string;
  name: string;
  status: Database["public"]["Enums"]["route_status"];
  updated_at: string;
};

const previewWorkspace: Database["public"]["Tables"]["workspaces"]["Row"] = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Anchor Studios",
  slug: "anchor-studios",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const previewProfile: Database["public"]["Tables"]["profiles"]["Row"] = {
  id: "preview-user",
  email: "preview@anchorstudios.com",
  full_name: "Preview User",
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const previewMembership: Database["public"]["Tables"]["workspace_members"]["Row"] = {
  id: "preview-membership",
  workspace_id: previewWorkspace.id,
  user_id: previewProfile.id,
  role: "owner",
  created_at: new Date().toISOString(),
};

export const getWorkspaceContext = cache(async () => {
  const user = await requireUser();

  if (!hasSupabaseEnv()) {
    return {
      user,
      profile: previewProfile,
      workspace: previewWorkspace,
      membership: previewMembership,
      isPreview: true,
    };
  }

  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) throw new Error(profileError.message);

  const { data: membershipData, error: membershipError } = await supabase
    .from("workspace_members")
    .select("*, workspace:workspaces(*)")
    .eq("user_id", user.id)
    .single();

  const membership = membershipData as WorkspaceMembershipRow | null;

  if (membershipError || !membership?.workspace) {
    throw new Error(membershipError?.message ?? "No workspace membership found.");
  }

  return { user, profile, workspace: membership.workspace, membership, isPreview: false };
});

export async function requireWorkspaceOwner() {
  const context = await getWorkspaceContext();

  if (context.membership.role !== "owner") {
    throw new Error("Only workspace owners can perform this action.");
  }

  return context;
}

export async function getDiscoverySummary() {
  const { workspace } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    return { workspace, outreachCount: 0, visitCount: 0 };
  }

  const supabase = await createClient();
  const [{ count: outreachCount }, { count: visitCount }] = await Promise.all([
    supabase.from("outreach_events").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id),
    supabase.from("visits").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id),
  ]);

  return { workspace, outreachCount: outreachCount ?? 0, visitCount: visitCount ?? 0 };
}

export async function getRouteSummary() {
  const { workspace } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    return { workspace, routeCount: 0, stopCount: 0 };
  }

  const supabase = await createClient();
  const [{ count: routeCount }, { count: stopCount }] = await Promise.all([
    supabase.from("routes").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id),
    supabase.from("route_stops").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id),
  ]);

  return { workspace, routeCount: routeCount ?? 0, stopCount: stopCount ?? 0 };
}

export async function getProposalSummary() {
  const { workspace } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    return { workspace, proposals: [] as ProposalListItem[] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("id, status, amount_cents, sent_at, created_at, leads(restaurant_name)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) throw new Error(error.message);
  return { workspace, proposals: (data ?? []) as ProposalListItem[] };
}

export async function getSettingsSummary() {
  const { workspace, profile, membership } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    return {
      workspace,
      profile,
      membership,
      members: [
        {
          id: previewMembership.id,
          role: previewMembership.role,
          created_at: previewMembership.created_at,
          profiles: {
            id: previewProfile.id,
            full_name: previewProfile.full_name,
            email: previewProfile.email,
          },
        },
      ] as WorkspaceMemberListItem[],
    };
  }

  const supabase = await createClient();
  const { data: membersData, error } = await supabase
    .from("workspace_members")
    .select("id, role, created_at, profiles(id, full_name, email)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return { workspace, profile, membership, members: (membersData ?? []) as WorkspaceMemberListItem[] };
}

export async function getCommandPaletteData() {
  const { workspace } = await getWorkspaceContext();

  if (!hasSupabaseEnv()) {
    return {
      workspace,
      recentLeads: [] as CommandPaletteLeadItem[],
      recentRoutes: [] as CommandPaletteRouteItem[],
    };
  }

  const supabase = await createClient();
  const [leadsResponse, routesResponse] = await Promise.all([
    supabase
      .from("leads")
      .select("id, restaurant_name, updated_at")
      .eq("workspace_id", workspace.id)
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("routes")
      .select("id, name, status, updated_at")
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  if (leadsResponse.error) throw new Error(leadsResponse.error.message);
  if (routesResponse.error) throw new Error(routesResponse.error.message);

  return {
    workspace,
    recentLeads: (leadsResponse.data ?? []) as CommandPaletteLeadItem[],
    recentRoutes: (routesResponse.data ?? []) as CommandPaletteRouteItem[],
  };
}
