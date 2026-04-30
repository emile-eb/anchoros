"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, LockKeyhole, Mail, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inviteClaimSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type InviteClaimValues = z.infer<typeof inviteClaimSchema>;

export function InviteClaimCard({
  token,
  email,
  workspaceName,
}: {
  token: string;
  email: string;
  workspaceName: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const form = useForm<InviteClaimValues>({
    resolver: zodResolver(inviteClaimSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);

    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: values.password,
        options: {
          data: {
            full_name: email.split("@")[0],
          },
        },
      });

      setIsPending(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.session) {
        toast.error(
          "Email confirmation is still enabled in Supabase Auth. Disable it so invited users can enter directly after setting a password.",
        );
        return;
      }

      toast.success("Account created. Finishing workspace access now.");
      router.replace(`/invite/${token}` as Route);
      router.refresh();
    });
  });

  const signInHref = `/login?next=${encodeURIComponent(`/invite/${token}`)}` as Route;

  return (
    <Card className="w-full max-w-[32rem] border-[#e5e7eb] bg-white">
      <CardHeader className="space-y-2 px-6 pt-6">
        <CardTitle className="text-[1.75rem] font-semibold tracking-[-0.04em]">
          Set a password to join {workspaceName}
        </CardTitle>
        <CardDescription>
          This invite is already tied to <span className="font-medium text-neutral-900">{email}</span>.
          You only need to choose a password, then the account will go straight into the workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 px-6 pb-6">
        <div className="rounded-lg border border-[#e5e7eb] bg-[#fafbfc] px-4 py-4 text-sm leading-6 text-neutral-700">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-neutral-500" />
            <div>
              <p className="font-medium text-neutral-900">Password-only onboarding</p>
              <p className="text-neutral-600">
                The invited email is already fixed by the link. After you set the password, the app
                will sign you in and finish workspace access automatically.
              </p>
            </div>
          </div>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="invite-email">Invited email</Label>
            <Input id="invite-email" value={email} readOnly disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-password">Password</Label>
            <Input
              id="invite-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          <Button
            className="w-full text-white [&_span]:text-white"
            style={{ color: "#ffffff" }}
            size="lg"
            type="submit"
            disabled={isPending}
          >
            {isPending ? <LoaderCircle className="animate-spin" /> : <UserRoundPlus className="size-4" />}
            Create account and join workspace
          </Button>
        </form>

        <div className="border-t border-[#eceff3] pt-4 text-sm text-neutral-500">
          Already have an account for this email?{" "}
          <Link className="font-medium text-neutral-950 underline underline-offset-4" href={signInHref}>
            Sign in instead
          </Link>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href={signInHref}>
            <Mail className="size-4" />
            Use existing account
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
