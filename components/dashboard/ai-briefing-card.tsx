"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AIBriefingCardProps {
  taskCount: number;
  emailCount: number;
  meetingCount: number;
  isLoading?: boolean;
}

export function AIBriefingCard({
  taskCount,
  emailCount,
  meetingCount,
  isLoading,
}: AIBriefingCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="ai-briefing-card-loading">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="ai-briefing-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Briefing
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled title="Coming soon">
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh briefing</span>
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Summary of your day:</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li data-testid="briefing-tasks">
            <span className="font-medium">{taskCount}</span> tasks need attention
          </li>
          <li data-testid="briefing-emails">
            <span className="font-medium">{emailCount}</span> emails processed
          </li>
          <li data-testid="briefing-meetings">
            <span className="font-medium">{meetingCount}</span> meetings scheduled
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
