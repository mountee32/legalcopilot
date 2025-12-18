/**
 * Invoice factory for creating test invoices
 */
import { db } from "@/lib/db";
import { invoices, invoiceLineItems } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "written_off";

export interface InvoiceFactoryOptions {
  id?: string;
  firmId: string;
  clientId: string;
  matterId?: string | null;
  invoiceNumber?: string;
  status?: InvoiceStatus;
  invoiceDate?: string;
  dueDate?: string;
  subtotal?: string;
  vatAmount?: string;
  total?: string;
  paidAmount?: string;
  balanceDue?: string;
  terms?: string | null;
  notes?: string | null;
}

export interface TestInvoice {
  id: string;
  firmId: string;
  clientId: string;
  matterId: string | null;
  invoiceNumber: string;
  status: string;
  subtotal: string;
  vatAmount: string;
  total: string;
  balanceDue: string;
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  // Avoid collisions in large test suites by including a UUID-derived suffix
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `INV-${year}-${suffix}`;
}

/**
 * Calculate VAT and total from subtotal
 */
function calculateTotals(subtotal: string): { vatAmount: string; total: string } {
  const subtotalNum = parseFloat(subtotal);
  const vatAmount = subtotalNum * 0.2; // UK VAT 20%
  const total = subtotalNum + vatAmount;
  return {
    vatAmount: vatAmount.toFixed(2),
    total: total.toFixed(2),
  };
}

/**
 * Create a test invoice in the database
 */
export async function createInvoice(options: InvoiceFactoryOptions): Promise<TestInvoice> {
  const id = options.id || randomUUID();
  const subtotal = options.subtotal ?? "1000.00";
  const { vatAmount, total } = options.vatAmount
    ? { vatAmount: options.vatAmount, total: options.total ?? subtotal }
    : calculateTotals(subtotal);

  const today = new Date().toISOString().split("T")[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const invoiceData = {
    id,
    firmId: options.firmId,
    clientId: options.clientId,
    matterId: options.matterId ?? null,
    invoiceNumber: options.invoiceNumber || generateInvoiceNumber(),
    status: options.status || "draft",
    invoiceDate: options.invoiceDate || today,
    dueDate: options.dueDate || dueDate.toISOString().split("T")[0],
    subtotal,
    vatAmount,
    total,
    paidAmount: options.paidAmount ?? "0.00",
    balanceDue: options.balanceDue ?? total,
    terms: options.terms ?? null,
    notes: options.notes ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [invoice] = await db.insert(invoices).values(invoiceData).returning();

  return {
    id: invoice.id,
    firmId: invoice.firmId,
    clientId: invoice.clientId,
    matterId: invoice.matterId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    subtotal: invoice.subtotal,
    vatAmount: invoice.vatAmount,
    total: invoice.total,
    balanceDue: invoice.balanceDue,
  };
}

/**
 * Build invoice data without inserting into database
 */
export function buildInvoiceData(
  firmId: string,
  clientId: string,
  options: Partial<InvoiceFactoryOptions> = {}
): Record<string, unknown> {
  const subtotal = options.subtotal ?? "1000.00";
  const { vatAmount, total } = calculateTotals(subtotal);

  return {
    firmId,
    clientId,
    matterId: options.matterId ?? null,
    invoiceNumber: options.invoiceNumber || generateInvoiceNumber(),
    status: options.status || "draft",
    subtotal,
    vatAmount,
    total,
    balanceDue: total,
  };
}

/**
 * Create a sent invoice
 */
export async function createSentInvoice(
  firmId: string,
  clientId: string,
  options: Partial<InvoiceFactoryOptions> = {}
): Promise<TestInvoice> {
  return createInvoice({
    ...options,
    firmId,
    clientId,
    status: "sent",
  });
}

/**
 * Add a line item to an invoice
 */
export async function addInvoiceLineItem(
  firmId: string,
  invoiceId: string,
  options: {
    description?: string;
    amount?: string;
    sourceType?: string;
    sourceId?: string;
  } = {}
): Promise<{ id: string; description: string; amount: string }> {
  const [lineItem] = await db
    .insert(invoiceLineItems)
    .values({
      firmId,
      invoiceId,
      description: options.description || "Professional services",
      amount: options.amount || "100.00",
      sourceType: options.sourceType ?? null,
      sourceId: options.sourceId ?? null,
      createdAt: new Date(),
    })
    .returning();

  return {
    id: lineItem.id,
    description: lineItem.description,
    amount: lineItem.amount,
  };
}
