import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { calendarAccounts, calendarProviderEvents } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { UuidSchema } from "@/lib/api/schemas";
import { ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";

export const POST = withErrorHandler(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const firmId = UuidSchema.parse(resolvedParams.firmId);
  const accountId = UuidSchema.parse(resolvedParams.accountId);

  const secret = request.headers.get("x-webhook-secret") ?? "";
  const externalEventIdHeader = request.headers.get("x-event-id") ?? undefined;

  const payload = await request.json().catch(() => ({}));
  const externalEventId =
    externalEventIdHeader ?? (typeof payload?.id === "string" ? payload.id : undefined);
  if (!externalEventId) throw new ValidationError("Missing external event id");

  const result = await withFirmDb(firmId, async (tx) => {
    const [account] = await tx
      .select()
      .from(calendarAccounts)
      .where(and(eq(calendarAccounts.firmId, firmId), eq(calendarAccounts.id, accountId)));

    if (!account) throw new ValidationError("Unknown calendar account");
    if (account.status !== "connected")
      throw new ValidationError("Calendar account is not connected");
    if (!secret || secret !== account.webhookSecret)
      throw new ValidationError("Invalid webhook secret");

    await tx
      .insert(calendarProviderEvents)
      .values({
        firmId,
        accountId: account.id,
        provider: account.provider,
        externalEventId,
        payload,
        processedOk: false,
      })
      .onConflictDoNothing({
        target: [
          calendarProviderEvents.firmId,
          calendarProviderEvents.provider,
          calendarProviderEvents.externalEventId,
        ],
      });

    return { provider: account.provider };
  });

  return NextResponse.json({ accepted: true, provider: result.provider });
});
