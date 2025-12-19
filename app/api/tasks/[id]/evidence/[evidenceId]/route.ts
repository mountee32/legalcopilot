/**
 * Evidence Detail API
 *
 * GET /api/tasks/[id]/evidence/[evidenceId] - Get a specific evidence item
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { tasks, evidenceItems, users, documents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * GET /api/tasks/[id]/evidence/[evidenceId]
 * Get a specific evidence item with full details.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (_request, { params, user }) => {
      const resolvedParams = params ? await params : {};
      const taskId = resolvedParams.id;
      const evidenceId = resolvedParams.evidenceId;

      if (!taskId) throw new NotFoundError("Task not found");
      if (!evidenceId) throw new NotFoundError("Evidence not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify task exists and belongs to firm
        const [task] = await tx
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Get the evidence item with all joined data
        const [evidence] = await tx
          .select({
            id: evidenceItems.id,
            taskId: evidenceItems.taskId,
            type: evidenceItems.type,
            description: evidenceItems.description,
            documentId: evidenceItems.documentId,
            documentName: documents.fileName,
            addedById: evidenceItems.addedById,
            addedAt: evidenceItems.addedAt,
            verifiedById: evidenceItems.verifiedById,
            verifiedAt: evidenceItems.verifiedAt,
            verificationMethod: evidenceItems.verificationMethod,
            verificationNotes: evidenceItems.verificationNotes,
            metadata: evidenceItems.metadata,
            createdAt: evidenceItems.createdAt,
          })
          .from(evidenceItems)
          .leftJoin(documents, eq(evidenceItems.documentId, documents.id))
          .where(
            and(
              eq(evidenceItems.id, evidenceId),
              eq(evidenceItems.taskId, taskId),
              eq(evidenceItems.firmId, firmId)
            )
          )
          .limit(1);

        if (!evidence) throw new NotFoundError("Evidence not found");

        // Get user names separately for addedBy and verifiedBy
        let addedByName: string | null = null;
        let verifiedByName: string | null = null;

        if (evidence.addedById) {
          const [addedBy] = await tx
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, evidence.addedById))
            .limit(1);
          addedByName = addedBy?.name ?? null;
        }

        if (evidence.verifiedById) {
          const [verifiedBy] = await tx
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, evidence.verifiedById))
            .limit(1);
          verifiedByName = verifiedBy?.name ?? null;
        }

        return {
          ...evidence,
          addedByName,
          verifiedByName,
        };
      });

      return NextResponse.json(result);
    })
  )
);
