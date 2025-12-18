import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { complianceAlerts } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateAlertSchema } from "@/lib/api/schemas/compliance";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("compliance:write")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Alert not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateAlertSchema.parse(body);

      const alert = await withFirmDb(firmId, async (tx) => {
        // Verify alert exists and belongs to firm
        const [existing] = await tx
          .select()
          .from(complianceAlerts)
          .where(and(eq(complianceAlerts.id, id), eq(complianceAlerts.firmId, firmId)))
          .limit(1);

        if (!existing) throw new NotFoundError("Alert not found");

        // Prepare update data
        const updateData: any = {
          status: data.status,
          updatedAt: new Date(),
        };

        // Set timestamp and user based on status
        const now = new Date();
        if (data.status === "acknowledged" && !existing.acknowledgedAt) {
          updateData.acknowledgedAt = now;
          updateData.acknowledgedBy = user.user.id;
        } else if (
          (data.status === "resolved" || data.status === "dismissed") &&
          !existing.resolvedAt
        ) {
          updateData.resolvedAt = now;
          updateData.resolvedBy = user.user.id;
          updateData.resolutionNotes = data.resolutionNotes || null;
        }

        // Update alert
        const [updated] = await tx
          .update(complianceAlerts)
          .set(updateData)
          .where(and(eq(complianceAlerts.id, id), eq(complianceAlerts.firmId, firmId)))
          .returning();

        return updated;
      });

      if (!alert) throw new NotFoundError("Alert not found");

      return NextResponse.json({
        id: alert.id,
        firmId: alert.firmId,
        ruleId: alert.ruleId,
        matterId: alert.matterId,
        userId: alert.userId,
        priority: alert.priority,
        status: alert.status,
        title: alert.title,
        message: alert.message,
        context: alert.context,
        triggeredAt: alert.triggeredAt.toISOString(),
        acknowledgedAt: alert.acknowledgedAt?.toISOString() || null,
        acknowledgedBy: alert.acknowledgedBy,
        resolvedAt: alert.resolvedAt?.toISOString() || null,
        resolvedBy: alert.resolvedBy,
        resolutionNotes: alert.resolutionNotes,
        createdAt: alert.createdAt.toISOString(),
        updatedAt: alert.updatedAt.toISOString(),
      });
    })
  )
);
