import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { invoices, invoiceLineItems, firms, clients } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { isPaymentLinkValid } from "@/lib/billing/payment-link";

/**
 * GET /api/public/pay/[token]
 *
 * Public endpoint (no authentication required) to retrieve invoice details
 * for payment. Returns sanitized invoice data without exposing sensitive firm information.
 *
 * This endpoint is accessed by clients through payment links sent via email.
 */
export const GET = withErrorHandler(async (_request, { params }) => {
  const token = params ? (await params).token : undefined;
  if (!token) throw new NotFoundError("Payment link not found");

  const result = await db.transaction(async (tx) => {
    // Find invoice by payment link token
    const [invoice] = await tx
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        total: invoices.total,
        balanceDue: invoices.balanceDue,
        status: invoices.status,
        paymentLinkExpiresAt: invoices.paymentLinkExpiresAt,
        firmId: invoices.firmId,
        clientId: invoices.clientId,
      })
      .from(invoices)
      .where(eq(invoices.paymentLinkToken, token))
      .limit(1);

    if (!invoice) throw new NotFoundError("Payment link not found");

    // Verify link is still valid
    if (!isPaymentLinkValid(invoice.paymentLinkExpiresAt)) {
      throw new ValidationError("Payment link has expired");
    }

    // Get firm details (sanitized)
    const [firm] = await tx
      .select({
        name: firms.name,
        email: firms.email,
      })
      .from(firms)
      .where(eq(firms.id, invoice.firmId))
      .limit(1);

    if (!firm) throw new NotFoundError("Firm not found");

    // Get client details (for reference)
    const [client] = await tx
      .select({
        name: clients.name,
      })
      .from(clients)
      .where(eq(clients.id, invoice.clientId))
      .limit(1);

    // Get invoice line items
    const items = await tx
      .select({
        description: invoiceLineItems.description,
        amount: invoiceLineItems.amount,
      })
      .from(invoiceLineItems)
      .where(
        and(eq(invoiceLineItems.invoiceId, invoice.id), eq(invoiceLineItems.firmId, invoice.firmId))
      )
      .orderBy(invoiceLineItems.createdAt);

    return {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      total: invoice.total,
      balanceDue: invoice.balanceDue,
      status: invoice.status,
      firmName: firm.name,
      firmEmail: firm.email,
      clientName: client?.name || "Client",
      items: items.map((item) => ({
        description: item.description,
        amount: item.amount,
      })),
    };
  });

  return NextResponse.json(result);
});
