"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, AlertCircle, Clock, TrendingUp, Sparkles, RefreshCw, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { DeliveryStatus } from "@/components/email/delivery-status";

interface EmailMessage {
  id: string;
  fromAddress: { email: string; name?: string };
  subject: string;
  aiSummary: string | null;
  aiIntent: string | null;
  aiSentiment: string | null;
  aiUrgency: number | null;
  aiSuggestedResponse: string | null;
  aiMatchConfidence: number | null;
  matterId: string | null;
  createdAt: string;
  status: string;
  aiProcessed: boolean;
}

const urgencyLevels = [
  { min: 0, max: 25, label: "Low", color: "text-slate-500", bg: "bg-slate-50", icon: Clock },
  {
    min: 26,
    max: 50,
    label: "Medium",
    color: "text-blue-600",
    bg: "bg-blue-50",
    icon: AlertCircle,
  },
  { min: 51, max: 75, label: "High", color: "text-amber-600", bg: "bg-amber-50", icon: TrendingUp },
  { min: 76, max: 100, label: "Urgent", color: "text-red-600", bg: "bg-red-50", icon: AlertCircle },
];

const intentLabels: Record<string, string> = {
  request_information: "Info Request",
  provide_information: "Info Provided",
  request_action: "Action Required",
  status_update: "Status Update",
  complaint: "Complaint",
  deadline: "Deadline",
  confirmation: "Confirmation",
  general: "General",
};

const sentimentColors: Record<string, string> = {
  positive: "text-emerald-600 bg-emerald-50",
  neutral: "text-slate-600 bg-slate-50",
  negative: "text-orange-600 bg-orange-50",
  frustrated: "text-red-600 bg-red-50",
};

export default function InboxPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "needs_review" | "processed" | "drafts">(
    "needs_review"
  );

  useEffect(() => {
    fetchEmails();
  }, [filter]);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "needs_review") {
        params.set("aiProcessed", "true");
        params.set("status", "received");
      } else if (filter === "processed") {
        params.set("status", "sent");
      } else if (filter === "drafts") {
        params.set("status", "draft");
      }

      const res = await fetch(`/api/emails?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch emails");

      const data = await res.json();
      setEmails(data.emails || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load emails",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processEmail = async (emailId: string) => {
    try {
      const res = await fetch(`/api/emails/${emailId}/ai/process`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to process email");

      toast({
        title: "Processing complete",
        description: "Email has been analyzed by AI",
      });

      fetchEmails();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process email",
        variant: "destructive",
      });
    }
  };

  const getUrgencyLevel = (urgency: number | null) => {
    if (urgency === null) return urgencyLevels[0];
    return (
      urgencyLevels.find((level) => urgency >= level.min && urgency <= level.max) ||
      urgencyLevels[0]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  const needsReviewCount = emails.filter((e) => e.aiProcessed && e.status === "received").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">AI Inbox</h1>
              <p className="text-slate-600 text-lg">AI-processed emails ready for your review</p>
            </div>
            <Button onClick={fetchEmails} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setFilter("needs_review")}
              className={`px-4 py-3 font-medium transition-all relative ${
                filter === "needs_review" ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Needs Review
              {needsReviewCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
                  {needsReviewCount}
                </span>
              )}
              {filter === "needs_review" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-3 font-medium transition-all relative ${
                filter === "all" ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Emails
              {filter === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setFilter("processed")}
              className={`px-4 py-3 font-medium transition-all relative ${
                filter === "processed" ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sent
              {filter === "processed" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setFilter("drafts")}
              className={`px-4 py-3 font-medium transition-all relative ${
                filter === "drafts" ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Drafts
              </span>
              {filter === "drafts" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Email List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </>
          ) : emails.length === 0 ? (
            <Card className="p-12 text-center">
              <Mail className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No emails found</h3>
              <p className="text-slate-600">
                {filter === "needs_review"
                  ? "All caught up! No emails need your review."
                  : "No emails to display."}
              </p>
            </Card>
          ) : (
            emails.map((email) => {
              const urgencyLevel = getUrgencyLevel(email.aiUrgency);
              const UrgencyIcon = urgencyLevel.icon;
              const confidence = email.aiMatchConfidence || 0;

              return (
                <Card
                  key={email.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden border-l-4"
                  style={{
                    borderLeftColor:
                      confidence >= 90
                        ? "rgb(34, 197, 94)"
                        : confidence >= 70
                          ? "rgb(59, 130, 246)"
                          : "rgb(148, 163, 184)",
                  }}
                  onClick={() => router.push(`/inbox/${email.id}`)}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {email.fromAddress.name || email.fromAddress.email}
                          </span>
                          <span className="text-sm text-slate-500">
                            {formatDate(email.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {email.subject}
                        </h3>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${urgencyLevel.bg}`}
                      >
                        <UrgencyIcon className={`h-4 w-4 ${urgencyLevel.color}`} />
                        <span className={`text-sm font-medium ${urgencyLevel.color}`}>
                          {urgencyLevel.label}
                        </span>
                      </div>
                    </div>

                    {/* AI Summary */}
                    {email.aiSummary && (
                      <div className="mb-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {email.aiSummary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {email.aiIntent && (
                        <Badge variant="outline" className="font-medium">
                          {intentLabels[email.aiIntent] || email.aiIntent}
                        </Badge>
                      )}
                      {email.aiSentiment && (
                        <Badge
                          variant="outline"
                          className={sentimentColors[email.aiSentiment] || ""}
                        >
                          {email.aiSentiment}
                        </Badge>
                      )}
                      {confidence >= 70 && (
                        <Badge
                          variant="outline"
                          className={
                            confidence >= 90
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }
                        >
                          {confidence}% match confidence
                        </Badge>
                      )}
                      {email.aiSuggestedResponse && (
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200"
                        >
                          Draft Ready
                        </Badge>
                      )}
                      {email.status !== "received" && email.status !== "archived" && (
                        <DeliveryStatus status={email.status} />
                      )}
                    </div>
                  </div>

                  {/* Action hint on hover */}
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-sm text-slate-600">
                      Click to view full email and AI-generated response →
                    </p>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
