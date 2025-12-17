import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { quotes } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateQuoteSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("intake:read")(async (_request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Quote not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const row = await withFirmDb(firmId, async (tx) => {
        const [quote] = await tx
          .select()
          .from(quotes)
          .where(and(eq(quotes.id, id), eq(quotes.firmId, firmId)))
          .limit(1);
        return quote ?? null;
      });

      if (!row) throw new NotFoundError("Quote not found");
      return NextResponse.json(row);
    })
  )
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("intake:write")(async (request: NextRequest, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Quote not found");

      const body = await request.json().catch(() => ({}));
      const data = UpdateQuoteSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const row = await withFirmDb(firmId, async (tx) => {
        const [updated] = await tx
          .update(quotes)
          .set({
            status: data.status ?? undefined,
            items: data.items ?? undefined,
            subtotal: data.subtotal ?? undefined,
            vatAmount: data.vatAmount ?? undefined,
            total: data.total ?? undefined,
            validUntil: data.validUntil ?? undefined,
            notes: data.notes ?? undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(quotes.id, id), eq(quotes.firmId, firmId)))
          .returning();
        return updated ?? null;
      });

      if (!row) throw new NotFoundError("Quote not found");
      return NextResponse.json(row);
    })
  )
);
