import { z } from "zod";
import { workspaceInviteRoleOptions } from "@/lib/validators/workspace-invites";

export const updateWorkspaceMemberRoleSchema = z.object({
  memberId: z.uuid(),
  role: z.enum(workspaceInviteRoleOptions),
});

export const removeWorkspaceMemberSchema = z.object({
  memberId: z.uuid(),
});

export type UpdateWorkspaceMemberRoleInput = z.infer<typeof updateWorkspaceMemberRoleSchema>;
export type RemoveWorkspaceMemberInput = z.infer<typeof removeWorkspaceMemberSchema>;
