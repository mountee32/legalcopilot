import { and, eq } from "drizzle-orm";
import type { db } from "@/lib/db";
import { emails, signatureRequests, timeEntries } from "@/lib/db/schema";

type ApprovalRow = {
  firmId: string;
  action: string;
  proposedPayload: unknown;
  entityId: string | null;
};

type TimeEntryApprovePayload = {
  timeEntryId?: string;
};

export async function applyRejectionSideEffectsIfSupported(
  tx: typeof db,
  approval: ApprovalRow
): Promise<void> {
  if (approval.action === "time_entry.approve") {
    const payload = approval.proposedPayload as TimeEntryApprovePayload;
    const timeEntryId = payload?.timeEntryId ?? approval.entityId ?? null;
    if (!timeEntryId) return;

    await tx
      .update(timeEntries)
      .set({ status: "draft", updatedAt: new Date() })
      .where(and(eq(timeEntries.id, timeEntryId), eq(timeEntries.firmId, approval.firmId)));
    return;
  }

  if (approval.action === "signature_request.send") {
    const signatureRequestId = approval.entityId ?? null;
    if (!signatureRequestId) return;

    await tx
      .update(signatureRequests)
      .set({ status: "draft", externalId: null, sentAt: null, updatedAt: new Date() })
      .where(
        and(
          eq(signatureRequests.id, signatureRequestId),
          eq(signatureRequests.firmId, approval.firmId)
        )
      );
  }

  if (approval.action === "email.send") {
    const emailId = approval.entityId ?? null;
    if (!emailId) return;

    await tx
      .update(emails)
      .set({ status: "draft", approvalRequestId: null, updatedAt: new Date() })
      .where(and(eq(emails.id, emailId), eq(emails.firmId, approval.firmId)));
  }
}
