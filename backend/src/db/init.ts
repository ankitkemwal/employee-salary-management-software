import fs from "node:fs";
import path from "node:path";
import { sqlite } from "./client";

export function initSchema() {
  const ddl = fs.readFileSync(path.join(__dirname, "ddl.sql"), "utf-8");
  sqlite.exec(ddl);
}

if (require.main === module) {
  initSchema();
  console.log("Schema initialized.");
}
