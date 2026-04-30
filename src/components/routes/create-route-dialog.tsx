"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Map, Route as RouteIcon, X } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { generateRoutePreviewAction, saveRouteAction, startRouteAction } from "@/lib/actions/routes";
import { formatDistanceMeters, formatDurationMinutes } from "@/lib/formatters";
import { startCase } from "@/lib/formatters";
import type { RoutePreview } from "@/lib/routes/types";
import {
  routeGenerationSchema,
  type RouteGenerationInput,
  type RouteGenerationValues,
} from "@/lib/validators/routes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function CreateRouteDialog({
  trigger,
  defaultOpen,
  selectedLeadIds = [],
  selectedDiscoveryResultIds = [],
}: {
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  selectedLeadIds?: string[];
  selectedDiscoveryResultIds?: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState<RoutePreview | null>(null);
  const preselectedCount = selectedLeadIds.length + selectedDiscoveryResultIds.length;

  const defaultSource = useMemo(() => {
    if (selectedLeadIds.length > 0 && selectedDiscoveryResultIds.length > 0) return "both";
    if (selectedDiscoveryResultIds.length > 0) return "discovery";
    return "crm";
  }, [selectedDiscoveryResultIds.length, selectedLeadIds.length]);

  const form = useForm<RouteGenerationInput, undefined, RouteGenerationValues>({
    resolver: zodResolver(routeGenerationSchema),
    defaultValues: {
      route_name:
        preselectedCount > 0 ? `Field route (${preselectedCount} stops)` : "Field route",
      start_location: "",
      end_location: "",
      max_stops: 8,
      neighborhood_focus: "",
      source_filter: defaultSource,
      exclude_recently_visited: true,
      lead_ids: selectedLeadIds,
      discovery_result_ids: selectedDiscoveryResultIds,
    },
  });

  const generatePreview = form.handleSubmit((values) => {
    setIsGenerating(true);
    startTransition(async () => {
      const result = await generateRoutePreviewAction(values);
      setIsGenerating(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      if (!result.preview) {
        toast.error("Route preview is not available.");
        return;
      }

      setPreview(result.preview);
    });
  });

  const handleSave = async (nextStatus: "ready" | "in_progress") => {
    if (!preview || isSaving) return;
    setIsSaving(true);

    startTransition(async () => {
      const saveResult = await saveRouteAction(preview);
      if (!saveResult.ok) {
        setIsSaving(false);
        toast.error(saveResult.error);
        return;
      }

      if (!saveResult.route) {
        setIsSaving(false);
        toast.error("Saved route response was incomplete.");
        return;
      }

      if (nextStatus === "in_progress") {
        const startResult = await startRouteAction(saveResult.route.id);
        if (!startResult.ok) {
          setIsSaving(false);
          toast.error(startResult.error);
          return;
        }
      }

      setIsSaving(false);
      setOpen(false);
      setPreview(null);
      toast.success(nextStatus === "in_progress" ? "Route saved and started." : "Route saved.");
      router.push(`/routes/${saveResult.route.id}` as Route);
    });
  };

  const removePreviewStop = (stopIndex: number) => {
    setPreview((current) =>
      current
        ? {
            ...current,
            totalStops: current.totalStops - 1,
            stops: current.stops
              .filter((_, index) => index !== stopIndex)
              .map((stop, index) => ({ ...stop, stopOrder: index + 1 })),
          }
        : current,
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg">
            <RouteIcon className="size-4" />
            Create route
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-0 md:rounded-lg rounded-t-xl rounded-b-none md:inset-auto inset-x-0 bottom-0 top-auto md:translate-x-[-50%] md:translate-y-[-50%] translate-x-0 translate-y-0">
        <div className="sticky top-0 z-10 border-b border-[#eceff3] bg-white px-4 py-4 md:px-6 md:py-5">
          <DialogTitle>{preview ? "Review route" : "Create smart route"}</DialogTitle>
          <DialogDescription className="mt-1 text-[12px] leading-5 md:text-sm md:leading-6">
            {preview
              ? "Review the optimized stop order, trim anything unnecessary, and save the field route."
              : "Give the OS a starting point and let it group and optimize the stop order for one driver."}
          </DialogDescription>
        </div>

        {!preview ? (
          <form className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 md:py-6" onSubmit={generatePreview}>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="route_name">Route name</Label>
                <Input id="route_name" {...form.register("route_name")} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max_stops">Max stops</Label>
                  <Input id="max_stops" type="number" min={1} max={12} {...form.register("max_stops")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source_filter">Source filter</Label>
                  <Select id="source_filter" {...form.register("source_filter")}>
                    <option value="crm">CRM only</option>
                    <option value="discovery">Discovery only</option>
                    <option value="both">Both</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-[#eceff3] pt-4">
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">Route points</p>
                <p className="text-[12px] leading-5 text-neutral-500">Set the drive start and optional return point.</p>
              </div>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start_location">Start location</Label>
                  <Input id="start_location" placeholder="Home, office, or neighborhood" {...form.register("start_location")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_location">End location</Label>
                  <Input id="end_location" placeholder="Defaults to start location" {...form.register("end_location")} />
                </div>
              </div>
            </div>

            <details className="group rounded-md border border-[#eceff3] bg-[#fafbfc] px-3.5 py-3">
              <summary className="cursor-pointer list-none text-sm font-medium text-neutral-950">
                Advanced options
              </summary>
              <div className="mt-3 grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood_focus">Neighborhood focus</Label>
                  <Input id="neighborhood_focus" placeholder="Optional focus area" {...form.register("neighborhood_focus")} />
                </div>
                <label className="flex items-center gap-3 text-sm text-neutral-600">
                  <input type="checkbox" className="size-4" {...form.register("exclude_recently_visited")} />
                  Exclude recently visited places
                </label>
              </div>
            </details>

            {preselectedCount > 0 ? (
              <div className="rounded-md border border-[#eceff3] bg-[#fafbfc] px-3.5 py-3 text-[12px] leading-5 text-neutral-600">
                Starting from {preselectedCount} selected prospects from the current app context.
              </div>
            ) : (
              <div className="rounded-md border border-[#eceff3] bg-[#fafbfc] px-3.5 py-3 text-[12px] leading-5 text-neutral-600">
                No manual selection passed in. The OS will auto-pick the best candidates from your workspace.
              </div>
            )}

            <div className="sticky bottom-0 -mx-4 border-t border-neutral-200 bg-white px-4 pb-4 pt-3 md:static md:m-0 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0">
              <div className="flex gap-2 md:justify-end md:gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 md:flex-none">
                  Cancel
                </Button>
                <Button type="submit" disabled={isGenerating} className="flex-1 md:flex-none">
                  {isGenerating ? "Generating..." : "Generate route"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4 px-4 py-4 md:space-y-6 md:px-6 md:py-6">
            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="border border-[#eceff3] bg-[#fafbfc] p-6">
                <div className="flex items-center gap-3">
                  <div className="border border-[#e5e7eb] bg-white p-3">
                    <Map className="size-5 text-neutral-700" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-neutral-950">Route map preview</p>
                    <p className="text-sm text-neutral-500">
                      Map rendering is deferred, but the stop order and Google Maps export are ready now.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                <div className="border border-[#eceff3] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Stops</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-950">{preview.totalStops}</p>
                </div>
                <div className="border border-[#eceff3] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Drive time</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-950">{formatDurationMinutes(preview.estimatedDurationMinutes)}</p>
                </div>
                <div className="border border-[#eceff3] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Distance</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-950">{formatDistanceMeters(preview.estimatedDistanceMeters)}</p>
                </div>
                <div className="border border-[#eceff3] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-neutral-400">Source</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-950">{startCase(preview.sourceType)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-4">
                <div className="border border-[#e6e8ec] bg-white">
                  <div className="border-b border-[#eceff3] px-5 py-4">
                    <p className="text-lg font-semibold text-neutral-950">Ordered stops</p>
                  </div>
                  <div className="divide-y divide-neutral-200">
                    {preview.stops.map((stop, index) => (
                      <div key={`${stop.sourceType}-${stop.googlePlaceId ?? stop.restaurantName}-${index}`} className="flex items-start justify-between gap-4 px-4 py-3 md:px-5 md:py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-neutral-500">Stop {stop.stopOrder}</p>
                          <p className="text-base font-semibold text-neutral-950 md:text-lg">{stop.restaurantName}</p>
                          <p className="text-sm text-neutral-500">{stop.formattedAddress ?? "Address not set"}</p>
                          <p className="text-[12px] leading-5 text-neutral-400">{stop.reason}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removePreviewStop(index)}>
                          <X className="size-4" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3 md:space-y-4">
                <div className="border border-[#e6e8ec] bg-white p-5">
                  <p className="text-lg font-semibold text-neutral-950">Route summary</p>
                  <div className="mt-4 space-y-3 text-sm text-neutral-600">
                    <p><span className="font-medium text-neutral-950">Start:</span> {preview.originLabel}</p>
                    <p><span className="font-medium text-neutral-950">End:</span> {preview.destinationLabel}</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    {preview.whyTheseStops.map((line) => (
                      <p key={line} className="text-sm text-neutral-500">{line}</p>
                    ))}
                  </div>
                </div>

                <div className="border border-[#e6e8ec] bg-white p-5">
                  <p className="text-lg font-semibold text-neutral-950">Quick actions</p>
                  <div className="mt-4 flex flex-col gap-3">
                    {preview.googleMapsUrl ? (
                      <Button asChild variant="outline">
                        <a href={preview.googleMapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>
                      </Button>
                    ) : (
                      <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        {preview.googleMapsWarning}
                      </div>
                    )}
                    <Button variant="outline" onClick={generatePreview}>Regenerate route</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 -mx-4 border-t border-[#eceff3] bg-white px-4 pb-4 pt-3 md:static md:m-0 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button variant="ghost" onClick={() => setPreview(null)}>Back</Button>
              <Button variant="outline" onClick={() => handleSave("ready")} disabled={isSaving}>
                {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
                Save route
              </Button>
              <Button onClick={() => handleSave("in_progress")} disabled={isSaving}>
                {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
                Save and start
              </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
