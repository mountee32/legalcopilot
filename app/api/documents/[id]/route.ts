import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { documents, uploads, matters, users } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";

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
