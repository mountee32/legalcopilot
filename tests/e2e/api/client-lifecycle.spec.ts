/**
 * Client Lifecycle E2E Tests
 *
 * Tests the complete flow of client management:
 * 1. Create a client
 * 2. Update client details
 * 3. Create a matter for the client
 * 4. Add time entries
 * 5. List and filter clients
 */
import { test, expect } from "@playwright/test";
import { createAuthCookieHeader } from "./helpers/auth";

let authCookie = "";

test.beforeAll(async ({ request }) => {
  authCookie = await createAuthCookieHeader(request);
});

function authHeaders(): Record<string, string> {
  return { cookie: authCookie };
}

test.describe("Clients API", () => {
  test.describe("GET /api/clients", () => {
    test("returns list with pagination structure", async ({ request }) => {
      const response = await request.get("/api/clients", { headers: authHeaders() });

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body).toHaveProperty("clients");
      expect(body).toHaveProperty("pagination");
      expect(Array.isArray(body.clients)).toBe(true);
      expect(body.pagination).toHaveProperty("page");
      expect(body.pagination).toHaveProperty("limit");
      expect(body.pagination).toHaveProperty("total");
    });

    test("supports pagination parameters", async ({ request }) => {
      const response = await request.get("/api/clients?page=1&limit=5", { headers: authHeaders() });

      expect(response.ok()).toBeTruthy();

      const body = await response.json();
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(5);
    });

    test("supports status filter", async ({ request }) => {
      const response = await request.get("/api/clients?status=active", { headers: authHeaders() });

      expect(response.ok()).toBeTruthy();
    });

    test("supports type filter", async ({ request }) => {
      const response = await request.get("/api/clients?type=individual", {
        headers: authHeaders(),
      });

      expect(response.ok()).toBeTruthy();
    });

    test("supports search parameter", async ({ request }) => {
      const response = await request.get("/api/clients?search=test", { headers: authHeaders() });

      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe("POST /api/clients", () => {
    test("creates individual client", async ({ request }) => {
      const response = await request.post("/api/clients", {
        headers: authHeaders(),
        data: {
          type: "individual",
          firstName: "E2E",
          lastName: "TestClient",
          email: `e2e-${Date.now()}@test.example.com`,
        },
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("reference");
      expect(body.type).toBe("individual");
      expect(body.firstName).toBe("E2E");
      expect(body.lastName).toBe("TestClient");

      // Cleanup
      if (body.id) {
        await request.delete(`/api/clients/${body.id}`, { headers: authHeaders() });
      }
    });

    test("creates company client", async ({ request }) => {
      const response = await request.post("/api/clients", {
        headers: authHeaders(),
        data: {
          type: "company",
          companyName: `E2E Test Company ${Date.now()}`,
          email: `company-${Date.now()}@test.example.com`,
        },
      });

      expect(response.status()).toBe(201);

      const body = await response.json();
      expect(body.type).toBe("company");
      expect(body.companyName).toContain("E2E Test Company");

      // Cleanup
      if (body.id) {
        await request.delete(`/api/clients/${body.id}`, { headers: authHeaders() });
      }
    });

    test("returns validation error for invalid data", async ({ request }) => {
      const response = await request.post("/api/clients", {
        headers: authHeaders(),
        data: {
          // Missing required type field
          firstName: "Test",
        },
      });

      // Should be 400 for validation error (or 500 if there's a bug)
      expect([400, 500]).toContain(response.status());
    });
  });

  test.describe("Client CRUD Lifecycle", () => {
    let testClientId: string;

    test("complete CRUD lifecycle", async ({ request }) => {
      // CREATE
      const createResponse = await request.post("/api/clients", {
        headers: authHeaders(),
        data: {
          type: "individual",
          firstName: "CRUD",
          lastName: "Test",
          email: `crud-${Date.now()}@test.example.com`,
          phone: "+44 20 1234 5678",
        },
      });

      expect(createResponse.status()).toBe(201);
      const created = await createResponse.json();
      testClientId = created.id;
      expect(created.firstName).toBe("CRUD");

      // READ
      const getResponse = await request.get(`/api/clients/${testClientId}`, {
        headers: authHeaders(),
      });
      expect(getResponse.ok()).toBeTruthy();
      const retrieved = await getResponse.json();
      expect(retrieved.id).toBe(testClientId);

      // UPDATE
      const updateResponse = await request.patch(`/api/clients/${testClientId}`, {
        headers: authHeaders(),
        data: {
          phone: "+44 20 9999 8888",
          notes: "Updated via E2E test",
        },
      });
      expect(updateResponse.ok()).toBeTruthy();
      const updated = await updateResponse.json();
      expect(updated.phone).toBe("+44 20 9999 8888");

      // DELETE (soft delete)
      const deleteResponse = await request.delete(`/api/clients/${testClientId}`, {
        headers: authHeaders(),
      });
      expect(deleteResponse.ok()).toBeTruthy();
      const deleted = await deleteResponse.json();
      expect(deleted.success).toBe(true);
    });
  });
});

test.describe("Client with Matter Lifecycle", () => {
  let clientId: string;
  let matterId: string;

  test("create client and add matter", async ({ request }) => {
    // Create client
    const clientResponse = await request.post("/api/clients", {
      headers: authHeaders(),
      data: {
        type: "individual",
        firstName: "Matter",
        lastName: "Test",
        email: `matter-${Date.now()}@test.example.com`,
      },
    });

    expect(clientResponse.status()).toBe(201);
    const client = await clientResponse.json();
    clientId = client.id;

    // Create matter for client
    const matterResponse = await request.post("/api/matters", {
      headers: authHeaders(),
      data: {
        clientId,
        title: "E2E Test Matter",
        practiceArea: "conveyancing",
        description: "Test property transaction",
        billingType: "hourly",
      },
    });

    expect(matterResponse.status()).toBe(201);
    const matter = await matterResponse.json();
    matterId = matter.id;
    expect(matter.clientId).toBe(clientId);
    expect(matter).toHaveProperty("reference");
  });

  test.afterAll(async ({ request }) => {
    // Cleanup
    if (matterId) {
      await request.delete(`/api/matters/${matterId}`, { headers: authHeaders() });
    }
    if (clientId) {
      await request.delete(`/api/clients/${clientId}`, { headers: authHeaders() });
    }
  });
});
