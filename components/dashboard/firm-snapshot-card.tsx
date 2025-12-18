"use client";

import { Briefcase, PoundSterling, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FirmSnapshotCardProps {
  activeCases: number;
  wipValue: number;
  collectedMTD: number;
  overdueInvoices: number;
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-GB").format(num);
}

export function FirmSnapshotCard({
  activeCases,
  wipValue,
  collectedMTD,
  overdueInvoices,
  isLoading,
}: FirmSnapshotCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="firm-snapshot-card-loading">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="firm-snapshot-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp className="h-4 w-4 text-primary" />
          Firm Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div data-testid="metric-active-cases">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              Active Cases
            </div>
            <p className="text-xl font-bold">{formatNumber(activeCases)}</p>
          </div>

          <div data-testid="metric-wip-value">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PoundSterling className="h-3.5 w-3.5" />
              WIP
            </div>
            <p className="text-xl font-bold">{formatCurrency(wipValue)}</p>
          </div>

          <div data-testid="metric-collected-mtd">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Collected MTD
            </div>
            <p className="text-xl font-bold">{formatCurrency(collectedMTD)}</p>
          </div>

          <div data-testid="metric-overdue-invoices">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle
                className={cn("h-3.5 w-3.5", overdueInvoices > 0 && "text-destructive")}
              />
              Overdue Invoices
            </div>
            <p className={cn("text-xl font-bold", overdueInvoices > 0 && "text-destructive")}>
              {formatNumber(overdueInvoices)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
