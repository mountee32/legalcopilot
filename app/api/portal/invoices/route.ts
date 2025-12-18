import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, matters } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { withClientPortalAuth } from "@/middleware/withClientPortalAuth";

/**
 * GET /api/portal/invoices
 *
 * List all invoices for the authenticated client.
 * Only returns invoices belonging to the client's account.
 *
 * @requires Portal session authentication
 * @returns Array of invoices with matter details
 */
export const GET = withClientPortalAuth(async (request, { portalSession }) => {
  try {
    // Fetch all invoices for this client
    const clientInvoices = await db
      .select({
        invoice: {
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          invoiceDate: invoices.invoiceDate,
          dueDate: invoices.dueDate,
          subtotal: invoices.subtotal,
          vatAmount: invoices.vatAmount,
          vatRate: invoices.vatRate,
          total: invoices.total,
          paidAmount: invoices.paidAmount,
          balanceDue: invoices.balanceDue,
          sentAt: invoices.sentAt,
          viewedAt: invoices.viewedAt,
          paidAt: invoices.paidAt,
          createdAt: invoices.createdAt,
        },
        matter: {
          id: matters.id,
          reference: matters.reference,
          title: matters.title,
        },
      })
      .from(invoices)
      .leftJoin(matters, eq(invoices.matterId, matters.id))
      .where(eq(invoices.clientId, portalSession.clientId))
      .orderBy(desc(invoices.createdAt));

    return NextResponse.json({
      success: true,
      invoices: clientInvoices,
      count: clientInvoices.length,
    });
  } catch (error) {
    console.error("Error fetching client invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
});
