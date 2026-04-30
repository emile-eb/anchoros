import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireWorkspaceOwner } from "@/lib/data/workspace";
import type { Database } from "@/lib/types/database";
import { hashInviteToken, isWorkspaceInviteExpired } from "@/lib/workspace-invites";

export type WorkspaceInviteListItem = Database["public"]["Tables"]["workspace_invites"]["Row"] & {
  inviter: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email"> | null;
  accepter: Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email"> | null;
};

export type WorkspaceInvitePreview = Pick<
  Database["public"]["Tables"]["workspace_invites"]["Row"],
  "id" | "email" | "role" | "status" | "expires_at" | "workspace_id"
> & {
  workspace: Pick<Database["public"]["Tables"]["workspaces"]["Row"], "name" | "slug"> | null;
  effectiveStatus: Database["public"]["Enums"]["workspace_invite_status"];
};

type WorkspaceInvitePreviewRow = Pick<
  Database["public"]["Tables"]["workspace_invites"]["Row"],
  "id" | "email" | "role" | "status" | "expires_at" | "workspace_id"
> & {
  workspace: Pick<Database["public"]["Tables"]["workspaces"]["Row"], "name" | "slug"> | null;
};

export const getWorkspaceInvites = cache(async () => {
  const { workspace } = await requireWorkspaceOwner();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const inviterIds = Array.from(
    new Set(
      (data ?? [])
        .flatMap((invite) => [invite.invited_by, invite.accepted_by])
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const profilesResponse = inviterIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", inviterIds)
    : { data: [], error: null };

  if (profilesResponse.error) {
    throw new Error(profilesResponse.error.message);
  }

  const profileMap = new Map((profilesResponse.data ?? []).map((profile) => [profile.id, profile]));

  return (data ?? []).map((invite) => ({
    ...invite,
    inviter: invite.invited_by ? profileMap.get(invite.invited_by) ?? null : null,
    accepter: invite.accepted_by ? profileMap.get(invite.accepted_by) ?? null : null,
  })) as WorkspaceInviteListItem[];
});

export const getWorkspaceInvitePreviewByToken = cache(async (token: string) => {
  const admin = createAdminClient();
  const tokenHash = hashInviteToken(token);

  const { data, error } = await admin
    .from("workspace_invites")
    .select("id, email, role, status, expires_at, workspace_id, workspace:workspaces(name, slug)")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const invite = data as WorkspaceInvitePreviewRow | null;

  if (!invite) {
    return null;
  }

  const expired = invite.status === "pending" && isWorkspaceInviteExpired(invite.expires_at);

  if (expired) {
    await admin
      .from("workspace_invites")
      .update({ status: "expired" })
      .eq("id", invite.id)
      .eq("status", "pending");
  }

  return {
    ...invite,
    effectiveStatus: expired ? "expired" : invite.status,
  } as WorkspaceInvitePreview;
});
