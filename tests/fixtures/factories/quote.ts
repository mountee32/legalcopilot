/**
 * Quote factory for creating test quotes
 */
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { randomUUID } from "crypto";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";

export interface QuoteItem {
  description: string;
  quantity: number;
  rate: string;
  amount: string;
}

export interface QuoteFactoryOptions {
  id?: string;
  firmId: string;
  leadId: string;
  status?: QuoteStatus;
  items?: QuoteItem[];
  subtotal?: string;
  vatAmount?: string;
  total: string;
  validUntil?: string | Date;
  notes?: string;
  convertedToMatterId?: string;
  createdById?: string;
}

export interface TestQuote {
  id: string;
  firmId: string;
  leadId: string;
  status: string;
  items: any;
  subtotal: string;
  vatAmount: string;
  total: string;
  validUntil: string | null;
  notes: string | null;
  convertedToMatterId: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a test quote in the database
 */
export async function createQuote(options: QuoteFactoryOptions): Promise<TestQuote> {
  const id = options.id || randomUUID();

  const quoteData = {
    id,
    firmId: options.firmId,
    leadId: options.leadId,
    status: (options.status || "draft") as "draft",
    items: options.items ?? null,
    subtotal: options.subtotal || "1000.00",
    vatAmount: options.vatAmount || "200.00",
    total: options.total,
    validUntil: options.validUntil
      ? typeof options.validUntil === "string"
        ? options.validUntil
        : options.validUntil.toISOString().split("T")[0]
      : null,
    notes: options.notes ?? null,
    convertedToMatterId: options.convertedToMatterId ?? null,
    createdById: options.createdById ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const [quote] = await db.insert(quotes).values(quoteData).returning();

  return {
    id: quote.id,
    firmId: quote.firmId,
    leadId: quote.leadId,
    status: quote.status,
    items: quote.items,
    subtotal: quote.subtotal,
    vatAmount: quote.vatAmount,
    total: quote.total,
    validUntil: quote.validUntil,
    notes: quote.notes,
    convertedToMatterId: quote.convertedToMatterId,
    createdById: quote.createdById,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };
}

/**
 * Create a quote with default line items
 */
export async function createQuoteWithItems(
  firmId: string,
  leadId: string,
  options: Partial<QuoteFactoryOptions> = {}
): Promise<TestQuote> {
  const items: QuoteItem[] = options.items || [
    { description: "Legal consultation", quantity: 2, rate: "250.00", amount: "500.00" },
    { description: "Document review", quantity: 1, rate: "500.00", amount: "500.00" },
  ];

  const subtotal = options.subtotal || "1000.00";
  const vatAmount = options.vatAmount || "200.00";
  const total = options.total || "1200.00";

  return createQuote({
    ...options,
    firmId,
    leadId,
    items,
    subtotal,
    vatAmount,
    total,
  });
}

/**
 * Create multiple quotes for testing
 */
export async function createManyQuotes(
  firmId: string,
  leadId: string,
  count: number,
  options: Partial<QuoteFactoryOptions> = {}
): Promise<TestQuote[]> {
  const quotes: TestQuote[] = [];
  for (let i = 0; i < count; i++) {
    const quote = await createQuote({
      ...options,
      firmId,
      leadId,
      total: options.total || `${(i + 1) * 1000}.00`,
    });
    quotes.push(quote);
  }
  return quotes;
}
