import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

/**
 * GET /api/firm/members
 *
 * Returns all members of the current user's firm.
 * Used for assignee dropdowns in task forms.
 */
export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (_request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const members = await withFirmDb(firmId, async (tx) => {
        const rows = await tx
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.firmId, firmId));

        return rows;
      });

      return NextResponse.json({ members });
    })
  )
);
