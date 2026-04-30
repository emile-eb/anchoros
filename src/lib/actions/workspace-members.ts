"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import { requireWorkspaceOwner } from "@/lib/data/workspace";
import {
  removeWorkspaceMemberSchema,
  updateWorkspaceMemberRoleSchema,
  type RemoveWorkspaceMemberInput,
  type UpdateWorkspaceMemberRoleInput,
} from "@/lib/validators/workspace-members";

type ActionState =
  | { ok: true }
  | { ok: false; error: string };

function revalidateWorkspaceMemberPaths() {
  revalidatePath("/settings");
}

async function countWorkspaceOwners(workspaceId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("workspace_members")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("role", "owner");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function updateWorkspaceMemberRoleAction(
  input: UpdateWorkspaceMemberRoleInput,
): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to manage members." };
  }

  const parsed = updateWorkspaceMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid member update." };
  }

  try {
    const { workspace } = await requireWorkspaceOwner();
    const supabase = await createClient();

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("id, role")
      .eq("workspace_id", workspace.id)
      .eq("id", parsed.data.memberId)
      .single();

    if (memberError || !member) {
      return { ok: false, error: memberError?.message ?? "Workspace member not found." };
    }

    if (member.role === "owner" && parsed.data.role !== "owner") {
      const ownerCount = await countWorkspaceOwners(workspace.id);
      if (ownerCount <= 1) {
        return { ok: false, error: "The last remaining owner cannot be demoted." };
      }
    }

    const { error } = await supabase
      .from("workspace_members")
      .update({ role: parsed.data.role })
      .eq("workspace_id", workspace.id)
      .eq("id", parsed.data.memberId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateWorkspaceMemberPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not update member role.",
    };
  }
}

export async function removeWorkspaceMemberAction(
  input: RemoveWorkspaceMemberInput,
): Promise<ActionState> {
  if (!hasSupabaseEnv()) {
    return { ok: false, error: "Preview mode is active. Add Supabase keys to manage members." };
  }

  const parsed = removeWorkspaceMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid member removal." };
  }

  try {
    const { workspace } = await requireWorkspaceOwner();
    const supabase = await createClient();

    const { data: member, error: memberError } = await supabase
      .from("workspace_members")
      .select("id, role")
      .eq("workspace_id", workspace.id)
      .eq("id", parsed.data.memberId)
      .single();

    if (memberError || !member) {
      return { ok: false, error: memberError?.message ?? "Workspace member not found." };
    }

    if (member.role === "owner") {
      const ownerCount = await countWorkspaceOwners(workspace.id);
      if (ownerCount <= 1) {
        return { ok: false, error: "The last remaining owner cannot be removed." };
      }
    }

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspace.id)
      .eq("id", parsed.data.memberId);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateWorkspaceMemberPaths();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not remove member.",
    };
  }
}
