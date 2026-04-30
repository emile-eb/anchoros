import { redirect } from "next/navigation";
import { LockKeyhole, MailPlus } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { StandaloneSignOutButton } from "@/components/auth/standalone-sign-out-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function NoWorkspacePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/no-workspace");
  }

  if (!hasSupabaseEnv()) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Workspace access"
      title="This account exists, but it is not attached to a workspace yet."
      description="Workspace access is invitation-based. Ask an owner to send an invite to this email, then open the invite link while signed in."
    >
      <Card className="w-full max-w-[32rem] border-[#e5e7eb] bg-white">
        <CardHeader className="space-y-2 px-6 pt-6">
          <CardTitle className="text-[1.75rem] font-semibold tracking-[-0.04em]">
            No workspace access yet
          </CardTitle>
          <CardDescription>
            Signed in as {user.email ?? "this account"}. Once an owner sends an invite to this email,
            use that link to join the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="rounded-lg border border-[#e5e7eb] bg-[#fafbfc] px-4 py-4 text-sm leading-6 text-neutral-700">
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">What to do next</p>
                <p className="text-neutral-600">
                  Ask a workspace owner to invite this email address. When the invite arrives, open
                  the link while signed in and the system will attach membership automatically.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-4 text-sm leading-6 text-neutral-700">
            <div className="flex items-start gap-3">
              <MailPlus className="mt-0.5 size-4 shrink-0 text-neutral-500" />
              <div>
                <p className="font-medium text-neutral-900">Need to switch accounts?</p>
                <p className="text-neutral-600">
                  Sign out, then sign back in with the email address the workspace owner invited.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <StandaloneSignOutButton />
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
