"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Edit, Sparkles, Filter, CheckCheck, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";

interface ApprovalRequest {
  id: string;
  action: string;
  summary: string;
  status: string;
  proposedPayload: Record<string, unknown> | null;
  entityType: string | null;
  entityId: string | null;
  matterId: string | null;
  aiMetadata: Record<string, unknown> | null;
  createdAt: string;
}

const actionIcons: Record<string, string> = {
  "email.send": "📧",
  "time.record": "⏱️",
  "matter.stage_change": "📋",
  "task.create": "✓",
  "document.generate": "📄",
};

const actionLabels: Record<string, string> = {
  "email.send": "Send Email",
  "time.record": "Record Time",
  "matter.stage_change": "Change Stage",
  "task.create": "Create Task",
  "document.generate": "Generate Document",
};

export default function ApprovalsPage() {
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editedReason, setEditedReason] = useState("");

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "pending") {
        params.set("status", "pending");
      }

      const res = await fetch(`/api/approvals?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch approvals");

      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load approvals",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, reason?: string) => {
    try {
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ decisionReason: reason }),
      });

      if (!res.ok) throw new Error("Failed to approve");

      toast({
        title: "Approved",
        description: "Request has been approved and executed",
      });

      fetchApprovals();
      setSelectedApproval(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string, reason?: string) => {
    try {
      const res = await fetch(`/api/approvals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ decisionReason: reason }),
      });

      if (!res.ok) throw new Error("Failed to reject");

      toast({
        title: "Rejected",
        description: "Request has been rejected",
      });

      fetchApprovals();
      setSelectedApproval(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;

    try {
      const res = await fetch("/api/approvals/bulk/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!res.ok) throw new Error("Failed to bulk approve");

      toast({
        title: "Approved",
        description: `${selectedIds.size} requests approved successfully`,
      });

      setSelectedIds(new Set());
      fetchApprovals();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve requests",
        variant: "destructive",
      });
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectHighConfidence = () => {
    const highConfidenceIds = approvals
      .filter((a) => {
        const confidence = (a.aiMetadata?.confidence as number) || 0;
        return confidence >= 90 && a.status === "pending";
      })
      .map((a) => a.id);

    setSelectedIds(new Set(highConfidenceIds));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getConfidence = (approval: ApprovalRequest): number => {
    return (approval.aiMetadata?.confidence as number) || 0;
  };

  const pendingCount = approvals.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
                Approval Queue
              </h1>
              <p className="text-slate-600 text-lg">Review and approve AI-generated actions</p>
            </div>
          </div>

          {/* Filters and Bulk Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 border-b border-slate-200">
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-3 font-medium transition-all relative ${
                  filter === "pending" ? "text-purple-600" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Pending
                {pendingCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-purple-600 text-white rounded-full">
                    {pendingCount}
                  </span>
                )}
                {filter === "pending" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                )}
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-3 font-medium transition-all relative ${
                  filter === "all" ? "text-purple-600" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
                {filter === "all" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />
                )}
              </button>
            </div>

            {filter === "pending" && pendingCount > 0 && (
              <Button onClick={selectHighConfidence} variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Select High Confidence (≥90%)
              </Button>
            )}
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <Card className="p-4 mb-4 bg-purple-50 border-purple-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-purple-900">
                  {selectedIds.size} request{selectedIds.size !== 1 ? "s" : ""} selected
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleBulkApprove}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Approve All ({selectedIds.size})
                  </Button>
                  <Button onClick={() => setSelectedIds(new Set())} variant="outline" size="sm">
                    Clear Selection
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Approvals List */}
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
          ) : approvals.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up!</h3>
              <p className="text-slate-600">
                {filter === "pending"
                  ? "No pending approvals. Great work!"
                  : "No approval requests to display."}
              </p>
            </Card>
          ) : (
            approvals.map((approval) => {
              const confidence = getConfidence(approval);
              const actionIcon = actionIcons[approval.action] || "📌";
              const actionLabel = actionLabels[approval.action] || approval.action;
              const isSelected = selectedIds.has(approval.id);

              return (
                <Card
                  key={approval.id}
                  className={`group hover:shadow-md transition-all duration-200 border-l-4 ${
                    isSelected ? "ring-2 ring-purple-500 ring-offset-2" : ""
                  }`}
                  style={{
                    borderLeftColor:
                      confidence >= 90
                        ? "rgb(34, 197, 94)"
                        : confidence >= 70
                          ? "rgb(147, 51, 234)"
                          : "rgb(148, 163, 184)",
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      {approval.status === "pending" && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(approval.id)}
                          className="mt-1 h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                      )}

                      {/* Icon */}
                      <div className="text-3xl">{actionIcon}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-slate-900">{actionLabel}</h3>
                              <span className="text-sm text-slate-500">
                                {formatDate(approval.createdAt)}
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">{approval.summary}</p>
                          </div>

                          {/* Confidence Badge */}
                          <Badge
                            variant="outline"
                            className={
                              confidence >= 90
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                                : confidence >= 70
                                  ? "bg-purple-50 text-purple-700 border-purple-200 font-bold"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                            }
                          >
                            {confidence}%
                          </Badge>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-2 mb-4">
                          {approval.status !== "pending" && (
                            <Badge
                              variant="outline"
                              className={
                                approval.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : approval.status === "rejected"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : ""
                              }
                            >
                              {approval.status}
                            </Badge>
                          )}
                          {approval.matterId && <Badge variant="outline">Linked to matter</Badge>}
                        </div>

                        {/* Actions */}
                        {approval.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(approval.id)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => setSelectedApproval(approval)}
                              size="sm"
                              variant="outline"
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Review
                            </Button>
                            <Button
                              onClick={() => handleReject(approval.id)}
                              size="sm"
                              variant="outline"
                              className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                              <XCircle className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Approval Request</DialogTitle>
            <DialogDescription>
              Review the details and decide whether to approve or reject this request.
            </DialogDescription>
          </DialogHeader>

          {selectedApproval && (
            <div className="space-y-4">
              {/* Summary */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Summary</h4>
                <p className="text-slate-900">{selectedApproval.summary}</p>
              </div>

              {/* AI Metadata */}
              {selectedApproval.aiMetadata && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">AI Analysis</h4>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-slate-700">
                        <p>Confidence: {getConfidence(selectedApproval)}%</p>
                        {selectedApproval.aiMetadata.reasoning && (
                          <p className="mt-2">{selectedApproval.aiMetadata.reasoning as string}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Proposed Payload */}
              {selectedApproval.proposedPayload && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Proposed Changes</h4>
                  <pre className="bg-slate-100 p-4 rounded-lg text-xs overflow-auto max-h-64">
                    {JSON.stringify(selectedApproval.proposedPayload, null, 2)}
                  </pre>
                </div>
              )}

              {/* Decision Reason */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                  Decision Note (optional)
                </h4>
                <Textarea
                  value={editedReason}
                  onChange={(e) => setEditedReason(e.target.value)}
                  placeholder="Add a note explaining your decision..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    handleApprove(selectedApproval.id, editedReason);
                    setEditedReason("");
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    handleReject(selectedApproval.id, editedReason);
                    setEditedReason("");
                  }}
                  variant="outline"
                  className="flex-1 gap-2 text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
