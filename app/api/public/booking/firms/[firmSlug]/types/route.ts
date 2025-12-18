import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { appointmentTypes, firms } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { withRateLimit, RateLimitPresets } from "@/middleware/withRateLimit";
import { withErrorHandler } from "@/middleware/withErrorHandler";

/**
 * GET /api/public/booking/firms/[firmSlug]/types
 * Public endpoint to list active appointment types for a firm
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

      // For now, treat firmSlug as firm ID (can be extended to support actual slugs)
      // Validate that firm exists
      const [firm] = await db.select().from(firms).where(eq(firms.id, firmSlug)).limit(1);

      if (!firm) {
        return NextResponse.json({ error: "Firm not found" }, { status: 404 });
      }

      // Get active appointment types
      const types = await db
        .select({
          id: appointmentTypes.id,
          name: appointmentTypes.name,
          description: appointmentTypes.description,
          practiceArea: appointmentTypes.practiceArea,
          duration: appointmentTypes.duration,
          minNoticeHours: appointmentTypes.minNoticeHours,
          maxAdvanceBookingDays: appointmentTypes.maxAdvanceBookingDays,
        })
        .from(appointmentTypes)
        .where(and(eq(appointmentTypes.firmId, firmSlug), eq(appointmentTypes.isActive, true)))
        .orderBy(appointmentTypes.name);

      return NextResponse.json({ appointmentTypes: types });
    },
    RateLimitPresets.public
  )
);
