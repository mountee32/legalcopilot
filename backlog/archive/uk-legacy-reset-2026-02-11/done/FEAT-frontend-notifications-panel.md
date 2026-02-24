# FEAT: Frontend — Notifications Panel & Preferences

## Goal

Deliver a lightweight, high-signal notification surface.

## Scope

- Notifications panel (list, mark read, mark all read)
- Preferences page/section for notification types and channels

## Dependencies

- API: `GET /api/notifications`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`, `GET/PATCH /api/notifications/preferences`

## Acceptance Criteria

- Mark read actions are reliable and reflected immediately
- Preferences changes affect what the user sees (where applicable)

## References

- `docs/frontend-design.md` (Notifications Panel)
- `docs/ideas.md` (cross-cutting)

---

## Design

### Overview

The notifications panel will be implemented as a dropdown panel triggered by the bell icon in the topbar. This provides a non-intrusive, accessible way to view notifications without leaving the current page.

### Architecture

**UI Pattern**: Dropdown panel (using Radix UI DropdownMenu primitive)

- Triggered by bell icon in topbar
- Opens below the bell icon with right alignment
- Shows last 10 unread notifications by default
- Scrollable list with "View All" link to full notifications page

**Real-time Updates**: Polling strategy

- Poll every 30 seconds when panel is closed
- Poll every 10 seconds when panel is open
- Use React Query for automatic background refetching
- Show unread count badge on bell icon

**State Management**: React Query

- Shared cache key: `["notifications"]`
- Optimistic updates for mark read actions
- Automatic refetch on window focus

### Component Structure

```
components/app-shell/
  topbar.tsx                      (MODIFY - add NotificationButton)
  notification-button.tsx         (CREATE - bell icon + badge + dropdown)
  notification-panel.tsx          (CREATE - dropdown content)
  notification-item.tsx           (CREATE - single notification row)

app/(app)/settings/notifications/
  page.tsx                        (CREATE - preferences page)

lib/hooks/
  use-notifications.ts            (CREATE - React Query hooks)
```

### Files to Create

#### 1. `components/app-shell/notification-button.tsx`

```typescript
"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationPanel } from "./notification-panel";
import { useNotifications } from "@/lib/hooks/use-notifications";

export function NotificationButton() {
  const { unreadCount } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <NotificationPanel />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 2. `components/app-shell/notification-panel.tsx`

```typescript
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
          <div className="p-4 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
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
              <Link href="/settings/notifications">
                View All Notifications
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

#### 3. `components/app-shell/notification-item.tsx`

```typescript
"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Mail,
  FileText,
  Calendar,
  Clock,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMarkRead } from "@/lib/hooks/use-notifications";
import type { Notification } from "@/lib/db/schema";

interface NotificationItemProps {
  notification: Notification;
}

const iconMap = {
  task_assigned: CheckCircle2,
  task_due: Clock,
  task_overdue: AlertTriangle,
  approval_required: Bell,
  approval_decided: CheckCircle2,
  deadline_approaching: Calendar,
  deadline_passed: AlertTriangle,
  email_received: Mail,
  document_uploaded: FileText,
  invoice_paid: DollarSign,
  payment_received: DollarSign,
  system: Bell,
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const markRead = useMarkRead();
  const Icon = iconMap[notification.type] || Bell;

  const handleClick = () => {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
  };

  const content = (
    <div
      className={cn(
        "flex gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
        !notification.read && "bg-muted/30"
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1 min-w-0">
        <p className="text-sm font-medium leading-none">{notification.title}</p>
        {notification.body && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        </div>
      )}
    </div>
  );

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>;
  }

  return content;
}
```

#### 4. `lib/hooks/use-notifications.ts`

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/lib/db/schema";

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseNotificationsOptions {
  limit?: number;
  page?: number;
  read?: boolean;
  type?: string;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 10, page = 1, read, type } = options;

  const query = useQuery({
    queryKey: ["notifications", { limit, page, read, type }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      });
      if (typeof read === "boolean") params.set("read", read.toString());
      if (type) params.set("type", type);

      const res = await fetch(`/api/notifications?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json() as Promise<NotificationsResponse>;
    },
    refetchInterval: 30_000, // Refetch every 30 seconds
    staleTime: 10_000,
  });

  const unreadCount = useUnreadCount();

  return {
    notifications: query.data?.notifications ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    unreadCount,
  };
}

export function useUnreadCount() {
  const query = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?read=false&limit=1", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch unread count");
      const data = (await res.json()) as NotificationsResponse;
      return data.pagination.total;
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  return query.data ?? 0;
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all notification queries to refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
```

#### 5. `app/(app)/settings/notifications/page.tsx`

```typescript
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/lib/hooks/use-toast";

interface NotificationPreferences {
  channelsByType?: Record<string, ("in_app" | "email" | "push")[]>;
}

interface PreferencesResponse {
  preferences: NotificationPreferences;
  updatedAt: string;
}

export default function NotificationPreferencesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>({});

  const { isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/preferences", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch preferences");
      const data = await res.json() as PreferencesResponse;
      setPreferences(data.preferences);
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (prefs: NotificationPreferences) => {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const notificationTypes = [
    { value: "task_assigned", label: "Task assigned to me" },
    { value: "task_due", label: "Task due soon" },
    { value: "task_overdue", label: "Task overdue" },
    { value: "approval_required", label: "Approval required" },
    { value: "deadline_approaching", label: "Deadline approaching" },
    { value: "email_received", label: "New email received" },
    { value: "document_uploaded", label: "Document uploaded" },
    { value: "invoice_paid", label: "Invoice paid" },
    { value: "payment_received", label: "Payment received" },
  ];

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (isLoading) {
    return <div className="p-6">Loading preferences...</div>;
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Choose how you want to be notified about different events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Select which notifications you want to receive and how you want to receive them.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationTypes.map((type) => (
            <div key={type.value} className="space-y-2">
              <Label className="text-base font-medium">{type.label}</Label>
              <div className="flex gap-6 ml-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${type.value}-in_app`}
                    checked={preferences.channelsByType?.[type.value]?.includes("in_app") ?? true}
                    onCheckedChange={(checked) => {
                      const current = preferences.channelsByType?.[type.value] ?? ["in_app"];
                      const updated = checked
                        ? [...current, "in_app"]
                        : current.filter((c) => c !== "in_app");
                      setPreferences({
                        ...preferences,
                        channelsByType: {
                          ...preferences.channelsByType,
                          [type.value]: updated,
                        },
                      });
                    }}
                  />
                  <Label htmlFor={`${type.value}-in_app`} className="text-sm font-normal">
                    In-app
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${type.value}-email`}
                    checked={preferences.channelsByType?.[type.value]?.includes("email") ?? false}
                    onCheckedChange={(checked) => {
                      const current = preferences.channelsByType?.[type.value] ?? ["in_app"];
                      const updated = checked
                        ? [...current, "email"]
                        : current.filter((c) => c !== "email");
                      setPreferences({
                        ...preferences,
                        channelsByType: {
                          ...preferences.channelsByType,
                          [type.value]: updated,
                        },
                      });
                    }}
                  />
                  <Label htmlFor={`${type.value}-email`} className="text-sm font-normal">
                    Email
                  </Label>
                </div>
              </div>
              <Separator className="mt-4" />
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Files to Modify

#### 1. `components/app-shell/topbar.tsx`

Replace the existing bell button with NotificationButton component:

```typescript
// Before (line 51-53):
<Button variant="ghost" size="icon" aria-label="Notifications">
  <Bell className="h-5 w-5" />
</Button>

// After:
<NotificationButton />
```

Add import:

```typescript
import { NotificationButton } from "./notification-button";
```

### Data Flow

1. User opens dropdown -> `useNotifications()` fetches unread notifications
2. User clicks notification -> `useMarkRead()` marks as read, optimistically updates UI
3. User clicks "Mark All Read" -> `useMarkAllRead()` marks all as read
4. Polling occurs every 30s -> unread count badge updates automatically
5. User navigates to preferences page -> loads and saves preferences via API

### Testing Strategy

#### Unit Tests

- `tests/unit/components/app-shell/notification-button.test.tsx`
  - Renders bell icon with correct badge count
  - Opens dropdown on click
  - Badge hidden when no unread notifications

- `tests/unit/components/app-shell/notification-panel.test.tsx`
  - Renders empty state when no notifications
  - Renders notification list correctly
  - "Mark All Read" button calls correct mutation
  - "View All" link navigates correctly

- `tests/unit/components/app-shell/notification-item.test.tsx`
  - Renders notification with correct icon
  - Shows unread indicator for unread notifications
  - Marks as read on click
  - Links to correct URL when link is present

- `tests/unit/lib/hooks/use-notifications.test.ts`
  - Fetches notifications with correct query params
  - Refetches on interval
  - Mark read mutation invalidates queries
  - Unread count updates correctly

#### Integration Tests

- `tests/integration/notifications/panel.test.ts`
  - Full flow: fetch -> mark read -> refetch shows updated state
  - Mark all read updates all notifications
  - Polling refetches data

#### E2E Tests

- `tests/e2e/browser/notifications.spec.ts`
  - User clicks bell icon, sees notifications
  - User clicks notification, marked as read and badge updates
  - User clicks "Mark All Read", all notifications cleared
  - User navigates to preferences, updates settings, saves successfully

### UI/UX Considerations

1. **Accessibility**
   - Bell button has aria-label
   - Dropdown is keyboard navigable
   - Screen reader announces unread count
   - Focus management when opening/closing dropdown

2. **Performance**
   - Only fetch 10 most recent in dropdown
   - Polling uses stale-while-revalidate
   - Optimistic updates for instant feedback
   - Scroll virtualization not needed (max 10 items)

3. **Mobile Responsiveness**
   - Dropdown width: 24rem (384px) on desktop
   - Reduces to 20rem (320px) on mobile
   - Full-width on very small screens
   - Touch-friendly tap targets

4. **Visual Feedback**
   - Unread notifications have subtle background
   - Blue dot indicator for unread
   - Hover state on notification items
   - Loading states for mutations

### Error Handling

1. **API Errors**
   - Show error toast if mark read fails
   - Don't remove optimistic update if fails
   - Retry failed mutations automatically (React Query default)

2. **Network Errors**
   - Gracefully handle offline state
   - Show stale data if available
   - Retry when connection restored

3. **Edge Cases**
   - Handle empty notifications list
   - Handle malformed notification data
   - Handle missing icons gracefully (fallback to Bell)

### Migration Notes

No database migrations needed - all schema and API endpoints already exist.

### Future Enhancements (Not in Scope)

1. WebSocket support for real-time push notifications
2. Notification grouping by type/case
3. Snooze/remind me later functionality
4. Rich notification content (images, buttons)
5. Browser push notifications
6. Sound/desktop notifications
7. Notification search and filtering on preferences page
