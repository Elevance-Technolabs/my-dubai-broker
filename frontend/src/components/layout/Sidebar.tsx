"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Building2,
  Menu,
  X,
  LogOut,
  BadgeCheck,
  Users as UsersIcon,
  Contact,
  UserCircle,
  History,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSession } from "@/lib/auth-client";
import { FrontendAuthService } from "@/services/auth.service";
import { UserRole, COMPANY_MANAGEMENT_ROLES, COMPANY_ROLES, PLATFORM_STAFF_ROLES } from "@/types/enums";

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  isActive,
  onClick,
}: {
  icon: any;
  label: string;
  href: string;
  isActive: boolean;
  onClick?: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "group w-full flex items-center space-x-4 px-8 py-5 text-[10px] uppercase tracking-widest transition-all duration-300 border-r-2",
      isActive
        ? "bg-gray-50 border-luxury-gold text-luxury-black font-semibold"
        : "border-transparent text-gray-400 hover:text-luxury-black hover:bg-gray-50/30",
    )}
  >
    <Icon
      className={cn(
        "w-4 h-4 transition-colors duration-300",
        isActive
          ? "text-luxury-gold"
          : "group-hover:text-luxury-black text-gray-300",
      )}
    />
    <span>{label}</span>
  </Link>
);

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Helper for cleaner role checking
  const userRole = (session?.user as any)?.role as UserRole | undefined;
  const isCompanyRole = !!userRole && COMPANY_ROLES.includes(userRole);
  const canManageCompany = !!userRole && COMPANY_MANAGEMENT_ROLES.includes(userRole);
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;
  const isPlatformStaff = !!userRole && PLATFORM_STAFF_ROLES.includes(userRole);

  const handleSignOut = async () => {
    // Same destination AuthGuard picks once the session clears, so they can't fight.
    const destination = isPlatformStaff ? "/admin-login" : "/login";
    await FrontendAuthService.signOut();
    router.replace(destination);
  };

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* --- MOBILE HEADER --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-[60]">
        <h1 className="font-serif text-sm tracking-tighter text-luxury-black">
          MY DUBAI BROKER
        </h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-luxury-black"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* --- MOBILE OVERLAY (Backdrop) --- */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[51] lg:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* --- SIDEBAR CONTAINER --- */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-100 z-[55] transition-transform duration-500 ease-in-out lg:translate-x-0 w-64 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="p-8 pb-12 text-center">
          <h1 className="font-serif text-xl text-luxury-black hidden lg:block">
            MY DUBAI BROKER
          </h1>
          <div className="h-px w-6 bg-luxury-gold mb-4 mx-auto mt-6 hidden lg:block" />
          <p className="text-[9px] uppercase tracking-widest text-gray-400 mt-16 lg:mt-0">
            Overview
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {isCompanyRole && (
            <SidebarItem
              icon={LayoutDashboard}
              label="Overview"
              href="/dashboard"
              isActive={pathname === "/dashboard"}
              onClick={closeSidebar}
            />
          )}

          {isCompanyRole && (
            <SidebarItem
              icon={List}
              label="Listings"
              href="/listings"
              isActive={pathname?.startsWith("/listings")}
              onClick={closeSidebar}
            />
          )}

          {isCompanyRole && (
            <SidebarItem
              icon={Contact}
              label="Leads"
              href="/dashboard/leads"
              isActive={pathname?.startsWith("/dashboard/leads")}
              onClick={closeSidebar}
            />
          )}

          {canManageCompany && (
            <SidebarItem
              icon={UsersIcon}
              label="Team"
              href="/dashboard/team"
              isActive={pathname?.startsWith("/dashboard/team")}
              onClick={closeSidebar}
            />
          )}

          {isCompanyRole && (
            <SidebarItem
              icon={UserCircle}
              label="My Profile"
              href="/dashboard/profile"
              isActive={pathname?.startsWith("/dashboard/profile")}
              onClick={closeSidebar}
            />
          )}

          {isPlatformStaff && (
            <SidebarItem
              icon={LayoutDashboard}
              label="Overview"
              href="/admin"
              isActive={pathname === "/admin"}
              onClick={closeSidebar}
            />
          )}

          {isPlatformStaff && (
            <SidebarItem
              icon={Building2}
              label="Companies"
              href="/admin/companies"
              isActive={pathname?.startsWith("/admin/companies")}
              onClick={closeSidebar}
            />
          )}

          {isPlatformStaff && (
            <SidebarItem
              icon={BadgeCheck}
              label="Listings"
              href="/admin/listings"
              isActive={pathname?.startsWith("/admin/listings")}
              onClick={closeSidebar}
            />
          )}

          {isSuperAdmin && (
            <SidebarItem
              icon={UserCog}
              label="Users"
              href="/admin/users"
              isActive={pathname?.startsWith("/admin/users")}
              onClick={closeSidebar}
            />
          )}

          {isSuperAdmin && (
            <SidebarItem
              icon={History}
              label="Audit Log"
              href="/admin/audit-log"
              isActive={pathname?.startsWith("/admin/audit-log")}
              onClick={closeSidebar}
            />
          )}
        </nav>

        {/* Footer / User */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-luxury-black text-white flex items-center justify-center font-sans font-medium text-xs">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-sans font-medium text-luxury-black truncate">
                {session?.user?.name || "User"}
              </span>
              <span className="text-[9px] text-gray-400 uppercase tracking-tight">
                {userRole?.replace("_", " ")}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-3 flex items-center justify-center gap-2 border border-gray-200 text-[10px] uppercase tracking-widest font-medium text-gray-400 hover:text-red-600 hover:border-red-100 transition-all active:scale-95"
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Spacer for Mobile */}
      <div className="h-16 lg:hidden" />
    </>
  );
}
