"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME, APP_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AppSidebar({ workspaceName }: { workspaceName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[276px] shrink-0 flex-col border-r border-[#e6e8ec] bg-[#fbfbfc] px-4 py-5 lg:flex">
      <div className="pb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">Anchor Studios</p>
        <h2 className="mt-2 text-base font-semibold tracking-[-0.02em] text-neutral-950">{APP_NAME}</h2>
        <p className="mt-1 text-sm text-neutral-500">{workspaceName}</p>
      </div>
      <nav className="space-y-0.5">
        {APP_NAV.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
                isActive ? "bg-[#f3f4f6] text-neutral-950" : "text-neutral-600 hover:bg-[#f8fafc] hover:text-neutral-950",
              )}
            >
              <Icon className={cn("size-4 shrink-0", isActive ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-700")} />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{item.label}</p>
                <p className={cn("text-[11px]", isActive ? "text-neutral-500" : "text-neutral-400")}>{item.description}</p>
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-[#eceef2] pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">Workspace</p>
        <p className="mt-2 text-sm font-medium text-neutral-900">{workspaceName}</p>
      </div>
    </aside>
  );
}
