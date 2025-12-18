/**
 * Demo Data Seeder - Invoices & Payments
 */

import { db } from "@/lib/db";
import { invoices, payments } from "@/lib/db/schema";
import { DEMO_IDS } from "../ids";
import type { SeederContext } from "../types";

export async function seedInvoices(ctx: SeederContext) {
  const { now } = ctx;

  console.log("  Seeding invoices & payments...");

  // Create invoices
  const invoicesData = [
    // Draft invoices (2)
    {
      id: DEMO_IDS.invoices.inv1,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual,
      matterId: DEMO_IDS.matters.conveyancing,
      invoiceNumber: "INV-2024-001",
      status: "draft" as const,
      invoiceDate: "2024-11-01",
      dueDate: "2024-12-01",
      subtotal: "500.00",
      vatAmount: "100.00",
      vatRate: "20.00",
      total: "600.00",
      paidAmount: "0.00",
      balanceDue: "600.00",
      terms: "Payment due within 30 days",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv2,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company,
      matterId: DEMO_IDS.matters.litigation,
      invoiceNumber: "INV-2024-002",
      status: "draft" as const,
      invoiceDate: "2024-11-05",
      dueDate: "2024-12-05",
      subtotal: "1750.00",
      vatAmount: "350.00",
      vatRate: "20.00",
      total: "2100.00",
      paidAmount: "0.00",
      balanceDue: "2100.00",
      terms: "Payment due within 30 days",
      createdAt: now,
      updatedAt: now,
    },
    // Sent invoices (3)
    {
      id: DEMO_IDS.invoices.inv3,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual3,
      matterId: DEMO_IDS.matters.personalInjuryRTA,
      invoiceNumber: "INV-2024-003",
      status: "sent" as const,
      invoiceDate: "2024-10-15",
      dueDate: "2024-11-15",
      subtotal: "1250.00",
      vatAmount: "250.00",
      vatRate: "20.00",
      total: "1500.00",
      paidAmount: "0.00",
      balanceDue: "1500.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-10-15T10:00:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv4,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company3,
      matterId: DEMO_IDS.matters.commercialShareholder,
      invoiceNumber: "INV-2024-004",
      status: "sent" as const,
      invoiceDate: "2024-10-20",
      dueDate: "2024-11-20",
      subtotal: "3500.00",
      vatAmount: "700.00",
      vatRate: "20.00",
      total: "4200.00",
      paidAmount: "0.00",
      balanceDue: "4200.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-10-20T14:30:00Z"),
      viewedAt: new Date("2024-10-21T09:15:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv5,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual4,
      matterId: DEMO_IDS.matters.employmentDismissal,
      invoiceNumber: "INV-2024-005",
      status: "sent" as const,
      invoiceDate: "2024-10-25",
      dueDate: "2024-11-25",
      subtotal: "2800.00",
      vatAmount: "560.00",
      vatRate: "20.00",
      total: "3360.00",
      paidAmount: "0.00",
      balanceDue: "3360.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-10-25T16:00:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    // Partially paid invoices (2)
    {
      id: DEMO_IDS.invoices.inv6,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company4,
      matterId: DEMO_IDS.matters.litigationContract,
      invoiceNumber: "INV-2024-006",
      status: "partially_paid" as const,
      invoiceDate: "2024-09-15",
      dueDate: "2024-10-15",
      subtotal: "5000.00",
      vatAmount: "1000.00",
      vatRate: "20.00",
      total: "6000.00",
      paidAmount: "3000.00",
      balanceDue: "3000.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-09-15T11:00:00Z"),
      viewedAt: new Date("2024-09-15T15:30:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv7,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual7,
      matterId: DEMO_IDS.matters.familyChild,
      invoiceNumber: "INV-2024-007",
      status: "partially_paid" as const,
      invoiceDate: "2024-09-20",
      dueDate: "2024-10-20",
      subtotal: "4500.00",
      vatAmount: "900.00",
      vatRate: "20.00",
      total: "5400.00",
      paidAmount: "2000.00",
      balanceDue: "3400.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-09-20T09:30:00Z"),
      viewedAt: new Date("2024-09-20T11:45:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    // Paid invoices (3)
    {
      id: DEMO_IDS.invoices.inv8,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual5,
      matterId: DEMO_IDS.matters.personalInjurySlip,
      invoiceNumber: "INV-2024-008",
      status: "paid" as const,
      invoiceDate: "2024-08-10",
      dueDate: "2024-09-10",
      subtotal: "850.00",
      vatAmount: "170.00",
      vatRate: "20.00",
      total: "1020.00",
      paidAmount: "1020.00",
      balanceDue: "0.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-08-10T10:00:00Z"),
      viewedAt: new Date("2024-08-10T14:20:00Z"),
      paidAt: new Date("2024-08-25T11:30:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv9,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.company5,
      matterId: DEMO_IDS.matters.conveyancingRemortgage,
      invoiceNumber: "INV-2024-009",
      status: "paid" as const,
      invoiceDate: "2024-08-05",
      dueDate: "2024-09-05",
      subtotal: "2500.00",
      vatAmount: "500.00",
      vatRate: "20.00",
      total: "3000.00",
      paidAmount: "3000.00",
      balanceDue: "0.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-08-05T09:00:00Z"),
      viewedAt: new Date("2024-08-05T10:15:00Z"),
      paidAt: new Date("2024-08-20T14:00:00Z"),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_IDS.invoices.inv10,
      firmId: DEMO_IDS.firm,
      clientId: DEMO_IDS.clients.individual5,
      matterId: DEMO_IDS.matters.employmentSettlement,
      invoiceNumber: "INV-2024-010",
      status: "paid" as const,
      invoiceDate: "2024-07-20",
      dueDate: "2024-08-20",
      subtotal: "3750.00",
      vatAmount: "750.00",
      vatRate: "20.00",
      total: "4500.00",
      paidAmount: "4500.00",
      balanceDue: "0.00",
      terms: "Payment due within 30 days",
      sentAt: new Date("2024-07-20T10:30:00Z"),
      viewedAt: new Date("2024-07-20T16:00:00Z"),
      paidAt: new Date("2024-08-05T09:45:00Z"),
      createdAt: now,
      updatedAt: now,
    },
  ];

  const createdInvoices = [];
  for (const invoiceData of invoicesData) {
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .onConflictDoUpdate({
        target: invoices.id,
        set: { updatedAt: now },
      })
      .returning();

    createdInvoices.push(invoice);
    console.log(`    Created invoice: ${invoice.invoiceNumber} - ${invoice.status}`);
  }

  // Create payments
  const paymentsData = [
    // Payment for inv6 (partially paid)
    {
      id: DEMO_IDS.payments.pay1,
      firmId: DEMO_IDS.firm,
      invoiceId: DEMO_IDS.invoices.inv6,
      amount: "3000.00",
      method: "bank_transfer" as const,
      paymentDate: "2024-10-01",
      reference: "BACS-123456",
      notes: "Partial payment - balance to follow",
      recordedBy: DEMO_IDS.users.receptionist,
      createdAt: now,
    },
    // Payment for inv7 (partially paid)
    {
      id: DEMO_IDS.payments.pay2,
      firmId: DEMO_IDS.firm,
      invoiceId: DEMO_IDS.invoices.inv7,
      amount: "2000.00",
      method: "card" as const,
      paymentDate: "2024-10-05",
      reference: "CARD-789012",
      notes: "Initial payment via client portal",
      recordedBy: DEMO_IDS.users.receptionist,
      createdAt: now,
    },
    // Payment for inv8 (paid in full)
    {
      id: DEMO_IDS.payments.pay3,
      firmId: DEMO_IDS.firm,
      invoiceId: DEMO_IDS.invoices.inv8,
      amount: "1020.00",
      method: "bank_transfer" as const,
      paymentDate: "2024-08-25",
      reference: "BACS-345678",
      notes: "Full payment received",
      recordedBy: DEMO_IDS.users.receptionist,
      createdAt: now,
    },
    // Payment for inv9 (paid in full)
    {
      id: DEMO_IDS.payments.pay4,
      firmId: DEMO_IDS.firm,
      invoiceId: DEMO_IDS.invoices.inv9,
      amount: "3000.00",
      method: "bank_transfer" as const,
      paymentDate: "2024-08-20",
      reference: "BACS-456789",
      notes: "Remortgage completion payment",
      recordedBy: DEMO_IDS.users.receptionist,
      createdAt: now,
    },
    // Payment for inv10 (paid in full)
    {
      id: DEMO_IDS.payments.pay5,
      firmId: DEMO_IDS.firm,
      invoiceId: DEMO_IDS.invoices.inv10,
      amount: "4500.00",
      method: "bank_transfer" as const,
      paymentDate: "2024-08-05",
      reference: "BACS-567890",
      notes: "Settlement agreement fee paid",
      recordedBy: DEMO_IDS.users.receptionist,
      createdAt: now,
    },
  ];

  const createdPayments = [];
  for (const paymentData of paymentsData) {
    const [payment] = await db
      .insert(payments)
      .values(paymentData)
      .onConflictDoUpdate({
        target: payments.id,
        set: { createdAt: now },
      })
      .returning();

    createdPayments.push(payment);
    console.log(`    Created payment: ${payment.reference} - £${payment.amount}`);
  }

  console.log(`  ✓ Created ${createdInvoices.length} invoices`);
  console.log(`  ✓ Created ${createdPayments.length} payments`);

  return {
    invoices: createdInvoices,
    payments: createdPayments,
    lineItems: [], // Not yet implemented in demo data
  };
}
