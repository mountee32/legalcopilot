import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateGap,
  getDaysBetween,
  formatRelativeTime,
  formatEventDate,
  formatEventTime,
  formatMonthHeader,
  getMonthKey,
  isPastEvent,
  isFutureEvent,
  isTodayEvent,
  BASE_PIXELS_PER_DAY,
  MIN_GAP,
  MAX_GAP,
  GAP_INDICATOR_THRESHOLD,
} from "@/app/(app)/matters/[id]/_components/timeline/utils";

describe("Timeline Utils", () => {
  describe("constants", () => {
    it("has expected constant values", () => {
      expect(BASE_PIXELS_PER_DAY).toBe(12);
      expect(MIN_GAP).toBe(24);
      expect(MAX_GAP).toBe(120);
      expect(GAP_INDICATOR_THRESHOLD).toBe(7);
    });
  });

  describe("calculateGap", () => {
    it("returns MIN_GAP for 0 days (same day events)", () => {
      const result = calculateGap(0);
      expect(result.gap).toBe(24);
      expect(result.showIndicator).toBe(false);
      expect(result.daysBetween).toBe(0);
    });

    it("returns MIN_GAP for 1 day (less than MIN_GAP when calculated)", () => {
      const result = calculateGap(1);
      expect(result.gap).toBe(24); // 1 * 12 = 12, but MIN is 24
      expect(result.showIndicator).toBe(false);
    });

    it("returns calculated gap for 3 days", () => {
      const result = calculateGap(3);
      expect(result.gap).toBe(36); // 3 * 12 = 36
      expect(result.showIndicator).toBe(false);
    });

    it("returns calculated gap for 7 days", () => {
      const result = calculateGap(7);
      expect(result.gap).toBe(84); // 7 * 12 = 84
      expect(result.showIndicator).toBe(false);
    });

    it("caps at MAX_GAP for 10 days", () => {
      const result = calculateGap(10);
      expect(result.gap).toBe(120); // 10 * 12 = 120 = MAX
      expect(result.showIndicator).toBe(false); // 10 > 7 but rawGap === MAX (not > MAX)
    });

    it("caps at MAX_GAP for 30 days and shows indicator", () => {
      const result = calculateGap(30);
      expect(result.gap).toBe(120); // capped at MAX
      expect(result.showIndicator).toBe(true);
      expect(result.daysBetween).toBe(30);
    });

    it("does not show indicator for gaps <= 7 days", () => {
      expect(calculateGap(5).showIndicator).toBe(false);
      expect(calculateGap(7).showIndicator).toBe(false);
    });

    it("shows indicator for gaps > 7 days that exceed MAX_GAP", () => {
      expect(calculateGap(8).showIndicator).toBe(false); // 8 * 12 = 96, not > MAX
      expect(calculateGap(14).showIndicator).toBe(true); // 14 * 12 = 168 > MAX
    });
  });

  describe("getDaysBetween", () => {
    it("returns 0 for same day", () => {
      const date = new Date("2025-12-18T10:00:00Z");
      expect(getDaysBetween(date, date)).toBe(0);
    });

    it("returns 0 for different times on same day", () => {
      const date1 = new Date("2025-12-18T08:00:00Z");
      const date2 = new Date("2025-12-18T20:00:00Z");
      expect(getDaysBetween(date1, date2)).toBe(0);
    });

    it("returns 1 for adjacent days", () => {
      const date1 = new Date("2025-12-17T10:00:00Z");
      const date2 = new Date("2025-12-18T10:00:00Z");
      expect(getDaysBetween(date1, date2)).toBe(1);
    });

    it("returns absolute value regardless of order", () => {
      const date1 = new Date("2025-12-10T10:00:00Z");
      const date2 = new Date("2025-12-18T10:00:00Z");
      expect(getDaysBetween(date1, date2)).toBe(8);
      expect(getDaysBetween(date2, date1)).toBe(8);
    });
  });

  describe("formatRelativeTime", () => {
    const fixedNow = new Date("2025-12-18T12:00:00Z");

    // date-fns isToday/isYesterday/isTomorrow compare against Date.now(),
    // so we must use fake timers to control the current time
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(fixedNow);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('formats "Today" for same day', () => {
      const today = new Date("2025-12-18T08:00:00Z");
      expect(formatRelativeTime(today, fixedNow)).toBe("Today");
    });

    it('formats "Yesterday" for 1 day ago', () => {
      const yesterday = new Date("2025-12-17T12:00:00Z");
      expect(formatRelativeTime(yesterday, fixedNow)).toBe("Yesterday");
    });

    it('formats "Tomorrow" for 1 day ahead', () => {
      const tomorrow = new Date("2025-12-19T12:00:00Z");
      expect(formatRelativeTime(tomorrow, fixedNow)).toBe("Tomorrow");
    });

    it('formats "X days ago" for past dates', () => {
      const threeDaysAgo = new Date("2025-12-15T12:00:00Z");
      expect(formatRelativeTime(threeDaysAgo, fixedNow)).toBe("3 days ago");

      const fiveDaysAgo = new Date("2025-12-13T12:00:00Z");
      expect(formatRelativeTime(fiveDaysAgo, fixedNow)).toBe("5 days ago");
    });

    it('formats "In X days" for future dates', () => {
      const inFiveDays = new Date("2025-12-23T12:00:00Z");
      expect(formatRelativeTime(inFiveDays, fixedNow)).toBe("In 5 days");

      const inTenDays = new Date("2025-12-28T12:00:00Z");
      expect(formatRelativeTime(inTenDays, fixedNow)).toBe("In 10 days");
    });

    it('formats "1 day ago" for singular past', () => {
      // Edge case: 2 days ago should be "2 days ago", not "1 day ago"
      const twoDaysAgo = new Date("2025-12-16T12:00:00Z");
      expect(formatRelativeTime(twoDaysAgo, fixedNow)).toBe("2 days ago");
    });
  });

  describe("formatEventDate", () => {
    it("formats date correctly", () => {
      const date = new Date("2025-12-18T10:00:00Z");
      expect(formatEventDate(date)).toBe("18 Dec 2025");
    });

    it("formats different months correctly", () => {
      const date = new Date("2025-01-05T10:00:00Z");
      expect(formatEventDate(date)).toBe("5 Jan 2025");
    });
  });

  describe("formatEventTime", () => {
    it("formats time correctly", () => {
      const date = new Date("2025-12-18T14:30:00Z");
      expect(formatEventTime(date)).toBe("14:30");
    });

    it("formats morning time correctly", () => {
      const date = new Date("2025-12-18T09:05:00Z");
      expect(formatEventTime(date)).toBe("09:05");
    });
  });

  describe("formatMonthHeader", () => {
    it("formats month and year correctly", () => {
      const date = new Date("2025-12-18T10:00:00Z");
      expect(formatMonthHeader(date)).toBe("December 2025");
    });

    it("formats different months correctly", () => {
      const date = new Date("2025-01-01T10:00:00Z");
      expect(formatMonthHeader(date)).toBe("January 2025");
    });
  });

  describe("getMonthKey", () => {
    it("returns year-month format", () => {
      const date = new Date("2025-12-18T10:00:00Z");
      expect(getMonthKey(date)).toBe("2025-12");
    });

    it("pads single digit months", () => {
      const date = new Date("2025-01-05T10:00:00Z");
      expect(getMonthKey(date)).toBe("2025-01");
    });
  });

  describe("isPastEvent", () => {
    const fixedNow = new Date("2025-12-18T12:00:00Z");

    it("returns true for past dates", () => {
      const pastDate = new Date("2025-12-17T10:00:00Z");
      expect(isPastEvent(pastDate, fixedNow)).toBe(true);
    });

    it("returns false for today", () => {
      const today = new Date("2025-12-18T08:00:00Z");
      expect(isPastEvent(today, fixedNow)).toBe(false);
    });

    it("returns false for future dates", () => {
      const futureDate = new Date("2025-12-19T10:00:00Z");
      expect(isPastEvent(futureDate, fixedNow)).toBe(false);
    });
  });

  describe("isFutureEvent", () => {
    const fixedNow = new Date("2025-12-18T12:00:00Z");

    it("returns true for future dates", () => {
      const futureDate = new Date("2025-12-19T10:00:00Z");
      expect(isFutureEvent(futureDate, fixedNow)).toBe(true);
    });

    it("returns false for today", () => {
      const today = new Date("2025-12-18T08:00:00Z");
      expect(isFutureEvent(today, fixedNow)).toBe(false);
    });

    it("returns false for past dates", () => {
      const pastDate = new Date("2025-12-17T10:00:00Z");
      expect(isFutureEvent(pastDate, fixedNow)).toBe(false);
    });
  });

  describe("isTodayEvent", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-12-18T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns true for today", () => {
      const today = new Date("2025-12-18T08:00:00Z");
      expect(isTodayEvent(today)).toBe(true);
    });

    it("returns false for yesterday", () => {
      const yesterday = new Date("2025-12-17T08:00:00Z");
      expect(isTodayEvent(yesterday)).toBe(false);
    });

    it("returns false for tomorrow", () => {
      const tomorrow = new Date("2025-12-19T08:00:00Z");
      expect(isTodayEvent(tomorrow)).toBe(false);
    });
  });
});
