"use client";

import { cn } from "@/lib/utils";
import { DeliveryStatus } from "./delivery-status";

interface ThreadEmail {
  id: string;
  direction: string;
  fromAddress: { email: string; name?: string };
  toAddresses: Array<{ email: string; name?: string }>;
  subject: string;
  bodyText: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface ThreadViewProps {
  threadEmails: ThreadEmail[];
  currentEmailId: string;
}

export function ThreadView({ threadEmails, currentEmailId }: ThreadViewProps) {
  if (threadEmails.length <= 1) return null;

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Conversation Thread</h3>
      <div className="space-y-2">
        {threadEmails.map((email) => {
          const isInbound = email.direction === "inbound";
          const isCurrent = email.id === currentEmailId;
          const senderName = email.fromAddress.name || email.fromAddress.email;
          const bodyPreview = email.bodyText
            ? email.bodyText.slice(0, 150) + (email.bodyText.length > 150 ? "..." : "")
            : "No content";

          return (
            <div key={email.id} className={cn("flex", isInbound ? "justify-start" : "justify-end")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3 text-sm",
                  isInbound
                    ? "bg-slate-100 text-slate-800"
                    : "bg-blue-50 text-blue-900 border border-blue-200",
                  isCurrent && "ring-2 ring-blue-400"
                )}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="font-medium text-xs">{senderName}</span>
                  <span className="text-xs text-slate-500">{formatTime(email.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{bodyPreview}</p>
                {!isInbound && (
                  <div className="mt-1.5">
                    <DeliveryStatus status={email.status} sentAt={email.sentAt} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
