"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast: "!rounded-[1.25rem] !border !border-[#e7dfd3] !bg-[rgba(255,252,248,0.98)] !px-4 !py-3 !text-neutral-950 !shadow-[0_22px_48px_rgba(31,24,18,0.12)]",
          title: "!text-sm !font-medium !tracking-[-0.01em]",
          description: "!text-sm !leading-6 !text-neutral-500",
          actionButton: "!rounded-xl !bg-neutral-950 !text-white",
          cancelButton: "!rounded-xl !border !border-neutral-200 !bg-white !text-neutral-700",
        },
      }}
    />
  );
}
