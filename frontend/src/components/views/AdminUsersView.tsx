"use client";

import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, UserPlus } from "lucide-react";
import { AdminService } from "@/services/admin.service";
import { useSession } from "@/lib/auth-client";
import {
  ActionButton,
  EmptyState,
  FieldError,
  FieldLabel,
  FilterBar,
  FilterSelect,
  Modal,
  PageHeader,
  Pagination,
  Pill,
  ReasonModal,
  SearchField,
  Spinner,
  Tabs,
  fmtDate,
  inputClass,
} from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils/cn";
import { UserRole } from "@/types/enums";

type UserType = "partner" | "staff";

const ROLE_LABELS: Record<string, string> = {
  [UserRole.SUPER_ADMIN]: "Super Admin",
  [UserRole.PLATFORM_REVIEWER]: "Platform Reviewer",
  [UserRole.COMPANY_OWNER]: "Company Owner",
  [UserRole.COMPANY_MANAGER]: "Company Manager",
  [UserRole.AGENT]: "Agent",
  [UserRole.LISTING_COORDINATOR]: "Listing Coordinator",
  [UserRole.VIEWER]: "Viewer",
};

const PARTNER_ROLES = [
  UserRole.COMPANY_OWNER,
  UserRole.COMPANY_MANAGER,
  UserRole.AGENT,
  UserRole.LISTING_COORDINATOR,
  UserRole.VIEWER,
];
const STAFF_ROLES = [UserRole.SUPER_ADMIN, UserRole.PLATFORM_REVIEWER];
const toOptions = (roles: string[]) => roles.map((r) => ({ value: r, label: ROLE_LABELS[r] ?? r }));

const emptyFilters = { search: "", role: "", companyId: "", status: "" };

export default function AdminUsersView() {
  const { data: session } = useSession();
  const me = session?.user?.id;
  const [type, setType] = useState<UserType>("partner");
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<{ value: string; label: string; status?: string }[]>([]);
  const [roleChange, setRoleChange] = useState<{ user: any; role: string } | null>(null);
  const [deactivating, setDeactivating] = useState<any>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const setFilter = (key: keyof typeof emptyFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await AdminService.getAllUsers({ ...filters, type, page, limit: 25 });
    if (res.success) setData(res.data);
    else toast.error(res.error || "Failed to load users");
    setLoading(false);
  }, [filters, type, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    AdminService.getCompanies({ limit: 100, sort: "name" }).then(
      (r) => r.success && setCompanies((r.data?.companies ?? []).map((c: any) => ({ value: c.id, label: c.name, status: c.status }))),
    );
  }, []);

  const reactivate = async (user: any) => {
    const res = await AdminService.reactivatePlatformUser(user.id);
    if (res.success) {
      toast.success(`${user.name} reactivated`);
      load();
    } else toast.error(res.error || "Failed to reactivate user");
  };

  const users: any[] = data?.users ?? [];
  const roleOptions = type === "staff" ? STAFF_ROLES : PARTNER_ROLES;

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Users and Roles"
        subtitle="Partner company users and platform staff, managed separately."
        actions={
          <ActionButton tone="dark" size="md" onClick={() => setInviteOpen(true)}>
            <UserPlus size={14} />
            {type === "staff" ? "Invite staff member" : "Invite user"}
          </ActionButton>
        }
      />

      <Tabs<UserType>
        className="mb-6"
        active={type}
        onChange={(t) => {
          setType(t);
          setFilters(emptyFilters);
          setPage(1);
        }}
        tabs={[
          { key: "partner", label: "Partner users" },
          { key: "staff", label: "Platform staff" },
        ]}
      />

      <FilterBar onReset={() => { setFilters(emptyFilters); setPage(1); }}>
        <SearchField value={filters.search} onChange={(v) => setFilter("search", v)} placeholder="Name or email" />
        <FilterSelect label="Role" value={filters.role} onChange={(v) => setFilter("role", v)} options={toOptions(roleOptions)} />
        {type === "partner" && (
          <FilterSelect label="Company" value={filters.companyId} onChange={(v) => setFilter("companyId", v)} options={companies} />
        )}
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => setFilter("status", v)}
          options={[
            { value: "active", label: "Active" },
            { value: "deactivated", label: "Deactivated" },
          ]}
        />
      </FilterBar>

      {loading && !data ? (
        <Spinner />
      ) : users.length === 0 ? (
        <EmptyState message="No users match these filters." />
      ) : (
        <div className="bg-white border border-gray-100 overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-500">
                <th className="px-5 py-4 font-medium">User</th>
                {type === "partner" && <th className="px-5 py-4 font-medium">Company</th>}
                <th className="px-5 py-4 font-medium">Role</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Joined</th>
                <th className="px-5 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-luxury-black">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  {type === "partner" && <td className="px-5 py-4 text-slate-700">{u.company?.name ?? "—"}</td>}
                  <td className="px-5 py-4">
                    <select
                      value={u.role}
                      disabled={u.id === me}
                      title={u.id === me ? "You cannot change your own role" : undefined}
                      onChange={(e) => e.target.value !== u.role && setRoleChange({ user: u, role: e.target.value })}
                      className="h-9 px-2 border border-gray-200 text-sm bg-white focus:outline-none focus:border-luxury-gold disabled:opacity-50"
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    {u.banned ? <Pill tone="red">Deactivated</Pill> : <Pill tone="green">Active</Pill>}
                    {u.banned && u.banReason && <p className="text-xs text-slate-500 mt-1 max-w-[220px]">{u.banReason}</p>}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{fmtDate(u.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    {type === "partner" &&
                      (u.banned ? (
                        <ActionButton tone="success" onClick={() => reactivate(u)}>Reactivate</ActionButton>
                      ) : (
                        <ActionButton tone="danger" onClick={() => setDeactivating(u)}>Deactivate</ActionButton>
                      ))}
                    {type === "staff" && <span className="text-xs text-gray-400">{u.id === me ? "This is you" : "Change the role to update access"}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={data?.pagination?.totalPages ?? 1} total={data?.pagination?.total} onChange={setPage} />

      <ReasonModal
        open={!!roleChange}
        title="Change role"
        description={
          roleChange && (
            <>
              <span className="font-medium text-luxury-black">{roleChange.user.name}</span>: {ROLE_LABELS[roleChange.user.role]} →{" "}
              <span className="font-medium text-luxury-black">{ROLE_LABELS[roleChange.role]}</span>. The reason is saved in the audit log.
            </>
          )
        }
        confirmLabel="Change role"
        reasonLabel="Reason for the change"
        onConfirm={async (reason) => {
          // Read the selection inside the handler (not on render, when it is empty).
          const change = roleChange;
          if (!change) return false;
          const res = await AdminService.updateUserRole(change.user.id, change.role, reason);
          if (!res.success) {
            toast.error(res.error || "Failed to change role");
            return false;
          }
          toast.success("Role updated");
          load();
          return true;
        }}
        onClose={() => setRoleChange(null)}
      />

      <ReasonModal
        open={!!deactivating}
        title="Deactivate user"
        description={
          deactivating && (
            <>
              <span className="font-medium text-luxury-black">{deactivating.name}</span> loses access immediately. Their history is kept
              and their open leads move to the company owner.
            </>
          )
        }
        confirmLabel="Deactivate"
        reasonLabel="Reason"
        tone="danger"
        onConfirm={async (reason) => {
          const user = deactivating;
          if (!user) return false;
          const res = await AdminService.deactivatePlatformUser(user.id, reason);
          if (!res.success) {
            toast.error(res.error || "Failed to deactivate user");
            return false;
          }
          toast.success("User deactivated");
          load();
          return true;
        }}
        onClose={() => setDeactivating(null)}
      />

      {inviteOpen && (
        <InviteModal
          team={type}
          companies={companies}
          onClose={() => setInviteOpen(false)}
          onInvited={() => load()}
        />
      )}
    </div>
  );
}

function InviteModal({
  team,
  companies,
  onClose,
  onInvited,
}: {
  team: UserType;
  companies: { value: string; label: string; status?: string }[];
  onClose: () => void;
  onInvited: () => void;
}) {
  const isStaff = team === "staff";
  const roles = isStaff ? STAFF_ROLES : PARTNER_ROLES;
  const [form, setForm] = useState({
    companyId: "",
    email: "",
    role: (isStaff ? UserRole.PLATFORM_REVIEWER : UserRole.AGENT) as string,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const approved = companies.filter((c) => !c.status || c.status === "APPROVED");

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!isStaff && !form.companyId) next.companyId = "Choose a company.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const res = await AdminService.inviteUser({
      email: form.email.trim(),
      role: form.role,
      ...(isStaff ? {} : { companyId: form.companyId }),
    });
    setBusy(false);
    if (!res.success) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      toast.error(res.error || "Failed to send invitation");
      return;
    }
    toast.success("Invitation created");
    setInviteUrl(res.data?.inviteUrl ?? null);
    onInvited();
  };

  if (inviteUrl) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Invitation created"
        description={
          <>
            Share this link with <span className="font-medium text-luxury-black">{form.email.trim()}</span>. Email delivery is not
            connected yet. The link is valid for 7 days.
          </>
        }
        footer={
          <ActionButton size="md" tone="dark" onClick={onClose}>
            Done
          </ActionButton>
        }
      >
        <FieldLabel>Invitation link</FieldLabel>
        <div className="flex">
          <input readOnly value={inviteUrl} className={cn(inputClass(), "border-r-0")} onFocus={(e) => e.target.select()} />
          <ActionButton
            size="md"
            tone="outline"
            className="px-4"
            title="Copy link"
            onClick={() => navigator.clipboard.writeText(inviteUrl).then(() => toast.success("Link copied"))}
          >
            <Copy size={14} />
          </ActionButton>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={isStaff ? "Invite staff member" : "Invite partner user"}
      description={
        isStaff
          ? "The person joins the My Dubai Broker platform team with this role after setting a password."
          : "The person joins the company with this role after setting a password."
      }
      footer={
        <>
          <ActionButton size="md" onClick={onClose} disabled={busy}>
            Cancel
          </ActionButton>
          <ActionButton size="md" tone="dark" onClick={submit} loading={busy}>
            {busy ? "Sending" : "Send invitation"}
          </ActionButton>
        </>
      }
    >
      <div className="space-y-5">
        {!isStaff && (
          <div>
            <FieldLabel required>Company</FieldLabel>
            <select value={form.companyId} onChange={(e) => set("companyId", e.target.value)} className={inputClass(!!errors.companyId)}>
              <option value="">Choose an approved company</option>
              {approved.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.companyId} />
          </div>
        )}
        <div>
          <FieldLabel required>Email address</FieldLabel>
          <input
            type="email"
            value={form.email}
            placeholder={isStaff ? "name@mydubaibroker.com" : "name@company.com"}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass(!!errors.email)}
          />
          <FieldError message={errors.email} />
        </div>
        <div>
          <FieldLabel required>Role</FieldLabel>
          <select value={form.role} onChange={(e) => set("role", e.target.value)} className={inputClass(!!errors.role)}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <FieldError message={errors.role} />
          {isStaff && (
            <p className="text-xs text-gray-400 mt-2">
              {form.role === UserRole.SUPER_ADMIN
                ? "Super admins have full access, including users, configuration and the audit log."
                : "Reviewers review companies and listings, and see leads and reports."}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
