"use client";

import { Pencil, Clock, Send, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DeliveryStatusProps {
  status: string;
  sentAt?: string | null;
}

const statusConfig: Record<
  string,
  { label: string; icon: typeof Pencil; className: string; pulse?: boolean }
> = {
  draft: {
    label: "Draft",
    icon: Pencil,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  pending: {
    label: "Pending Approval",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    pulse: true,
  },
  sent: { label: "Sending", icon: Send, className: "bg-blue-50 text-blue-700 border-blue-200" },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failed: { label: "Failed", icon: XCircle, className: "bg-red-50 text-red-700 border-red-200" },
  bounced: {
    label: "Bounced",
    icon: AlertTriangle,
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function DeliveryStatus({ status, sentAt }: DeliveryStatusProps) {
  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1.5 ${config.className}`}>
      <Icon className={`h-3 w-3 ${config.pulse ? "animate-pulse" : ""}`} />
      {config.label}
      {sentAt && status === "delivered" && (
        <span className="text-xs opacity-75 ml-1">
          {new Date(sentAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </Badge>
  );
}
