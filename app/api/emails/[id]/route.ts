import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { emails, matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateEmailSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("emails:read")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Email not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const email = await withFirmDb(firmId, async (tx) => {
        const [row] = await tx
          .select()
          .from(emails)
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)))
          .limit(1);
        return row ?? null;
      });

      if (!email) throw new NotFoundError("Email not found");
      return NextResponse.json(email);
    })
  )
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("emails:write")(async (request: NextRequest, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Email not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateEmailSchema.parse(body);

      const updated = await withFirmDb(firmId, async (tx) => {
        if (data.matterId) {
          const [matter] = await tx
            .select({ id: matters.id })
            .from(matters)
            .where(and(eq(matters.id, data.matterId), eq(matters.firmId, firmId)))
            .limit(1);
          if (!matter) throw new NotFoundError("Matter not found");
        }

        const [row] = await tx
          .update(emails)
          .set({
            matterId: data.matterId ?? undefined,
            status: data.status ?? undefined,
            readAt:
              data.readAt === undefined
                ? undefined
                : data.readAt === null
                  ? null
                  : new Date(data.readAt),
            updatedAt: new Date(),
          })
          .where(and(eq(emails.id, id), eq(emails.firmId, firmId)))
          .returning();

        return row ?? null;
      });

      if (!updated) throw new NotFoundError("Email not found");
      return NextResponse.json(updated);
    })
  )
);
