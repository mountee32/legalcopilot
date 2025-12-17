import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { leads } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateLeadSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("intake:read")(async (_request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Lead not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const row = await withFirmDb(firmId, async (tx) => {
        const [lead] = await tx
          .select()
          .from(leads)
          .where(and(eq(leads.id, id), eq(leads.firmId, firmId)))
          .limit(1);
        return lead ?? null;
      });

      if (!row) throw new NotFoundError("Lead not found");
      return NextResponse.json(row);
    })
  )
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("intake:write")(async (request: NextRequest, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Lead not found");

      const body = await request.json().catch(() => ({}));
      const data = UpdateLeadSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const row = await withFirmDb(firmId, async (tx) => {
        const [updated] = await tx
          .update(leads)
          .set({
            firstName: data.firstName ?? undefined,
            lastName: data.lastName ?? undefined,
            companyName: data.companyName ?? undefined,
            email: data.email ?? undefined,
            phone: data.phone ?? undefined,
            enquiryType: data.enquiryType ?? undefined,
            message: data.message ?? undefined,
            source: data.source ?? undefined,
            status: data.status ?? undefined,
            score: data.score ?? undefined,
            notes: data.notes ?? undefined,
            assignedTo: data.assignedTo ?? undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(leads.id, id), eq(leads.firmId, firmId)))
          .returning();
        return updated ?? null;
      });

      if (!row) throw new NotFoundError("Lead not found");
      return NextResponse.json(row);
    })
  )
);
