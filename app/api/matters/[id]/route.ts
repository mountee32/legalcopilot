import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { matters } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateMatterSchema } from "@/lib/api/schemas";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { withPermission } from "@/middleware/withPermission";
import { withErrorHandler, NotFoundError } from "@/middleware/withErrorHandler";

export const GET = withErrorHandler(
  withAuth(
    withPermission("cases:read")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Matter not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const matter = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .select()
          .from(matters)
          .where(and(eq(matters.id, id), eq(matters.firmId, firmId)))
          .limit(1);
        return matter ?? null;
      });

      if (!matter) throw new NotFoundError("Matter not found");
      return NextResponse.json(matter);
    })
  )
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Matter not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);
      const body = await request.json();
      const data = UpdateMatterSchema.parse(body);
      const changedFields = Object.entries(data)
        .filter(([, value]) => value !== undefined)
        .map(([key]) => key);

      const matter = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .update(matters)
          .set({
            title: data.title ?? undefined,
            description: data.description ?? undefined,
            feeEarnerId: data.feeEarnerId ?? undefined,
            supervisorId: data.supervisorId ?? undefined,
            status: data.status ?? undefined,
            billingType: data.billingType ?? undefined,
            hourlyRate: data.hourlyRate ?? undefined,
            fixedFee: data.fixedFee ?? undefined,
            estimatedValue: data.estimatedValue ?? undefined,
            keyDeadline: data.keyDeadline ? new Date(data.keyDeadline) : undefined,
            notes: data.notes ?? undefined,
            riskScore: data.riskScore ?? undefined,
            riskFactors: data.riskFactors ?? undefined,
            riskAssessedAt: data.riskAssessedAt ? new Date(data.riskAssessedAt) : undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(matters.id, id), eq(matters.firmId, firmId)))
          .returning();

        if (matter) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: matter.id,
            type: "matter_updated",
            title: "Matter updated",
            actorType: "user",
            actorId: user.user.id,
            entityType: "matter",
            entityId: matter.id,
            occurredAt: new Date(),
            metadata: { changedFields },
          });
        }

        return matter ?? null;
      });

      if (!matter) throw new NotFoundError("Matter not found");
      return NextResponse.json(matter);
    })
  )
);

export const DELETE = withErrorHandler(
  withAuth(
    withPermission("cases:write")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Matter not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const matter = await withFirmDb(firmId, async (tx) => {
        const [matter] = await tx
          .update(matters)
          .set({ status: "archived", updatedAt: new Date() })
          .where(and(eq(matters.id, id), eq(matters.firmId, firmId)))
          .returning();

        if (matter) {
          await createTimelineEvent(tx, {
            firmId,
            matterId: matter.id,
            type: "matter_archived",
            title: "Matter archived",
            actorType: "user",
            actorId: user.user.id,
            entityType: "matter",
            entityId: matter.id,
            occurredAt: new Date(),
          });
        }

        return matter ?? null;
      });

      if (!matter) throw new NotFoundError("Matter not found");
      return NextResponse.json({ success: true });
    })
  )
);
