import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, gte, lte } from "drizzle-orm";
import { appointmentTypes, availabilityRules, bookings, firms } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { withRateLimit, RateLimitPresets } from "@/middleware/withRateLimit";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { AvailabilityQuerySchema } from "@/lib/api/schemas/booking";

/**
 * GET /api/public/booking/firms/[firmSlug]/availability
 * Public endpoint to get available time slots for a firm
 */
export const GET = withErrorHandler(
  withRateLimit(
    async (
      request: NextRequest,
      context?: { params?: Record<string, string> | Promise<Record<string, string>> }
    ) => {
      const params = context?.params ? await Promise.resolve(context.params) : {};
      const firmSlug = params?.firmSlug;

      if (!firmSlug) {
        return NextResponse.json({ error: "Firm identifier required" }, { status: 400 });
      }

      const url = new URL(request.url);
      const query = AvailabilityQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      // Validate that firm exists
      const [firm] = await db.select().from(firms).where(eq(firms.id, firmSlug)).limit(1);

      if (!firm) {
        return NextResponse.json({ error: "Firm not found" }, { status: 404 });
      }

      // Validate appointment type belongs to this firm
      const [appointmentType] = await db
        .select()
        .from(appointmentTypes)
        .where(
          and(
            eq(appointmentTypes.id, query.appointmentTypeId),
            eq(appointmentTypes.firmId, firmSlug),
            eq(appointmentTypes.isActive, true)
          )
        )
        .limit(1);

      if (!appointmentType) {
        return NextResponse.json({ error: "Appointment type not found" }, { status: 404 });
      }

      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);

      // Get availability rules for this firm
      const rules = await db
        .select()
        .from(availabilityRules)
        .where(
          and(
            eq(availabilityRules.firmId, firmSlug),
            query.userId ? eq(availabilityRules.userId, query.userId) : undefined,
            or(
              // Recurring rules (no specific date)
              eq(availabilityRules.specificDate, null),
              // Specific date overrides within range
              and(
                gte(availabilityRules.specificDate, startDate),
                lte(availabilityRules.specificDate, endDate)
              )
            )
          )
        );

      // Get existing bookings to exclude booked slots
      const existingBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.firmId, firmSlug),
            eq(bookings.appointmentTypeId, query.appointmentTypeId),
            or(eq(bookings.status, "pending"), eq(bookings.status, "confirmed")),
            gte(bookings.startAt, startDate),
            lte(bookings.startAt, endDate),
            query.userId ? eq(bookings.assignedTo, query.userId) : undefined
          )
        );

      // Calculate available slots
      const slots = calculateAvailableSlots(
        startDate,
        endDate,
        appointmentType,
        rules,
        existingBookings
      );

      return NextResponse.json({ slots });
    },
    RateLimitPresets.public
  )
);

/**
 * Calculate available time slots based on availability rules and existing bookings
 */
function calculateAvailableSlots(
  startDate: Date,
  endDate: Date,
  appointmentType: any,
  rules: any[],
  existingBookings: any[]
): any[] {
  const slots: any[] = [];
  const slotDuration = appointmentType.duration + appointmentType.bufferAfter;

  // Iterate through each day in the range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split("T")[0];

    // Check for specific date rules first (they override recurring rules)
    const specificRule = rules.find((r) => {
      if (!r.specificDate) return false;
      const ruleDate = new Date(r.specificDate).toISOString().split("T")[0];
      return ruleDate === dateStr;
    });

    if (specificRule && specificRule.isUnavailable) {
      // This date is marked as unavailable
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Get recurring rules for this day of week
    const dayRules = rules.filter(
      (r) => r.dayOfWeek === dayOfWeek && !r.specificDate && !r.isUnavailable
    );

    // Use specific date rule if available, otherwise use recurring rules
    const applicableRules = specificRule ? [specificRule] : dayRules;

    for (const rule of applicableRules) {
      if (!rule.startTime || !rule.endTime) continue;

      const [startHour, startMin] = rule.startTime.split(":").map(Number);
      const [endHour, endMin] = rule.endTime.split(":").map(Number);

      const slotStart = new Date(currentDate);
      slotStart.setHours(startHour, startMin, 0, 0);

      const slotEnd = new Date(currentDate);
      slotEnd.setHours(endHour, endMin, 0, 0);

      // Generate slots within this availability window
      const windowStart = new Date(slotStart);
      while (windowStart.getTime() + slotDuration * 60 * 1000 <= slotEnd.getTime()) {
        const windowEnd = new Date(windowStart.getTime() + appointmentType.duration * 60 * 1000);

        // Check if this slot conflicts with existing bookings
        const hasConflict = existingBookings.some((booking) => {
          const bookingStart = new Date(booking.startAt);
          const bookingEnd = new Date(booking.endAt);
          return (
            (windowStart >= bookingStart && windowStart < bookingEnd) ||
            (windowEnd > bookingStart && windowEnd <= bookingEnd) ||
            (windowStart <= bookingStart && windowEnd >= bookingEnd)
          );
        });

        if (!hasConflict) {
          slots.push({
            startAt: windowStart.toISOString(),
            endAt: windowEnd.toISOString(),
            appointmentTypeId: appointmentType.id,
            assignedTo: rule.userId || null,
          });
        }

        // Move to next slot (including buffer)
        windowStart.setTime(windowStart.getTime() + slotDuration * 60 * 1000);
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}
