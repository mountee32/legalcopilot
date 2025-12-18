import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { signatureRequests } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UuidSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("integrations:read")(async (_request: NextRequest, { params, user }) => {
      const id = UuidSchema.parse(params ? (await params).id : undefined);
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [sig] = await tx
          .select()
          .from(signatureRequests)
          .where(and(eq(signatureRequests.firmId, firmId), eq(signatureRequests.id, id)));
        return sig ?? null;
      });

      if (!row) throw new NotFoundError("Signature request not found");
      return NextResponse.json(row);
    })
  )
);
