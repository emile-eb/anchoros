import { Clock3, MailWarning, ShieldAlert } from "lucide-react";
import { InviteAcceptCard } from "@/components/auth/invite-accept-card";
import { InviteClaimCard } from "@/components/auth/invite-claim-card";
import { AuthShell } from "@/components/auth/auth-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { getWorkspaceInvitePreviewByToken } from "@/lib/data/workspace-invites";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!hasSupabaseEnv()) {
    return (
      <AuthShell
        eyebrow="Workspace invite"
        title="Invites need a configured environment."
        description="Workspace acceptance depends on Supabase auth and database access. Add the required environment variables before using invites."
      >
        <Card className="w-full max-w-[32rem] border-[#e5e7eb] bg-white">
          <CardHeader>
            <CardTitle>Invite unavailable</CardTitle>
            <CardDescription>
              This environment is running in preview mode, so invite acceptance is disabled.
            </CardDescription>
          </CardHeader>
        </Card>
      </AuthShell>
    );
  }

  const invite = await getWorkspaceInvitePreviewByToken(token);

  if (!invite) {
    return (
      <AuthShell
        eyebrow="Workspace invite"
        title="This invite link is not valid."
        description="The token could not be matched to an active workspace invitation."
      >
        <Card className="w-full max-w-[32rem] border-[#e5e7eb] bg-white">
          <CardHeader>
            <CardTitle>Invite not found</CardTitle>
            <CardDescription>
              Ask the workspace owner to create a fresh invite link.
            </CardDescription>
          </CardHeader>
        </Card>
      </AuthShell>
    );
  }

  const user = await getSessionUser();
  const statusInfo =
    invite.effectiveStatus === "expired"
      ? {
          title: "This invite has expired.",
          description: "Ask the workspace owner to issue a fresh invite link.",
          icon: <Clock3 className="mt-0.5 size-4 shrink-0 text-neutral-500" />,
        }
      : invite.effectiveStatus === "revoked"
        ? {
            title: "This invite has been revoked.",
            description: "The workspace owner removed this invitation before it was accepted.",
            icon: <ShieldAlert className="mt-0.5 size-4 shrink-0 text-neutral-500" />,
          }
        : invite.effectiveStatus === "accepted"
          ? {
              title: "This invite has already been used.",
              description: "If you already accepted it, sign in with the invited account instead.",
              icon: <MailWarning className="mt-0.5 size-4 shrink-0 text-neutral-500" />,
            }
          : null;

  if (statusInfo) {
    return (
      <AuthShell
        eyebrow="Workspace invite"
        title={statusInfo.title}
        description={statusInfo.description}
      >
        <Card className="w-full max-w-[32rem] border-[#e5e7eb] bg-white">
          <CardHeader className="space-y-2 px-6 pt-6">
            <CardTitle className="text-[1.75rem] font-semibold tracking-[-0.04em]">
              Invite unavailable
            </CardTitle>
            <CardDescription>{statusInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex items-start gap-3 rounded-lg border border-[#e5e7eb] bg-[#fafbfc] px-4 py-4 text-sm leading-6 text-neutral-700">
              {statusInfo.icon}
              <div>
                <p className="font-medium text-neutral-900">{statusInfo.title}</p>
                <p className="text-neutral-600">
                  If you still need access, ask an owner from {invite.workspace?.name ?? "this workspace"} to send a new invite.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  if (!user) {
    return (
      <AuthShell
        eyebrow="Workspace invite"
        title="You’ve been invited into a workspace."
        description="This invite already knows the destination email. Set a password to create the account and enter the workspace immediately."
      >
        <InviteClaimCard
          token={token}
          email={invite.email}
          workspaceName={invite.workspace?.name ?? "this workspace"}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Workspace invite"
      title="Finishing access to the workspace."
      description="The invited account is signed in. The system is now validating the invite and attaching workspace membership."
    >
      <InviteAcceptCard token={token} email={user.email ?? "this account"} />
    </AuthShell>
  );
}
