"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Mail,
  MailWarning,
  RefreshCw,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Paperclip,
  Route,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";

interface EmailImport {
  id: string;
  fromAddress: string;
  subject: string;
  receivedAt: string;
  matterId: string | null;
  matchMethod: string | null;
  matchConfidence: string | null;
  status: "matched" | "unmatched" | "processing" | "completed" | "failed" | "skipped";
  attachmentCount: number;
  emailId: string | null;
  error: string | null;
  processedAt: string | null;
}

interface Matter {
  id: string;
  reference: string;
  title: string;
}

type FilterTab = "all" | "matched" | "unmatched" | "failed";

async function fetchImports(status?: string): Promise<{ imports: EmailImport[]; total: number }> {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  params.set("limit", "50");

  const res = await fetch(`/api/email-imports?${params}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch email imports");
  return res.json();
}

async function fetchMatters(): Promise<{ matters: Matter[] }> {
  const res = await fetch("/api/matters?status=active&limit=100", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch matters");
  return res.json();
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-green-900/20 border-green-900/30 text-green-100 text-xs"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "matched":
      return (
        <Badge
          variant="outline"
          className="bg-blue-900/20 border-blue-900/30 text-blue-100 text-xs"
        >
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Matched
        </Badge>
      );
    case "unmatched":
      return (
        <Badge
          variant="outline"
          className="bg-amber-900/20 border-amber-900/30 text-amber-100 text-xs"
        >
          <MailWarning className="h-3 w-3 mr-1" />
          Unmatched
        </Badge>
      );
    case "processing":
      return (
        <Badge
          variant="outline"
          className="bg-purple-900/20 border-purple-900/30 text-purple-100 text-xs"
        >
          <Clock className="h-3 w-3 mr-1" />
          Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-900/20 border-red-900/30 text-red-100 text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case "skipped":
      return (
        <Badge
          variant="outline"
          className="bg-slate-700/20 border-slate-700/30 text-slate-300 text-xs"
        >
          Skipped
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-slate-700/20 border-slate-700/30 text-slate-300 text-xs"
        >
          {status}
        </Badge>
      );
  }
}

export default function EmailImportLogPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [selectedImport, setSelectedImport] = useState<EmailImport | null>(null);
  const [selectedMatterId, setSelectedMatterId] = useState<string>("");

  const filterStatus = activeTab === "all" ? undefined : activeTab;

  const { data, isLoading } = useQuery({
    queryKey: ["email-imports", activeTab],
    queryFn: () => fetchImports(filterStatus),
    staleTime: 30_000,
  });

  const { data: mattersData } = useQuery({
    queryKey: ["matters-for-routing"],
    queryFn: fetchMatters,
    staleTime: 60_000,
    enabled: routeDialogOpen,
  });

  const routeMutation = useMutation({
    mutationFn: async ({ importId, matterId }: { importId: string; matterId: string }) => {
      const res = await fetch(`/api/email-imports/${importId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ matterId }),
      });
      if (!res.ok) throw new Error("Failed to route import");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Email routed successfully" });
      queryClient.invalidateQueries({ queryKey: ["email-imports"] });
      setRouteDialogOpen(false);
      setSelectedImport(null);
      setSelectedMatterId("");
    },
    onError: () => {
      toast({ title: "Failed to route email", variant: "destructive" });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (importId: string) => {
      const res = await fetch(`/api/email-imports/${importId}/retry`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to retry import");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Retry queued" });
      queryClient.invalidateQueries({ queryKey: ["email-imports"] });
    },
    onError: () => {
      toast({ title: "Failed to retry", variant: "destructive" });
    },
  });

  const imports = data?.imports || [];
  const matters = mattersData?.matters || [];

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "matched", label: "Matched" },
    { key: "unmatched", label: "Unmatched" },
    { key: "failed", label: "Failed" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      <div className="relative p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/settings/integrations"
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-amber-400 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Integrations
          </Link>
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-serif font-light tracking-tight text-amber-50">
              Email Import Log
            </h1>
            <span className="text-sm font-mono text-amber-600/60 tracking-wider uppercase">
              Ingestion History
            </span>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-amber-600/40 via-amber-600/10 to-transparent mt-3" />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                activeTab === tab.key
                  ? "bg-amber-900/30 text-amber-50 border border-amber-800/30"
                  : "text-slate-400 hover:text-amber-50 hover:bg-slate-800/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Import list */}
        <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-16 bg-slate-800/30" />
              <Skeleton className="h-16 bg-slate-800/30" />
              <Skeleton className="h-16 bg-slate-800/30" />
            </div>
          ) : imports.length === 0 ? (
            <div className="text-center py-16">
              <Mail className="h-10 w-10 mx-auto mb-4 text-slate-600" />
              <p className="text-sm text-slate-400">No email imports found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {imports.map((imp) => (
                <div key={imp.id} className="p-4 hover:bg-slate-800/20 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-amber-50 truncate">
                          {imp.subject}
                        </span>
                        {imp.attachmentCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Paperclip className="h-3 w-3" />
                            {imp.attachmentCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{imp.fromAddress}</span>
                        <span>
                          {formatDistanceToNow(parseISO(imp.receivedAt), { addSuffix: true })}
                        </span>
                        {imp.matchMethod && (
                          <Badge
                            variant="outline"
                            className="bg-slate-700/20 border-slate-700/30 text-slate-300 text-[10px]"
                          >
                            {imp.matchMethod.replace("_", " ")}
                          </Badge>
                        )}
                      </div>
                      {imp.error && (
                        <div className="mt-1 text-xs text-red-400 truncate">{imp.error}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(imp.status)}

                      {imp.status === "unmatched" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-800/30 bg-amber-900/20 hover:bg-amber-900/40 text-amber-50 text-xs"
                          onClick={() => {
                            setSelectedImport(imp);
                            setRouteDialogOpen(true);
                          }}
                        >
                          <Route className="h-3 w-3 mr-1" />
                          Route
                        </Button>
                      )}

                      {imp.status === "failed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300 text-xs"
                          onClick={() => retryMutation.mutate(imp.id)}
                          disabled={retryMutation.isPending}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}

                      {imp.emailId && (
                        <Link href={`/inbox/${imp.emailId}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-amber-50"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Route dialog */}
        <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-amber-50">Route Email to Matter</DialogTitle>
              <DialogDescription className="text-slate-400">
                {selectedImport && (
                  <>
                    <strong>{selectedImport.subject}</strong> from {selectedImport.fromAddress}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <label className="text-sm text-slate-300 mb-2 block">Select matter</label>
              <Select value={selectedMatterId} onValueChange={setSelectedMatterId}>
                <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-amber-50">
                  <SelectValue placeholder="Choose a matter..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {matters.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-slate-200">
                      {m.reference} — {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRouteDialogOpen(false)}
                className="border-slate-700/50 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedImport && selectedMatterId) {
                    routeMutation.mutate({
                      importId: selectedImport.id,
                      matterId: selectedMatterId,
                    });
                  }
                }}
                disabled={!selectedMatterId || routeMutation.isPending}
                className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
              >
                {routeMutation.isPending ? "Routing..." : "Route Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
