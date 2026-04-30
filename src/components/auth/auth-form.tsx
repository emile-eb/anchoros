"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const authSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type AuthFormValues = z.infer<typeof authSchema>;

export function AuthForm({ mode }: { mode: "login" | "sign-up" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  const supabaseEnabled = hasSupabaseEnv();
  const supabase = supabaseEnabled ? createClient() : null;
  const requestedPath = searchParams.get("next");
  const nextPath: Route =
    requestedPath === "/dashboard" ||
    requestedPath === "/leads" ||
    requestedPath === "/discovery" ||
    requestedPath === "/routes" ||
    requestedPath === "/proposals" ||
    requestedPath === "/settings"
      ? requestedPath
      : "/dashboard";

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    if (!supabase) {
      toast.message("Preview mode is active. Add Supabase keys to enable sign in.");
      router.replace("/dashboard");
      return;
    }

    setIsPending(true);

    startTransition(async () => {
      const action =
        mode === "login"
          ? supabase.auth.signInWithPassword(values)
          : supabase.auth.signUp({
              ...values,
              options: { data: { full_name: values.email.split("@")[0] } },
            });

      const { data, error } = await action;
      setIsPending(false);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (mode === "sign-up" && !data.session) {
        toast.success("Account created. Confirm the email in Supabase, then sign in.");
        router.push("/login");
        return;
      }

      toast.success(mode === "login" ? "Signed in." : "Account created.");
      router.replace(nextPath);
      router.refresh();
    });
  });

  return (
    <Card className="w-full max-w-[28rem] border-[#e5e7eb] bg-white">
      <CardHeader className="space-y-2 px-6 pt-6">
        <CardTitle className="text-[1.75rem] font-semibold tracking-[-0.04em]">
          {mode === "login" ? "Sign in" : "Create account"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Use your workspace credentials to access the sales OS."
            : "New users are automatically added to the seeded Anchor Studios workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          {!supabaseEnabled ? (
            <div className="border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-neutral-700">
              Preview mode is active. The app shell is available without Supabase configuration, but auth is disabled until keys are added.
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="founder@anchorstudios.com" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-red-600">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-sm text-red-600">{form.formState.errors.password.message}</p> : null}
          </div>
          <Button className="w-full" size="lg" type="submit" disabled={isPending}>
            {isPending ? <LoaderCircle className="animate-spin" /> : null}
            {supabaseEnabled ? (mode === "login" ? "Sign in" : "Create account") : "Open preview"}
          </Button>
        </form>
        <div className="mt-5 border-t border-[#eceff3] pt-4 text-sm text-neutral-500">
          {mode === "login" ? "Need access?" : "Already have an account?"}{" "}
          <Link className="font-medium text-neutral-950 underline underline-offset-4" href={mode === "login" ? "/sign-up" : "/login"}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
