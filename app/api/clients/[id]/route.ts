import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { clients } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateClientSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(async (_request, { params, user }) => {
    const id = params?.id;
    if (!id) throw new NotFoundError("Client not found");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const client = await withFirmDb(firmId, async (tx) => {
      const [client] = await tx
        .select()
        .from(clients)
        .where(and(eq(clients.id, id), eq(clients.firmId, firmId)))
        .limit(1);
      return client ?? null;
    });

    if (!client) throw new NotFoundError("Client not found");
    return NextResponse.json(client);
  })
);

export const PATCH = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const id = params?.id;
    if (!id) throw new NotFoundError("Client not found");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const body = await request.json();
    const data = UpdateClientSchema.parse(body);

    const client = await withFirmDb(firmId, async (tx) => {
      const [client] = await tx
        .update(clients)
        .set({
          title: data.title ?? undefined,
          firstName: data.firstName ?? undefined,
          lastName: data.lastName ?? undefined,
          companyName: data.companyName ?? undefined,
          companyNumber: data.companyNumber ?? undefined,
          email: data.email ?? undefined,
          phone: data.phone ?? undefined,
          mobile: data.mobile ?? undefined,
          addressLine1: data.addressLine1 ?? undefined,
          addressLine2: data.addressLine2 ?? undefined,
          city: data.city ?? undefined,
          county: data.county ?? undefined,
          postcode: data.postcode ?? undefined,
          country: data.country ?? undefined,
          notes: data.notes ?? undefined,
          updatedAt: new Date(),
        })
        .where(and(eq(clients.id, id), eq(clients.firmId, firmId)))
        .returning();
      return client ?? null;
    });

    if (!client) throw new NotFoundError("Client not found");
    return NextResponse.json(client);
  })
);

export const DELETE = withErrorHandler(
  withAuth(async (_request, { params, user }) => {
    const id = params?.id;
    if (!id) throw new NotFoundError("Client not found");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);

    const client = await withFirmDb(firmId, async (tx) => {
      const [client] = await tx
        .update(clients)
        .set({ status: "archived", updatedAt: new Date() })
        .where(and(eq(clients.id, id), eq(clients.firmId, firmId)))
        .returning();
      return client ?? null;
    });

    if (!client) throw new NotFoundError("Client not found");
    return NextResponse.json({ success: true });
  })
);
