import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { timeEntries } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateTimeEntrySchema } from "@/lib/api/schemas";
import { formatMoney, parseMoney, roundMoney } from "@/lib/billing/money";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("time:read")(async (_request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Time entry not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const row = await withFirmDb(firmId, async (tx) => {
        const [entry] = await tx
          .select()
          .from(timeEntries)
          .where(and(eq(timeEntries.id, id), eq(timeEntries.firmId, firmId)))
          .limit(1);
        return entry ?? null;
      });

      if (!row) throw new NotFoundError("Time entry not found");
      return NextResponse.json(row);
    })
  )
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("time:write")(async (request: NextRequest, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Time entry not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json().catch(() => ({}));
      const data = UpdateTimeEntrySchema.parse(body);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({
            durationMinutes: timeEntries.durationMinutes,
            hourlyRate: timeEntries.hourlyRate,
            status: timeEntries.status,
          })
          .from(timeEntries)
          .where(and(eq(timeEntries.id, id), eq(timeEntries.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Time entry not found");
        if (current.status !== "draft") {
          throw new ValidationError("Only draft time entries can be edited");
        }

        const durationMinutes = data.durationMinutes ?? current.durationMinutes;
        const hourlyRate = parseMoney(data.hourlyRate ?? current.hourlyRate);
        const amount = roundMoney((durationMinutes / 60) * hourlyRate);

        const [row] = await tx
          .update(timeEntries)
          .set({
            workDate: data.workDate ?? undefined,
            description: data.description ?? undefined,
            durationMinutes: data.durationMinutes ?? undefined,
            hourlyRate: data.hourlyRate ?? undefined,
            amount: formatMoney(amount),
            source: data.source ?? undefined,
            isBillable: data.isBillable ?? undefined,
            activityCode: data.activityCode ?? undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(timeEntries.id, id), eq(timeEntries.firmId, firmId)))
          .returning();

        return row ?? null;
      });

      if (!updated) throw new NotFoundError("Time entry not found");
      return NextResponse.json(updated);
    })
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("time:write")(async (_request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Time entry not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({ status: timeEntries.status })
          .from(timeEntries)
          .where(and(eq(timeEntries.id, id), eq(timeEntries.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Time entry not found");
        if (current.status !== "draft") {
          throw new ValidationError("Only draft time entries can be deleted");
        }

        await tx
          .delete(timeEntries)
          .where(and(eq(timeEntries.id, id), eq(timeEntries.firmId, firmId)));
      });

      return NextResponse.json({ success: true });
    })
  )
);
