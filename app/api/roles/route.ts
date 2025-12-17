import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { roles } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { CreateRoleSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("users:read")(async (_request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const rows = await withFirmDb(firmId, (tx) =>
        tx.select().from(roles).where(eq(roles.firmId, firmId)).orderBy(roles.createdAt)
      );

      return NextResponse.json({ roles: rows });
    })
  )
);

export const POST = withErrorHandler(
  withAuth(
    withPermission("users:write")(async (request, { user }) => {
      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = CreateRoleSchema.parse(body);

      const created = await withFirmDb(firmId, async (tx) => {
        const [existing] = await tx
          .select({ id: roles.id })
          .from(roles)
          .where(and(eq(roles.firmId, firmId), eq(roles.name, data.name)))
          .limit(1);

        if (existing) throw new ValidationError("Role name already exists");

        const [role] = await tx
          .insert(roles)
          .values({
            firmId,
            name: data.name,
            description: data.description ?? null,
            permissions: data.permissions,
            isSystem: false,
          })
          .returning();

        return role;
      });

      return NextResponse.json(created, { status: 201 });
    })
  )
);
