import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

const DEFAULT_URL = "file:./data/financecockpit.db";

async function init() {
  const url = process.env.DATABASE_URL ?? DEFAULT_URL;
  if (url.startsWith("file:")) {
    mkdirSync(dirname(resolve(url.slice("file:".length))), { recursive: true });
  }
  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
  return db;
}

type Db = Awaited<ReturnType<typeof init>>;

// Kept on globalThis so dev-server hot reloads reuse one connection.
const globalForDb = globalThis as unknown as { __fcDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  return (globalForDb.__fcDb ??= init());
}

export { schema };
