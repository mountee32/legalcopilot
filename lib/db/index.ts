import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

function missingDatabaseUrl(): never {
  throw new Error("DATABASE_URL environment variable is not set");
}

function makeDb(): PostgresJsDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) return missingDatabaseUrl();
  const client = postgres(url);
  return drizzle(client, { schema });
}

export const db: PostgresJsDatabase<typeof schema> = process.env.DATABASE_URL
  ? makeDb()
  : (new Proxy(
      {},
      {
        get() {
          return missingDatabaseUrl();
        },
      }
    ) as unknown as PostgresJsDatabase<typeof schema>);

// Re-export schema for convenience
export * from "./schema/index";
