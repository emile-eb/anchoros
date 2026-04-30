"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function StandaloneSignOutButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={async () => {
        if (!hasSupabaseEnv()) {
          router.replace("/login");
          return;
        }

        const supabase = createClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          toast.error(error.message);
          return;
        }

        router.replace("/login");
        router.refresh();
      }}
    >
      <LogOut className="size-4" />
      Sign out
    </Button>
  );
}
