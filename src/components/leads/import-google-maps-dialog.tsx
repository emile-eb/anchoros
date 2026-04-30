"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPinned, Search } from "lucide-react";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { importGoogleMapsLeadAction } from "@/lib/actions/leads";
import { LeadImportReviewForm } from "@/components/leads/lead-import-review-form";
import type { ImportedLeadDraft } from "@/lib/leads/imports";
import {
  googleMapsImportSchema,
  type GoogleMapsImportInput,
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

export function ImportGoogleMapsDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"link" | "review">("link");
  const [isImporting, setIsImporting] = useState(false);
  const [imported, setImported] = useState<ImportedLeadDraft | null>(null);

  const linkForm = useForm<GoogleMapsImportInput>({
    resolver: zodResolver(googleMapsImportSchema),
    defaultValues: {
      maps_url: "",
    },
  });

  const handleImportSubmit = linkForm.handleSubmit((values) => {
    if (isImporting) {
      return;
    }

    setIsImporting(true);

    startTransition(async () => {
      const result = await importGoogleMapsLeadAction(values);
      setIsImporting(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setImported(result.data);
      setStep("review");
      toast.success("Place details imported.");
    });
  });

  const resetDialog = () => {
    setStep("link");
    setImported(null);
    setIsImporting(false);
    linkForm.reset({ maps_url: "" });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetDialog();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="lg">
            <MapPinned className="size-4" />
            Import from Google Maps
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-6 py-5">
          <DialogTitle>
            {step === "link" ? "Import from Google Maps" : "Review imported lead"}
          </DialogTitle>
          <DialogDescription className="mt-1">
            {step === "link"
              ? "Paste a Google Maps restaurant link and let the CRM prefill the first pass."
              : "Quickly scan the imported details, edit what matters, and save the lead."}
          </DialogDescription>
        </div>

        {step === "link" ? (
          <form
            className="space-y-5 px-6 py-6"
            onSubmit={handleImportSubmit}
          >
            <div className="space-y-2">
              <Label htmlFor="maps-url">Google Maps link</Label>
              <Input
                id="maps-url"
                placeholder="https://www.google.com/maps/place/..."
                {...linkForm.register("maps_url")}
              />
              {linkForm.formState.errors.maps_url ? (
                <p className="text-sm text-red-600">
                  {linkForm.formState.errors.maps_url.message}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-900">What gets imported</p>
              <p className="mt-2 text-sm leading-7 text-neutral-500">
                Name, address, borough hints, phone, website, rating, review count, price level,
                and place metadata when Google returns it.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-neutral-500">
                Need a blank lead instead? Close this and use <span className="font-medium text-neutral-900">Add manually</span>.
              </p>
              <Button type="submit" disabled={isImporting}>
                <Search className="size-4" />
                {isImporting ? "Fetching details..." : "Fetch details"}
              </Button>
            </div>
          </form>
        ) : imported ? (
          <LeadImportReviewForm
            imported={imported}
            sourceLabel="Google Maps"
            sourceDetail={imported.resolved_query ?? "Imported directly from place link"}
            secondaryAction={{ label: "Back", onClick: () => setStep("link") }}
            onSaved={() => {
              setOpen(false);
              resetDialog();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
