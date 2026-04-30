"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { VISIT_OUTCOME_OPTIONS } from "@/lib/constants";
import { addVisitAction } from "@/lib/actions/leads";
import {
  visitSchema,
  type VisitInput,
  type VisitValues,
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

export function LogVisitDialog({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<VisitInput, undefined, VisitValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      lead_id: leadId,
      visited_at: "",
      notes: "",
      outcome: null,
      best_time_to_return: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);

    startTransition(async () => {
      const result = await addVisitAction(values);
      setIsPending(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Visit logged.");
      setOpen(false);
      form.reset({
        lead_id: leadId,
        visited_at: "",
        notes: "",
        outcome: null,
        best_time_to_return: "",
      });
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Store className="size-4" />
          Log visit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Log visit</DialogTitle>
        <DialogDescription>
          Capture what happened on-site and anything that should shape the next visit.
        </DialogDescription>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="visit-date">Visit date</Label>
              <Input id="visit-date" type="datetime-local" {...form.register("visited_at")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit-outcome">Outcome</Label>
              <Select id="visit-outcome" {...form.register("outcome")}>
                <option value="">No outcome</option>
                {VISIT_OUTCOME_OPTIONS.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcome.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="visit-notes">Notes</Label>
            <Textarea id="visit-notes" placeholder="Who was there, what you learned, and what to do next." {...form.register("notes")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="best-time-to-return">Best time to return</Label>
            <Input id="best-time-to-return" placeholder="Weekdays before lunch rush" {...form.register("best_time_to_return")} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save visit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
