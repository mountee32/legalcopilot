import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { approvalRequests, matters, timeEntries } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { BulkSubmitTimeEntriesSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("time:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = BulkSubmitTimeEntriesSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const approvalIds = await withFirmDb(firmId, async (tx) => {
        const entries = await tx
          .select({
            id: timeEntries.id,
            matterId: timeEntries.matterId,
            status: timeEntries.status,
          })
          .from(timeEntries)
          .where(and(eq(timeEntries.firmId, firmId), inArray(timeEntries.id, data.ids)));

        if (entries.length !== data.ids.length)
          throw new NotFoundError("One or more time entries not found");
        if (entries.some((e) => e.status !== "draft")) {
          throw new ValidationError("All time entries must be draft to submit");
        }

        const matterIds = Array.from(new Set(entries.map((e) => e.matterId)));
        const mattersFound = await tx
          .select({ id: matters.id })
          .from(matters)
          .where(and(eq(matters.firmId, firmId), inArray(matters.id, matterIds)));

        if (mattersFound.length !== matterIds.length) {
          throw new ValidationError("Matter not found for one or more time entries");
        }

        const existing = await tx
          .select({ entityId: approvalRequests.entityId })
          .from(approvalRequests)
          .where(
            and(
              eq(approvalRequests.firmId, firmId),
              eq(approvalRequests.status, "pending"),
              eq(approvalRequests.action, "time_entry.approve"),
              eq(approvalRequests.entityType, "time_entry"),
              inArray(approvalRequests.entityId as any, data.ids)
            )
          );

        if (existing.length > 0) {
          throw new ValidationError("One or more entries already have a pending approval request");
        }

        await tx
          .update(timeEntries)
          .set({ status: "submitted", updatedAt: new Date() })
          .where(and(eq(timeEntries.firmId, firmId), inArray(timeEntries.id, data.ids)));

        const inserted = await tx
          .insert(approvalRequests)
          .values(
            entries.map((entry) => ({
              firmId,
              sourceType: "user",
              sourceId: user.user.id,
              action: "time_entry.approve",
              summary: "Approve time entry",
              proposedPayload: { timeEntryId: entry.id, matterId: entry.matterId },
              entityType: "time_entry",
              entityId: entry.id,
              updatedAt: new Date(),
            }))
          )
          .returning({ id: approvalRequests.id });

        for (const entry of entries) {
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
            metadata: { bulk: true },
          });
        }

        return inserted.map((r) => r.id);
      });

      return NextResponse.json({ success: true, approvalRequestIds: approvalIds }, { status: 201 });
    })
  )
);
