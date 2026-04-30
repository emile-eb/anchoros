"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { APP_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function MobileSidebar({ workspaceName }: { workspaceName: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="border-[#e5e7eb] bg-white lg:hidden">
          <Menu />
          <span className="sr-only">Open navigation</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="left-0 top-0 h-full max-w-xs translate-x-0 translate-y-0 rounded-none border-l-0 p-0">
        <div className="flex h-full flex-col bg-[#fbfbfc] px-5 py-6">
          <div className="pb-4">
            <DialogTitle className="text-left text-lg tracking-[-0.02em]">{workspaceName}</DialogTitle>
            <p className="mt-1 text-sm text-neutral-500">Anchor Studios operating system</p>
          </div>
          <nav className="mt-4 space-y-0.5">
            {APP_NAV.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors", isActive ? "bg-[#f3f4f6] text-neutral-950" : "text-neutral-600 hover:bg-[#f8fafc] hover:text-neutral-950")}
                >
                  <Icon className="size-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </DialogContent>
    </Dialog>
  );
}
