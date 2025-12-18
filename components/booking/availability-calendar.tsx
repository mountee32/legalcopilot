"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isPast,
  parseISO,
} from "date-fns";

interface AvailabilityCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  availableDates?: Set<string>; // ISO date strings (YYYY-MM-DD)
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function AvailabilityCalendar({
  selectedDate,
  onDateSelect,
  availableDates = new Set(),
  minDate = new Date(),
  maxDate,
  className,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          className="text-slate-400 hover:text-amber-50 hover:bg-slate-800/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-serif text-amber-50">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="text-slate-400 hover:text-amber-50 hover:bg-slate-800/50"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    );
  };

  const renderDaysOfWeek = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dateStr = format(day, "yyyy-MM-dd");
        const isAvailable = availableDates.has(dateStr);
        const isDisabled =
          !isSameMonth(day, monthStart) ||
          (isPast(day) && !isToday(day)) ||
          (minDate && day < minDate) ||
          (maxDate && day > maxDate) ||
          !isAvailable;
        const isSelected = selectedDate && isSameDay(day, selectedDate);

        days.push(
          <button
            key={day.toString()}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onDateSelect(cloneDay)}
            className={cn(
              "h-10 w-full rounded-md text-sm transition-all",
              "flex items-center justify-center",
              !isSameMonth(day, monthStart) && "text-slate-700",
              isSameMonth(day, monthStart) && !isDisabled && "text-slate-300 hover:bg-slate-800/50",
              isDisabled && "text-slate-700 cursor-not-allowed",
              isAvailable && !isDisabled && "font-medium",
              isToday(day) && "ring-1 ring-amber-600/50",
              isSelected && "bg-amber-600 text-white hover:bg-amber-700",
              !isSelected && isAvailable && !isDisabled && "hover:bg-amber-950/30"
            )}
          >
            {format(day, "d")}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-2">
          {days}
        </div>
      );
      days = [];
    }
    return <div className="space-y-2">{rows}</div>;
  };

  return (
    <div className={cn("p-4", className)}>
      {renderHeader()}
      {renderDaysOfWeek()}
      {renderCells()}
    </div>
  );
}
