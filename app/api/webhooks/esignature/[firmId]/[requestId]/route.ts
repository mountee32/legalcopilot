import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { esignatureProviderEvents, signatureRequests } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { UuidSchema } from "@/lib/api/schemas";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const firmId = UuidSchema.parse(resolvedParams.firmId);
  const requestId = UuidSchema.parse(resolvedParams.requestId);

  const configuredSecret = process.env.ESIGNATURE_WEBHOOK_SECRET;
  const secret = request.headers.get("x-webhook-secret") ?? "";
  if (!configuredSecret) throw new ValidationError("ESIGNATURE_WEBHOOK_SECRET is not configured");
  if (secret !== configuredSecret) throw new ValidationError("Invalid webhook secret");

  const externalEventIdHeader = request.headers.get("x-event-id") ?? undefined;
  const payload = await request.json().catch(() => ({}));

  const externalEventId =
    externalEventIdHeader ?? (typeof payload?.id === "string" ? payload.id : undefined);
  if (!externalEventId) throw new ValidationError("Missing external event id");

  const status =
    typeof payload?.status === "string"
      ? (payload.status as string)
      : typeof payload?.event === "string"
        ? (payload.event as string)
        : undefined;

  await withFirmDb(firmId, async (tx) => {
    const [sig] = await tx
      .select()
      .from(signatureRequests)
      .where(and(eq(signatureRequests.firmId, firmId), eq(signatureRequests.id, requestId)))
      .limit(1);

    if (!sig) throw new ValidationError("Unknown signature request");

    await tx
      .insert(esignatureProviderEvents)
      .values({
        firmId,
        requestId: sig.id,
        provider: sig.provider,
        externalEventId,
        payload,
        processedOk: false,
      })
      .onConflictDoNothing({
        target: [
          esignatureProviderEvents.firmId,
          esignatureProviderEvents.provider,
          esignatureProviderEvents.externalEventId,
        ],
      });

    const externalId =
      typeof payload?.externalId === "string" ? payload.externalId : sig.externalId;
    const nextStatus =
      status === "completed"
        ? "completed"
        : status === "declined"
          ? "declined"
          : status === "voided"
            ? "voided"
            : null;

    if (externalId || nextStatus) {
      await tx
        .update(signatureRequests)
        .set({
          externalId: externalId ?? null,
          status: (nextStatus ?? sig.status) as any,
          completedAt: nextStatus === "completed" ? new Date() : sig.completedAt,
          updatedAt: new Date(),
        })
        .where(and(eq(signatureRequests.id, sig.id), eq(signatureRequests.firmId, firmId)));
    }
  });

  return NextResponse.json({ accepted: true });
});
