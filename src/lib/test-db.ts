import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Points the app at a fresh throwaway database; call before the first getDb(). */
export function useTempDatabase(): void {
  const dir = mkdtempSync(join(tmpdir(), "fc-test-"));
  process.env.DATABASE_URL = `file:${join(dir, "test.db")}`;
}
