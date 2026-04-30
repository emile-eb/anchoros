"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { getEnv } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (client) {
    return client;
  }

  const env = getEnv();
  client = createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
  return client;
}
