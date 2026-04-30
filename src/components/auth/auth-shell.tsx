import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/constants";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#fbfbfc]">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-10">
        <section className="flex flex-col justify-between border border-[#e5e7eb] bg-[#111318] px-8 py-8 text-white lg:px-10">
          <div className="space-y-10">
            <div className="space-y-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/52">{APP_NAME}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">{eyebrow}</p>
              <h1 className="max-w-lg text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-[3.25rem]">
                {title}
              </h1>
              <p className="max-w-xl text-[15px] leading-7 text-white/64">{description}</p>
            </div>
            <div className="space-y-4 border-t border-white/10 pt-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Built for field sales operations</p>
                <p className="text-sm leading-6 text-white/52">
                  One system for restaurant prospecting, lead management, route planning, and in-person follow-through.
                </p>
              </div>
              <div className="grid gap-3 text-sm text-white/46 sm:grid-cols-2">
                <p>Discovery and CRM stay connected.</p>
                <p>Routes feed visit history back into the pipeline.</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">Anchor Studios OS</p>
          </div>
        </section>
        <section className="flex items-center justify-center lg:justify-end">{children}</section>
      </div>
    </main>
  );
}
