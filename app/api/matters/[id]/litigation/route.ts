/**
 * PATCH /api/matters/[id]/litigation
 *
 * Update litigation-specific data for a matter.
 * Stores data in matters.practiceData JSONB column.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateLitigationDataSchema } from "@/lib/api/schemas/practice-modules";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Matter not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateLitigationDataSchema.parse(body);

      const matter = await withFirmDb(firmId, async (tx) => {
        // First, verify the matter exists and is a litigation matter
        const [existing] = await tx
          .select()
          .from(matters)
          .where(and(eq(matters.id, id), eq(matters.firmId, firmId)))
          .limit(1);

        if (!existing) return null;

        if (existing.practiceArea !== "litigation") {
          throw new ValidationError(
            `Matter is not a litigation matter (practiceArea: ${existing.practiceArea})`
          );
        }

        // Merge with existing practiceData
        const currentData = (existing.practiceData as any) || {};
        const updatedData = { ...currentData, ...data };

        const [updated] = await tx
          .update(matters)
          .set({
            practiceData: updatedData,
            updatedAt: new Date(),
          })
          .where(and(eq(matters.id, id), eq(matters.firmId, firmId)))
          .returning();

        if (updated) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: updated.id,
            type: "litigation_updated",
            title: "Litigation data updated",
            actorType: "user",
            actorId: user.user.id,
            entityType: "matter",
            entityId: updated.id,
            occurredAt: new Date(),
            metadata: { updatedFields: Object.keys(data) },
          });
        }

        return updated ?? null;
      });

      if (!matter) throw new NotFoundError("Matter not found");
      return NextResponse.json({ success: true, practiceData: matter.practiceData });
    })
  )
);
