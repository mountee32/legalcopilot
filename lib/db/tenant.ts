import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export async function withFirmDb<T>(firmId: string, fn: (tx: typeof db) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_firm_id', ${firmId}, true)`);
    return fn(tx as typeof db);
  });
}
