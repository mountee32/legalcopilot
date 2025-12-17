import { describe, it, expect } from "vitest";
import { ClientListSchema, ClientSchema } from "@/lib/api/schemas/clients";

describe("Edge cases - Empty and null states", () => {
  it("allows empty list responses with pagination", () => {
    const parsed = ClientListSchema.parse({
      clients: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });
    expect(parsed.clients).toEqual([]);
    expect(parsed.pagination.total).toBe(0);
  });

  it("accepts clients with optional fields null", () => {
    const client = ClientSchema.parse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      reference: "CLI-2025-0001",
      type: "individual",
      status: "active",
      title: null,
      firstName: null,
      lastName: null,
      companyName: null,
      companyNumber: null,
      email: null,
      phone: null,
      mobile: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      county: null,
      postcode: null,
      country: null,
      idVerified: false,
      idVerifiedAt: null,
      sofVerified: false,
      sofVerifiedAt: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(client.email).toBeNull();
    expect(client.firstName).toBeNull();
  });
});
