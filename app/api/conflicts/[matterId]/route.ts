import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { conflictChecks, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("conflicts:read")(async (_request, { params, user }) => {
      const matterId = params?.matterId;
      if (!matterId) throw new NotFoundError("Matter not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, matterId), eq(matters.firmId, firmId)))
          .limit(1);
        if (!matter) throw new NotFoundError("Matter not found");

        const [check] = await tx
          .select()
          .from(conflictChecks)
          .where(and(eq(conflictChecks.firmId, firmId), eq(conflictChecks.matterId, matterId)))
          .limit(1);
        return check ?? null;
      });

      if (!row) throw new NotFoundError("Conflict check not found");
      return NextResponse.json(row);
    })
  )
);
