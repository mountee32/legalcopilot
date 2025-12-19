/**
 * Task Evidence API
 *
 * GET  /api/tasks/[id]/evidence - List evidence for a task
 * POST /api/tasks/[id]/evidence - Add evidence to a task
 */

import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, isNotNull, sql } from "drizzle-orm";
import { tasks, evidenceItems, users, documents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateEvidenceSchema, EvidenceQuerySchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * GET /api/tasks/[id]/evidence
 * List evidence items for a task with pagination and filtering.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request: NextRequest, { params, user }) => {
      const taskId = params ? (await params).id : undefined;
      if (!taskId) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const searchParams = Object.fromEntries(request.nextUrl.searchParams);
      const query = EvidenceQuerySchema.parse(searchParams);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify task exists and belongs to firm
        const [task] = await tx
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Build where conditions
        const conditions = [eq(evidenceItems.taskId, taskId), eq(evidenceItems.firmId, firmId)];

        // Filter by type if specified
        if (query.type) {
          conditions.push(eq(evidenceItems.type, query.type));
        }

        // Filter by verification status if specified
        if (query.verified === true) {
          conditions.push(isNotNull(evidenceItems.verifiedAt));
        } else if (query.verified === false) {
          conditions.push(isNull(evidenceItems.verifiedAt));
        }

        const where = and(...conditions);

        // Get total count
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(evidenceItems)
          .where(where);

        const total = Number(countRow?.total ?? 0);
        const offset = (query.page - 1) * query.limit;

        // Get evidence items with joined data
        const evidence = await tx
          .select({
            id: evidenceItems.id,
            taskId: evidenceItems.taskId,
            type: evidenceItems.type,
            description: evidenceItems.description,
            documentId: evidenceItems.documentId,
            documentName: documents.fileName,
            addedById: evidenceItems.addedById,
            addedByName: users.name,
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
          .leftJoin(users, eq(evidenceItems.addedById, users.id))
          .where(where)
          .orderBy(evidenceItems.addedAt)
          .limit(query.limit)
          .offset(offset);

        const totalPages = Math.ceil(total / query.limit);

        return {
          evidence,
          pagination: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages,
            hasNext: query.page < totalPages,
            hasPrev: query.page > 1,
          },
        };
      });

      return NextResponse.json(result);
    })
  )
);

/**
 * POST /api/tasks/[id]/evidence
 * Add evidence to a task.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request: NextRequest, { params, user }) => {
      const taskId = params ? (await params).id : undefined;
      if (!taskId) throw new NotFoundError("Task not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateEvidenceSchema.parse(body);

      const result = await withFirmDb(firmId, async (tx) => {
        // Verify task exists and belongs to firm
        const [task] = await tx
          .select({ id: tasks.id, matterId: tasks.matterId })
          .from(tasks)
          .where(and(eq(tasks.id, taskId), eq(tasks.firmId, firmId)))
          .limit(1);

        if (!task) throw new NotFoundError("Task not found");

        // Validate document ID if provided
        if (data.documentId) {
          const [doc] = await tx
            .select({ id: documents.id })
            .from(documents)
            .where(and(eq(documents.id, data.documentId), eq(documents.firmId, firmId)))
            .limit(1);

          if (!doc) {
            throw new ValidationError("Invalid document ID");
          }
        }

        // Create the evidence item
        const [evidence] = await tx
          .insert(evidenceItems)
          .values({
            firmId,
            taskId,
            type: data.type,
            description: data.description ?? null,
            documentId: data.documentId ?? null,
            addedById: user.user.id,
            metadata: data.metadata ?? null,
          })
          .returning();

        // Create timeline event
        await createTimelineEvent(tx, {
          firmId,
          matterId: task.matterId,
          type: "task_evidence_added",
          title: `Evidence added: ${data.type.replace(/_/g, " ")}`,
          actorType: "user",
          actorId: user.user.id,
          entityType: "evidence_item",
          entityId: evidence.id,
          metadata: {
            taskId,
            evidenceType: data.type,
            hasDocument: !!data.documentId,
          },
          occurredAt: new Date(),
        });

        // Get document name for response if applicable
        let documentName: string | null = null;
        if (data.documentId) {
          const [doc] = await tx
            .select({ fileName: documents.fileName })
            .from(documents)
            .where(eq(documents.id, data.documentId))
            .limit(1);
          documentName = doc?.fileName ?? null;
        }

        // Get user name for response
        const [addedBy] = await tx
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, user.user.id))
          .limit(1);

        return {
          ...evidence,
          documentName,
          addedByName: addedBy?.name ?? null,
          verifiedByName: null,
        };
      });

      return NextResponse.json(result, { status: 201 });
    })
  )
);
