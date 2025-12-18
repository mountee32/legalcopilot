"use client";

import { use } from "react";
import { PortalGate } from "@/components/portal/portal-gate";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalNav } from "@/components/portal/portal-nav";
import { usePortalMatter } from "@/lib/hooks/use-portal-matters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, User, Briefcase, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface MatterDetailContentProps {
  matterId: string;
}

function MatterDetailContent({ matterId }: MatterDetailContentProps) {
  const { matter, isLoading, error } = usePortalMatter(matterId);

  const statusColors: Record<string, string> = {
    active: "bg-green-500",
    pending: "bg-yellow-500",
    closed: "bg-gray-500",
    on_hold: "bg-orange-500",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <PortalHeader />
        <PortalNav />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="mb-4 h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <PortalHeader />
        <PortalNav />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <PortalHeader />
        <PortalNav />
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertDescription>Matter not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const statusColor = statusColors[matter.status] || "bg-blue-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <PortalHeader />
      <PortalNav />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold">{matter.title}</h1>
            <Badge variant="secondary" className={`${statusColor} text-white`}>
              {matter.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-muted-foreground">Reference: {matter.reference}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Details */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Case Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {matter.description && (
                  <div>
                    <h3 className="mb-2 font-semibold">Description</h3>
                    <p className="text-muted-foreground">{matter.description}</p>
                  </div>
                )}

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  {matter.practiceArea && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Practice Area</p>
                        <p className="font-medium capitalize">
                          {matter.practiceArea.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {matter.billingType && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Billing Type</p>
                        <p className="font-medium capitalize">
                          {matter.billingType.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Opened</p>
                      <p className="font-medium">
                        {format(new Date(matter.openedAt), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>

                  {matter.closedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Closed</p>
                        <p className="font-medium">
                          {format(new Date(matter.closedAt), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {matter.keyDeadline && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 rounded-md bg-orange-50 p-4 dark:bg-orange-900/20">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <div>
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                          Key Deadline
                        </p>
                        <p className="text-orange-700 dark:text-orange-300">
                          {format(new Date(matter.keyDeadline), "EEEE, dd MMMM yyyy")}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Fee Earner */}
            {matter.feeEarner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Fee Earner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{matter.feeEarner.name}</p>
                      <p className="text-sm text-muted-foreground">{matter.feeEarner.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {format(new Date(matter.createdAt), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {format(new Date(matter.updatedAt), "dd MMM yyyy, HH:mm")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PortalMatterDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);

  return (
    <PortalGate>
      <MatterDetailContent matterId={resolvedParams.id} />
    </PortalGate>
  );
}
