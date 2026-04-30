"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { requireUser } from "@/lib/auth";
import { requireWorkspaceOwner } from "@/lib/data/workspace";
import {
  acceptWorkspaceInviteSchema,
  createWorkspaceInviteSchema,
  revokeWorkspaceInviteSchema,
  type AcceptWorkspaceInviteInput,
  type CreateWorkspaceInviteInput,
  type RevokeWorkspaceInviteInput,
} from "@/lib/validators/workspace-invites";
import {
  createWorkspaceInviteToken,
  getWorkspaceInviteExpiry,
  hashInviteToken,
  isWorkspaceInviteExpired,
  normalizeInviteEmail,
} from "@/lib/workspace-invites";

type ActionState =
  | { ok: true; inviteId?: string; acceptPath?: string; alreadyMember?: boolean; workspaceSlug?: string }
  | { ok: false; error: string };

function revalidateWorkspaceInvitePaths() {
  revalidatePath("/settings");
  revalidatePath("/sign-up");
  revalidatePath("/login");
}

function buildAcceptPath(token: string) {
  return `/invite/${token}`;
}

async function buildAbsoluteAcceptUrl(token: string) {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return buildAcceptPath(token);
  }

  return `${proto}://${host}${buildAcceptPath(token)}`;
}

export async function createWorkspaceInviteAction(
  input: CreateWorkspaceInviteInput,
): Promise<ActionState & { inviteUrl?: string }> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to create invites." };
  }

  const parsed = createWorkspaceInviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid invite." };
  }

  try {
    const { workspace, profile } = await requireWorkspaceOwner();
    const supabase = await createClient();
    const email = normalizeInviteEmail(parsed.data.email);

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      return { ok: false, error: profileError.message };
    }

    if (profileRow?.id) {
      const { data: membershipRow, error: membershipError } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspace.id)
        .eq("user_id", profileRow.id)
        .maybeSingle();

      if (membershipError) {
        return { ok: false, error: membershipError.message };
      }

      if (membershipRow?.id) {
        return { ok: false, error: "That user is already a member of this workspace." };
      }
    }

    const token = createWorkspaceInviteToken();
    const tokenHash = hashInviteToken(token);
    const expiresAt = getWorkspaceInviteExpiry();

    const { data, error } = await supabase
      .from("workspace_invites")
      .insert({
        workspace_id: workspace.id,
        email,
        role: parsed.data.role,
        token_hash: tokenHash,
        invited_by: profile.id,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "A pending invite already exists for this email." };
      }

      return { ok: false, error: error.message };
    }

    revalidateWorkspaceInvitePaths();

    return {
      ok: true,
      inviteId: data.id,
      acceptPath: buildAcceptPath(token),
      inviteUrl: await buildAbsoluteAcceptUrl(token),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create invite.",
    };
  }
}

export async function revokeWorkspaceInviteAction(
  input: RevokeWorkspaceInviteInput,
): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to revoke invites." };
  }

  const parsed = revokeWorkspaceInviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid invite id." };
  }

  try {
    const { workspace } = await requireWorkspaceOwner();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("workspace_invites")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspace.id)
      .eq("id", parsed.data.inviteId)
      .eq("status", "pending")
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Invite could not be revoked." };
    }

    revalidateWorkspaceInvitePaths();
    return { ok: true, inviteId: data.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not revoke invite.",
    };
  }
}

export async function acceptWorkspaceInviteAction(
  input: AcceptWorkspaceInviteInput,
): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to accept invites." };
  }

  const parsed = acceptWorkspaceInviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid invite token." };
  }

  try {
    const user = await requireUser();
    const userEmail = normalizeInviteEmail(user.email ?? "");

    if (!userEmail) {
      return { ok: false, error: "Signed-in user email could not be resolved." };
    }

    const admin = createAdminClient();
    const tokenHash = hashInviteToken(parsed.data.token);

    const { data: invite, error: inviteError } = await admin
      .from("workspace_invites")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (inviteError) {
      return { ok: false, error: inviteError.message };
    }

    if (!invite) {
      return { ok: false, error: "Invite not found." };
    }

    if (normalizeInviteEmail(invite.email) !== userEmail) {
      return { ok: false, error: "This invite was sent to a different email address." };
    }

    if (invite.status === "revoked") {
      return { ok: false, error: "This invite has been revoked." };
    }

    if (invite.status === "accepted") {
      return { ok: false, error: "This invite has already been accepted." };
    }

    if (invite.status === "expired" || isWorkspaceInviteExpired(invite.expires_at)) {
      if (invite.status === "pending") {
        await admin
          .from("workspace_invites")
          .update({ status: "expired" })
          .eq("id", invite.id)
          .eq("status", "pending");
      }

      return { ok: false, error: "This invite has expired." };
    }

    const { data: existingMembership, error: existingMembershipError } = await admin
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", invite.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMembershipError) {
      return { ok: false, error: existingMembershipError.message };
    }

    const alreadyMember = Boolean(existingMembership?.id);

    if (!alreadyMember) {
      const { error: membershipInsertError } = await admin
        .from("workspace_members")
        .insert({
          workspace_id: invite.workspace_id,
          user_id: user.id,
          role: invite.role,
        });

      if (membershipInsertError && membershipInsertError.code !== "23505") {
        return { ok: false, error: membershipInsertError.message };
      }
    }

    const { error: inviteUpdateError } = await admin
      .from("workspace_invites")
      .update({
        status: "accepted",
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id)
      .eq("status", "pending");

    if (inviteUpdateError) {
      return { ok: false, error: inviteUpdateError.message };
    }

    const { data: workspace, error: workspaceError } = await admin
      .from("workspaces")
      .select("slug")
      .eq("id", invite.workspace_id)
      .single();

    if (workspaceError) {
      return { ok: false, error: workspaceError.message };
    }

    revalidateWorkspaceInvitePaths();

    return {
      ok: true,
      alreadyMember,
      workspaceSlug: workspace.slug,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not accept invite.",
    };
  }
}
