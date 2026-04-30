"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { toast } from "sonner";
import { LEAD_STAGE_OPTIONS } from "@/lib/constants";
import type { LeadStage } from "@/lib/types/database";
import { updateLeadStageAction } from "@/lib/actions/leads";
import { Select } from "@/components/ui/select";

export function LeadStageSelect({
  leadId,
  value,
}: {
  leadId: string;
  value: LeadStage;
}) {
  const router = useRouter();
  const [currentValue, setCurrentValue] = useState(value);

  return (
    <Select
      className="min-w-52"
      value={currentValue}
      onChange={(event) => {
        const nextValue = event.target.value as LeadStage;
        setCurrentValue(nextValue);

        startTransition(async () => {
          const result = await updateLeadStageAction({
            lead_id: leadId,
            lead_stage: nextValue,
          });

          if (!result.ok) {
            setCurrentValue(value);
            toast.error(result.error);
            return;
          }

          toast.success("Lead stage updated.");
          router.refresh();
        });
      }}
    >
      {LEAD_STAGE_OPTIONS.map((stage) => (
        <option key={stage} value={stage}>
          {stage.replaceAll("_", " ")}
        </option>
      ))}
    </Select>
  );
}
