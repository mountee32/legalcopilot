import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import type { db } from "@/lib/db";
import {
  clients,
  invoiceLineItems,
  invoiceSequences,
  invoices,
  matters,
  timeEntries,
} from "@/lib/db/schema";
import { formatMoney, parseMoney, roundMoney } from "@/lib/billing/money";
import { createTimelineEvent } from "@/lib/timeline/createEvent";

export type GenerateInvoiceInput = {
  firmId: string;
  clientId: string;
  matterId?: string;
  timeEntryIds: string[];
  additionalItems?: Array<{ description: string; amount: string }>;
  notes?: string;
  invoiceDate: Date;
  dueDate: Date;
  vatRate?: string;
};

function buildInvoiceNumber(allocated: number, date: Date): string {
  const year = date.getUTCFullYear();
  const seq = String(allocated).padStart(4, "0");
  return `INV-${year}-${seq}`;
}

export async function generateInvoiceTx(
  tx: typeof db,
  input: GenerateInvoiceInput
): Promise<{ invoiceId: string; invoiceNumber: string }> {
  const [client] = await tx
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, input.clientId), eq(clients.firmId, input.firmId)))
    .limit(1);

  if (!client) throw new Error("Client not found");

  if (input.matterId) {
    const [matter] = await tx
      .select({ id: matters.id })
      .from(matters)
      .where(and(eq(matters.id, input.matterId), eq(matters.firmId, input.firmId)))
      .limit(1);

    if (!matter) throw new Error("Matter not found");
  }

  const entries = await tx
    .select({
      id: timeEntries.id,
      matterId: timeEntries.matterId,
      amount: timeEntries.amount,
      description: timeEntries.description,
      status: timeEntries.status,
      invoiceId: timeEntries.invoiceId,
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.firmId, input.firmId),
        inArray(timeEntries.id, input.timeEntryIds),
        eq(timeEntries.status, "approved"),
        isNull(timeEntries.invoiceId)
      )
    );

  if (entries.length !== input.timeEntryIds.length) {
    throw new Error("One or more time entries not eligible for invoicing");
  }

  const matterIds = Array.from(new Set(entries.map((e) => e.matterId)));
  const matterRows = await tx
    .select({ id: matters.id, clientId: matters.clientId })
    .from(matters)
    .where(and(eq(matters.firmId, input.firmId), inArray(matters.id, matterIds)));

  if (matterRows.length !== matterIds.length)
    throw new Error("Matter not found for one or more entries");
  if (matterRows.some((m) => m.clientId !== input.clientId)) {
    throw new Error("One or more time entries belong to a different client");
  }

  if (input.matterId && entries.some((e) => e.matterId !== input.matterId)) {
    throw new Error("One or more time entries belong to a different matter");
  }

  await tx
    .insert(invoiceSequences)
    .values({ firmId: input.firmId, nextNumber: 1, updatedAt: new Date() })
    .onConflictDoNothing({ target: invoiceSequences.firmId });

  const [seqRow] = await tx
    .update(invoiceSequences)
    .set({ nextNumber: sql`${invoiceSequences.nextNumber} + 1`, updatedAt: new Date() })
    .where(eq(invoiceSequences.firmId, input.firmId))
    .returning({ nextNumber: invoiceSequences.nextNumber });

  const allocated = Number(seqRow?.nextNumber ?? 1) - 1;
  const invoiceNumber = buildInvoiceNumber(allocated, input.invoiceDate);

  const timeSubtotal = entries.reduce((sum, e) => sum + parseMoney(e.amount), 0);
  const manualSubtotal = (input.additionalItems ?? []).reduce(
    (sum, item) => sum + parseMoney(item.amount),
    0
  );
  const subtotal = roundMoney(timeSubtotal + manualSubtotal);

  const vatRateStr = input.vatRate ?? "20.00";
  const vatRate = parseMoney(vatRateStr) / 100;
  const vatAmount = roundMoney(subtotal * vatRate);
  const total = roundMoney(subtotal + vatAmount);

  const [invoice] = await tx
    .insert(invoices)
    .values({
      firmId: input.firmId,
      invoiceNumber,
      clientId: input.clientId,
      matterId: input.matterId ?? null,
      status: "draft",
      invoiceDate: input.invoiceDate.toISOString().split("T")[0],
      dueDate: input.dueDate.toISOString().split("T")[0],
      subtotal: formatMoney(subtotal),
      vatAmount: formatMoney(vatAmount),
      vatRate: vatRateStr,
      total: formatMoney(total),
      paidAmount: "0",
      balanceDue: formatMoney(total),
      notes: input.notes ?? null,
      updatedAt: new Date(),
    })
    .returning({ id: invoices.id });

  if (!invoice) throw new Error("Failed to create invoice");

  await tx.insert(invoiceLineItems).values([
    ...entries.map((e) => ({
      firmId: input.firmId,
      invoiceId: invoice.id,
      description: e.description,
      amount: e.amount,
      sourceType: "time_entry",
      sourceId: e.id,
      metadata: { timeEntryId: e.id, matterId: e.matterId },
    })),
    ...(input.additionalItems ?? []).map((item) => ({
      firmId: input.firmId,
      invoiceId: invoice.id,
      description: item.description,
      amount: item.amount,
      sourceType: "manual",
      sourceId: null,
      metadata: null,
    })),
  ]);

  await tx
    .update(timeEntries)
    .set({ invoiceId: invoice.id, status: "billed", updatedAt: new Date() })
    .where(and(eq(timeEntries.firmId, input.firmId), inArray(timeEntries.id, input.timeEntryIds)));

  for (const matterId of matterIds) {
    await createTimelineEvent(tx, {
      firmId: input.firmId,
      matterId,
      type: "invoice_generated",
      title: "Invoice generated",
      actorType: "system",
      actorId: null,
      entityType: "invoice",
      entityId: invoice.id,
      occurredAt: new Date(),
      metadata: { invoiceNumber },
    });
  }

  return { invoiceId: invoice.id, invoiceNumber };
}
