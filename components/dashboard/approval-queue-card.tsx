"use client";

import Link from "next/link";
import { CheckCircle, XCircle, Mail, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface ApprovalItem {
  id: string;
  action: string;
  summary: string;
  confidence?: number;
  entityType?: string;
  matterId?: string;
}

interface ApprovalQueueCardProps {
  approvals: ApprovalItem[];
  total: number;
  isLoading?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const actionIconMap: Record<string, React.ElementType> = {
  send_email: Mail,
  time_entry: Clock,
  stage_change: ArrowRight,
};

function getConfidenceVariant(confidence: number): "success" | "warning" | "destructive" {
  if (confidence >= 90) return "success";
  if (confidence >= 70) return "warning";
  return "destructive";
}

export function ApprovalQueueCard({
  approvals,
  total,
  isLoading,
  onApprove,
  onReject,
}: ApprovalQueueCardProps) {
  const highConfidenceCount = approvals.filter((a) => (a.confidence ?? 0) >= 90).length;

  if (isLoading) {
    return (
      <Card data-testid="approval-queue-card-loading">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-full max-w-[200px]" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="approval-queue-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          Approval Queue
          {total > 0 && (
            <Badge variant="secondary" className="ml-1">
              {total}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {approvals.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="approval-queue-empty">
            No pending approvals
          </p>
        ) : (
          <ul className="space-y-3" data-testid="approval-queue-list">
            {approvals.map((approval) => {
              const Icon = actionIconMap[approval.action] || Sparkles;
              const confidence = approval.confidence ?? 0;

              return (
                <li
                  key={approval.id}
                  className="flex items-start justify-between gap-4"
                  data-testid={`approval-item-${approval.id}`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-sm leading-tight truncate">{approval.summary}</p>
                      {approval.matterId && (
                        <p className="text-xs text-muted-foreground">{approval.matterId}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant={getConfidenceVariant(confidence)}
                      className="text-xs"
                      data-testid={`confidence-badge-${approval.id}`}
                    >
                      {confidence}%
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-7 w-7",
                          confidence >= 90 && "text-green-600 hover:text-green-700"
                        )}
                        onClick={() => onApprove?.(approval.id)}
                        data-testid={`approve-btn-${approval.id}`}
                        aria-label={`Approve ${approval.summary}`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onReject?.(approval.id)}
                        data-testid={`reject-btn-${approval.id}`}
                        aria-label={`Reject ${approval.summary}`}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      {approvals.length > 0 && (
        <CardFooter className="flex justify-between pt-0">
          {highConfidenceCount > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/inbox?confidence=high" data-testid="approve-high-confidence-link">
                Approve High Confidence ({highConfidenceCount})
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <Link href="/inbox" data-testid="view-all-approvals-link">
              View All
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
