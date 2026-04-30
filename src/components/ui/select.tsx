import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "flex h-8.5 w-full appearance-none rounded-[6px] border border-[#dfe3e8] bg-white px-3 py-2 pr-9 text-sm text-neutral-950 outline-none transition-colors focus-visible:border-neutral-500 focus-visible:ring-4 focus-visible:ring-[#111827]/6 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
    </div>
  );
}

export { Select };
