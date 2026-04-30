"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PhoneOutgoing } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  OUTREACH_OUTCOME_OPTIONS,
  OUTREACH_TYPE_OPTIONS,
} from "@/lib/constants";
import { addOutreachEventAction } from "@/lib/actions/leads";
import {
  outreachEventSchema,
  type OutreachEventValues,
  type OutreachEventInput,
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

export function LogOutreachDialog({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<OutreachEventInput, undefined, OutreachEventValues>({
    resolver: zodResolver(outreachEventSchema),
    defaultValues: {
      lead_id: leadId,
      outreach_type: "call",
      occurred_at: "",
      summary: "",
      outcome: null,
      next_follow_up_at: "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);

    startTransition(async () => {
      const result = await addOutreachEventAction(values);
      setIsPending(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Outreach logged.");
      setOpen(false);
      form.reset({
        lead_id: leadId,
        outreach_type: "call",
        occurred_at: "",
        summary: "",
        outcome: null,
        next_follow_up_at: "",
      });
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PhoneOutgoing className="size-4" />
          Log outreach
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Log outreach</DialogTitle>
        <DialogDescription>
          Record a call, email, text, in-person touchpoint, or DM and capture the next move.
        </DialogDescription>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="outreach-type">Type</Label>
              <Select id="outreach-type" {...form.register("outreach_type")}>
                {OUTREACH_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="outreach-date">Date</Label>
              <Input id="outreach-date" type="datetime-local" {...form.register("occurred_at")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="outreach-summary">Summary</Label>
            <Textarea id="outreach-summary" placeholder="Called and spoke to the manager. Interested in redesign before summer menu launch." {...form.register("summary")} />
            {form.formState.errors.summary ? (
              <p className="text-sm text-red-600">{form.formState.errors.summary.message}</p>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="outreach-outcome">Outcome</Label>
              <Select id="outreach-outcome" {...form.register("outcome")}>
                <option value="">No outcome</option>
                {OUTREACH_OUTCOME_OPTIONS.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcome.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="outreach-follow-up">Next follow-up</Label>
              <Input id="outreach-follow-up" type="datetime-local" {...form.register("next_follow_up_at")} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save outreach"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
