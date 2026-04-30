import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getEnv, getSupabaseServiceRoleKey } from "@/lib/env";

export function createAdminClient() {
  const env = getEnv();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  return createClient<Database>(env.supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
