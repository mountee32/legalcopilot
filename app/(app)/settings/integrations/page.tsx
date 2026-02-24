"use client";

import { useQuery } from "@tanstack/react-query";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import {
  Mail,
  Calendar,
  DollarSign,
  Calculator,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plug,
  PlugZap,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";

interface EmailAccount {
  id: string;
  provider: "google" | "microsoft";
  emailAddress: string;
  status: "connected" | "revoked" | "error";
  lastSyncAt: string | null;
}

interface CalendarAccount {
  id: string;
  provider: "google" | "microsoft";
  status: "connected" | "revoked" | "error";
  syncDirection: "push" | "pull" | "both";
  lastSyncAt: string | null;
}

interface PaymentAccount {
  id: string;
  provider: "stripe" | "gocardless";
  status: "connected" | "revoked" | "error";
}

interface AccountingConnection {
  id: string;
  provider: "xero" | "quickbooks";
  status: "connected" | "revoked" | "error";
  lastSyncAt: string | null;
}

async function fetchEmailAccounts(): Promise<{ accounts: EmailAccount[] }> {
  const res = await fetch("/api/integrations/email/accounts", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch email accounts");
  return res.json();
}

async function fetchCalendarAccounts(): Promise<{ accounts: CalendarAccount[] }> {
  const res = await fetch("/api/integrations/calendar/accounts", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch calendar accounts");
  return res.json();
}

async function fetchPaymentAccounts(): Promise<{ accounts: PaymentAccount[] }> {
  const res = await fetch("/api/integrations/payments/accounts", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch payment accounts");
  return res.json();
}

async function fetchAccountingConnections(): Promise<{ connections: AccountingConnection[] }> {
  const res = await fetch("/api/integrations/accounting/connections", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch accounting connections");
  return res.json();
}

function getStatusIcon(status: string) {
  switch (status) {
    case "connected":
      return <CheckCircle2 className="h-5 w-5 text-green-400" />;
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-400" />;
    case "revoked":
      return <XCircle className="h-5 w-5 text-slate-400" />;
    default:
      return <AlertCircle className="h-5 w-5 text-slate-400" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "connected":
      return (
        <Badge
          variant="outline"
          className="bg-green-900/20 border-green-900/30 text-green-100 text-xs"
        >
          Connected
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="bg-red-900/20 border-red-900/30 text-red-100 text-xs">
          Error
        </Badge>
      );
    case "revoked":
      return (
        <Badge
          variant="outline"
          className="bg-slate-700/20 border-slate-700/30 text-slate-300 text-xs"
        >
          Disconnected
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-slate-700/20 border-slate-700/30 text-slate-300 text-xs"
        >
          Unknown
        </Badge>
      );
  }
}

function getProviderName(provider: string): string {
  const names: Record<string, string> = {
    google: "Google",
    microsoft: "Microsoft",
    stripe: "Stripe",
    gocardless: "GoCardless",
    xero: "Xero",
    quickbooks: "QuickBooks",
  };
  return names[provider] || provider;
}

export default function IntegrationsSettingsPage() {
  const { toast } = useToast();

  const { data: emailData, isLoading: emailLoading } = useQuery({
    queryKey: ["integrations", "email"],
    queryFn: fetchEmailAccounts,
    staleTime: 60_000,
  });

  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ["integrations", "calendar"],
    queryFn: fetchCalendarAccounts,
    staleTime: 60_000,
  });

  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ["integrations", "payments"],
    queryFn: fetchPaymentAccounts,
    staleTime: 60_000,
  });

  const { data: accountingData, isLoading: accountingLoading } = useQuery({
    queryKey: ["integrations", "accounting"],
    queryFn: fetchAccountingConnections,
    staleTime: 60_000,
  });

  const emailAccounts = emailData?.accounts || [];
  const calendarAccounts = calendarData?.accounts || [];
  const paymentAccounts = paymentData?.accounts || [];
  const accountingConnections = accountingData?.connections || [];

  const isAnyLoading = emailLoading || calendarLoading || paymentLoading || accountingLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle paper texture */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      <div className="relative p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-serif font-light tracking-tight text-amber-50">
              Integrations
            </h1>
            <span className="text-sm font-mono text-amber-600/60 tracking-wider uppercase">
              Connected Services
            </span>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-amber-600/40 via-amber-600/10 to-transparent mt-3" />
        </div>

        <div className="space-y-6">
          {/* Email Integration */}
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-blue-900/20 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-serif text-amber-50 mb-1">Email</h2>
                  <p className="text-sm text-slate-400">
                    Connect your email to enable AI inbox processing and automated responses
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/settings/integrations/email-import-log">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Import Log
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
                  >
                    <Plug className="h-4 w-4 mr-2" />
                    Connect Email
                  </Button>
                </div>
              </div>

              {emailLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 bg-slate-800/30" />
                </div>
              ) : emailAccounts.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-700/50 rounded-lg">
                  <Mail className="h-8 w-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-400">No email accounts connected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {emailAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-4 bg-slate-800/20 rounded-lg border border-slate-800/50 hover:bg-slate-800/40 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(account.status)}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-amber-50">
                                {account.emailAddress}
                              </span>
                              <Badge
                                variant="outline"
                                className="bg-slate-700/20 border-slate-700/30 text-slate-300 text-xs"
                              >
                                {getProviderName(account.provider)}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-400">
                              {account.lastSyncAt ? (
                                <>
                                  Last synced{" "}
                                  {formatDistanceToNow(parseISO(account.lastSyncAt), {
                                    addSuffix: true,
                                  })}
                                </>
                              ) : (
                                "Never synced"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(account.status)}
                          {account.status === "connected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Calendar Integration */}
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-purple-900/20 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-serif text-amber-50 mb-1">Calendar</h2>
                  <p className="text-sm text-slate-400">
                    Sync your calendar for automated scheduling and deadline tracking
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
                >
                  <Plug className="h-4 w-4 mr-2" />
                  Connect Calendar
                </Button>
              </div>

              {calendarLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 bg-slate-800/30" />
                </div>
              ) : calendarAccounts.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-700/50 rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-400">No calendar accounts connected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {calendarAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-4 bg-slate-800/20 rounded-lg border border-slate-800/50 hover:bg-slate-800/40 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(account.status)}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm text-amber-50">
                                {getProviderName(account.provider)} Calendar
                              </span>
                              <Badge
                                variant="outline"
                                className="bg-slate-700/20 border-slate-700/30 text-slate-300 text-xs"
                              >
                                {account.syncDirection}
                              </Badge>
                            </div>
                            <div className="text-xs text-slate-400">
                              {account.lastSyncAt ? (
                                <>
                                  Last synced{" "}
                                  {formatDistanceToNow(parseISO(account.lastSyncAt), {
                                    addSuffix: true,
                                  })}
                                </>
                              ) : (
                                "Never synced"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(account.status)}
                          {account.status === "connected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Payment Providers */}
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-green-900/20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-serif text-amber-50 mb-1">Payments</h2>
                  <p className="text-sm text-slate-400">
                    Connect payment providers to accept online payments from clients
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
                >
                  <Plug className="h-4 w-4 mr-2" />
                  Connect Provider
                </Button>
              </div>

              {paymentLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 bg-slate-800/30" />
                </div>
              ) : paymentAccounts.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-700/50 rounded-lg">
                  <DollarSign className="h-8 w-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-400">No payment providers connected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-4 bg-slate-800/20 rounded-lg border border-slate-800/50 hover:bg-slate-800/40 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(account.status)}
                          <div>
                            <span className="font-mono text-sm text-amber-50">
                              {getProviderName(account.provider)}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(account.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Accounting */}
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-orange-900/20 rounded-lg">
                  <Calculator className="h-6 w-6 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-serif text-amber-50 mb-1">Accounting</h2>
                  <p className="text-sm text-slate-400">
                    Sync with your accounting software for seamless financial management
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-amber-900/30 hover:bg-amber-900/50 text-amber-50 border border-amber-800/30"
                >
                  <Plug className="h-4 w-4 mr-2" />
                  Connect Accounting
                </Button>
              </div>

              {accountingLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 bg-slate-800/30" />
                </div>
              ) : accountingConnections.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-700/50 rounded-lg">
                  <Calculator className="h-8 w-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-400">No accounting software connected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accountingConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="p-4 bg-slate-800/20 rounded-lg border border-slate-800/50 hover:bg-slate-800/40 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(connection.status)}
                          <div>
                            <div className="font-mono text-sm text-amber-50 mb-1">
                              {getProviderName(connection.provider)}
                            </div>
                            <div className="text-xs text-slate-400">
                              {connection.lastSyncAt ? (
                                <>
                                  Last synced{" "}
                                  {formatDistanceToNow(parseISO(connection.lastSyncAt), {
                                    addSuffix: true,
                                  })}
                                </>
                              ) : (
                                "Never synced"
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(connection.status)}
                          {connection.status === "connected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 text-slate-300"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-blue-950/20 to-blue-900/10 border-blue-800/30 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-900/20 rounded-lg">
                  <PlugZap className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-amber-50 mb-2">Integration Health</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    All integrations are monitored for connection health and sync status. If you
                    encounter any connection errors, try disconnecting and reconnecting the service.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
