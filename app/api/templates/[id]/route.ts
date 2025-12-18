import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { templates } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateTemplateSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("templates:read")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Template not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [template] = await tx
          .select()
          .from(templates)
          .where(
            and(eq(templates.id, id), or(eq(templates.firmId, firmId), isNull(templates.firmId))!)
          )
          .limit(1);
        return template ?? null;
      });

      if (!row) throw new NotFoundError("Template not found");
      return NextResponse.json(row);
    })
  )
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("templates:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Template not found");

      const body = await request.json().catch(() => ({}));
      const data = UpdateTemplateSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select()
          .from(templates)
          .where(and(eq(templates.id, id), eq(templates.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Template not found");

        const parentId = current.parentId ?? current.id;
        const nextVersion = (current.version ?? 1) + 1;

        await tx
          .update(templates)
          .set({ isActive: false, updatedAt: new Date() })
          .where(and(eq(templates.id, current.id), eq(templates.firmId, firmId)));

        const [next] = await tx
          .insert(templates)
          .values({
            firmId,
            name: data.name ?? current.name,
            type: current.type,
            category: data.category === undefined ? current.category : data.category,
            content: data.content ?? current.content,
            mergeFields: data.mergeFields === undefined ? current.mergeFields : data.mergeFields,
            isActive: data.isActive ?? current.isActive,
            parentId,
            version: nextVersion,
            createdById: user.user.id,
            updatedAt: new Date(),
          })
          .returning();

        return next ?? null;
      });

      if (!row) throw new NotFoundError("Template not found");
      return NextResponse.json(row);
    })
  )
);
