"use client";

import { PortalGate } from "@/components/portal/portal-gate";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalNav } from "@/components/portal/portal-nav";
import { MatterCard } from "@/components/portal/matter-card";
import { InvoiceCard } from "@/components/portal/invoice-card";
import { usePortalMatters } from "@/lib/hooks/use-portal-matters";
import { usePortalInvoices } from "@/lib/hooks/use-portal-invoices";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderOpen, Receipt, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function DashboardContent() {
  const { matters, isLoading: mattersLoading, error: mattersError } = usePortalMatters();
  const { invoices, isLoading: invoicesLoading, error: invoicesError } = usePortalInvoices();

  const activeMatters = matters.filter((m) => m.status === "active");
  const upcomingDeadlines = matters
    .filter((m) => m.keyDeadline && new Date(m.keyDeadline) > new Date())
    .sort((a, b) => new Date(a.keyDeadline!).getTime() - new Date(b.keyDeadline!).getTime())
    .slice(0, 3);

  const unpaidInvoices = invoices.filter(
    (i) => i.invoice.status !== "paid" && i.invoice.status !== "void"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <PortalHeader />
      <PortalNav />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your client portal</p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeMatters.length}</div>
              <p className="text-xs text-muted-foreground">{matters.length} total cases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingDeadlines.length}</div>
              <p className="text-xs text-muted-foreground">In the next 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unpaidInvoices.length}</div>
              <p className="text-xs text-muted-foreground">{invoices.length} total invoices</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Cases */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Active Cases</h2>
            <Link href="/portal/matters">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          {mattersError && (
            <Alert variant="destructive">
              <AlertDescription>{mattersError}</AlertDescription>
            </Alert>
          )}

          {mattersLoading && (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          )}

          {!mattersLoading && !mattersError && activeMatters.length === 0 && (
            <EmptyState
              icon={FolderOpen}
              title="No active cases"
              description="You don't have any active cases at the moment."
            />
          )}

          {!mattersLoading && !mattersError && activeMatters.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {activeMatters.slice(0, 4).map((matter) => (
                <MatterCard key={matter.id} matter={matter} />
              ))}
            </div>
          )}
        </div>

        {/* Outstanding Invoices */}
        {unpaidInvoices.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Outstanding Invoices</h2>
              <Link href="/portal/invoices">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {invoicesError && (
              <Alert variant="destructive">
                <AlertDescription>{invoicesError}</AlertDescription>
              </Alert>
            )}

            {invoicesLoading && (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            )}

            {!invoicesLoading && !invoicesError && (
              <div className="grid gap-4 md:grid-cols-2">
                {unpaidInvoices.slice(0, 4).map((invoice) => (
                  <InvoiceCard key={invoice.invoice.id} invoice={invoice} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Deadlines */}
        {upcomingDeadlines.length > 0 && (
          <div>
            <h2 className="mb-4 text-2xl font-semibold">Upcoming Deadlines</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {upcomingDeadlines.map((matter) => (
                    <div
                      key={matter.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{matter.title}</p>
                        <p className="text-sm text-muted-foreground">Ref: {matter.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(matter.keyDeadline!).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.ceil(
                            (new Date(matter.keyDeadline!).getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          days
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalDashboardPage() {
  return (
    <PortalGate>
      <DashboardContent />
    </PortalGate>
  );
}
