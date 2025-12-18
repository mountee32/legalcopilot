"use client";

import { MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  type UnifiedEvent,
  getCategoryConfig,
  getCalendarEventConfig,
  type DisplayCategory,
} from "./types";
import { formatRelativeTime, formatEventDate, isPastEvent, isTodayEvent } from "./utils";

interface TimelineEventCardProps {
  event: UnifiedEvent;
  side: "left" | "right";
  isCompact?: boolean;
}

export function TimelineEventCard({ event, side, isCompact = false }: TimelineEventCardProps) {
  const isPast = isPastEvent(event.date);
  const isToday = isTodayEvent(event.date);
  const config = getCategoryConfig(event.displayCategory);
  const Icon =
    event.source === "calendar" && event.eventType
      ? getCalendarEventConfig(event.eventType).icon
      : config.icon;

  const cardClasses = `
    p-4 border-2 cursor-pointer transition-all duration-200
    hover:shadow-lg hover:scale-[1.02]
    ${config.bg} ${config.border}
    ${isPast ? "opacity-75" : ""}
    ${isToday ? "ring-2 ring-red-400 ring-offset-2" : ""}
  `;

  const cardContent = (
    <Card
      data-testid="timeline-event-card"
      className={cardClasses}
      tabIndex={0}
      role="button"
      aria-label={`${event.title}, ${event.displayCategory}, ${formatRelativeTime(event.date)}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
              {event.title}
            </h4>
            {event.actorType === "ai" && (
              <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
                AI
              </Badge>
            )}
            {event.actorType === "system" && (
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700">
                System
              </Badge>
            )}
            {event.source === "calendar" && (
              <Badge variant="outline" className="text-xs">
                Scheduled
              </Badge>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-slate-600 line-clamp-2 mb-2">{event.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span>{formatRelativeTime(event.date)}</span>

            {event.source === "calendar" && event.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {event.startTime}
                {event.endTime && ` - ${event.endTime}`}
              </span>
            )}

            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{event.location}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{cardContent}</HoverCardTrigger>
      <HoverCardContent side={side === "left" ? "right" : "left"} className="w-80">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bg} ${config.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900">{event.title}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`text-xs capitalize ${config.bg} ${config.iconColor}`}
                >
                  {event.displayCategory}
                </Badge>
                {event.actorType === "ai" && (
                  <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700">
                    AI Generated
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {event.description && <p className="text-sm text-slate-600">{event.description}</p>}

          <div className="pt-2 border-t border-slate-200 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="text-slate-700">{formatEventDate(event.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={`font-medium ${isPast ? "text-slate-500" : "text-blue-600"}`}>
                {formatRelativeTime(event.date)}
              </span>
            </div>
            {event.source === "calendar" && event.startTime && (
              <div className="flex justify-between">
                <span className="text-slate-500">Time</span>
                <span className="text-slate-700">
                  {event.startTime}
                  {event.endTime && ` - ${event.endTime}`}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex justify-between">
                <span className="text-slate-500">Location</span>
                <span className="text-slate-700 text-right max-w-[180px] truncate">
                  {event.location}
                </span>
              </div>
            )}
            {event.actorType && (
              <div className="flex justify-between">
                <span className="text-slate-500">Actor</span>
                <span className="text-slate-700 capitalize">{event.actorType}</span>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
