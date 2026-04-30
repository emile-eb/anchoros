import { createHash, randomBytes } from "node:crypto";

export function normalizeInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createWorkspaceInviteToken() {
  return randomBytes(24).toString("hex");
}

export function getWorkspaceInviteExpiry(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function isWorkspaceInviteExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}
