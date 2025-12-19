import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { documents, uploads, matters, users } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { DocumentTypeSchema } from "@/lib/api/schemas/documents";
import { UuidSchema, DateSchema, DateTimeSchema } from "@/lib/api/schemas/common";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

export const GET = withErrorHandler(
  withAuth(
    withPermission("documents:read")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new ValidationError("Document ID is required");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Fetch document
        const [doc] = await tx
          .select()
          .from(documents)
          .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
          .limit(1);

        if (!doc) {
          throw new NotFoundError("Document not found");
        }

        // Fetch related data separately to avoid null join issues
        let upload = null;
        if (doc.uploadId) {
          const [u] = await tx.select().from(uploads).where(eq(uploads.id, doc.uploadId)).limit(1);
          upload = u || null;
        }

        let matter = null;
        if (doc.matterId) {
          const [m] = await tx
            .select({ id: matters.id, title: matters.title, reference: matters.reference })
            .from(matters)
            .where(eq(matters.id, doc.matterId))
            .limit(1);
          matter = m || null;
        }

        let createdByUser = null;
        if (doc.createdBy) {
          const [u] = await tx
            .select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, doc.createdBy))
            .limit(1);
          createdByUser = u || null;
        }

        return {
          ...doc,
          upload,
          matter,
          createdByUser,
        };
      });

      return NextResponse.json(result);
    })
  )
);

// Schema for updating a document
const UpdateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: DocumentTypeSchema.optional(),
  matterId: UuidSchema.nullable().optional(),
  documentDate: z.union([DateSchema, DateTimeSchema]).nullable().optional(),
  recipient: z.string().nullable().optional(),
  sender: z.string().nullable().optional(),
  aiSummary: z.string().nullable().optional(),
});

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("documents:write")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new ValidationError("Document ID is required");

      const body = await request.json();
      const data = UpdateDocumentSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Check document exists
        const [existing] = await tx
          .select({ id: documents.id, matterId: documents.matterId })
          .from(documents)
          .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
          .limit(1);

        if (!existing) {
          throw new NotFoundError("Document not found");
        }

        // If matterId is being set/changed, validate it exists
        if (data.matterId !== undefined && data.matterId !== null) {
          const [matter] = await tx
            .select({ id: matters.id })
            .from(matters)
            .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
            .limit(1);

          if (!matter) {
            throw new NotFoundError("Matter not found");
          }
        }

        // Build update object
        const updateData: Record<string, unknown> = {
          updatedAt: new Date(),
        };

        if (data.title !== undefined) updateData.title = data.title;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.matterId !== undefined) updateData.matterId = data.matterId;
        if (data.documentDate !== undefined) {
          updateData.documentDate = data.documentDate ? new Date(data.documentDate) : null;
        }
        if (data.recipient !== undefined) updateData.recipient = data.recipient;
        if (data.sender !== undefined) updateData.sender = data.sender;
        if (data.aiSummary !== undefined) updateData.aiSummary = data.aiSummary;

        // Update document
        const [updated] = await tx
          .update(documents)
          .set(updateData)
          .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
          .returning();

        // Create timeline event if document was assigned to a matter
        if (data.matterId && data.matterId !== existing.matterId) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: data.matterId,
            type: "document_uploaded",
            title: "Document assigned to matter",
            actorType: "user",
            actorId: user.user.id,
            entityType: "document",
            entityId: updated.id,
            occurredAt: new Date(),
            metadata: { title: updated.title },
          });
        }

        return updated;
      });

      return NextResponse.json(result);
    })
  )
);
