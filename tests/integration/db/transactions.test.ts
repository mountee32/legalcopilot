// @vitest-environment node
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, invoices, invoiceLineItems } from "@/lib/db/schema";
import { setupFreshFirmPerTest } from "@tests/integration/setup";

describe("DB Integrity - Transactions", () => {
  const ctx = setupFreshFirmPerTest();

  it("rolls back all writes on thrown error", async () => {
    const reference = `CLI-TX-${Date.now()}`;

    await expect(
      db.transaction(async (tx) => {
        await tx.insert(clients).values({
          firmId: ctx.firmId,
          reference,
          type: "individual",
          status: "active",
          firstName: "Tx",
          lastName: "Rollback",
        });

        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    const created = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.reference, reference));
    expect(created.length).toBe(0);
  });

  it("rolls back invoice insert when a dependent FK insert fails", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const invoiceNumber = `INV-TX-${Date.now()}`;
    const [client] = await db
      .insert(clients)
      .values({
        firmId: ctx.firmId,
        reference: `CLI-TX-${Date.now()}`,
        type: "individual",
        status: "active",
        firstName: "Invoice",
        lastName: "Tx",
      })
      .returning({ id: clients.id });

    await expect(
      db.transaction(async (tx) => {
        await tx.insert(invoices).values({
          firmId: ctx.firmId,
          invoiceNumber,
          clientId: client.id,
          invoiceDate: today,
          dueDate: today,
          subtotal: "100.00",
          vatAmount: "20.00",
          total: "120.00",
          balanceDue: "120.00",
          status: "draft",
        });

        await tx.insert(invoiceLineItems).values({
          firmId: ctx.firmId,
          invoiceId: randomUUID(), // invalid FK
          description: "Line item should fail",
          amount: "100.00",
        });
      })
    ).rejects.toThrow();

    const invoicesWithNumber = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber));
    expect(invoicesWithNumber.length).toBe(0);
  });
});
