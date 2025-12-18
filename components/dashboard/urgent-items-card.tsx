"use client";

import Link from "next/link";
import { AlertTriangle, Calendar, FileWarning, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface UrgentItem {
  id: string;
  type: "deadline" | "limitation" | "overdue" | "alert";
  title: string;
  description?: string;
  href?: string;
}

interface UrgentItemsCardProps {
  items: UrgentItem[];
  isLoading?: boolean;
}

const iconMap = {
  deadline: Calendar,
  limitation: AlertTriangle,
  overdue: Clock,
  alert: FileWarning,
};

export function UrgentItemsCard({ items, isLoading }: UrgentItemsCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="urgent-items-card-loading">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-4 w-4" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="urgent-items-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Urgent Items
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="urgent-items-empty">
            Nothing urgent right now
          </p>
        ) : (
          <ul className="space-y-3" data-testid="urgent-items-list">
            {items.map((item) => {
              const Icon = iconMap[item.type];
              const content = (
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              );

              return (
                <li key={item.id} data-testid={`urgent-item-${item.id}`}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="block hover:bg-muted/50 -mx-2 px-2 py-1 rounded"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
