"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useForm, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import {
  BOROUGH_OPTIONS,
  LEAD_PRIORITY_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  LEAD_STAGE_OPTIONS,
  WEBSITE_STATUS_OPTIONS,
} from "@/lib/constants";
import { createLeadAction, updateLeadAction } from "@/lib/actions/leads";
import { formatDateInputValue } from "@/lib/formatters";
import type { Lead } from "@/lib/types/database";
import {
  leadFormSchema,
  type LeadFormValues,
  type LeadFormInput,
} from "@/lib/validators/leads";
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
import { Textarea } from "@/components/ui/textarea";

type LeadUpsertDialogProps = {
  mode: "create" | "edit";
  lead?: Lead;
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function getDefaultValues(lead?: Lead): LeadFormInput {
  return {
    restaurant_name: lead?.restaurant_name ?? "",
    contact_name: lead?.contact_name ?? "",
    phone: lead?.phone ?? "",
    email: lead?.email ?? "",
    instagram_handle: lead?.instagram_handle ?? "",
    address: lead?.address ?? "",
    neighborhood: lead?.neighborhood ?? "",
    borough: lead?.borough ?? "",
    cuisine: lead?.cuisine ?? "",
    existing_website_url: lead?.existing_website_url ?? "",
    website_status: lead?.website_status ?? "unknown",
    lead_source: lead?.lead_source ?? "other",
    lead_stage:
      lead?.lead_stage === "qualified" || lead?.lead_stage === "on_hold"
        ? "researching"
        : lead?.lead_stage ?? "new",
    estimated_project_price: lead?.estimated_project_price ?? undefined,
    estimated_price_low: lead?.estimated_price_low ?? undefined,
    estimated_price_high: lead?.estimated_price_high ?? undefined,
    last_contacted_at: formatDateInputValue(lead?.last_contacted_at),
    next_follow_up_at: formatDateInputValue(lead?.next_follow_up_at),
    priority: lead?.priority ?? "medium",
    status_notes: lead?.status_notes ?? "",
    google_maps_url: lead?.google_maps_url ?? "",
    google_place_id: lead?.google_place_id ?? "",
    google_rating: lead?.google_rating ?? undefined,
    google_review_count: lead?.google_review_count ?? undefined,
    google_price_level: lead?.google_price_level ?? undefined,
    google_business_status: lead?.google_business_status ?? "",
    google_primary_type: lead?.google_primary_type ?? "",
    google_imported_at: lead?.google_imported_at ?? "",
  };
}

function FieldError({
  errors,
  name,
}: {
  errors: FieldErrors<LeadFormInput>;
  name: keyof LeadFormInput;
}) {
  const message = errors[name]?.message;
  return message ? <p className="text-sm text-red-600">{String(message)}</p> : null;
}

function LeadFormFields({
  register,
  errors,
}: {
  register: UseFormRegister<LeadFormInput>;
  errors: FieldErrors<LeadFormInput>;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="restaurant_name">Restaurant name</Label>
          <Input id="restaurant_name" placeholder="Marlow Bistro" {...register("restaurant_name")} />
          <FieldError errors={errors} name="restaurant_name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact name</Label>
          <Input id="contact_name" placeholder="Owner or manager" {...register("contact_name")} />
          <FieldError errors={errors} name="contact_name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" placeholder="(555) 555-0123" {...register("phone")} />
          <FieldError errors={errors} name="phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="owner@restaurant.com" {...register("email")} />
          <FieldError errors={errors} name="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagram_handle">Instagram</Label>
          <Input id="instagram_handle" placeholder="@marlowbistro" {...register("instagram_handle")} />
          <FieldError errors={errors} name="instagram_handle" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" placeholder="123 Atlantic Ave, Brooklyn, NY" {...register("address")} />
          <FieldError errors={errors} name="address" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="neighborhood">Neighborhood</Label>
          <Input id="neighborhood" placeholder="Williamsburg" {...register("neighborhood")} />
          <FieldError errors={errors} name="neighborhood" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="borough">Borough</Label>
          <Select id="borough" {...register("borough")}>
            <option value="">Select borough</option>
            {BOROUGH_OPTIONS.map((borough) => (
              <option key={borough} value={borough}>
                {borough}
              </option>
            ))}
          </Select>
          <FieldError errors={errors} name="borough" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cuisine">Cuisine</Label>
          <Input id="cuisine" placeholder="Italian, Cafe, Sushi" {...register("cuisine")} />
          <FieldError errors={errors} name="cuisine" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="existing_website_url">Existing website</Label>
          <Input id="existing_website_url" placeholder="https://example.com" {...register("existing_website_url")} />
          <FieldError errors={errors} name="existing_website_url" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="website_status">Website status</Label>
          <Select id="website_status" {...register("website_status")}>
            {WEBSITE_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead_source">Lead source</Label>
          <Select id="lead_source" {...register("lead_source")}>
            {LEAD_SOURCE_OPTIONS.map((source) => (
              <option key={source} value={source}>
                {source.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead_stage">Lead stage</Label>
          <Select id="lead_stage" {...register("lead_stage")}>
            {LEAD_STAGE_OPTIONS.map((stage) => (
              <option key={stage} value={stage}>
                {stage.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" {...register("priority")}>
            {LEAD_PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </Select>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="estimated_project_price">Estimated project price</Label>
          <Input id="estimated_project_price" type="number" placeholder="12000" {...register("estimated_project_price", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_price_low">Low estimate</Label>
          <Input id="estimated_price_low" type="number" placeholder="8000" {...register("estimated_price_low", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_price_high">High estimate</Label>
          <Input id="estimated_price_high" type="number" placeholder="15000" {...register("estimated_price_high", { valueAsNumber: true })} />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="last_contacted_at">Last contacted</Label>
          <Input id="last_contacted_at" type="datetime-local" {...register("last_contacted_at")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="next_follow_up_at">Next follow-up</Label>
          <Input id="next_follow_up_at" type="datetime-local" {...register("next_follow_up_at")} />
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="status_notes">Status notes</Label>
        <Textarea id="status_notes" placeholder="Context, objections, or recent progress." {...register("status_notes")} />
      </section>
    </div>
  );
}

export function LeadUpsertDialog({
  mode,
  lead,
  trigger,
  defaultOpen,
  onOpenChange,
}: LeadUpsertDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<LeadFormInput, undefined, LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: getDefaultValues(lead),
  });

  useEffect(() => {
    form.reset(getDefaultValues(lead));
  }, [form, lead, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const onSubmit = form.handleSubmit((values) => {
    if (isPending) {
      return;
    }

    setIsPending(true);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createLeadAction(values)
          : await updateLeadAction(lead!.id, values);

      setIsPending(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(mode === "create" ? "Lead created." : "Lead updated.");
      handleOpenChange(false);
      router.refresh();

      if (mode === "create" && result.id) {
        router.push(`/leads/${result.id}` as Route);
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg">
            <Plus className="size-4" />
            New lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-6 py-5">
          <DialogTitle>{mode === "create" ? "New lead" : "Edit lead"}</DialogTitle>
          <DialogDescription className="mt-1">
            {mode === "create"
              ? "Capture the core restaurant, contact, and pricing context."
              : "Update the CRM record without leaving the lead workspace."}
          </DialogDescription>
        </div>
        <form className="space-y-6 px-6 py-6" onSubmit={onSubmit}>
          <LeadFormFields register={form.register} errors={form.formState.errors} />
          <div className="hidden">
            <Input {...form.register("google_maps_url")} />
            <Input {...form.register("google_place_id")} />
            <Input {...form.register("google_rating", { valueAsNumber: true })} />
            <Input {...form.register("google_review_count", { valueAsNumber: true })} />
            <Input {...form.register("google_price_level", { valueAsNumber: true })} />
            <Input {...form.register("google_business_status")} />
            <Input {...form.register("google_primary_type")} />
            <Input {...form.register("google_imported_at")} />
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
            <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : mode === "create" ? "Create lead" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
