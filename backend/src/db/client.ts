import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

const DB_PATH =
  process.env.DATABASE_URL ?? path.join(__dirname, "../../data/app.db");

if (DB_PATH !== ":memory:") {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Node's built-in node:sqlite is used instead of a native addon (e.g.
// better-sqlite3) so the project has zero native build-toolchain
// dependencies. Drizzle's sqlite-proxy driver lets us bridge to it.
export const sqlite = new DatabaseSync(DB_PATH);
sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA foreign_keys = ON");

export const db = drizzle<typeof schema>(
  async (sqlText, params, method) => {
    const stmt = sqlite.prepare(sqlText);
    stmt.setReturnArrays(true);

    if (method === "run") {
      stmt.run(...params);
      return { rows: [] };
    }

    if (method === "all" || method === "values") {
      return { rows: stmt.all(...params) as any[] };
    }

    // method === "get" — the proxy contract treats `rows` itself as the
    // single row (an array of column values), not an array of rows.
    return { rows: (stmt.get(...params) as any) ?? undefined };
  },
  { schema },
);
