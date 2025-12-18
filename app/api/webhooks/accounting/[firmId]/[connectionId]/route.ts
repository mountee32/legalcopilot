import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { accountingConnections, accountingSyncEvents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { UuidSchema } from "@/lib/api/schemas";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const firmId = UuidSchema.parse(resolvedParams.firmId);
  const connectionId = UuidSchema.parse(resolvedParams.connectionId);

  const secret = request.headers.get("x-webhook-secret") ?? "";
  const payload = await request.json().catch(() => ({}));

  const entityType = typeof payload?.entityType === "string" ? payload.entityType : undefined;
  const entityId = typeof payload?.entityId === "string" ? payload.entityId : undefined;
  const externalId = typeof payload?.externalId === "string" ? payload.externalId : undefined;
  const status = typeof payload?.status === "string" ? payload.status : "received";

  if (!entityType) throw new ValidationError("Missing entityType");

  await withFirmDb(firmId, async (tx) => {
    const [connection] = await tx
      .select()
      .from(accountingConnections)
      .where(
        and(eq(accountingConnections.firmId, firmId), eq(accountingConnections.id, connectionId))
      );

    if (!connection) throw new ValidationError("Unknown accounting connection");
    if (connection.status !== "connected")
      throw new ValidationError("Accounting connection is not connected");
    if (!secret || secret !== connection.webhookSecret)
      throw new ValidationError("Invalid webhook secret");

    await tx.insert(accountingSyncEvents).values({
      firmId,
      provider: connection.provider,
      entityType,
      entityId: entityId ?? null,
      externalId: externalId ?? null,
      status,
      error: typeof payload?.error === "string" ? payload.error : null,
      updatedAt: new Date(),
    });
  });

  return NextResponse.json({ accepted: true });
});
