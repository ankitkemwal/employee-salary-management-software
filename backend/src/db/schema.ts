import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const AUDIT_ACTIONS = ["INSERT", "UPDATE", "DELETE"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const employees = sqliteTable(
  "employees",
  {
    id: text("id").primaryKey(),
    employeeCode: text("employee_code").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    department: text("department").notNull(),
    jobTitle: text("job_title").notNull(),
    country: text("country").notNull(),
    employmentType: text("employment_type").notNull(),
    hireDate: text("hire_date").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    uniqueIndex("employees_employee_code_idx").on(table.employeeCode),
    uniqueIndex("employees_email_idx").on(table.email),
    index("employees_department_idx").on(table.department),
    index("employees_country_idx").on(table.country),
    index("employees_status_idx").on(table.status),
  ],
);

export const salaryRecords = sqliteTable(
  "salary_records",
  {
    id: text("id").primaryKey(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id),
    amount: real("amount").notNull(),
    currency: text("currency").notNull(),
    effectiveDate: text("effective_date").notNull(),
    reason: text("reason"),
    createdBy: text("created_by").notNull().default("hr-manager"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    index("salary_records_employee_id_idx").on(table.employeeId),
    index("salary_records_effective_date_idx").on(table.effectiveDate),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    tableName: text("table_name").notNull(),
    recordId: text("record_id").notNull(),
    action: text("action").notNull(),
    actor: text("actor").notNull().default("hr-manager"),
    changedAt: text("changed_at")
      .notNull()
      .default(sql`(current_timestamp)`),
    beforeSnapshot: text("before_snapshot"),
    afterSnapshot: text("after_snapshot"),
  },
  (table) => [
    index("audit_logs_table_record_idx").on(table.tableName, table.recordId),
  ],
);
