import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-28 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none placeholder:text-neutral-400 focus-visible:border-neutral-300 focus-visible:ring-4 focus-visible:ring-neutral-950/5 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
