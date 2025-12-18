import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Matter } from "@/lib/hooks/use-portal-matters";

interface MatterCardProps {
  matter: Matter;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  pending: "bg-yellow-500",
  closed: "bg-gray-500",
  on_hold: "bg-orange-500",
};

export function MatterCard({ matter }: MatterCardProps) {
  const statusColor = statusColors[matter.status] || "bg-blue-500";
  const hasDeadline = matter.keyDeadline !== null;

  return (
    <Link href={`/portal/matters/${matter.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{matter.title}</CardTitle>
              <CardDescription className="text-xs">Ref: {matter.reference}</CardDescription>
            </div>
            <Badge variant="secondary" className={`${statusColor} text-white`}>
              {matter.status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {matter.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{matter.description}</p>
            )}

            {matter.practiceArea && (
              <div className="text-sm">
                <span className="font-medium">Practice Area: </span>
                <span className="text-muted-foreground capitalize">
                  {matter.practiceArea.replace("_", " ")}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Opened {format(new Date(matter.openedAt), "dd MMM yyyy")}</span>
              </div>

              {hasDeadline && (
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>Deadline {format(new Date(matter.keyDeadline), "dd MMM yyyy")}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
