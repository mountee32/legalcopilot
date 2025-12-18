import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { documents, uploads, auditLogs } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { NotFoundError, BadRequestError, withErrorHandler } from "@/middleware/withErrorHandler";
import { getPresignedUrl } from "@/lib/storage/minio";
import { DocumentDownloadResponseSchema } from "@/lib/api/schemas";
import { z } from "zod";

const QuerySchema = z.object({
  disposition: z.enum(["inline", "attachment"]).optional().default("inline"),
  expires: z.coerce.number().int().min(1).max(86400).optional().default(3600),
});

export const GET = withErrorHandler(
  withAuth(
    withPermission("documents:read")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new BadRequestError("Document ID is required");

      const { searchParams } = new URL(request.url);
      const query = QuerySchema.parse(Object.fromEntries(searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        // Look up document with firm scoping and join to uploads table
        const [row] = await tx
          .select({
            document: documents,
            upload: uploads,
          })
          .from(documents)
          .leftJoin(uploads, eq(documents.uploadId, uploads.id))
          .where(and(eq(documents.id, id), eq(documents.firmId, firmId)))
          .limit(1);

        if (!row || !row.document) {
          throw new NotFoundError("Document not found");
        }

        if (!row.upload) {
          throw new NotFoundError("Document has no associated file");
        }

        const { document, upload } = row;

        // Generate presigned URL
        const presignedUrl = await getPresignedUrl(upload.bucket, upload.path, query.expires);

        const expiresAt = new Date(Date.now() + query.expires * 1000);

        // Log access to audit logs
        await tx.insert(auditLogs).values({
          firmId,
          userId: user.user.id,
          action: "document.download",
          category: "document",
          severity: "info",
          description: `Document accessed: ${document.title}`,
          entityType: "document",
          entityId: document.id,
          metadata: {
            filename: upload.originalName,
            mimeType: upload.mimeType,
            disposition: query.disposition,
            expires: query.expires,
          },
          ipAddress:
            request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
          userAgent: request.headers.get("user-agent") || null,
        });

        return {
          url: presignedUrl,
          expiresAt: expiresAt.toISOString(),
          contentDisposition: query.disposition,
          filename: upload.originalName,
          mimeType: upload.mimeType,
        };
      });

      const response = DocumentDownloadResponseSchema.parse(result);
      return NextResponse.json(response);
    })
  )
);
