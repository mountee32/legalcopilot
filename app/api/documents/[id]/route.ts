import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { documents, uploads, matters, users, documentChunks } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { UpdateDocumentMetadataSchema } from "@/lib/api/schemas/documents";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { deleteFile } from "@/lib/storage/minio";

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

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("documents:write")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new ValidationError("Document ID is required");

      const body = await request.json();
      const data = UpdateDocumentMetadataSchema.parse(body);

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
        if (data.status !== undefined) updateData.status = data.status;
        if (data.matterId !== undefined) updateData.matterId = data.matterId;
        if (data.documentDate !== undefined) {
          updateData.documentDate = data.documentDate ? new Date(data.documentDate) : null;
        }
        if (data.recipient !== undefined) updateData.recipient = data.recipient;
        if (data.sender !== undefined) updateData.sender = data.sender;
        if (data.aiSummary !== undefined) updateData.aiSummary = data.aiSummary;
        if (data.extractedParties !== undefined)
          updateData.extractedParties = data.extractedParties;
        if (data.extractedDates !== undefined) updateData.extractedDates = data.extractedDates;

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

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("documents:write")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new ValidationError("Document ID is required");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      await withFirmDb(firmId, async (tx) => {
        // Fetch document with upload info for deletion
        const [doc] = await tx
          .select({
            id: documents.id,
            title: documents.title,
            matterId: documents.matterId,
            uploadId: documents.uploadId,
          })
          .from(documents)
          .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
          .limit(1);

        if (!doc) {
          throw new NotFoundError("Document not found");
        }

        // Get upload record for file path if exists
        let uploadPath: { bucket: string; path: string } | null = null;
        if (doc.uploadId) {
          const [upload] = await tx
            .select({ bucket: uploads.bucket, path: uploads.path })
            .from(uploads)
            .where(eq(uploads.id, doc.uploadId))
            .limit(1);
          uploadPath = upload || null;
        }

        // Delete document chunks first (cascade should handle this but be explicit)
        await tx.delete(documentChunks).where(eq(documentChunks.documentId, id));

        // Delete the document record
        await tx.delete(documents).where(and(eq(documents.id, id), eq(documents.firmId, firmId)));

        // Delete file from storage if exists
        if (uploadPath) {
          try {
            await deleteFile(uploadPath.bucket, uploadPath.path);
          } catch (storageError) {
            // Log but don't fail the request - document is already deleted from DB
            console.error("Failed to delete file from storage:", storageError);
          }
        }

        // Create timeline event for audit trail (only if document had a matter)
        if (doc.matterId) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: doc.matterId,
            type: "document_deleted",
            title: "Document deleted",
            actorType: "user",
            actorId: user.user.id,
            entityType: "document",
            entityId: id,
            occurredAt: new Date(),
            metadata: { title: doc.title },
          });
        }
      });

      return new NextResponse(null, { status: 204 });
    })
  )
);
