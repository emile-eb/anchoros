"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CommandTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-9 min-w-[240px] justify-between rounded-md border-[#e5e7eb] bg-white px-3 text-neutral-500 shadow-none hover:bg-[#f9fafb] md:min-w-[280px]"
      onClick={onClick}
    >
      <span className="flex items-center gap-2">
        <Search className="size-4 text-neutral-400" />
        Search the OS
      </span>
      <span className="rounded-sm border border-[#e5e7eb] bg-[#fafafa] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-neutral-400">
        Cmd K
      </span>
    </Button>
  );
}
