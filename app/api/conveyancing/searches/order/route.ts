/**
 * POST /api/conveyancing/searches/order
 *
 * Order a property search for a conveyancing matter.
 * Adds the search to the matter's practiceData.searches array.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { OrderSearchRequestSchema } from "@/lib/api/schemas/practice-modules";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";
import { randomUUID } from "crypto";

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = OrderSearchRequestSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify the matter exists and is a conveyancing matter
        const [matter] = await tx
          .select()
          .from(matters)
          .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) {
          throw new NotFoundError("Matter not found");
        }

        if (matter.practiceArea !== "conveyancing") {
          throw new ValidationError(
            `Matter is not a conveyancing matter (practiceArea: ${matter.practiceArea})`
          );
        }

        // Create new search record
        const searchId = randomUUID();
        const newSearch = {
          id: searchId,
          type: data.searchType,
          provider: data.provider,
          status: "ordered" as const,
          orderedAt: new Date().toISOString(),
        };

        // Add search to practiceData.searches array
        const currentData = (matter.practiceData as any) || {};
        const searches = currentData.searches || [];
        const updatedData = {
          ...currentData,
          searches: [...searches, newSearch],
        };

        const [updated] = await tx
          .update(matters)
          .set({
            practiceData: updatedData,
            updatedAt: new Date(),
          })
          .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
          .returning();

        if (updated) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: updated.id,
            type: "search_ordered",
            title: `${data.searchType} search ordered`,
            actorType: "user",
            actorId: user.user.id,
            entityType: "matter",
            entityId: updated.id,
            occurredAt: new Date(),
            metadata: { searchId, searchType: data.searchType, provider: data.provider },
          });
        }

        return { searchId };
      });

      return NextResponse.json({
        success: true,
        searchId: result.searchId,
        message: `${data.searchType} search ordered successfully`,
      });
    })
  )
);
