"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { NotificationItem } from "@/components/app-shell/notification-item";
import { useNotifications, useMarkAllRead } from "@/lib/hooks/use-notifications";

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "task_assigned", label: "Task Assigned" },
  { value: "task_due", label: "Task Due" },
  { value: "task_overdue", label: "Task Overdue" },
  { value: "approval_required", label: "Approval Required" },
  { value: "approval_decided", label: "Approval Decided" },
  { value: "deadline_approaching", label: "Deadline Approaching" },
  { value: "email_received", label: "Email Received" },
  { value: "document_uploaded", label: "Document Uploaded" },
  { value: "system", label: "System" },
];

const READ_OPTIONS = [
  { value: "", label: "All" },
  { value: "false", label: "Unread" },
  { value: "true", label: "Read" },
];

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const markAllRead = useMarkAllRead();

  const readParam = readFilter === "true" ? true : readFilter === "false" ? false : undefined;

  const { notifications, pagination, isLoading, isError, unreadCount } = useNotifications({
    page,
    limit: 25,
    read: readParam,
    type: typeFilter || undefined,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
              <p className="text-slate-600 mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || unreadCount === 0}
            >
              Mark All Read
            </Button>
          </div>

          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
            >
              {READ_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-8">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8">
            <EmptyState
              title="Failed to load notifications"
              description="There was an error loading notifications. Please try again."
            />
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="p-8">
            <EmptyState
              icon={Bell}
              title="No notifications"
              description={
                typeFilter || readFilter
                  ? "Try adjusting your filters"
                  : "You're all caught up — no notifications yet."
              }
            />
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden divide-y">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </Card>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-600">
                  Showing {(page - 1) * 25 + 1} to {Math.min(page * 25, pagination.total)} of{" "}
                  {pagination.total} notifications
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
