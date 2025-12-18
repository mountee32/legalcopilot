"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Clock, Check, X, Edit2, Sparkles, DollarSign, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";

interface TimeEntry {
  id: string;
  matterId: string;
  workDate: string;
  description: string;
  durationMinutes: number;
  hourlyRate: string;
  amount: string;
  status: "draft" | "submitted" | "approved" | "billed" | "written_off";
  source: "manual" | "ai_suggested" | "email_inferred" | "document_activity" | "calendar";
  isBillable: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  status: "draft" | "sent" | "viewed" | "partially_paid" | "paid" | "overdue" | "written_off";
  invoiceDate: string;
  dueDate: string;
  total: string;
  balanceDue: string;
}

async function fetchTimeEntries(): Promise<{ timeEntries: TimeEntry[] }> {
  const res = await fetch("/api/time-entries?status=draft&status=submitted&limit=50", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch time entries");
  return res.json();
}

async function fetchInvoices(): Promise<{ invoices: Invoice[] }> {
  const res = await fetch("/api/invoices?limit=20", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(num);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "draft":
      return "bg-slate-700/20 border-slate-700/30 text-slate-300";
    case "submitted":
      return "bg-blue-900/20 border-blue-900/30 text-blue-100";
    case "approved":
      return "bg-green-900/20 border-green-900/30 text-green-100";
    case "billed":
      return "bg-amber-900/20 border-amber-900/30 text-amber-100";
    case "paid":
      return "bg-emerald-900/20 border-emerald-900/30 text-emerald-100";
    case "overdue":
      return "bg-red-900/20 border-red-900/30 text-red-100";
    default:
      return "bg-slate-700/20 border-slate-700/30 text-slate-300";
  }
}

export default function BillingPage() {
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: timeData, isLoading: timeLoading } = useQuery({
    queryKey: ["time-entries"],
    queryFn: fetchTimeEntries,
    staleTime: 30_000,
  });

  const { data: invoiceData, isLoading: invoiceLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
    staleTime: 60_000,
  });

  const aiSuggestedEntries =
    timeData?.timeEntries.filter((e) => e.source === "ai_suggested" && e.status === "draft") || [];

  const recordedEntries =
    timeData?.timeEntries.filter((e) => e.source === "manual" || e.status !== "draft") || [];

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  const handleApproveSelected = async () => {
    try {
      const res = await fetch("/api/time-entries/bulk/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedEntries) }),
      });
      if (!res.ok) throw new Error("Failed to approve time entries");
      toast({ title: "Success", description: `${selectedEntries.size} time entries approved` });
      setSelectedEntries(new Set());
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    } catch {
      toast({
        title: "Error",
        description: "Failed to approve time entries",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle paper texture */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      <div className="relative p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-serif font-light tracking-tight text-amber-50">
              Time & Billing
            </h1>
            <span className="text-sm font-mono text-amber-600/60 tracking-wider uppercase">
              Track & Invoice
            </span>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-amber-600/40 via-amber-600/10 to-transparent mt-3" />
        </div>

        <Tabs defaultValue="time" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-800/50">
            <TabsTrigger
              value="time"
              className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-50"
            >
              <Clock className="h-4 w-4 mr-2" />
              Time Entries
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time" className="space-y-6">
            {/* AI Suggested Time Entries */}
            {aiSuggestedEntries.length > 0 && (
              <Card className="bg-gradient-to-br from-amber-950/20 to-amber-900/10 border-amber-800/30 backdrop-blur-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      <div>
                        <h3 className="font-serif text-lg text-amber-50">
                          AI Suggested Time Entries
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {selectedEntries.size} of {aiSuggestedEntries.length} selected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedEntries(new Set())}
                        disabled={selectedEntries.size === 0}
                        className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300"
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApproveSelected}
                        disabled={selectedEntries.size === 0}
                        className="bg-amber-900/40 hover:bg-amber-900/60 text-amber-50 border border-amber-800/30"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve Selected ({selectedEntries.size})
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {aiSuggestedEntries.map((entry) => {
                      const isSelected = selectedEntries.has(entry.id);
                      return (
                        <div
                          key={entry.id}
                          onClick={() => toggleSelection(entry.id)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-amber-900/20 border-amber-800/50"
                              : "bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/40"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? "bg-amber-900/50 border-amber-700" : "border-slate-600"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-amber-100" />}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1">
                                  <p className="text-sm text-slate-300 leading-relaxed">
                                    {entry.description}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-serif text-amber-50">
                                    {formatCurrency(entry.amount)}
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono mt-1">
                                    {formatDuration(entry.durationMinutes)} @{" "}
                                    {formatCurrency(entry.hourlyRate)}/hr
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="font-mono">
                                  {format(parseISO(entry.workDate), "d MMM yyyy")}
                                </span>
                                <span>•</span>
                                <span className="font-mono">
                                  Matter ID: {entry.matterId.slice(0, 8)}
                                </span>
                                <span>•</span>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-900/20 border-blue-900/30 text-blue-100 text-xs"
                                >
                                  AI Suggested
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Recorded Time Entries */}
            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg text-amber-50">Recorded Time Entries</h3>
                  <Button
                    size="sm"
                    className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Record Time
                  </Button>
                </div>

                {timeLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 bg-slate-800/30" />
                    ))}
                  </div>
                ) : recordedEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                    <h4 className="text-base font-serif text-slate-300 mb-2">
                      No time entries yet
                    </h4>
                    <p className="text-sm text-slate-500">
                      Start tracking time to see entries here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-mono uppercase tracking-wider text-slate-500 border-b border-slate-800/50">
                      <div className="col-span-2">Date</div>
                      <div className="col-span-4">Description</div>
                      <div className="col-span-2">Duration</div>
                      <div className="col-span-2">Amount</div>
                      <div className="col-span-2">Status</div>
                    </div>

                    {recordedEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-slate-800/30 rounded transition-colors cursor-pointer group"
                      >
                        <div className="col-span-2 text-sm font-mono text-slate-400">
                          {format(parseISO(entry.workDate), "d MMM")}
                        </div>
                        <div className="col-span-4 text-sm text-slate-300 line-clamp-2">
                          {entry.description}
                        </div>
                        <div className="col-span-2 text-sm font-mono text-slate-400">
                          {formatDuration(entry.durationMinutes)}
                        </div>
                        <div className="col-span-2 text-sm font-serif text-amber-100">
                          {formatCurrency(entry.amount)}
                        </div>
                        <div className="col-span-2">
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(entry.status)} text-xs`}
                          >
                            {entry.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {recordedEntries.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-800/50">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-slate-800/20 rounded-lg">
                        <div className="text-2xl font-serif text-amber-50">
                          {formatDuration(
                            recordedEntries.reduce((sum, e) => sum + e.durationMinutes, 0)
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
                          Total Hours
                        </div>
                      </div>
                      <div className="text-center p-4 bg-slate-800/20 rounded-lg">
                        <div className="text-2xl font-serif text-amber-50">
                          {formatCurrency(
                            recordedEntries
                              .filter((e) => e.isBillable)
                              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
                          Billable WIP
                        </div>
                      </div>
                      <div className="text-center p-4 bg-slate-800/20 rounded-lg">
                        <div className="text-2xl font-serif text-amber-50">
                          {formatCurrency(
                            recordedEntries
                              .filter((e) => e.status === "billed")
                              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
                          Billed
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg text-amber-50">Invoices</h3>
                  <Button
                    size="sm"
                    className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </Button>
                </div>

                {invoiceLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 bg-slate-800/30" />
                    ))}
                  </div>
                ) : !invoiceData || invoiceData.invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                    <h4 className="text-base font-serif text-slate-300 mb-2">No invoices yet</h4>
                    <p className="text-sm text-slate-500 mb-6">
                      Generate your first invoice from time entries
                    </p>
                    <Button className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Generate Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoiceData.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-4 bg-slate-800/20 hover:bg-slate-800/40 rounded-lg border border-slate-800/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-mono text-base text-amber-50 group-hover:text-amber-200 transition-colors">
                                {invoice.invoiceNumber}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(invoice.status)} text-xs`}
                              >
                                {invoice.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span className="font-mono">
                                Issued: {format(parseISO(invoice.invoiceDate), "d MMM yyyy")}
                              </span>
                              <span>•</span>
                              <span className="font-mono">
                                Due: {format(parseISO(invoice.dueDate), "d MMM yyyy")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-serif text-amber-50">
                                {formatCurrency(invoice.total)}
                              </div>
                              {invoice.balanceDue !== invoice.total && (
                                <div className="text-xs text-slate-400 mt-1">
                                  Balance: {formatCurrency(invoice.balanceDue)}
                                </div>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-amber-500 transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
