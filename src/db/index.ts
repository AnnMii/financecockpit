import "server-only";
import { chmodSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

const DEFAULT_URL = "file:./data/financecockpit.db";

/** Only the owner may read the data directory and the database files (no effect on Windows). */
function restrictAccess(file: string) {
  try {
    chmodSync(dirname(file), 0o700);
    for (const suffix of ["", "-wal", "-shm", "-journal"]) {
      try {
        chmodSync(file + suffix, 0o600);
      } catch {
        // The file does not exist (yet).
      }
    }
  } catch {
    // Best effort: a read-only or foreign directory is left as it is.
  }
}

async function init() {
  const url = process.env.DATABASE_URL ?? DEFAULT_URL;
  if (url.startsWith("file:")) {
    const file = resolve(url.slice("file:".length));
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    restrictAccess(file);
  }
  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
  if (url.startsWith("file:")) restrictAccess(resolve(url.slice("file:".length)));
  return db;
}

type Db = Awaited<ReturnType<typeof init>>;

// Kept on globalThis so dev-server hot reloads reuse one connection.
const globalForDb = globalThis as unknown as { __fcDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  return (globalForDb.__fcDb ??= init());
}

export { schema };
