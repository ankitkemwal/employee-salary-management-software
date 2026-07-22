import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { employees, salaryRecords } from "../db/schema";
import { writeAuditLog } from "./audit.service";
import { NotFoundError } from "../errors";
import type { CreateSalaryRecordInput } from "../validation/salary.schema";

async function assertEmployeeExists(employeeId: string) {
  const employee = await db.select().from(employees).where(eq(employees.id, employeeId)).get();
  if (!employee) throw new NotFoundError(`Employee ${employeeId} not found`);
}

export async function getSalaryHistory(employeeId: string) {
  await assertEmployeeExists(employeeId);

  return db
    .select()
    .from(salaryRecords)
    .where(eq(salaryRecords.employeeId, employeeId))
    .orderBy(desc(salaryRecords.effectiveDate), desc(salaryRecords.createdAt))
    .all();
}

// Append-only: this always inserts a new row, never touches prior records.
export async function addSalaryRecord(employeeId: string, input: CreateSalaryRecordInput) {
  await assertEmployeeExists(employeeId);

  const id = randomUUID();

  return db.transaction(async (tx) => {
    await tx.insert(salaryRecords).values({
      id,
      employeeId,
      amount: input.amount,
      currency: input.currency,
      effectiveDate: input.effectiveDate,
      reason: input.reason,
    });

    const created = (await tx.select().from(salaryRecords).where(eq(salaryRecords.id, id)).get())!;

    await writeAuditLog(tx, {
      tableName: "salary_records",
      recordId: id,
      action: "INSERT",
      after: created,
    });

    return created;
  });
}
