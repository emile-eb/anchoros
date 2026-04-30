"use client";

import Link from "next/link";
import type { Route } from "next";
import { Archive, Copy, MoreHorizontal, Play, Trash2 } from "lucide-react";
import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { archiveRouteAction, deleteRouteAction, duplicateRouteAction, startRouteAction } from "@/lib/actions/routes";
import type { RouteListItem } from "@/lib/data/routes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function RouteListActions({ route }: { route: RouteListItem }) {
  const router = useRouter();
  const runStart = () =>
    startTransition(async () => {
      const result = await startRouteAction(route.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Route started.");
      router.refresh();
    });

  const runDuplicate = () =>
    startTransition(async () => {
      const result = await duplicateRouteAction(route.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (!result.route) {
        toast.error("Duplicated route response was incomplete.");
        return;
      }
      toast.success("Route duplicated.");
      router.push(`/routes/${result.route.id}` as Route);
    });

  const runArchive = () =>
    startTransition(async () => {
      const result = await archiveRouteAction(route.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Route archived.");
      router.refresh();
    });

  const runDelete = () => {
    if (!window.confirm(`Delete "${route.name}"? This will remove the route and its stops.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteRouteAction(route.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Route deleted.");
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 sm:hidden">
        <Button asChild size="sm" className="flex-1 text-white [&_span]:text-white" style={{ color: "#ffffff" }}>
          <Link href={`/routes/${route.id}` as Route} className="text-white" style={{ color: "#ffffff" }}>
            <span className="text-white" style={{ color: "#ffffff" }}>Open route</span>
          </Link>
        </Button>
        {route.status !== "in_progress" && route.status !== "completed" ? (
          <Button size="sm" variant="outline" onClick={runStart}>
            <Play className="size-4" />
            Start
          </Button>
        ) : null}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="px-2.5">
              <MoreHorizontal className="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent
            aria-describedby={undefined}
            className="inset-x-0 bottom-0 top-auto w-full max-w-none translate-x-0 translate-y-0 rounded-t-xl rounded-b-none border-x-0 border-b-0 p-0"
          >
            <div className="px-4 pb-5 pt-4">
              <div className="mb-4 space-y-1">
                <DialogTitle className="text-base tracking-[-0.02em]">{route.name}</DialogTitle>
                <DialogDescription className="text-[12px] leading-5">
                  Secondary route actions for this plan.
                </DialogDescription>
              </div>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-between" onClick={runDuplicate}>
                  <span>Duplicate</span>
                  <Copy className="size-4" />
                </Button>
                {route.status !== "archived" ? (
                  <Button variant="outline" className="justify-between" onClick={runArchive}>
                    <span>Archive</span>
                    <Archive className="size-4" />
                  </Button>
                ) : null}
                <Button variant="ghost" className="justify-between text-red-600 hover:text-red-700" onClick={runDelete}>
                  <span>Delete</span>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden flex-wrap gap-2 sm:flex">
        <Button asChild size="sm" variant="outline">
          <Link href={`/routes/${route.id}` as Route}>Open route</Link>
        </Button>
        {route.status !== "in_progress" && route.status !== "completed" ? (
          <Button size="sm" onClick={runStart}>
            <Play className="size-4" />
            Start
          </Button>
        ) : null}
        <Button size="sm" variant="outline" onClick={runDuplicate}>
          <Copy className="size-4" />
          Duplicate
        </Button>
        {route.status !== "archived" ? (
          <Button size="sm" variant="outline" onClick={runArchive}>
            <Archive className="size-4" />
            Archive
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={runDelete}>
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </>
  );
}
