import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { invoices, timeEntries } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { createTimelineEvent } from "@/lib/timeline/createEvent";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("billing:write")(async (_request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Invoice not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [invoice] = await tx
          .select({
            id: invoices.id,
            status: invoices.status,
            paidAmount: invoices.paidAmount,
            matterId: invoices.matterId,
          })
          .from(invoices)
          .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
          .limit(1);

        if (!invoice) throw new NotFoundError("Invoice not found");
        if (invoice.status !== "draft")
          throw new ValidationError("Only draft invoices can be voided");

        const paid = Number.parseFloat(invoice.paidAmount ?? "0");
        if (paid > 0) throw new ValidationError("Cannot void an invoice with payments");

        const [row] = await tx
          .update(invoices)
          .set({ status: "written_off", balanceDue: sql`'0.00'`, updatedAt: new Date() })
          .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
          .returning();

        const matterIds = new Set<string>();
        if (invoice.matterId) {
          matterIds.add(invoice.matterId);
        } else {
          const rows = await tx
            .select({ matterId: timeEntries.matterId })
            .from(timeEntries)
            .where(and(eq(timeEntries.firmId, firmId), eq(timeEntries.invoiceId, id)));
          for (const r of rows) matterIds.add(r.matterId);
        }

        for (const matterId of matterIds) {
          await createTimelineEvent(tx, {
            firmId,
            matterId,
            type: "invoice_voided",
            title: "Invoice voided",
            actorType: "user",
            actorId: user.user.id,
            entityType: "invoice",
            entityId: id,
            occurredAt: new Date(),
            metadata: {},
          });
        }

        return row ?? null;
      });

      if (!updated) throw new NotFoundError("Invoice not found");
      return NextResponse.json(updated);
    })
  )
);
