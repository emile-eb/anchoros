"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, LogOut, MailWarning, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { acceptWorkspaceInviteAction } from "@/lib/actions/workspace-invites";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InviteState =
  | { kind: "pending" }
  | { kind: "success"; alreadyMember: boolean }
  | { kind: "error"; message: string };

export function InviteAcceptCard({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<InviteState>({ kind: "pending" });
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    startTransition(async () => {
      const result = await acceptWorkspaceInviteAction({ token });

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setState({ kind: "error", message: result.error });
        return;
      }

      setState({ kind: "success", alreadyMember: Boolean(result.alreadyMember) });
      toast.success(result.alreadyMember ? "Workspace access confirmed." : "Invite accepted.");

      window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 900);
    });

    return () => {
      cancelled = true;
    };
  }, [router, token]);

  const signOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      setIsSigningOut(false);
      return;
    }

    router.replace(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
    router.refresh();
  };

  return (
    <Card className="w-full max-w-[32rem] border-[#e5e7eb] bg-white">
      <CardHeader className="space-y-2 px-6 pt-6">
        <CardTitle className="text-[1.75rem] font-semibold tracking-[-0.04em]">
          {state.kind === "pending"
            ? "Accepting invite"
            : state.kind === "success"
              ? "Workspace ready"
              : "Invite needs attention"}
        </CardTitle>
        <CardDescription>
          {state.kind === "pending"
            ? `Checking the invite for ${email}.`
            : state.kind === "success"
              ? "Your workspace access is confirmed. Redirecting now."
              : "The invite could not be completed automatically."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        {state.kind === "pending" ? (
          <div className="flex items-start gap-3 rounded-lg border border-[#e5e7eb] bg-[#fafbfc] px-4 py-4 text-sm leading-6 text-neutral-700">
            <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin text-neutral-500" />
            Verifying the invite token, confirming the invited email, and attaching this account
            to the workspace.
          </div>
        ) : null}

        {state.kind === "success" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-[#d9eadf] bg-[#f5fbf7] px-4 py-4 text-sm leading-6 text-[#355746]">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              {state.alreadyMember
                ? "This account already belongs to the workspace. Redirecting you into the app."
                : "This account has been added to the workspace. Redirecting you into the app."}
            </div>
            <Button
              className="w-full text-white [&_span]:text-white"
              style={{ color: "#ffffff" }}
              size="lg"
              onClick={() => router.replace("/dashboard")}
            >
              Open workspace
            </Button>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-[#eadfda] bg-[#fff7f5] px-4 py-4 text-sm leading-6 text-[#7a3f31]">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-[#5f2f25]">{state.message}</p>
                <p className="mt-1 text-[#8b5244]">
                  If the invite was sent to a different email, sign out and continue with the
                  invited account.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5e7eb] bg-[#fafbfc] px-4 py-4">
              <div className="flex items-start gap-3 text-sm leading-6 text-neutral-700">
                <MailWarning className="mt-0.5 size-4 shrink-0 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-900">Signed in as {email}</p>
                  <p className="text-neutral-600">
                    Use the same email that received the invite, or ask the workspace owner to send
                    a new one.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1 text-white [&_span]:text-white"
                style={{ color: "#ffffff" }}
                onClick={signOut}
                disabled={isSigningOut}
              >
                <LogOut className="size-4" />
                {isSigningOut ? "Signing out..." : "Sign out and switch account"}
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
