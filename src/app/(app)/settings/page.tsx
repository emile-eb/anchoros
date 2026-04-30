import { Building2, ShieldCheck } from "lucide-react";
import { PageIntro } from "@/components/app/page-intro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettingsSummary } from "@/lib/data/workspace";
import { getWorkspaceInvites } from "@/lib/data/workspace-invites";
import { SettingsWorkspaceAdmin } from "@/components/settings/settings-workspace-admin";

export default async function SettingsPage() {
  const { workspace, profile, membership, members } = await getSettingsSummary();
  const invites = membership.role === "owner" ? await getWorkspaceInvites() : [];

  return (
    <div className="space-y-8">
      <PageIntro eyebrow={workspace.name} title="Settings" description="Workspace access is now invite-driven. Owners control who gets in, what role they hold, and which invites are still pending." />
      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Current workspace context for this account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
              <Building2 className="mt-0.5 size-5 text-neutral-700" />
              <div>
                <p className="font-medium text-neutral-950">{workspace.name}</p>
                <p className="text-sm text-neutral-500">Slug: {workspace.slug}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 p-4">
              <ShieldCheck className="mt-0.5 size-5 text-neutral-700" />
              <div>
                <p className="font-medium text-neutral-950">{profile.full_name ?? profile.email}</p>
                <p className="text-sm text-neutral-500 capitalize">Role: {membership.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <SettingsWorkspaceAdmin
          workspaceName={workspace.name}
          currentUserId={profile.id}
          currentRole={membership.role}
          members={members}
          invites={invites}
        />
      </div>
    </div>
  );
}
