/**
 * Payment factory for creating test payments
 */
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type PaymentMethod = "bank_transfer" | "card" | "cheque" | "cash" | "client_account";

export interface PaymentFactoryOptions {
  id?: string;
  firmId: string;
  invoiceId: string;
  amount: string;
  method?: PaymentMethod;
  paymentDate?: string;
  reference?: string | null;
  notes?: string | null;
  recordedBy?: string | null;
}

export interface TestPayment {
  id: string;
  firmId: string;
  invoiceId: string;
  amount: string;
  method: string;
  paymentDate: string;
  reference: string | null;
}

/**
 * Create a test payment in the database
 */
export async function createPayment(options: PaymentFactoryOptions): Promise<TestPayment> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);

  const paymentData = {
    id,
    firmId: options.firmId,
    invoiceId: options.invoiceId,
    amount: options.amount,
    method: options.method || "bank_transfer",
    paymentDate: options.paymentDate || new Date().toISOString().split("T")[0],
    reference: options.reference ?? `PAY-${suffix}`,
    notes: options.notes ?? null,
    recordedBy: options.recordedBy ?? null,
    createdAt: new Date(),
  };

  const [payment] = await db.insert(payments).values(paymentData).returning();

  return {
    id: payment.id,
    firmId: payment.firmId,
    invoiceId: payment.invoiceId,
    amount: payment.amount,
    method: payment.method,
    paymentDate: payment.paymentDate,
    reference: payment.reference,
  };
}

/**
 * Build payment data without inserting into database
 */
export function buildPaymentData(
  firmId: string,
  invoiceId: string,
  amount: string,
  options: Partial<PaymentFactoryOptions> = {}
): Record<string, unknown> {
  const suffix = Date.now().toString(36);

  return {
    firmId,
    invoiceId,
    amount,
    method: options.method || "bank_transfer",
    paymentDate: options.paymentDate || new Date().toISOString().split("T")[0],
    reference: options.reference ?? `PAY-${suffix}`,
  };
}

/**
 * Create a card payment
 */
export async function createCardPayment(
  firmId: string,
  invoiceId: string,
  amount: string,
  options: Partial<PaymentFactoryOptions> = {}
): Promise<TestPayment> {
  return createPayment({
    ...options,
    firmId,
    invoiceId,
    amount,
    method: "card",
  });
}

/**
 * Create a bank transfer payment
 */
export async function createBankTransferPayment(
  firmId: string,
  invoiceId: string,
  amount: string,
  options: Partial<PaymentFactoryOptions> = {}
): Promise<TestPayment> {
  return createPayment({
    ...options,
    firmId,
    invoiceId,
    amount,
    method: "bank_transfer",
  });
}
