import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { approvalRequests, documents, signatureRequests } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateSignatureRequestSchema, SignatureRequestQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("integrations:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = SignatureRequestQuerySchema.parse(
        Object.fromEntries(url.searchParams.entries())
      );

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const whereClauses = [eq(signatureRequests.firmId, firmId)];
      if (query.documentId) whereClauses.push(eq(signatureRequests.documentId, query.documentId));
      if (query.status) whereClauses.push(eq(signatureRequests.status, query.status));

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(signatureRequests)
          .where(where);

        const rows = await tx
          .select()
          .from(signatureRequests)
          .where(where)
          .orderBy(desc(signatureRequests.updatedAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        requests: rows,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
          hasNext: query.page < totalPages,
          hasPrev: query.page > 1,
        },
      });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("integrations:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreateSignatureRequestSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        const [doc] = await tx
          .select({ id: documents.id })
          .from(documents)
          .where(and(eq(documents.firmId, firmId), eq(documents.id, data.documentId)))
          .limit(1);

        if (!doc) throw new NotFoundError("Document not found");

        const [sig] = await tx
          .insert(signatureRequests)
          .values({
            firmId,
            documentId: data.documentId,
            provider: data.provider,
            status: "pending_approval",
            signers: data.signers,
            createdById: user.user.id,
            updatedAt: new Date(),
          })
          .returning();

        if (!sig) throw new ValidationError("Failed to create signature request");

        const [approval] = await tx
          .insert(approvalRequests)
          .values({
            firmId,
            sourceType: "user",
            sourceId: user.user.id,
            action: "signature_request.send",
            summary: "Send document for e-signature",
            proposedPayload: { signatureRequestId: sig.id },
            entityType: "signature_request",
            entityId: sig.id,
            status: "pending",
            updatedAt: new Date(),
          })
          .returning({ id: approvalRequests.id });

        return { signatureRequest: sig, approvalRequestId: approval?.id ?? null };
      });

      return NextResponse.json(result, { status: 201 });
    })
  )
);
