import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/litigation/limitation/calculate/route";

describe("GET /api/litigation/limitation/calculate", () => {
  it("should calculate limitation date for civil case (6 years)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/litigation/limitation/calculate?caseType=civil&incidentDate=2024-01-01",
      { method: "GET" }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.limitationDate).toBe("2030-01-01");
    expect(data.periodYears).toBe(6);
    expect(data.calculation).toContain("2024-01-01");
    expect(data.calculation).toContain("6 years");
  });

  it("should calculate limitation date using knowledge date when provided", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/litigation/limitation/calculate?caseType=civil&incidentDate=2024-01-01&knowledgeDate=2024-06-01",
      { method: "GET" }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.limitationDate).toBe("2030-06-01");
    expect(data.calculation).toContain("Knowledge date 2024-06-01");
  });

  it("should calculate limitation date for employment case (3 months - 1 day)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/litigation/limitation/calculate?caseType=employment&incidentDate=2024-01-01",
      { method: "GET" }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.limitationDate).toBe("2024-03-31");
    expect(data.periodYears).toBe(0);
    expect(data.calculation).toContain("3 months - 1 day");
  });

  it("should calculate limitation date for family case (1 year)", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/litigation/limitation/calculate?caseType=family&incidentDate=2024-01-01",
      { method: "GET" }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.limitationDate).toBe("2025-01-01");
    expect(data.periodYears).toBe(1);
  });

  it("should handle immigration case with variable periods", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/litigation/limitation/calculate?caseType=immigration&incidentDate=2024-01-01",
      { method: "GET" }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.calculation).toBe("Varies by application type");
    expect(data.notes).toContain("14 days");
  });

  it("should handle criminal case with no limitation", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/litigation/limitation/calculate?caseType=criminal&incidentDate=2024-01-01",
      { method: "GET" }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notes).toContain("No limitation period");
  });

  it("should return 400 for missing required fields", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/litigation/limitation/calculate?caseType=civil",
      { method: "GET" }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });

  it("should return 400 for invalid case type", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/litigation/limitation/calculate?caseType=invalid&incidentDate=2024-01-01",
      { method: "GET" }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });

  it("should return 400 for invalid date format", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/litigation/limitation/calculate?caseType=civil&incidentDate=invalid-date",
      { method: "GET" }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });
});
