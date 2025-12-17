/**
 * Conflicts Integration Tests
 *
 * Tests conflict checking operations against the real database.
 * Uses setupIntegrationSuite() to provide a test firm with cleanup.
 */
import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { conflictChecks, clients, matters } from "@/lib/db/schema";
import { eq, and, ilike, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { setupIntegrationSuite, setupFreshFirmPerTest } from "@tests/integration/setup";
import {
  createConflictCheck,
  createPendingConflictCheck,
  createClearedConflictCheck,
  createConflictedCheck,
  createWaivedConflictCheck,
} from "@tests/fixtures/factories/conflict";
import { createClient, createCompanyClient } from "@tests/fixtures/factories/client";
import { createMatter } from "@tests/fixtures/factories/matter";
import { createFirm } from "@tests/fixtures/factories/firm";

describe("Conflicts Integration - Conflict Search", () => {
  const ctx = setupIntegrationSuite();

  describe("Search for conflicts by party name", () => {
    it("searches and finds matching clients by name", async () => {
      // Create clients that should match
      const client1 = await createClient({
        firmId: ctx.firmId,
        firstName: "John",
        lastName: "ConflictTestParty",
      });

      const client2 = await createClient({
        firmId: ctx.firmId,
        firstName: "Jane",
        lastName: "ConflictTestParty",
      });

      // Create a client that shouldn't match
      await createClient({
        firmId: ctx.firmId,
        firstName: "Bob",
        lastName: "DifferentName",
      });

      // Search for clients with lastName matching "ConflictTestParty"
      const searchTerm = "ConflictTestParty";
      const results = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.firmId, ctx.firmId),
            or(
              ilike(clients.firstName, `%${searchTerm}%`),
              ilike(clients.lastName, `%${searchTerm}%`),
              ilike(clients.companyName, `%${searchTerm}%`)
            )
          )
        );

      expect(results.length).toBe(2);
      expect(results.some((c) => c.id === client1.id)).toBe(true);
      expect(results.some((c) => c.id === client2.id)).toBe(true);
    });

    it("searches and finds matching company clients", async () => {
      // Create company that should match
      const company = await createCompanyClient(ctx.firmId, {
        companyName: "UniqueConflictCorp Ltd",
      });

      // Create company that shouldn't match
      await createCompanyClient(ctx.firmId, {
        companyName: "Different Company Ltd",
      });

      // Search for company
      const searchTerm = "UniqueConflictCorp";
      const results = await db
        .select()
        .from(clients)
        .where(and(eq(clients.firmId, ctx.firmId), ilike(clients.companyName, `%${searchTerm}%`)));

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(company.id);
      expect(results[0].companyName).toBe("UniqueConflictCorp Ltd");
    });

    it("searches return matching matters", async () => {
      // Create client and matter
      const client = await createClient({
        firmId: ctx.firmId,
        firstName: "Matter",
        lastName: "SearchTest",
      });

      const matter1 = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Property Purchase - UniquePartyName vs Seller",
      });

      const matter2 = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Litigation - Different Case",
      });

      // Search for matters by title
      const searchTerm = "UniquePartyName";
      const results = await db
        .select()
        .from(matters)
        .where(and(eq(matters.firmId, ctx.firmId), ilike(matters.title, `%${searchTerm}%`)));

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(matter1.id);
    });

    it("searches return related parties from matter practiceData", async () => {
      // Create client and matter with related parties in practiceData
      const client = await createClient({
        firmId: ctx.firmId,
        firstName: "Test",
        lastName: "Client",
      });

      const matter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Conveyancing Matter",
        practiceArea: "conveyancing",
        description: "Property sale involving John SearchableParty",
      });

      // Search in matter descriptions for party names
      const searchTerm = "SearchableParty";
      const results = await db
        .select()
        .from(matters)
        .where(
          and(
            eq(matters.firmId, ctx.firmId),
            or(
              ilike(matters.title, `%${searchTerm}%`),
              ilike(matters.description, `%${searchTerm}%`)
            )
          )
        );

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(matter.id);
    });
  });

  describe("Conflict Detection", () => {
    it("detects conflict with existing client", async () => {
      // Create existing client
      const existingClient = await createClient({
        firmId: ctx.firmId,
        firstName: "Alice",
        lastName: "ExistingClient",
      });

      // Create a matter for a different client
      const newClient = await createClient({
        firmId: ctx.firmId,
        firstName: "Bob",
        lastName: "NewClient",
      });

      const newMatter = await createMatter({
        firmId: ctx.firmId,
        clientId: newClient.id,
        title: "New Matter",
      });

      // Search for conflicts - looking for "Alice ExistingClient"
      const searchTerm = "ExistingClient";
      const conflictingClients = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.firmId, ctx.firmId),
            or(
              ilike(clients.firstName, `%${searchTerm}%`),
              ilike(clients.lastName, `%${searchTerm}%`)
            )
          )
        );

      expect(conflictingClients.length).toBe(1);
      expect(conflictingClients[0].id).toBe(existingClient.id);

      // Create conflict check record showing conflict detected
      const conflictCheck = await createConflictedCheck(
        ctx.firmId,
        newMatter.id,
        [
          {
            clientId: existingClient.id,
            clientName: "Alice ExistingClient",
            matchType: "exact",
            confidence: 1.0,
          },
        ],
        {
          searchTerms: { partyNames: ["Alice ExistingClient"] },
        }
      );

      expect(conflictCheck.status).toBe("conflict");
      expect(conflictCheck.results).toBeDefined();
      const results = conflictCheck.results as { matches: unknown[] };
      expect(results.matches.length).toBe(1);
    });

    it("detects conflict with opposing party in existing matter", async () => {
      // Create client and matter with opposing party
      const client = await createClient({
        firmId: ctx.firmId,
        firstName: "Original",
        lastName: "Client",
      });

      const existingMatter = await createMatter({
        firmId: ctx.firmId,
        clientId: client.id,
        title: "Litigation vs OpposingPartyName",
        description: "Dispute with OpposingPartyName",
      });

      // New matter wants to represent OpposingPartyName
      const newClient = await createClient({
        firmId: ctx.firmId,
        firstName: "OpposingPartyName",
        lastName: "Company",
      });

      const newMatter = await createMatter({
        firmId: ctx.firmId,
        clientId: newClient.id,
        title: "New matter for opposing party",
      });

      // Search for conflicts in matter descriptions
      const searchTerm = "OpposingPartyName";
      const conflictingMatters = await db
        .select()
        .from(matters)
        .where(
          and(
            eq(matters.firmId, ctx.firmId),
            or(
              ilike(matters.title, `%${searchTerm}%`),
              ilike(matters.description, `%${searchTerm}%`)
            )
          )
        );

      expect(conflictingMatters.length).toBeGreaterThanOrEqual(1);
      expect(conflictingMatters.some((m) => m.id === existingMatter.id)).toBe(true);

      // Record the conflict
      const conflictCheck = await createConflictedCheck(
        ctx.firmId,
        newMatter.id,
        [
          {
            matterId: existingMatter.id,
            matterTitle: existingMatter.title,
            role: "opposing_party",
            matchType: "exact",
          },
        ],
        {
          searchTerms: { partyNames: ["OpposingPartyName"] },
        }
      );

      expect(conflictCheck.status).toBe("conflict");
    });

    it("detects conflict with related entity", async () => {
      // Create a company client
      const parentCompany = await createCompanyClient(ctx.firmId, {
        companyName: "RelatedEntityCorp Holdings",
      });

      // Create a subsidiary
      const subsidiary = await createCompanyClient(ctx.firmId, {
        companyName: "RelatedEntityCorp Subsidiary",
      });

      // Create matter for parent company
      const parentMatter = await createMatter({
        firmId: ctx.firmId,
        clientId: parentCompany.id,
        title: "Parent Company Matter",
      });

      // Try to create matter for subsidiary - should detect relation
      const subsidiaryMatter = await createMatter({
        firmId: ctx.firmId,
        clientId: subsidiary.id,
        title: "Subsidiary Matter",
      });

      // Search for related entities by name similarity
      const searchTerm = "RelatedEntityCorp";
      const relatedClients = await db
        .select()
        .from(clients)
        .where(and(eq(clients.firmId, ctx.firmId), ilike(clients.companyName, `%${searchTerm}%`)));

      expect(relatedClients.length).toBe(2);

      // Create conflict check showing related entity
      const conflictCheck = await createConflictedCheck(
        ctx.firmId,
        subsidiaryMatter.id,
        [
          {
            clientId: parentCompany.id,
            clientName: "RelatedEntityCorp Holdings",
            matchType: "related",
            relationship: "parent_company",
            confidence: 0.85,
          },
        ],
        {
          searchTerms: { partyNames: ["RelatedEntityCorp"] },
        }
      );

      expect(conflictCheck.status).toBe("conflict");
    });
  });
});

describe("Conflicts Integration - Matter Conflicts", () => {
  const ctx = setupIntegrationSuite();

  it("gets conflicts for specific matter", async () => {
    // Create matter
    const client = await createClient({
      firmId: ctx.firmId,
      firstName: "Test",
      lastName: "Client",
    });

    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Test Matter",
    });

    // Create multiple conflict checks for this matter
    const check1 = await createPendingConflictCheck(ctx.firmId, matter.id, {
      partyNames: ["Party One"],
    });

    const check2 = await createConflictCheck({
      firmId: ctx.firmId,
      matterId: matter.id,
      status: "clear",
      searchTerms: { partyNames: ["Party Two"] },
      decisionReason: "No conflicts detected",
    });

    const check3 = await createConflictedCheck(
      ctx.firmId,
      matter.id,
      [{ clientId: randomUUID(), matchType: "exact" }],
      { searchTerms: { partyNames: ["Party Three"] } }
    );

    // Get all conflict checks for the matter
    const matterConflicts = await db
      .select()
      .from(conflictChecks)
      .where(and(eq(conflictChecks.firmId, ctx.firmId), eq(conflictChecks.matterId, matter.id)));

    expect(matterConflicts.length).toBe(3);
    expect(matterConflicts.some((c) => c.id === check1.id)).toBe(true);
    expect(matterConflicts.some((c) => c.id === check2.id)).toBe(true);
    expect(matterConflicts.some((c) => c.id === check3.id)).toBe(true);
  });

  it("lists all parties checked for a matter", async () => {
    // Create matter
    const client = await createClient({
      firmId: ctx.firmId,
      firstName: "Test",
      lastName: "Client",
    });

    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Multi-Party Matter",
    });

    // Create conflict checks with different search terms
    await createPendingConflictCheck(ctx.firmId, matter.id, {
      partyNames: ["John Doe", "Jane Smith"],
    });

    await createConflictCheck({
      firmId: ctx.firmId,
      matterId: matter.id,
      status: "clear",
      searchTerms: { partyNames: ["Acme Corp"], companyNumbers: ["12345678"] },
      decisionReason: "No conflicts detected",
    });

    // Get all conflict checks and extract search terms
    const matterConflicts = await db
      .select()
      .from(conflictChecks)
      .where(and(eq(conflictChecks.firmId, ctx.firmId), eq(conflictChecks.matterId, matter.id)));

    expect(matterConflicts.length).toBe(2);

    // Extract all party names from search terms
    const allParties = matterConflicts.flatMap((check) => {
      const searchTerms = check.searchTerms as Record<string, unknown> | null;
      if (searchTerms && Array.isArray(searchTerms.partyNames)) {
        return searchTerms.partyNames;
      }
      return [];
    });

    expect(allParties).toContain("John Doe");
    expect(allParties).toContain("Jane Smith");
    expect(allParties).toContain("Acme Corp");
  });

  it("shows conflict status per party", async () => {
    // Create matter
    const client = await createClient({
      firmId: ctx.firmId,
      firstName: "Test",
      lastName: "Client",
    });

    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Status Test Matter",
    });

    // Create checks with different statuses
    const pendingCheck = await createPendingConflictCheck(ctx.firmId, matter.id, {
      partyNames: ["Pending Party"],
    });

    const clearCheck = await createConflictCheck({
      firmId: ctx.firmId,
      matterId: matter.id,
      status: "clear",
      searchTerms: { partyNames: ["Clear Party"] },
      decisionReason: "No conflicts detected",
    });

    const conflictCheck = await createConflictCheck({
      firmId: ctx.firmId,
      matterId: matter.id,
      status: "conflict",
      searchTerms: { partyNames: ["Conflict Party"] },
      results: { matches: [{ clientId: randomUUID(), matchType: "exact" }] },
    });

    const waivedCheck = await createConflictCheck({
      firmId: ctx.firmId,
      matterId: matter.id,
      status: "waived",
      searchTerms: { partyNames: ["Waived Party"] },
      waiverReason: "Client consent obtained",
    });

    // Verify each status
    expect(pendingCheck.status).toBe("pending");
    expect(clearCheck.status).toBe("clear");
    expect(conflictCheck.status).toBe("conflict");
    expect(waivedCheck.status).toBe("waived");

    // Get all checks grouped by status
    const allChecks = await db
      .select()
      .from(conflictChecks)
      .where(and(eq(conflictChecks.firmId, ctx.firmId), eq(conflictChecks.matterId, matter.id)));

    const statusCounts = allChecks.reduce(
      (acc, check) => {
        acc[check.status] = (acc[check.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    expect(statusCounts["pending"]).toBe(1);
    expect(statusCounts["clear"]).toBe(1);
    expect(statusCounts["conflict"]).toBe(1);
    expect(statusCounts["waived"]).toBe(1);
  });
});

describe("Conflicts Integration - Conflict Resolution", () => {
  const ctx = setupIntegrationSuite();

  it("clears conflict when no actual conflict exists", async () => {
    // Create matter and pending check
    const client = await createClient({
      firmId: ctx.firmId,
      firstName: "Test",
      lastName: "Client",
    });

    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Test Matter",
    });

    const pendingCheck = await createPendingConflictCheck(ctx.firmId, matter.id, {
      partyNames: ["Test Party"],
    });

    expect(pendingCheck.status).toBe("pending");
    expect(pendingCheck.decidedBy).toBeNull();

    // Clear the conflict (without decidedBy since we don't have a real user)
    const decisionReason = "No conflicts found after review";

    await db
      .update(conflictChecks)
      .set({
        status: "clear",
        decidedAt: new Date(),
        decisionReason,
        updatedAt: new Date(),
      })
      .where(eq(conflictChecks.id, pendingCheck.id));

    // Verify the update
    const [updated] = await db
      .select()
      .from(conflictChecks)
      .where(eq(conflictChecks.id, pendingCheck.id));

    expect(updated.status).toBe("clear");
    expect(updated.decidedAt).toBeDefined();
    expect(updated.decisionReason).toBe(decisionReason);
  });

  it("waives conflict with justification", async () => {
    // Create matter and conflicted check
    const client = await createClient({
      firmId: ctx.firmId,
      firstName: "Test",
      lastName: "Client",
    });

    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Test Matter",
    });

    const conflictedCheck = await createConflictCheck({
      firmId: ctx.firmId,
      matterId: matter.id,
      status: "conflict",
      searchTerms: { partyNames: ["Conflicting Party"] },
      results: { matches: [{ clientId: randomUUID(), matchType: "exact" }] },
    });

    expect(conflictedCheck.status).toBe("conflict");

    // Waive the conflict (without decidedBy since we don't have a real user)
    const waiverReason = "Client has provided written consent to proceed despite conflict";

    await db
      .update(conflictChecks)
      .set({
        status: "waived",
        decidedAt: new Date(),
        waiverReason,
        updatedAt: new Date(),
      })
      .where(eq(conflictChecks.id, conflictedCheck.id));

    // Verify the waiver
    const [waived] = await db
      .select()
      .from(conflictChecks)
      .where(eq(conflictChecks.id, conflictedCheck.id));

    expect(waived.status).toBe("waived");
    expect(waived.decidedAt).toBeDefined();
    expect(waived.waiverReason).toBe(waiverReason);
  });

  it("maintains audit trail for conflict resolution", async () => {
    // Create matter and check
    const client = await createClient({
      firmId: ctx.firmId,
      firstName: "Test",
      lastName: "Client",
    });

    const matter = await createMatter({
      firmId: ctx.firmId,
      clientId: client.id,
      title: "Audit Trail Matter",
    });

    const check = await createConflictCheck({
      firmId: ctx.firmId,
      matterId: matter.id,
      searchTerms: { partyNames: ["Test Party"] },
      status: "pending",
    });

    expect(check.createdAt).toBeDefined();

    // Update to clear (without user IDs since we don't have real users in this test)
    await db
      .update(conflictChecks)
      .set({
        status: "clear",
        decidedAt: new Date(),
        decisionReason: "Resolved after investigation",
        updatedAt: new Date(),
      })
      .where(eq(conflictChecks.id, check.id));

    const [resolved] = await db
      .select()
      .from(conflictChecks)
      .where(eq(conflictChecks.id, check.id));

    // Verify audit trail
    expect(resolved.createdAt).toBeDefined();
    expect(resolved.decidedAt).toBeDefined();
    expect(resolved.updatedAt).toBeDefined();
    expect(resolved.decisionReason).toBe("Resolved after investigation");

    // Ensure updatedAt is after createdAt
    expect(resolved.updatedAt.getTime()).toBeGreaterThanOrEqual(resolved.createdAt.getTime());
  });
});

describe("Conflicts Integration - Multi-Tenancy", () => {
  const ctx = setupFreshFirmPerTest();

  it("conflict checks are scoped within firm only", async () => {
    // Create client and matter in first firm with matching name
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Shared Party",
      lastName: "Name",
    });

    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Firm 1 Matter",
    });

    const check1 = await createPendingConflictCheck(ctx.firmId, matter1.id, {
      partyNames: ["Shared Party Name"],
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Second Test Firm" });

    // Create client and matter in second firm with same party name
    const client2 = await createClient({
      firmId: firm2.id,
      firstName: "Shared Party",
      lastName: "Name",
    });

    const matter2 = await createMatter({
      firmId: firm2.id,
      clientId: client2.id,
      title: "Firm 2 Matter",
    });

    const check2 = await createPendingConflictCheck(firm2.id, matter2.id, {
      partyNames: ["Shared Party Name"],
    });

    // Search for conflicts in firm 1 - should only find firm 1's client, NOT firm 2's
    const firm1Conflicts = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.firmId, ctx.firmId),
          or(ilike(clients.firstName, "%Shared Party%"), ilike(clients.lastName, "%Name%"))
        )
      );

    expect(firm1Conflicts.length).toBe(1);
    expect(firm1Conflicts[0].id).toBe(client1.id);
    expect(firm1Conflicts[0].firmId).toBe(ctx.firmId);
    expect(firm1Conflicts.some((c) => c.id === client2.id)).toBe(false);

    // Verify conflict checks are isolated
    const firm1Checks = await db
      .select()
      .from(conflictChecks)
      .where(eq(conflictChecks.firmId, ctx.firmId));

    const firm2Checks = await db
      .select()
      .from(conflictChecks)
      .where(eq(conflictChecks.firmId, firm2.id));

    expect(firm1Checks.some((c) => c.id === check1.id)).toBe(true);
    expect(firm1Checks.some((c) => c.id === check2.id)).toBe(false);

    expect(firm2Checks.some((c) => c.id === check2.id)).toBe(true);
    expect(firm2Checks.some((c) => c.id === check1.id)).toBe(false);

    // Cleanup second firm
    await db.delete(conflictChecks).where(eq(conflictChecks.firmId, firm2.id));
    await db.delete(matters).where(eq(matters.firmId, firm2.id));
    await db.delete(clients).where(eq(clients.firmId, firm2.id));
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("cannot see other firm's client data in conflict search", async () => {
    // Create sensitive client in firm 1
    const sensitiveClient = await createClient({
      firmId: ctx.firmId,
      firstName: "Sensitive",
      lastName: "ClientData",
      email: "sensitive@firm1.com",
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Competitor Firm" });

    // Try to search for firm 1's client from firm 2's perspective
    const unauthorizedAccess = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.firmId, firm2.id), // Firm 2 can't see Firm 1's data
          ilike(clients.lastName, "%ClientData%")
        )
      );

    expect(unauthorizedAccess.length).toBe(0);

    // Verify firm 1 can still see its own data
    const authorizedAccess = await db
      .select()
      .from(clients)
      .where(and(eq(clients.firmId, ctx.firmId), ilike(clients.lastName, "%ClientData%")));

    expect(authorizedAccess.length).toBe(1);
    expect(authorizedAccess[0].id).toBe(sensitiveClient.id);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });

  it("cannot access conflict check by ID from different firm", async () => {
    // Create conflict check in firm 1
    const client1 = await createClient({
      firmId: ctx.firmId,
      firstName: "Test",
      lastName: "Client",
    });

    const matter1 = await createMatter({
      firmId: ctx.firmId,
      clientId: client1.id,
      title: "Firm 1 Matter",
    });

    const check1 = await createPendingConflictCheck(ctx.firmId, matter1.id, {
      partyNames: ["Party Name"],
    });

    // Create second firm
    const firm2 = await createFirm({ name: "Other Firm" });

    // Try to access firm 1's conflict check with firm 2's firmId filter
    const unauthorizedCheck = await db
      .select()
      .from(conflictChecks)
      .where(
        and(
          eq(conflictChecks.id, check1.id),
          eq(conflictChecks.firmId, firm2.id) // Wrong firm
        )
      );

    expect(unauthorizedCheck.length).toBe(0);

    // Verify firm 1 can access its own check
    const authorizedCheck = await db
      .select()
      .from(conflictChecks)
      .where(and(eq(conflictChecks.id, check1.id), eq(conflictChecks.firmId, ctx.firmId)));

    expect(authorizedCheck.length).toBe(1);
    expect(authorizedCheck[0].id).toBe(check1.id);

    // Cleanup second firm
    const { firms } = await import("@/lib/db/schema");
    await db.delete(firms).where(eq(firms.id, firm2.id));
  });
});
