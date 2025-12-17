import { randomUUID } from "crypto";

export function generateReference(prefix: string): string {
  const year = new Date().getFullYear();
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `${prefix}-${year}-${suffix}`;
}
