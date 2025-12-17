/**
 * Client factory for creating test clients
 */
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type ClientType = "individual" | "company" | "trust" | "estate" | "charity" | "government";
export type ClientStatus = "prospect" | "active" | "dormant" | "archived";

export interface ClientFactoryOptions {
  id?: string;
  firmId: string;
  type?: ClientType;
  status?: ClientStatus;
  reference?: string;
  // Individual fields
  title?: string;
  firstName?: string;
  lastName?: string;
  // Company fields
  companyName?: string;
  companyNumber?: string;
  // Contact
  email?: string;
  phone?: string;
  mobile?: string;
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
  // Other
  notes?: string;
}

export interface TestClient {
  id: string;
  firmId: string;
  reference: string;
  type: string;
  status: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  companyNumber: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  country: string | null;
  notes: string | null;
}

/**
 * Create a test client in the database
 */
export async function createClient(options: ClientFactoryOptions): Promise<TestClient> {
  const id = options.id || randomUUID();
  const suffix = Date.now().toString(36);
  const type = options.type || "individual";

  const clientData = {
    id,
    firmId: options.firmId,
    reference: options.reference || `CLI-${suffix}`,
    type,
    status: options.status || "prospect",
    // Individual fields
    title: options.title ?? null,
    firstName: type === "individual" ? options.firstName || `Test` : null,
    lastName: type === "individual" ? options.lastName || `Client-${suffix}` : null,
    // Company fields
    companyName: type === "company" ? options.companyName || `Test Company ${suffix}` : null,
    companyNumber: options.companyNumber ?? null,
    // Contact
    email: options.email || `client-${suffix}@test.example.com`,
    phone: options.phone ?? null,
    mobile: options.mobile ?? null,
    // Address
    addressLine1: options.addressLine1 ?? null,
    addressLine2: options.addressLine2 ?? null,
    city: options.city ?? null,
    county: options.county ?? null,
    postcode: options.postcode ?? null,
    country: options.country ?? "United Kingdom",
    // Other
    notes: options.notes ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [client] = await db.insert(clients).values(clientData).returning();

  return {
    id: client.id,
    firmId: client.firmId,
    reference: client.reference,
    type: client.type,
    status: client.status,
    title: client.title,
    firstName: client.firstName,
    lastName: client.lastName,
    companyName: client.companyName,
    companyNumber: client.companyNumber,
    email: client.email,
    phone: client.phone,
    mobile: client.mobile,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    city: client.city,
    county: client.county,
    postcode: client.postcode,
    country: client.country,
    notes: client.notes,
  };
}

/**
 * Build client data without inserting into database
 */
export function buildClientData(
  firmId: string,
  options: Partial<ClientFactoryOptions> = {}
): Record<string, unknown> {
  const suffix = Date.now().toString(36);
  const type = options.type || "individual";

  return {
    firmId,
    type,
    firstName: type === "individual" ? options.firstName || "Test" : undefined,
    lastName: type === "individual" ? options.lastName || `Client-${suffix}` : undefined,
    companyName: type === "company" ? options.companyName || `Test Company ${suffix}` : undefined,
    email: options.email || `client-${suffix}@test.example.com`,
    phone: options.phone,
    country: options.country || "United Kingdom",
  };
}

/**
 * Create a company client
 */
export async function createCompanyClient(
  firmId: string,
  options: Partial<ClientFactoryOptions> = {}
): Promise<TestClient> {
  return createClient({
    ...options,
    firmId,
    type: "company",
    companyName: options.companyName || `Test Company Ltd ${Date.now().toString(36)}`,
  });
}

/**
 * Create an individual client
 */
export async function createIndividualClient(
  firmId: string,
  options: Partial<ClientFactoryOptions> = {}
): Promise<TestClient> {
  return createClient({
    ...options,
    firmId,
    type: "individual",
  });
}

/**
 * Create multiple clients for pagination testing
 */
export async function createManyClients(
  firmId: string,
  count: number,
  options: Partial<ClientFactoryOptions> = {}
): Promise<TestClient[]> {
  const clients: TestClient[] = [];
  for (let i = 0; i < count; i++) {
    const client = await createClient({
      ...options,
      firmId,
      firstName: options.firstName || `Test${i}`,
      lastName: options.lastName || `Client${i}`,
    });
    clients.push(client);
  }
  return clients;
}
