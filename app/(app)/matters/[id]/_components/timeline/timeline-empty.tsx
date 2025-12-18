"use client";

import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export function TimelineEmpty() {
  return (
    <Card className="p-8">
      <EmptyState
        icon={Clock}
        title="No activity yet"
        description="Events will appear here as work progresses on this matter."
      />
    </Card>
  );
}
