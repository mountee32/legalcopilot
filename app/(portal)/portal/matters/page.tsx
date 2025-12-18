"use client";

import { PortalGate } from "@/components/portal/portal-gate";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalNav } from "@/components/portal/portal-nav";
import { MatterCard } from "@/components/portal/matter-card";
import { usePortalMatters } from "@/lib/hooks/use-portal-matters";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { FolderOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function MattersContent() {
  const { matters, isLoading, error } = usePortalMatters();

  const activeMatters = matters.filter((m) => m.status === "active");
  const closedMatters = matters.filter((m) => m.status === "closed");
  const otherMatters = matters.filter((m) => m.status !== "active" && m.status !== "closed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <PortalHeader />
      <PortalNav />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Cases</h1>
          <p className="text-muted-foreground">View and manage your legal matters</p>
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

        {!isLoading && !error && matters.length === 0 && (
          <EmptyState
            icon={FolderOpen}
            title="No cases found"
            description="You don't have any cases at the moment."
          />
        )}

        {!isLoading && !error && matters.length > 0 && (
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active ({activeMatters.length})</TabsTrigger>
              <TabsTrigger value="other">Other ({otherMatters.length})</TabsTrigger>
              <TabsTrigger value="closed">Closed ({closedMatters.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeMatters.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No active cases"
                  description="You don't have any active cases at the moment."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeMatters.map((matter) => (
                    <MatterCard key={matter.id} matter={matter} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="other" className="mt-6">
              {otherMatters.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No other cases"
                  description="You don't have any pending or on-hold cases."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {otherMatters.map((matter) => (
                    <MatterCard key={matter.id} matter={matter} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="closed" className="mt-6">
              {closedMatters.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No closed cases"
                  description="You don't have any closed cases."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {closedMatters.map((matter) => (
                    <MatterCard key={matter.id} matter={matter} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default function PortalMattersPage() {
  return (
    <PortalGate>
      <MattersContent />
    </PortalGate>
  );
}
