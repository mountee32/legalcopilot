"use client";

import { PortalGate } from "@/components/portal/portal-gate";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalNav } from "@/components/portal/portal-nav";
import { InvoiceCard } from "@/components/portal/invoice-card";
import { usePortalInvoices } from "@/lib/hooks/use-portal-invoices";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Receipt } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function InvoicesContent() {
  const { invoices, isLoading, error } = usePortalInvoices();

  const unpaidInvoices = invoices.filter(
    (i) => i.invoice.status !== "paid" && i.invoice.status !== "void"
  );
  const paidInvoices = invoices.filter((i) => i.invoice.status === "paid");
  const overdueInvoices = invoices.filter(
    (i) =>
      i.invoice.status !== "paid" &&
      i.invoice.status !== "void" &&
      new Date(i.invoice.dueDate) < new Date()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <PortalHeader />
      <PortalNav />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">View and manage your invoices</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        )}

        {!isLoading && !error && invoices.length === 0 && (
          <EmptyState
            icon={Receipt}
            title="No invoices found"
            description="You don't have any invoices at the moment."
          />
        )}

        {!isLoading && !error && invoices.length > 0 && (
          <Tabs defaultValue="unpaid" className="w-full">
            <TabsList>
              <TabsTrigger value="unpaid">Unpaid ({unpaidInvoices.length})</TabsTrigger>
              {overdueInvoices.length > 0 && (
                <TabsTrigger value="overdue">Overdue ({overdueInvoices.length})</TabsTrigger>
              )}
              <TabsTrigger value="paid">Paid ({paidInvoices.length})</TabsTrigger>
              <TabsTrigger value="all">All ({invoices.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="unpaid" className="mt-6">
              {unpaidInvoices.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No unpaid invoices"
                  description="You don't have any outstanding invoices."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {unpaidInvoices.map((invoice) => (
                    <InvoiceCard key={invoice.invoice.id} invoice={invoice} />
                  ))}
                </div>
              )}
            </TabsContent>

            {overdueInvoices.length > 0 && (
              <TabsContent value="overdue" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {overdueInvoices.map((invoice) => (
                    <InvoiceCard key={invoice.invoice.id} invoice={invoice} />
                  ))}
                </div>
              </TabsContent>
            )}

            <TabsContent value="paid" className="mt-6">
              {paidInvoices.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No paid invoices"
                  description="You haven't paid any invoices yet."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {paidInvoices.map((invoice) => (
                    <InvoiceCard key={invoice.invoice.id} invoice={invoice} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {invoices.map((invoice) => (
                  <InvoiceCard key={invoice.invoice.id} invoice={invoice} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default function PortalInvoicesPage() {
  return (
    <PortalGate>
      <InvoicesContent />
    </PortalGate>
  );
}
