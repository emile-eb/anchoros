"use client";

import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { Route } from "next";
import { Search } from "lucide-react";
import { useEffect } from "react";
import { APP_NAV } from "@/lib/constants";
import type { CommandPaletteLeadItem, CommandPaletteRouteItem } from "@/lib/data/workspace";

export function CommandPalette({
  recentLeads,
  recentRoutes,
  open,
  onOpenChange,
}: {
  recentLeads: CommandPaletteLeadItem[];
  recentRoutes: CommandPaletteRouteItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }

      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-50 bg-[rgba(15,23,42,0.18)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="fixed left-1/2 top-[12vh] z-[60] w-[min(720px,calc(100vw-2rem))] -translate-x-1/2"
          >
            <Command className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
              <div className="flex items-center gap-3 border-b border-[#eceff3] px-4 py-3.5">
                <Search className="size-4 text-neutral-400" />
                <Command.Input
                  autoFocus
                  placeholder="Jump to pages, leads, and routes"
                  className="h-9 w-full bg-transparent text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
                />
                <div className="rounded-sm border border-[#e5e7eb] bg-[#fafafa] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-neutral-400">
                  Esc
                </div>
              </div>
              <Command.List className="max-h-[70vh] overflow-y-auto p-3">
                <Command.Empty className="px-3 py-8 text-sm text-neutral-500">No matches found.</Command.Empty>

                <Command.Group heading="Navigate" className="mb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-neutral-400">
                  {APP_NAV.map((item) => (
                    <Command.Item key={item.href} asChild value={`${item.label} ${item.description}`}>
                      <Link
                        href={item.href as Route}
                        className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors data-[selected=true]:bg-[#f3f4f6] data-[selected=true]:text-neutral-950"
                        onClick={() => onOpenChange(false)}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="size-4" />
                          <div>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-neutral-400">{item.description}</p>
                          </div>
                        </div>
                      </Link>
                    </Command.Item>
                  ))}
                </Command.Group>

                {recentLeads.length > 0 ? (
                  <Command.Group heading="Recent leads" className="mb-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-neutral-400">
                    {recentLeads.map((lead) => (
                      <Command.Item key={lead.id} asChild value={`${lead.restaurant_name} lead`}>
                        <Link
                          href={`/leads/${lead.id}` as Route}
                          className="block rounded-md px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors data-[selected=true]:bg-[#f3f4f6] data-[selected=true]:text-neutral-950"
                          onClick={() => onOpenChange(false)}
                        >
                          <p className="font-medium">{lead.restaurant_name}</p>
                          <p className="text-xs text-neutral-400">Lead record</p>
                        </Link>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}

                {recentRoutes.length > 0 ? (
                  <Command.Group heading="Recent routes" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-neutral-400">
                    {recentRoutes.map((route) => (
                      <Command.Item key={route.id} asChild value={`${route.name} route ${route.status}`}>
                        <Link
                          href={`/routes/${route.id}` as Route}
                          className="block rounded-md px-3 py-2.5 text-sm text-neutral-700 outline-none transition-colors data-[selected=true]:bg-[#f3f4f6] data-[selected=true]:text-neutral-950"
                          onClick={() => onOpenChange(false)}
                        >
                          <p className="font-medium">{route.name}</p>
                          <p className="text-xs text-neutral-400 capitalize">{route.status.replaceAll("_", " ")}</p>
                        </Link>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : null}
              </Command.List>
            </Command>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
