"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Copy,
  Crown,
  LoaderCircle,
  Mail,
  MailCheck,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  createWorkspaceInviteAction,
  revokeWorkspaceInviteAction,
} from "@/lib/actions/workspace-invites";
import {
  removeWorkspaceMemberAction,
  updateWorkspaceMemberRoleAction,
} from "@/lib/actions/workspace-members";
import type { WorkspaceMemberListItem } from "@/lib/data/workspace";
import type { WorkspaceInviteListItem } from "@/lib/data/workspace-invites";
import { createWorkspaceInviteSchema } from "@/lib/validators/workspace-invites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function formatInviteDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatInviteDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInviteStatusMeta(status: WorkspaceInviteListItem["status"]) {
  switch (status) {
    case "pending":
      return { badgeVariant: "warning" as const, label: "Awaiting acceptance" };
    case "accepted":
      return { badgeVariant: "success" as const, label: "Joined workspace" };
    case "revoked":
      return { badgeVariant: "default" as const, label: "Access removed before acceptance" };
    case "expired":
      return { badgeVariant: "default" as const, label: "Link expired before use" };
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-red-600">{message}</p> : null;
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isPending,
  onConfirm,
  onOpenChange,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div className="border-b border-[#eceff3] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-[#eadfda] bg-[#fff7f5] p-2 text-[#7a3f31]">
              <AlertTriangle className="size-4" />
            </div>
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="text-white [&_span]:text-white"
            style={{ color: "#ffffff" }}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InviteDialog({ workspaceName }: { workspaceName: string }) {
  type CreateWorkspaceInviteFormValues = {
    email: string;
    role?: "owner" | "member";
  };

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);
  const form = useForm<CreateWorkspaceInviteFormValues>({
    resolver: zodResolver(createWorkspaceInviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setIsSubmitting(true);

    startTransition(async () => {
      const result = await createWorkspaceInviteAction({
        email: values.email,
        role: values.role ?? "member",
      });
      setIsSubmitting(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setCreatedInviteUrl(result.inviteUrl ?? result.acceptPath ?? null);
      toast.success("Invite created.");
      form.reset({ email: "", role: "member" });
      router.refresh();
    });
  });

  const resetDraft = () => {
    setCreatedInviteUrl(null);
    form.reset({ email: "", role: "member" });
  };

  const copyInvite = async () => {
    if (!createdInviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdInviteUrl);
      toast.success("Invite link copied.");
    } catch {
      toast.error("Could not copy the invite link.");
    }
  };

  const shareInvite = async () => {
    if (!createdInviteUrl) {
      return;
    }

    setIsSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Invite to ${workspaceName}`,
          text: `Use this link to join ${workspaceName}.`,
          url: createdInviteUrl,
        });
        toast.success("Invite link shared.");
      } else {
        await navigator.clipboard.writeText(createdInviteUrl);
        toast.success("Invite link copied.");
      }
    } catch {
      toast.error("Could not share the invite link.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          resetDraft();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg">
          <UserPlus className="size-4" />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0">
        <div className="border-b border-[#eceff3] px-6 py-5">
          <DialogTitle>Invite to {workspaceName}</DialogTitle>
          <DialogDescription>
            Send clean workspace access to a single email, choose owner or member, and keep the
            acceptance link ready to share.
          </DialogDescription>
        </div>

        <div className="space-y-5 px-6 py-5">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="owner@restaurant.com"
                {...form.register("email")}
              />
              <FieldError message={form.formState.errors.email?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select id="invite-role" {...form.register("role")}>
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </Select>
              <p className="text-sm leading-6 text-neutral-500">
                Owners can invite and manage access. Members can work inside the workspace but
                cannot administer it.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                Create invite
              </Button>
            </div>
          </form>

          {createdInviteUrl ? (
            <div className="space-y-3 rounded-lg border border-[#e5e7eb] bg-[#fafbfc] p-4">
              <div className="flex items-start gap-3">
                <MailCheck className="mt-0.5 size-4 shrink-0 text-neutral-500" />
                <div>
                  <p className="font-medium text-neutral-950">Invite ready</p>
                  <p className="text-sm leading-6 text-neutral-500">
                    Share this link with the invited user. The link already knows the invited
                    email, so they can set a password and enter directly without email confirmation.
                  </p>
                </div>
              </div>
              <div className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-neutral-700">
                <p className="break-all">{createdInviteUrl}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={copyInvite}>
                  <Copy className="size-4" />
                  Copy link
                </Button>
                <Button type="button" variant="outline" onClick={shareInvite} disabled={isSharing}>
                  {isSharing ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                  Share invite
                </Button>
                <Button type="button" onClick={resetDraft}>
                  Create another
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemberRow({
  member,
  currentUserId,
  isOwner,
}: {
  member: WorkspaceMemberListItem;
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState(member.role);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const isSelf = member.profiles?.id === currentUserId;

  const saveRole = () => {
    if (role === member.role) {
      return;
    }

    setIsSavingRole(true);
    startTransition(async () => {
      const result = await updateWorkspaceMemberRoleAction({ memberId: member.id, role });
      setIsSavingRole(false);

      if (!result.ok) {
        setRole(member.role);
        toast.error(result.error);
        return;
      }

      toast.success("Member role updated.");
      router.refresh();
    });
  };

  const removeMember = () => {
    setIsRemoving(true);
    startTransition(async () => {
      const result = await removeWorkspaceMemberAction({ memberId: member.id });
      setIsRemoving(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(isSelf ? "You were removed from the workspace." : "Member removed.");
      setConfirmRemoveOpen(false);
      if (isSelf) {
        router.replace("/no-workspace" as Route);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-2 text-neutral-700">
          {member.role === "owner" ? <Crown className="size-4" /> : <Users className="size-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-neutral-950">
              {member.profiles?.full_name ?? member.profiles?.email}
            </p>
            {isSelf ? <Badge variant="default">You</Badge> : null}
            <Badge variant={member.role === "owner" ? "success" : "default"}>{member.role}</Badge>
          </div>
          <p className="truncate text-sm text-neutral-500">{member.profiles?.email}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-neutral-400">
            Joined {formatInviteDate(member.created_at)}
          </p>
        </div>
      </div>

      {isOwner ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-[130px]">
            <Select value={role} onChange={(event) => setRole(event.target.value as "owner" | "member")}>
              <option value="owner">Owner</option>
              <option value="member">Member</option>
            </Select>
          </div>
          <Button variant="outline" onClick={saveRole} disabled={isSavingRole || role === member.role}>
            {isSavingRole ? <LoaderCircle className="size-4 animate-spin" /> : <Shield className="size-4" />}
            Save role
          </Button>
          <Button variant="outline" onClick={() => setConfirmRemoveOpen(true)} disabled={isRemoving}>
            {isRemoving ? <LoaderCircle className="size-4 animate-spin" /> : <UserMinus className="size-4" />}
            Remove
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        title={`Remove ${member.profiles?.full_name ?? member.profiles?.email ?? "member"}?`}
        description={
          isSelf
            ? "This removes your own workspace access immediately. If another owner remains, you will be sent to the no-workspace screen."
            : "This member will lose workspace access immediately and will need a fresh invite to return."
        }
        confirmLabel={isSelf ? "Remove myself" : "Remove member"}
        isPending={isRemoving}
        onConfirm={removeMember}
      />
    </div>
  );
}

function InviteRow({
  invite,
  isOwner,
}: {
  invite: WorkspaceInviteListItem;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [isRevoking, setIsRevoking] = useState(false);
  const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);
  const statusMeta = getInviteStatusMeta(invite.status);

  const revoke = () => {
    setIsRevoking(true);
    startTransition(async () => {
      const result = await revokeWorkspaceInviteAction({ inviteId: invite.id });
      setIsRevoking(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Invite revoked.");
      setConfirmRevokeOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[#e5e7eb] bg-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-neutral-950">{invite.email}</p>
          <Badge variant={statusMeta.badgeVariant}>{invite.status}</Badge>
          <Badge variant={invite.role === "owner" ? "success" : "default"}>{invite.role}</Badge>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Invited by {invite.inviter?.full_name ?? invite.inviter?.email ?? "Unknown"}
        </p>
        <p className="mt-1 text-sm text-neutral-600">{statusMeta.label}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-neutral-400">
          Sent {formatInviteDateTime(invite.created_at)} | Expires {formatInviteDateTime(invite.expires_at)}
        </p>
      </div>

      {isOwner && invite.status === "pending" ? (
        <Button variant="outline" onClick={() => setConfirmRevokeOpen(true)} disabled={isRevoking}>
          {isRevoking ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Revoke
        </Button>
      ) : null}

      <ConfirmDialog
        open={confirmRevokeOpen}
        onOpenChange={setConfirmRevokeOpen}
        title={`Revoke invite for ${invite.email}?`}
        description="This link will stop working immediately. The user will need a fresh invite to enter the workspace."
        confirmLabel="Revoke invite"
        isPending={isRevoking}
        onConfirm={revoke}
      />
    </div>
  );
}

export function SettingsWorkspaceAdmin({
  workspaceName,
  currentUserId,
  currentRole,
  members,
  invites,
}: {
  workspaceName: string;
  currentUserId: string;
  currentRole: "owner" | "member";
  members: WorkspaceMemberListItem[];
  invites: WorkspaceInviteListItem[];
}) {
  const isOwner = currentRole === "owner";
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const pendingInvites = invites.filter((invite) => invite.status === "pending");

  return (
    <div className="space-y-6">
      <Card className="border-[#e6e8ec] bg-white">
        <CardHeader className="flex flex-col gap-4 border-b border-[#eceff3] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Team access</CardTitle>
            <CardDescription>
              Keep workspace access sparse, explicit, and owner-controlled.
            </CardDescription>
          </div>
          {isOwner ? <InviteDialog workspaceName={workspaceName} /> : null}
        </CardHeader>
        <CardContent className="grid gap-0 px-0 md:grid-cols-3">
          {[
            { label: "Active members", value: members.length.toString(), detail: "Current users attached" },
            { label: "Owners", value: ownerCount.toString(), detail: "Users who can administer access" },
            { label: "Pending invites", value: pendingInvites.length.toString(), detail: "Links still waiting for acceptance" },
          ].map((metric, index) => (
            <div
              key={metric.label}
              className={`px-5 py-4 ${index < 2 ? "border-b border-[#eceff3] md:border-b-0 md:border-r" : ""}`}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                {metric.label}
              </p>
              <p className="mt-2 text-[1.55rem] font-semibold tracking-[-0.04em] text-neutral-950">
                {metric.value}
              </p>
              <p className="mt-1 text-sm text-neutral-500">{metric.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-[#e6e8ec] bg-white">
          <CardHeader className="border-b border-[#eceff3]">
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {isOwner
                ? "Promote, demote, or remove members from the workspace."
                : "Current roster for this workspace."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                currentUserId={currentUserId}
                isOwner={isOwner}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="border-[#e6e8ec] bg-white">
          <CardHeader className="border-b border-[#eceff3]">
            <CardTitle>Invites</CardTitle>
            <CardDescription>
              Pending access stays visible until accepted, revoked, or expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {!isOwner ? (
              <div className="rounded-lg border border-dashed border-[#dfe3e8] bg-[#fafbfc] px-4 py-5 text-sm leading-6 text-neutral-500">
                Pending invites are visible only to workspace owners.
              </div>
            ) : invites.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#dfe3e8] bg-[#fafbfc] px-4 py-5 text-sm leading-6 text-neutral-500">
                No invites yet. Create the first workspace invite to start bringing members in.
              </div>
            ) : (
              invites.map((invite) => (
                <InviteRow key={invite.id} invite={invite} isOwner={isOwner} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
