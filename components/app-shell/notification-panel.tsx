"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NotificationItem } from "./notification-item";
import { useNotifications, useMarkAllRead } from "@/lib/hooks/use-notifications";
import Link from "next/link";

export function NotificationPanel() {
  const { notifications, isLoading } = useNotifications({ limit: 10, read: false });
  const markAllRead = useMarkAllRead();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="font-semibold">Notifications</h3>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Mark All Read
          </Button>
        )}
      </div>

      <Separator />

      {/* Notification List */}
      <ScrollArea className="h-96">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/settings/notifications">View All Notifications</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
