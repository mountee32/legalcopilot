import postgres from "postgres";
import path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

let ensurePromise: Promise<void> | null = null;

function parseDatabaseName(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  const name = url.pathname.replace(/^\//, "");
  if (!name) throw new Error("DATABASE_URL must include a database name");
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error("DATABASE_URL database name contains unsupported characters");
  }
  return name;
}

function toAdminUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  return url.toString();
}

async function ensureDatabaseExists(databaseUrl: string): Promise<void> {
  const dbName = parseDatabaseName(databaseUrl);

  const admin = postgres(toAdminUrl(databaseUrl), { max: 1 });
  try {
    const rows = await admin<{ exists: boolean }[]>`
      select exists(select 1 from pg_database where datname = ${dbName}) as "exists"
    `;
    const exists = rows[0]?.exists ?? false;
    if (!exists) {
      await admin.unsafe(`create database "${dbName}"`);
    }
  } finally {
    await admin.end({ timeout: 5 });
  }
}

async function schemaExists(databaseUrl: string): Promise<boolean> {
  const client = postgres(databaseUrl, { max: 1 });
  try {
    // Check if a core table exists (firms is always created)
    const result = await client<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'firms'
      ) as exists
    `;
    return result[0]?.exists ?? false;
  } finally {
    await client.end({ timeout: 5 });
  }
}

async function runMigrations(databaseUrl: string): Promise<void> {
  // Skip migrations if schema already exists (from db:push)
  if (await schemaExists(databaseUrl)) {
    return;
  }

  const client = postgres(databaseUrl, { max: 1 });
  try {
    const db = drizzle(client);
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
  } finally {
    await client.end({ timeout: 5 });
  }
}

export async function ensureTestDatabaseMigrated(): Promise<void> {
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL environment variable is not set");

    await ensureDatabaseExists(databaseUrl);
    await runMigrations(databaseUrl);
  })();

  return ensurePromise;
}
