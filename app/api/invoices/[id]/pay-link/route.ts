import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { invoices } from "@/lib/db/schema";
import { withFirmDb } from "@/lib/db/tenant";
import { getOrCreateFirmIdForUser } from "@/lib/tenancy";
import { withAuth } from "@/middleware/withAuth";
import { NotFoundError, ValidationError, withErrorHandler } from "@/middleware/withErrorHandler";
import { withPermission } from "@/middleware/withPermission";
import { generatePaymentToken, calculateExpiry } from "@/lib/billing/payment-link";

/**
 * POST /api/invoices/[id]/pay-link
 *
 * Generate a secure payment link for an invoice.
 * Returns a public URL that clients can use to view and pay the invoice.
 */
export const POST = withErrorHandler(
  withAuth(
    withPermission("billing:write")(async (_request, { params, user }) => {
      const id = params ? (await params).id : undefined;
      if (!id) throw new NotFoundError("Invoice not found");

      const firmId = await getOrCreateFirmIdForUser(user.user.id);

      const result = await withFirmDb(firmId, async (tx) => {
        const [invoice] = await tx
          .select({
            id: invoices.id,
            status: invoices.status,
            paymentLinkToken: invoices.paymentLinkToken,
            paymentLinkExpiresAt: invoices.paymentLinkExpiresAt,
          })
          .from(invoices)
          .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
          .limit(1);

        if (!invoice) throw new NotFoundError("Invoice not found");

        if (invoice.status === "paid") {
          throw new ValidationError("Cannot generate payment link for paid invoices");
        }

        if (invoice.status === "written_off") {
          throw new ValidationError("Cannot generate payment link for written-off invoices");
        }

        // Generate new token and expiry
        const token = generatePaymentToken();
        const expiresAt = calculateExpiry(72); // 3 days

        // Update invoice with payment link
        const [updated] = await tx
          .update(invoices)
          .set({
            paymentLinkToken: token,
            paymentLinkExpiresAt: expiresAt,
            updatedAt: new Date(),
          })
          .where(and(eq(invoices.id, id), eq(invoices.firmId, firmId)))
          .returning({
            id: invoices.id,
            token: invoices.paymentLinkToken,
            expiresAt: invoices.paymentLinkExpiresAt,
          });

        if (!updated) throw new NotFoundError("Invoice not found");

        return updated;
      });

      // Generate public payment URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const paymentUrl = `${baseUrl}/public/pay/${result.token}`;

      return NextResponse.json(
        {
          paymentUrl,
          token: result.token,
          expiresAt: result.expiresAt,
        },
        { status: 201 }
      );
    })
  )
);
