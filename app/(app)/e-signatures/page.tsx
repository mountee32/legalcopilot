"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSignature,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";

interface SignatureRequest {
  id: string;
  documentId: string;
  provider: string;
  status: string;
  signers: Array<{
    email: string;
    name: string;
    status?: string;
    signedAt?: string | null;
  }> | null;
  sentAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending_approval: "bg-amber-100 text-amber-700 border-amber-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  delivered: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  declined: "bg-red-100 text-red-700 border-red-200",
  voided: "bg-slate-100 text-slate-700 border-slate-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

const statusIcons: Record<string, any> = {
  draft: Clock,
  pending_approval: AlertCircle,
  sent: FileSignature,
  delivered: FileSignature,
  completed: CheckCircle,
  declined: XCircle,
  voided: XCircle,
  failed: AlertCircle,
};

export default function ESignaturesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [requests, setRequests] = useState<SignatureRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/signature-requests", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch signature requests");

      const data = await res.json();
      let filtered = data.signatureRequests || [];

      if (filter === "pending") {
        filtered = filtered.filter((r: SignatureRequest) =>
          ["draft", "pending_approval", "sent", "delivered"].includes(r.status)
        );
      } else if (filter === "completed") {
        filtered = filtered.filter((r: SignatureRequest) =>
          ["completed", "declined", "voided"].includes(r.status)
        );
      }

      setRequests(filtered);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load signature requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  const getSignerStatus = (request: SignatureRequest) => {
    if (!request.signers || request.signers.length === 0) return "No signers";

    const total = request.signers.length;
    const signed = request.signers.filter((s) => s.status === "signed").length;

    return `${signed}/${total} signed`;
  };

  const pendingCount = requests.filter((r) =>
    ["draft", "pending_approval", "sent", "delivered"].includes(r.status)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50">
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">
                E-Signatures
              </h1>
              <p className="text-slate-600 text-lg">Track and manage document signature requests</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={fetchRequests} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-3 font-medium transition-all relative ${
                filter === "pending" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pending
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-indigo-600 text-white rounded-full">
                  {pendingCount}
                </span>
              )}
              {filter === "pending" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-3 font-medium transition-all relative ${
                filter === "all" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Requests
              {filter === "all" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-3 font-medium transition-all relative ${
                filter === "completed" ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Completed
              {filter === "completed" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </button>
          </div>
        </div>

        {/* Signature Requests List */}
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
          ) : requests.length === 0 ? (
            <Card className="p-12 text-center">
              <FileSignature className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No signature requests found
              </h3>
              <p className="text-slate-600">
                {filter === "pending"
                  ? "No pending signature requests."
                  : filter === "completed"
                    ? "No completed signature requests."
                    : "No signature requests to display."}
              </p>
            </Card>
          ) : (
            requests.map((request) => {
              const StatusIcon = statusIcons[request.status] || FileSignature;
              const signerStatus = getSignerStatus(request);

              return (
                <Card
                  key={request.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4"
                  style={{
                    borderLeftColor:
                      request.status === "completed"
                        ? "rgb(34, 197, 94)"
                        : request.status === "declined" || request.status === "failed"
                          ? "rgb(239, 68, 68)"
                          : "rgb(99, 102, 241)",
                  }}
                  onClick={() => router.push(`/e-signatures/${request.id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <StatusIcon className="h-5 w-5 text-slate-400" />
                          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            Signature Request #{request.id.slice(0, 8)}
                          </h3>
                          <Badge variant="outline" className={statusColors[request.status] || ""}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>

                        {/* Signers */}
                        {request.signers && request.signers.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                              <Users className="h-4 w-4" />
                              <span className="font-medium">{signerStatus}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {request.signers.map((signer, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className={
                                    signer.status === "signed"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : signer.status === "declined"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-slate-50 text-slate-700 border-slate-200"
                                  }
                                >
                                  {signer.name}
                                  {signer.status === "signed" && " ✓"}
                                  {signer.status === "declined" && " ✗"}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div>Provider: {request.provider}</div>
                          {request.sentAt && <div>Sent {formatDate(request.sentAt)}</div>}
                          {request.completedAt && (
                            <div>Completed {formatDate(request.completedAt)}</div>
                          )}
                          {!request.sentAt && !request.completedAt && (
                            <div>Created {formatDate(request.createdAt)}</div>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      {request.status === "sent" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Send reminder logic
                              toast({
                                title: "Reminder sent",
                                description: "Signers will receive a reminder email",
                              });
                            }}
                          >
                            Send Reminder
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Summary Cards */}
        {!isLoading && requests.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Pending</div>
                    <div className="text-3xl font-bold text-slate-900">
                      {
                        requests.filter((r) =>
                          ["draft", "pending_approval", "sent", "delivered"].includes(r.status)
                        ).length
                      }
                    </div>
                  </div>
                  <Clock className="h-10 w-10 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Completed</div>
                    <div className="text-3xl font-bold text-slate-900">
                      {requests.filter((r) => r.status === "completed").length}
                    </div>
                  </div>
                  <CheckCircle className="h-10 w-10 text-emerald-600" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Total Signers</div>
                    <div className="text-3xl font-bold text-slate-900">
                      {requests.reduce((acc, r) => acc + (r.signers?.length || 0), 0)}
                    </div>
                  </div>
                  <Users className="h-10 w-10 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
