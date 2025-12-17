import { describe, it, expect } from "vitest";
import { ClientQuerySchema, CreateClientSchema } from "@/lib/api/schemas";

describe("Edge cases - Security & Unicode", () => {
  it("accepts unicode names in CreateClientSchema", () => {
    const data = CreateClientSchema.parse({
      type: "individual",
      firstName: "José",
      lastName: "Müller 中文",
      email: "unicode@test.example.com",
      notes: "Accent + CJK ✅",
    });

    expect(data.firstName).toBe("José");
    expect(data.lastName).toBe("Müller 中文");
  });

  it("accepts injection-like search terms without crashing", () => {
    const query = ClientQuerySchema.parse({
      search: `%' OR 1=1; --`,
      page: "1",
      limit: "20",
    });

    expect(query.search).toContain("OR 1=1");
  });

  it("accepts XSS-like strings as notes input (validation only)", () => {
    const data = CreateClientSchema.parse({
      type: "individual",
      firstName: "Xss",
      lastName: "Test",
      email: "xss@test.example.com",
      notes: `<img src=x onerror=alert('xss') />`,
    });

    expect(data.notes).toContain("onerror");
  });
});
