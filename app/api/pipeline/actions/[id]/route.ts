/**
 * PATCH /api/pipeline/actions/[id]
 *
 * Resolve a pipeline action — accept, dismiss, or mark as executed/failed.
 * When accepting create_task or create_deadline actions, executes side effects
 * (creates actual tasks or calendar events).
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { pipelineActions } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { withErrorHandler, NotFoundError, ValidationError } from "@/middleware/withErrorHandler";
import { ResolveActionSchema } from "@/lib/api/schemas/pipeline";
import { executeActionSideEffects } from "./execute";

const VALID_STATUSES = ["accepted", "dismissed", "executed", "failed", "pending"] as const;

export const PATCH = withErrorHandler(
  withAuth(async (request, { params, user }) => {
    const actionId = params ? (await params).id : undefined;
    if (!actionId) throw new NotFoundError("Action ID required");

    const firmId = await getOrCreateFirmIdForUser(user.user.id);
    const body = ResolveActionSchema.parse(await request.json());

    if (!VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
      throw new ValidationError(`Invalid status: ${body.status}`);
    }

    const result = await withFirmDb(firmId, async (tx) => {
      const [action] = await tx
        .select()
        .from(pipelineActions)
        .where(and(eq(pipelineActions.id, actionId), eq(pipelineActions.firmId, firmId)))
        .limit(1);

      if (!action) throw new NotFoundError("Action not found");

      const [updated] = await tx
        .update(pipelineActions)
        .set({
          status: body.status as "accepted" | "dismissed" | "executed" | "failed" | "pending",
          resolvedBy: user.user.id,
          resolvedAt: new Date(),
        })
        .where(eq(pipelineActions.id, actionId))
        .returning();

      // Execute side effects for accepted create_task / create_deadline actions
      let sideEffectExecuted = false;
      if (body.status === "accepted") {
        try {
          const result = await executeActionSideEffects(tx, action, user.user.id);
          sideEffectExecuted = result.executed;
          if (result.error) {
            await tx
              .update(pipelineActions)
              .set({ error: result.error })
              .where(eq(pipelineActions.id, actionId));
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          await tx
            .update(pipelineActions)
            .set({ error: errorMsg })
            .where(eq(pipelineActions.id, actionId));
        }
      }

      return { ...updated, sideEffectExecuted };
    });

    return NextResponse.json(result);
  })
);
