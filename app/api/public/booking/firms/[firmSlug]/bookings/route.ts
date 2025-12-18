import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, gte, lte } from "drizzle-orm";
import { bookings, appointmentTypes, firms } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { withRateLimit, RateLimitPresets } from "@/middleware/withRateLimit";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { PublicCreateBookingSchema } from "@/lib/api/schemas/booking";

/**
 * POST /api/public/booking/firms/[firmSlug]/bookings
 * Public endpoint to create a booking (rate limited)
 */
export const POST = withErrorHandler(
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

      const body = await request.json().catch(() => ({}));
      const data = PublicCreateBookingSchema.parse(body);

      // Validate that firm exists
      const [firm] = await db.select().from(firms).where(eq(firms.id, firmSlug)).limit(1);

      if (!firm) {
        return NextResponse.json({ error: "Firm not found" }, { status: 404 });
      }

      // Validate appointment type belongs to this firm and is active
      const [appointmentType] = await db
        .select()
        .from(appointmentTypes)
        .where(
          and(
            eq(appointmentTypes.id, data.appointmentTypeId),
            eq(appointmentTypes.firmId, firmSlug),
            eq(appointmentTypes.isActive, true)
          )
        )
        .limit(1);

      if (!appointmentType) {
        return NextResponse.json(
          { error: "Appointment type not found or not available" },
          { status: 404 }
        );
      }

      const startAt = new Date(data.startAt);
      const now = new Date();

      // Check minimum notice hours
      const minNoticeMs = appointmentType.minNoticeHours * 60 * 60 * 1000;
      if (startAt.getTime() - now.getTime() < minNoticeMs) {
        return NextResponse.json(
          {
            error: "Booking time is too soon",
            message: `This appointment requires at least ${appointmentType.minNoticeHours} hours notice`,
          },
          { status: 400 }
        );
      }

      // Check maximum advance booking days
      if (appointmentType.maxAdvanceBookingDays) {
        const maxAdvanceMs = appointmentType.maxAdvanceBookingDays * 24 * 60 * 60 * 1000;
        if (startAt.getTime() - now.getTime() > maxAdvanceMs) {
          return NextResponse.json(
            {
              error: "Booking time is too far in advance",
              message: `This appointment can only be booked up to ${appointmentType.maxAdvanceBookingDays} days in advance`,
            },
            { status: 400 }
          );
        }
      }

      // Calculate end time
      const endAt = new Date(startAt.getTime() + appointmentType.duration * 60 * 1000);

      // Check for conflicts with existing bookings
      const conflictingBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.firmId, firmSlug),
            eq(bookings.appointmentTypeId, data.appointmentTypeId),
            or(eq(bookings.status, "pending"), eq(bookings.status, "confirmed")),
            or(
              // New booking starts during existing booking
              and(gte(bookings.startAt, startAt), lte(bookings.startAt, endAt)),
              // New booking ends during existing booking
              and(gte(bookings.endAt, startAt), lte(bookings.endAt, endAt)),
              // New booking completely overlaps existing booking
              and(lte(bookings.startAt, startAt), gte(bookings.endAt, endAt))
            )
          )
        )
        .limit(1);

      if (conflictingBookings.length > 0) {
        return NextResponse.json(
          {
            error: "Time slot not available",
            message: "This time slot is already booked. Please choose another time.",
          },
          { status: 409 }
        );
      }

      // Create the booking
      const [booking] = await db
        .insert(bookings)
        .values({
          firmId: firmSlug,
          appointmentTypeId: data.appointmentTypeId,
          assignedTo: null,
          leadId: null,
          matterId: null,
          calendarEventId: null,
          status: "pending",
          startAt,
          endAt,
          clientName: data.clientName,
          clientEmail: data.clientEmail,
          clientPhone: data.clientPhone ?? null,
          notes: data.notes ?? null,
          internalNotes: null,
          cancellationReason: null,
          cancelledBy: null,
          metadata: data.captchaToken ? { captchaToken: data.captchaToken } : null,
          createdById: null,
          updatedAt: new Date(),
        })
        .returning();

      if (!booking) {
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
      }

      // TODO: Send confirmation email to client
      // TODO: Notify firm of new booking
      // TODO: Create calendar event

      return NextResponse.json(
        {
          success: true,
          bookingId: booking.id,
          message: "Booking created successfully. You will receive a confirmation email shortly.",
        },
        { status: 201 }
      );
    },
    RateLimitPresets.public
  )
);
