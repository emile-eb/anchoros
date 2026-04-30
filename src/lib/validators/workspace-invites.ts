import { z } from "zod";

export const workspaceInviteRoleOptions = ["owner", "member"] as const;

export const createWorkspaceInviteSchema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
  role: z.enum(workspaceInviteRoleOptions).default("member"),
});

export const revokeWorkspaceInviteSchema = z.object({
  inviteId: z.uuid(),
});

export const acceptWorkspaceInviteSchema = z.object({
  token: z.string().trim().min(20, "Invite token is invalid."),
});

export type CreateWorkspaceInviteInput = z.infer<typeof createWorkspaceInviteSchema>;
export type RevokeWorkspaceInviteInput = z.infer<typeof revokeWorkspaceInviteSchema>;
export type AcceptWorkspaceInviteInput = z.infer<typeof acceptWorkspaceInviteSchema>;
