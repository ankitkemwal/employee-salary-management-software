import { randomUUID } from "node:crypto";
import type { SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import { auditLogs, type AuditAction } from "../db/schema";
import type * as schema from "../db/schema";

export const ACTOR = "hr-manager";

type DbOrTx = Pick<SqliteRemoteDatabase<typeof schema>, "insert">;

export async function writeAuditLog(
  dbOrTx: DbOrTx,
  params: {
    tableName: string;
    recordId: string;
    action: AuditAction;
    before?: unknown;
    after?: unknown;
  },
) {
  await dbOrTx.insert(auditLogs).values({
    id: randomUUID(),
    tableName: params.tableName,
    recordId: params.recordId,
    action: params.action,
    actor: ACTOR,
    beforeSnapshot: params.before !== undefined ? JSON.stringify(params.before) : null,
    afterSnapshot: params.after !== undefined ? JSON.stringify(params.after) : null,
  });
}
