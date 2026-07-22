import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, lte, sql, count as countFn, type SQL } from "drizzle-orm";
import { db } from "../db/client";
import { employees, salaryRecords } from "../db/schema";
import { currentSalaryCte } from "../db/queries";
import { writeAuditLog } from "./audit.service";
import { NotFoundError, ConflictError } from "../errors";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ListEmployeesQuery,
} from "../validation/employee.schema";

function isUniqueConstraintError(err: unknown): boolean {
  // Deliberately duck-typed rather than `instanceof Error`: node:sqlite
  // throws errors from a different realm than Jest's VM-sandboxed test
  // context, so `instanceof` silently returns false there even though
  // the error is a real Error with a real .message.
  const message = (err as { message?: unknown } | null | undefined)?.message;
  const causeMessage = (err as { cause?: { message?: unknown } } | null | undefined)?.cause
    ?.message;
  return (
    (typeof message === "string" && message.includes("UNIQUE constraint failed")) ||
    (typeof causeMessage === "string" && causeMessage.includes("UNIQUE constraint failed"))
  );
}

async function nextEmployeeCode(): Promise<string> {
  const row = await db
    .select({ maxCode: sql<string | null>`MAX(${employees.employeeCode})` })
    .from(employees)
    .get();
  const lastNumber = row?.maxCode ? Number(row.maxCode.replace("EMP-", "")) : 0;
  return `EMP-${String(lastNumber + 1).padStart(5, "0")}`;
}

function buildFilterConditions(
  cte: ReturnType<typeof currentSalaryCte>,
  filters: Pick<
    ListEmployeesQuery,
    "search" | "department" | "country" | "employmentType" | "minSalary" | "maxSalary" | "status"
  >,
): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.status !== "ALL") {
    conditions.push(eq(employees.status, filters.status ?? "ACTIVE"));
  }
  if (filters.department) {
    conditions.push(eq(employees.department, filters.department));
  }
  if (filters.country) {
    conditions.push(eq(employees.country, filters.country));
  }
  if (filters.employmentType) {
    conditions.push(eq(employees.employmentType, filters.employmentType));
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(sql`(
      lower(${employees.firstName}) LIKE ${term}
      OR lower(${employees.lastName}) LIKE ${term}
      OR lower(${employees.firstName} || ' ' || ${employees.lastName}) LIKE ${term}
      OR lower(${employees.email}) LIKE ${term}
      OR lower(${employees.employeeCode}) LIKE ${term}
    )`);
  }
  if (filters.minSalary !== undefined) {
    conditions.push(gte(cte.amount, filters.minSalary));
  }
  if (filters.maxSalary !== undefined) {
    conditions.push(lte(cte.amount, filters.maxSalary));
  }

  return conditions.length ? and(...conditions) : undefined;
}

function employeeColumns(cte: ReturnType<typeof currentSalaryCte>) {
  return {
    id: employees.id,
    employeeCode: employees.employeeCode,
    firstName: employees.firstName,
    lastName: employees.lastName,
    email: employees.email,
    department: employees.department,
    jobTitle: employees.jobTitle,
    country: employees.country,
    employmentType: employees.employmentType,
    hireDate: employees.hireDate,
    status: employees.status,
    salaryAmount: cte.amount,
    salaryCurrency: cte.currency,
    salaryEffectiveDate: cte.effectiveDate,
  };
}

export async function listEmployees(query: ListEmployeesQuery) {
  const cte = currentSalaryCte();
  const where = buildFilterConditions(cte, query);

  const [rows, totalRow] = await Promise.all([
    db
      .with(cte)
      .select(employeeColumns(cte))
      .from(employees)
      .leftJoin(cte, and(eq(cte.employeeId, employees.id), eq(cte.rn, 1)))
      .where(where)
      .orderBy(desc(employees.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize)
      .all(),
    db
      .with(cte)
      .select({ total: countFn() })
      .from(employees)
      .leftJoin(cte, and(eq(cte.employeeId, employees.id), eq(cte.rn, 1)))
      .where(where)
      .get(),
  ]);

  return {
    data: rows,
    page: query.page,
    pageSize: query.pageSize,
    total: totalRow?.total ?? 0,
  };
}

export async function exportEmployees(
  filters: Pick<
    ListEmployeesQuery,
    "search" | "department" | "country" | "employmentType" | "minSalary" | "maxSalary" | "status"
  >,
) {
  const cte = currentSalaryCte();
  const where = buildFilterConditions(cte, filters);

  return db
    .with(cte)
    .select(employeeColumns(cte))
    .from(employees)
    .leftJoin(cte, and(eq(cte.employeeId, employees.id), eq(cte.rn, 1)))
    .where(where)
    .orderBy(desc(employees.createdAt))
    .all();
}

export async function getEmployeeById(id: string) {
  const cte = currentSalaryCte();
  const row = await db
    .with(cte)
    .select(employeeColumns(cte))
    .from(employees)
    .leftJoin(cte, and(eq(cte.employeeId, employees.id), eq(cte.rn, 1)))
    .where(eq(employees.id, id))
    .get();

  if (!row) throw new NotFoundError(`Employee ${id} not found`);
  return row;
}

export async function createEmployee(input: CreateEmployeeInput) {
  const id = randomUUID();
  const employeeCode = await nextEmployeeCode();

  try {
    return await db.transaction(async (tx) => {
      await tx.insert(employees).values({
        id,
        employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        department: input.department,
        jobTitle: input.jobTitle,
        country: input.country,
        employmentType: input.employmentType,
        hireDate: input.hireDate,
        status: "ACTIVE",
      });

      const salaryId = randomUUID();
      await tx.insert(salaryRecords).values({
        id: salaryId,
        employeeId: id,
        amount: input.salary.amount,
        currency: input.salary.currency,
        effectiveDate: input.salary.effectiveDate ?? input.hireDate,
        reason: input.salary.reason ?? "Initial salary",
      });

      const created = (await tx.select().from(employees).where(eq(employees.id, id)).get())!;

      await writeAuditLog(tx, {
        tableName: "employees",
        recordId: id,
        action: "INSERT",
        after: created,
      });
      await writeAuditLog(tx, {
        tableName: "salary_records",
        recordId: salaryId,
        action: "INSERT",
        after: { employeeId: id, ...input.salary },
      });

      return created;
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new ConflictError(`An employee with email ${input.email} already exists`);
    }
    throw err;
  }
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput) {
  const existing = await db.select().from(employees).where(eq(employees.id, id)).get();
  if (!existing) throw new NotFoundError(`Employee ${id} not found`);

  const updates: Partial<typeof employees.$inferInsert> = { updatedAt: new Date().toISOString() };
  for (const key of [
    "firstName",
    "lastName",
    "email",
    "department",
    "jobTitle",
    "country",
    "employmentType",
    "hireDate",
    "status",
  ] as const) {
    if (input[key] !== undefined) updates[key] = input[key];
  }

  try {
    return await db.transaction(async (tx) => {
      await tx.update(employees).set(updates).where(eq(employees.id, id));
      const updated = (await tx.select().from(employees).where(eq(employees.id, id)).get())!;

      await writeAuditLog(tx, {
        tableName: "employees",
        recordId: id,
        action: "UPDATE",
        before: existing,
        after: updated,
      });

      return updated;
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new ConflictError(`An employee with email ${input.email} already exists`);
    }
    throw err;
  }
}

export async function softDeleteEmployee(id: string) {
  const existing = await db.select().from(employees).where(eq(employees.id, id)).get();
  if (!existing) throw new NotFoundError(`Employee ${id} not found`);

  await db.transaction(async (tx) => {
    await tx
      .update(employees)
      .set({ status: "INACTIVE", updatedAt: new Date().toISOString() })
      .where(eq(employees.id, id));

    await writeAuditLog(tx, {
      tableName: "employees",
      recordId: id,
      action: "DELETE",
      before: existing,
      after: { ...existing, status: "INACTIVE" },
    });
  });
}
