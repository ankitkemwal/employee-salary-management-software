import { and, eq, sql, count as countFn } from "drizzle-orm";
import { db } from "../db/client";
import { employees } from "../db/schema";
import { currentSalaryCte } from "../db/queries";

export async function getDashboardStats() {
  const cte = currentSalaryCte();

  const [overall, byCurrency, byDepartment, byCountry] = await Promise.all([
    db
      .select({ headcount: countFn() })
      .from(employees)
      .where(eq(employees.status, "ACTIVE"))
      .get(),
    db
      .with(cte)
      .select({
        currency: cte.currency,
        headcount: countFn(),
        totalPayroll: sql<number>`SUM(${cte.amount})`,
        avgSalary: sql<number>`AVG(${cte.amount})`,
      })
      .from(employees)
      .innerJoin(cte, and(eq(cte.employeeId, employees.id), eq(cte.rn, 1)))
      .where(eq(employees.status, "ACTIVE"))
      .groupBy(cte.currency)
      .all(),
    db
      .select({ department: employees.department, headcount: countFn() })
      .from(employees)
      .where(eq(employees.status, "ACTIVE"))
      .groupBy(employees.department)
      .all(),
    db
      .select({ country: employees.country, headcount: countFn() })
      .from(employees)
      .where(eq(employees.status, "ACTIVE"))
      .groupBy(employees.country)
      .all(),
  ]);

  return {
    activeHeadcount: overall?.headcount ?? 0,
    byCurrency,
    byDepartment,
    byCountry,
  };
}
