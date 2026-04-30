import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-8.5 w-full rounded-[6px] border border-[#dfe3e8] bg-white px-3 py-2 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 transition-colors focus-visible:border-neutral-500 focus-visible:ring-4 focus-visible:ring-[#111827]/6 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
