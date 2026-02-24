import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { clients } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { generateReference } from "@/lib/references";
import { ClientQuerySchema, CreateClientSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler } from "@/middleware/withErrorHandler";

function withPostalCodeAlias<T extends { postcode: string | null } | null | undefined>(client: T) {
  if (!client) return client;
  return {
    ...client,
    postalCode: client.postcode,
  };
}

export const GET = withErrorHandler(
  withAuth(
    withPermission("clients:read")(async (request, { user }) => {
      const url = new URL(request.url);
      const query = ClientQuerySchema.parse(Object.fromEntries(url.searchParams.entries()));

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const whereClauses = [eq(clients.firmId, firmId)];
      if (query.status) whereClauses.push(eq(clients.status, query.status));
      if (query.type) whereClauses.push(eq(clients.type, query.type));

      if (query.search) {
        const term = `%${query.search}%`;
        whereClauses.push(
          or(
            ilike(clients.reference, term),
            ilike(clients.firstName, term),
            ilike(clients.lastName, term),
            ilike(clients.companyName, term),
            ilike(clients.email, term)
          )!
        );
      }

      const where = and(...whereClauses);
      const offset = (query.page - 1) * query.limit;

      const { total, rows } = await withFirmDb(firmId, async (tx) => {
        const [countRow] = await tx
          .select({ total: sql<number>`count(*)` })
          .from(clients)
          .where(where);

        const rows = await tx
          .select()
          .from(clients)
          .where(where)
          .orderBy(clients.createdAt)
          .limit(query.limit)
          .offset(offset);

        return { total: Number(countRow?.total ?? 0), rows };
      });

      const totalPages = Math.max(1, Math.ceil(total / query.limit));

      return NextResponse.json({
        clients: rows.map(withPostalCodeAlias),
        pagination: { page: query.page, limit: query.limit, total, totalPages },
      });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("clients:write")(async (request, { user }) => {
      const body = await request.json();
      const data = CreateClientSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const reference = generateReference("CLI");

      const client = await withFirmDb(firmId, async (tx) => {
        const [client] = await tx
          .insert(clients)
          .values({
            firmId,
            reference,
            type: data.type,
            status: "prospect",
            source: data.source ?? null,
            sourceId: data.sourceId ?? null,
            title: data.title ?? null,
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            companyName: data.companyName ?? null,
            companyNumber: data.companyNumber ?? null,
            email: data.email,
            phone: data.phone ?? null,
            mobile: data.mobile ?? null,
            addressLine1: data.addressLine1 ?? null,
            addressLine2: data.addressLine2 ?? null,
            city: data.city ?? null,
            county: data.county ?? null,
            postcode: data.postalCode ?? data.postcode ?? null,
            country: data.country ?? "United States",
            notes: data.notes ?? null,
          })
          .returning();
        return client;
      });

      return NextResponse.json(withPostalCodeAlias(client), { status: 201 });
    })
  )
);
