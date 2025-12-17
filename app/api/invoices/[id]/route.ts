import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { invoiceLineItems, invoices } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { UpdateInvoiceSchema } from "@/lib/api/schemas";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const GET = withErrorHandler(
  withAuth(
    withPermission("billing:read")(async (_request, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Invoice not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        const [invoice] = await tx
          .select()
          .from(invoices)
          .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
          .limit(1);
        if (!invoice) return null;

        const items = await tx
          .select()
          .from(invoiceLineItems)
          .where(and(eq(invoiceLineItems.invoiceId, id), eq(invoiceLineItems.firmId, firmId)))
          .orderBy(invoiceLineItems.createdAt);

        return { invoice, items };
      });

      if (!result) throw new NotFoundError("Invoice not found");
      return NextResponse.json(result);
    })
  )
);

export const PATCH = withErrorHandler(
  withAuth(
    withPermission("billing:write")(async (request: NextRequest, { params, user }) => {
      const id = params?.id;
      if (!id) throw new NotFoundError("Invoice not found");

      const body = await request.json().catch(() => ({}));
      const data = UpdateInvoiceSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const updated = await withFirmDb(firmId, async (tx) => {
        const [current] = await tx
          .select({ status: invoices.status })
          .from(invoices)
          .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
          .limit(1);

        if (!current) throw new NotFoundError("Invoice not found");
        if (current.status !== "draft")
          throw new ValidationError("Only draft invoices can be updated");

        const [row] = await tx
          .update(invoices)
          .set({
            dueDate: data.dueDate ?? undefined,
            terms: data.terms ?? undefined,
            notes: data.notes ?? undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
          .returning();

        return row ?? null;
      });

      if (!updated) throw new NotFoundError("Invoice not found");
      return NextResponse.json(updated);
    })
  )
);
