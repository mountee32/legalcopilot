"use client";

import {
  CheckSquare,
  Calendar,
  Bell,
  AlertTriangle,
  Eye,
  Sparkles,
  Edit,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PipelineAction {
  id: string;
  actionType: string;
  title: string;
  description: string | null;
  priority: number;
  status: string;
  isDeterministic: string;
}

interface ActionCardProps {
  action: PipelineAction;
  onResolve?: (actionId: string, status: "accepted" | "dismissed") => void;
  isResolving?: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  create_task: <CheckSquare className="h-4 w-4 text-blue-500" />,
  create_deadline: <Calendar className="h-4 w-4 text-red-500" />,
  update_field: <Edit className="h-4 w-4 text-purple-500" />,
  send_notification: <Bell className="h-4 w-4 text-amber-500" />,
  flag_risk: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  request_review: <Eye className="h-4 w-4 text-blue-500" />,
  ai_recommendation: <Sparkles className="h-4 w-4 text-violet-500" />,
};

const PRIORITY_LABELS: Record<number, { label: string; className: string }> = {
  0: { label: "Urgent", className: "bg-red-100 text-red-700" },
  1: { label: "High", className: "bg-orange-100 text-orange-700" },
  2: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
};

export function ActionCard({ action, onResolve, isResolving }: ActionCardProps) {
  const icon = TYPE_ICONS[action.actionType] || TYPE_ICONS.ai_recommendation;
  const priority = PRIORITY_LABELS[action.priority];
  const isResolved = action.status !== "pending";

  return (
    <Card className={`p-3 ${isResolved ? "opacity-60 bg-slate-50" : "bg-white"}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800 truncate">{action.title}</span>
            {priority && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 border-0 ${priority.className}`}
              >
                {priority.label}
              </Badge>
            )}
            {action.isDeterministic === "true" && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-500 border-0"
              >
                Rule
              </Badge>
            )}
          </div>
          {action.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{action.description}</p>
          )}

          {action.status === "pending" && onResolve && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => onResolve(action.id, "accepted")}
                disabled={isResolving}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-slate-500 border-slate-300 hover:bg-slate-50"
                onClick={() => onResolve(action.id, "dismissed")}
                disabled={isResolving}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Dismiss
              </Button>
            </div>
          )}

          {isResolved && (
            <Badge
              variant="outline"
              className={`text-[10px] mt-1 ${
                action.status === "accepted"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : action.status === "dismissed"
                    ? "bg-slate-50 text-slate-500 border-slate-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {action.status}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

interface ActionsPanelProps {
  actions: PipelineAction[];
  onResolve?: (actionId: string, status: "accepted" | "dismissed") => void;
  isResolving?: boolean;
}

export function ActionsPanel({ actions, onResolve, isResolving }: ActionsPanelProps) {
  if (actions.length === 0) {
    return <Card className="p-6 text-center text-sm text-slate-400">No actions generated</Card>;
  }

  const pendingActions = actions.filter((a) => a.status === "pending");
  const resolvedActions = actions.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Actions ({actions.length})</h3>

      {pendingActions.length > 0 && (
        <div className="space-y-2">
          {pendingActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onResolve={onResolve}
              isResolving={isResolving}
            />
          ))}
        </div>
      )}

      {resolvedActions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs text-slate-400 uppercase tracking-wide">Resolved</h4>
          {resolvedActions.map((action) => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}
