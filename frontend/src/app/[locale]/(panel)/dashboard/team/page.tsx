"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  Mail,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  ShieldOff,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import Button from "@/components/ui/Button";
import { useSession } from "@/lib/auth-client";
import {
  InvitationService,
  type Invitation,
} from "@/services/invitation.service";
import { inviteSchema } from "@/lib/schemas/accountSchemas";
import { CompanyService, type CompanyUser } from "@/services/company.service";
import { UserRole, COMPANY_MANAGEMENT_ROLES } from "@/types/enums";
import { ActionButton, InlineSpinner, ReasonModal } from "@/components/admin/AdminUI";

// The one concrete per-user permission override the plan calls for: an
// owner/manager decides, per agent, whether that agent can submit listings
// straight to the platform instead of going through a manager first.
const SUBMIT_CAPABILITY = "listings.submit_to_platform";

const INVITABLE_ROLES: { value: string; label: string }[] = [
  { value: UserRole.COMPANY_MANAGER, label: "Company Manager" },
  { value: UserRole.AGENT, label: "Agent" },
  { value: UserRole.LISTING_COORDINATOR, label: "Listing Coordinator" },
  { value: UserRole.VIEWER, label: "Viewer" },
];

function inviteLinkFor(token: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/invite/${token}`;
}

function invitationStatus(invitation: Invitation) {
  if (invitation.acceptedAt) return { label: "Accepted", tone: "emerald" as const };
  if (invitation.revokedAt) return { label: "Revoked", tone: "slate" as const };
  if (new Date(invitation.expiresAt) < new Date())
    return { label: "Expired", tone: "rose" as const };
  return { label: "Pending", tone: "amber" as const };
}

const STATUS_ICON = {
  emerald: <CheckCircle2 size={14} className="text-emerald-500" />,
  slate: <Ban size={14} className="text-slate-400" />,
  rose: <XCircle size={14} className="text-rose-500" />,
  amber: <Clock size={14} className="text-amber-500" />,
};

const STATUS_TEXT_COLOR: Record<"emerald" | "slate" | "rose" | "amber", string> = {
  emerald: "text-emerald-600",
  slate: "text-slate-400",
  rose: "text-rose-600",
  amber: "text-amber-600",
};

export default function TeamPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const canManage = !!userRole && COMPANY_MANAGEMENT_ROLES.includes(userRole);
  // Deactivation and permission overrides are owner-only in the backend's
  // permission matrix (company_manager has team.invite_users but not
  // team.deactivate_users/team.set_permissions) — mirror that here so
  // managers don't see actions that will just 403.
  const isOwner = userRole === UserRole.COMPANY_OWNER;

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [members, setMembers] = useState<CompanyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(UserRole.AGENT);
  const [allowDirectSubmit, setAllowDirectSubmit] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inviteErrors, setInviteErrors] = useState<{ email?: string; role?: string }>({});
  // Member actions in progress, so each button can show its own loader.
  const [busy, setBusy] = useState<Record<string, "submit" | "reactivate" | undefined>>({});
  const [deactivating, setDeactivating] = useState<CompanyUser | null>(null);

  const fetchInvitations = async () => {
    const response = await InvitationService.list();
    if (response.success) {
      setInvitations(response.data || []);
    } else {
      toast.error(response.error || "Failed to load invitations");
    }
  };

  const fetchMembers = async () => {
    if (!isOwner) return;
    const response = await CompanyService.getCompanyUsers();
    if (response.success) {
      setMembers(response.data || []);
    } else {
      toast.error(response.error || "Failed to load team members");
    }
  };

  useEffect(() => {
    if (!canManage) {
      setIsLoading(false);
      return;
    }
    Promise.all([fetchInvitations(), fetchMembers()]).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage, isOwner]);

  const validateInvite = (nextEmail: string, nextRole: string) => {
    const result = inviteSchema.safeParse({ email: nextEmail.trim(), role: nextRole });
    const next: { email?: string; role?: string } = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as "email" | "role";
        next[key] ??= issue.message;
      }
    }
    setInviteErrors(next);
    return next;
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const problems = validateInvite(email, role);
    if (problems.email || problems.role) {
      toast.error(
        [problems.email, problems.role].filter(Boolean).join("; "),
      );
      return;
    }
    setIsSending(true);
    try {
      const response = await InvitationService.create({
        email: email.trim(),
        role: role as UserRole,
        ...(role === UserRole.AGENT && allowDirectSubmit
          ? { permissions: { [SUBMIT_CAPABILITY]: true } }
          : {}),
      });

      if (response.success && response.data) {
        toast.success(`Invitation sent to ${email.trim()}`);
        setEmail("");
        setAllowDirectSubmit(false);
        fetchInvitations();

        // sendEmail is a placeholder that only logs server-side (see
        // PENDING.md) - surface the link here too so it can be shared
        // directly until a real provider (Resend) is wired in.
        const link = inviteLinkFor(response.data.token);
        navigator.clipboard?.writeText(link).catch(() => {});
        toast.message("Invite link copied to clipboard", {
          description: link,
          duration: 10000,
        });
      } else {
        if (response.fieldErrors) {
          setInviteErrors({
            email: response.fieldErrors.email,
            role: response.fieldErrors.role,
          });
        }
        toast.error(response.error || "Failed to send invitation");
      }
    } catch {
      toast.error("Could not send the invitation. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleRevoke = async (id: string) => {
    const response = await InvitationService.revoke(id);
    if (response.success) {
      toast.success("Invitation revoked");
      fetchInvitations();
    } else {
      toast.error(response.error || "Failed to revoke invitation");
    }
  };

  const patchMember = (id: string, patch: Partial<CompanyUser>) =>
    setMembers((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const confirmDeactivate = async (reason: string) => {
    const member = deactivating;
    if (!member) return false;
    const response = await CompanyService.deactivateUser(member.id, reason || undefined);
    if (!response.success) {
      toast.error(response.error || "Failed to deactivate user");
      return false;
    }
    const moved = (response.data as any)?.reassignedLeads ?? 0;
    toast.success(
      moved > 0
        ? `${member.name} deactivated. ${moved} open lead${moved === 1 ? "" : "s"} moved to you.`
        : `${member.name} deactivated`,
    );
    patchMember(member.id, { banned: true });
    fetchMembers();
    return true;
  };

  const handleReactivate = async (member: CompanyUser) => {
    setBusy((b) => ({ ...b, [member.id]: "reactivate" }));
    const response = await CompanyService.reactivateUser(member.id);
    setBusy((b) => ({ ...b, [member.id]: undefined }));
    if (response.success) {
      toast.success(`${member.name} reactivated`);
      patchMember(member.id, { banned: false });
      fetchMembers();
    } else {
      toast.error(response.error || "Failed to reactivate user");
    }
  };

  const toggleDirectSubmit = async (member: CompanyUser) => {
    const current = member.permissions?.[SUBMIT_CAPABILITY] === true;
    const next = !current;
    setBusy((b) => ({ ...b, [member.id]: "submit" }));
    // Show the new state straight away; put it back if saving fails.
    patchMember(member.id, { permissions: { ...(member.permissions ?? {}), [SUBMIT_CAPABILITY]: next } });
    const response = await CompanyService.updateUserPermissions(member.id, { [SUBMIT_CAPABILITY]: next });
    setBusy((b) => ({ ...b, [member.id]: undefined }));
    if (response.success) {
      toast.success(next ? `Direct submit is on for ${member.name}` : `Direct submit is off for ${member.name}`);
    } else {
      patchMember(member.id, { permissions: member.permissions });
      toast.error(response.error || "Failed to update permissions");
    }
  };

  if (!canManage) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <p className="text-sm text-gray-400 uppercase tracking-widest">
          Only company owners and managers can manage the team.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up max-w-5xl mx-auto">
      <div className="mb-16 border-b border-gray-100 pb-8">
        <h2 className="text-3xl font-serif text-luxury-black">Team</h2>
        <p className="text-gray-400 mt-2 font-light text-sm tracking-wide">
          Invite colleagues and manage their access.
        </p>
      </div>

      {/* Invite form: three columns that share the same label line and
          control height, so the field, the role and the button line up. */}
      <form onSubmit={handleInvite} className="mb-4 p-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_14rem_auto] gap-x-6 gap-y-4 items-start">
          <div>
            <label htmlFor="invite-email" className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 leading-4">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (inviteErrors.email) validateInvite(e.target.value, role);
              }}
              onBlur={() => email && validateInvite(email, role)}
              placeholder="colleague@company.com"
              className={cn(
                "w-full h-12 px-4 border text-sm bg-white placeholder:text-gray-300 focus:outline-none focus:border-luxury-gold transition-colors",
                inviteErrors.email ? "border-red-500 bg-red-50" : "border-gray-200",
              )}
            />
            {inviteErrors.email && <p className="text-xs text-red-500 mt-1.5">{inviteErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="invite-role" className="block text-[10px] uppercase tracking-widest text-gray-500 mb-2 leading-4">
              Role
            </label>
            <div className="relative">
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-12 pl-4 pr-10 appearance-none border border-gray-200 text-sm bg-white focus:outline-none focus:border-luxury-gold transition-colors cursor-pointer"
              >
                {INVITABLE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {inviteErrors.role && <p className="text-xs text-red-500 mt-1.5">{inviteErrors.role}</p>}
          </div>

          <div>
            {/* Same height as the labels beside it, so the button sits level with the inputs. */}
            <span aria-hidden className="hidden md:block mb-2 leading-4 text-[10px]">&nbsp;</span>
            <Button
              type="submit"
              variant="dark"
              disabled={isSending}
              className="h-12 w-full md:w-auto px-7 text-[10px] tracking-widest whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {isSending ? "Sending..." : "Send Invite"}
            </Button>
          </div>
        </div>

        {role === UserRole.AGENT && (
          <label className="flex items-center gap-2 text-xs text-gray-500 mt-5 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={allowDirectSubmit}
              onChange={(e) => setAllowDirectSubmit(e.target.checked)}
              className="accent-luxury-gold"
            />
            Allow this agent to submit listings directly to the platform (skips manager review)
          </label>
        )}
      </form>

      <p className="text-[11px] text-gray-400 mb-16 flex items-center gap-1.5">
        <Mail size={12} /> Email is sent via a placeholder service for now (check the backend
        logs, not a real inbox) — the invite link is also copied to your clipboard so you can
        share it directly until a real provider is wired in.
      </p>

      {/* Active members */}
      {isOwner && (
        <div className="mb-16">
          <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-4">
            Active Members
          </h3>
          {members.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-xs uppercase tracking-widest border border-gray-100">
              No team members yet
            </div>
          ) : (
            <div className="border border-gray-100 divide-y divide-gray-100">
              {members.map((member) => {
                const canSubmitDirectly = member.permissions?.[SUBMIT_CAPABILITY] === true;
                return (
                  <div key={member.id} className="flex items-center justify-between px-6 py-5">
                    <div>
                      <p className="text-sm font-medium text-luxury-black flex items-center gap-2">
                        {member.name}
                        {member.banned && (
                          <span className="text-[9px] uppercase tracking-widest text-rose-600 border border-rose-100 bg-rose-50 px-2 py-0.5 rounded-full">
                            Deactivated
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                        {member.role.replace("_", " ")} &middot; {member.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {member.role === UserRole.AGENT && !member.banned && (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={canSubmitDirectly}
                          disabled={busy[member.id] === "submit"}
                          onClick={() => toggleDirectSubmit(member)}
                          title={
                            canSubmitDirectly
                              ? "On: this agent's listings go straight to platform review. Click to turn off."
                              : "Off: this agent's listings need a manager first. Click to turn on."
                          }
                          className={cn(
                            "flex items-center gap-2.5 h-9 px-3 border text-[10px] uppercase tracking-[0.15em] font-medium transition-colors cursor-pointer disabled:cursor-wait",
                            canSubmitDirectly
                              ? "border-luxury-gold text-luxury-black"
                              : "border-gray-200 text-gray-400 hover:text-luxury-black",
                          )}
                        >
                          {busy[member.id] === "submit" ? (
                            <InlineSpinner className="text-luxury-gold" />
                          ) : canSubmitDirectly ? (
                            <ShieldCheck size={14} className="text-luxury-gold" />
                          ) : (
                            <ShieldOff size={14} />
                          )}
                          Direct submit
                          <span
                            className={cn(
                              "relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors",
                              canSubmitDirectly ? "bg-luxury-gold" : "bg-gray-200",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all",
                                canSubmitDirectly ? "left-3.5" : "left-0.5",
                              )}
                            />
                          </span>
                          <span className={cn("w-6 text-left", canSubmitDirectly ? "text-luxury-gold" : "text-gray-400")}>
                            {canSubmitDirectly ? "On" : "Off"}
                          </span>
                        </button>
                      )}
                      {member.role !== "company_owner" &&
                        (member.banned ? (
                          <ActionButton loading={busy[member.id] === "reactivate"} onClick={() => handleReactivate(member)}>
                            Reactivate
                          </ActionButton>
                        ) : (
                          <ActionButton tone="danger" onClick={() => setDeactivating(member)}>
                            Deactivate
                          </ActionButton>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Invitations list */}
      <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-4">
        Pending Invitations
      </h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm uppercase tracking-widest">
          No invitations sent yet
        </div>
      ) : (
        <div className="border border-gray-100 divide-y divide-gray-100">
          {invitations.map((invitation) => {
            const status = invitationStatus(invitation);
            const isPending = status.label === "Pending";
            return (
              <div
                key={invitation.id}
                className="flex items-center justify-between px-6 py-5"
              >
                <div>
                  <p className="text-sm font-medium text-luxury-black">
                    {invitation.email}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                    {invitation.role.replace("_", " ")}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold",
                      STATUS_TEXT_COLOR[status.tone],
                    )}
                  >
                    {STATUS_ICON[status.tone]} {status.label}
                  </span>
                  {isPending && (
                    <>
                      <button
                        onClick={() => {
                          const link = inviteLinkFor(invitation.token);
                          navigator.clipboard?.writeText(link).catch(() => {});
                          toast.success("Invite link copied");
                        }}
                        className="text-gray-400 hover:text-luxury-black transition-colors"
                        title="Copy invite link"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleRevoke(invitation.id)}
                        className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
                      >
                        Revoke
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ReasonModal
        open={!!deactivating}
        title="Deactivate team member"
        description={
          deactivating && (
            <>
              <span className="font-medium text-luxury-black">{deactivating.name}</span> loses access immediately and is signed
              out everywhere. Their listings stay with the company and their open leads move to you. You can reactivate them later.
            </>
          )
        }
        confirmLabel="Deactivate"
        reasonLabel="Reason"
        reasonRequired={false}
        tone="danger"
        onConfirm={confirmDeactivate}
        onClose={() => setDeactivating(null)}
      />
    </div>
  );
}
