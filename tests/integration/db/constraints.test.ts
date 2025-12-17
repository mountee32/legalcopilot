// @vitest-environment node
import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, matters, timeEntries, invoices } from "@/lib/db/schema";
import { setupFreshFirmPerTest } from "@tests/integration/setup";
import { createUser } from "@tests/fixtures/factories/user";
import { createFirm } from "@tests/fixtures/factories/firm";
import { cleanupTestFirm } from "@tests/helpers/db";

describe("DB Integrity - Constraints", () => {
  const ctx = setupFreshFirmPerTest();

  it("rejects matter with non-existent clientId (FK)", async () => {
    await expect(
      db.insert(matters).values({
        firmId: ctx.firmId,
        reference: `MAT-${Date.now()}`,
        title: "FK test matter",
        clientId: randomUUID(),
        practiceArea: "conveyancing",
        billingType: "hourly",
      })
    ).rejects.toThrow();
  });

  it("rejects time entry with non-existent matterId (FK)", async () => {
    const user = await createUser({ firmId: ctx.firmId });

    await expect(
      db.insert(timeEntries).values({
        firmId: ctx.firmId,
        matterId: randomUUID(),
        feeEarnerId: user.id,
        workDate: new Date().toISOString().slice(0, 10),
        description: "FK test time entry",
        durationMinutes: 60,
        hourlyRate: "200.00",
        amount: "200.00",
        status: "draft",
      })
    ).rejects.toThrow();
  });

  it("rejects invoice with non-existent clientId (FK)", async () => {
    const today = new Date().toISOString().slice(0, 10);

    await expect(
      db.insert(invoices).values({
        firmId: ctx.firmId,
        invoiceNumber: `INV-${Date.now()}`,
        clientId: randomUUID(),
        invoiceDate: today,
        dueDate: today,
        subtotal: "100.00",
        vatAmount: "20.00",
        total: "120.00",
        balanceDue: "120.00",
        status: "draft",
      })
    ).rejects.toThrow();
  });

  it("rejects deleting a client when matters exist (FK)", async () => {
    const reference = `CLI-${Date.now()}`;
    const [client] = await db
      .insert(clients)
      .values({
        firmId: ctx.firmId,
        reference,
        type: "individual",
        status: "active",
        firstName: "Delete",
        lastName: "Blocked",
        email: `delete-${Date.now()}@test.example.com`,
      })
      .returning({ id: clients.id });

    await db.insert(matters).values({
      firmId: ctx.firmId,
      reference: `MAT-${Date.now()}`,
      title: "Matter keeps client alive",
      clientId: client.id,
      practiceArea: "conveyancing",
      billingType: "hourly",
      status: "lead",
    });

    await expect(db.delete(clients).where(eq(clients.id, client.id))).rejects.toThrow();
  });

  it("rejects deleting a matter when time entries exist (FK)", async () => {
    const reference = `CLI-${Date.now()}`;
    const [client] = await db
      .insert(clients)
      .values({
        firmId: ctx.firmId,
        reference,
        type: "individual",
        status: "active",
        firstName: "Delete",
        lastName: "MatterBlocked",
        email: `delete-matter-${Date.now()}@test.example.com`,
      })
      .returning({ id: clients.id });

    const [matter] = await db
      .insert(matters)
      .values({
        firmId: ctx.firmId,
        reference: `MAT-${Date.now()}`,
        title: "Matter with time entry",
        clientId: client.id,
        practiceArea: "conveyancing",
        billingType: "hourly",
        status: "lead",
      })
      .returning({ id: matters.id });

    const user = await createUser({ firmId: ctx.firmId });
    await db.insert(timeEntries).values({
      firmId: ctx.firmId,
      matterId: matter.id,
      feeEarnerId: user.id,
      workDate: new Date().toISOString().slice(0, 10),
      description: "Work",
      durationMinutes: 30,
      hourlyRate: "200.00",
      amount: "100.00",
      status: "draft",
    });

    await expect(db.delete(matters).where(eq(matters.id, matter.id))).rejects.toThrow();
  });

  it("rejects duplicate client reference within same firm (unique)", async () => {
    const reference = `CLI-UNIQ-${Date.now()}`;
    await db.insert(clients).values({
      firmId: ctx.firmId,
      reference,
      type: "individual",
      status: "active",
      firstName: "Unique",
      lastName: "Client",
    });

    await expect(
      db.insert(clients).values({
        firmId: ctx.firmId,
        reference,
        type: "individual",
        status: "active",
        firstName: "Unique2",
        lastName: "Client",
      })
    ).rejects.toThrow();
  });

  it("allows same reference across different firms (unique)", async () => {
    const reference = `CLI-XFIRM-${Date.now()}`;
    const firm2 = await createFirm({ name: `Other Firm ${Date.now()}` });
    try {
      await db.insert(clients).values({
        firmId: ctx.firmId,
        reference,
        type: "individual",
        status: "active",
        firstName: "A",
        lastName: "SameRef",
      });
      await db.insert(clients).values({
        firmId: firm2.id,
        reference,
        type: "individual",
        status: "active",
        firstName: "B",
        lastName: "SameRef",
      });
    } finally {
      await cleanupTestFirm(firm2.id);
    }
  });

  it("rejects duplicate matter reference within same firm (unique)", async () => {
    const reference = `CLI-${Date.now()}`;
    const [client] = await db
      .insert(clients)
      .values({
        firmId: ctx.firmId,
        reference,
        type: "individual",
        status: "active",
        firstName: "Matter",
        lastName: "Uniq",
      })
      .returning({ id: clients.id });

    const matRef = `MAT-UNIQ-${Date.now()}`;
    await db.insert(matters).values({
      firmId: ctx.firmId,
      reference: matRef,
      title: "Matter 1",
      clientId: client.id,
      practiceArea: "conveyancing",
      billingType: "hourly",
      status: "lead",
    });

    await expect(
      db.insert(matters).values({
        firmId: ctx.firmId,
        reference: matRef,
        title: "Matter 2",
        clientId: client.id,
        practiceArea: "conveyancing",
        billingType: "hourly",
        status: "lead",
      })
    ).rejects.toThrow();
  });

  it("rejects duplicate invoice number within same firm (unique)", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const reference = `CLI-${Date.now()}`;
    const [client] = await db
      .insert(clients)
      .values({
        firmId: ctx.firmId,
        reference,
        type: "individual",
        status: "active",
        firstName: "Invoice",
        lastName: "Uniq",
      })
      .returning({ id: clients.id });

    const invoiceNumber = `INV-UNIQ-${Date.now()}`;
    await db.insert(invoices).values({
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

    await expect(
      db.insert(invoices).values({
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
      })
    ).rejects.toThrow();
  });
});
