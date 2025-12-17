import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { leads } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateLeadSchema, LeadQuerySchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("intake:read")(async (request: NextRequest, { user }) => {
      const url = new URL(request.url);
      const query = LeadQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const offset = (query.page - 1) * query.limit;

      const whereClauses = [eq(leads.firmId, firmId)];
      if (query.status) whereClauses.push(eq(leads.status, query.status));
      if (query.search) {
        const term = `%${query.search}%`;
        whereClauses.push(
          or(
            ilike(leads.email, term),
            ilike(leads.firstName, term),
            ilike(leads.lastName, term),
            ilike(leads.companyName, term)
          )!
        );
      }

      const where = and(...whereClauses);

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(leads)
          .where(where);

        const rows = await tx
          .select()
          .from(leads)
          .where(where)
          .orderBy(desc(leads.createdAt))
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        leads: rows,
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
    withPermission("intake:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = CreateLeadSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [lead] = await tx
          .insert(leads)
          .values({
            firmId,
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            companyName: data.companyName ?? null,
            email: data.email ?? null,
            phone: data.phone ?? null,
            source: data.source ?? null,
            status: "new",
            score: data.score ?? null,
            notes: data.notes ?? null,
            convertedToClientId: null,
            createdById: user.user.id,
            updatedAt: new Date(),
          })
          .returning();
        return lead ?? null;
      });

      return NextResponse.json(row, { status: 201 });
    })
  )
);
