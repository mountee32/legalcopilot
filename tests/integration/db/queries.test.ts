// @vitest-environment node
import { describe, it, expect } from "vitest";
import { and, eq, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, invoices } from "@/lib/db/schema";
import { setupFreshFirmPerTest } from "@tests/integration/setup";

describe("DB Integrity - Query Correctness", () => {
  const ctx = setupFreshFirmPerTest();

  it("paginates with stable ordering (offset/limit)", async () => {
    const base = Date.now();
    const refs: string[] = [];
    for (let i = 0; i < 5; i++) {
      const reference = `CLI-PAGE-${base}-${i}`;
      refs.push(reference);
      await db.insert(clients).values({
        firmId: ctx.firmId,
        reference,
        type: "individual",
        status: "active",
        firstName: `P${i}`,
        lastName: "Page",
        createdAt: new Date(base + i * 1000),
        updatedAt: new Date(base + i * 1000),
      });
    }

    const page1 = await db
      .select({ reference: clients.reference })
      .from(clients)
      .where(eq(clients.firmId, ctx.firmId))
      .orderBy(clients.createdAt)
      .limit(2)
      .offset(0);

    const page2 = await db
      .select({ reference: clients.reference })
      .from(clients)
      .where(eq(clients.firmId, ctx.firmId))
      .orderBy(clients.createdAt)
      .limit(2)
      .offset(2);

    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(2);
    expect(page1[0]!.reference).toBe(refs[0]);
    expect(page2[0]!.reference).toBe(refs[2]);
  });

  it("composes filters with AND logic", async () => {
    await db.insert(clients).values([
      {
        firmId: ctx.firmId,
        reference: `CLI-F-${Date.now()}-1`,
        type: "individual",
        status: "active",
        firstName: "A",
        lastName: "Filter",
      },
      {
        firmId: ctx.firmId,
        reference: `CLI-F-${Date.now()}-2`,
        type: "company",
        status: "active",
        companyName: "Filter Co",
      },
      {
        firmId: ctx.firmId,
        reference: `CLI-F-${Date.now()}-3`,
        type: "individual",
        status: "dormant",
        firstName: "D",
        lastName: "Filter",
      },
    ]);

    const filtered = await db
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(
          eq(clients.firmId, ctx.firmId),
          eq(clients.type, "individual"),
          eq(clients.status, "active")
        )
      );

    expect(filtered).toHaveLength(1);
  });

  it("supports ILIKE search patterns without throwing", async () => {
    const unique = `UniqueLastName-${Date.now()}`;
    await db.insert(clients).values({
      firmId: ctx.firmId,
      reference: `CLI-S-${Date.now()}`,
      type: "individual",
      status: "active",
      firstName: "Search",
      lastName: unique,
    });

    const results = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.firmId, ctx.firmId), ilike(clients.lastName, `%${unique}%`)));

    expect(results).toHaveLength(1);
  });

  it("stores/retrieves money fields with fixed precision", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [client] = await db
      .insert(clients)
      .values({
        firmId: ctx.firmId,
        reference: `CLI-M-${Date.now()}`,
        type: "individual",
        status: "active",
        firstName: "Money",
        lastName: "Test",
      })
      .returning({ id: clients.id });

    const invoiceNumber = `INV-M-${Date.now()}`;
    await db.insert(invoices).values({
      firmId: ctx.firmId,
      invoiceNumber,
      clientId: client.id,
      invoiceDate: today,
      dueDate: today,
      subtotal: "0.10",
      vatAmount: "0.02",
      total: "0.12",
      balanceDue: "0.12",
      status: "draft",
    });

    const [row] = await db
      .select({ total: invoices.total, vatAmount: invoices.vatAmount, subtotal: invoices.subtotal })
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber));

    expect(row.total).toBe("0.12");
    expect(row.vatAmount).toBe("0.02");
    expect(row.subtotal).toBe("0.10");
  });
});
