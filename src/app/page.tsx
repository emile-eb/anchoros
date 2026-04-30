import { redirect } from "next/navigation";
import type { Route } from "next";
import { getSessionUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
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

  redirect(((memberships && memberships.length > 0) ? "/dashboard" : "/no-workspace") as Route);
}
