"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function SignOutButton() {
  const router = useRouter();

  return (
    <DropdownMenuItem
      onClick={async () => {
        if (!hasSupabaseEnv()) {
          toast.message("Preview mode is active. Add Supabase keys to enable auth.");
          router.replace("/dashboard");
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
    </DropdownMenuItem>
  );
}
