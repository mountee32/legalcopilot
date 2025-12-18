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
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useMarkRead } from "@/lib/hooks/use-notifications";
import type { Notification } from "@/lib/db/schema";

interface NotificationItemProps {
  notification: Notification;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
          <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
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
