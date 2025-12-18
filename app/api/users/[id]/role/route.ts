import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { roles, users } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { AssignRoleSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("users:write")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("User not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const { roleId } = AssignRoleSchema.parse(body);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [targetUser] = await tx
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.id, id), eq(users.firmId, firmId)))
          .limit(1);

        if (!targetUser) throw new NotFoundError("User not found");

        const [role] = await tx
          .select({ id: roles.id })
          .from(roles)
          .where(and(eq(roles.id, roleId), eq(roles.firmId, firmId)))
          .limit(1);

        if (!role) throw new ValidationError("Role not found for firm");

        const [row] = await tx
          .update(users)
          .set({ roleId })
          .where(and(eq(users.id, id), eq(users.firmId, firmId)))
          .returning({ id: users.id, roleId: users.roleId });

        return row;
      });

      return NextResponse.json({ userId: updated.id, roleId: updated.roleId });
    })
  )
);
