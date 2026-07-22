import { sqlite } from "../src/db/client";
import { initSchema } from "../src/db/init";
import type { CreateEmployeeInput } from "../src/validation/employee.schema";

export function resetDb() {
  initSchema();
  sqlite.exec("DELETE FROM audit_logs; DELETE FROM salary_records; DELETE FROM employees;");
}

let counter = 0;

export function makeEmployeeInput(overrides: Partial<CreateEmployeeInput> = {}): CreateEmployeeInput {
  counter += 1;
  return {
    firstName: "Test",
    lastName: `Employee${counter}`,
    email: `test.employee${counter}@acme.com`,
    department: "Engineering",
    jobTitle: "Software Engineer",
    country: "US",
    employmentType: "FULL_TIME",
    hireDate: "2023-01-15",
    salary: { amount: 90000, currency: "USD", reason: "Initial salary" },
    ...overrides,
  };
}
