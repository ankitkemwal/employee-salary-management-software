import { sql } from "drizzle-orm";
import { db } from "./client";
import { salaryRecords } from "./schema";

/**
 * A CTE ranking each employee's salary records newest-first (by effective
 * date, then created_at, then id as a final tie-break) so `rn = 1` is
 * always that employee's current salary. Needed because SQLite has no
 * simple "latest row per group" join.
 */
export function currentSalaryCte() {
  return db.$with("current_salary").as(
    db
      .select({
        employeeId: salaryRecords.employeeId,
        amount: salaryRecords.amount,
        currency: salaryRecords.currency,
        effectiveDate: salaryRecords.effectiveDate,
        reason: salaryRecords.reason,
        rn: sql<number>`ROW_NUMBER() OVER (
          PARTITION BY ${salaryRecords.employeeId}
          ORDER BY ${salaryRecords.effectiveDate} DESC, ${salaryRecords.createdAt} DESC, ${salaryRecords.id} DESC
        )`.as("rn"),
      })
      .from(salaryRecords),
  );
}
