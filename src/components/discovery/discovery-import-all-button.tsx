"use client";

import { startTransition, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { importAllDiscoveryResultsAction } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";

export function DiscoveryImportAllButton({
  discoveryJobId,
  importableCount,
}: {
  discoveryJobId: string;
  importableCount: number;
}) {
  const [isPending, setIsPending] = useState(false);

  if (importableCount === 0) {
    return null;
  }

  return (
    <Button
      size="sm"
      onClick={() => {
        if (isPending) {
          return;
        }

        setIsPending(true);

        startTransition(async () => {
          const result = await importAllDiscoveryResultsAction(discoveryJobId);
          setIsPending(false);

          if (!result.ok) {
            toast.error(result.error);
            return;
          }

          toast.success(
            `Imported ${result.importedCount} leads. Contact number and estimated prices were left blank.`,
          );
        });
      }}
      disabled={isPending}
    >
      <Download className="size-4" />
      {isPending ? "Adding all..." : `Add all (${importableCount})`}
    </Button>
  );
}
