"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { addLeadNoteAction } from "@/lib/actions/leads";
import {
  leadNoteSchema,
  type LeadNoteValues,
  type LeadNoteInput,
} from "@/lib/validators/leads";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AddNoteDialog({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<LeadNoteInput, undefined, LeadNoteValues>({
    resolver: zodResolver(leadNoteSchema),
    defaultValues: { lead_id: leadId, content: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setIsPending(true);

    startTransition(async () => {
      const result = await addLeadNoteAction(values);
      setIsPending(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Note added.");
      setOpen(false);
      form.reset({ lead_id: leadId, content: "" });
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageSquarePlus className="size-4" />
          Add note
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add note</DialogTitle>
        <DialogDescription>
          Save context, objections, or the latest conversation details for this lead.
        </DialogDescription>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="note-content">Note</Label>
            <Textarea id="note-content" placeholder="What happened, what matters next, and what to remember." {...form.register("content")} />
            {form.formState.errors.content ? (
              <p className="text-sm text-red-600">{form.formState.errors.content.message}</p>
            ) : null}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
