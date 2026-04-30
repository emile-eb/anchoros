import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const getSessionUser = cache(async () => {
  if (!hasSupabaseEnv()) {
    return {
      id: "preview-user",
      email: "preview@anchorstudios.com",
      user_metadata: {
        full_name: "Preview User",
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
