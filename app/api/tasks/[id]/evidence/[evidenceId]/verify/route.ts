/**
 * Verify Evidence API
 *
 * POST /api/tasks/[id]/evidence/[evidenceId]/verify - Verify an evidence item
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { tasks, evidenceItems, users, documents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { VerifyEvidenceSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * POST /api/tasks/[id]/evidence/[evidenceId]/verify
 * Mark evidence as verified.
 * Evidence can only be verified once; re-verification requires un-verify first.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const resolvedParams = params ? await params : {};
      const taskId = resolvedParams.id;
      const evidenceId = resolvedParams.evidenceId;

      if (!taskId) throw new NotFoundError("Task not found");
      if (!evidenceId) throw new NotFoundError("Evidence not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = VerifyEvidenceSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify task exists and belongs to firm
        const [task] = await tx
          .select({ id: tasks.id, matterId: tasks.matterId })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Get the evidence item
        const [evidence] = await tx
          .select()
          .from(evidenceItems)
          .where(
            and(
              eq(evidenceItems.id, evidenceId),
              eq(evidenceItems.taskId, taskId),
              eq(evidenceItems.firmId, firmId)
            )
          )
          .limit(1);

        if (!evidence) throw new NotFoundError("Evidence not found");

        // Check if already verified
        if (evidence.verifiedAt) {
          throw new ValidationError("Evidence is already verified");
        }

        // Update the evidence item with verification
        const [updated] = await tx
          .update(evidenceItems)
          .set({
            verifiedById: user.user.id,
            verifiedAt: new Date(),
            verificationMethod: data.verificationMethod,
            verificationNotes: data.verificationNotes ?? null,
          })
          .where(eq(evidenceItems.id, evidenceId))
          .returning();

        // Create timeline event
        await createTimelineEvent(tx, {
          firmId,
          matterId: task.matterId,
          type: "task_evidence_verified",
          title: `Evidence verified: ${evidence.type.replace(/_/g, " ")}`,
          actorType: "user",
          actorId: user.user.id,
          entityType: "evidence_item",
          entityId: evidenceId,
          metadata: {
            taskId,
            evidenceType: evidence.type,
            verificationMethod: data.verificationMethod,
          },
          occurredAt: new Date(),
        });

        // Get names for response
        let documentName: string | null = null;
        let addedByName: string | null = null;

        if (evidence.documentId) {
          const [doc] = await tx
            .select({ fileName: documents.fileName })
            .from(documents)
            .where(eq(documents.id, evidence.documentId))
            .limit(1);
          documentName = doc?.fileName ?? null;
        }

        if (evidence.addedById) {
          const [addedBy] = await tx
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, evidence.addedById))
            .limit(1);
          addedByName = addedBy?.name ?? null;
        }

        const [verifiedBy] = await tx
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, user.user.id))
          .limit(1);

        return {
          ...updated,
          documentName,
          addedByName,
          verifiedByName: verifiedBy?.name ?? null,
        };
      });

      return NextResponse.json(result);
    })
  )
);
