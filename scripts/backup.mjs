// Writes a consistent copy of the database to the given file, even while the
// app is running (SQLite VACUUM INTO). Used by deploy/backup.sh inside the
// container:
//
//   node scripts/backup.mjs /app/data/backup.db
import { existsSync, unlinkSync } from "node:fs";
import { createClient } from "@libsql/client";

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/backup.mjs <target-file>");
  process.exit(1);
}
if (existsSync(target)) unlinkSync(target); // VACUUM INTO refuses existing files

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./data/financecockpit.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
await client.execute(`VACUUM INTO '${target.replaceAll("'", "''")}'`);
client.close();
console.log(`Backup written to ${target}`);
