import { differenceInDays, isToday, isYesterday, isTomorrow, format, startOfDay } from "date-fns";

// Spacing constants
export const BASE_PIXELS_PER_DAY = 12;
export const MIN_GAP = 24;
export const MAX_GAP = 120;
export const GAP_INDICATOR_THRESHOLD = 7;
export const COMPACT_GAP = 16;

export interface GapResult {
  gap: number;
  showIndicator: boolean;
  daysBetween: number;
}

export function calculateGap(daysBetween: number): GapResult {
  const rawGap = daysBetween * BASE_PIXELS_PER_DAY;
  const gap = Math.max(MIN_GAP, Math.min(rawGap, MAX_GAP));
  const showIndicator = daysBetween > GAP_INDICATOR_THRESHOLD && rawGap > MAX_GAP;
  return { gap, showIndicator, daysBetween };
}

export function getDaysBetween(date1: Date, date2: Date): number {
  return Math.abs(differenceInDays(startOfDay(date1), startOfDay(date2)));
}

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  if (isToday(date)) {
    return "Today";
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  if (isTomorrow(date)) {
    return "Tomorrow";
  }

  const days = differenceInDays(startOfDay(date), startOfDay(now));

  if (days < 0) {
    const absDays = Math.abs(days);
    if (absDays === 1) {
      return "1 day ago";
    }
    return `${absDays} days ago`;
  }

  if (days === 1) {
    return "In 1 day";
  }
  return `In ${days} days`;
}

export function formatEventDate(date: Date): string {
  return format(date, "d MMM yyyy");
}

export function formatEventTime(date: Date): string {
  return format(date, "HH:mm");
}

export function formatMonthHeader(date: Date): string {
  return format(date, "MMMM yyyy");
}

export function getMonthKey(date: Date): string {
  return format(date, "yyyy-MM");
}

export function isPastEvent(date: Date, now: Date = new Date()): boolean {
  return startOfDay(date) < startOfDay(now);
}

export function isFutureEvent(date: Date, now: Date = new Date()): boolean {
  return startOfDay(date) > startOfDay(now);
}

export function isTodayEvent(date: Date): boolean {
  return isToday(date);
}
