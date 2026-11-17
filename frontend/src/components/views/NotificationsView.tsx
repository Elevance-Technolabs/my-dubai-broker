"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertOctagon, ArrowRight, BellRing, Info } from "lucide-react";
import { NotificationService, type AppNotification } from "@/services/notification.service";
import { ActionButton, EmptyState, PageHeader, Pagination, Pill, Spinner, Tabs, fmtDateTime } from "@/components/admin/AdminUI";
import { cn } from "@/lib/utils/cn";

const PRIORITY = {
  URGENT: { label: "Urgent", tone: "red" as const, Icon: AlertOctagon },
  ACTION_NEEDED: { label: "Action needed", tone: "amber" as const, Icon: BellRing },
  INFORMATION: { label: "Information", tone: "blue" as const, Icon: Info },
};

/** Notification centre (plan Section 17) — every role sees only its own. */
export default function NotificationsView() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await NotificationService.list({ page, limit: 20, unreadOnly: filter === "unread" || undefined });
    if (res.success) setData(res.data);
    else toast.error(res.error || "Failed to load notifications");
    setLoading(false);
  }, [page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  /** Marks one notification read in place (no reload), and tells the sidebar badge. */
  const markRead = async (n: AppNotification) => {
    if (n.readAt) return;
    const readAt = new Date().toISOString();
    setData((d: any) =>
      d
        ? {
            ...d,
            unreadCount: Math.max(0, (d.unreadCount ?? 1) - 1),
            notifications: d.notifications.map((x: AppNotification) => (x.id === n.id ? { ...x, readAt } : x)),
          }
        : d,
    );
    const res = await NotificationService.markRead(n.id);
    if (res.success) window.dispatchEvent(new Event("notifications:changed"));
    else load();
  };

  const markAll = async () => {
    const res = await NotificationService.markAllRead();
    if (res.success) {
      toast.success("All notifications marked as read");
      window.dispatchEvent(new Event("notifications:changed"));
      load();
    } else toast.error(res.error || "Failed to update notifications");
  };

  const items: AppNotification[] = data?.notifications ?? [];

  return (
    <div className="animate-fade-in-up max-w-4xl">
      <PageHeader
        title="Notifications"
        subtitle={data ? `${data.unreadCount} unread` : undefined}
        actions={<ActionButton className="h-10" disabled={!data?.unreadCount} onClick={markAll}>Mark all as read</ActionButton>}
      />
      <Tabs
        className="mb-6"
        active={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
        tabs={[
          { key: "all", label: "All" },
          { key: "unread", label: "Unread", count: data?.unreadCount },
        ]}
      />
      {loading && !data ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState message={filter === "unread" ? "You're all caught up." : "No notifications yet."} />
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const p = PRIORITY[n.priority] ?? PRIORITY.INFORMATION;
            const content = (
              <div
                className={cn(
                  "flex gap-4 p-4 border transition-colors",
                  n.readAt ? "bg-white border-gray-100" : "bg-gold/5 border-gold/30",
                )}
              >
                <p.Icon size={20} className={cn("shrink-0 mt-0.5", n.priority === "URGENT" ? "text-rose-500" : n.priority === "ACTION_NEEDED" ? "text-amber-500" : "text-blue-500")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn("text-sm text-luxury-black", n.readAt ? "" : "font-medium")}>{n.title}</p>
                    <Pill tone={p.tone}>{p.label}</Pill>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-3">
                    {fmtDateTime(n.createdAt)}
                    {n.actionUrl && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-luxury-gold">
                        Open <ArrowRight size={11} />
                      </span>
                    )}
                  </p>
                </div>
                {!n.readAt && <span className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" aria-label="Unread" />}
              </div>
            );
            return n.actionUrl ? (
              <Link key={n.id} href={n.actionUrl} onClick={() => markRead(n)} className="block">
                {content}
              </Link>
            ) : (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n)}
                title={n.readAt ? undefined : "Mark as read"}
                className={cn("block w-full text-left", n.readAt ? "cursor-default" : "cursor-pointer")}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
      <Pagination page={page} totalPages={data?.pagination?.totalPages ?? 1} total={data?.pagination?.total} onChange={setPage} />
    </div>
  );
}
