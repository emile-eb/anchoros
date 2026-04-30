import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <section className="flex flex-col items-start gap-4 border border-dashed border-[#d9dde3] bg-white px-6 py-10 sm:px-8">
      <div className="text-neutral-500">{icon}</div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-neutral-950">{title}</h3>
        <p className="max-w-xl text-sm leading-6 text-neutral-500">{description}</p>
      </div>
      {actionLabel ? <Button variant="outline" disabled>{actionLabel}</Button> : null}
    </section>
  );
}
