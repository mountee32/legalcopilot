/**
 * GET /api/email-imports
 *
 * List email imports with pagination and filtering.
 */

import { NextResponse } from "next/server";
import { and, eq, desc, count } from "drizzle-orm";
import { emailImports } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { EmailImportQuerySchema } from "@/lib/api/schemas/email-imports";

export const GET = withErrorHandler(
  withAuth(async (request, { user }) => {
    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const url = new URL(request.url);

    const query = EmailImportQuerySchema.parse({
      status: url.searchParams.get("status") || undefined,
      matterId: url.searchParams.get("matterId") || undefined,
      emailAccountId: url.searchParams.get("emailAccountId") || undefined,
      page: url.searchParams.get("page") || 1,
      limit: url.searchParams.get("limit") || 25,
    });

    const result = await withFirmDb(firmId, async (tx) => {
      const conditions = [eq(emailImports.firmId, firmId)];

      if (query.status) {
        conditions.push(eq(emailImports.status, query.status));
      }
      if (query.matterId) {
        conditions.push(eq(emailImports.matterId, query.matterId));
      }
      if (query.emailAccountId) {
        conditions.push(eq(emailImports.emailAccountId, query.emailAccountId));
      }

      const where = and(...conditions);
      const offset = (query.page - 1) * query.limit;

      const [imports, totalResult] = await Promise.all([
        tx
          .select()
          .from(emailImports)
          .where(where)
          .orderBy(desc(emailImports.receivedAt))
          .limit(query.limit)
          .offset(offset),
        tx.select({ count: count() }).from(emailImports).where(where),
      ]);

      return {
        imports,
        total: totalResult[0]?.count || 0,
        page: query.page,
        limit: query.limit,
      };
    });

    return NextResponse.json(result);
  })
);
