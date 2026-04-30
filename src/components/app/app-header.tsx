"use client";

import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_NAV } from "@/lib/constants";
import type { CommandPaletteLeadItem, CommandPaletteRouteItem } from "@/lib/data/workspace";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/app/command-palette";
import { CommandTrigger } from "@/components/app/command-trigger";
import { MobileSidebar } from "@/components/app/mobile-sidebar";
import { SignOutButton } from "@/components/app/sign-out-button";

export function AppHeader({
  workspaceName,
  userEmail,
  userName,
  recentLeads,
  recentRoutes,
}: {
  workspaceName: string;
  userEmail: string;
  userName: string | null;
  recentLeads: CommandPaletteLeadItem[];
  recentRoutes: CommandPaletteRouteItem[];
}) {
  const pathname = usePathname();
  const activeItem = APP_NAV.find((item) => item.href === pathname);
  const initials = (userName ?? userEmail).slice(0, 2).toUpperCase();
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[#e6e8ec] bg-[rgba(255,255,255,0.92)] backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <MobileSidebar workspaceName={workspaceName} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">{workspaceName}</p>
            <h1 className="truncate text-[1.2rem] font-semibold tracking-[-0.03em] text-neutral-950">{activeItem?.label ?? "Workspace"}</h1>
          </div>
          <div className="hidden md:flex">
            <CommandTrigger onClick={() => setCommandOpen(true)} />
          </div>
          <Button variant="ghost" size="icon" className="hidden text-neutral-500 md:inline-flex">
            <Bell className="size-4" />
            <span className="sr-only">Notifications</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md border border-[#e5e7eb] bg-white p-1 transition-colors hover:bg-[#f9fafb]">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <p className="text-sm font-medium capitalize text-neutral-950">{userName ?? "Workspace member"}</p>
                  <p className="text-xs normal-case tracking-normal text-neutral-500">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <SignOutButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CommandPalette recentLeads={recentLeads} recentRoutes={recentRoutes} open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
