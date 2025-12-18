/**
 * POST /api/litigation/bundles
 *
 * Create a litigation bundle from selected documents.
 * Updates the matter's practiceData with bundleDocumentIds.
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateBundleRequestSchema } from "@/lib/api/schemas/practice-modules";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateBundleRequestSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify the matter exists and is a litigation matter
        const [matter] = await tx
          .select()
          .from(matters)
          .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
          .limit(1);

        if (!matter) {
          throw new NotFoundError("Matter not found");
        }

        if (matter.practiceArea !== "litigation") {
          throw new ValidationError(
            `Matter is not a litigation matter (practiceArea: ${matter.practiceArea})`
          );
        }

        // Update the practiceData with bundle document IDs
        const currentData = (matter.practiceData as any) || {};
        const updatedData = {
          ...currentData,
          bundleDocumentIds: data.documentIds,
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
            type: "bundle_created",
            title: data.title || "Litigation bundle created",
            actorType: "user",
            actorId: user.user.id,
            entityType: "matter",
            entityId: updated.id,
            occurredAt: new Date(),
            metadata: { documentCount: data.documentIds.length },
          });
        }

        return updated;
      });

      if (!result) {
        throw new NotFoundError("Failed to create bundle");
      }

      return NextResponse.json({
        success: true,
        bundleDocumentIds: data.documentIds,
        message: `Bundle created with ${data.documentIds.length} document(s)`,
      });
    })
  )
);
