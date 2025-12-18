"use client";

import { format, parseISO } from "date-fns";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimeSlot {
  startAt: string;
  endAt: string;
  appointmentTypeId: string;
  assignedTo: string | null;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function TimeSlotPicker({
  slots,
  selectedSlot,
  onSlotSelect,
  isLoading = false,
  emptyMessage = "No available time slots for this date",
  className,
}: TimeSlotPickerProps) {
  // Group slots by time periods
  const morningSlots = slots.filter((slot) => {
    const hour = parseISO(slot.startAt).getHours();
    return hour < 12;
  });

  const afternoonSlots = slots.filter((slot) => {
    const hour = parseISO(slot.startAt).getHours();
    return hour >= 12 && hour < 17;
  });

  const eveningSlots = slots.filter((slot) => {
    const hour = parseISO(slot.startAt).getHours();
    return hour >= 17;
  });

  const renderSlotGroup = (title: string, groupSlots: TimeSlot[]) => {
    if (groupSlots.length === 0) return null;

    return (
      <div className="mb-6 last:mb-0">
        <h4 className="text-sm font-medium text-slate-400 mb-3">{title}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {groupSlots.map((slot) => {
            const startTime = format(parseISO(slot.startAt), "HH:mm");
            const isSelected = selectedSlot && selectedSlot.startAt === slot.startAt;

            return (
              <Button
                key={slot.startAt}
                type="button"
                variant={isSelected ? "default" : "outline"}
                onClick={() => onSlotSelect(slot)}
                className={cn(
                  "justify-center",
                  isSelected
                    ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600"
                    : "bg-slate-900/40 border-slate-800/50 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700/50"
                )}
              >
                <Clock className="h-4 w-4 mr-2" />
                {startTime}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={cn("p-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className={cn("p-6", className)}>
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto mb-4 text-slate-600" />
          <p className="text-sm text-slate-400">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-[400px]", className)}>
      <div className="p-6">
        {renderSlotGroup("Morning", morningSlots)}
        {renderSlotGroup("Afternoon", afternoonSlots)}
        {renderSlotGroup("Evening", eveningSlots)}
      </div>
    </ScrollArea>
  );
}
