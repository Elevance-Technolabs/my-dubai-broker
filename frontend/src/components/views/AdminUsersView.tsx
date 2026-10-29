"use client";

import { useEffect, useState } from "react";
import { AdminService } from "@/services/admin.service";
import { toast } from "sonner";
import { Search, Users, Ban, ShieldCheck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import DataTable, { DataTableColumn } from "@/components/ui/DataTable";
import { UserRole } from "@/types/enums";

type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  company: { id: string; name: string } | null;
};

const ROLE_OPTIONS = Object.values(UserRole);

const ROLE_LABELS: Record<string, string> = {
  [UserRole.SUPER_ADMIN]: "Super Admin",
  [UserRole.PLATFORM_REVIEWER]: "Platform Reviewer",
  [UserRole.COMPANY_OWNER]: "Company Owner",
  [UserRole.COMPANY_MANAGER]: "Company Manager",
  [UserRole.AGENT]: "Agent",
  [UserRole.LISTING_COORDINATOR]: "Listing Coordinator",
  [UserRole.VIEWER]: "Viewer",
};

export default function AdminUsersView() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchUsers = async () => {
    setLoading(true);
    const response = await AdminService.getAllUsers({
      role: roleFilter === "ALL" ? undefined : roleFilter,
      search: search || undefined,
    });
    if (response.success) {
      setUsers((response.data as any)?.users || []);
    } else {
      toast.error(response.error || "Failed to fetch users");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const handleRoleChange = async (user: PlatformUser, role: string) => {
    if (role === user.role) return;
    setUpdatingId(user.id);
    const response = await AdminService.updateUserRole(user.id, role);
    if (response.success) {
      toast.success(`${user.name}'s role updated to ${ROLE_LABELS[role] ?? role}`);
      fetchUsers();
    } else {
      toast.error(response.error || "Failed to update role");
    }
    setUpdatingId(null);
  };

  const handleToggleBan = async (user: PlatformUser) => {
    setUpdatingId(user.id);
    const response = user.banned
      ? await AdminService.reactivatePlatformUser(user.id)
      : await AdminService.deactivatePlatformUser(user.id, "Deactivated via platform user management");
    if (response.success) {
      toast.success(user.banned ? "User reactivated" : "User deactivated");
      fetchUsers();
    } else {
      toast.error(response.error || "Failed to update user status");
    }
    setUpdatingId(null);
  };

  const columns: DataTableColumn<PlatformUser>[] = [
    {
      header: "User",
      render: (user) => (
        <div>
          <p className="font-bold text-slate-900 text-sm">{user.name}</p>
          <p className="text-slate-400 text-xs">{user.email}</p>
        </div>
      ),
    },
    {
      header: "Company",
      render: (user) => (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Building2 size={14} className="text-slate-400" />
          {user.company?.name || "— (platform staff)"}
        </div>
      ),
    },
    {
      header: "Role",
      render: (user) => (
        <select
          value={user.role}
          disabled={updatingId === user.id}
          onChange={(e) => handleRoleChange(user, e.target.value)}
          className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-white disabled:opacity-50"
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role] ?? role}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: "Status",
      render: (user) => (
        <span
          className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit",
            user.banned
              ? "bg-rose-50 text-rose-700 border border-rose-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-100",
          )}
        >
          {user.banned ? "Deactivated" : "Active"}
        </span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      render: (user) =>
        user.companyId ? (
          <button
            onClick={() => handleToggleBan(user)}
            disabled={updatingId === user.id}
            className={cn(
              "p-2 rounded-lg transition-all disabled:opacity-50",
              user.banned
                ? "text-emerald-500 hover:bg-emerald-50"
                : "text-rose-500 hover:bg-rose-50",
            )}
            title={user.banned ? "Reactivate" : "Deactivate"}
          >
            {user.banned ? <ShieldCheck size={18} /> : <Ban size={18} />}
          </button>
        ) : null,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-canela text-slate-900 mb-2">Users</h1>
          <p className="text-slate-500 font-satoshi">
            Every user across every company, and platform staff
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or email..."
              className="pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-gold transition-colors bg-white w-full sm:w-64"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">All Roles</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role] ?? role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        rowKey={(user) => user.id}
        isLoading={loading}
        emptyIcon={<Users size={32} className="mx-auto mb-4 text-slate-300" />}
        emptyMessage="No users found."
      />
    </div>
  );
}
