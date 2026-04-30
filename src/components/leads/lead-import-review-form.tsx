"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Star } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  BOROUGH_OPTIONS,
  LEAD_PRIORITY_OPTIONS,
  LEAD_STAGE_OPTIONS,
  WEBSITE_STATUS_OPTIONS,
} from "@/lib/constants";
import { createLeadAction } from "@/lib/actions/leads";
import { formatCurrency } from "@/lib/formatters";
import { getImportedLeadDefaults, type ImportedLeadDraft } from "@/lib/leads/imports";
import {
  leadFormSchema,
  type LeadFormInput,
  type LeadFormValues,
} from "@/lib/validators/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type SecondaryAction = {
  label: string;
  onClick: () => void;
};

export function LeadImportReviewForm({
  imported,
  sourceLabel,
  sourceDetail,
  secondaryAction,
  onSaved,
}: {
  imported: ImportedLeadDraft;
  sourceLabel: string;
  sourceDetail?: string | null;
  secondaryAction?: SecondaryAction;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<LeadFormInput, undefined, LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: getImportedLeadDefaults(imported),
  });

  const estimatedProjectPrice = useWatch({
    control: form.control,
    name: "estimated_project_price",
  });

  useEffect(() => {
    form.reset(getImportedLeadDefaults(imported));
  }, [form, imported]);

  const handleSubmit = form.handleSubmit((values) => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    startTransition(async () => {
      const result = await createLeadAction(values);
      setIsSaving(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Lead created.");
      onSaved?.();

      if (result.id) {
        router.push(`/leads/${result.id}` as Route);
      } else {
        router.refresh();
      }
    });
  });

  return (
    <form className="space-y-6 px-6 py-6" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Google rating</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-neutral-950">
            <Star className="size-4 text-amber-500" />
            {imported.google_rating ?? "N/A"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {imported.google_review_count ? `${imported.google_review_count} reviews` : "No review count"}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Primary type</p>
          <p className="mt-2 text-lg font-semibold text-neutral-950">
            {imported.cuisine ?? "Not available"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {imported.google_business_status ?? "Business status unknown"}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-400">Source</p>
          <p className="mt-2 text-lg font-semibold text-neutral-950">{sourceLabel}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {sourceDetail ?? imported.resolved_query ?? "Imported from Google place data"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="restaurant_name">Restaurant name</Label>
          <Input id="restaurant_name" {...form.register("restaurant_name")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" {...form.register("address")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Neighborhood</Label>
          <Input id="neighborhood" {...form.register("neighborhood")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="borough">Borough</Label>
          <Select id="borough" {...form.register("borough")}>
            <option value="">Select borough</option>
            {BOROUGH_OPTIONS.map((borough) => (
              <option key={borough} value={borough}>
                {borough}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cuisine">Cuisine</Label>
          <Input id="cuisine" {...form.register("cuisine")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register("phone")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="existing_website_url">Existing website</Label>
          <Input id="existing_website_url" {...form.register("existing_website_url")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="website_status">Website status</Label>
          <Select id="website_status" {...form.register("website_status")}>
            {WEBSITE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead_stage">Lead stage</Label>
          <Select id="lead_stage" {...form.register("lead_stage")}>
            {LEAD_STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>
                {stage.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" {...form.register("priority")}>
            {LEAD_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="estimated_project_price">Estimated project price</Label>
          <Input
            id="estimated_project_price"
            type="number"
            placeholder="12000"
            {...form.register("estimated_project_price", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_price_low">Low estimate</Label>
          <Input
            id="estimated_price_low"
            type="number"
            placeholder="8000"
            {...form.register("estimated_price_low", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_price_high">High estimate</Label>
          <Input
            id="estimated_price_high"
            type="number"
            placeholder="15000"
            {...form.register("estimated_price_high", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        Estimated value preview:{" "}
        <span className="font-medium text-neutral-950">
          {formatCurrency(
            Number.isFinite(estimatedProjectPrice as number)
              ? (estimatedProjectPrice as number)
              : null,
          )}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact name</Label>
          <Input id="contact_name" {...form.register("contact_name")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="instagram_handle">Instagram handle</Label>
          <Input id="instagram_handle" {...form.register("instagram_handle")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status_notes">Notes</Label>
        <Textarea
          id="status_notes"
          placeholder="Anything important from the import or your first read."
          {...form.register("status_notes")}
        />
      </div>

      <div className="hidden">
        <Input {...form.register("lead_source")} />
        <Input {...form.register("google_maps_url")} />
        <Input {...form.register("google_place_id")} />
        <Input {...form.register("google_rating", { valueAsNumber: true })} />
        <Input {...form.register("google_review_count", { valueAsNumber: true })} />
        <Input {...form.register("google_price_level", { valueAsNumber: true })} />
        <Input {...form.register("google_business_status")} />
        <Input {...form.register("google_primary_type")} />
        <Input {...form.register("google_imported_at")} />
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>
            Google metadata will be saved with the lead, including place ID, maps URL,
            rating, review count, price level, and business status.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-neutral-200 pt-4">
        {secondaryAction ? (
          <Button type="button" variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving lead..." : "Save lead"}
        </Button>
      </div>
    </form>
  );
}
