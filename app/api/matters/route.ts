import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { matters, clients } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { generateReference } from "@/lib/references";
import { CreateMatterSchema, MatterQuerySchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (request, { user }) => {
      const url = new URL(request.url);
      const query = MatterQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const whereClauses = [eq(matters.firmId, firmId)];
      if (query.status) whereClauses.push(eq(matters.status, query.status));
      if (query.practiceArea) whereClauses.push(eq(matters.practiceArea, query.practiceArea));
      if (query.clientId) whereClauses.push(eq(matters.clientId, query.clientId));
      if (query.feeEarnerId) whereClauses.push(eq(matters.feeEarnerId, query.feeEarnerId));

      if (query.search) {
        const term = `%${query.search}%`;
        whereClauses.push(or(ilike(matters.reference, term), ilike(matters.title, term))!);
      }

      const where = and(...whereClauses);
      const offset = (query.page - 1) * query.limit;

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(matters)
          .where(where);

        const rows = await tx
          .select()
          .from(matters)
          .where(where)
          .orderBy(matters.createdAt)
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        matters: rows,
        pagination: { page: query.page, limit: query.limit, total, totalPages },
      });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request, { user }) => {
      const body = await request.json();
      const data = CreateMatterSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const reference = generateReference("MAT");

      const matter = await withFirmDb(firmId, async (tx) => {
        const [client] = await tx
          .select({ id: clients.id })
          .from(clients)
          .where(and(eq(clients.id, data.clientId), eq(clients.firmId, firmId)))
          .limit(1);

        if (!client) throw new NotFoundError("Client not found");

        const [matter] = await tx
          .insert(matters)
          .values({
            firmId,
            reference,
            title: data.title,
            description: data.description ?? null,
            clientId: data.clientId,
            feeEarnerId: data.feeEarnerId ?? null,
            supervisorId: data.supervisorId ?? null,
            practiceArea: data.practiceArea,
            subType: data.subType ?? null,
            billingType: data.billingType,
            hourlyRate: data.hourlyRate ?? null,
            fixedFee: data.fixedFee ?? null,
            estimatedValue: data.estimatedValue ?? null,
            keyDeadline: data.keyDeadline ? new Date(data.keyDeadline) : null,
            notes: data.notes ?? null,
            status: "lead",
          })
          .returning();

        await createTimelineEvent(tx, {
          firmId,
          matterId: matter.id,
          type: "matter_created",
          title: "Matter created",
          actorType: "user",
          actorId: user.user.id,
          entityType: "matter",
          entityId: matter.id,
          occurredAt: new Date(),
          metadata: { reference: matter.reference, status: matter.status },
        });

        return matter;
      });

      return NextResponse.json(matter, { status: 201 });
    })
  )
);
