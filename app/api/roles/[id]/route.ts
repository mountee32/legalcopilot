import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { roles } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateRoleSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("users:write")(async (request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Role not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateRoleSchema.parse(body);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({ id: roles.id, isSystem: roles.isSystem })
          .from(roles)
          .where(and(eq(roles.id, id), eq(roles.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Role not found");
        if (current.isSystem) throw new ValidationError("System roles cannot be modified");

        if (data.name) {
          const [existing] = await tx
            .select({ id: roles.id })
            .from(roles)
            .where(and(eq(roles.firmId, firmId), eq(roles.name, data.name)))
            .limit(1);

          if (existing && existing.id !== id) throw new ValidationError("Role name already exists");
        }

        const [role] = await tx
          .update(roles)
          .set({
            name: data.name ?? undefined,
            description: data.description ?? undefined,
            permissions: data.permissions ?? undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(roles.id, id), eq(roles.firmId, firmId)))
          .returning();

        return role;
      });

      return NextResponse.json(updated);
    })
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("users:write")(async (_request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Role not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({ id: roles.id, isSystem: roles.isSystem })
          .from(roles)
          .where(and(eq(roles.id, id), eq(roles.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Role not found");
        if (current.isSystem) throw new ValidationError("System roles cannot be deleted");

        await tx.delete(roles).where(and(eq(roles.id, id), eq(roles.firmId, firmId)));
      });

      return NextResponse.json({ success: true });
    })
  )
);
