"use client";

import { useState } from "react";
import { MapPinned } from "lucide-react";
import type { DiscoveryResultItem } from "@/lib/data/discovery-jobs";
import { LeadImportReviewForm } from "@/components/leads/lead-import-review-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DiscoveryImportDialog({
  result,
  trigger,
}: {
  result: DiscoveryResultItem;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <MapPinned className="size-4" />
            Import as lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
        <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-6 py-5">
          <DialogTitle>Review discovery import</DialogTitle>
          <DialogDescription className="mt-1">
            Confirm the best fields from discovery search, then save the place into the CRM.
          </DialogDescription>
        </div>
        <LeadImportReviewForm
          imported={result.imported_lead}
          sourceLabel="Discovery"
          sourceDetail={result.imported_lead.resolved_query}
          secondaryAction={{ label: "Cancel", onClick: () => setOpen(false) }}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
