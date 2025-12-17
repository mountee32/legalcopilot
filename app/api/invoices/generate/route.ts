import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { clients, invoices } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { GenerateInvoiceSchema } from "@/lib/api/schemas";
import { generateInvoiceTx } from "@/lib/billing/generateInvoice";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";

export const POST = withErrorHandler(
  withAuth(
    withPermission("billing:write")(async (request: NextRequest, { user }) => {
      const body = await request.json().catch(() => ({}));
      const data = GenerateInvoiceSchema.parse(body);

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : new Date();
      const dueDate = data.dueDate
        ? new Date(data.dueDate)
        : new Date(invoiceDate.getTime() + 14 * 86400_000);

      const invoice = await withFirmDb(firmId, async (tx) => {
        const [client] = await tx
          .select({ id: clients.id })
          .from(clients)
          .where(and(eq(clients.id, data.clientId), eq(clients.firmId, firmId)))
          .limit(1);

        if (!client) throw new NotFoundError("Client not found");

        const created = await generateInvoiceTx(tx, {
          firmId,
          clientId: data.clientId,
          matterId: data.matterId,
          timeEntryIds: data.timeEntryIds,
          additionalItems: data.additionalItems,
          notes: data.notes,
          invoiceDate,
          dueDate,
        });

        const [inv] = await tx
          .select()
          .from(invoices)
          .where(and(eq(invoices.firmId, firmId), eq(invoices.id, created.invoiceId)))
          .limit(1);

        return inv ?? null;
      });

      if (!invoice) throw new ValidationError("Failed to generate invoice");
      return NextResponse.json(invoice, { status: 201 });
    })
  )
);
