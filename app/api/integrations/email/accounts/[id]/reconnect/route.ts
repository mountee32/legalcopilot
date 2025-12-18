import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { emailAccounts } from "@/lib/db/schema";
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
        const [account] = await tx
          .update(emailAccounts)
          .set({
            tokens: body.tokens,
            status: "connected",
            updatedAt: new Date(),
          })
          .where(and(eq(emailAccounts.firmId, firmId), eq(emailAccounts.id, id)))
          .returning();
        return account ?? null;
      });

      if (!row) throw new NotFoundError("Email account not found");

      return NextResponse.json({
        id: row.id,
        status: row.status,
        updatedAt: row.updatedAt,
      });
    })
  )
);
