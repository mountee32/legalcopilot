"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Calendar, Video, Gavel, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface CalendarEvent {
  id: string;
  title: string;
  eventType: string;
  startAt: string;
  endAt?: string;
  matterId?: string;
  location?: string;
}

interface CalendarTodayCardProps {
  events: CalendarEvent[];
  isLoading?: boolean;
}

const eventIconMap: Record<string, React.ElementType> = {
  meeting: Video,
  deadline: Clock,
  court_hearing: Gavel,
  appointment: Calendar,
};

export function CalendarTodayCard({ events, isLoading }: CalendarTodayCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="calendar-today-card-loading">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-4 w-12" />
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
    <Card data-testid="calendar-today-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Calendar className="h-4 w-4 text-primary" />
          Calendar Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="calendar-today-empty">
            No events scheduled for today
          </p>
        ) : (
          <ul className="space-y-3" data-testid="calendar-today-list">
            {events.map((event) => {
              const Icon = eventIconMap[event.eventType] || Calendar;
              const startTime = format(parseISO(event.startAt), "HH:mm");

              return (
                <li
                  key={event.id}
                  className="flex gap-3"
                  data-testid={`calendar-event-${event.id}`}
                >
                  <span className="text-sm font-medium text-muted-foreground w-12 flex-shrink-0">
                    {startTime}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight truncate">{event.title}</p>
                        {event.location && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}
                        {event.matterId && (
                          <p className="text-xs text-muted-foreground">{event.matterId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="ghost" size="sm" asChild className="ml-auto">
          <Link href="/calendar" data-testid="view-full-calendar-link">
            View Full Calendar
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
