import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { accountingConnections } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UuidSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { z } from "zod";

const ReconnectSchema = z.object({
  tokens: z.record(z.unknown()),
});

export const POST = withErrorHandler(
  withAuth(
    withPermission("integrations:write")(async (request: NextRequest, { params, user }) => {
      const id = UuidSchema.parse(params ? (await params).id : undefined);
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = ReconnectSchema.parse(await request.json());

      const row = await withFirmDb(firmId, async (tx) => {
        const [connection] = await tx
          .update(accountingConnections)
          .set({
            tokens: body.tokens,
            status: "connected",
            updatedAt: new Date(),
          })
          .where(and(eq(accountingConnections.firmId, firmId), eq(accountingConnections.id, id)))
          .returning();
        return connection ?? null;
      });

      if (!row) throw new NotFoundError("Accounting connection not found");

      return NextResponse.json({
        id: row.id,
        status: row.status,
        updatedAt: row.updatedAt,
      });
    })
  )
);
