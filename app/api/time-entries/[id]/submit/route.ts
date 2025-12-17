import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { approvalRequests, matters, timeEntries } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("time:write")(async (_request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Time entry not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const approval = await withFirmDb(firmId, async (tx) => {
        const [entry] = await tx
          .select({
            id: timeEntries.id,
            matterId: timeEntries.matterId,
            feeEarnerId: timeEntries.feeEarnerId,
            workDate: timeEntries.workDate,
            description: timeEntries.description,
            durationMinutes: timeEntries.durationMinutes,
            hourlyRate: timeEntries.hourlyRate,
            amount: timeEntries.amount,
            status: timeEntries.status,
          })
          .from(timeEntries)
          .where(and(eq(timeEntries.id, id), eq(timeEntries.firmId, firmId)))
          .limit(1);

        if (!entry) throw new NotFoundError("Time entry not found");
        if (entry.status !== "draft")
          throw new ValidationError("Only draft entries can be submitted");

        const [matter] = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.id, entry.matterId), eq(matters.firmId, firmId)))
          .limit(1);
        if (!matter) throw new ValidationError("Matter not found for time entry");

        const [existing] = await tx
          .select({ id: approvalRequests.id })
          .from(approvalRequests)
          .where(
            and(
              eq(approvalRequests.firmId, firmId),
              eq(approvalRequests.status, "pending"),
              eq(approvalRequests.action, "time_entry.approve"),
              eq(approvalRequests.entityType, "time_entry"),
              eq(approvalRequests.entityId, id)
            )
          )
          .limit(1);

        if (existing)
          throw new ValidationError("An approval request already exists for this time entry");

        await tx
          .update(timeEntries)
          .set({ status: "submitted", updatedAt: new Date() })
          .where(and(eq(timeEntries.id, id), eq(timeEntries.firmId, firmId)));

        const [approval] = await tx
          .insert(approvalRequests)
          .values({
            firmId,
            sourceType: "user",
            sourceId: user.user.id,
            action: "time_entry.approve",
            summary: "Approve time entry",
            proposedPayload: {
              timeEntryId: entry.id,
              matterId: entry.matterId,
              feeEarnerId: entry.feeEarnerId,
              workDate: entry.workDate,
              description: entry.description,
              durationMinutes: entry.durationMinutes,
              hourlyRate: entry.hourlyRate,
              amount: entry.amount,
            },
            entityType: "time_entry",
            entityId: entry.id,
            updatedAt: new Date(),
          })
          .returning();

        if (!approval) throw new ValidationError("Failed to create approval request");

        await createTimelineEvent(tx, {
          firmId,
          matterId: entry.matterId,
          type: "time_entry_submitted",
          title: "Time entry submitted",
          actorType: "user",
          actorId: user.user.id,
          entityType: "time_entry",
          entityId: entry.id,
          occurredAt: new Date(),
          metadata: { approvalRequestId: approval.id },
        });

        return approval;
      });

      return NextResponse.json(approval, { status: 201 });
    })
  )
);
